from django.db import models
from django.conf import settings
from django.utils import timezone
import json

# PostgreSQL JSONField import
from django.db.models import JSONField

class TimeStampedModel(models.Model):
    """
    Abstract base class that provides self-updating 'created_at' and 'updated_at' fields.
    """
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True

class ReportTemplate(TimeStampedModel):
    """
    Template for custom reports that users can create and reuse.
    """
    REPORT_TYPES = [
        ('sales_performance', 'Sales Performance'),
        ('customer_engagement', 'Customer Engagement'),
        ('task_completion', 'Task Completion'),
        ('conversion_ratios', 'Conversion Ratios'),
        ('user_activity', 'User Activity'),
        ('custom', 'Custom Report'),
    ]

    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    report_type = models.CharField(max_length=50, choices=REPORT_TYPES)
    creator = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='report_templates')
    
    # Store report configuration using PostgreSQL JSONField
    filters = JSONField(default=dict, help_text="Filters applied to the report")
    metrics = JSONField(default=list, help_text="List of metrics to include")
    date_range = JSONField(default=dict, help_text="Date range configuration")
    grouping = JSONField(default=dict, help_text="How to group the data")
    
    is_public = models.BooleanField(default=False, help_text="Available to all users")
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.name

    # Legacy property methods for backward compatibility
    @property
    def filters_dict(self):
        return self.filters

    @filters_dict.setter
    def filters_dict(self, value):
        self.filters = value

    @property
    def metrics_list(self):
        return self.metrics

    @metrics_list.setter
    def metrics_list(self, value):
        self.metrics = value

    @property
    def date_range_dict(self):
        return self.date_range

    @date_range_dict.setter
    def date_range_dict(self, value):
        self.date_range = value

    @property
    def grouping_dict(self):
        return self.grouping

    @grouping_dict.setter
    def grouping_dict(self, value):
        self.grouping = value


class GeneratedReport(TimeStampedModel):
    """
    Instances of generated reports from templates.
    """
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    ]

    template = models.ForeignKey(ReportTemplate, on_delete=models.CASCADE, related_name='generated_reports')
    generated_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='generated_reports')
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    # Report execution details
    execution_time = models.DurationField(null=True, blank=True)
    error_message = models.TextField(blank=True, null=True)
    
    # Generated data using PostgreSQL JSONField
    data = JSONField(default=dict, help_text="Generated report data")
    summary_stats = JSONField(default=dict, help_text="Summary statistics")
    
    # File paths for exports
    csv_file_path = models.CharField(max_length=500, blank=True, null=True)
    pdf_file_path = models.CharField(max_length=500, blank=True, null=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.template.name} - {self.created_at.strftime('%Y-%m-%d %H:%M')}"

    # Legacy property methods for backward compatibility
    @property
    def data_dict(self):
        return self.data

    @data_dict.setter
    def data_dict(self, value):
        self.data = value

    @property
    def summary_stats_dict(self):
        return self.summary_stats

    @summary_stats_dict.setter
    def summary_stats_dict(self, value):
        self.summary_stats = value


class ReportSchedule(TimeStampedModel):
    """
    Scheduled automatic report generation.
    """
    FREQUENCY_CHOICES = [
        ('daily', 'Daily'),
        ('weekly', 'Weekly'),
        ('monthly', 'Monthly'),
        ('quarterly', 'Quarterly'),
    ]

    template = models.ForeignKey(ReportTemplate, on_delete=models.CASCADE, related_name='schedules')
    creator = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='report_schedules')
    
    name = models.CharField(max_length=255)
    frequency = models.CharField(max_length=20, choices=FREQUENCY_CHOICES)
    
    # Schedule configuration
    scheduled_time = models.TimeField(help_text="Time of day to run the report")
    day_of_week = models.IntegerField(null=True, blank=True, help_text="Day of week for weekly reports (0=Monday)")
    day_of_month = models.IntegerField(null=True, blank=True, help_text="Day of month for monthly reports")
    
    # Recipients using PostgreSQL JSONField
    recipients = JSONField(default=list, help_text="List of email addresses to send reports to")
    
    # Status
    is_active = models.BooleanField(default=True)
    last_run = models.DateTimeField(null=True, blank=True)
    next_run = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} ({self.frequency})"

    # Legacy property methods for backward compatibility
    @property
    def recipients_list(self):
        return self.recipients

    @recipients_list.setter
    def recipients_list(self, value):
        self.recipients = value


