from django.shortcuts import render
from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
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
    filterset_fields = ['status', 'region', 'engagement_level', 'is_active']
    search_fields = ['name', 'email', 'company', 'phone']
    
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
