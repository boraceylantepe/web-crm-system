from django.shortcuts import render
from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django.db.models import Q
from django.utils import timezone
from datetime import datetime, time
from .models import CalendarEvent
from .serializers import CalendarEventSerializer
from tasks.models import Task
from sales.models import Sale
from api.permissions import IsOwnerOrAdmin

class CalendarEventViewSet(viewsets.ModelViewSet):
    """
    API endpoint for calendar event management.
    """
    queryset = CalendarEvent.objects.all().order_by('-start_time')
    serializer_class = CalendarEventSerializer
    filterset_fields = ['owner', 'customer', 'sale', 'is_all_day']
    search_fields = ['title', 'description']
    
    def get_permissions(self):
        """
        Permissions:
        - Admin: Full access
        - Users: Access to events they own or participate in
        - Create/Update/Delete: Only owner or admin can modify events
        """
        if self.action in ['update', 'partial_update', 'destroy']:
            permission_classes = [permissions.IsAuthenticated, IsOwnerOrAdmin]
        else:
            permission_classes = [permissions.IsAuthenticated]
        return [permission() for permission in permission_classes]
    
    def get_queryset(self):
        """
        Filter events based on user role:
        - Admin: All events
        - Regular users: Events they own OR participate in
        """
        user = self.request.user
        print(f"CalendarEventViewSet.get_queryset called for user: {user.username}, role: {getattr(user, 'role', 'unknown')}")
        
        # Admin can see all events
        if hasattr(user, 'role') and user.role == 'ADMIN':
            print(f"User is admin, returning all events: {self.queryset.count()} total events")
            return self.queryset
            
        # Regular users can see events they own OR participate in
        queryset = self.queryset.filter(
            Q(owner=user) | Q(participants=user)
        ).distinct()
        
        print(f"Filtered events for user {user.username}: {queryset.count()} events found")
        return queryset
    
    def list(self, request, *args, **kwargs):
        """Override list method to ensure proper response format and include tasks and sales"""
        # Get regular calendar events
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        events = serializer.data
        
        # Log the original events
        print(f"Calendar events from database: {len(events)} events")
        
        # Add task deadlines
        task_events = self._get_task_events(request.user)
        events.extend(task_events)
        
        # Add sales expected close dates
        sale_events = self._get_sale_events(request.user)
        events.extend(sale_events)
        
        print(f"Total calendar events including tasks and sales: {len(events)} events")
        
        # Return combined events
        return Response(events)
    
    def _get_task_events(self, user):
        """Convert tasks to calendar events format"""
        # Get tasks assigned to the user or visible to them based on role
        # This matches the logic from tasks/views.py TaskListCreateView
        if hasattr(user, 'role') and user.role == 'ADMIN':
            # Admins can see all tasks
            tasks = Task.objects.all()
        elif hasattr(user, 'role') and user.role == 'MANAGER':
            # Managers can see tasks assigned to them AND tasks they created/assigned
            tasks = Task.objects.filter(
                Q(assigned_to=user) | Q(created_by=user)
            ).distinct()
        else:
            # Users can only see tasks assigned to them
            tasks = Task.objects.filter(assigned_to=user)
        
        print(f"Found {tasks.count()} tasks to add to calendar")
        
        # Convert tasks to calendar event format
        task_events = []
        for task in tasks:
            # Skip tasks without due dates
            if not task.due_date:
                continue
                
            # Create an all-day event for the task deadline
            # Format dates as ISO strings for JSON serialization
            due_date_str = task.due_date.isoformat()
            
            # Set color based on task status (status takes priority over priority)
            # Color scheme:
            # - Red: Overdue tasks (urgent attention)
            # - Green: Completed tasks (success)
            # - Blue: In Progress tasks (active work)
            # - Orange: High priority pending tasks
            # - Purple: Medium priority pending tasks  
            # - Gray: Low priority pending tasks or unknown status
            if task.status == 'O':  # Overdue
                color = '#d32f2f'  # Red - Urgent attention needed
            elif task.status == 'C':  # Completed
                color = '#388e3c'  # Green - Success
            elif task.status == 'IP':  # In Progress
                color = '#2196f3'  # Blue - Active work
            elif task.status == 'P':  # Pending
                # For pending tasks, use priority to determine color
                if task.priority == 'H':  # High priority
                    color = '#ff9800'  # Orange - Important pending
                elif task.priority == 'M':  # Medium priority
                    color = '#9c27b0'  # Purple - Normal pending
                else:  # Low priority
                    color = '#757575'  # Gray - Low priority pending
            else:
                color = '#757575'  # Default gray for unknown status
            
            task_events.append({
                'id': f"task_{task.id}",
                'title': f"Task: {task.title}",
                'start_time': due_date_str,
                'end_time': due_date_str,
                'is_all_day': True,
                'event_type': 'DEADLINE',
                'description': task.notes,
                'owner': task.assigned_to.id,
                'owner_name': f"{task.assigned_to.first_name} {task.assigned_to.last_name}".strip() or task.assigned_to.email,
                'location': None,
                'backgroundColor': color,
                'extendedProps': {
                    'event_source': 'task',
                    'task_id': task.id,
                    'priority': task.priority,
                    'status': task.status,
                    'priority_display': task.get_priority_display(),
                    'status_display': task.get_status_display()
                }
            })
        
        print(f"Added {len(task_events)} task events to calendar")
        return task_events
    
    def _get_sale_events(self, user):
        """Convert sales expected close dates to calendar events format"""
        # Get sales assigned to the user or visible to them based on role
        # This matches the logic from sales/views.py SaleViewSet
        if hasattr(user, 'role') and user.role in ['ADMIN', 'MANAGER']:
            # Admins and managers can see all sales
            sales = Sale.objects.all()
        else:
            # Users can only see sales assigned to them
            sales = Sale.objects.filter(assigned_to=user)
        
        # Only include sales with expected close dates
        sales = sales.exclude(expected_close_date=None)
        
        print(f"Found {sales.count()} sales with close dates to add to calendar")
        
        # Convert sales to calendar event format
        sale_events = []
        for sale in sales:
            # Create an all-day event for the expected close date
            # Format dates as ISO strings for JSON serialization
            close_date_str = sale.expected_close_date.isoformat()
            
            # Set color based on sale status to match kanban board colors
            # Color scheme matches frontend/src/pages/Sales.js kanban board
            if sale.status == 'NEW':
                color = '#1976d2'  # Blue
            elif sale.status == 'CONTACTED':
                color = '#03a9f4'  # Light Blue  
            elif sale.status == 'PROPOSAL':
                color = '#ff9800'  # Orange
            elif sale.status == 'NEGOTIATION':
                color = '#9c27b0'  # Purple
            elif sale.status == 'WON':
                color = '#4caf50'  # Green
            elif sale.status == 'LOST':
                color = '#f44336'  # Red
            else:
                color = '#1976d2'  # Default blue for unknown status
            
            sale_events.append({
                'id': f"sale_{sale.id}",
                'title': f"Sale: {sale.title}",
                'start_time': close_date_str,
                'end_time': close_date_str,
                'is_all_day': True,
                'event_type': 'DEADLINE',
                'description': sale.description,
                'owner': sale.assigned_to.id,
                'owner_name': f"{sale.assigned_to.first_name} {sale.assigned_to.last_name}".strip() or sale.assigned_to.email,
                'customer': sale.customer.id,
                'customer_name': sale.customer.name,
                'location': None,
                'backgroundColor': color,
                'extendedProps': {
                    'event_source': 'sale',
                    'sale_id': sale.id,
                    'status': sale.status,
                    'priority': sale.priority,
                    'amount': str(sale.amount) if sale.amount else None
                }
            })
        
        print(f"Added {len(sale_events)} sale events to calendar")
        return sale_events
    
    @action(detail=False, methods=['get'])
    def my_events(self, request):
        """Return only events owned by or assigned to the current user"""
        user = request.user
        queryset = self.queryset.filter(
            Q(owner=user) | Q(participants=user)
        ).distinct()
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    def perform_create(self, serializer):
        # Set the current user as the owner if not specified
        if 'owner' not in serializer.validated_data:
            serializer.save(owner=self.request.user)
        else:
            serializer.save()
