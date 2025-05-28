# CRM Security Enhancements & Hardening Guide

## Current Security Analysis

### Existing Security Features ✅
- JWT authentication with rotation
- Custom password complexity validation
- Session timeout middleware
- Audit logging middleware
- CSRF protection enabled
- Role-based permissions (Admin, Manager, User)

### Security Gaps Identified ❌
- No rate limiting
- Missing input validation/sanitization
- No API versioning
- Weak CORS configuration
- Missing security headers
- No encryption for sensitive data
- Limited audit trail

## Security Improvements Implementation

### 1. Rate Limiting & DDoS Protection

#### Install Django Rate Limit
```bash
pip install django-ratelimit
```

#### Implement Rate Limiting
```python
# security/middleware.py
from django_ratelimit.decorators import ratelimit
from django.utils.decorators import method_decorator
from django.http import JsonResponse
import logging

logger = logging.getLogger(__name__)

class RateLimitMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        # Log suspicious activity
        if hasattr(request, 'limited') and request.limited:
            logger.warning(
                f"Rate limit exceeded for {request.META.get('REMOTE_ADDR')} "
                f"on {request.path}"
            )
        
        response = self.get_response(request)
        return response

# Apply rate limiting to views
from django_ratelimit.decorators import ratelimit

@method_decorator(ratelimit(key='ip', rate='100/h', method='ALL'), name='dispatch')
class CustomerViewSet(viewsets.ModelViewSet):
    # API endpoints with rate limiting
    pass

@ratelimit(key='ip', rate='5/m', method='POST')
@api_view(['POST'])
def login_api(request):
    # Login with stricter rate limiting
    pass
```

### 2. Input Validation & Sanitization

#### Enhanced Serializer Validation
```python
# api/validators.py
import re
from django.core.exceptions import ValidationError
from django.utils.html import strip_tags
import bleach

class SecurityValidatorMixin:
    """Mixin for enhanced security validation"""
    
    def validate_email(self, value):
        # Enhanced email validation
        if not re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', value):
            raise ValidationError("Invalid email format")
        return value.lower()
    
    def validate_text_field(self, value, field_name):
        # XSS prevention
        if value:
            cleaned_value = bleach.clean(
                value,
                tags=['b', 'i', 'u', 'em', 'strong'],
                strip=True
            )
            if cleaned_value != value:
                raise ValidationError(f"Invalid characters in {field_name}")
        return cleaned_value
    
    def validate_phone(self, value):
        # Phone number validation
        if value:
            cleaned = re.sub(r'[^\d+\-\(\)\s]', '', value)
            if not re.match(r'^[\+]?[1-9][\d\-\(\)\s]{7,15}$', cleaned):
                raise ValidationError("Invalid phone number format")
        return value

# Enhanced Customer Serializer
class CustomerSerializer(SecurityValidatorMixin, serializers.ModelSerializer):
    def validate_name(self, value):
        return self.validate_text_field(value, "name")
    
    def validate_company(self, value):
        return self.validate_text_field(value, "company")
    
    class Meta:
        model = Customer
        fields = '__all__'
```

### 3. SQL Injection Prevention

#### Secure Query Patterns
```python
# security/query_utils.py
from django.db import models
from django.db.models import Q

class SecureQueryMixin:
    """Mixin for secure database queries"""
    
    @classmethod
    def secure_filter(cls, **kwargs):
        """Secure filtering with parameter validation"""
        allowed_fields = cls._meta.get_fields()
        allowed_field_names = [field.name for field in allowed_fields]
        
        # Validate field names to prevent injection
        for field_name in kwargs.keys():
            base_field = field_name.split('__')[0]
            if base_field not in allowed_field_names:
                raise ValueError(f"Invalid field: {field_name}")
        
        return cls.objects.filter(**kwargs)
    
    @classmethod
    def secure_search(cls, search_term, search_fields):
        """Secure text search across multiple fields"""
        if not search_term or not search_fields:
            return cls.objects.none()
        
        # Sanitize search term
        clean_term = search_term.strip()[:100]  # Limit length
        if not clean_term:
            return cls.objects.none()
        
        # Build Q object for search
        query = Q()
        for field in search_fields:
            query |= Q(**{f"{field}__icontains": clean_term})
        
        return cls.objects.filter(query)

# Apply to models
class Customer(SecureQueryMixin, TimeStampedModel):
    # Model implementation
    pass
```

