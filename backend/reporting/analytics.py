from django.db.models import Count, Sum, Avg, Q, F, Case, When, DateTimeField
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
        Generate sales performance analytics using expected close dates.
        """
        queryset = Sale.objects.all()
        
        # If target_user is specified, filter by that user (for managers viewing specific user data)
        if target_user:
            queryset = queryset.filter(assigned_to=target_user)
        # For analytics insights, allow all users to see aggregated data
        # Only restrict to user's own data if they are specifically requesting personal data
        # The filtering should be handled at the view level for individual record access
        elif user and hasattr(user, 'is_staff') and not user.is_staff and hasattr(user, 'role') and user.role == 'USER':
            # For regular users doing analytics (not individual record access), show all data for insights
            # This allows them to see market trends and company performance
            pass  # Don't filter by assigned_to for analytics
        elif user:
            # For staff/managers, show all data anyway
            pass
        
        if date_range:
            start_date = date_range.get('start')
            end_date = date_range.get('end')
            if start_date:
                # Use expected_close_date for filtering, with fallback to created_at
                queryset = queryset.filter(
                    Q(expected_close_date__gte=start_date) | 
                    Q(expected_close_date__isnull=True, created_at__gte=start_date)
                )
            if end_date:
                # Use expected_close_date for filtering, with fallback to created_at
                queryset = queryset.filter(
                    Q(expected_close_date__lte=end_date) | 
                    Q(expected_close_date__isnull=True, created_at__lte=end_date)
                )

        # Group by time period
        if grouping == 'day':
            trunc_func = TruncDate
        elif grouping == 'week':
            trunc_func = TruncWeek
        else:  # month
            trunc_func = TruncMonth

        # Sales over time using expected_close_date with fallback to created_at
        sales_over_time = queryset.annotate(
            period=Case(
                When(expected_close_date__isnull=False, then=trunc_func('expected_close_date')),
                default=trunc_func('created_at'),
                output_field=DateTimeField()
            )
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
        
        # For analytics insights, allow all users to see aggregated data
        # Only restrict to user's own data if they are specifically requesting personal data
        # The filtering should be handled at the view level for individual record access
        if user and hasattr(user, 'is_staff') and not user.is_staff and hasattr(user, 'role') and user.role == 'USER':
            # For regular users doing analytics (not individual record access), show all data for insights
            # This allows them to see market trends and company performance
            pass  # Don't filter by owner for analytics
        elif user:
            # For staff/managers, show all data anyway
            pass
        
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
        
        # If target_user is specified, filter by that user (for managers viewing specific user data)
        if target_user:
            queryset = queryset.filter(assigned_to=target_user)
        # For analytics insights, allow all users to see aggregated data
        # Only restrict to user's own data if they are specifically requesting personal data
        # The filtering should be handled at the view level for individual record access
        elif user and hasattr(user, 'is_staff') and not user.is_staff and hasattr(user, 'role') and user.role == 'USER':
            # For regular users doing analytics (not individual record access), show all data for insights
            # This allows them to see team productivity and company performance
            pass  # Don't filter by assigned_to for analytics
        elif user:
            # For staff/managers, show all data anyway
            pass
        
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

        # Task completion over time with status breakdown
        # Get all time periods where tasks exist
        all_periods = queryset.annotate(
            period=trunc_func('created_at')
        ).values('period').distinct().order_by('period')
        
        completion_over_time = []
        for period_data in all_periods:
            period = period_data['period']
            
            # Calculate the end of the period based on grouping
            if grouping == 'month':
                # Add one month
                if period.month == 12:
                    period_end = period.replace(year=period.year + 1, month=1)
                else:
                    period_end = period.replace(month=period.month + 1)
            elif grouping == 'week':
                period_end = period + timedelta(weeks=1)
            else:  # day
                period_end = period + timedelta(days=1)
            
            # Get tasks for this period
            period_tasks = queryset.filter(
                created_at__gte=period,
                created_at__lt=period_end
            )
            
            completion_over_time.append({
                'period': period,
                'completed': period_tasks.filter(status='C').count(),
                'pending': period_tasks.filter(status='P').count(),
                'overdue': period_tasks.filter(status='O').count(),
                'in_progress': period_tasks.filter(status='IP').count(),
                'total': period_tasks.count()
            })

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
            if hasattr(user, 'role') and user.role == 'USER':
                all_sales = all_sales.filter(assigned_to=user)
            # ADMIN and MANAGER can see all sales

        total_sales = all_sales.count()
        total_amount = all_sales.aggregate(Sum('amount'))['amount__sum'] or 0
        won_sales = all_sales.filter(status='WON').count()
        won_amount = all_sales.filter(status='WON').aggregate(Sum('amount'))['amount__sum'] or 0

        kpis['sales'] = {
            'total_sales': total_sales,
            'total_amount': float(total_amount),
            'won_sales': won_sales,
            'won_amount': float(won_amount),
            'win_rate': (won_sales / total_sales * 100) if total_sales > 0 else 0,
            'pipeline_value': float(all_sales.exclude(status__in=['WON', 'LOST']).aggregate(Sum('amount'))['amount__sum'] or 0),
            # Add previous period data for trend calculation (mock for now)
            'previous_amount': float(total_amount) * 0.9,  # Mock 10% less than current
            'previous_win_rate': max(0, (won_sales / total_sales * 100) - 5) if total_sales > 0 else 0  # Mock 5% less
        }

        # Task KPIs - All time data with role-based filtering  
        all_tasks = Task.objects.all()
        if user:
            # Apply role-based filtering for USER role
            if hasattr(user, 'role') and user.role == 'USER':
                all_tasks = all_tasks.filter(assigned_to=user)
            # ADMIN and MANAGER can see all tasks

        total_tasks = all_tasks.count()
        completed_tasks = all_tasks.filter(status='C').count()
        completion_rate = (completed_tasks / total_tasks * 100) if total_tasks > 0 else 0

        kpis['tasks'] = {
            'total_tasks': total_tasks,
            'pending_tasks': all_tasks.filter(status='P').count(),
            'in_progress_tasks': all_tasks.filter(status='IP').count(),
            'completed_tasks': completed_tasks,
            'overdue_tasks': all_tasks.filter(status='O').count(),
            'completion_rate': completion_rate,
            # Add previous period data for trend calculation (mock for now)
            'previous_completed': max(0, completed_tasks - 2),  # Mock 2 less than current
        }

        # Customer KPIs - All time data with role-based filtering
        all_customers = Customer.objects.all()
        if user:
            # Apply role-based filtering for USER role
            if hasattr(user, 'role') and user.role == 'USER':
                filtered_customers = all_customers.filter(owner=user)
            else:
                # ADMIN and MANAGER can see all customers
                filtered_customers = all_customers
        else:
            filtered_customers = all_customers

        total_customers = filtered_customers.count()
        active_customers = filtered_customers.filter(status='ACTIVE').count()
        
        # Calculate new customers this month
        current_month_start = timezone.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        new_this_month = filtered_customers.filter(created_at__gte=current_month_start).count()

        kpis['customers'] = {
            'total_customers': total_customers,
            'active_customers': active_customers,
            'prospects': filtered_customers.filter(status='PROSPECT').count(),
            'leads': filtered_customers.filter(status='LEAD').count(),
            'vip_customers': filtered_customers.filter(engagement_level='VIP').count(),
            'new_this_month': new_this_month,
            # Add previous period data for trend calculation (mock for now)
            'previous_customers': max(0, total_customers - 3),  # Mock 3 less than current
        }

        return convert_decimals_to_float(kpis)

    @staticmethod
    def get_user_sales_performance():
        """
        Get sales performance data for all users (for managers/admins).
        """
        from django.db.models import Sum, Count, Avg
        from sales.models import Sale
        
        # Get sales performance per user
        user_sales = User.objects.filter(is_active=True).annotate(
            total_sales=Count('assigned_sales'),
            total_amount=Sum('assigned_sales__amount'),
            won_sales=Count('assigned_sales', filter=Q(assigned_sales__status='WON')),
            won_amount=Sum('assigned_sales__amount', filter=Q(assigned_sales__status='WON')),
            lost_sales=Count('assigned_sales', filter=Q(assigned_sales__status='LOST')),
            pipeline_sales=Count('assigned_sales', filter=~Q(assigned_sales__status__in=['WON', 'LOST']))
        ).order_by('-total_amount')
        
        user_performance = []
        for user in user_sales:
            total_sales = user.total_sales or 0
            total_amount = user.total_amount or 0
            won_sales = user.won_sales or 0
            won_amount = user.won_amount or 0
            
            # Calculate win rate
            win_rate = (won_sales / total_sales * 100) if total_sales > 0 else 0
            
            # Calculate average deal size
            avg_deal_size = (total_amount / total_sales) if total_sales > 0 else 0
            
            user_performance.append({
                'user_id': user.id,
                'username': user.username,
                'full_name': f"{user.first_name} {user.last_name}".strip() or user.username,
                'email': user.email,
                'role': getattr(user, 'role', 'USER'),
                'total_sales': total_sales,
                'total_amount': float(total_amount),
                'won_sales': won_sales,
                'won_amount': float(won_amount),
                'lost_sales': user.lost_sales or 0,
                'pipeline_sales': user.pipeline_sales or 0,
                'win_rate': round(win_rate, 1),
                'avg_deal_size': float(avg_deal_size),
                'last_login': user.last_login.isoformat() if user.last_login else None
            })
        
        # Calculate summary statistics
        total_users = len(user_performance)
        total_revenue = sum(u['total_amount'] for u in user_performance)
        total_deals = sum(u['total_sales'] for u in user_performance)
        
        return convert_decimals_to_float({
            'users': user_performance,
            'summary': {
                'total_users': total_users,
                'total_revenue': total_revenue,
                'total_deals': total_deals,
                'avg_revenue_per_user': total_revenue / total_users if total_users > 0 else 0,
                'avg_deals_per_user': total_deals / total_users if total_users > 0 else 0,
            }
        })

    @staticmethod
    def get_user_task_performance():
        """
        Get task performance data for all users (for managers/admins).
        """
        from django.db.models import Sum, Count, Avg
        from tasks.models import Task
        
        # Get task performance per user
        user_tasks = User.objects.filter(is_active=True).annotate(
            total_tasks=Count('tasks'),
            completed_tasks=Count('tasks', filter=Q(tasks__status='C')),
            pending_tasks=Count('tasks', filter=Q(tasks__status='P')),
            in_progress_tasks=Count('tasks', filter=Q(tasks__status='IP')),
            overdue_tasks=Count('tasks', filter=Q(tasks__status='O')),
            high_priority_tasks=Count('tasks', filter=Q(tasks__priority='H')),
            medium_priority_tasks=Count('tasks', filter=Q(tasks__priority='M')),
            low_priority_tasks=Count('tasks', filter=Q(tasks__priority='L'))
        ).order_by('-completed_tasks')
        
        user_performance = []
        for user in user_tasks:
            total_tasks = user.total_tasks or 0
            completed_tasks = user.completed_tasks or 0
            
            # Calculate completion rate
            completion_rate = (completed_tasks / total_tasks * 100) if total_tasks > 0 else 0
            
            # Calculate overdue rate
            overdue_tasks = user.overdue_tasks or 0
            overdue_rate = (overdue_tasks / total_tasks * 100) if total_tasks > 0 else 0
            
            user_performance.append({
                'user_id': user.id,
                'username': user.username,
                'full_name': f"{user.first_name} {user.last_name}".strip() or user.username,
                'email': user.email,
                'role': getattr(user, 'role', 'USER'),
                'total_tasks': total_tasks,
                'completed_tasks': completed_tasks,
                'pending_tasks': user.pending_tasks or 0,
                'in_progress_tasks': user.in_progress_tasks or 0,
                'overdue_tasks': overdue_tasks,
                'completion_rate': round(completion_rate, 1),
                'overdue_rate': round(overdue_rate, 1),
                'high_priority_tasks': user.high_priority_tasks or 0,
                'medium_priority_tasks': user.medium_priority_tasks or 0,
                'low_priority_tasks': user.low_priority_tasks or 0,
                'last_login': user.last_login.isoformat() if user.last_login else None
            })
        
        # Calculate summary statistics
        total_users = len(user_performance)
        total_tasks_all = sum(u['total_tasks'] for u in user_performance)
        total_completed_all = sum(u['completed_tasks'] for u in user_performance)
        total_overdue_all = sum(u['overdue_tasks'] for u in user_performance)
        
        return convert_decimals_to_float({
            'users': user_performance,
            'summary': {
                'total_users': total_users,
                'total_tasks': total_tasks_all,
                'total_completed': total_completed_all,
                'total_overdue': total_overdue_all,
                'avg_completion_rate': (total_completed_all / total_tasks_all * 100) if total_tasks_all > 0 else 0,
                'avg_tasks_per_user': total_tasks_all / total_users if total_users > 0 else 0,
            }
        }) 