from django.contrib import admin
from .models import Task

class TaskAdmin(admin.ModelAdmin):
    list_display = ('title', 'due_date', 'status', 'priority', 'assigned_to')
    list_filter = ('status', 'priority')
    search_fields = ('title', 'notes', 'assigned_to__username')
    fieldsets = (
        (None, {'fields': ('title', 'notes')}),
        ('Task Details', {'fields': ('due_date', 'status', 'priority')}),
        ('Assignments', {'fields': ('assigned_to',)}),
    )
    raw_id_fields = ('assigned_to',)

admin.site.register(Task, TaskAdmin)
