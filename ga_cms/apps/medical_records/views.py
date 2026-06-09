from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from django.db.models import Q
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import JSONParser, MultiPartParser, FormParser
from .models import ConsultationNote, LabResult, ScanResult, Drug, Prescription, PrescribedMedication, ScanOrder, ChatMessage
from .serializers import (
    ConsultationNoteSerializer, LabResultSerializer, ScanResultSerializer, 
    DrugSerializer, PrescriptionSerializer, ScanOrderSerializer, ChatMessageSerializer
)
from apps.users.models import AuditLog
from apps.users.views import StandardPagination


class IsDoctorOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return hasattr(request.user, 'doctor')

class ConsultationNoteViewSet(viewsets.ModelViewSet):
    serializer_class = ConsultationNoteSerializer
    permission_classes = [permissions.IsAuthenticated, IsDoctorOrReadOnly]

    def get_queryset(self):
        queryset = ConsultationNote.objects.select_related('doctor', 'appointment').all() # PERF: select_related
        patient = self.request.query_params.get('patient')
        if patient:
            queryset = queryset.filter(patient_id=patient)
        return queryset

    def create(self, request, *args, **kwargs):
        try:
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            
            appointment = serializer.validated_data['appointment']
            
            # Check if note exists and update or create
            note, created = ConsultationNote.objects.update_or_create(
                appointment=appointment,
                defaults={
                    'doctor': appointment.doctor,
                    'patient': appointment.patient,
                    'subjective': serializer.validated_data.get('subjective', ''),
                    'objective': serializer.validated_data.get('objective', ''),
                    'assessment': serializer.validated_data.get('assessment', ''),
                    'plan': serializer.validated_data.get('plan', '')
                }
            )
            
            AuditLog.objects.create(
                user=self.request.user,
                action='Created Consultation Note' if created else 'Updated Consultation Note',
                details=f"For Patient: {appointment.patient.full_name}, Appointment: {appointment.id}"
            )
            
            response_serializer = self.get_serializer(note)
            return Response(response_serializer.data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)
        except Exception as e:
            import traceback
            with open('error_log.txt', 'a') as f:
                f.write("500 ERROR IN ConsultationNoteViewSet.create:\n")
                f.write(traceback.format_exc())
                f.write("\n")
            raise e

class LabResultViewSet(viewsets.ModelViewSet):
    serializer_class = LabResultSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = LabResult.objects.all()
        patient = self.request.query_params.get('patient')
        if patient:
            queryset = queryset.filter(patient_id=patient)
        return queryset

    def perform_create(self, serializer):
        serializer.save()
        AuditLog.objects.create(
            user=self.request.user,
            action='Uploaded Lab Result',
            details=f"Test: {serializer.validated_data.get('test_name')} for Patient ID: {serializer.validated_data.get('patient').id}"
        )

