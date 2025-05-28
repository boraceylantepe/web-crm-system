from django.contrib import admin
from .models import Customer

class CustomerAdmin(admin.ModelAdmin):
    list_display = ('name', 'email', 'company', 'status', 'region', 'engagement_level', 'owner', 'is_active')
    list_filter = ('status', 'region', 'engagement_level', 'is_active')
    search_fields = ('name', 'email', 'company', 'phone')
    fieldsets = (
        (None, {'fields': ('name', 'email', 'phone', 'company')}),
        ('Address', {'fields': ('address', 'city', 'country', 'region')}),
        ('Additional Information', {'fields': ('website', 'linkedin', 'notes')}),
        ('Status', {'fields': ('status', 'engagement_level', 'is_active')}),
        ('Ownership', {'fields': ('owner', 'last_contact_date')}),
    )
    raw_id_fields = ('owner',)

admin.site.register(Customer, CustomerAdmin)
