from django.urls import path, include
from rest_framework.routers import DefaultRouter
from api.views import UserViewSet
from customers.views import CustomerViewSet
from sales.views import SaleViewSet, SaleNoteViewSet

router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')
router.register(r'customers', CustomerViewSet, basename='customer')
router.register(r'sales', SaleViewSet, basename='sale')
router.register(r'sales-notes', SaleNoteViewSet, basename='sale-note')

urlpatterns = [
    path('', include(router.urls)),
    path('task-management/', include('tasks.urls')),
    path('calendar/', include('calendar_scheduling.urls')),
    path('notifications/', include('notifications.urls')),
] 