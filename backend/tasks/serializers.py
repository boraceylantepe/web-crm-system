from rest_framework import serializers
from .models import Task, TaskComment
# Removed User import as we will use UserSerializer from api.serializers if needed for UserListView

class TaskCommentSerializer(serializers.ModelSerializer):
    user_username = serializers.ReadOnlyField(source='user.username')
    
    class Meta:
        model = TaskComment
        fields = ['id', 'task', 'user', 'user_username', 'comment', 'created_at', 'updated_at']
        read_only_fields = ('id', 'task', 'user', 'created_at', 'updated_at', 'user_username')

class TaskSerializer(serializers.ModelSerializer):
    assigned_to_username = serializers.ReadOnlyField(source='assigned_to.username')
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    comments = TaskCommentSerializer(many=True, read_only=True)
    
    class Meta:
        model = Task
        fields = ['id', 'title', 'notes', 'due_date', 'priority', 'priority_display', 
                  'status', 'status_display', 'assigned_to', 'assigned_to_username', 
                  'created_at', 'updated_at', 'comments']
        read_only_fields = ('created_at', 'updated_at', 'assigned_to_username', 
                            'status_display', 'priority_display', 'comments')

# UserSerializer removed from here, UserListView in tasks.views will use UserSerializer from api.serializers 