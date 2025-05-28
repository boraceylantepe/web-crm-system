import datetime
from django.core.management.base import BaseCommand
from django.utils import timezone
from django.db.models import Q
from tasks.models import Task
from notifications.models import Notification
from notifications.services import NotificationService
from django.contrib.contenttypes.models import ContentType

class Command(BaseCommand):
    help = 'Checks for upcoming task deadlines and sends notifications'

    def handle(self, *args, **options):
        self.stdout.write('Checking for upcoming task deadlines...')
        
        # Get current time
        now = timezone.now()
        today = now.date()
        
        # Only check tasks that are not completed or already overdue
        active_tasks = Task.objects.filter(
            ~Q(status='C') & ~Q(status='O'),  # Not completed or already overdue
            due_date__gte=today  # Due date is today or in the future
        )
        
        self.stdout.write(f'Found {active_tasks.count()} active tasks to check')
        task_content_type = ContentType.objects.get_for_model(Task)
        
        # Define notification timeframes in hours
        timeframes = [
            {'hours': 24, 'title': 'Task Due Tomorrow', 'message': 'is due tomorrow', 'priority': 'medium'},
            {'hours': 12, 'title': 'Task Due Soon', 'message': 'is due in 12 hours', 'priority': 'medium'},
            {'hours': 3, 'title': 'Task Due Very Soon', 'message': 'is due in 3 hours', 'priority': 'high'},
            {'hours': 1, 'title': 'Task Due Shortly', 'message': 'is due in 1 hour', 'priority': 'high'},
        ]
        
        notifications_created = 0
        notifications_removed = 0
        
        for task in active_tasks:
            # Skip tasks without due date
            if not task.due_date:
                continue
                
            # Convert date to datetime (assume due at end of day if only date is specified)
            if isinstance(task.due_date, datetime.date) and not isinstance(task.due_date, datetime.datetime):
                # Set due time to end of workday (5:00 PM)
                due_datetime = timezone.make_aware(
                    datetime.datetime.combine(task.due_date, datetime.time(17, 0, 0))
                )
            else:
                due_datetime = task.due_date
                
            # Calculate time remaining until deadline
            time_remaining = due_datetime - now
            hours_remaining = time_remaining.total_seconds() / 3600
            
            for timeframe in timeframes:
                threshold = timeframe['hours']
                
                # Check if task is due within this timeframe
                # Use a small buffer (0.5 hour) to avoid missing tasks due to timing
                if hours_remaining <= threshold and hours_remaining > (threshold - 0.5):
                    # First, clear any previous deadline notifications for this task
                    existing_notifications = Notification.objects.filter(
                        content_type=task_content_type,
                        object_id=task.id,
                        title__startswith='Task Due'  # Only remove deadline notifications
                    )
                    
                    count = existing_notifications.count()
                    if count > 0:
                        notifications_removed += count
                        existing_notifications.delete()
                    
                    # Create new notification
                    if task.assigned_to:
                        notification = NotificationService.create_notification(
                            recipient=task.assigned_to,
                            title=timeframe['title'],
                            message=f"Task '{task.title}' {timeframe['message']}",
                            category_name="task",
                            priority=timeframe['priority'],
                            related_object=task,
                            action_url=f"/tasks/{task.id}",
                            icon="Task",
                            color="#f44336"
                        )
                        
                        if notification:
                            notifications_created += 1
                            self.stdout.write(f"Created notification for task {task.id}: {timeframe['title']}")
        
        self.stdout.write(self.style.SUCCESS(
            f'Successfully checked deadlines. Created {notifications_created} notifications, removed {notifications_removed} old notifications.'
        )) 