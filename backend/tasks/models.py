from django.db import models
# from django.contrib.auth.models import User # Replaced with AUTH_USER_MODEL
from django.conf import settings
from django.utils import timezone

class Task(models.Model):
    PRIORITY_CHOICES = [
        ('L', 'Low'),
        ('M', 'Medium'),
        ('H', 'High'),
    ]
    STATUS_CHOICES = [
        ('P', 'Pending'),
        ('IP', 'In Progress'),
        ('C', 'Completed'),
        ('O', 'Overdue'),
    ]

    title = models.CharField(max_length=255)
    notes = models.TextField(blank=True, null=True)
    due_date = models.DateField(default=timezone.now)
    priority = models.CharField(max_length=1, choices=PRIORITY_CHOICES, default='M')
    status = models.CharField(max_length=2, choices=STATUS_CHOICES, default='P')
    assigned_to = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='tasks')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title

    def get_status_display(self):
        return dict(self.STATUS_CHOICES).get(self.status)

    def get_priority_display(self):
        return dict(self.PRIORITY_CHOICES).get(self.priority)

    class Meta:
        ordering = ['due_date']

    def update_status_if_overdue(self):
        if self.status not in ['C', 'O'] and self.due_date < timezone.now().date():
            self.status = 'O'
            self.save()

# CalendarEvent model moved to calendar_scheduling app

class TaskComment(models.Model):
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='comments')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='task_comments')
    comment = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Comment by {self.user.username} on {self.task.title}"

    class Meta:
        ordering = ['-created_at']