class ScanResultViewSet(viewsets.ModelViewSet):
    serializer_class = ScanResultSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = StandardPagination # PERF: Add pagination

    def get_queryset(self):
        queryset = ScanResult.objects.select_related('patient').all().order_by('-uploaded_at') # PERF: select_related
        patient = self.request.query_params.get('patient')
        if patient:
            queryset = queryset.filter(patient_id=patient)
        return queryset

    def perform_create(self, serializer):
        serializer.save()
        AuditLog.objects.create(
            user=self.request.user,
            action='Uploaded Scan Result',
            details=f"Scan: {serializer.validated_data.get('scan_type')} for Patient ID: {serializer.validated_data.get('patient').id}"
        )

    @action(detail=True, methods=['get'])
    def download(self, request, pk=None):
        import os
        from django.http import FileResponse
        
        scan_result = self.get_object()
        if not scan_result.file:
            return Response({"error": "File not found"}, status=status.HTTP_404_NOT_FOUND)
            
        file_path = scan_result.file.path
        if not os.path.exists(file_path):
            return Response({"error": "File does not exist on disk"}, status=status.HTTP_404_NOT_FOUND)
            
        import mimetypes
        content_type, _ = mimetypes.guess_type(file_path)
        if not content_type:
            content_type = 'application/octet-stream'
            
        ext = os.path.splitext(file_path)[1]
        
        response = FileResponse(open(file_path, 'rb'), content_type=content_type)
        response['Content-Disposition'] = f'attachment; filename="scan_report_{scan_result.id}{ext}"'
        return response

    @action(detail=False, methods=['post'])
    def upload(self, request):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            file = serializer.validated_data.get('file')
            if file and (file.name.lower().endswith('.tif') or file.name.lower().endswith('.tiff')):
                from PIL import Image
                import io
                from django.core.files.base import ContentFile
                
                try:
                    img = Image.open(file)
                    if img.mode != 'RGB':
                        img = img.convert('RGB')
                    
                    buffer = io.BytesIO()
                    img.save(buffer, format='JPEG')
                    
                    new_name = file.name.rsplit('.', 1)[0] + '.jpg'
                    serializer.validated_data['file'] = ContentFile(buffer.getvalue(), name=new_name)
                except Exception as e:
                    print(f"Failed to convert TIFF file: {e}")
            
            serializer.save()
            
            # Update matching ScanOrder status to completed
            patient = serializer.validated_data.get('patient')
            scan_type = serializer.validated_data.get('scan_type')
            ScanOrder.objects.filter(patient=patient, scan_type=scan_type, status='pending').update(status='completed')

            AuditLog.objects.create(
                user=self.request.user,
                action='Uploaded Scan Result via API',
                details=f"Scan: {serializer.validated_data.get('scan_type')} for Patient ID: {serializer.validated_data.get('patient').id}"
            )
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ScanOrderViewSet(viewsets.ModelViewSet):
    serializer_class = ScanOrderSerializer
    pagination_class = StandardPagination # PERF: Add pagination

    def get_queryset(self):
        queryset = ScanOrder.objects.select_related('patient', 'doctor').all().order_by('-ordered_at') # PERF: select_related
        status_param = self.request.query_params.get('status')
        patient = self.request.query_params.get('patient')
        
        if status_param:
            queryset = queryset.filter(status=status_param)
        if patient:
            queryset = queryset.filter(patient_id=patient)
            
        return queryset


