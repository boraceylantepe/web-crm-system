from django.shortcuts import render
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
from .models import Sale, SaleNote
from .serializers import SaleSerializer, SaleNoteSerializer
from django.db.models import Sum, Avg, Q
from rest_framework.permissions import IsAuthenticated, AllowAny
from api.permissions import IsOwnerOrAdmin
import logging
from django.utils import timezone

# Set up logger
logger = logging.getLogger(__name__)

class SaleViewSet(viewsets.ModelViewSet):
    """
    API endpoint for sales management.
    """
    queryset = Sale.objects.all().order_by('-created_at')
    serializer_class = SaleSerializer
    filterset_fields = ['status', 'priority', 'is_archived', 'assigned_to']
    search_fields = ['title', 'description', 'customer__name']
    
    def get_permissions(self):
        """
        Permissions:
        - Admin: Full access
        - Users: Access to sales they're assigned to
        """
        permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]
    
    def perform_create(self, serializer):
        # Set the current user as the assigned_to if not specified
        if 'assigned_to' not in serializer.validated_data:
            serializer.save(assigned_to=self.request.user)
        else:
            serializer.save()
            
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            # Return detailed validation errors
            logger.error(f"Sale validation error: {serializer.errors}")
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )
            
        try:
            # Make sure we have required fields
            if 'title' not in serializer.validated_data:
                return Response(
                    {"title": "Title is required"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
                
            if 'customer' not in serializer.validated_data:
                return Response(
                    {"customer": "Customer is required"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            self.perform_create(serializer)
            headers = self.get_success_headers(serializer.data)
            return Response(
                serializer.data, 
                status=status.HTTP_201_CREATED, 
                headers=headers
            )
        except Exception as e:
            logger.exception(f"Error creating sale: {str(e)}")
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

class SaleNoteViewSet(viewsets.ModelViewSet):
    """
    API endpoint for sale notes management.
    """
    serializer_class = SaleNoteSerializer
    filterset_fields = ['sale', 'author', 'is_update']
    
    def get_queryset(self):
        """
        This view should return only notes for the specified sale.
        """
        queryset = SaleNote.objects.all().select_related('author').order_by('-created_at')
        sale_id = self.request.query_params.get('sale', None)
        if sale_id is not None:
            queryset = queryset.filter(sale=sale_id)
        return queryset
    
    def get_permissions(self):
        permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]
    
    def perform_create(self, serializer):
        # Set the current user as the author
        serializer.save(author=self.request.user)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_sale(request, pk):
    try:
        sale = Sale.objects.get(pk=pk)
        
        # If the sale is won, mark it as archived instead of deleting
        if sale.status == 'WON':
            sale.is_archived = True
            sale.save()
            return Response(status=status.HTTP_204_NO_CONTENT)
            
        # For non-won sales, proceed with deletion
        sale.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    except Sale.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def sales_pipeline(request):
    """
    Endpoint to get sales pipeline data grouped by status
    """
    try:
        # Get all non-archived sales with related data
        sales = Sale.objects.filter(is_archived=False).select_related('customer', 'assigned_to')
        
        # Apply search filter if provided
        search_term = request.query_params.get('search', None)
        if search_term:
            print(f"DEBUG: Applying search filter: {search_term}")
            sales = sales.filter(
                Q(title__icontains=search_term) |
                Q(description__icontains=search_term) |
                Q(customer__name__icontains=search_term)
            )
        
        print(f"DEBUG: Found {sales.count()} sales after filtering")
        
        # Create a detailed response
        result = {}
        for status_code, status_name in Sale.STATUS_CHOICES:
            sales_list = []
            status_sales = sales.filter(status=status_code)
            print(f"DEBUG: Status {status_code} has {status_sales.count()} sales")
            
            for sale in status_sales:
                # Enhanced response with more details
                sales_list.append({
                    'id': sale.id,
                    'title': sale.title,
                    'customer_name': sale.customer.name,
                    'customer_details': {
                        'id': sale.customer.id,
                        'name': sale.customer.name,
                        'email': sale.customer.email,
                        'company': getattr(sale.customer, 'company', '')
                    },
                    'amount': float(sale.amount) if sale.amount else 0,
                    'expected_close_date': sale.expected_close_date.isoformat() if sale.expected_close_date else None,
                    'description': sale.description,
                    'priority': sale.priority,
                    'priority_display': dict(Sale.PRIORITY_CHOICES).get(sale.priority, sale.priority),
                    'status': sale.status,
                    'status_display': dict(Sale.STATUS_CHOICES).get(sale.status, sale.status),
                    'assigned_to_name': f"{sale.assigned_to.first_name} {sale.assigned_to.last_name}".strip() or sale.assigned_to.email,
                    'assigned_to_details': {
                        'id': sale.assigned_to.id,
                        'email': sale.assigned_to.email,
                        'full_name': f"{sale.assigned_to.first_name} {sale.assigned_to.last_name}".strip() or sale.assigned_to.email
                    },
                    'created_at': sale.created_at.isoformat()
                })
            
            result[status_code] = sales_list
        
        print("DEBUG: Pipeline result structure:", {k: len(v) for k, v in result.items()})
        return Response(result)
    except Exception as e:
        print(f"DEBUG ERROR: {str(e)}")
        import traceback
        print(traceback.format_exc())
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def sales_stats(request):
    """
    Endpoint to get sales statistics
    """
    try:
        # Simple stats
        all_sales = Sale.objects.all()
        result = {
            'total_count': all_sales.count(),
            'total_value': float(all_sales.aggregate(Sum('amount'))['amount__sum'] or 0),
            'status_counts': {}
        }
        
        # Count by status
        for status_code, status_name in Sale.STATUS_CHOICES:
            result['status_counts'][status_code] = all_sales.filter(status=status_code).count()
        
        # Get task stats from the task service
        try:
            # Import here to avoid circular imports
            from tasks.views import task_stats
            # Create a mock request with the current user
            from rest_framework.test import APIRequestFactory
            factory = APIRequestFactory()
            task_request = factory.get('/api/task-management/stats/')
            task_request.user = request.user
            task_stats_response = task_stats(task_request)
            if task_stats_response.status_code == 200:
                task_data = task_stats_response.data
                result['active_tasks'] = task_data.get('active_tasks', 0)
            else:
                result['active_tasks'] = 0
        except Exception as e:
            print(f"Error fetching task stats: {str(e)}")
            result['active_tasks'] = 0
        
        # For upcoming events - would normally call a similar event stats API
        # For now, just set a placeholder value
        result['upcoming_events'] = 0
        
        print("DEBUG: Stats result", result)
        return Response(result)
    except Exception as e:
        print(f"DEBUG ERROR in stats: {str(e)}")
        import traceback
        print(traceback.format_exc())
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_sale_note(request, sale_id):
    try:
        sale = Sale.objects.get(pk=sale_id)
        
        # Create the note directly using the model
        note = SaleNote.objects.create(
            sale=sale,
            author=request.user,
            content=request.data.get('content', ''),
            is_update=request.data.get('is_update', False)
        )
        
        # Serialize the created note
        serializer = SaleNoteSerializer(note)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    except Sale.DoesNotExist:
        return Response({'error': 'Sale not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        # Log the actual error for debugging
        print(f"Error creating sale note: {str(e)}")
        import traceback
        print(traceback.format_exc())
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_sale_notes(request, sale_id):
    try:
        notes = SaleNote.objects.filter(sale_id=sale_id).select_related('author')
        serializer = SaleNoteSerializer(notes, many=True)
        return Response(serializer.data)
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_sale(request, pk):
    try:
        sale = Sale.objects.get(pk=pk)
        old_data = SaleSerializer(sale).data
        serializer = SaleSerializer(sale, data=request.data, partial=True)
        
        if serializer.is_valid():
            serializer.save()
            
            # Create an update note if there are changes
            changes = []
            for field, new_value in serializer.validated_data.items():
                old_value = old_data.get(field)
                if old_value != new_value:
                    field_display = field.replace('_', ' ').title()
                    changes.append(f"{field_display}: {old_value} → {new_value}")
            
            if changes:
                SaleNote.objects.create(
                    sale=sale,
                    author=request.user,
                    content="\n".join(changes),
                    is_update=True
                )
            
            # Create a note about the status change
            note_content = f"Status changed to {dict(Sale.STATUS_CHOICES)[sale.status]}"
            SaleNote.objects.create(
                sale=sale,
                author=request.user,
                content=note_content,
                is_update=True
            )
            
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    except Sale.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def debug_create_test_sale(request):
    """
    Debug endpoint to create a test sale
    """
    try:
        # Find a customer
        from customers.models import Customer
        customers = Customer.objects.all()
        if not customers.exists():
            return Response({"error": "No customers found"}, status=status.HTTP_400_BAD_REQUEST)
        
        customer = customers.first()
        
        # Create a test sale
        sale = Sale.objects.create(
            title=f"Test Sale {Sale.objects.count() + 1}",
            customer=customer,
            status="NEW",
            amount=1000.00,
            expected_close_date=None,
            priority="MEDIUM",
            assigned_to=request.user,
            is_archived=False
        )
        
        return Response({
            "success": True,
            "message": f"Created test sale with ID {sale.id}",
            "sale": {
                "id": sale.id,
                "title": sale.title,
                "customer": customer.name,
                "status": sale.status
            }
        })
        
    except Exception as e:
        print(f"Error creating test sale: {str(e)}")
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_sale_status(request, pk):
    """
    Update the status of a sale
    """
    try:
        sale = Sale.objects.get(pk=pk)
        new_status = request.data.get('status')
        
        if not new_status:
            return Response(
                {'error': 'Status is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Verify the status is valid
        valid_statuses = [status_code for status_code, _ in Sale.STATUS_CHOICES]
        if new_status not in valid_statuses:
            return Response(
                {'error': f'Invalid status. Valid options are: {", ".join(valid_statuses)}'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Update the status
        old_status = sale.status
        sale.status = new_status
        sale.save()
        
        # Create a note about the status change
        SaleNote.objects.create(
            sale=sale,
            author=request.user,
            content=f"Status changed from {old_status} to {new_status}",
            is_update=True
        )
        
        return Response(SaleSerializer(sale).data)
    except Sale.DoesNotExist:
        return Response(
            {'error': 'Sale not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        print(f"Error updating sale status: {e}")
        return Response(
            {'error': str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([AllowAny])
def test_endpoint(request):
    """
    Simple test endpoint to check routing (no auth required)
    """
    return Response({
        "message": "Test endpoint is working",
        "time": timezone.now().isoformat()
    }) 