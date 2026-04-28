from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AppointmentViewSet, SlotAvailabilityView

router = DefaultRouter()
router.register(r'appointments', AppointmentViewSet, basename='appointment')

urlpatterns = [
    path('slots/', SlotAvailabilityView.as_view(), name='slot-availability'),
    path('', include(router.urls)),
]
