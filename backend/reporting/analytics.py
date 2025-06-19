from django.db.models import Count, Sum, Avg, Q, F
from django.db.models.functions import TruncDate, TruncMonth, TruncWeek
from django.utils import timezone
from datetime import datetime, timedelta
from decimal import Decimal
import json

from sales.models import Sale
from customers.models import Customer
from tasks.models import Task
from django.contrib.auth import get_user_model

User = get_user_model()

def convert_decimals_to_float(obj):
    """Recursively convert Decimal objects to float in nested data structures."""
    if isinstance(obj, dict):
        return {key: convert_decimals_to_float(value) for key, value in obj.items()}
    elif isinstance(obj, list):
        return [convert_decimals_to_float(item) for item in obj]
    elif isinstance(obj, Decimal):
        return float(obj)
    elif isinstance(obj, datetime):
        return obj.isoformat()
    else:
        return obj

class AnalyticsService:
    """
    Service class for generating analytics data for reports and dashboards.
    """

    @staticmethod
    def get_sales_performance_data(user=None, date_range=None, grouping='month', target_user=None):
        """
        Generate sales performance analytics.
        """
        queryset = Sale.objects.all()
        
        # If target_user is specified, filter by that user instead
        if target_user:
            queryset = queryset.filter(assigned_to=target_user)
        elif user:
            queryset = queryset.filter(assigned_to=user)
        
        if date_range:
            start_date = date_range.get('start')
            end_date = date_range.get('end')
            if start_date:
                queryset = queryset.filter(created_at__gte=start_date)
            if end_date:
                queryset = queryset.filter(created_at__lte=end_date)

        # Group by time period
        if grouping == 'day':
            trunc_func = TruncDate
        elif grouping == 'week':
            trunc_func = TruncWeek
        else:  # month
            trunc_func = TruncMonth

        # Sales over time
        sales_over_time = queryset.annotate(
            period=trunc_func('created_at')
        ).values('period').annotate(
            count=Count('id'),
            total_amount=Sum('amount')
        ).order_by('period')

        # Sales by status
        sales_by_status = queryset.values('status').annotate(
            count=Count('id'),
            total_amount=Sum('amount')
        ).order_by('status')

        # Sales by priority
        sales_by_priority = queryset.values('priority').annotate(
            count=Count('id'),
            total_amount=Sum('amount')
        ).order_by('priority')

        # Top performing sales people - only for managers/admins
        top_performers = []
        if not target_user:  # Only show if not filtering by specific user
            top_performers = Sale.objects.filter(
                assigned_to__isnull=False
            ).values('assigned_to__username', 'assigned_to__first_name', 'assigned_to__last_name').annotate(
                total_sales=Count('id'),
                total_amount=Sum('amount'),
                won_sales=Count('id', filter=Q(status='WON')),
                lost_sales=Count('id', filter=Q(status='LOST'))
            ).order_by('-total_amount')[:10]

        # Personal performance data for individual users
        personal_performance = None
        if target_user:
            personal_stats = queryset.aggregate(
                total_sales=Count('id'),
                total_amount=Sum('amount'),
                won_sales=Count('id', filter=Q(status='WON')),
                lost_sales=Count('id', filter=Q(status='LOST'))
            )
            
            personal_performance = {
                'total_sales': personal_stats['total_sales'] or 0,
                'total_amount': personal_stats['total_amount'] or 0,
                'won_sales': personal_stats['won_sales'] or 0,
                'lost_sales': personal_stats['lost_sales'] or 0,
                'win_rate': (personal_stats['won_sales'] / personal_stats['total_sales'] * 100) if personal_stats['total_sales'] > 0 else 0
            }

        # Calculate summary statistics
        total_sales = queryset.count()
        total_amount = queryset.aggregate(Sum('amount'))['amount__sum'] or 0
        won_sales = queryset.filter(status='WON').count()
        
        result = {
            'sales_over_time': list(sales_over_time),
            'sales_by_status': list(sales_by_status),
            'sales_by_priority': list(sales_by_priority),
            'summary': {
                'total_sales': total_sales,
                'total_amount': total_amount,
                'won_sales': won_sales,
                'lost_sales': queryset.filter(status='LOST').count(),
                'win_rate': (won_sales / total_sales * 100) if total_sales > 0 else 0,
                'average_deal_size': (total_amount / total_sales) if total_sales > 0 else 0,
            }
        }
        
        # Add appropriate performance data based on user type
        if target_user and personal_performance:
            result['personal_performance'] = personal_performance
        else:
            result['top_performers'] = list(top_performers)
            
        # Convert all Decimal objects to float for JSON serialization
        return convert_decimals_to_float(result)

    @staticmethod
    def get_customer_engagement_data(user=None, date_range=None, grouping='month'):
        """
        Generate customer engagement analytics.
        """
        queryset = Customer.objects.all()
        
        if user:
            queryset = queryset.filter(owner=user)
        
        if date_range:
            start_date = date_range.get('start')
            end_date = date_range.get('end')
            if start_date:
                queryset = queryset.filter(created_at__gte=start_date)
            if end_date:
                queryset = queryset.filter(created_at__lte=end_date)

        # Group by time period
        if grouping == 'day':
            trunc_func = TruncDate
        elif grouping == 'week':
            trunc_func = TruncWeek
        else:  # month
            trunc_func = TruncMonth

        # Customers by engagement level
        engagement_levels = queryset.values('engagement_level').annotate(
            count=Count('id')
        ).order_by('engagement_level')

        # Customers by status
        customer_status = queryset.values('status').annotate(
            count=Count('id')
        ).order_by('status')

        # Customer acquisition over time
        acquisition_over_time = queryset.annotate(
            period=trunc_func('created_at')
        ).values('period').annotate(
            count=Count('id')
        ).order_by('period')

        # Regional distribution
        regional_distribution = queryset.values('region').annotate(
            count=Count('id')
        ).order_by('-count')

        # Recent activity (customers with recent contact)
        recent_cutoff = timezone.now() - timedelta(days=30)
        recent_activity = queryset.filter(
            last_contact_date__gte=recent_cutoff.date()
        ).count()

        return convert_decimals_to_float({
            'engagement_levels': list(engagement_levels),
            'customer_status': list(customer_status),
            'acquisition_over_time': list(acquisition_over_time),
            'regional_distribution': list(regional_distribution),
            'summary': {
                'total_customers': queryset.count(),
                'active_customers': queryset.filter(status='ACTIVE').count(),
                'recent_activity': recent_activity,
                'vip_customers': queryset.filter(engagement_level='VIP').count(),
            }
        })

    @staticmethod
    def get_task_completion_data(user=None, date_range=None, grouping='month', target_user=None):
        """
        Generate task completion analytics.
        """
        queryset = Task.objects.all()
        
        # If target_user is specified, filter by that user instead
        if target_user:
            queryset = queryset.filter(assigned_to=target_user)
        elif user:
            queryset = queryset.filter(assigned_to=user)
        
        if date_range:
            start_date = date_range.get('start')
            end_date = date_range.get('end')
            if start_date:
                queryset = queryset.filter(created_at__gte=start_date)
            if end_date:
                queryset = queryset.filter(created_at__lte=end_date)

        # Group by time period
        if grouping == 'day':
            trunc_func = TruncDate
        elif grouping == 'week':
            trunc_func = TruncWeek
        else:  # month
            trunc_func = TruncMonth

        # Tasks by status
        tasks_by_status = queryset.values('status').annotate(
            count=Count('id')
        ).order_by('status')

        # Tasks by priority
        tasks_by_priority = queryset.values('priority').annotate(
            count=Count('id')
        ).order_by('priority')

        # Task completion over time
        completion_over_time = queryset.filter(status='C').annotate(
            period=trunc_func('updated_at')
        ).values('period').annotate(
            count=Count('id')
        ).order_by('period')

        # Overdue tasks
        overdue_tasks = queryset.filter(
            status='O'
        ).count()

        # User performance - only for managers/admins
        user_performance = []
        if not target_user:  # Only show if not filtering by specific user
            user_performance = Task.objects.values('assigned_to__username', 'assigned_to__first_name', 'assigned_to__last_name').annotate(
                total_tasks=Count('id'),
                completed_tasks=Count('id', filter=Q(status='C')),
                overdue_tasks=Count('id', filter=Q(status='O'))
            ).order_by('-completed_tasks')[:10]

            # Add completion rate calculation
            for user_data in user_performance:
                if user_data['total_tasks'] > 0:
                    user_data['completion_rate'] = (user_data['completed_tasks'] / user_data['total_tasks']) * 100
                else:
                    user_data['completion_rate'] = 0

        # Personal performance data for individual users
        personal_performance = None
        if target_user:
            personal_stats = queryset.aggregate(
                total_tasks=Count('id'),
                completed_tasks=Count('id', filter=Q(status='C')),
                pending_tasks=Count('id', filter=Q(status='P')),
                overdue_tasks=Count('id', filter=Q(status='O'))
            )
            
            personal_performance = {
                'total_tasks': personal_stats['total_tasks'] or 0,
                'completed_tasks': personal_stats['completed_tasks'] or 0,
                'pending_tasks': personal_stats['pending_tasks'] or 0,
                'overdue_tasks': personal_stats['overdue_tasks'] or 0,
                'completion_rate': (personal_stats['completed_tasks'] / personal_stats['total_tasks'] * 100) if personal_stats['total_tasks'] > 0 else 0
            }

        # Calculate summary statistics
        total_tasks = queryset.count()
        completed_tasks = queryset.filter(status='C').count()

        result = {
            'tasks_by_status': list(tasks_by_status),
            'tasks_by_priority': list(tasks_by_priority),
            'completion_over_time': list(completion_over_time),
            'summary': {
                'total_tasks': total_tasks,
                'completed_tasks': completed_tasks,
                'pending_tasks': queryset.filter(status='P').count(),
                'overdue_tasks': overdue_tasks,
                'completion_rate': (completed_tasks / total_tasks * 100) if total_tasks > 0 else 0,
            }
        }
        
        # Add appropriate performance data based on user type
        if target_user and personal_performance:
            result['personal_performance'] = personal_performance
        else:
            result['user_performance'] = list(user_performance)
            
        # Convert all Decimal objects to float for JSON serialization
        return convert_decimals_to_float(result)

    @staticmethod
    def get_conversion_ratios(user=None, date_range=None):
        """
        Calculate various conversion ratios.
        """
        # Sales conversion
        sales_queryset = Sale.objects.all()
        if user:
            sales_queryset = sales_queryset.filter(assigned_to=user)
        if date_range:
            start_date = date_range.get('start')
            end_date = date_range.get('end')
            if start_date:
                sales_queryset = sales_queryset.filter(created_at__gte=start_date)
            if end_date:
                sales_queryset = sales_queryset.filter(created_at__lte=end_date)

        total_sales = sales_queryset.count()
        won_sales = sales_queryset.filter(status='WON').count()
        lost_sales = sales_queryset.filter(status='LOST').count()

        # Customer conversion (leads to customers)
        customer_queryset = Customer.objects.all()
        if user:
            customer_queryset = customer_queryset.filter(owner=user)
        if date_range:
            start_date = date_range.get('start')
            end_date = date_range.get('end')
            if start_date:
                customer_queryset = customer_queryset.filter(created_at__gte=start_date)
            if end_date:
                customer_queryset = customer_queryset.filter(created_at__lte=end_date)

        total_leads = customer_queryset.filter(status__in=['LEAD', 'PROSPECT']).count()
        converted_customers = customer_queryset.filter(status='ACTIVE').count()

        return convert_decimals_to_float({
            'sales_conversion': {
                'total_opportunities': total_sales,
                'won_opportunities': won_sales,
                'lost_opportunities': lost_sales,
                'win_rate': (won_sales / total_sales * 100) if total_sales > 0 else 0,
                'loss_rate': (lost_sales / total_sales * 100) if total_sales > 0 else 0,
            },
            'customer_conversion': {
                'total_leads': total_leads,
                'converted_customers': converted_customers,
                'conversion_rate': (converted_customers / (total_leads + converted_customers) * 100) if (total_leads + converted_customers) > 0 else 0,
            }
        })

    @staticmethod
    def get_user_activity_data(date_range=None, grouping='month'):
        """
        Generate user activity analytics for managers.
        """
        # Get all users
        users_queryset = User.objects.filter(is_active=True)

        user_stats = []
        for user in users_queryset:
            # Sales activity
            sales_data = AnalyticsService.get_sales_performance_data(user=user, date_range=date_range)
            
            # Task activity
            task_data = AnalyticsService.get_task_completion_data(user=user, date_range=date_range)
            
            # Customer activity
            customer_data = AnalyticsService.get_customer_engagement_data(user=user, date_range=date_range)

            user_stats.append({
                'user_id': user.id,
                'username': user.username,
                'full_name': f"{user.first_name} {user.last_name}".strip() or user.username,
                'sales_summary': sales_data['summary'],
                'task_summary': task_data['summary'],
                'customer_summary': customer_data['summary'],
                'last_login': user.last_login,
            })

        return convert_decimals_to_float({
            'user_statistics': user_stats,
            'summary': {
                'total_active_users': len(user_stats),
                'total_sales_amount': sum([u['sales_summary']['total_amount'] for u in user_stats]),
                'total_completed_tasks': sum([u['task_summary']['completed_tasks'] for u in user_stats]),
                'total_customers_managed': sum([u['customer_summary']['total_customers'] for u in user_stats]),
            }
        })

    @staticmethod
    def get_dashboard_kpis(user=None):
        """
        Get key performance indicators for dashboard widgets with role-based filtering.
        """
        kpis = {}

        # Sales KPIs - All time data with role-based filtering
        all_sales = Sale.objects.all()
        if user:
            # Apply role-based filtering for USER role
            if user.role == 'USER':
                all_sales = all_sales.filter(assigned_to=user)
            # ADMIN and MANAGER can see all sales

        kpis['sales'] = {
            'total_count': all_sales.count(),
            'total_amount': all_sales.aggregate(Sum('amount'))['amount__sum'] or 0,
            'won_count': all_sales.filter(status='WON').count(),
            'won_amount': all_sales.filter(status='WON').aggregate(Sum('amount'))['amount__sum'] or 0,
            'pipeline_value': all_sales.exclude(status__in=['WON', 'LOST']).aggregate(Sum('amount'))['amount__sum'] or 0,
        }

        # Task KPIs - All time data with role-based filtering
        all_tasks = Task.objects.all()
        if user:
            # Apply role-based filtering for USER role
            if user.role == 'USER':
                all_tasks = all_tasks.filter(assigned_to=user)
            # ADMIN and MANAGER can see all tasks

        total_tasks = all_tasks.count()
        completed_tasks = all_tasks.filter(status='C').count()

        kpis['tasks'] = {
            'total_tasks': total_tasks,
            'pending_tasks': all_tasks.filter(status='P').count(),
            'completed_tasks': completed_tasks,
            'overdue_tasks': all_tasks.filter(status='O').count(),
            'completion_rate': (completed_tasks / total_tasks * 100) if total_tasks > 0 else 0,
        }

        # Customer KPIs - All time data with role-based filtering
        all_customers = Customer.objects.all()
        if user:
            # Apply role-based filtering for USER role
            if user.role == 'USER':
                filtered_customers = all_customers.filter(owner=user)
            else:
                # ADMIN and MANAGER can see all customers
                filtered_customers = all_customers
        else:
            filtered_customers = all_customers

        kpis['customers'] = {
            'total_customers': filtered_customers.count(),
            'active_customers': filtered_customers.filter(status='ACTIVE').count(),
            'prospects': filtered_customers.filter(status='PROSPECT').count(),
            'leads': filtered_customers.filter(status='LEAD').count(),
            'vip_customers': filtered_customers.filter(engagement_level='VIP').count(),
        }

        return convert_decimals_to_float(kpis) 