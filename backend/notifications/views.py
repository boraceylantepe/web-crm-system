from django.shortcuts import render
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from .models import Notification, NotificationCategory, NotificationPreference
from .serializers import NotificationSerializer, NotificationCategorySerializer, NotificationPreferenceSerializer

# Create your views here.

class NotificationViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing notifications
    """
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Only return notifications for the current user"""
        return Notification.objects.filter(recipient=self.request.user)
    
    @action(detail=False, methods=['post'])
    def mark_all_as_read(self, request):
        """Mark all notifications as read"""
        notifications = self.get_queryset().filter(is_read=False)
        notifications.update(is_read=True)
        return Response({'status': 'All notifications marked as read'})
    
    @action(detail=True, methods=['post'])
    def mark_as_read(self, request, pk=None):
        """Mark a specific notification as read"""
        notification = self.get_object()
        notification.is_read = True
        notification.save()
        return Response({'status': 'Notification marked as read'})
    
    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        """Get count of unread notifications"""
        count = self.get_queryset().filter(is_read=False).count()
        return Response({'count': count})

class NotificationCategoryViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for viewing notification categories
    """
    queryset = NotificationCategory.objects.all()
    serializer_class = NotificationCategorySerializer
    permission_classes = [permissions.IsAuthenticated]

class NotificationPreferenceViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing notification preferences
    """
    serializer_class = NotificationPreferenceSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Only return preferences for the current user"""
        return NotificationPreference.objects.filter(user=self.request.user)
    
    def create(self, request, *args, **kwargs):
        """
        Create notification preferences if they don't exist,
        otherwise return existing preferences
        """
        # Check if preferences already exist for this user
        existing = NotificationPreference.objects.filter(user=request.user).first()
        if existing:
            serializer = self.get_serializer(existing)
            return Response(serializer.data)
        
        # If not, create new preferences
        return super().create(request, *args, **kwargs)
    
    @action(detail=False, methods=['get'])
    def my_preferences(self, request):
        """
        Get or create the current user's notification preferences
        """
        preferences, created = NotificationPreference.objects.get_or_create(
            user=request.user
        )
        serializer = self.get_serializer(preferences)
        return Response(serializer.data)
