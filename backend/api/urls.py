from django.urls import path, include
from rest_framework.routers import DefaultRouter
from api.views import UserViewSet
from customers.views import CustomerViewSet
from sales.views import SaleViewSet, SaleNoteViewSet
# Remove old TaskViewSet and CalendarEventViewSet imports from tasks.views
# from tasks.views import TaskViewSet, CalendarEventViewSet 
from sales import views as sales_views

router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user') # This is for user management, not task assignment user list
router.register(r'customers', CustomerViewSet, basename='customer')
router.register(r'sales', SaleViewSet, basename='sale')
router.register(r'sales-notes', SaleNoteViewSet, basename='sale-note')
# router.register(r'tasks', TaskViewSet, basename='task') # Remove old task registration
# router.register(r'events', CalendarEventViewSet, basename='calendar-event') # Remove old calendar event registration

urlpatterns = [
    path('', include(router.urls)),
    path('task-management/', include('tasks.urls')), # Include new task management URLs
    path('calendar/', include('calendar_scheduling.urls')), # Add calendar URLs
    path('notifications/', include('notifications.urls')), # Add notifications URLs
] 