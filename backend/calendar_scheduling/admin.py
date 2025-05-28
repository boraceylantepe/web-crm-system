from django.contrib import admin
from .models import CalendarEvent

class CalendarEventAdmin(admin.ModelAdmin):
    list_display = ('title', 'start_time', 'end_time', 'is_all_day', 'owner', 'customer', 'sale')
    list_filter = ('is_all_day', 'owner') # Added owner to filter
    search_fields = ('title', 'description', 'owner__username', 'customer__name', 'sale__title') # Added sale__title
    fieldsets = (
        (None, {'fields': ('title', 'description')}),
        ('Event Details', {'fields': ('start_time', 'end_time', 'is_all_day')}),
        ('Assignments & Relations', {'fields': ('owner', 'customer', 'sale')}), # Grouped assignments
    )
    raw_id_fields = ('owner', 'customer', 'sale')
    date_hierarchy = 'start_time' # Added date hierarchy

admin.site.register(CalendarEvent, CalendarEventAdmin)
