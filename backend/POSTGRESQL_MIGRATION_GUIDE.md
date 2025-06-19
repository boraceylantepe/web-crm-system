# PostgreSQL Migration Guide for CRM Project

This guide will help you migrate your Django CRM project from SQLite to PostgreSQL.

## Step 1: Install PostgreSQL

### Option A: Manual Installation (Recommended)
1. Go to https://www.postgresql.org/download/windows/
2. Download PostgreSQL installer (version 15 or 16)
3. Run the installer with these settings:
   - Installation directory: `C:\Program Files\PostgreSQL\16` (default)
   - Data directory: Keep default
   - **IMPORTANT**: Remember the password for the 'postgres' user!
   - Port: 5432 (default)
   - Locale: Default

### Option B: Using Chocolatey (if available)
```powershell
# Install Chocolatey first (if not installed)
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# Install PostgreSQL
choco install postgresql
```

## Step 2: Verify PostgreSQL Installation

Open PowerShell and run:
```powershell
psql --version
```

If this works, PostgreSQL is installed correctly.

## Step 3: Configure Database Settings

1. Open `backend/crm/db_config.py`
2. Replace `'your_password_here'` with the PostgreSQL password you set during installation
3. Optionally, change the database name from `'crm_database'` to something else

## Step 4: Set Up PostgreSQL Database

Run the setup script:
```powershell
cd backend
python setup_postgresql.py
```

This script will:
- Test PostgreSQL connection
- Create the `crm_database` database
- Create a dedicated user (optional)
- Set up proper permissions

## Step 5: Backup Current Data (Optional)

If you have important data in SQLite, back it up first:
```powershell
cd backend
python manage.py dumpdata > data_backup.json
```

## Step 6: Create and Run Migrations

```powershell
cd backend
python manage.py makemigrations
python manage.py migrate
```

## Step 7: Create Superuser

```powershell
python manage.py createsuperuser
```

## Step 8: Load Data (If backed up)

If you backed up data from SQLite:
```powershell
python manage.py loaddata data_backup.json
```

## Step 9: Test the Application

Start your Django server:
```powershell
python manage.py runserver
```

Visit http://localhost:8000/admin to verify everything works.

## Troubleshooting

### Common Issues:

1. **"psql: command not found"**
   - PostgreSQL is not in your PATH
   - Restart your terminal after installation
   - Or use full path: `"C:\Program Files\PostgreSQL\16\bin\psql"`

2. **"FATAL: password authentication failed"**
   - Check your password in `db_config.py`
   - Ensure you're using the correct PostgreSQL user

3. **"database does not exist"**
   - Run the setup script: `python setup_postgresql.py`
   - Or manually create: `psql -U postgres -c "CREATE DATABASE crm_database;"`

4. **Django migration errors**
   - Delete migration files (keep `__init__.py`): `rm */migrations/0*.py`
   - Recreate migrations: `python manage.py makemigrations`
   - Run migrations: `python manage.py migrate`

5. **Port 5432 already in use**
   - Check if PostgreSQL is already running
   - Use Task Manager to stop conflicting services
   - Or change the port in `db_config.py`

## Performance Optimization

After migration, consider these PostgreSQL optimizations:

1. **Add database indexes** for frequently queried fields
2. **Use connection pooling** for better performance
3. **Configure PostgreSQL settings** in `postgresql.conf`
4. **Regular maintenance**: VACUUM and ANALYZE tables

## Security Considerations

1. **Change default passwords** for production use
2. **Create dedicated database users** with limited privileges
3. **Use environment variables** instead of hardcoded passwords
4. **Enable SSL connections** for production
5. **Configure proper firewall rules**

## Production Deployment

For production:
1. Use environment variables for database credentials
2. Set up database backups
3. Configure connection pooling (pgBouncer)
4. Monitor database performance
5. Set up proper logging

---

Your CRM project is now running on PostgreSQL! 🎉 