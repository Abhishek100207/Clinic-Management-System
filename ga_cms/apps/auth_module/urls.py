from django.urls import path
from .views import GoogleLoginView, MeView, LogoutView, CookieTokenRefreshView

urlpatterns = [
    path('auth/google/', GoogleLoginView.as_view(), name='auth_google'),
    path('auth/me/', MeView.as_view(), name='auth_me'),
    path('auth/logout/', LogoutView.as_view(), name='auth_logout'),
    path('auth/refresh/', CookieTokenRefreshView.as_view(), name='auth_refresh'),
]
