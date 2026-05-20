from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse
from django.db import connection

def health_check(request):
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        return JsonResponse({"status": "ok", "db": "connected"})
    except Exception:
        return JsonResponse({"status": "error", "db": "unreachable"}, status=503)

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
