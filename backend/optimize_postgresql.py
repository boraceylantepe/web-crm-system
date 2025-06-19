#!/usr/bin/env python3
"""
PostgreSQL Optimization Script for CRM Project
Run this script to optimize database performance after migration.
"""

import subprocess
import sys
import os

def run_sql_command(command, database="crm_database"):
    """Run a SQL command using psql"""
    try:
        cmd = f'psql -U postgres -d {database} -c "{command}"'
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
        if result.returncode == 0:
            print(f"✓ Successfully executed: {command[:60]}...")
            return True
        else:
            print(f"✗ Error executing: {command[:60]}...")
            print(f"Error: {result.stderr}")
            return False
    except Exception as e:
        print(f"✗ Exception running command: {e}")
        return False

def optimize_postgresql():
    """Optimize PostgreSQL database for CRM performance"""
    print("Optimizing PostgreSQL database for CRM performance...")
    print("=" * 60)
    
    # Create indexes for better query performance
    indexes = [
        # Customer indexes
        "CREATE INDEX IF NOT EXISTS idx_customers_status ON customers_customer(status);",
        "CREATE INDEX IF NOT EXISTS idx_customers_owner ON customers_customer(owner_id);",
        "CREATE INDEX IF NOT EXISTS idx_customers_engagement ON customers_customer(engagement_level);",
        "CREATE INDEX IF NOT EXISTS idx_customers_region ON customers_customer(region);",
        "CREATE INDEX IF NOT EXISTS idx_customers_created ON customers_customer(created_at);",
        
        # Sales indexes
        "CREATE INDEX IF NOT EXISTS idx_sales_status ON sales_sale(status);",
        "CREATE INDEX IF NOT EXISTS idx_sales_assigned ON sales_sale(assigned_to_id);",
        "CREATE INDEX IF NOT EXISTS idx_sales_customer ON sales_sale(customer_id);",
        "CREATE INDEX IF NOT EXISTS idx_sales_amount ON sales_sale(amount);",
        "CREATE INDEX IF NOT EXISTS idx_sales_created ON sales_sale(created_at);",
        "CREATE INDEX IF NOT EXISTS idx_sales_close_date ON sales_sale(close_date);",
        
        # Task indexes
        "CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks_task(status);",
        "CREATE INDEX IF NOT EXISTS idx_tasks_assigned ON tasks_task(assigned_to_id);",
        "CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks_task(priority);",
        "CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks_task(due_date);",
        "CREATE INDEX IF NOT EXISTS idx_tasks_created ON tasks_task(created_at);",
        
        # User indexes
        "CREATE INDEX IF NOT EXISTS idx_users_active ON accounts_user(is_active);",
        "CREATE INDEX IF NOT EXISTS idx_users_last_login ON accounts_user(last_login);",
        
        # Calendar indexes
        "CREATE INDEX IF NOT EXISTS idx_calendar_start ON calendar_scheduling_calendarevent(start_time);",
        "CREATE INDEX IF NOT EXISTS idx_calendar_end ON calendar_scheduling_calendarevent(end_time);",
        "CREATE INDEX IF NOT EXISTS idx_calendar_creator ON calendar_scheduling_calendarevent(creator_id);",
        
        # Notification indexes
        "CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications_notification(user_id);",
        "CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications_notification(is_read);",
        "CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications_notification(created_at);",
        
        # Reporting indexes
        "CREATE INDEX IF NOT EXISTS idx_reports_creator ON reporting_reporttemplate(creator_id);",
        "CREATE INDEX IF NOT EXISTS idx_reports_type ON reporting_reporttemplate(report_type);",
        "CREATE INDEX IF NOT EXISTS idx_reports_public ON reporting_reporttemplate(is_public);",
        
        # JSON field indexes for better query performance
        "CREATE INDEX IF NOT EXISTS idx_reports_filters_gin ON reporting_reporttemplate USING GIN (filters);",
        "CREATE INDEX IF NOT EXISTS idx_widgets_filters_gin ON reporting_dashboardwidget USING GIN (filters);",
        "CREATE INDEX IF NOT EXISTS idx_generated_data_gin ON reporting_generatedreport USING GIN (data);",
    ]
    
    print("Creating performance indexes...")
    for index in indexes:
        run_sql_command(index)
    
    # Update table statistics for better query planning
    print("\nUpdating table statistics...")
    tables = [
        "customers_customer",
        "sales_sale", 
        "tasks_task",
        "accounts_user",
        "calendar_scheduling_calendarevent",
        "notifications_notification",
        "reporting_reporttemplate",
        "reporting_generatedreport",
        "reporting_dashboardwidget"
    ]
    
    for table in tables:
        run_sql_command(f"ANALYZE {table};")
    
    # Enable auto-vacuum for better performance
    print("\nOptimizing database settings...")
    optimizations = [
        "ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';",
        "ALTER SYSTEM SET max_connections = 100;",
        "ALTER SYSTEM SET shared_buffers = '256MB';",
        "ALTER SYSTEM SET effective_cache_size = '1GB';",
        "ALTER SYSTEM SET maintenance_work_mem = '64MB';",
        "ALTER SYSTEM SET checkpoint_completion_target = 0.9;",
        "ALTER SYSTEM SET wal_buffers = '16MB';",
        "ALTER SYSTEM SET default_statistics_target = 100;",
        "ALTER SYSTEM SET random_page_cost = 1.1;",
        "ALTER SYSTEM SET effective_io_concurrency = 200;",
    ]
    
    for opt in optimizations:
        run_sql_command(opt)
    
    # Create materialized views for analytics performance
    print("\nCreating materialized views for analytics...")
    materialized_views = [
        """
        CREATE MATERIALIZED VIEW IF NOT EXISTS sales_summary_mv AS
        SELECT 
            DATE_TRUNC('month', created_at) as month,
            status,
            COUNT(*) as count,
            SUM(amount) as total_amount,
            AVG(amount) as avg_amount
        FROM sales_sale 
        GROUP BY DATE_TRUNC('month', created_at), status;
        """,
        
        """
        CREATE MATERIALIZED VIEW IF NOT EXISTS customer_engagement_mv AS
        SELECT 
            engagement_level,
            status,
            region,
            COUNT(*) as count
        FROM customers_customer 
        GROUP BY engagement_level, status, region;
        """,
        
        """
        CREATE MATERIALIZED VIEW IF NOT EXISTS task_completion_mv AS
        SELECT 
            DATE_TRUNC('week', created_at) as week,
            status,
            priority,
            COUNT(*) as count
        FROM tasks_task 
        GROUP BY DATE_TRUNC('week', created_at), status, priority;
        """
    ]
    
    for view in materialized_views:
        run_sql_command(view)
    
    # Create indexes on materialized views
    print("\nCreating indexes on materialized views...")
    mv_indexes = [
        "CREATE INDEX IF NOT EXISTS idx_sales_summary_month ON sales_summary_mv(month);",
        "CREATE INDEX IF NOT EXISTS idx_customer_engagement_level ON customer_engagement_mv(engagement_level);",
        "CREATE INDEX IF NOT EXISTS idx_task_completion_week ON task_completion_mv(week);",
    ]
    
    for index in mv_indexes:
        run_sql_command(index)
    
    print("\n" + "=" * 60)
    print("✓ PostgreSQL optimization complete!")
    print("\nOptimizations applied:")
    print("• Performance indexes created")
    print("• Table statistics updated")
    print("• Database settings optimized")
    print("• Materialized views created for analytics")
    print("\nNote: Some settings require a PostgreSQL restart to take effect.")
    print("To restart PostgreSQL service, run: net stop postgresql-x64-16 && net start postgresql-x64-16")

if __name__ == "__main__":
    optimize_postgresql() 