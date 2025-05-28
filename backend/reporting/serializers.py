from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import (
    ReportTemplate, GeneratedReport, ReportSchedule,
    DashboardWidget, UserDashboard, DashboardWidgetPosition,
    ReportShare
)

User = get_user_model()


class UserBasicSerializer(serializers.ModelSerializer):
    """Basic user serializer for nested representations."""
    full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'full_name', 'email']
    
    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip() or obj.username


class ReportTemplateSerializer(serializers.ModelSerializer):
    creator = UserBasicSerializer(read_only=True)
    filters = serializers.JSONField(source='filters_dict')
    metrics = serializers.JSONField(source='metrics_list')
    date_range = serializers.JSONField(source='date_range_dict')
    grouping = serializers.JSONField(source='grouping_dict')
    
    class Meta:
        model = ReportTemplate
        fields = [
            'id', 'name', 'description', 'report_type', 'creator',
            'filters', 'metrics', 'date_range', 'grouping',
            'is_public', 'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['creator', 'created_at', 'updated_at']
    
    def create(self, validated_data):
        # Extract JSON fields
        filters_dict = validated_data.pop('filters_dict', {})
        metrics_list = validated_data.pop('metrics_list', [])
        date_range_dict = validated_data.pop('date_range_dict', {})
        grouping_dict = validated_data.pop('grouping_dict', {})
        
        validated_data['creator'] = self.context['request'].user
        instance = super().create(validated_data)
        
        # Set JSON properties
        instance.filters_dict = filters_dict
        instance.metrics_list = metrics_list
        instance.date_range_dict = date_range_dict
        instance.grouping_dict = grouping_dict
        instance.save()
        
        return instance

    def update(self, instance, validated_data):
        # Extract JSON fields
        filters_dict = validated_data.pop('filters_dict', None)
        metrics_list = validated_data.pop('metrics_list', None)
        date_range_dict = validated_data.pop('date_range_dict', None)
        grouping_dict = validated_data.pop('grouping_dict', None)
        
        instance = super().update(instance, validated_data)
        
        # Update JSON properties if provided
        if filters_dict is not None:
            instance.filters_dict = filters_dict
        if metrics_list is not None:
            instance.metrics_list = metrics_list
        if date_range_dict is not None:
            instance.date_range_dict = date_range_dict
        if grouping_dict is not None:
            instance.grouping_dict = grouping_dict
            
        instance.save()
        return instance


class GeneratedReportSerializer(serializers.ModelSerializer):
    template = ReportTemplateSerializer(read_only=True)
    generated_by = UserBasicSerializer(read_only=True)
    template_id = serializers.IntegerField(write_only=True)
    data = serializers.JSONField(source='data_dict', read_only=True)
    summary_stats = serializers.JSONField(source='summary_stats_dict', read_only=True)
    
    class Meta:
        model = GeneratedReport
        fields = [
            'id', 'template', 'template_id', 'generated_by', 'status',
            'execution_time', 'error_message', 'data', 'summary_stats',
            'csv_file_path', 'pdf_file_path', 'created_at', 'updated_at'
        ]
        read_only_fields = ['generated_by', 'created_at', 'updated_at']
    
    def create(self, validated_data):
        validated_data['generated_by'] = self.context['request'].user
        return super().create(validated_data)


class ReportScheduleSerializer(serializers.ModelSerializer):
    template = ReportTemplateSerializer(read_only=True)
    creator = UserBasicSerializer(read_only=True)
    template_id = serializers.IntegerField(write_only=True)
    recipients = serializers.JSONField(source='recipients_list')
    
    class Meta:
        model = ReportSchedule
        fields = [
            'id', 'template', 'template_id', 'creator', 'name', 'frequency',
            'scheduled_time', 'day_of_week', 'day_of_month', 'recipients',
            'is_active', 'last_run', 'next_run', 'created_at', 'updated_at'
        ]
        read_only_fields = ['creator', 'last_run', 'next_run', 'created_at', 'updated_at']
    
    def create(self, validated_data):
        recipients_list = validated_data.pop('recipients_list', [])
        validated_data['creator'] = self.context['request'].user
        instance = super().create(validated_data)
        instance.recipients_list = recipients_list
        instance.save()
        return instance
    
    def update(self, instance, validated_data):
        recipients_list = validated_data.pop('recipients_list', None)
        instance = super().update(instance, validated_data)
        if recipients_list is not None:
            instance.recipients_list = recipients_list
            instance.save()
        return instance
    
    def validate_day_of_week(self, value):
        if value is not None and (value < 0 or value > 6):
            raise serializers.ValidationError("Day of week must be between 0 (Monday) and 6 (Sunday)")
        return value
    
    def validate_day_of_month(self, value):
        if value is not None and (value < 1 or value > 31):
            raise serializers.ValidationError("Day of month must be between 1 and 31")
        return value


class DashboardWidgetSerializer(serializers.ModelSerializer):
    creator = UserBasicSerializer(read_only=True)
    filters = serializers.JSONField(source='filters_dict')
    display_options = serializers.JSONField(source='display_options_dict')
    
    class Meta:
        model = DashboardWidget
        fields = [
            'id', 'name', 'widget_type', 'size', 'data_source', 'filters',
            'display_options', 'position_x', 'position_y', 'creator',
            'is_public', 'created_at', 'updated_at'
        ]
        read_only_fields = ['creator', 'created_at', 'updated_at']
    
    def create(self, validated_data):
        filters_dict = validated_data.pop('filters_dict', {})
        display_options_dict = validated_data.pop('display_options_dict', {})
        
        validated_data['creator'] = self.context['request'].user
        instance = super().create(validated_data)
        
        instance.filters_dict = filters_dict
        instance.display_options_dict = display_options_dict
        instance.save()
        
        return instance

    def update(self, instance, validated_data):
        filters_dict = validated_data.pop('filters_dict', None)
        display_options_dict = validated_data.pop('display_options_dict', None)
        
        instance = super().update(instance, validated_data)
        
        if filters_dict is not None:
            instance.filters_dict = filters_dict
        if display_options_dict is not None:
            instance.display_options_dict = display_options_dict
            
        instance.save()
        return instance


class DashboardWidgetPositionSerializer(serializers.ModelSerializer):
    widget = DashboardWidgetSerializer(read_only=True)
    widget_id = serializers.IntegerField(write_only=True)
    
    class Meta:
        model = DashboardWidgetPosition
        fields = [
            'id', 'widget', 'widget_id', 'position_x', 'position_y', 'size_override'
        ]


class UserDashboardSerializer(serializers.ModelSerializer):
    user = UserBasicSerializer(read_only=True)
    widget_positions = DashboardWidgetPositionSerializer(
        source='dashboardwidgetposition_set',
        many=True,
        read_only=True
    )
    
    class Meta:
        model = UserDashboard
        fields = [
            'id', 'user', 'name', 'refresh_interval', 'is_default',
            'widget_positions', 'created_at', 'updated_at'
        ]
        read_only_fields = ['user', 'created_at', 'updated_at']
    
    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class ReportShareSerializer(serializers.ModelSerializer):
    report = GeneratedReportSerializer(read_only=True)
    shared_by = UserBasicSerializer(read_only=True)
    shared_with_users = UserBasicSerializer(many=True, read_only=True)
    report_id = serializers.IntegerField(write_only=True)
    shared_with_user_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False
    )
    
    class Meta:
        model = ReportShare
        fields = [
            'id', 'report', 'report_id', 'shared_by', 'shared_with_users',
            'shared_with_user_ids', 'external_emails', 'can_download',
            'expires_at', 'access_count', 'max_access_count',
            'last_accessed', 'created_at', 'updated_at'
        ]
        read_only_fields = ['shared_by', 'access_count', 'last_accessed', 'created_at', 'updated_at']
    
    def create(self, validated_data):
        shared_with_user_ids = validated_data.pop('shared_with_user_ids', [])
        validated_data['shared_by'] = self.context['request'].user
        
        instance = super().create(validated_data)
        
        if shared_with_user_ids:
            users = User.objects.filter(id__in=shared_with_user_ids)
            instance.shared_with_users.set(users)
        
        return instance


