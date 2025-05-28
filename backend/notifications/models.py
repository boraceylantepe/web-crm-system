from django.db import models
from django.conf import settings
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType

class NotificationCategory(models.Model):
    """
    Categories for notifications (e.g., task, sale, customer, system)
    """
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    icon = models.CharField(max_length=50, blank=True, null=True)
    color = models.CharField(max_length=20, blank=True, null=True)
    
    def __str__(self):
        return self.name
    
    class Meta:
        verbose_name_plural = "Notification Categories"

class Notification(models.Model):
    """
    Notification model to store user notifications
    """
    PRIORITY_CHOICES = (
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
    )
    
    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='notifications'
    )
    category = models.ForeignKey(
        NotificationCategory, 
        on_delete=models.SET_NULL, 
        null=True, 
        related_name='notifications'
    )
    title = models.CharField(max_length=255)
    message = models.TextField()
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='medium')
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    # Generic relation to link notification to any model
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE, null=True, blank=True)
    object_id = models.PositiveIntegerField(null=True, blank=True)
    related_object = GenericForeignKey('content_type', 'object_id')
    
    # URL to navigate to when clicked
    action_url = models.CharField(max_length=255, blank=True, null=True)
    
    def __str__(self):
        return f"{self.title} - {self.recipient.username}"
    
    class Meta:
        ordering = ['-created_at']

class NotificationPreference(models.Model):
    """
    User preferences for notification delivery
    """
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='notification_preferences'
    )
    email_notifications = models.BooleanField(default=True)
    in_app_notifications = models.BooleanField(default=True)
    
    # Preferences by category
    task_notifications = models.BooleanField(default=True)
    sales_notifications = models.BooleanField(default=True)
    customer_notifications = models.BooleanField(default=True)
    system_notifications = models.BooleanField(default=True)
    
    # Minimum priority to notify
    minimum_priority = models.CharField(
        max_length=10, 
        choices=Notification.PRIORITY_CHOICES, 
        default='low'
    )
    
    def __str__(self):
        return f"Notification Preferences - {self.user.username}"
