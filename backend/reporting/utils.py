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
    def export_to_csv(report_data, filename=None, report_name=None, report_type=None):
        """Export report data to CSV format as proper tabular data."""
        if not filename:
            filename = f"report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
        
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        
        writer = csv.writer(response)
        
        # Helper function to format currency
        def format_currency(amount):
            if isinstance(amount, (int, float)):
                return f"${amount:,.2f}"
            return str(amount)
        
        # Helper function to format numbers
        def format_number(num):
            if isinstance(num, (int, float)):
                return f"{num:,}"
            return str(num)
        
        # Helper function to format percentage
        def format_percentage(value):
            if isinstance(value, (int, float)):
                return f"{value:.1f}%"
            return str(value)
        
        # Helper function to format dates
        def format_date(date_str):
            if not date_str:
                return ''
            try:
                from dateutil import parser
                date_obj = parser.parse(str(date_str))
                return date_obj.strftime('%Y-%m-%d')
            except:
                return str(date_str)
        
        # Report Header Information
        writer.writerow(['Report Information', '', '', ''])
        writer.writerow(['Report Name', report_name or 'Unnamed Report', '', ''])
        writer.writerow(['Report Type', (report_type.replace('_', ' ').title() if report_type else 'Unknown'), '', ''])
        writer.writerow(['Generated On', datetime.now().strftime('%Y-%m-%d %H:%M:%S'), '', ''])
        writer.writerow(['', '', '', ''])  # Empty row for separation
        
        # Executive Summary Table
        if 'summary' in report_data:
            writer.writerow(['EXECUTIVE SUMMARY', '', '', ''])
            writer.writerow(['Metric', 'Value', '', ''])
            
            summary = report_data['summary']
            
            for key, value in summary.items():
                label = key.replace('_', ' ').title()
                
                if 'amount' in key.lower() or 'revenue' in key.lower():
                    formatted_value = format_currency(value)
                elif 'rate' in key.lower() or 'percentage' in key.lower():
                    formatted_value = format_percentage(value)
                elif 'count' in key.lower() or 'sales' in key.lower() or 'customers' in key.lower() or 'tasks' in key.lower():
                    formatted_value = format_number(value)
                else:
                    formatted_value = str(value)
                
                writer.writerow([label, formatted_value, '', ''])
            
            writer.writerow(['', '', '', ''])  # Empty row for separation
        
        # Time Series Data Tables
        time_series_keys = ['sales_over_time', 'completion_over_time', 'acquisition_over_time']
        for key in time_series_keys:
            if key in report_data and report_data[key]:
                if key == 'sales_over_time':
                    title = 'SALES PERFORMANCE OVER TIME'
                    headers = ['Period', 'Sales Count', 'Total Revenue', 'Average Deal Size']
                elif key == 'completion_over_time':
                    title = 'TASK COMPLETION OVER TIME'
                    headers = ['Period', 'Completed Tasks', 'Total Tasks', 'Completion Rate']
                elif key == 'acquisition_over_time':
                    title = 'CUSTOMER ACQUISITION OVER TIME'
                    headers = ['Period', 'New Customers', 'Total Customers', '']
                
                # Write section title
                writer.writerow([title, '', '', ''])
                writer.writerow(headers)
                
                for item in report_data[key]:
                    row_data = [format_date(item.get('period', ''))]
                    
                    if key == 'sales_over_time':
                        row_data.extend([
                            format_number(item.get('count', 0)),
                            format_currency(item.get('total_amount', 0)),
                            format_currency(item.get('avg_amount', 0))
                        ])
                    elif key == 'completion_over_time':
                        row_data.extend([
                            format_number(item.get('completed', 0)),
                            format_number(item.get('total', 0)),
                            format_percentage(item.get('completion_rate', 0))
                        ])
                    elif key == 'acquisition_over_time':
                        row_data.extend([
                            format_number(item.get('new_customers', 0)),
                            format_number(item.get('total_customers', 0)),
                            ''
                        ])
                    
                    writer.writerow(row_data)
                
                writer.writerow(['', '', '', ''])  # Empty row for separation
        
        # Status Breakdown Tables
        status_keys = ['sales_by_status', 'task_by_status', 'customer_status']
        for key in status_keys:
            if key in report_data and report_data[key]:
                if key == 'sales_by_status':
                    title = 'SALES BY STATUS'
                    headers = ['Status', 'Count', 'Total Revenue', 'Percentage']
                elif key == 'task_by_status':
                    title = 'TASKS BY STATUS'
                    headers = ['Status', 'Count', 'Percentage', '']
                elif key == 'customer_status':
                    title = 'CUSTOMERS BY STATUS'
                    headers = ['Status', 'Count', 'Percentage', '']
                
                writer.writerow([title, '', '', ''])
                writer.writerow(headers)
                
                total_count = sum(item.get('count', 0) for item in report_data[key])
                
                for item in report_data[key]:
                    count = item.get('count', 0)
                    percentage = (count / total_count * 100) if total_count > 0 else 0
                    
                    row_data = [
                        item.get('status', '').title(),
                        format_number(count)
                    ]
                    
                    if key == 'sales_by_status':
                        row_data.extend([
                            format_currency(item.get('total_amount', 0)),
                            format_percentage(percentage)
                        ])
                    else:
                        row_data.extend([
                            format_percentage(percentage),
                            ''
                        ])
                    
                    writer.writerow(row_data)
                
                writer.writerow(['', '', '', ''])  # Empty row for separation
        
        # Priority Breakdown Tables
        priority_keys = ['sales_by_priority', 'task_by_priority']
        for key in priority_keys:
            if key in report_data and report_data[key]:
                writer.writerow(['BREAKDOWN BY PRIORITY', '', '', ''])
                writer.writerow(['Priority', 'Count', 'Percentage', ''])
                
                total_count = sum(item.get('count', 0) for item in report_data[key])
                
                for item in report_data[key]:
                    count = item.get('count', 0)
                    percentage = (count / total_count * 100) if total_count > 0 else 0
                    
                    writer.writerow([
                        item.get('priority', '').title(),
                        format_number(count),
                        format_percentage(percentage),
                        ''
                    ])
                
                writer.writerow(['', '', '', ''])  # Empty row for separation
        
        # Top Performers Table
        if 'top_performers' in report_data and report_data['top_performers']:
            writer.writerow(['TOP PERFORMERS', '', '', ''])
            writer.writerow(['Name', 'Total Sales', 'Total Revenue', 'Won Sales', 'Win Rate'])
            
            for item in report_data['top_performers']:
                name = f"{item.get('assigned_to__first_name', '')} {item.get('assigned_to__last_name', '')}".strip()
                if not name:
                    name = item.get('assigned_to__username', 'Unknown')
                
                total_sales = item.get('total_sales', 0)
                won_sales = item.get('won_sales', 0)
                win_rate = (won_sales / total_sales * 100) if total_sales > 0 else 0
                
                writer.writerow([
                    name,
                    format_number(total_sales),
                    format_currency(item.get('total_amount', 0)),
                    format_number(won_sales),
                    format_percentage(win_rate)
                ])
            
            writer.writerow(['', '', '', '', ''])  # Empty row for separation
        
        # User Performance Table
        if 'users' in report_data and report_data['users']:
            # Determine headers based on data type
            sample_user = report_data['users'][0]
            headers = ['User Name']
            
            if 'total_sales' in sample_user:
                writer.writerow(['INDIVIDUAL USER PERFORMANCE - SALES', '', '', '', ''])
                headers.extend(['Total Sales', 'Total Revenue', 'Won Sales', 'Win Rate'])
            elif 'total_tasks' in sample_user:
                writer.writerow(['INDIVIDUAL USER PERFORMANCE - TASKS', '', '', '', ''])
                headers.extend(['Total Tasks', 'Completed Tasks', 'Completion Rate', ''])
            
            writer.writerow(headers)
            
            for user in report_data['users']:
                name = f"{user.get('first_name', '')} {user.get('last_name', '')}".strip()
                if not name:
                    name = user.get('username', 'Unknown')
                
                row_data = [name]
                
                if 'total_sales' in user:
                    total_sales = user.get('total_sales', 0)
                    won_sales = user.get('won_sales', 0)
                    win_rate = (won_sales / total_sales * 100) if total_sales > 0 else 0
                    
                    row_data.extend([
                        format_number(total_sales),
                        format_currency(user.get('total_revenue', 0)),
                        format_number(won_sales),
                        format_percentage(win_rate)
                    ])
                elif 'total_tasks' in user:
                    total_tasks = user.get('total_tasks', 0)
                    completed_tasks = user.get('completed_tasks', 0)
                    completion_rate = (completed_tasks / total_tasks * 100) if total_tasks > 0 else 0
                    
                    row_data.extend([
                        format_number(total_tasks),
                        format_number(completed_tasks),
                        format_percentage(completion_rate),
                        ''
                    ])
                
                writer.writerow(row_data)
            
            writer.writerow(['', '', '', '', ''])  # Empty row for separation
        
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