from django.conf import settings
from django.contrib.contenttypes.models import ContentType
from django.core.mail import send_mail
from django.template.loader import render_to_string
from .models import Notification, NotificationCategory, NotificationPreference

class NotificationService:
    """
    Service for creating and sending notifications
    """
    
    @staticmethod
    def get_or_create_category(name, description=None, icon=None, color=None):
        """
        Get or create a notification category
        """
        category, created = NotificationCategory.objects.get_or_create(
            name=name,
            defaults={
                'description': description,
                'icon': icon,
                'color': color
            }
        )
        return category
    
    @staticmethod
    def create_notification(
        recipient, title, message, category_name,
        priority='medium', related_object=None, action_url=None,
        icon=None, color=None
    ):
        """
        Create a notification and optionally send email
        
        Args:
            recipient: User to receive the notification
            title: Notification title
            message: Notification message
            category_name: Category name (will be created if it doesn't exist)
            priority: Priority level (low, medium, high)
            related_object: Related model instance
            action_url: URL to redirect to when notification is clicked
            icon: Icon for the category (if category doesn't exist)
            color: Color for the category (if category doesn't exist)
        """
        # Get or create category
        category = NotificationService.get_or_create_category(
            name=category_name,
            icon=icon,
            color=color
        )
        
        # Check user preferences
        try:
            preferences = NotificationPreference.objects.get(user=recipient)
            
            # Skip if user has disabled this category
            if category_name == 'task' and not preferences.task_notifications:
                return None
            elif category_name == 'sale' and not preferences.sales_notifications:
                return None
            elif category_name == 'customer' and not preferences.customer_notifications:
                return None
            elif category_name == 'system' and not preferences.system_notifications:
                return None
                
            # Check priority preferences
            priority_levels = {'low': 0, 'medium': 1, 'high': 2}
            if priority_levels.get(priority, 1) < priority_levels.get(preferences.minimum_priority, 0):
                return None
        except NotificationPreference.DoesNotExist:
            # If no preferences exist, create with defaults
            preferences = NotificationPreference.objects.create(user=recipient)
        
        # Create notification if in-app notifications are enabled
        notification = None
        if preferences.in_app_notifications:
            notification = Notification(
                recipient=recipient,
                category=category,
                title=title,
                message=message,
                priority=priority,
                action_url=action_url
            )
            
            # Add related object if provided
            if related_object:
                content_type = ContentType.objects.get_for_model(related_object)
                notification.content_type = content_type
                notification.object_id = related_object.id
                
            notification.save()
        
        # Send email if email notifications are enabled
        if preferences.email_notifications:
            NotificationService.send_email_notification(
                recipient, title, message, category_name, priority
            )
            
        return notification
    
    @staticmethod
    def send_email_notification(recipient, title, message, category, priority):
        """
        Send an email notification
        """
        try:
            subject = f"CRM Notification: {title}"
            from_email = settings.DEFAULT_FROM_EMAIL
            to_email = recipient.email
            
            # Simple email for now
            # In a production app, this would use an HTML template
            email_message = f"Priority: {priority.upper()}\nCategory: {category}\n\n{message}"
            
            send_mail(
                subject,
                email_message,
                from_email,
                [to_email],
                fail_silently=False
            )
            
            return True
        except Exception as e:
            print(f"Error sending email: {str(e)}")
            return False 