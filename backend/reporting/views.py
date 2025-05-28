from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.http import HttpResponse, Http404
from django.shortcuts import get_object_or_404
from django.db import models
import csv
import json
from datetime import datetime

from .models import (
    ReportTemplate, GeneratedReport, ReportSchedule,
    DashboardWidget, UserDashboard, DashboardWidgetPosition,
    ReportShare
)
from .serializers import (
    ReportTemplateSerializer, GeneratedReportSerializer, ReportScheduleSerializer,
    DashboardWidgetSerializer, UserDashboardSerializer, DashboardWidgetPositionSerializer,
    ReportShareSerializer, AnalyticsDataSerializer, DashboardKPISerializer,
    CustomReportRequestSerializer, ReportExportSerializer
)
from .analytics import AnalyticsService
from .utils import ReportExporter, CacheManager

User = get_user_model()


class ReportTemplateViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing report templates.
    """
    serializer_class = ReportTemplateSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        # Users can see their own templates and public templates
        return ReportTemplate.objects.filter(
            models.Q(creator=user) | models.Q(is_public=True)
        ).filter(is_active=True)

    @action(detail=True, methods=['post'])
    def generate(self, request, pk=None):
        """Generate a report from this template."""
        try:
            template = self.get_object()
            
            # Create a generated report instance
            report_data = {
                'template_id': template.id,
                'status': 'processing'
            }
            
            serializer = GeneratedReportSerializer(data=report_data, context={'request': request})
            if serializer.is_valid():
                report = serializer.save()
                
                try:
                    # Generate the actual report data
                    analytics_data = self._generate_report_data(template, request.user)
                    
                    # Update the report with generated data
                    report.data_dict = analytics_data
                    report.status = 'completed'
                    report.summary_stats_dict = self._calculate_summary_stats(analytics_data)
                    report.save()
                    
                    return Response(GeneratedReportSerializer(report).data)
                except Exception as e:
                    report.status = 'failed'
                    report.error_message = str(e)
                    report.save()
                    return Response({'error': f'Report generation failed: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            else:
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            return Response({'error': f'Template generation failed: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['post'])
    def duplicate(self, request, pk=None):
        """Duplicate an existing template."""
        template = self.get_object()
        
        # Create a copy with modified name
        new_template_data = {
            'name': f"{template.name} (Copy)",
            'description': template.description,
            'report_type': template.report_type,
            'filters': template.filters_dict,
            'metrics': template.metrics_list,
            'date_range': template.date_range_dict,
            'grouping': template.grouping_dict,
            'is_public': False  # Copies are private by default
        }
        
        serializer = ReportTemplateSerializer(data=new_template_data, context={'request': request})
        if serializer.is_valid():
            new_template = serializer.save()
            return Response(ReportTemplateSerializer(new_template).data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def _generate_report_data(self, template, user):
        """Generate report data based on template configuration."""
        try:
            date_range = template.date_range_dict if template.date_range_dict else None
            
            grouping = template.grouping_dict.get('period', 'month') if template.grouping_dict else 'month'
            
            # Filter by user if specified in template filters
            target_user = None
            if template.filters_dict.get('user_id'):
                try:
                    target_user = User.objects.get(id=template.filters_dict['user_id'])
                except User.DoesNotExist:
                    # If the specified user doesn't exist, use None and fall back to current user
                    target_user = None
            
            if template.report_type == 'sales_performance':
                return AnalyticsService.get_sales_performance_data(user, date_range, grouping, target_user=target_user)
            elif template.report_type == 'customer_engagement':
                return AnalyticsService.get_customer_engagement_data(user, date_range, grouping)
            elif template.report_type == 'task_completion':
                return AnalyticsService.get_task_completion_data(user, date_range, grouping, target_user=target_user)
            elif template.report_type == 'conversion_ratios':
                return AnalyticsService.get_conversion_ratios(user, date_range)
            elif template.report_type == 'user_activity':
                return AnalyticsService.get_user_activity_data(date_range, grouping)
            else:
                error_msg = f"Unknown report type: {template.report_type}"
                raise ValueError(error_msg)
                
        except Exception as e:
            raise

    def _calculate_summary_stats(self, data):
        """Calculate summary statistics from report data."""
        summary = {}
        if 'summary' in data:
            summary = data['summary']
        
        # Add generation metadata
        summary['generated_at'] = timezone.now().isoformat()
        summary['data_points'] = len(data.get('sales_over_time', []))
        
        return summary


class GeneratedReportViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing generated reports.
    """
    serializer_class = GeneratedReportSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return GeneratedReport.objects.filter(generated_by=self.request.user)

    @action(detail=True, methods=['get'])
    def export_csv(self, request, pk=None):
        """Export report as CSV."""
        report = self.get_object()
        
        if report.status != 'completed':
            return Response({'error': 'Report is not completed'}, status=status.HTTP_400_BAD_REQUEST)
        
        filename = f"{report.template.name}_{report.created_at.strftime('%Y%m%d_%H%M%S')}.csv"
        return ReportExporter.export_to_csv(report.data_dict, filename)

    @action(detail=True, methods=['post'])
    def share(self, request, pk=None):
        """Share a report with other users."""
        report = self.get_object()
        
        share_data = {
            'report_id': report.id,
            **request.data
        }
        
        serializer = ReportShareSerializer(data=share_data, context={'request': request})
        if serializer.is_valid():
            share = serializer.save()
            return Response(ReportShareSerializer(share).data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['delete'])
    def delete_report(self, request, pk=None):
        """Delete a generated report."""
        report = self.get_object()
        report.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class AnalyticsViewSet(viewsets.ViewSet):
    """
    ViewSet for analytics data endpoints with enhanced caching.
    """
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['get'])
    def dashboard_kpis(self, request):
        """Get KPI data for dashboard widgets with caching."""
        try:
            # Check cache first
            cache_key = CacheManager.get_cache_key(
                request.user.id, 
                'dashboard_kpis', 
                {}
            )
            cached_data = CacheManager.get_cached_analytics_data(cache_key)
            
            if cached_data:
                return Response(cached_data)
            
            # Generate fresh data
            kpis = AnalyticsService.get_dashboard_kpis(request.user)
            response_data = {
                'sales': kpis['sales'],
                'tasks': kpis['tasks'],
                'customers': kpis['customers'],
                'generated_at': timezone.now()
            }
            
            # Cache the result for 5 minutes
            CacheManager.cache_analytics_data(cache_key, response_data, 300)
            
            return Response(response_data)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['get'])
    def sales_performance(self, request):
        """Get sales performance data with caching."""
        date_range = self._parse_date_range(request.query_params)
        grouping = request.query_params.get('grouping', 'month')
        user_id = request.query_params.get('user_id')
        
        # For regular users, they can only see their own data
        if user_id and not request.user.is_staff:
            if str(request.user.id) != str(user_id):
                return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        # Check cache
        cache_params = {'date_range': date_range, 'grouping': grouping}
        if user_id:
            cache_params['user_id'] = user_id
            
        cache_key = CacheManager.get_cache_key(
            request.user.id,
            'sales_performance',
            cache_params
        )
        cached_data = CacheManager.get_cached_analytics_data(cache_key)
        
        if cached_data:
            return Response(cached_data)
        
        # Generate fresh data
        target_user = None
        if user_id:
            try:
                target_user = User.objects.get(id=user_id)
            except User.DoesNotExist:
                return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        
        data = AnalyticsService.get_sales_performance_data(
            request.user, 
            date_range, 
            grouping, 
            target_user=target_user
        )
        
        # Cache for 10 minutes
        CacheManager.cache_analytics_data(cache_key, data, 600)
        
        return Response(data)

    @action(detail=False, methods=['get'])
    def customer_engagement(self, request):
        """Get customer engagement data with caching."""
        date_range = self._parse_date_range(request.query_params)
        grouping = request.query_params.get('grouping', 'month')
        
        cache_key = CacheManager.get_cache_key(
            request.user.id,
            'customer_engagement',
            {'date_range': date_range, 'grouping': grouping}
        )
        cached_data = CacheManager.get_cached_analytics_data(cache_key)
        
        if cached_data:
            return Response(cached_data)
        
        data = AnalyticsService.get_customer_engagement_data(request.user, date_range, grouping)
        CacheManager.cache_analytics_data(cache_key, data, 600)
        
        return Response(data)

    @action(detail=False, methods=['get'])
    def task_completion(self, request):
        """Get task completion data with caching."""
        date_range = self._parse_date_range(request.query_params)
        grouping = request.query_params.get('grouping', 'month')
        user_id = request.query_params.get('user_id')
        
        # For regular users, they can only see their own data
        if user_id and not request.user.is_staff:
            if str(request.user.id) != str(user_id):
                return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        cache_params = {'date_range': date_range, 'grouping': grouping}
        if user_id:
            cache_params['user_id'] = user_id
            
        cache_key = CacheManager.get_cache_key(
            request.user.id,
            'task_completion',
            cache_params
        )
        cached_data = CacheManager.get_cached_analytics_data(cache_key)
        
        if cached_data:
            return Response(cached_data)
        
        target_user = None
        if user_id:
            try:
                target_user = User.objects.get(id=user_id)
            except User.DoesNotExist:
                return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        
        data = AnalyticsService.get_task_completion_data(
            request.user, 
            date_range, 
            grouping, 
            target_user=target_user
        )
        CacheManager.cache_analytics_data(cache_key, data, 600)
        
        return Response(data)

    @action(detail=False, methods=['get'])
    def conversion_ratios(self, request):
        """Get conversion ratio data with caching."""
        date_range = self._parse_date_range(request.query_params)
        
        cache_key = CacheManager.get_cache_key(
            request.user.id,
            'conversion_ratios',
            {'date_range': date_range}
        )
        cached_data = CacheManager.get_cached_analytics_data(cache_key)
        
        if cached_data:
            return Response(cached_data)
        
        data = AnalyticsService.get_conversion_ratios(request.user, date_range)
        CacheManager.cache_analytics_data(cache_key, data, 600)
        
        return Response(data)

    @action(detail=False, methods=['get'])
    def user_activity(self, request):
        """Get user activity data (for managers) with caching."""
        if not request.user.is_staff:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        date_range = self._parse_date_range(request.query_params)
        grouping = request.query_params.get('grouping', 'month')
        
        cache_key = CacheManager.get_cache_key(
            'all_users',
            'user_activity',
            {'date_range': date_range, 'grouping': grouping}
        )
        cached_data = CacheManager.get_cached_analytics_data(cache_key)
        
        if cached_data:
            return Response(cached_data)
        
        data = AnalyticsService.get_user_activity_data(date_range, grouping)
        CacheManager.cache_analytics_data(cache_key, data, 900)  # Cache for 15 minutes
        
        return Response(data)

    @action(detail=False, methods=['post'])
    def clear_cache(self, request):
        """Clear analytics cache for the current user."""
        try:
            from django.core.cache import cache
            
            # For database cache, we need to clear specific known cache keys
            # instead of trying to iterate through all keys
            cache_prefixes = [
                'dashboard_kpis',
                'sales_performance', 
                'customer_engagement',
                'task_completion',
                'conversion_ratios'
            ]
            
            user_id = request.user.id
            cleared_keys = []
            
            # Clear user-specific cache keys
            for prefix in cache_prefixes:
                # Try different variations of cache keys that might exist
                possible_keys = [
                    f"analytics:{user_id}:{prefix}:",
                    f"analytics:{user_id}:{prefix}:{{}}",
                    f"analytics:{user_id}:{prefix}:*",
                ]
                
                for key_pattern in possible_keys:
                    try:
                        cache.delete(key_pattern)
                        cleared_keys.append(key_pattern)
                    except:
                        pass  # Key might not exist, which is fine
            
            # Also clear some common cache keys that might exist
            common_keys = [
                f"analytics:{user_id}:dashboard_kpis:",
                f"analytics:all_users:user_activity:",
            ]
            
            for key in common_keys:
                try:
                    cache.delete(key)
                    cleared_keys.append(key)
                except:
                    pass
            
            # Alternative approach: Use cache versioning to effectively clear cache
            # This increments the cache version, making old cached data inaccessible
            from django.core.cache.utils import make_key
            from django.conf import settings
            
            # Try to clear using cache.clear() if available (works with some backends)
            try:
                if hasattr(cache, 'clear'):
                    cache.clear()
                    return Response({
                        'message': 'All cache cleared successfully',
                        'method': 'cache.clear()'
                    })
            except:
                pass
            
            return Response({
                'message': 'Cache clearing attempted',
                'cleared_keys': len(cleared_keys),
                'method': 'individual_key_deletion'
            })
            
        except Exception as e:
            # If cache clearing fails, log the error but don't fail the request
            import logging
            logger = logging.getLogger(__name__)
            logger.warning(f"Cache clearing failed for user {request.user.id}: {str(e)}")
            
            return Response({
                'message': 'Cache clearing completed with warnings',
                'error': str(e)
            }, status=200)  # Still return 200 since this is not critical

    def _parse_date_range(self, params):
        """Parse date range from query parameters."""
        start_date = params.get('start_date')
        end_date = params.get('end_date')
        
        if start_date and end_date:
            try:
                return {
                    'start': datetime.fromisoformat(start_date.replace('Z', '+00:00')),
                    'end': datetime.fromisoformat(end_date.replace('Z', '+00:00'))
                }
            except ValueError:
                return None
        return None


class ReportScheduleViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing report schedules.
    """
    serializer_class = ReportScheduleSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return ReportSchedule.objects.filter(creator=self.request.user)

    @action(detail=True, methods=['post'])
    def toggle_active(self, request, pk=None):
        """Toggle schedule active status."""
        schedule = self.get_object()
        schedule.is_active = not schedule.is_active
        
        if schedule.is_active:
            from .utils import ScheduledReportManager
            schedule.next_run = ScheduledReportManager.calculate_next_run(schedule)
        else:
            schedule.next_run = None
        
        schedule.save()
        return Response(ReportScheduleSerializer(schedule).data)

    @action(detail=True, methods=['post'])
    def run_now(self, request, pk=None):
        """Manually trigger a scheduled report."""
        schedule = self.get_object()
        
        try:
            # Generate report from template
            report_data = {
                'template_id': schedule.template.id,
                'status': 'processing'
            }
            
            serializer = GeneratedReportSerializer(data=report_data, context={'request': request})
            if serializer.is_valid():
                report = serializer.save()
                
                # Use template generation logic
                template_viewset = ReportTemplateViewSet()
                analytics_data = template_viewset._generate_report_data(schedule.template, request.user)
                
                report.data_dict = analytics_data
                report.status = 'completed'
                report.summary_stats_dict = template_viewset._calculate_summary_stats(analytics_data)
                report.save()
                
                # Update schedule last run time
                schedule.last_run = timezone.now()
                schedule.save()
                
                return Response({
                    'message': 'Report generated successfully',
                    'report_id': report.id
                })
            
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR) 