class DashboardWidget(TimeStampedModel):
    """
    Individual widgets for dashboard customization.
    """
    WIDGET_TYPES = [
        ('line_chart', 'Line Chart'),
        ('bar_chart', 'Bar Chart'),
        ('pie_chart', 'Pie Chart'),
        ('donut_chart', 'Donut Chart'),
        ('metric_card', 'Metric Card'),
        ('progress_bar', 'Progress Bar'),
        ('table', 'Data Table'),
    ]

    SIZE_CHOICES = [
        ('small', 'Small (1x1)'),
        ('medium', 'Medium (2x1)'),
        ('large', 'Large (2x2)'),
        ('xlarge', 'Extra Large (3x2)'),
    ]

    name = models.CharField(max_length=255)
    widget_type = models.CharField(max_length=50, choices=WIDGET_TYPES)
    size = models.CharField(max_length=20, choices=SIZE_CHOICES, default='medium')
    
    # Widget configuration using PostgreSQL JSONField
    data_source = models.CharField(max_length=100, help_text="API endpoint or data source")
    filters = JSONField(default=dict, help_text="Widget filters")
    display_options = JSONField(default=dict, help_text="Chart colors, labels, etc.")
    
    # Position on grid
    position_x = models.IntegerField(default=0)
    position_y = models.IntegerField(default=0)
    
    creator = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='dashboard_widgets')
    is_public = models.BooleanField(default=False)

    class Meta:
        ordering = ['position_y', 'position_x']

    def __str__(self):
        return self.name

    # Legacy property methods for backward compatibility
    @property
    def filters_dict(self):
        return self.filters

    @filters_dict.setter
    def filters_dict(self, value):
        self.filters = value

    @property
    def display_options_dict(self):
        return self.display_options

    @display_options_dict.setter
    def display_options_dict(self, value):
        self.display_options = value


class UserDashboard(TimeStampedModel):
    """
    User's personalized dashboard configuration.
    """
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='dashboard')
    name = models.CharField(max_length=255, default="My Dashboard")
    widgets = models.ManyToManyField(DashboardWidget, through='DashboardWidgetPosition')
    
    # Dashboard settings
    refresh_interval = models.IntegerField(default=300, help_text="Auto-refresh interval in seconds")
    is_default = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.user.username}'s Dashboard"


class DashboardWidgetPosition(models.Model):
    """
    Through model for widget positions on user dashboards.
    """
    dashboard = models.ForeignKey(UserDashboard, on_delete=models.CASCADE)
    widget = models.ForeignKey(DashboardWidget, on_delete=models.CASCADE)
    position_x = models.IntegerField(default=0)
    position_y = models.IntegerField(default=0)
    size_override = models.CharField(max_length=20, blank=True, null=True)
    
    class Meta:
        unique_together = ['dashboard', 'widget']
        ordering = ['position_y', 'position_x']


class ReportShare(TimeStampedModel):
    """
    Sharing reports with other users or external recipients.
    """
    report = models.ForeignKey(GeneratedReport, on_delete=models.CASCADE, related_name='shares')
    shared_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='shared_reports')
    
    # Share with specific users or email addresses
    shared_with_users = models.ManyToManyField(settings.AUTH_USER_MODEL, blank=True, related_name='received_reports')
    external_emails = JSONField(default=list, help_text="External email addresses")
    
    # Share settings
    can_download = models.BooleanField(default=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    access_count = models.IntegerField(default=0)
    max_access_count = models.IntegerField(null=True, blank=True)
    
    # Access tracking
    last_accessed = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Share: {self.report.template.name}"

    # Legacy property methods for backward compatibility
    @property
    def external_emails_list(self):
        return self.external_emails

    @external_emails_list.setter
    def external_emails_list(self, value):
        self.external_emails = value
