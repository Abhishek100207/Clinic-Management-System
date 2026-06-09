from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse
from django.db import connection

def health_check(request):
    return JsonResponse({"status": "ok", "db": "bypassed"})

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include('apps.auth_module.urls')),
    path('api/users/', include('apps.users.urls')),
    path('api/appointments/', include('apps.appointments.urls')),
    path('api/medical_records/', include('apps.medical_records.urls')),
    path('api/chat/', include('apps.medical_records.chat_urls')),
    path('api/health/', health_check),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
