import time
import json
from datetime import datetime, timedelta
from django.utils import timezone
from django.urls import reverse
from django.http import JsonResponse
from django.contrib.auth import logout

class SessionTimeoutMiddleware:
    """
    Middleware to enforce session timeout after a period of inactivity.
    It checks if the user's last activity timestamp is older than their
    configured session timeout period.
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        # Only apply to authenticated users
        if request.user.is_authenticated:
            # Get current time
            current_time = timezone.now()
            
            # Get the last activity time from the session
            last_activity = request.session.get('last_activity')
            
            if last_activity:
                # Convert last activity string to datetime object
                last_activity_time = datetime.fromisoformat(last_activity)
                
                # Get the user's timeout setting (in minutes)
                timeout_minutes = request.user.session_timeout
                
                # Calculate if session has timed out
                if current_time > last_activity_time + timedelta(minutes=timeout_minutes):
                    # Session has timed out, log the user out
                    logout(request)
                    
                    # If this is an API request, return a JsonResponse
                    if request.path.startswith('/api/'):
                        return JsonResponse({
                            'error': 'Session timeout',
                            'message': 'Your session has expired due to inactivity.'
                        }, status=401)
            
            # Update the last activity timestamp
            request.session['last_activity'] = timezone.now().isoformat()
        
        response = self.get_response(request)
        return response

class AuditLoggingMiddleware:
    """
    Middleware to log authentication-related activities for audit purposes.
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
        
        # Define authentication paths to monitor
        self.auth_paths = [
            reverse('token_obtain_pair'),  # JWT token obtain path
            '/admin/login/',               # Admin login path
        ]
    
    def __call__(self, request):
        # Process request before view is called
        is_auth_path = any(request.path.startswith(path) for path in self.auth_paths)
        
        # Capture the response
        response = self.get_response(request)
        
        # Log authentication attempts
        if is_auth_path and request.method == 'POST':
            self.log_auth_attempt(request, response)
        
        return response
    
    def log_auth_attempt(self, request, response):
        """Log authentication attempt to the database."""
        from accounts.models import AuthLog  # Import here to avoid circular import
        
        success = response.status_code == 200 or response.status_code == 302
        
        # Try to get username from request body
        username = None
        try:
            if request.content_type == 'application/json':
                body_data = json.loads(request.body)
                username = body_data.get('email') or body_data.get('username')
            else:
                username = request.POST.get('username') or request.POST.get('email')
        except:
            pass
        
        # Create the auth log
        AuthLog.objects.create(
            username=username,
            ip_address=self.get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', ''),
            path=request.path,
            method=request.method,
            success=success,
            status_code=response.status_code
        )
    
    def get_client_ip(self, request):
        """Get client IP address from request."""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip 