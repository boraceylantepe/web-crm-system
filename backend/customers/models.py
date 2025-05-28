from django.db import models
from django.conf import settings

class TimeStampedModel(models.Model):
    """
    Abstract base model that provides created_at and updated_at fields.
    """
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True

class Customer(TimeStampedModel):
    """
    Customer model for the CRM system.
    """
    REGION_CHOICES = [
        ('NA', 'North America'),
        ('EU', 'Europe'),
        ('APAC', 'Asia Pacific'),
        ('LATAM', 'Latin America'),
        ('MENA', 'Middle East & North Africa'),
        ('AF', 'Africa'),
        ('OTHER', 'Other'),
    ]
    
    ENGAGEMENT_LEVEL_CHOICES = [
        ('LOW', 'Low'),
        ('MEDIUM', 'Medium'),
        ('HIGH', 'High'),
        ('VIP', 'VIP'),
    ]
    
    STATUS_CHOICES = [
        ('ACTIVE', 'Active'),
        ('INACTIVE', 'Inactive'),
        ('LEAD', 'Lead'),
        ('PROSPECT', 'Prospect'),
    ]
    
    name = models.CharField(max_length=255)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    company = models.CharField(max_length=255, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    city = models.CharField(max_length=100, blank=True, null=True)
    country = models.CharField(max_length=100, blank=True, null=True)
    region = models.CharField(max_length=10, choices=REGION_CHOICES, default='OTHER')
    engagement_level = models.CharField(max_length=10, choices=ENGAGEMENT_LEVEL_CHOICES, default='MEDIUM')
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='ACTIVE')
    website = models.URLField(blank=True, null=True)
    linkedin = models.URLField(blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='customers')
    last_contact_date = models.DateField(blank=True, null=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.name
