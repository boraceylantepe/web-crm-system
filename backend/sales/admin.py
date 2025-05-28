from django.contrib import admin
from .models import Sale, SaleNote

class SaleNoteInline(admin.TabularInline):
    model = SaleNote
    extra = 1
    fields = ('content', 'author', 'is_update')
    raw_id_fields = ('author',)

class SaleAdmin(admin.ModelAdmin):
    list_display = ('title', 'customer', 'status', 'priority', 'amount', 'expected_close_date', 'assigned_to')
    list_filter = ('status', 'priority', 'is_archived')
    search_fields = ('title', 'description', 'customer__name')
    fieldsets = (
        (None, {'fields': ('title', 'customer', 'description')}),
        ('Sales Information', {'fields': ('status', 'priority', 'amount', 'expected_close_date')}),
        ('Assignment', {'fields': ('assigned_to',)}),
        ('Status', {'fields': ('is_archived',)}),
    )
    raw_id_fields = ('customer', 'assigned_to')
    inlines = [SaleNoteInline]

class SaleNoteAdmin(admin.ModelAdmin):
    list_display = ('sale', 'author', 'is_update', 'created_at')
    list_filter = ('is_update',)
    search_fields = ('content', 'sale__title', 'author__email')
    raw_id_fields = ('sale', 'author')

admin.site.register(Sale, SaleAdmin)
admin.site.register(SaleNote, SaleNoteAdmin) 