from django.urls import path
from .views import (
    TaskListCreateView, 
    TaskDetailView, 
    UserListView,
    TaskCommentListCreateView,
    TaskCommentDetailView,
    task_stats
)

urlpatterns = [
    path('tasks/', TaskListCreateView.as_view(), name='task-list-create'),
    path('tasks/<int:pk>/', TaskDetailView.as_view(), name='task-detail'),
    path('users/', UserListView.as_view(), name='user-list'),
    path('tasks/<int:task_id>/comments/', TaskCommentListCreateView.as_view(), name='task-comment-list'),
    path('comments/<int:pk>/', TaskCommentDetailView.as_view(), name='task-comment-detail'),
    path('stats/', task_stats, name='task-stats'),
] 