class ChatMessageViewSet(viewsets.ModelViewSet):
    queryset = ChatMessage.objects.all()
    serializer_class = ChatMessageSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get_queryset(self):
        queryset = ChatMessage.objects.all()
        with_user = self.request.query_params.get('with')
        if with_user:
            user = self.request.user
            queryset = queryset.filter(
                (Q(sender=user, receiver_id=with_user) | 
                 Q(sender_id=with_user, receiver=user))
            ).order_by('sent_at')
        return queryset

    def perform_create(self, serializer):
        sender_id = self.request.data.get('sender')
        if sender_id:
            serializer.save(sender_id=sender_id)
        else:
            serializer.save(sender=self.request.user)

    @action(detail=False, methods=['get'])
    def conversations(self, request):
        from django.utils import timezone
        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        user = request.user
        messages = ChatMessage.objects.filter(Q(sender=user) | Q(receiver=user))
        
        user_ids = set()
        for m in messages:
            if m.sender_id != user.id:
                user_ids.add(m.sender_id)
            if m.receiver_id != user.id:
                user_ids.add(m.receiver_id)
                
        conversations = []
        
        for uid in user_ids:
            try:
                other_user = User.objects.get(id=uid)
            except User.DoesNotExist:
                continue
                
            last_msg = ChatMessage.objects.filter(
                (Q(sender=user, receiver_id=uid) | Q(sender_id=uid, receiver=user))
            ).order_by('-sent_at').first()
            
            unread_count = ChatMessage.objects.filter(
                sender_id=uid, receiver=user, is_read=False
            ).count()
            
            conversations.append({
                'id': uid,
                'name': other_user.get_full_name() or other_user.username,
                'role': other_user.role if hasattr(other_user, 'role') else 'unknown',
                'lastMessage': last_msg.message if last_msg else 'No messages yet',
                'lastTime': last_msg.sent_at.isoformat() if last_msg and last_msg.sent_at else '',
                'unread': unread_count,
                'online': False,
                'last_time_raw': last_msg.sent_at if last_msg else None
            })
            
        conversations.sort(key=lambda x: x['last_time_raw'] or timezone.now(), reverse=True)
        return Response(conversations)

    @action(detail=False, methods=['patch'], url_path='mark-read')
    def mark_read(self, request):
        sender_id = request.data.get('sender_id')
        if sender_id:
            ChatMessage.objects.filter(
                sender_id=sender_id, receiver=request.user, is_read=False
            ).update(is_read=True)
            return Response({'status': 'marked as read'})
        
        # If no sender_id, mark ALL as read
        ChatMessage.objects.filter(
            receiver=request.user, is_read=False
        ).update(is_read=True)
        return Response({'status': 'all marked as read'})

    @action(detail=False, methods=['post'], url_path='upload')
    def upload_attachment(self, request):
        receiver_id = request.data.get('receiver_id')
        message_text = request.data.get('message', '')
        file_obj = request.FILES.get('file')
        
        if not receiver_id or not file_obj:
            return Response({'error': 'receiver_id and file are required'}, status=status.HTTP_400_BAD_REQUEST)
            
        from apps.medical_records.models import BlockedUser
        is_blocked = BlockedUser.objects.filter(
            (Q(blocker=request.user, blocked_id=receiver_id) |
             Q(blocker_id=receiver_id, blocked=request.user))
        ).exists()

        if is_blocked:
            return Response({'error': 'You cannot send messages to this user.'}, status=status.HTTP_403_FORBIDDEN)

        msg = ChatMessage.objects.create(
            sender=request.user,
            receiver_id=receiver_id,
            message=message_text,
            attachment=file_obj
        )
        
        # Broadcast via Channels
        from channels.layers import get_channel_layer
        from asgiref.sync import async_to_sync
        
        channel_layer = get_channel_layer()
        min_id = min(request.user.id, int(receiver_id))
        max_id = max(request.user.id, int(receiver_id))
        room_group_name = f'chat_{min_id}_{max_id}'
        
        async_to_sync(channel_layer.group_send)(
            room_group_name,
            {
                'type': 'chat_message',
                'message': {
                    'id': msg.id,
                    'sender': msg.sender_id,
                    'receiver': msg.receiver_id,
                    'message': msg.message,
                    'attachment_url': msg.attachment.url if msg.attachment else None,
                    'attachment_name': msg.attachment_name or file_obj.name,
                    'sent_at': msg.sent_at.isoformat(),
                    'is_read': msg.is_read
                }
            }
        )
        
        return Response({'status': 'success', 'url': msg.attachment.url})

    @action(detail=False, methods=['post'], url_path='delete-chat')
    def delete_chat(self, request):
        other_user_id = request.data.get('other_user_id')
        if not other_user_id:
            return Response({'error': 'other_user_id required'}, status=status.HTTP_400_BAD_REQUEST)
            
        ChatMessage.objects.filter(
            (Q(sender=request.user, receiver_id=other_user_id) | 
             Q(sender_id=other_user_id, receiver=request.user))
        ).delete()
        
        return Response({'status': 'chat deleted'})

    @action(detail=False, methods=['post'], url_path='clear-history')
    def clear_history(self, request):
        ChatMessage.objects.filter(
            Q(sender=request.user) | Q(receiver=request.user)
        ).delete()
        
        return Response({'status': 'history cleared'})

    @action(detail=False, methods=['post'], url_path='block-user')
    def block_user(self, request):
        other_user_id = request.data.get('other_user_id')
        if not other_user_id:
            return Response({'error': 'other_user_id required'}, status=status.HTTP_400_BAD_REQUEST)
            
        from apps.medical_records.models import BlockedUser
        BlockedUser.objects.get_or_create(blocker=request.user, blocked_id=other_user_id)
        
        return Response({'status': 'user blocked'})

    @action(detail=False, methods=['get'], url_path='unread-count')
    def unread_count(self, request):
        user = request.user
        unread_msgs = ChatMessage.objects.filter(receiver=user, is_read=False).select_related('sender')
        
        by_sender = {}
        total = 0
        for msg in unread_msgs:
            total += 1
            if msg.sender_id not in by_sender:
                by_sender[msg.sender_id] = {
                    'sender_id': msg.sender_id,
                    'sender_name': msg.sender.get_full_name() or msg.sender.username,
                    'count': 0
                }
            by_sender[msg.sender_id]['count'] += 1
            
        return Response({
            "total": total,
            "by_sender": list(by_sender.values())
        })


