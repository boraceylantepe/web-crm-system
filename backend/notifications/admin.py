from django.contrib import admin
from .models import Notification, NotificationCategory, NotificationPreference

@admin.register(NotificationCategory)
class NotificationCategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'description', 'icon', 'color')
    search_fields = ('name', 'description')

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('title', 'recipient', 'category', 'priority', 'is_read', 'created_at')
    list_filter = ('is_read', 'priority', 'category', 'created_at')
    search_fields = ('title', 'message', 'recipient__username', 'recipient__email')
    date_hierarchy = 'created_at'

@admin.register(NotificationPreference)
class NotificationPreferenceAdmin(admin.ModelAdmin):
    list_display = (
        'user', 'email_notifications', 'in_app_notifications', 
        'task_notifications', 'sales_notifications', 'customer_notifications',
        'system_notifications', 'minimum_priority'
    )
    list_filter = ('email_notifications', 'in_app_notifications', 'minimum_priority')
    search_fields = ('user__username', 'user__email')
