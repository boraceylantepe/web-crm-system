from rest_framework import serializers
from .models import Notification, NotificationCategory, NotificationPreference

class NotificationCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationCategory
        fields = ['id', 'name', 'description', 'icon', 'color']

class NotificationSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    category_icon = serializers.CharField(source='category.icon', read_only=True)
    category_color = serializers.CharField(source='category.color', read_only=True)
    recipient_name = serializers.CharField(source='recipient.get_full_name', read_only=True)
    
    class Meta:
        model = Notification
        fields = [
            'id', 'recipient', 'category', 'title', 'message', 'priority', 
            'is_read', 'created_at', 'action_url', 'category_name',
            'category_icon', 'category_color', 'recipient_name'
        ]
        read_only_fields = ['created_at']

class NotificationPreferenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationPreference
        fields = [
            'id', 'user', 'email_notifications', 'in_app_notifications', 
            'task_notifications', 'sales_notifications', 'customer_notifications',
            'system_notifications', 'minimum_priority'
        ]
        read_only_fields = ['user']
        
    def create(self, validated_data):
        """Create notification preferences linked to the current user"""
        user = self.context['request'].user
        validated_data['user'] = user
        return super().create(validated_data) 