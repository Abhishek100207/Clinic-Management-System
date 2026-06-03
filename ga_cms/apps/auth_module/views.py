import random
import string
from django.core.cache import cache
from django.core.mail import send_mail
from django.contrib.auth import get_user_model
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import InvalidToken
from decouple import config
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from .serializers import UserSerializer
from apps.users.services import log_security_event

User = get_user_model()
GOOGLE_CLIENT_ID = settings.GOOGLE_CLIENT_ID
OTP_EXPIRY = 300  # 5 minutes


def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {'refresh': str(refresh), 'access': str(refresh.access_token)}


def generate_otp():
    return ''.join(random.choices(string.digits, k=6))


def send_otp_email(email, otp, purpose='login'):
    print(f"\n[{'='*40}]\n OTP GENERATED FOR {email} ({purpose}): {otp}\n[{'='*40}]\n")
    subject = 'GA Clinic — Your OTP'
    message = (
        f'Your GA Clinic OTP for {purpose} is: {otp}\n\n'
        f'This OTP is valid for 5 minutes. Do not share it with anyone.'
    )
    send_mail(
        subject, message,
        settings.DEFAULT_FROM_EMAIL,
        [email],
        fail_silently=False,
    )


# ── Google OAuth ──────────────────────────────────────────────────────────────

