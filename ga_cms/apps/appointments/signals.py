from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.db.models import Avg, Sum
from .models import ConsultationReview

@receiver(post_save, sender=ConsultationReview)
@receiver(post_delete, sender=ConsultationReview)
def update_doctor_rating(sender, instance, **kwargs):
    doctor = instance.doctor
    
    # Calculate average rating across all 5 parameters for all reviews of this doctor
    # A review's overall score is the average of its 5 ratings.
    # To get the doctor's average, we average all these overall scores.
    reviews = ConsultationReview.objects.filter(doctor=doctor)
    total_reviews = reviews.count()
    
    if total_reviews > 0:
        # Calculate the sum of all ratings
        aggregate = reviews.aggregate(
            avg_consultation=Avg('consultation_rating'),
            avg_doctor=Avg('doctor_rating'),
            avg_receptionist=Avg('receptionist_rating'),
            avg_technician=Avg('technician_rating'),
            avg_hospital=Avg('hospital_rating')
        )
        
        # Calculate the overall average
        sum_averages = sum(filter(None, [
            aggregate['avg_consultation'],
            aggregate['avg_doctor'],
            aggregate['avg_receptionist'],
            aggregate['avg_technician'],
            aggregate['avg_hospital']
        ]))
        
        # Divide by 5 to get the overall average rating out of 5
        overall_average = sum_averages / 5.0
        
        doctor.average_rating = round(overall_average, 2)
        doctor.total_reviews = total_reviews
    else:
        doctor.average_rating = 0.00
        doctor.total_reviews = 0
        
    doctor.save()
