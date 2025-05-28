from rest_framework import permissions

class IsAdmin(permissions.BasePermission):
    """
    Custom permission to only allow admin users.
    """
    def has_permission(self, request, view):
        return request.user.role == 'ADMIN'

class IsAdminOrManager(permissions.BasePermission):
    """
    Custom permission to allow admin and manager users.
    """
    def has_permission(self, request, view):
        return request.user.role in ['ADMIN', 'MANAGER']

class IsOwnerOrAdmin(permissions.BasePermission):
    """
    Custom permission to allow owners of an object or admins.
    """
    def has_object_permission(self, request, view, obj):
        # Admin can do anything
        if request.user.role == 'ADMIN':
            return True
            
        # Check if object has owner field
        if hasattr(obj, 'owner'):
            return obj.owner == request.user
        # Check if object has assigned_to field
        elif hasattr(obj, 'assigned_to'):
            return obj.assigned_to == request.user
        # Check if object has author field
        elif hasattr(obj, 'author'):
            return obj.author == request.user
            
        return False

class CanEditUserInfo(permissions.BasePermission):
    """
    Permission class that allows:
    - Admins to edit all user information
    - Managers to edit basic information of regular users
    - Users to edit their own basic information
    """
    def has_permission(self, request, view):
        # Log all permissions checks
        print(f"CanEditUserInfo.has_permission called for {request.user.username} ({request.user.role})")
        print(f"Method: {request.method}, URL: {request.path}")
        
        # All authenticated users have basic permission
        if not request.user.is_authenticated:
            print("Permission denied: User is not authenticated")
            return False
            
        # Admin can do anything
        if request.user.role == 'ADMIN':
            print("Admin user granted permission")
            return True
            
        # For all others, we'll do object-level checks
        return True
    
    def has_object_permission(self, request, view, obj):
        # Log all object permissions checks
        print(f"CanEditUserInfo.has_object_permission called for {request.user.username} ({request.user.role})")
        print(f"Method: {request.method}, URL: {request.path}")
        print(f"Object ID: {obj.id}, Object Username: {getattr(obj, 'username', 'N/A')}")
        
        # SAFE_METHODS (GET, HEAD, OPTIONS) are always allowed
        if request.method in permissions.SAFE_METHODS:
            return True
            
        # Admin can do anything
        if request.user.role == 'ADMIN':
            return True
            
        # Managers can edit basic info of regular users but not other managers or admins
        if request.user.role == 'MANAGER':
            # Explicitly check if the target user is a regular user
            if hasattr(obj, 'role') and obj.role == 'USER':
                # Make sure no sensitive fields are being modified
                sensitive_fields = ['role', 'is_staff', 'is_superuser', 'is_active']
                if request.method in ['PUT', 'PATCH'] and any(field in request.data for field in sensitive_fields):
                    print(f"Manager tried to edit sensitive fields: {[f for f in sensitive_fields if f in request.data]}")
                    return False
                return True
            return False
            
        # Regular users can only edit themselves
        return obj.id == request.user.id 