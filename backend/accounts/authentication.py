from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework import status, exceptions
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from django.utils import timezone

User = get_user_model()

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Custom token serializer that enforces:
    - Account lockout after multiple failed attempts
    - Password expiry checking
    - Force password change on first login
    - Records login attempts
    """
    
    def validate(self, attrs):
        # Get the username (email in our case)
        username = attrs.get(self.username_field)
        
        # Try to find the user
        try:
            user = User.objects.get(email=username)
            
            # Check if account is locked
            if user.is_account_locked():
                # Record failed login attempt
                user.record_login_attempt(success=False)
                raise exceptions.AuthenticationFailed(
                    'Account temporarily locked due to multiple failed login attempts.'
                )
                
        except User.DoesNotExist:
            # User not found, we'll let the parent class handle authentication failure
            pass
            
        try:
            # Call parent validation which will authenticate the user
            data = super().validate(attrs)
            
            # At this point, authentication was successful
            user = self.user
            
            # Record successful login
            user.record_login_attempt(success=True)
            
            # Check if password is expired or force change is required
            if user.is_password_expired() or user.force_password_change:
                # Add flags to the response
                data['password_expired'] = user.is_password_expired()
                data['force_password_change'] = user.force_password_change
                
            return data
            
        except exceptions.AuthenticationFailed as e:
            # Authentication failed
            try:
                # Try to find the user again to record failed attempt
                user = User.objects.get(email=username)
                user.record_login_attempt(success=False)
            except User.DoesNotExist:
                # If user doesn't exist, we can't record the attempt
                pass
                
            # Re-raise the exception
            raise e

class CustomTokenObtainPairView(TokenObtainPairView):
    """Custom token view using our serializer."""
    serializer_class = CustomTokenObtainPairSerializer 