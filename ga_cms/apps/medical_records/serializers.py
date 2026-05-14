from rest_framework import serializers
from .models import ConsultationNote, LabResult, ScanResult, Drug, Prescription, PrescribedMedication

class ConsultationNoteSerializer(serializers.ModelSerializer):
    is_locked = serializers.ReadOnlyField()

    class Meta:
        model = ConsultationNote
        fields = '__all__'
        read_only_fields = ('doctor', 'patient', 'created_at', 'updated_at')

    def update(self, instance, validated_data):
        if instance.is_locked:
            raise serializers.ValidationError("This consultation note is locked and cannot be edited after 24 hours.")
        return super().update(instance, validated_data)


class LabResultSerializer(serializers.ModelSerializer):
    class Meta:
        model = LabResult
        fields = '__all__'
        read_only_fields = ('uploaded_at', 'status')


class ScanResultSerializer(serializers.ModelSerializer):
    class Meta:
        model = ScanResult
        fields = '__all__'
        read_only_fields = ('uploaded_at',)


class DrugSerializer(serializers.ModelSerializer):
    class Meta:
        model = Drug
        fields = '__all__'


class PrescribedMedicationSerializer(serializers.ModelSerializer):
    drug_details = DrugSerializer(source='drug', read_only=True)
    drug_id = serializers.PrimaryKeyRelatedField(queryset=Drug.objects.all(), source='drug', write_only=True)

    class Meta:
        model = PrescribedMedication
        fields = ['id', 'drug_id', 'drug_details', 'dosage', 'frequency', 'duration', 'instructions']


class PrescriptionSerializer(serializers.ModelSerializer):
    medications = PrescribedMedicationSerializer(many=True, required=False)

    class Meta:
        model = Prescription
        fields = ['id', 'appointment', 'patient', 'doctor', 'notes', 'created_at', 'medications']
        read_only_fields = ('doctor', 'patient', 'created_at')

    def create(self, validated_data):
        medications_data = validated_data.pop('medications', [])
        prescription = Prescription.objects.create(**validated_data)
        for med_data in medications_data:
            PrescribedMedication.objects.create(prescription=prescription, **med_data)
        return prescription
    
    def update(self, instance, validated_data):
        medications_data = validated_data.pop('medications', None)
        if medications_data is not None:
            instance.medications.all().delete()
            for med_data in medications_data:
                PrescribedMedication.objects.create(prescription=instance, **med_data)
        
        instance.notes = validated_data.get('notes', instance.notes)
        instance.save()
        return instance
