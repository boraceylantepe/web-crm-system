@echo off
echo Starting CRM System...
echo Backend: http://localhost:8000
echo Frontend: http://localhost:3000

start cmd /k "cd backend && python manage.py runserver"
start cmd /k "cd frontend && npm start"

echo Started successfully! 