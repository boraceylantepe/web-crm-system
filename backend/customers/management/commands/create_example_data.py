from django.core.management.base import BaseCommand, CommandError
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import datetime, timedelta
import random
from decimal import Decimal

# Import all models
from customers.models import Customer
from tasks.models import Task, TaskComment
from sales.models import Sale, SaleNote
from calendar_scheduling.models import CalendarEvent
from notifications.models import Notification, NotificationCategory, NotificationPreference
from reporting.models import ReportTemplate, DashboardWidget, UserDashboard

User = get_user_model()

class Command(BaseCommand):
    help = 'Create example data for all sections of the CRM system'

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear existing data before creating examples',
        )

    def handle(self, *args, **options):
        if options['clear']:
            self.stdout.write('Clearing existing data...')
            self.clear_data()

        self.stdout.write('Creating example data...')
        
        # Create users first (they're referenced by other models)
        users = self.create_users()
        
        # Create customers
        customers = self.create_customers(users)
        
        # Create sales
        sales = self.create_sales(customers, users)
        
        # Create tasks
        tasks = self.create_tasks(users, customers)
        
        # Create calendar events
        events = self.create_calendar_events(users, customers, sales)
        
        # Create notifications
        self.create_notifications(users, customers, tasks, sales)
        
        # Create reports and dashboard widgets
        self.create_reports_and_dashboard(users)
        
        self.stdout.write(
            self.style.SUCCESS('Successfully created example data for all CRM sections!')
        )

    def clear_data(self):
        """Clear existing example data"""
        models_to_clear = [
            TaskComment, Task, SaleNote, Sale, CalendarEvent,
            Notification, Customer, ReportTemplate, DashboardWidget,
            UserDashboard
        ]
        
        for model in models_to_clear:
            model.objects.all().delete()
        
        # Clear users except superusers
        User.objects.filter(is_superuser=False).delete()

    def create_users(self):
        """Create example users"""
        self.stdout.write('Creating users...')
        
        users_data = [
            {
                'email': 'manager@example.com',
                'first_name': 'Sarah',
                'last_name': 'Johnson',
                'role': 'MANAGER',
                'password': 'password123'
            },
            {
                'email': 'sales1@example.com',
                'first_name': 'Mike',
                'last_name': 'Davis',
                'role': 'USER',
                'password': 'password123'
            },
            {
                'email': 'sales2@example.com',
                'first_name': 'Emily',
                'last_name': 'Chen',
                'role': 'USER',
                'password': 'password123'
            },
            {
                'email': 'sales3@example.com',
                'first_name': 'David',
                'last_name': 'Wilson',
                'role': 'USER',
                'password': 'password123'
            },
            {
                'email': 'admin@example.com',
                'first_name': 'Alex',
                'last_name': 'Admin',
                'role': 'ADMIN',
                'password': 'admin123'
            }
        ]
        
        users = []
        for user_data in users_data:
            user, created = User.objects.get_or_create(
                email=user_data['email'],
                defaults={
                    'first_name': user_data['first_name'],
                    'last_name': user_data['last_name'],
                    'role': user_data['role'],
                    'force_password_change': False,
                    'password_changed_at': timezone.now()
                }
            )
            if created:
                user.set_password(user_data['password'])
                user.save()
            users.append(user)
            
        self.stdout.write(f'Created {len(users)} users')
        return users

    def create_customers(self, users):
        """Create example customers"""
        self.stdout.write('Creating customers...')
        
        customers_data = [
            {
                'name': 'John Smith',
                'email': 'john.smith@techcorp.com',
                'phone': '+1-555-0101',
                'company': 'TechCorp Solutions',
                'address': '123 Business Ave, Suite 100',
                'city': 'San Francisco',
                'country': 'United States',
                'region': 'NA',
                'engagement_level': 'HIGH',
                'status': 'ACTIVE',
                'website': 'https://techcorp.com',
                'notes': 'Key decision maker for enterprise solutions'
            },
            {
                'name': 'Maria Garcia',
                'email': 'maria.garcia@innovatetech.eu',
                'phone': '+33-1-2345-6789',
                'company': 'InnovateTech Europe',
                'address': '45 Innovation Boulevard',
                'city': 'Paris',
                'country': 'France',
                'region': 'EU',
                'engagement_level': 'MEDIUM',
                'status': 'PROSPECT',
                'website': 'https://innovatetech.eu',
                'notes': 'Interested in our premium package'
            },
            {
                'name': 'Hiroshi Tanaka',
                'email': 'h.tanaka@futurecorp.jp',
                'phone': '+81-3-1234-5678',
                'company': 'Future Corp Japan',
                'address': '1-1-1 Technology District',
                'city': 'Tokyo',
                'country': 'Japan',
                'region': 'APAC',
                'engagement_level': 'VIP',
                'status': 'ACTIVE',
                'website': 'https://futurecorp.jp',
                'notes': 'Long-term strategic partner'
            },
            {
                'name': 'Ahmed Hassan',
                'email': 'ahmed.hassan@globaldynamics.ae',
                'phone': '+971-4-123-4567',
                'company': 'Global Dynamics UAE',
                'address': 'Dubai International Financial Centre',
                'city': 'Dubai',
                'country': 'United Arab Emirates',
                'region': 'MENA',
                'engagement_level': 'HIGH',
                'status': 'LEAD',
                'website': 'https://globaldynamics.ae',
                'notes': 'Evaluating multiple vendors'
            },
            {
                'name': 'Lisa Anderson',
                'email': 'lisa.anderson@startupventures.com',
                'phone': '+1-555-0202',
                'company': 'Startup Ventures Inc',
                'address': '789 Entrepreneur Street',
                'city': 'Austin',
                'country': 'United States',
                'region': 'NA',
                'engagement_level': 'MEDIUM',
                'status': 'ACTIVE',
                'website': 'https://startupventures.com',
                'notes': 'Growing startup with expansion plans'
            },
            {
                'name': 'Carlos Rodriguez',
                'email': 'carlos.rodriguez@latintech.mx',
                'phone': '+52-55-1234-5678',
                'company': 'LatinTech Mexico',
                'address': 'Av. Reforma 123',
                'city': 'Mexico City',
                'country': 'Mexico',
                'region': 'LATAM',
                'engagement_level': 'LOW',
                'status': 'INACTIVE',
                'website': 'https://latintech.mx',
                'notes': 'Previous customer, contract expired'
            }
        ]
        
        customers = []
        for i, customer_data in enumerate(customers_data):
            customer, created = Customer.objects.get_or_create(
                email=customer_data['email'],
                defaults={
                    **customer_data,
                    'owner': users[i % len(users)],
                    'last_contact_date': timezone.now().date() - timedelta(days=random.randint(1, 30))
                }
            )
            customers.append(customer)
            
        self.stdout.write(f'Created {len(customers)} customers')
        return customers

    def create_sales(self, customers, users):
        """Create example sales opportunities"""
        self.stdout.write('Creating sales...')
        
        sales_data = [
            {
                'title': 'Enterprise Software License - TechCorp',
                'status': 'NEGOTIATION',
                'amount': Decimal('150000.00'),
                'expected_close_date': timezone.now().date() + timedelta(days=15),
                'description': 'Annual enterprise license for 500 users',
                'priority': 'HIGH'
            },
            {
                'title': 'Consulting Services - InnovateTech',
                'status': 'PROPOSAL',
                'amount': Decimal('75000.00'),
                'expected_close_date': timezone.now().date() + timedelta(days=30),
                'description': 'Implementation and training services',
                'priority': 'MEDIUM'
            },
            {
                'title': 'Premium Support Package - Future Corp',
                'status': 'WON',
                'amount': Decimal('25000.00'),
                'expected_close_date': timezone.now().date() - timedelta(days=5),
                'description': '24/7 premium support subscription',
                'priority': 'HIGH'
            },
            {
                'title': 'Starter Package - Global Dynamics',
                'status': 'CONTACTED',
                'amount': Decimal('35000.00'),
                'expected_close_date': timezone.now().date() + timedelta(days=45),
                'description': 'Entry-level package for small team',
                'priority': 'MEDIUM'
            },
            {
                'title': 'Custom Integration - Startup Ventures',
                'status': 'NEW',
                'amount': Decimal('20000.00'),
                'expected_close_date': timezone.now().date() + timedelta(days=60),
                'description': 'Custom API integration project',
                'priority': 'LOW'
            },
            {
                'title': 'Renewal Discussion - LatinTech',
                'status': 'LOST',
                'amount': Decimal('50000.00'),
                'expected_close_date': timezone.now().date() - timedelta(days=10),
                'description': 'Contract renewal opportunity',
                'priority': 'MEDIUM'
            }
        ]
        
        sales = []
        for i, sale_data in enumerate(sales_data):
            sale = Sale.objects.create(
                customer=customers[i],
                assigned_to=users[i % len(users)],
                **sale_data
            )
            sales.append(sale)
            
            # Create sale notes
            SaleNote.objects.create(
                sale=sale,
                author=sale.assigned_to,
                content=f"Initial contact made with {sale.customer.name}. They showed interest in our solution.",
                is_update=False
            )
            
        self.stdout.write(f'Created {len(sales)} sales opportunities')
        return sales

    def create_tasks(self, users, customers):
        """Create example tasks"""
        self.stdout.write('Creating tasks...')
        
        tasks_data = [
            {
                'title': 'Follow up with TechCorp on proposal',
                'notes': 'Need to address their questions about scalability and security',
                'due_date': timezone.now().date() + timedelta(days=2),
                'priority': 'H',
                'status': 'P'
            },
            {
                'title': 'Prepare demo for InnovateTech',
                'notes': 'Focus on European compliance features',
                'due_date': timezone.now().date() + timedelta(days=7),
                'priority': 'M',
                'status': 'IP'
            },
            {
                'title': 'Send contract to Future Corp',
                'notes': 'Premium support contract ready for signature',
                'due_date': timezone.now().date() + timedelta(days=1),
                'priority': 'H',
                'status': 'C'
            },
            {
                'title': 'Research Global Dynamics requirements',
                'notes': 'Understand their specific industry needs',
                'due_date': timezone.now().date() + timedelta(days=5),
                'priority': 'M',
                'status': 'P'
            },
            {
                'title': 'Create custom proposal for Startup Ventures',
                'notes': 'They need a cost-effective solution for rapid growth',
                'due_date': timezone.now().date() + timedelta(days=10),
                'priority': 'L',
                'status': 'P'
            },
            {
                'title': 'Review quarterly sales metrics',
                'notes': 'Analyze performance and identify improvement areas',
                'due_date': timezone.now().date() - timedelta(days=1),
                'priority': 'H',
                'status': 'O'
            },
            {
                'title': 'Update CRM customer data',
                'notes': 'Ensure all customer information is current',
                'due_date': timezone.now().date() + timedelta(days=3),
                'priority': 'L',
                'status': 'IP'
            },
            {
                'title': 'Prepare monthly report for management',
                'notes': 'Include sales pipeline and forecasts',
                'due_date': timezone.now().date() + timedelta(days=14),
                'priority': 'M',
                'status': 'P'
            }
        ]
        
        tasks = []
        for i, task_data in enumerate(tasks_data):
            task = Task.objects.create(
                assigned_to=users[i % len(users)],
                **task_data
            )
            tasks.append(task)
            
            # Create task comments
            if i % 2 == 0:  # Add comments to every other task
                TaskComment.objects.create(
                    task=task,
                    user=task.assigned_to,
                    comment="Started working on this task. Will update progress soon."
                )
                
        self.stdout.write(f'Created {len(tasks)} tasks')
        return tasks

    def create_calendar_events(self, users, customers, sales):
        """Create example calendar events"""
        self.stdout.write('Creating calendar events...')
        
        events_data = [
            {
                'title': 'Demo Meeting with TechCorp',
                'description': 'Product demonstration and Q&A session',
                'start_time': timezone.now() + timedelta(days=3, hours=10),
                'end_time': timezone.now() + timedelta(days=3, hours=11, minutes=30),
                'event_type': 'MEETING',
                'location': 'Conference Room A'
            },
            {
                'title': 'Follow-up Call with InnovateTech',
                'description': 'Discuss proposal feedback and next steps',
                'start_time': timezone.now() + timedelta(days=5, hours=14),
                'end_time': timezone.now() + timedelta(days=5, hours=15),
                'event_type': 'CALL',
                'location': 'Phone Call'
            },
            {
                'title': 'Contract Review Meeting',
                'description': 'Final review of Future Corp contract terms',
                'start_time': timezone.now() + timedelta(days=1, hours=9),
                'end_time': timezone.now() + timedelta(days=1, hours=10),
                'event_type': 'MEETING',
                'location': 'Client Office'
            },
            {
                'title': 'Sales Pipeline Review',
                'description': 'Weekly sales team meeting',
                'start_time': timezone.now() + timedelta(days=7, hours=16),
                'end_time': timezone.now() + timedelta(days=7, hours=17),
                'event_type': 'REVIEW',
                'location': 'Main Conference Room'
            },
            {
                'title': 'Customer Onboarding Session',
                'description': 'Help new customer get started with our platform',
                'start_time': timezone.now() + timedelta(days=10, hours=11),
                'end_time': timezone.now() + timedelta(days=10, hours=12, minutes=30),
                'event_type': 'MEETING',
                'location': 'Virtual Meeting'
            }
        ]
        
        events = []
        for i, event_data in enumerate(events_data):
            event = CalendarEvent.objects.create(
                owner=users[i % len(users)],
                customer=customers[i % len(customers)] if i < len(customers) else None,
                sale=sales[i % len(sales)] if i < len(sales) else None,
                **event_data
            )
            
            # Add participants
            if len(users) > 1:
                event.participants.add(users[(i + 1) % len(users)])
                
            events.append(event)
            
        self.stdout.write(f'Created {len(events)} calendar events')
        return events

    def create_notifications(self, users, customers, tasks, sales):
        """Create example notifications"""
        self.stdout.write('Creating notifications...')
        
        # Create notification categories
        categories_data = [
            {'name': 'Tasks', 'description': 'Task-related notifications', 'icon': 'task', 'color': '#2196F3'},
            {'name': 'Sales', 'description': 'Sales opportunity notifications', 'icon': 'sales', 'color': '#4CAF50'},
            {'name': 'Customers', 'description': 'Customer-related notifications', 'icon': 'customer', 'color': '#FF9800'},
            {'name': 'System', 'description': 'System notifications', 'icon': 'system', 'color': '#9C27B0'}
        ]
        
        categories = []
        for cat_data in categories_data:
            category, created = NotificationCategory.objects.get_or_create(
                name=cat_data['name'],
                defaults=cat_data
            )
            categories.append(category)
        
        # Create notification preferences for users
        for user in users:
            NotificationPreference.objects.get_or_create(
                user=user,
                defaults={
                    'email_notifications': True,
                    'in_app_notifications': True,
                    'task_notifications': True,
                    'sales_notifications': True,
                    'customer_notifications': True,
                    'system_notifications': True,
                    'minimum_priority': 'low'
                }
            )
        
        # Create sample notifications
        notifications_data = [
            {
                'title': 'Task Due Soon',
                'message': 'Your task "Follow up with TechCorp" is due in 2 days',
                'priority': 'high',
                'category': categories[0],  # Tasks
                'action_url': '/tasks/'
            },
            {
                'title': 'New Sales Opportunity',
                'message': 'A new sales opportunity has been assigned to you',
                'priority': 'medium',
                'category': categories[1],  # Sales
                'action_url': '/sales/'
            },
            {
                'title': 'Customer Update',
                'message': 'TechCorp has updated their contact information',
                'priority': 'low',
                'category': categories[2],  # Customers
                'action_url': '/customers/'
            },
            {
                'title': 'System Maintenance',
                'message': 'Scheduled maintenance will occur this weekend',
                'priority': 'medium',
                'category': categories[3],  # System
                'action_url': '/notifications/'
            }
        ]
        
        notifications = []
        for i, notif_data in enumerate(notifications_data):
            notification = Notification.objects.create(
                recipient=users[i % len(users)],
                **notif_data
            )
            notifications.append(notification)
            
        self.stdout.write(f'Created {len(notifications)} notifications')

    def create_reports_and_dashboard(self, users):
        """Create example report templates and dashboard widgets"""
        self.stdout.write('Creating reports and dashboard widgets...')
        
        # Create report templates
        report_templates_data = [
            {
                'name': 'Monthly Sales Performance',
                'description': 'Comprehensive monthly sales metrics and trends',
                'report_type': 'sales_performance',
                'filters': {'date_range': 'last_month', 'status': ['WON', 'LOST']},
                'metrics': ['total_revenue', 'deals_won', 'conversion_rate'],
                'date_range': {'type': 'relative', 'value': 'last_month'},
                'grouping': {'by': 'assigned_to', 'period': 'week'},
                'is_public': True
            },
            {
                'name': 'Customer Engagement Report',
                'description': 'Analysis of customer engagement levels and activities',
                'report_type': 'customer_engagement',
                'filters': {'engagement_level': ['HIGH', 'VIP'], 'region': ['NA', 'EU']},
                'metrics': ['total_customers', 'engagement_score', 'activity_count'],
                'date_range': {'type': 'relative', 'value': 'last_quarter'},
                'grouping': {'by': 'region', 'period': 'month'},
                'is_public': True
            },
            {
                'name': 'Task Completion Analysis',
                'description': 'Team productivity and task completion metrics',
                'report_type': 'task_completion',
                'filters': {'status': ['C', 'O'], 'priority': ['H', 'M']},
                'metrics': ['completed_tasks', 'overdue_tasks', 'completion_rate'],
                'date_range': {'type': 'relative', 'value': 'last_month'},
                'grouping': {'by': 'assigned_to', 'period': 'day'},
                'is_public': False
            }
        ]
        
        report_templates = []
        for template_data in report_templates_data:
            template = ReportTemplate.objects.create(
                creator=users[0],  # Assign to first user
                **template_data
            )
            report_templates.append(template)
            
        # Create dashboard widgets
        widgets_data = [
            {
                'name': 'Sales Pipeline',
                'widget_type': 'bar_chart',
                'size': 'medium',
                'data_source': 'sales_pipeline',
                'filters': {'status__in': ['NEW', 'CONTACTED', 'PROPOSAL', 'NEGOTIATION']},
                'display_options': {'colors': ['#2196F3', '#4CAF50', '#FF9800', '#F44336']},
                'position_x': 0,
                'position_y': 0,
                'is_public': True
            },
            {
                'name': 'Monthly Revenue',
                'widget_type': 'line_chart',
                'size': 'large',
                'data_source': 'monthly_revenue',
                'filters': {'status': 'WON'},
                'display_options': {'color': '#4CAF50', 'show_trend': True},
                'position_x': 2,
                'position_y': 0,
                'is_public': True
            },
            {
                'name': 'Tasks Overview',
                'widget_type': 'donut_chart',
                'size': 'small',
                'data_source': 'task_status',
                'filters': {},
                'display_options': {'colors': ['#2196F3', '#FF9800', '#4CAF50', '#F44336']},
                'position_x': 0,
                'position_y': 1,
                'is_public': True
            },
            {
                'name': 'Top Customers',
                'widget_type': 'table',
                'size': 'medium',
                'data_source': 'top_customers',
                'filters': {'engagement_level__in': ['HIGH', 'VIP']},
                'display_options': {'columns': ['name', 'company', 'total_sales', 'last_contact']},
                'position_x': 1,
                'position_y': 1,
                'is_public': True
            }
        ]
        
        widgets = []
        for widget_data in widgets_data:
            widget = DashboardWidget.objects.create(
                creator=users[0],  # Assign to first user
                **widget_data
            )
            widgets.append(widget)
            
        # Create user dashboards
        for user in users:
            dashboard, created = UserDashboard.objects.get_or_create(
                user=user,
                defaults={
                    'name': f"{user.first_name}'s Dashboard",
                    'refresh_interval': 300,
                    'is_default': True
                }
            )
            
            # Add widgets to dashboard
            if created:
                for widget in widgets:
                    dashboard.widgets.add(widget)
        
        self.stdout.write(f'Created {len(report_templates)} report templates and {len(widgets)} dashboard widgets') 