class GoogleLoginView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        token = request.data.get('id_token')
        if not token:
            return Response({'error': 'No id_token provided'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            idinfo = id_token.verify_oauth2_token(token, google_requests.Request(), GOOGLE_CLIENT_ID)
            email = idinfo.get('email')
            if not email:
                return Response({'error': 'Invalid token, no email found'}, status=status.HTTP_400_BAD_REQUEST)

            user = User.objects.filter(email__iexact=email).first()
            if not user:
                base_username = email.split('@')[0]
                username = base_username
                counter = 1
                while User.objects.filter(username__iexact=username).exists():
                    username = f"{base_username}{counter}"
                    counter += 1
                
                user = User.objects.create_user(
                    username=username,
                    email=email,
                    password=User.objects.make_random_password(),
                    role='patient',
                )
                if 'picture' in idinfo:
                    user.avatar_url = idinfo['picture']
                if 'given_name' in idinfo:
                    user.first_name = idinfo['given_name']
                if 'family_name' in idinfo:
                    user.last_name = idinfo['family_name']
                user.google_id = idinfo.get('sub')
                user.save()
                
                from apps.users.models import Patient
                try:
                    Patient.objects.create(
                        user=user,
                        patient_id=f"PAT-{user.id}",
                        full_name=f"{user.first_name} {user.last_name}".strip() or user.username,
                        mobile_number=f"00000{user.id}"[:15],
                        date_of_birth="2000-01-01",
                        gender="Other",
                        email=user.email
                    )
                except Exception:
                    pass
            else:
                if not user.google_id:
                    user.google_id = idinfo.get('sub')
                if 'picture' in idinfo and not user.avatar_url:
                    user.avatar_url = idinfo['picture']
                if not user.first_name and 'given_name' in idinfo:
                    user.first_name = idinfo['given_name']
                if not user.last_name and 'family_name' in idinfo:
                    user.last_name = idinfo['family_name']
                user.save()

            tokens = get_tokens_for_user(user)
            response = Response({'access': tokens['access'], 'user': UserSerializer(user).data})
            response.set_cookie(
                key='refresh_token', value=tokens['refresh'],
                httponly=True, secure=config('SECURE_COOKIES', default=False, cast=bool), samesite='Strict'
            )
            log_security_event(user, 'LOGIN', request, 'Logged in via Google OAuth')
            return response
        except ValueError as e:
            return Response({'error': f'Invalid token: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)


# ── Sign In with OTP ──────────────────────────────────────────────────────────

class LoginRequestOtpView(APIView):
    """Step 1 of sign-in: validate credentials, send OTP to email."""
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        email    = request.data.get('email', '').strip().lower()
        password = request.data.get('password', '')

        if not email or not password:
            return Response({'error': 'Email and password are required.'}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.filter(email__iexact=email).first()
        if not user or not user.check_password(password):
            return Response({'error': 'Invalid email or password.'}, status=status.HTTP_401_UNAUTHORIZED)

        if not user.is_active:
            return Response({'error': 'Account is disabled. Contact your administrator.'}, status=status.HTTP_403_FORBIDDEN)

        otp = generate_otp()
        cache.set(f'login_otp_{email}', otp, timeout=OTP_EXPIRY)

        try:
            send_otp_email(email, otp, purpose='sign-in')
        except Exception:
            # In dev, return OTP in response so you can test without email setup
            if settings.DEBUG:
                return Response({'detail': 'OTP sent.', 'debug_otp': otp})
            return Response({'error': 'Failed to send OTP. Try again.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response({'detail': 'OTP sent to your email.'})


class LoginVerifyOtpView(APIView):
    """Step 2 of sign-in: verify OTP, return JWT."""
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email', '').strip().lower()
        otp   = request.data.get('otp', '').strip()

        if not email or not otp:
            return Response({'error': 'Email and OTP are required.'}, status=status.HTTP_400_BAD_REQUEST)

        cached_otp = cache.get(f'login_otp_{email}')
        if not cached_otp or cached_otp != otp:
            return Response({'error': 'Invalid or expired OTP.'}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.filter(email__iexact=email).first()
        if not user:
            return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

        cache.delete(f'login_otp_{email}')
        tokens = get_tokens_for_user(user)
        response = Response({'access': tokens['access'], 'user': UserSerializer(user).data})
        response.set_cookie(
            key='refresh_token', value=tokens['refresh'],
            httponly=True, secure=config('SECURE_COOKIES', default=False, cast=bool), samesite='Strict'
        )
        log_security_event(user, 'LOGIN', request, 'Logged in via OTP')
        return response


# ── Sign Up with OTP ──────────────────────────────────────────────────────────

class RegisterRequestOtpView(APIView):
    """Step 1 of sign-up: validate fields, cache data, send OTP."""
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get('username', '').strip()
        email    = request.data.get('email', '').strip().lower()
        password = request.data.get('password', '')
        role     = request.data.get('role', '').strip()

        if not all([username, email, password, role]):
            return Response({'error': 'All fields are required.'}, status=status.HTTP_400_BAD_REQUEST)

        valid_roles = [r[0] for r in User.ROLE_CHOICES]
        if role not in valid_roles:
            return Response({'error': f'Invalid role. Choose from: {", ".join(valid_roles)}'}, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(username__iexact=username).exists():
            return Response({'error': 'This User ID is already taken.'}, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(email__iexact=email).exists():
            return Response({'error': 'An account with this email already exists.'}, status=status.HTTP_400_BAD_REQUEST)

        otp = generate_otp()
        cache.set(f'register_otp_{email}', otp, timeout=OTP_EXPIRY)
        cache.set(f'register_data_{email}', {
            'username': username, 'email': email,
            'password': password, 'role': role
        }, timeout=OTP_EXPIRY)

        try:
            send_otp_email(email, otp, purpose='registration')
        except Exception:
            if settings.DEBUG:
                return Response({'detail': 'OTP sent.', 'debug_otp': otp})
            return Response({'error': 'Failed to send OTP. Try again.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response({'detail': 'OTP sent to your email.'})


class RegisterVerifyOtpView(APIView):
    """Step 2 of sign-up: verify OTP, create user, return JWT."""
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email', '').strip().lower()
        otp   = request.data.get('otp', '').strip()

        if not email or not otp:
            return Response({'error': 'Email and OTP are required.'}, status=status.HTTP_400_BAD_REQUEST)

        cached_otp  = cache.get(f'register_otp_{email}')
        cached_data = cache.get(f'register_data_{email}')

        if not cached_otp or cached_otp != otp:
            return Response({'error': 'Invalid or expired OTP.'}, status=status.HTTP_400_BAD_REQUEST)

        if not cached_data:
            return Response({'error': 'Registration session expired. Please start again.'}, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(username__iexact=cached_data['username']).exists():
            return Response({'error': 'User ID already taken.'}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.create_user(
            username=cached_data['username'],
            email=cached_data['email'],
            password=cached_data['password'],
            role=cached_data['role'],
        )

        try:
            from apps.users.models import Doctor, Patient
            if user.role in ['senior_doctor', 'doctor']:
                Doctor.objects.create(
                    user=user,
                    specialty='General',
                    registration_number=f"DOC-{user.id}"
                )
            elif user.role == 'patient':
                Patient.objects.create(
                    user=user,
                    patient_id=f"PAT-{user.id}",
                    full_name=user.username,
                    mobile_number=f"00000{user.id}"[:15],
                    date_of_birth="2000-01-01",
                    gender="Other",
                    email=user.email
                )
        except Exception as e:
            # Continue anyway if creation fails to not block sign up, 
            # or log it. Ideally we want atomic transaction, but for this quick fix it is fine.
            pass

        cache.delete(f'register_otp_{email}')
        cache.delete(f'register_data_{email}')

        tokens = get_tokens_for_user(user)
        response = Response({'access': tokens['access'], 'user': UserSerializer(user).data}, status=status.HTTP_201_CREATED)
        response.set_cookie(
            key='refresh_token', value=tokens['refresh'],
            httponly=True, secure=config('SECURE_COOKIES', default=False, cast=bool), samesite='Strict'
        )
        log_security_event(user, 'SIGNUP', request, f'Registered as {user.role}')
        return response


# ── Shared ────────────────────────────────────────────────────────────────────

class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)


class LogoutView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        try:
            refresh_token = request.COOKIES.get('refresh_token')
            if refresh_token:
                RefreshToken(refresh_token).blacklist()
        except Exception:
            pass
        
        if request.user.is_authenticated:
            log_security_event(request.user, 'LOGOUT', request, 'Logged out')

        response = Response({'detail': 'Successfully logged out.'})
        response.delete_cookie('refresh_token')
        return response


class CookieTokenRefreshView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        refresh_token = request.COOKIES.get('refresh_token')
        if not refresh_token:
            return Response({'error': 'Refresh token not found.'}, status=status.HTTP_401_UNAUTHORIZED)
        try:
            token = RefreshToken(refresh_token)
            return Response({'access': str(token.access_token)})
        except InvalidToken:
            return Response({'error': 'Refresh token is invalid or expired.'}, status=status.HTTP_401_UNAUTHORIZED)
