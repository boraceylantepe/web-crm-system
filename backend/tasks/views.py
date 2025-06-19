from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.exceptions import PermissionDenied, NotFound
from .models import Task, TaskComment
from .serializers import TaskSerializer, TaskCommentSerializer
# UserSerializer will be imported from api.serializers
from api.serializers import UserSerializer as ApiUserSerializer
from django.contrib.auth import get_user_model
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count, Q
from django.db import models

User = get_user_model()

# Create your views here.

class TaskListCreateView(generics.ListCreateAPIView):
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        
        # Role-based filtering
        if user.role == 'ADMIN':
            # Admins can see all tasks
            return Task.objects.all()
        elif user.role == 'MANAGER':
            # Managers can see tasks assigned to them AND tasks they created/assigned
            return Task.objects.filter(
                Q(assigned_to=user) | Q(created_by=user)
            ).distinct()
        else:  # USER role
            # Users can only see tasks assigned to them
            return Task.objects.filter(assigned_to=user)

    def perform_create(self, serializer):
        user = self.request.user
        assigned_to = serializer.validated_data.get('assigned_to')
        
        # Set the creator of the task
        if user.role == 'ADMIN':
            # Admins can create tasks for anyone
            serializer.save(created_by=user)
        elif user.role == 'MANAGER':
            # Managers can create tasks for themselves and USER role accounts
            if assigned_to == user:
                # Task assigned to themselves
                serializer.save(created_by=user)
            elif assigned_to and assigned_to.role == 'USER':
                # Task assigned to a USER
                serializer.save(created_by=user)
            else:
                raise PermissionDenied("Managers can only assign tasks to themselves or users.")
        else:  # USER role
            # Users can only create tasks for themselves
            if assigned_to == user:
                serializer.save(created_by=user, status='IP')
            else:
                raise PermissionDenied("You can only create tasks for yourself.")

class TaskDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = TaskSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        
        # Role-based filtering (same as list view)
        if user.role == 'ADMIN':
            return Task.objects.all()
        elif user.role == 'MANAGER':
            return Task.objects.filter(
                Q(assigned_to=user) | Q(created_by=user)
            ).distinct()
        else:  # USER role
            return Task.objects.filter(assigned_to=user)
        
    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        user = request.user
        
        # Role-based update permissions
        if user.role == 'ADMIN':
            # Admins can update everything
            return super().update(request, *args, **kwargs)
        elif user.role == 'MANAGER':
            # Managers can update tasks they created or are assigned to
            if instance.created_by == user or instance.assigned_to == user:
                return super().update(request, *args, **kwargs)
            else:
                return Response(
                    {"detail": "You can only update tasks you created or are assigned to."},
                    status=status.HTTP_403_FORBIDDEN
                )
        else:  # USER role
            # Users can only update status of tasks assigned to them
            if instance.assigned_to == user:
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
            else:
                return Response(
                    {"detail": "You can only update tasks assigned to you."},
                    status=status.HTTP_403_FORBIDDEN
                )

class UserListView(generics.ListAPIView):
    serializer_class = ApiUserSerializer # Use UserSerializer from api.serializers
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        
        # Role-based user list for task assignment
        if user.role == 'ADMIN':
            # Admins can assign tasks to anyone
            return User.objects.all().order_by('username')
        elif user.role == 'MANAGER':
            # Managers can assign tasks to themselves and USER role accounts
            return User.objects.filter(
                Q(role='USER') | Q(id=user.id)
            ).order_by('username')
        else:  # USER role
            # Users can only assign tasks to themselves
            return User.objects.filter(id=user.id)

