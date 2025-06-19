#!/usr/bin/env python3
"""
PostgreSQL Setup Script for CRM Project
Run this script after installing PostgreSQL to set up the database.
"""

import subprocess
import sys
import os

def run_sql_command(command, database="postgres"):
    """Run a SQL command using psql"""
    try:
        cmd = f'psql -U postgres -d {database} -c "{command}"'
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
        if result.returncode == 0:
            print(f"✓ Successfully executed: {command}")
            return True
        else:
            print(f"✗ Error executing: {command}")
            print(f"Error: {result.stderr}")
            return False
    except Exception as e:
        print(f"✗ Exception running command: {e}")
        return False

def setup_postgresql_database():
    """Set up PostgreSQL database for the CRM project"""
    print("Setting up PostgreSQL database for CRM project...")
    print("=" * 50)
    
    # Check if PostgreSQL is accessible
    print("Checking PostgreSQL connection...")
    if not run_sql_command("SELECT version();"):
        print("❌ Cannot connect to PostgreSQL. Please ensure:")
        print("1. PostgreSQL is installed and running")
        print("2. You can run 'psql -U postgres' successfully")
        print("3. Your PostgreSQL password is correctly configured")
        return False
    
    # Create database
    print("\nCreating database 'crm_database'...")
    run_sql_command("DROP DATABASE IF EXISTS crm_database;")
    if run_sql_command("CREATE DATABASE crm_database;"):
        print("✓ Database 'crm_database' created successfully")
    
    # Create a dedicated user (optional)
    print("\nCreating database user 'crm_user'...")
    run_sql_command("DROP USER IF EXISTS crm_user;")
    if run_sql_command("CREATE USER crm_user WITH PASSWORD 'crm_password123';"):
        print("✓ User 'crm_user' created successfully")
        
        # Grant privileges
        if run_sql_command("GRANT ALL PRIVILEGES ON DATABASE crm_database TO crm_user;"):
            print("✓ Privileges granted to 'crm_user'")
    
    print("\n" + "=" * 50)
    print("✓ PostgreSQL setup complete!")
    print("\nNext steps:")
    print("1. Update backend/crm/db_config.py with your PostgreSQL password")
    print("2. Run: python manage.py makemigrations")
    print("3. Run: python manage.py migrate")
    print("4. Run: python manage.py createsuperuser")
    
if __name__ == "__main__":
    setup_postgresql_database() 