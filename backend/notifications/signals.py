from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from django.utils import timezone
from django.contrib.auth import get_user_model
from django.urls import reverse
from django.contrib.contenttypes.models import ContentType

from tasks.models import Task
from sales.models import Sale
from customers.models import Customer
from .services import NotificationService
from .models import Notification

User = get_user_model()

# Task signals
@receiver(post_save, sender=Task)
def task_notification(sender, instance, created, **kwargs):
    """Create notification when a task is created or updated"""
    if created:
        # New task notification for assignee
        if instance.assigned_to:
            NotificationService.create_notification(
                recipient=instance.assigned_to,
                title="New Task Assigned",
                message=f"You have been assigned a new task: {instance.title}",
                category_name="task",
                priority="medium",
                related_object=instance,
                action_url=f"/tasks/{instance.id}",
                icon="Task",
                color="#4caf50"
            )
    else:
        # Remove old deadline notifications if status changed to completed or overdue
        if instance.status in ['C', 'O']:
            task_content_type = ContentType.objects.get_for_model(Task)
            Notification.objects.filter(
                content_type=task_content_type,
                object_id=instance.id,
                title__startswith='Task Due'  # Only remove deadline notifications
            ).delete()
        
        # Check if status changed to completed
        if instance.status == 'C':  # Completed status is 'C'
            # Notify task creator
            if hasattr(instance, 'created_by') and instance.created_by:
                NotificationService.create_notification(
                    recipient=instance.created_by,
                    title="Task Completed",
                    message=f"Task '{instance.title}' has been marked as completed",
                    category_name="task",
                    priority="medium",
                    related_object=instance,
                    action_url=f"/tasks/{instance.id}",
                    icon="Task",
                    color="#4caf50"
                )
        
        # Due date approaching (within 24 hours) - handled now by management command
        # This is kept for backwards compatibility but will be phased out
        if (instance.due_date and 
            instance.status != 'C'):  # Not completed
            
            time_until_due = instance.due_date - timezone.now().date()
            if time_until_due.days >= 0 and time_until_due.days < 1:  # Less than 24 hours
                if instance.assigned_to:
                    # First remove any existing due notifications
                    task_content_type = ContentType.objects.get_for_model(Task)
                    Notification.objects.filter(
                        content_type=task_content_type,
                        object_id=instance.id,
                        title__startswith='Task Due'  # Only remove deadline notifications
                    ).delete()
                    
                    # Create new notification
                    NotificationService.create_notification(
                        recipient=instance.assigned_to,
                        title="Task Due Today",
                        message=f"Task '{instance.title}' is due today",
                        category_name="task",
                        priority="high",
                        related_object=instance,
                        action_url=f"/tasks/{instance.id}",
                        icon="Task",
                        color="#f44336"
                    )

# Sale signals
@receiver(post_save, sender=Sale)
def sale_notification(sender, instance, created, **kwargs):
    """Create notification when a sale is created or updated"""
    if created:
        # New sale notification for assigned sales rep
        if instance.assigned_to:
            NotificationService.create_notification(
                recipient=instance.assigned_to,
                title="New Sales Opportunity",
                message=f"A new sales opportunity has been created for {instance.customer.name}",
                category_name="sale",
                priority="medium",
                related_object=instance,
                action_url=f"/sales/{instance.id}",
                icon="AttachMoney",
                color="#ff9800"
            )
    else:
        # Sale status changed to won
        if instance.status == 'WON' and instance.status != getattr(instance, '_original_status', None):
            # Notify manager
            managers = User.objects.filter(role='MANAGER')
            for manager in managers:
                NotificationService.create_notification(
                    recipient=manager,
                    title="Sale Won!",
                    message=f"{instance.assigned_to.get_full_name() or instance.assigned_to.username} has closed a deal with {instance.customer.name} worth ${instance.amount}",
                    category_name="sale",
                    priority="high",
                    related_object=instance,
                    action_url=f"/sales/{instance.id}",
                    icon="AttachMoney",
                    color="#4caf50"
                )

@receiver(pre_save, sender=Sale)
def store_original_sale_status(sender, instance, **kwargs):
    """Store the original status before save to detect changes"""
    if instance.id:
        try:
            original = Sale.objects.get(id=instance.id)
            instance._original_status = original.status
        except Sale.DoesNotExist:
            pass

# Customer signals
@receiver(post_save, sender=Customer)
def customer_notification(sender, instance, created, **kwargs):
    """Create notification when a customer is created"""
    if created:
        # Notify sales managers about new customers
        managers = User.objects.filter(role='MANAGER')
        for manager in managers:
            NotificationService.create_notification(
                recipient=manager,
                title="New Customer Added",
                message=f"A new customer has been added: {instance.name}",
                category_name="customer",
                priority="medium",
                related_object=instance,
                action_url=f"/customers/{instance.id}",
                icon="People",
                color="#2196f3"
            ) 