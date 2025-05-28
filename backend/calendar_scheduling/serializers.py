from rest_framework import serializers
from .models import CalendarEvent
from django.contrib.auth import get_user_model
# Ensure User model is correctly imported if needed for owner_name, or use settings.AUTH_USER_MODEL

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    """Simplified User serializer for event participants"""
    full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'email', 'full_name']
        
    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip() or obj.email

class CalendarEventSerializer(serializers.ModelSerializer):
    """Serializer for CalendarEvent model."""
    
    owner_name = serializers.SerializerMethodField()
    customer_name = serializers.StringRelatedField(source='customer.name', read_only=True)
    sale_title = serializers.StringRelatedField(source='sale.title', read_only=True)
    participants_details = UserSerializer(source='participants', many=True, read_only=True)
    event_type_display = serializers.CharField(source='get_event_type_display', read_only=True)
    
    class Meta:
        model = CalendarEvent
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at') # Add read_only fields for timestamps
        
    def get_owner_name(self, obj):
        if obj.owner:
            return f"{obj.owner.first_name} {obj.owner.last_name}".strip() or obj.owner.email
        return None 