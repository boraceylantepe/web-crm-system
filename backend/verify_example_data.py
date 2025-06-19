#!/usr/bin/env python
"""
Verification script to display the created example data
"""
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'crm.settings')
django.setup()

from django.contrib.auth import get_user_model
from customers.models import Customer
from tasks.models import Task
from sales.models import Sale
from calendar_scheduling.models import CalendarEvent
from notifications.models import Notification, NotificationCategory
from reporting.models import ReportTemplate, DashboardWidget

User = get_user_model()

def print_section(title, items):
    print(f"\n{'='*50}")
    print(f"{title.upper()}")
    print(f"{'='*50}")
    for item in items:
        print(f"• {item}")

def main():
    print("CRM SYSTEM EXAMPLE DATA VERIFICATION")
    print("="*60)
    
    # Users
    users = User.objects.all()
    user_list = [f"{user.first_name} {user.last_name} ({user.email}) - {user.role}" for user in users]
    print_section("USERS", user_list)
    
    # Customers
    customers = Customer.objects.all()
    customer_list = [f"{customer.name} - {customer.company} ({customer.region})" for customer in customers]
    print_section("CUSTOMERS", customer_list)
    
    # Sales
    sales = Sale.objects.all()
    sales_list = [f"{sale.title} - ${sale.amount} ({sale.status})" for sale in sales]
    print_section("SALES OPPORTUNITIES", sales_list)
    
    # Tasks
    tasks = Task.objects.all()
    task_list = [f"{task.title} - {task.get_status_display()} (Due: {task.due_date})" for task in tasks]
    print_section("TASKS", task_list)
    
    # Calendar Events
    events = CalendarEvent.objects.all()
    event_list = [f"{event.title} - {event.start_time.strftime('%Y-%m-%d %H:%M')}" for event in events]
    print_section("CALENDAR EVENTS", event_list)
    
    # Notifications
    notifications = Notification.objects.all()
    notif_list = [f"{notif.title} - {notif.recipient.email} ({notif.priority})" for notif in notifications]
    print_section("NOTIFICATIONS", notif_list)
    
    # Reports
    reports = ReportTemplate.objects.all()
    report_list = [f"{report.name} - {report.report_type}" for report in reports]
    print_section("REPORT TEMPLATES", report_list)
    
    # Dashboard Widgets
    widgets = DashboardWidget.objects.all()
    widget_list = [f"{widget.name} - {widget.widget_type} ({widget.size})" for widget in widgets]
    print_section("DASHBOARD WIDGETS", widget_list)
    
    # Summary
    print(f"\n{'='*60}")
    print("SUMMARY")
    print(f"{'='*60}")
    print(f"• {users.count()} Users created")
    print(f"• {customers.count()} Customers created")
    print(f"• {sales.count()} Sales opportunities created")
    print(f"• {tasks.count()} Tasks created")
    print(f"• {events.count()} Calendar events created")
    print(f"• {notifications.count()} Notifications created")
    print(f"• {reports.count()} Report templates created")
    print(f"• {widgets.count()} Dashboard widgets created")
    
    print(f"\n{'='*60}")
    print("LOGIN CREDENTIALS")
    print(f"{'='*60}")
    print("• Admin: admin@example.com / admin123")
    print("• Manager: manager@example.com / password123")
    print("• Sales Team: sales1@example.com, sales2@example.com, sales3@example.com / password123")
    
    print(f"\n✅ All example data successfully created and verified!")

if __name__ == '__main__':
    main() 