from django.contrib import admin
from .models import (
    ReportTemplate, GeneratedReport, ReportSchedule,
    DashboardWidget, UserDashboard, DashboardWidgetPosition,
    ReportShare
)


@admin.register(ReportTemplate)
class ReportTemplateAdmin(admin.ModelAdmin):
    list_display = ['name', 'report_type', 'creator', 'is_public', 'is_active', 'created_at']
    list_filter = ['report_type', 'is_public', 'is_active', 'created_at']
    search_fields = ['name', 'description']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        (None, {
            'fields': ('name', 'description', 'report_type', 'creator')
        }),
        ('Configuration', {
            'fields': ('filters', 'metrics', 'date_range', 'grouping'),
            'classes': ('collapse',)
        }),
        ('Settings', {
            'fields': ('is_public', 'is_active')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(GeneratedReport)
class GeneratedReportAdmin(admin.ModelAdmin):
    list_display = ['template', 'generated_by', 'status', 'created_at']
    list_filter = ['status', 'created_at']
    search_fields = ['template__name', 'generated_by__username']
    readonly_fields = ['created_at', 'updated_at', 'execution_time']
    
    fieldsets = (
        (None, {
            'fields': ('template', 'generated_by', 'status')
        }),
        ('Execution Details', {
            'fields': ('execution_time', 'error_message'),
            'classes': ('collapse',)
        }),
        ('Data', {
            'fields': ('data', 'summary_stats'),
            'classes': ('collapse',)
        }),
        ('Export Files', {
            'fields': ('csv_file_path', 'pdf_file_path'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(ReportSchedule)
class ReportScheduleAdmin(admin.ModelAdmin):
    list_display = ['name', 'template', 'frequency', 'is_active', 'last_run', 'next_run']
    list_filter = ['frequency', 'is_active', 'created_at']
    search_fields = ['name', 'template__name']
    readonly_fields = ['created_at', 'updated_at', 'last_run', 'next_run']
    
    fieldsets = (
        (None, {
            'fields': ('name', 'template', 'creator', 'frequency')
        }),
        ('Schedule Configuration', {
            'fields': ('scheduled_time', 'day_of_week', 'day_of_month', 'recipients')
        }),
        ('Status', {
            'fields': ('is_active', 'last_run', 'next_run')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(DashboardWidget)
class DashboardWidgetAdmin(admin.ModelAdmin):
    list_display = ['name', 'widget_type', 'size', 'creator', 'is_public', 'created_at']
    list_filter = ['widget_type', 'size', 'is_public', 'created_at']
    search_fields = ['name', 'data_source']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        (None, {
            'fields': ('name', 'widget_type', 'size', 'creator')
        }),
        ('Configuration', {
            'fields': ('data_source', 'filters', 'display_options')
        }),
        ('Position', {
            'fields': ('position_x', 'position_y')
        }),
        ('Settings', {
            'fields': ('is_public',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


class DashboardWidgetPositionInline(admin.TabularInline):
    model = DashboardWidgetPosition
    extra = 0


@admin.register(UserDashboard)
class UserDashboardAdmin(admin.ModelAdmin):
    list_display = ['user', 'name', 'refresh_interval', 'is_default', 'created_at']
    list_filter = ['is_default', 'created_at']
    search_fields = ['user__username', 'name']
    readonly_fields = ['created_at', 'updated_at']
    inlines = [DashboardWidgetPositionInline]
    
    fieldsets = (
        (None, {
            'fields': ('user', 'name')
        }),
        ('Settings', {
            'fields': ('refresh_interval', 'is_default')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(ReportShare)
class ReportShareAdmin(admin.ModelAdmin):
    list_display = ['report', 'shared_by', 'can_download', 'expires_at', 'access_count', 'created_at']
    list_filter = ['can_download', 'created_at', 'expires_at']
    search_fields = ['report__template__name', 'shared_by__username']
    readonly_fields = ['created_at', 'updated_at', 'access_count', 'last_accessed']
    filter_horizontal = ['shared_with_users']
    
    fieldsets = (
        (None, {
            'fields': ('report', 'shared_by')
        }),
        ('Recipients', {
            'fields': ('shared_with_users', 'external_emails')
        }),
        ('Settings', {
            'fields': ('can_download', 'expires_at', 'max_access_count')
        }),
        ('Access Tracking', {
            'fields': ('access_count', 'last_accessed'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