class DrugViewSet(viewsets.ModelViewSet):
    queryset = Drug.objects.all()
    serializer_class = DrugSerializer
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=['post'])
    def check_interactions(self, request):
        drug_ids = request.data.get('drug_ids', [])
        drugs = Drug.objects.filter(id__in=drug_ids)
        interactions = []
        
        for i, drug1 in enumerate(drugs):
            for drug2 in drugs[i+1:]:
                # simple mock logic: if drug2's name is in drug1's interactions
                if drug2.name in drug1.interactions or drug1.name in drug2.interactions:
                    interactions.append(f"Interaction found between {drug1.name} and {drug2.name}")
        
        return Response({"interactions": interactions}, status=status.HTTP_200_OK)

class PrescriptionViewSet(viewsets.ModelViewSet):
    serializer_class = PrescriptionSerializer
    permission_classes = [permissions.IsAuthenticated, IsDoctorOrReadOnly]

    def get_queryset(self):
        queryset = Prescription.objects.prefetch_related('medications', 'medications__drug').all().order_by('-created_at') # PERF: prefetch_related
        patient = self.request.query_params.get('patient')
        if patient:
            queryset = queryset.filter(patient_id=patient)
        return queryset

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            print("PRESCRIPTION SERIALIZER ERRORS:", serializer.errors)
        serializer.is_valid(raise_exception=True)
        
        appointment = serializer.validated_data['appointment']
        medications_data = serializer.validated_data.pop('medications', [])
        
        # Check if prescription exists and update or create
        prescription, created = Prescription.objects.update_or_create(
            appointment=appointment,
            defaults={
                'doctor': appointment.doctor,
                'patient': appointment.patient,
                'notes': serializer.validated_data.get('notes', ''),
                'follow_up_date': serializer.validated_data.get('follow_up_date', None)
            }
        )
        
        if not created:
            prescription.medications.all().delete()
            
        for med_data in medications_data:
            PrescribedMedication.objects.create(prescription=prescription, **med_data)
            
        # Mark appointment as completed since prescription is generated
        if appointment.status != 'completed':
            appointment.status = 'completed'
            appointment.save(update_fields=['status'])
            
            # Send review email
            from apps.appointments.utils.email_service import send_review_request_email
            import threading
            threading.Thread(target=send_review_request_email, args=(appointment,)).start()

        AuditLog.objects.create(
            user=self.request.user,
            action='Created Prescription' if created else 'Updated Prescription',
            details=f"For Patient: {appointment.patient.full_name}, Appointment: {appointment.id}"
        )
        
        response_serializer = self.get_serializer(prescription)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)

    @action(detail=True, methods=['get'])
    def download(self, request, pk=None):
        import io
        from django.http import FileResponse
        from reportlab.pdfgen import canvas
        from reportlab.lib.pagesizes import letter
        from reportlab.lib import colors
        
        prescription = self.get_object()
        
        buffer = io.BytesIO()
        c = canvas.Canvas(buffer, pagesize=letter)
        
        # Header
        c.setFont("Helvetica-Bold", 24)
        c.setFillColorRGB(0.12, 0.23, 0.54) # Navy blue
        c.drawString(50, 750, "GA Clinic")
        
        c.setFont("Helvetica", 10)
        c.setFillColorRGB(0.4, 0.4, 0.4)
        c.drawString(50, 735, "123 Medical Center Blvd, Healthcare City")
        c.drawString(50, 720, "Phone: +1 234 567 8900 | Web: www.gaclinic.com")
        
        # Prescription Title
        c.setFont("Helvetica-Bold", 16)
        c.setFillColorRGB(0, 0, 0)
        c.drawString(50, 680, f"Prescription #{prescription.id}")
        
        # Details
        c.setFont("Helvetica", 12)
        c.drawString(50, 650, f"Date: {prescription.created_at.strftime('%d %B %Y')}")
        c.drawString(50, 630, f"Doctor: {prescription.doctor.user.get_full_name() if prescription.doctor.user.get_full_name() else prescription.doctor.user.username}")
        c.drawString(50, 610, f"Patient: {prescription.patient.full_name} ({prescription.patient.patient_id})")
        
        # Divider
        c.setStrokeColorRGB(0.8, 0.8, 0.8)
        c.line(50, 590, 550, 590)
        
        # Medications
        c.setFont("Helvetica-Bold", 14)
        c.drawString(50, 560, "Rx / Medications")
        
        y_pos = 530
        c.setFont("Helvetica", 11)
        for med in prescription.medications.all():
            drug_name = med.drug.name if med.drug else med.drug_id
            c.setFont("Helvetica-Bold", 11)
            c.drawString(50, y_pos, f"• {drug_name}")
            c.setFont("Helvetica", 10)
            c.drawString(70, y_pos - 15, f"Dosage: {med.dosage} | Frequency: {med.frequency} | Duration: {med.duration}")
            c.drawString(70, y_pos - 30, f"Instructions: {med.instructions}")
            y_pos -= 50
            
            if y_pos < 100:
                c.showPage()
                y_pos = 750
                
        # Notes
        if prescription.notes:
            y_pos -= 20
            c.setFont("Helvetica-Bold", 12)
            c.drawString(50, y_pos, "Clinical Notes:")
            y_pos -= 20
            c.setFont("Helvetica", 10)
            
            # Simple text wrap
            from textwrap import wrap
            wrapped_notes = wrap(prescription.notes, width=90)
            for line in wrapped_notes:
                c.drawString(50, y_pos, line)
                y_pos -= 15
                if y_pos < 100:
                    c.showPage()
                    y_pos = 750
        
        # Follow up
        if prescription.follow_up_date:
            y_pos -= 20
            c.setFont("Helvetica-Bold", 11)
            c.drawString(50, y_pos, f"Follow-up Date: {prescription.follow_up_date.strftime('%d %B %Y')}")
            
        c.save()
        buffer.seek(0)
        
        response = FileResponse(buffer, as_attachment=True, filename=f'prescription_{prescription.id}.pdf')
        return response


class DrugSearchView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        query = request.query_params.get('q', '')
        if not query:
            return Response([])
            
        limit = int(request.query_params.get('limit', 10))
        page = int(request.query_params.get('page', 1))

        start = (page - 1) * limit
        end = start + limit

        # Prefix/contains match on drug_name (name)
        drugs = Drug.objects.filter(name__icontains=query)[start:end]

        results = []
        for drug in drugs:
            results.append({
                'id': drug.id,
                'drug_name': drug.name,
                'use_case': drug.use_case,
                'side_effects': drug.side_effects,
                'substitutes': drug.substitutes,
                'dosage_form': drug.dosage_form
            })
            
        return Response(results)