### 4. Enhanced Authentication & Authorization

#### Two-Factor Authentication
```python
# accounts/two_factor.py
import pyotp
import qrcode
from io import BytesIO
import base64

class TwoFactorAuth:
    @staticmethod
    def generate_secret():
        return pyotp.random_base32()
    
    @staticmethod
    def generate_qr_code(user, secret):
        totp_uri = pyotp.totp.TOTP(secret).provisioning_uri(
            name=user.email,
            issuer_name="CRM System"
        )
        
        qr = qrcode.QRCode(version=1, box_size=10, border=5)
        qr.add_data(totp_uri)
        qr.make(fit=True)
        
        img = qr.make_image(fill_color="black", back_color="white")
        buffered = BytesIO()
        img.save(buffered)
        
        return base64.b64encode(buffered.getvalue()).decode()
    
    @staticmethod
    def verify_token(secret, token):
        totp = pyotp.TOTP(secret)
        return totp.verify(token, valid_window=1)

# Enhanced User Model
class User(AbstractUser):
    # Existing fields...
    two_factor_secret = models.CharField(max_length=32, blank=True, null=True)
    two_factor_enabled = models.BooleanField(default=False)
    backup_codes = models.JSONField(default=list, blank=True)
    
    def enable_two_factor(self):
        self.two_factor_secret = TwoFactorAuth.generate_secret()
        self.two_factor_enabled = True
        self.save()
```

#### Enhanced Permissions
```python
# api/permissions.py
from rest_framework import permissions
import logging

logger = logging.getLogger(__name__)

class DataAccessAuditPermission(permissions.BasePermission):
    """Permission class that logs all data access"""
    
    def has_permission(self, request, view):
        # Log data access attempts
        logger.info(
            f"Data access: {request.user.email} attempting {request.method} "
            f"on {view.__class__.__name__}"
        )
        return True
    
    def has_object_permission(self, request, view, obj):
        # Log object-level access
        logger.info(
            f"Object access: {request.user.email} accessing {obj.__class__.__name__} "
            f"ID {obj.pk}"
        )
        return True

class CustomerDataPermission(permissions.BasePermission):
    """Enhanced customer data permissions"""
    
    def has_object_permission(self, request, view, obj):
        user = request.user
        
        # Admins can access everything
        if user.role == 'ADMIN':
            return True
        
        # Managers can access all customers
        if user.role == 'MANAGER':
            return True
        
        # Users can only access their own customers
        if user.role == 'USER':
            return obj.owner == user
        
        return False
```

### 5. Data Encryption

#### Sensitive Data Encryption
```python
# security/encryption.py
from cryptography.fernet import Fernet
from django.conf import settings
import base64

class DataEncryption:
    def __init__(self):
        key = settings.ENCRYPTION_KEY.encode()
        self.cipher = Fernet(base64.urlsafe_b64encode(key[:32]))
    
    def encrypt(self, data):
        if isinstance(data, str):
            data = data.encode()
        return self.cipher.encrypt(data).decode()
    
    def decrypt(self, encrypted_data):
        if isinstance(encrypted_data, str):
            encrypted_data = encrypted_data.encode()
        return self.cipher.decrypt(encrypted_data).decode()

# Encrypted model fields
class EncryptedTextField(models.TextField):
    def __init__(self, *args, **kwargs):
        self.encryption = DataEncryption()
        super().__init__(*args, **kwargs)
    
    def from_db_value(self, value, expression, connection):
        if value is None:
            return value
        try:
            return self.encryption.decrypt(value)
        except:
            return value  # Fallback for unencrypted data
    
    def to_python(self, value):
        return value
    
    def get_prep_value(self, value):
        if value is None:
            return value
        return self.encryption.encrypt(value)

# Usage in models
class Customer(TimeStampedModel):
    name = models.CharField(max_length=255)
    email = models.EmailField(unique=True)
    notes = EncryptedTextField(blank=True, null=True)  # Encrypted sensitive notes
```

### 6. Security Headers & HTTPS

