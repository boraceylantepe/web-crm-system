from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q
from .models import Customer
from api.serializers import CustomerSerializer
from api.permissions import IsAdminOrManager, IsOwnerOrAdmin

# Create your views here.

class CustomerViewSet(viewsets.ModelViewSet):
    """
    API endpoint for customer management.
    """
    queryset = Customer.objects.all().order_by('name')
    serializer_class = CustomerSerializer
    
    # Add filtering, search, and ordering backends
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'region', 'engagement_level', 'is_active']
    search_fields = ['name', 'email', 'company', 'phone']
    ordering_fields = ['name', 'created_at', 'updated_at', 'email']
    ordering = ['name']
    
    def get_permissions(self):
        """
        Permissions:
        - Admin/Manager: Full access
        - User: Read access to all customers, write access only to customers they own
        """
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            permission_classes = [permissions.IsAuthenticated, IsOwnerOrAdmin]
        else:
            permission_classes = [permissions.IsAuthenticated]
        
        return [permission() for permission in permission_classes]
    
    def perform_create(self, serializer):
        # Set the current user as the owner if not specified
        if 'owner' not in serializer.validated_data:
            serializer.save(owner=self.request.user)
        else:
            serializer.save()
    
    @action(detail=False, methods=['get'])
    def search_advanced(self, request):
        """
        Advanced search endpoint for customers.
        Supports all the same filtering and search capabilities as the main list endpoint.
        """
        queryset = self.get_queryset()
        
        # Apply the same filtering logic as the main list view
        queryset = self.filter_queryset(queryset)
        
        # Paginate the results
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response({
            'results': serializer.data,
            'count': queryset.count()
        })
            
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            # Return detailed validation errors
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )
            
        try:
            self.perform_create(serializer)
            headers = self.get_success_headers(serializer.data)
            return Response(
                serializer.data, 
                status=status.HTTP_201_CREATED, 
                headers=headers
            )
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
