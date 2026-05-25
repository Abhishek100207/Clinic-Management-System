from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AppointmentViewSet, SlotAvailabilityView, InvoiceViewSet, ReviewCreateAPIView, ReviewListAPIView

router = DefaultRouter()
router.register(r'appointments', AppointmentViewSet, basename='appointment')
router.register(r'invoices', InvoiceViewSet, basename='invoice')

urlpatterns = [
    path('slots/', SlotAvailabilityView.as_view(), name='slot-availability'),
    path('reviews/', ReviewCreateAPIView.as_view(), name='review-create'),
    path('reviews/list/', ReviewListAPIView.as_view(), name='review-list'),
    path('', include(router.urls)),
]
