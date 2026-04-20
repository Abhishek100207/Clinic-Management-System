from django.urls import path
from .views import (
    GoogleLoginView,
    LoginRequestOtpView, LoginVerifyOtpView,
    RegisterRequestOtpView, RegisterVerifyOtpView,
    MeView, LogoutView, CookieTokenRefreshView,
)

urlpatterns = [
    # Google OAuth
    path('auth/google/',          GoogleLoginView.as_view(),         name='auth_google'),

    # Sign In with OTP
    path('auth/login/request-otp/', LoginRequestOtpView.as_view(),  name='auth_login_request_otp'),
    path('auth/login/verify-otp/',  LoginVerifyOtpView.as_view(),   name='auth_login_verify_otp'),

    # Sign Up with OTP
    path('auth/register/request-otp/', RegisterRequestOtpView.as_view(), name='auth_register_request_otp'),
    path('auth/register/verify-otp/',  RegisterVerifyOtpView.as_view(),  name='auth_register_verify_otp'),

    # Shared
    path('auth/me/',              MeView.as_view(),                  name='auth_me'),
    path('auth/logout/',          LogoutView.as_view(),              name='auth_logout'),
    path('auth/refresh/',         CookieTokenRefreshView.as_view(),  name='auth_refresh'),
]
