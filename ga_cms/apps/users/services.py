import logging
from django.conf import settings
import os
from .models import AuditLog

# Configure logger for security events
logger = logging.getLogger('security_audit')
logger.setLevel(logging.INFO)

# File handler for redundancy
log_file_path = os.path.join(settings.BASE_DIR, 'security_audit.log')
file_handler = logging.FileHandler(log_file_path)
file_handler.setFormatter(logging.Formatter('%(asctime)s - %(levelname)s - %(message)s'))
logger.addHandler(file_handler)

def get_client_ip(request):
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip

def log_security_event(user, action, request=None, details=''):
    """
    Logs a security event to both the AuditLog database model and the security_audit.log file.
    """
    ip_address = get_client_ip(request) if request else None

    # Write to File
    user_str = user.username if user and not user.is_anonymous else 'Anonymous'
    log_message = f"User: {user_str} | Action: {action} | IP: {ip_address} | Details: {details}"
    logger.info(log_message)

    # Write to Database
    try:
        AuditLog.objects.create(
            user=user if user and not user.is_anonymous else None,
            action=action,
            ip_address=ip_address,
            details=details
        )
    except Exception as e:
        logger.error(f"Failed to write audit log to database: {str(e)}")
