from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from decouple import config
from google.oauth2 import id_token
from google.auth.transport import requests
from django.contrib.auth import get_user_model
from .serializers import UserSerializer

User = get_user_model()
GOOGLE_CLIENT_ID = config('GOOGLE_CLIENT_ID', default='your-google-client-id.apps.googleusercontent.com')

def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }

class GoogleLoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        token = request.data.get('id_token')
        if not token:
            return Response({'error': 'No id_token provided'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Verify the token with Google
            idinfo = id_token.verify_oauth2_token(token, requests.Request(), GOOGLE_CLIENT_ID)
            email = idinfo.get('email')
            if not email:
                return Response({'error': 'Invalid token, no email found'}, status=status.HTTP_400_BAD_REQUEST)

            # Check if user exists (using filter + first to avoid MultipleObjectsReturned crash if you created duplicates)
            user = User.objects.filter(email__iexact=email).first()
            if not user:
                return Response({'error': 'Account not found. Contact your administrator.'}, status=status.HTTP_403_FORBIDDEN)


            # Update Google ID or Avatar if necessary
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
            user_data = UserSerializer(user).data
            
            response = Response({
                'access': tokens['access'],
                'user': user_data
            }, status=status.HTTP_200_OK)
            
            # Set refresh token in httpOnly cookie
            response.set_cookie(
                key='refresh_token',
                value=tokens['refresh'],
                httponly=True,
                secure=config('SECURE_COOKIES', default=False, cast=bool),
                samesite='Strict'
            )
            return response

        except ValueError as e:
            return Response({'error': f'Invalid token: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)


class LogoutView(APIView):
    permission_classes = [AllowAny] # Should be able to clear cookie even if access token is dead

    def post(self, request):
        try:
            refresh_token = request.COOKIES.get('refresh_token')
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
            response = Response({'detail': 'Successfully logged out.'}, status=status.HTTP_200_OK)
            response.delete_cookie('refresh_token')
            return response
        except Exception as e:
            response = Response({'detail': 'Successfully logged out.'}, status=status.HTTP_200_OK)
            response.delete_cookie('refresh_token')
            return response


class CookieTokenRefreshView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        refresh_token = request.COOKIES.get('refresh_token')
        if not refresh_token:
            return Response({'error': 'Refresh token not provided in cookie'}, status=status.HTTP_401_UNAUTHORIZED)
        
        try:
            token = RefreshToken(refresh_token)
            data = {'access': str(token.access_token)}
            return Response(data, status=status.HTTP_200_OK)
        except InvalidToken:
            return Response({'error': 'Refresh token is invalid or expired'}, status=status.HTTP_401_UNAUTHORIZED)
