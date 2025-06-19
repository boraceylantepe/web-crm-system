from django.shortcuts import render
from django.contrib.auth import get_user_model
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from django.utils import timezone
from api.serializers import UserSerializer, PasswordChangeSerializer, ProfileSerializer
from api.permissions import IsAdmin, IsAdminOrManager, CanEditUserInfo

User = get_user_model()

# Create your views here.

class UserViewSet(viewsets.ModelViewSet):
    """
    API endpoint for user management.
    
    Role-based access:
    - Admin: can perform all operations
    - Manager: can view all users, create users, and update basic info of regular users
    - Regular users: can only view and update their own profile
    """
    queryset = User.objects.all().order_by('-date_joined')
    serializer_class = UserSerializer
    
    def get_permissions(self):
        """
        Override permissions based on role and action:
        - Admin can do anything
        - Manager can list, retrieve, create users, and update basic info of regular users
        - Regular users can only access their own info and change their password
        """
        if self.action in ['create']:
            # Admins and managers can create users
            permission_classes = [permissions.IsAuthenticated, IsAdminOrManager]
        elif self.action == 'destroy':
            # Only admins can delete users
            permission_classes = [permissions.IsAuthenticated, IsAdmin]
        elif self.action in ['update', 'partial_update', 'retrieve']:
            # Use our custom permission for updates and retrieving user details
            permission_classes = [permissions.IsAuthenticated, CanEditUserInfo]
        elif self.action == 'list':
            # Admins and managers can list all users
            permission_classes = [permissions.IsAuthenticated, IsAdminOrManager]
        elif self.action in ['change_password', 'me', 'manager_update', 'for_calendar']:
            # Any authenticated user can change their password, view their info, or get users for calendar
            permission_classes = [permissions.IsAuthenticated]
        else:
            # Default permission
            permission_classes = [permissions.IsAuthenticated]
            
        print(f"UserViewSet action: {self.action}, Permission classes: {permission_classes}")
        return [permission() for permission in permission_classes]
    
    def get_queryset(self):
        """
        Restrict queryset based on user role:
        - Admin and Manager users can see all users
        - Regular users can only see themselves
        """
        user = self.request.user
        if user.role in ['ADMIN', 'MANAGER']:
            return self.queryset
        return self.queryset.filter(id=user.id)
    
    @action(detail=False, methods=['get'])
    def me(self, request):
        """
        Get the current user's information.
        """
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def for_calendar(self, request):
        """
        Get a list of all users for calendar event participants selection.
        This endpoint is accessible to all authenticated users.
        """
        users = User.objects.all().order_by('first_name', 'last_name')
        # Use a simplified serializer with just the fields needed for calendar
        serializer = self.get_serializer(users, many=True, fields=['id', 'email', 'first_name', 'last_name', 'username'])
        return Response({
            'results': serializer.data
        })
    
    @action(detail=False, methods=['post'], serializer_class=PasswordChangeSerializer)
    def change_password(self, request):
        """
        Change the user's password.
        """
        serializer = PasswordChangeSerializer(data=request.data, context={'request': request})
        
        if serializer.is_valid():
            user = request.user
            
            # Set the password
            user.set_password(serializer.validated_data['new_password'])
            
            # Update password management fields
            user.password_changed_at = timezone.now()
            user.force_password_change = False
            
            user.save()
            
            return Response({'detail': 'Password changed successfully.'}, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def perform_create(self, validated_data):
        """Override to ensure is_staff is set correctly based on role."""
        user = super().perform_create(validated_data)
        
        # Set is_staff based on role
        if user.role == 'ADMIN':
            user.is_staff = True
            user.save(update_fields=['is_staff'])
            
        return user

    def update(self, request, *args, **kwargs):
        """Override update to add debugging for permissions and handle manager permissions explicitly"""
        print(f"Update request from user: {request.user.username}, Role: {request.user.role}")
        print(f"Request data: {request.data}")
        print(f"Target user ID: {kwargs.get('pk')}")
        
        # Direct permission check for managers editing regular users
        if request.user.role == 'MANAGER':
            try:
                print("Bypassing permission checks for manager...")
                # Get the user being edited without going through DRF's get_object() to avoid permission checks
                target_id = kwargs.get('pk')
                if not target_id:
                    print("No target ID provided")
                    return Response(
                        {"detail": "User ID not provided."},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                print(f"Looking up User with ID: {target_id}")
                # Use the User model that's already imported at the top
                print(f"User model: {User}")
                
                try:
                    target_user = User.objects.get(pk=target_id)
                    print(f"Target user found: {target_user.username}, Role: {target_user.role}")
                except User.DoesNotExist:
                    print(f"User with ID {target_id} not found")
                    return Response(
                        {"detail": "User not found."},
                        status=status.HTTP_404_NOT_FOUND
                    )
                
                # Managers can edit basic info of regular users but not other managers or admins
                if target_user.role in ['ADMIN', 'MANAGER']:
                    print(f"Manager cannot edit admin/manager: {target_user.role}")
                    return Response(
                        {"detail": "You do not have permission to edit administrators or managers."},
                        status=status.HTTP_403_FORBIDDEN
                    )
                    
                # Don't allow managers to change sensitive fields
                sensitive_fields = ['role', 'is_staff', 'is_superuser', 'is_active']
                if any(field in request.data for field in sensitive_fields):
                    print(f"Manager tried to edit sensitive fields: {[f for f in sensitive_fields if f in request.data]}")
                    return Response(
                        {"detail": "You do not have permission to edit these fields."},
                        status=status.HTTP_403_FORBIDDEN
                    )
                    
                # Create a serializer and save manually
                serializer = self.get_serializer(target_user, data=request.data, partial=kwargs.get('partial', False))
                if serializer.is_valid():
                    serializer.save()
                    print("Manager update successful")
                    return Response(serializer.data)
                else:
                    print(f"Serializer validation failed: {serializer.errors}")
                    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
                
            except Exception as e:
                print(f"Error in manager permission check: {str(e)}")
                import traceback
                traceback.print_exc()
                return Response(
                    {"detail": f"Error processing request: {str(e)}"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        
        # For non-managers, use the normal permission system
        try:
            return super().update(request, *args, **kwargs)
        except Exception as e:
            print(f"Error in regular update method: {str(e)}")
            import traceback
            traceback.print_exc()
            return Response(
                {"detail": f"Error processing request: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['patch', 'put'], url_path='manager-update')
    def manager_update(self, request, pk=None):
        """
        Special endpoint for managers to update regular users' basic info.
        """
        if request.user.role != 'MANAGER':
            return Response(
                {"detail": "Only managers can use this endpoint."},
                status=status.HTTP_403_FORBIDDEN
            )
            
        try:
            # Get the target user
            target_user = User.objects.get(pk=pk)
            
            # Check if trying to edit admin/manager
            if target_user.role in ['ADMIN', 'MANAGER']:
                return Response(
                    {"detail": "Managers cannot edit administrators or other managers."},
                    status=status.HTTP_403_FORBIDDEN
                )
                
            # Remove sensitive fields from the data
            data = request.data.copy()
            sensitive_fields = ['role', 'is_staff', 'is_superuser', 'is_active', 
                             'force_password_change', 'session_timeout']
            
            for field in sensitive_fields:
                if field in data:
                    data.pop(field)
                    
            # Validate and save
            serializer = self.get_serializer(target_user, data=data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
        except User.DoesNotExist:
            return Response(
                {"detail": "User not found."},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response(
                {"detail": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['get', 'put', 'patch'], permission_classes=[permissions.IsAuthenticated])
    def profile(self, request):
        """
        Get or update the current user's profile.
        """
        user = request.user
        
        if request.method == 'GET':
            serializer = ProfileSerializer(user)
            print(f"Profile GET for user {user.username}: {serializer.data}")
            return Response(serializer.data)
        
        elif request.method in ['PUT', 'PATCH']:
            print(f"Profile {request.method} for user {user.username}")
            print(f"Request data: {request.data}")
            print(f"Request FILES: {request.FILES}")
            
            serializer = ProfileSerializer(user, data=request.data, partial=request.method == 'PATCH')
            if serializer.is_valid():
                print(f"Serializer is valid, validated_data: {serializer.validated_data}")
                updated_user = serializer.save()
                print(f"User saved, profile_picture: {updated_user.profile_picture}")
                print(f"Profile picture URL: {updated_user.get_profile_picture_url()}")
                
                # Return fresh data
                response_serializer = ProfileSerializer(updated_user)
                print(f"Response data: {response_serializer.data}")
                return Response(response_serializer.data)
            else:
                print(f"Serializer errors: {serializer.errors}")
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