class TaskCommentListCreateView(generics.ListCreateAPIView):
    serializer_class = TaskCommentSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        task_id = self.kwargs.get('task_id')
        user = self.request.user
        
        print(f"TaskCommentListCreateView.get_queryset called for task_id={task_id}, user={user.username} (role={user.role})")
        
        try:
            task = Task.objects.get(pk=task_id)
            print(f"Task found: {task.title}, assigned_to={task.assigned_to}, created_by={task.created_by}")
        except Task.DoesNotExist:
            print(f"Task {task_id} not found")
            return TaskComment.objects.none()
        
        # Role-based access to comments
        # Users can see comments if they can access the task
        can_view_comments = False
        
        if user.role == 'ADMIN':
            can_view_comments = True
        elif user.role == 'MANAGER':
            # Managers can see comments on tasks they created or are assigned to
            can_view_comments = (task.assigned_to == user or task.created_by == user)
        else:  # USER role
            # Users can see comments on tasks assigned to them OR tasks they created
            can_view_comments = (task.assigned_to == user or task.created_by == user)
        
        print(f"Can view comments: {can_view_comments}")
        
        if can_view_comments:
            comments = TaskComment.objects.filter(task_id=task_id).order_by('-created_at')
            print(f"Returning {comments.count()} comments for task {task_id}")
            return comments
        else:
            print(f"Access denied for user {user.username} to view comments on task {task_id}")
            return TaskComment.objects.none()
    
    def create(self, request, *args, **kwargs):
        # Log the request data for debugging
        print(f"Comment request data: {request.data}")
        return super().create(request, *args, **kwargs)
    
    def perform_create(self, serializer):
        task_id = self.kwargs.get('task_id')
        try:
            task = Task.objects.get(pk=task_id)
            
            # Check if user has permission to comment based on role
            user = self.request.user
            can_comment = False
            
            if user.role == 'ADMIN':
                can_comment = True
            elif user.role == 'MANAGER':
                # Managers can comment on tasks they created or are assigned to
                can_comment = (task.assigned_to == user or task.created_by == user)
            else:  # USER role
                # Users can comment on tasks assigned to them OR tasks they created
                can_comment = (task.assigned_to == user or task.created_by == user)
            
            if not can_comment:
                raise PermissionDenied("You can only comment on tasks you have access to.")
                
            # Log the data before saving for debugging
            print(f"Saving comment with task={task.id}, user={user.id}, comment={serializer.validated_data.get('comment')}")
            serializer.save(task=task, user=self.request.user)
        except Task.DoesNotExist:
            raise NotFound("Task not found.")
        except Exception as e:
            print(f"Error creating comment: {str(e)}")
            raise

class TaskCommentDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = TaskCommentSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        
        # Role-based access to comments - similar to list view
        if user.role == 'ADMIN':
            return TaskComment.objects.all()
        else:
            # Get comments from tasks the user has access to
            if user.role == 'MANAGER':
                accessible_tasks = Task.objects.filter(
                    Q(assigned_to=user) | Q(created_by=user)
                )
            else:  # USER role
                accessible_tasks = Task.objects.filter(assigned_to=user)
            
            return TaskComment.objects.filter(task__in=accessible_tasks)
    
    def update(self, request, *args, **kwargs):
        # Users can only update their own comments, admins can update any
        comment = self.get_object()
        if request.user.role != 'ADMIN' and comment.user != request.user:
            return Response(
                {"detail": "You can only edit your own comments."},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().update(request, *args, **kwargs)
        
    def destroy(self, request, *args, **kwargs):
        # Users can only delete their own comments, admins can delete any
        comment = self.get_object()
        if request.user.role != 'ADMIN' and comment.user != request.user:
            return Response(
                {"detail": "You can only delete your own comments."},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().destroy(request, *args, **kwargs)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def task_stats(request):
    """
    Endpoint to get task statistics with role-based filtering
    """
    try:
        # Get tasks based on user role
        user = request.user
        
        if user.role == 'ADMIN':
            tasks = Task.objects.all()
        elif user.role == 'MANAGER':
            # Managers see tasks assigned to them AND tasks they created/assigned
            tasks = Task.objects.filter(
                Q(assigned_to=user) | Q(created_by=user)
            ).distinct()
        else:  # USER role
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
