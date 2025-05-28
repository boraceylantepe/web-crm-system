from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, AuthLog

class UserAdmin(BaseUserAdmin):
    list_display = ('email', 'first_name', 'last_name', 'role', 'is_staff', 'is_active')
    list_filter = ('role', 'is_staff', 'is_active')
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal info', {'fields': ('first_name', 'last_name')}),
        ('Permissions', {'fields': ('role', 'is_active', 'is_staff', 'is_superuser')}),
        ('Security', {'fields': ('password_changed_at', 'password_expiry_days', 
                                'force_password_change', 'session_timeout')}),
        ('Authentication', {'fields': ('last_login', 'last_login_attempt', 
                                      'failed_login_attempts', 'account_locked_until')}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'password1', 'password2', 'role'),
        }),
    )
    search_fields = ('email', 'first_name', 'last_name')
    ordering = ('email',)
    readonly_fields = ('last_login', 'last_login_attempt', 'failed_login_attempts', 
                      'account_locked_until')

class AuthLogAdmin(admin.ModelAdmin):
    list_display = ('username', 'ip_address', 'path', 'method', 'success', 'status_code', 'timestamp')
    list_filter = ('success', 'method', 'status_code')
    search_fields = ('username', 'ip_address', 'path')
    readonly_fields = ('username', 'ip_address', 'user_agent', 'path', 'method', 
                      'success', 'status_code', 'timestamp')

admin.site.register(User, UserAdmin)
admin.site.register(AuthLog, AuthLogAdmin)