class AnalyticsDataSerializer(serializers.Serializer):
    """Serializer for analytics data responses."""
    report_type = serializers.CharField()
    date_range = serializers.DictField(required=False)
    grouping = serializers.CharField(default='month')
    data = serializers.DictField()
    generated_at = serializers.DateTimeField()


class DashboardKPISerializer(serializers.Serializer):
    """Serializer for dashboard KPI data."""
    sales = serializers.DictField()
    tasks = serializers.DictField()
    customers = serializers.DictField()
    generated_at = serializers.DateTimeField()


class ReportExportSerializer(serializers.Serializer):
    """Serializer for report export requests."""
    report_id = serializers.IntegerField()
    export_format = serializers.ChoiceField(choices=['csv', 'pdf'])
    include_charts = serializers.BooleanField(default=True, required=False)


class CustomReportRequestSerializer(serializers.Serializer):
    """Serializer for custom report generation requests."""
    report_type = serializers.ChoiceField(choices=[
        'sales_performance', 'customer_engagement', 'task_completion',
        'conversion_ratios', 'user_activity'
    ])
    date_range = serializers.DictField(required=False)
    grouping = serializers.ChoiceField(
        choices=['day', 'week', 'month'],
        default='month'
    )
    filters = serializers.DictField(default=dict)
    user_id = serializers.IntegerField(required=False)
    
    def validate_date_range(self, value):
        if value and ('start' not in value or 'end' not in value):
            raise serializers.ValidationError(
                "Date range must include both 'start' and 'end' dates"
            )
        return value 