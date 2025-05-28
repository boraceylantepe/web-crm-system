from django.db import models
from django.conf import settings
from customers.models import Customer, TimeStampedModel

class Sale(TimeStampedModel):
    """
    Sales model for tracking sales opportunities.
    """
    STATUS_CHOICES = [
        ('NEW', 'New'),
        ('CONTACTED', 'Contacted'),
        ('PROPOSAL', 'Proposal Sent'),
        ('NEGOTIATION', 'Negotiation'),
        ('WON', 'Won'),
        ('LOST', 'Lost'),
    ]

    PRIORITY_CHOICES = [
        ('LOW', 'Low'),
        ('MEDIUM', 'Medium'),
        ('HIGH', 'High'),
    ]

    title = models.CharField(max_length=255)
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='sales')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='NEW')
    amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    expected_close_date = models.DateField(null=True, blank=True)
    description = models.TextField(blank=True, null=True)
    assigned_to = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='assigned_sales')
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='MEDIUM')
    is_archived = models.BooleanField(default=False)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return self.title

class SaleNote(TimeStampedModel):
    """
    Model for tracking notes and updates related to sales opportunities.
    """
    sale = models.ForeignKey(Sale, on_delete=models.CASCADE, related_name='notes')
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='sale_notes')
    content = models.TextField()
    is_update = models.BooleanField(default=False)  # To distinguish between notes and updates
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Note for {self.sale.title} by {self.author.email}" 