#### Security Middleware
```python
# security/middleware.py
class SecurityHeadersMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        response = self.get_response(request)
        
        # Security headers
        response['X-Content-Type-Options'] = 'nosniff'
        response['X-Frame-Options'] = 'DENY'
        response['X-XSS-Protection'] = '1; mode=block'
        response['Referrer-Policy'] = 'strict-origin-when-cross-origin'
        response['Content-Security-Policy'] = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
            "style-src 'self' 'unsafe-inline'; "
            "img-src 'self' data: https:; "
            "font-src 'self' https:; "
            "connect-src 'self' https:;"
        )
        
        return response

# Enhanced CORS settings
CORS_ALLOWED_ORIGINS = [
    "https://yourcrm.com",
    "https://www.yourcrm.com",
]

CORS_ALLOW_CREDENTIALS = True
CORS_ALLOWED_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
]
```

### 7. Audit Logging Enhancement

#### Comprehensive Audit System
```python
# audit/models.py
class AuditLog(models.Model):
    ACTION_CHOICES = [
        ('CREATE', 'Create'),
        ('READ', 'Read'),
        ('UPDATE', 'Update'),
        ('DELETE', 'Delete'),
        ('LOGIN', 'Login'),
        ('LOGOUT', 'Logout'),
        ('FAILED_LOGIN', 'Failed Login'),
        ('PERMISSION_DENIED', 'Permission Denied'),
    ]
    
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    action = models.CharField(max_length=20, choices=ACTION_CHOICES)
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE, null=True)
    object_id = models.PositiveIntegerField(null=True)
    object_repr = models.CharField(max_length=200, blank=True)
    ip_address = models.GenericIPAddressField()
    user_agent = models.TextField(blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    changes = models.JSONField(default=dict, blank=True)
    
    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['user', 'timestamp']),
            models.Index(fields=['action', 'timestamp']),
            models.Index(fields=['ip_address']),
        ]

# Enhanced Audit Middleware
class AuditLoggingMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        response = self.get_response(request)
        
        # Log API requests
        if request.path.startswith('/api/') and request.user.is_authenticated:
            self.log_request(request, response)
        
        return response
    
    def log_request(self, request, response):
        AuditLog.objects.create(
            user=request.user if request.user.is_authenticated else None,
            action=self.get_action_from_method(request.method),
            ip_address=self.get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', ''),
            changes={'path': request.path, 'status': response.status_code}
        )
```

### 8. API Security

#### API Versioning & Security
```python
# api/versioning.py
class APIVersionMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        # Enforce API versioning
        if request.path.startswith('/api/'):
            if 'API-Version' not in request.headers:
                return JsonResponse(
                    {'error': 'API version header required'}, 
                    status=400
                )
            
            version = request.headers.get('API-Version')
            if version not in ['v1', 'v2']:
                return JsonResponse(
                    {'error': 'Unsupported API version'}, 
                    status=400
                )
        
        return self.get_response(request)

# Secure API responses
class SecureAPIRenderer(JSONRenderer):
    def render(self, data, accepted_media_type=None, renderer_context=None):
        # Remove sensitive fields from responses
        if isinstance(data, dict):
            sensitive_fields = ['password', 'secret', 'key', 'token']
            for field in sensitive_fields:
                data.pop(field, None)
        
        return super().render(data, accepted_media_type, renderer_context)
```

### 9. Frontend Security

#### React Security Enhancements
```javascript
// security/utils.js
export const SecurityUtils = {
  // XSS prevention
  sanitizeInput: (input) => {
    const div = document.createElement('div');
    div.textContent = input;
    return div.innerHTML;
  },
  
  // CSRF token handling
  getCSRFToken: () => {
    return document.querySelector('[name=csrfmiddlewaretoken]')?.value;
  },
  
  // Secure storage
  secureStorage: {
    setItem: (key, value) => {
      const encryptedValue = btoa(JSON.stringify(value));
      sessionStorage.setItem(key, encryptedValue);
    },
    
    getItem: (key) => {
      const encryptedValue = sessionStorage.getItem(key);
      if (!encryptedValue) return null;
      try {
        return JSON.parse(atob(encryptedValue));
      } catch {
        return null;
      }
    }
  },
  
  // Input validation
  validateInput: (value, type) => {
    const patterns = {
      email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      phone: /^[\+]?[1-9][\d\-\(\)\s]{7,15}$/,
      alphanumeric: /^[a-zA-Z0-9\s]+$/
    };
    
    return patterns[type]?.test(value) ?? true;
  }
};

// Secure API client
const secureApiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
  timeout: 10000,
  headers: {
    'API-Version': 'v1',
    'Content-Type': 'application/json'
  }
});

// Request interceptor for security
secureApiClient.interceptors.request.use((config) => {
  // Add CSRF token
  const csrfToken = SecurityUtils.getCSRFToken();
  if (csrfToken) {
    config.headers['X-CSRFToken'] = csrfToken;
  }
  
  return config;
});
```

