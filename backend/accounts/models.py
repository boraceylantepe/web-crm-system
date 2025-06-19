from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
from django.utils import timezone
from django.core.mail import send_mail
from django.utils.translation import gettext_lazy as _
import os

def user_profile_picture_path(instance, filename):
    """Generate file path for user profile pictures."""
    # Get the file extension
    ext = filename.split('.')[-1]
    # Create filename as user_id.extension
    filename = f"user_{instance.id}.{ext}"
    # Return the full path
    return os.path.join('profile_pictures', filename)

class UserManager(BaseUserManager):
    """Define a model manager for User model with no username field."""

    def _create_user(self, email, password=None, **extra_fields):
        """Create and save a User with the given email and password."""
        if not email:
            raise ValueError('The given email must be set')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_user(self, email, password=None, **extra_fields):
        """Create and save a regular User with the given email and password."""
        extra_fields.setdefault('is_staff', False)
        extra_fields.setdefault('is_superuser', False)
        return self._create_user(email, password, **extra_fields)

    def create_superuser(self, email, password=None, **extra_fields):
        """Create and save a SuperUser with the given email and password."""
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self._create_user(email, password, **extra_fields)

class User(AbstractBaseUser, PermissionsMixin):
    """Custom User model that uses email as the unique identifier instead of username."""
    
    # Role choices
    ROLE_CHOICES = [
        ('ADMIN', 'Admin'),
        ('MANAGER', 'Manager'),
        ('USER', 'User'),
    ]
    
    # Make email unique and required
    email = models.EmailField(_('email address'), unique=True)
    
    # Add basic user fields from the AbstractUser class
    first_name = models.CharField(_('first name'), max_length=150, blank=True)
    last_name = models.CharField(_('last name'), max_length=150, blank=True)
    username = models.CharField(_('username'), max_length=150, blank=True)
    
    # Profile picture field
    profile_picture = models.ImageField(
        upload_to=user_profile_picture_path,
        blank=True,
        null=True,
        help_text=_('Upload a profile picture')
    )
    
    is_staff = models.BooleanField(
        _('staff status'),
        default=False,
        help_text=_('Designates whether the user can log into this admin site.'),
    )
    is_active = models.BooleanField(
        _('active'),
        default=True,
        help_text=_(
            'Designates whether this user should be treated as active. '
            'Unselect this instead of deleting accounts.'
        ),
    )
    date_joined = models.DateTimeField(_('date joined'), default=timezone.now)
    
    # Add role field
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='USER')
    
    # Add password management fields
    password_changed_at = models.DateTimeField(null=True, blank=True)
    password_expiry_days = models.IntegerField(default=90)  # Password expires after 90 days
    force_password_change = models.BooleanField(default=True)  # Force change on first login
    
    # Add fields for last login attempt and login tracking
    last_login_attempt = models.DateTimeField(null=True, blank=True)
    failed_login_attempts = models.PositiveIntegerField(default=0)
    account_locked_until = models.DateTimeField(null=True, blank=True)
    
    # Session timeout in minutes
    session_timeout = models.PositiveIntegerField(default=15)  # 15 min default timeout

    # Use email as the unique identifier
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []  # Email is already required by default
    
    objects = UserManager()

    def save(self, *args, **kwargs):
        """Override save method to ensure username is always set from email and set is_staff for admins."""
        if not self.username:
            self.username = self.email
            
        # Set is_staff and is_superuser based on role
        if self.role == 'ADMIN':
            self.is_staff = True
        
        super().save(*args, **kwargs)
    
    def get_profile_picture_url(self):
        """Get the URL for the user's profile picture."""
        if self.profile_picture:
            return self.profile_picture.url
        return None
    
    def is_password_expired(self):
        """Check if the user's password has expired."""
        if not self.password_changed_at:
            return True
        
        expiry_date = self.password_changed_at + timezone.timedelta(days=self.password_expiry_days)
        return timezone.now() > expiry_date
    
    def record_login_attempt(self, success):
        """Record a login attempt."""
        self.last_login_attempt = timezone.now()
        
        if not success:
            self.failed_login_attempts += 1
            # Lock account after 5 failed attempts
            if self.failed_login_attempts >= 5:
                self.account_locked_until = timezone.now() + timezone.timedelta(minutes=30)
        else:
            # Reset failed attempts on successful login
            self.failed_login_attempts = 0
            self.account_locked_until = None
            
            # Update last_login field
            self.last_login = timezone.now()
            
        self.save(update_fields=['last_login_attempt', 'failed_login_attempts', 
                               'account_locked_until', 'last_login'])
    
    def is_account_locked(self):
        """Check if the account is temporarily locked due to failed login attempts."""
        if not self.account_locked_until:
            return False
        return timezone.now() < self.account_locked_until
        
    def email_user(self, subject, message, from_email=None, **kwargs):
        """Send an email to this user."""
        send_mail(subject, message, from_email, [self.email], **kwargs)
        
    def __str__(self):
        return self.email
        
    class Meta:
        verbose_name = _('user')
        verbose_name_plural = _('users')

class AuthLog(models.Model):
    """
    Model to track authentication attempts for audit purposes.
    """
    username = models.CharField(max_length=255, null=True, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True, null=True)
    path = models.CharField(max_length=255)
    method = models.CharField(max_length=10)
    success = models.BooleanField(default=False)
    status_code = models.IntegerField(null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = 'Authentication Log'
        verbose_name_plural = 'Authentication Logs'
        ordering = ['-timestamp']
    
    def __str__(self):
        return f"{self.method} {self.path} - {self.status_code} - {self.username}"
