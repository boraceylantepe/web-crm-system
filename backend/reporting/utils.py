import csv
import json
import io
from datetime import datetime
from django.http import HttpResponse
from django.template.loader import render_to_string
from django.conf import settings
import base64

class ReportExporter:
    """Utility class for exporting reports in various formats."""
    
    @staticmethod
    def export_to_csv(report_data, filename=None):
        """Export report data to CSV format."""
        if not filename:
            filename = f"report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
        
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        
        writer = csv.writer(response)
        
        # Write summary information
        if 'summary' in report_data:
            writer.writerow(['REPORT SUMMARY'])
            writer.writerow([])
            for key, value in report_data['summary'].items():
                writer.writerow([key.replace('_', ' ').title(), value])
            writer.writerow([])
        
        # Write time series data
        if 'sales_over_time' in report_data:
            writer.writerow(['SALES OVER TIME'])
            writer.writerow(['Period', 'Count', 'Total Amount', 'Average Amount'])
            for item in report_data['sales_over_time']:
                writer.writerow([
                    item.get('period', ''),
                    item.get('count', 0),
                    item.get('total_amount', 0),
                    item.get('avg_amount', 0)
                ])
            writer.writerow([])
        
        # Write status breakdown
        if 'sales_by_status' in report_data:
            writer.writerow(['SALES BY STATUS'])
            writer.writerow(['Status', 'Count', 'Total Amount'])
            for item in report_data['sales_by_status']:
                writer.writerow([
                    item.get('status', ''),
                    item.get('count', 0),
                    item.get('total_amount', 0)
                ])
            writer.writerow([])
        
        # Write top performers
        if 'top_performers' in report_data:
            writer.writerow(['TOP PERFORMERS'])
            writer.writerow(['Name', 'Total Sales', 'Total Amount', 'Won Sales'])
            for item in report_data['top_performers']:
                name = f"{item.get('assigned_to__first_name', '')} {item.get('assigned_to__last_name', '')}".strip()
                if not name:
                    name = item.get('assigned_to__username', '')
                writer.writerow([
                    name,
                    item.get('total_sales', 0),
                    item.get('total_amount', 0),
                    item.get('won_sales', 0)
                ])
        
        return response
    
    @staticmethod
    def prepare_chart_data_for_pdf(report_data):
        """Prepare chart data in a format suitable for PDF generation."""
        charts = []
        
        # Sales over time chart
        if 'sales_over_time' in report_data:
            charts.append({
                'title': 'Sales Over Time',
                'type': 'line',
                'data': {
                    'labels': [item.get('period', '') for item in report_data['sales_over_time']],
                    'datasets': [{
                        'label': 'Sales Count',
                        'data': [item.get('count', 0) for item in report_data['sales_over_time']],
                        'borderColor': '#007bff',
                        'backgroundColor': '#007bff20'
                    }]
                }
            })
        
        # Sales by status chart
        if 'sales_by_status' in report_data:
            charts.append({
                'title': 'Sales by Status',
                'type': 'pie',
                'data': {
                    'labels': [item.get('status', '') for item in report_data['sales_by_status']],
                    'datasets': [{
                        'data': [item.get('count', 0) for item in report_data['sales_by_status']],
                        'backgroundColor': ['#007bff', '#28a745', '#ffc107', '#dc3545', '#17a2b8']
                    }]
                }
            })
        
        return charts
    
    @staticmethod
    def generate_pdf_template_context(report, include_charts=True):
        """Generate context data for PDF template rendering."""
        context = {
            'report': report,
            'template': report.template,
            'generated_date': report.created_at,
            'data': report.data_dict,
            'summary': report.summary_stats_dict,
            'include_charts': include_charts,
        }
        
        if include_charts:
            context['charts'] = ReportExporter.prepare_chart_data_for_pdf(report.data_dict)
        
        return context


class ScheduledReportManager:
    """Manager for handling scheduled report generation."""
    
    @staticmethod
    def should_run_schedule(schedule):
        """Check if a schedule should run based on its configuration."""
        from django.utils import timezone
        now = timezone.now()
        
        if not schedule.is_active:
            return False
        
        if schedule.next_run and now < schedule.next_run:
            return False
        
        return True
    
    @staticmethod
    def calculate_next_run(schedule):
        """Calculate the next run time for a schedule."""
        from django.utils import timezone
        from datetime import timedelta
        
        now = timezone.now()
        
        if schedule.frequency == 'daily':
            next_run = now.replace(hour=schedule.scheduled_time.hour, 
                                 minute=schedule.scheduled_time.minute,
                                 second=0, microsecond=0)
            if next_run <= now:
                next_run += timedelta(days=1)
        
        elif schedule.frequency == 'weekly':
            days_ahead = schedule.day_of_week - now.weekday()
            if days_ahead <= 0:
                days_ahead += 7
            next_run = now + timedelta(days=days_ahead)
            next_run = next_run.replace(hour=schedule.scheduled_time.hour,
                                      minute=schedule.scheduled_time.minute,
                                      second=0, microsecond=0)
        
        elif schedule.frequency == 'monthly':
            next_run = now.replace(day=schedule.day_of_month,
                                 hour=schedule.scheduled_time.hour,
                                 minute=schedule.scheduled_time.minute,
                                 second=0, microsecond=0)
            if next_run <= now:
                if now.month == 12:
                    next_run = next_run.replace(year=now.year + 1, month=1)
                else:
                    next_run = next_run.replace(month=now.month + 1)
        
        else:  # quarterly
            months_ahead = 3 - (now.month % 3)
            if months_ahead == 3:
                months_ahead = 0
            target_month = now.month + months_ahead
            target_year = now.year
            if target_month > 12:
                target_month -= 12
                target_year += 1
            
            next_run = now.replace(year=target_year, month=target_month,
                                 day=schedule.day_of_month,
                                 hour=schedule.scheduled_time.hour,
                                 minute=schedule.scheduled_time.minute,
                                 second=0, microsecond=0)
        
        return next_run


class CacheManager:
    """Manager for handling analytics data caching."""
    
    @staticmethod
    def get_cache_key(user_id, report_type, params):
        """Generate a cache key for analytics data."""
        import hashlib
        params_str = json.dumps(params, sort_keys=True, default=str)
        key_data = f"{user_id}:{report_type}:{params_str}"
        return f"analytics:{hashlib.md5(key_data.encode()).hexdigest()}"
    
    @staticmethod
    def cache_analytics_data(key, data, timeout=300):
        """Cache analytics data with timeout."""
        from django.core.cache import cache
        cache.set(key, data, timeout)
    
    @staticmethod
    def get_cached_analytics_data(key):
        """Retrieve cached analytics data."""
        from django.core.cache import cache
        return cache.get(key) 