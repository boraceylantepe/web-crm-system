from django.urls import path
from . import views

urlpatterns = [
    # Test endpoint
    path('test/', views.test_endpoint, name='sales-test'),
    
    # Core CRUD operations for sales
    path('', views.SaleViewSet.as_view({'get': 'list', 'post': 'create'}), name='sale-list'),
    path('<int:pk>/', views.SaleViewSet.as_view({'get': 'retrieve', 'put': 'update', 'delete': 'destroy'}), name='sale-detail'),
    
    # Special operations
    path('<int:pk>/update_status/', views.update_sale_status, name='update-sale-status'),
    path('<int:sale_id>/notes/', views.get_sale_notes, name='get-sale-notes'),
    path('<int:sale_id>/notes/create/', views.create_sale_note, name='create-sale-note'),
    path('debug-create-test-sale/', views.debug_create_test_sale, name='debug-create-test-sale'),
] 