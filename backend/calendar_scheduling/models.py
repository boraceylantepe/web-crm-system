from django.db import models
from django.conf import settings
# Ensure necessary imports for Customer and Sale, if they are not already part of standard Django or defined elsewhere
# from customers.models import Customer # Assuming Customer model is in customers app
# from sales.models import Sale # Assuming Sale model is in sales app

class CalendarEvent(models.Model):
    """
    Calendar event model for scheduling.
    """
    EVENT_TYPE_CHOICES = [
        ('MEETING', 'Meeting'),
        ('CALL', 'Call'),
        ('DEADLINE', 'Deadline'),
        ('REVIEW', 'Review'),
        ('OTHER', 'Other'),
    ]
    
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='events')
    customer = models.ForeignKey('customers.Customer', on_delete=models.CASCADE, related_name='events', null=True, blank=True)
    sale = models.ForeignKey('sales.Sale', on_delete=models.CASCADE, related_name='events', null=True, blank=True)
    is_all_day = models.BooleanField(default=False)
    participants = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='participating_events', blank=True)
    event_type = models.CharField(max_length=10, choices=EVENT_TYPE_CHOICES, default='MEETING')
    location = models.CharField(max_length=255, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return self.title
