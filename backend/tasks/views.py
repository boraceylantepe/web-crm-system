from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from .models import Task, TaskComment
from .serializers import TaskSerializer, TaskCommentSerializer
# UserSerializer will be imported from api.serializers
from api.serializers import UserSerializer as ApiUserSerializer
from django.contrib.auth import get_user_model
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count

User = get_user_model()

# Create your views here.

class TaskListCreateView(generics.ListCreateAPIView):
    serializer_class = TaskSerializer
    # Change permission to allow authenticated users
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        # Staff/superusers see all tasks, others see tasks assigned to them
        if user.is_staff or user.is_superuser:
            return Task.objects.all()
        # Regular users see tasks assigned to them
        return Task.objects.filter(assigned_to=user)

    def perform_create(self, serializer):
        user = self.request.user
        assigned_to = serializer.validated_data.get('assigned_to')
        
        # Staff/superusers can create tasks for anyone
        if user.is_staff or user.is_superuser:
            serializer.save()
        # Regular users can only create tasks for themselves
        elif assigned_to == user:
            # Override status to 'IP' (In Progress) for regular users creating tasks
            serializer.save(status='IP')
        # Regular users trying to create tasks for others
        else:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You can only create tasks for yourself.")

class TaskDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = TaskSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_staff or user.is_superuser:
            return Task.objects.all()
        return Task.objects.filter(assigned_to=user)
        
    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        user = request.user
        
        # If not staff/admin, only allow updating the status
        if not user.is_staff and not user.is_superuser:
            if 'status' in request.data and len(request.data) == 1:
                instance.status = request.data['status']
                instance.save()
                serializer = self.get_serializer(instance)
                return Response(serializer.data)
            else:
                return Response(
                    {"detail": "You can only update the status field."},
                    status=status.HTTP_403_FORBIDDEN
                )
                
        # For staff/admin, normal update process
        return super().update(request, *args, **kwargs)

class UserListView(generics.ListAPIView):
    queryset = User.objects.all().order_by('username')
    serializer_class = ApiUserSerializer # Use UserSerializer from api.serializers
    permission_classes = [permissions.IsAdminUser]

class TaskCommentListCreateView(generics.ListCreateAPIView):
    serializer_class = TaskCommentSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        task_id = self.kwargs.get('task_id')
        return TaskComment.objects.filter(task_id=task_id).order_by('-created_at')
    
    def create(self, request, *args, **kwargs):
        # Log the request data for debugging
        print(f"Comment request data: {request.data}")
        return super().create(request, *args, **kwargs)
    
    def perform_create(self, serializer):
        task_id = self.kwargs.get('task_id')
        try:
            task = Task.objects.get(pk=task_id)
            
            # Check if user is assigned to the task or is staff
            user = self.request.user
            if not (user.is_staff or user.is_superuser) and task.assigned_to != user:
                raise permissions.exceptions.PermissionDenied("You can only comment on tasks assigned to you.")
                
            # Log the data before saving for debugging
            print(f"Saving comment with task={task.id}, user={user.id}, comment={serializer.validated_data.get('comment')}")
            serializer.save(task=task, user=self.request.user)
        except Task.DoesNotExist:
            raise permissions.exceptions.NotFound("Task not found.")
        except Exception as e:
            print(f"Error creating comment: {str(e)}")
            raise

class TaskCommentDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = TaskCommentSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        comment = TaskComment.objects.get(pk=self.kwargs.get('pk'))
        
        # Only allow users to update/delete their own comments or if they're staff
        if user.is_staff or user.is_superuser:
            return TaskComment.objects.all()
        return TaskComment.objects.filter(user=user)
    
    def update(self, request, *args, **kwargs):
        # Users can only update their own comments
        comment = self.get_object()
        if comment.user != request.user and not (request.user.is_staff or request.user.is_superuser):
            return Response(
                {"detail": "You can only edit your own comments."},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().update(request, *args, **kwargs)
        
    def destroy(self, request, *args, **kwargs):
        # Users can only delete their own comments
        comment = self.get_object()
        if comment.user != request.user and not (request.user.is_staff or request.user.is_superuser):
            return Response(
                {"detail": "You can only delete your own comments."},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().destroy(request, *args, **kwargs)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def task_stats(request):
    """
    Endpoint to get task statistics
    """
    try:
        # Get tasks based on user role
        user = request.user
        if user.is_staff or user.is_superuser:
            tasks = Task.objects.all()
        else:
            tasks = Task.objects.filter(assigned_to=user)
        
        # Calculate statistics
        total_tasks = tasks.count()
        active_tasks = tasks.exclude(status='C').count()  # Exclude completed tasks
        completed_tasks = tasks.filter(status='C').count()
        pending_tasks = tasks.filter(status='P').count()
        in_progress_tasks = tasks.filter(status='IP').count()
        overdue_tasks = tasks.filter(status='O').count()
        
        # Return statistics
        result = {
            'total_tasks': total_tasks,
            'active_tasks': active_tasks,
            'completed_tasks': completed_tasks,
            'status_counts': {
                'P': pending_tasks,
                'IP': in_progress_tasks,
                'C': completed_tasks,
                'O': overdue_tasks
            }
        }
        
        return Response(result)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
