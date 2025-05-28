from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from django.core.exceptions import ValidationError as DjangoValidationError
from customers.models import Customer
from sales.models import Sale, SaleNote
from tasks.models import Task

User = get_user_model()

class DynamicFieldsModelSerializer(serializers.ModelSerializer):
    """
    A ModelSerializer that takes an additional `fields` argument that
    controls which fields should be displayed.
    """

    def __init__(self, *args, **kwargs):
        # Don't pass the 'fields' arg up to the superclass
        fields = kwargs.pop('fields', None)
        
        # Instantiate the superclass normally
        super().__init__(*args, **kwargs)

        if fields is not None:
            # Drop any fields that are not specified in the `fields` argument.
            allowed = set(fields)
            existing = set(self.fields)
            for field_name in existing - allowed:
                self.fields.pop(field_name)

class UserSerializer(DynamicFieldsModelSerializer):
    """Serializer for User model."""
    
    password = serializers.CharField(write_only=True, required=False)
    role_display = serializers.CharField(source='get_role_display', read_only=True)
    
    class Meta:
        model = User
        fields = ['id', 'email', 'username', 'first_name', 'last_name', 
                  'role', 'role_display', 'is_staff', 'is_active', 'password', 'date_joined', 
                  'password_changed_at', 'force_password_change', 'session_timeout']
        read_only_fields = ['id', 'date_joined', 'password_changed_at']
        extra_kwargs = {
            'password': {'write_only': True},
            'is_staff': {'read_only': True, 'required': False},
            'force_password_change': {'required': False},
            'session_timeout': {'required': False},
        }
    
    def create(self, validated_data):
        """Create a new user with encrypted password."""
        # Set is_staff automatically based on role
        role = validated_data.get('role', 'USER')
        
        # Create the user
        user = User.objects.create_user(**validated_data)
        
        # Set staff status based on role
        if role == 'ADMIN':
            user.is_staff = True
            user.save(update_fields=['is_staff'])
            
        return user
    
    def update(self, instance, validated_data):
        """Update a user, set the password correctly and handle permission checks."""
        # Add debug logging
        request_user = self.context['request'].user
        print(f"UserSerializer.update called by {request_user.username} (role={request_user.role})")
        print(f"Updating user: {instance.username} (role={instance.role})")
        print(f"Data received: {validated_data}")
        
        # Handle password
        password = validated_data.pop('password', None)
        
        # Get the current user from context
        # request_user was defined above for debugging
        
        # Handle sensitive fields
        if request_user.role != 'ADMIN':
            # Non-admins can't change role, is_staff, is_active, etc.
            if 'role' in validated_data:
                print(f"Removing 'role' from data - not allowed for {request_user.role}")
                validated_data.pop('role')
            if 'is_staff' in validated_data:
                print(f"Removing 'is_staff' from data - not allowed for {request_user.role}")
                validated_data.pop('is_staff')
            if 'is_active' in validated_data:
                print(f"Removing 'is_active' from data - not allowed for {request_user.role}")
                validated_data.pop('is_active')
            if 'force_password_change' in validated_data:
                print(f"Removing 'force_password_change' from data - not allowed for {request_user.role}")
                validated_data.pop('force_password_change')
            if 'session_timeout' in validated_data:
                print(f"Removing 'session_timeout' from data - not allowed for {request_user.role}")
                validated_data.pop('session_timeout')
        
        # Update user fields
        print(f"Remaining fields to update: {validated_data}")
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        # Set password if provided
        if password:
            instance.set_password(password)
            instance.password_changed_at = None  # Force user to change password on next login
            instance.force_password_change = True
        
        # Update is_staff based on role (only if admin)
        if request_user.role == 'ADMIN':
            if instance.role == 'ADMIN':
                instance.is_staff = True
            else:
                instance.is_staff = False
        
        instance.save()
        print(f"User {instance.username} updated successfully")
        return instance

class PasswordChangeSerializer(serializers.Serializer):
    """
    Serializer for password change endpoint.
    """
    current_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True)
    confirm_password = serializers.CharField(required=True)
    
    def validate_current_password(self, value):
        """Validate that current password is correct."""
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("Current password is incorrect.")
        return value
    
    def validate_new_password(self, value):
        """Validate that new password meets requirements."""
        user = self.context['request'].user
        
        # Check if new password is different from current
        if user.check_password(value):
            raise serializers.ValidationError("New password must be different from current password.")
        
        # Validate password using Django's validators
        try:
            validate_password(value, user)
        except DjangoValidationError as e:
            raise serializers.ValidationError(list(e.messages))
            
        return value
    
    def validate(self, data):
        """Validate that new password and confirmation match."""
        if data['new_password'] != data['confirm_password']:
            raise serializers.ValidationError({"confirm_password": "Password fields didn't match."})
        return data 

class CustomerSerializer(serializers.ModelSerializer):
    """Serializer for Customer model."""
    
    owner_name = serializers.SerializerMethodField()
    region_display = serializers.CharField(source='get_region_display', read_only=True)
    engagement_level_display = serializers.CharField(source='get_engagement_level_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = Customer
        fields = '__all__'
        extra_kwargs = {
            'name': {'required': True},
            'email': {'required': True},
            'owner': {'required': False},  # This will be set in perform_create if not provided
        }
        
    def get_owner_name(self, obj):
        if obj.owner:
            return f"{obj.owner.first_name} {obj.owner.last_name}".strip() or obj.owner.email
        return None
        
    def validate(self, data):
        """Validate customer data"""
        # Check that required fields are provided
        if not data.get('name'):
            raise serializers.ValidationError({"name": "Customer name is required"})
        if not data.get('email'):
            raise serializers.ValidationError({"email": "Customer email is required"})
        return data

class SaleSerializer(serializers.ModelSerializer):
    """Serializer for Sale model."""
    
    assigned_to_name = serializers.SerializerMethodField()
    customer_name = serializers.StringRelatedField(source='customer.name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    
    class Meta:
        model = Sale
        fields = '__all__'
        
    def get_assigned_to_name(self, obj):
        if obj.assigned_to:
            return f"{obj.assigned_to.first_name} {obj.assigned_to.last_name}".strip() or obj.assigned_to.email
        return None

class SaleNoteSerializer(serializers.ModelSerializer):
    """Serializer for SaleNote model."""
    
    author_name = serializers.SerializerMethodField()
    
    class Meta:
        model = SaleNote
        fields = '__all__'
        
    def get_author_name(self, obj):
        if obj.author:
            return f"{obj.author.first_name} {obj.author.last_name}".strip() or obj.author.email
        return None

class TaskSerializer(serializers.ModelSerializer):
    """Serializer for Task model."""
    
    assigned_to_name = serializers.SerializerMethodField()
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    
    class Meta:
        model = Task
        fields = '__all__'
        
    def get_assigned_to_name(self, obj):
        if obj.assigned_to:
            return f"{obj.assigned_to.first_name} {obj.assigned_to.last_name}".strip() or obj.assigned_to.email
        return None 