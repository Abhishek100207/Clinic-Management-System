from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include('apps.auth_module.urls')),
    path('api/users/', include('apps.users.urls')),
    path('api/appointments/', include('apps.appointments.urls')),
]
