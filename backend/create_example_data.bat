@echo off
echo Creating example data for CRM system...
echo.

REM Check if virtual environment is activated
if "%VIRTUAL_ENV%"=="" (
    echo WARNING: No virtual environment detected. Consider activating your environment first.
    echo.
)

REM Navigate to backend directory if not already there
cd /d "%~dp0"

echo Running Django management command to create example data...
python manage.py create_example_data --clear

echo.
echo Example data creation completed!
echo.
echo Login credentials:
echo Admin: admin@example.com / admin123
echo Manager: manager@example.com / password123
echo Sales Users: sales1@example.com, sales2@example.com, sales3@example.com / password123
echo.
pause 