### 10. Security Configuration

#### Production Security Settings
```python
# settings/production.py
import os

# Security settings
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SECURE_HSTS_SECONDS = 31536000  # 1 year
SECURE_REDIRECT_EXEMPT = []
SECURE_REFERRER_POLICY = 'strict-origin-when-cross-origin'
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
CSRF_COOKIE_HTTPONLY = True
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = 'Strict'
CSRF_COOKIE_SAMESITE = 'Strict'

# Password security
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
        'OPTIONS': {'min_length': 12}
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
    {
        'NAME': 'accounts.validators.PasswordComplexityValidator',
    },
]

# File upload security
FILE_UPLOAD_MAX_MEMORY_SIZE = 5 * 1024 * 1024  # 5MB
DATA_UPLOAD_MAX_MEMORY_SIZE = FILE_UPLOAD_MAX_MEMORY_SIZE
ALLOWED_FILE_TYPES = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'jpg', 'png']

# Database security
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.environ['DB_NAME'],
        'USER': os.environ['DB_USER'],
        'PASSWORD': os.environ['DB_PASSWORD'],
        'HOST': os.environ['DB_HOST'],
        'PORT': os.environ['DB_PORT'],
        'OPTIONS': {
            'sslmode': 'require',
        },
    }
}
```

### 11. Security Monitoring

#### Security Incident Detection
```python
# security/monitoring.py
import logging
from django.core.mail import send_mail
from django.conf import settings

logger = logging.getLogger(__name__)

class SecurityMonitor:
    @staticmethod
    def detect_suspicious_activity(request, user=None):
        """Detect and respond to suspicious activity"""
        indicators = []
        
        # Multiple failed login attempts
        if hasattr(request, 'failed_login_count') and request.failed_login_count > 5:
            indicators.append('multiple_failed_logins')
        
        # Unusual IP address
        if user and hasattr(user, 'last_ip') and user.last_ip != request.META.get('REMOTE_ADDR'):
            indicators.append('new_ip_address')
        
        # Off-hours access
        import datetime
        current_hour = datetime.datetime.now().hour
        if current_hour < 6 or current_hour > 22:
            indicators.append('off_hours_access')
        
        if indicators:
            SecurityMonitor.alert_security_team(request, indicators)
    
    @staticmethod
    def alert_security_team(request, indicators):
        """Send security alert"""
        message = f"""
        Security Alert:
        
        Time: {datetime.datetime.now()}
        IP: {request.META.get('REMOTE_ADDR')}
        User Agent: {request.META.get('HTTP_USER_AGENT')}
        Indicators: {', '.join(indicators)}
        """
        
        logger.warning(f"Security alert: {indicators}")
        
        if settings.SECURITY_EMAIL_ALERTS:
            send_mail(
                'CRM Security Alert',
                message,
                settings.DEFAULT_FROM_EMAIL,
                settings.SECURITY_TEAM_EMAILS,
                fail_silently=False,
            )
```

### 12. Implementation Checklist

- [ ] Install security packages (django-ratelimit, bleach, cryptography)
- [ ] Implement rate limiting middleware
- [ ] Add input validation and sanitization
- [ ] Set up data encryption for sensitive fields
- [ ] Configure security headers middleware
- [ ] Enhance audit logging system
- [ ] Implement two-factor authentication
- [ ] Set up security monitoring alerts
- [ ] Update CORS and CSRF settings
- [ ] Configure HTTPS and SSL settings
- [ ] Add API versioning
- [ ] Implement secure file upload handling
- [ ] Set up automated security scanning
- [ ] Create incident response procedures 