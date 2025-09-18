# Web-Based CRM System

A comprehensive Customer Relationship Management (CRM) system built with Django and React, designed for modern business operations with enterprise-grade security and performance.

![CRM System](https://img.shields.io/badge/CRM-System-blue) ![Django](https://img.shields.io/badge/Django-4.2.7-green) ![React](https://img.shields.io/badge/React-18.2.0-blue) ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-blue)

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Setup Instructions](#setup-instructions)
- [Quick Start](#quick-start)
- [API Documentation](#api-documentation)
- [Development Workflow](#development-workflow)
- [Security Features](#security-features)
- [Performance](#performance)
- [Contributing](#contributing)
- [License](#license)

## 🎯 Overview

This enterprise-grade CRM system empowers businesses to manage customer relationships, track sales pipelines, coordinate tasks, and analyze performance through interactive dashboards. Built with scalability in mind, it supports 500+ concurrent users while maintaining sub-3-second response times.

### Key Highlights
- 🚀 **High Performance**: Sub-3-second response times with optimized database queries
- 🔒 **Enterprise Security**: JWT authentication, role-based access control, and audit logging
- 📱 **Responsive Design**: Mobile-first approach with cross-device compatibility
- 📊 **Real-time Analytics**: Interactive dashboards with business intelligence
- 🔔 **Smart Notifications**: Real-time alerts and notification system
- 🌐 **Scalable Architecture**: Modular design supporting horizontal scaling

![{6B6CBDCD-BD4E-41BE-85C7-F9E8C381B9AF}](https://github.com/user-attachments/assets/a18258bd-c741-4c58-a68e-4616487950f1)
![image](https://github.com/user-attachments/assets/16d280bc-cce5-4df1-b13b-49375fe39467)
![{764A4F09-CFF8-45EA-9574-265130F765A0}](https://github.com/user-attachments/assets/3adccaf8-9430-45c8-8210-f4f82e113d8a)
![{905A39D7-64FC-40AA-8A7E-0734412AD125}](https://github.com/user-attachments/assets/dec6a9ca-7362-4fcd-8786-bc72c92ef161)
![{64767019-FA0B-4E32-BA2D-38FDB02D8A3F}](https://github.com/user-attachments/assets/fa758992-2b7a-43fe-996e-a633c5eca3f6)
![{1E1C486F-CF4E-41B2-B878-38B27E617FD6}](https://github.com/user-attachments/assets/3d405942-5ad6-485d-9ab8-ce0b423412e1)





## ✨ Features

### 🔐 Authentication & User Management
- JWT-based secure authentication with refresh token rotation
- Role-based access control (Admin, Manager, Employee)
- User profile management with profile pictures
- Password complexity validation and change enforcement
- Session timeout and audit logging

### 👥 Customer Management
- Comprehensive customer profiles and contact information
- Customer interaction history and notes
- Advanced search and filtering capabilities
- Customer segmentation and categorization
- Import/export functionality

### 📈 Sales Pipeline Management
- Visual Kanban board for sales tracking
- Deal stages and probability tracking
- Sales forecasting and analytics
- Revenue reporting and trends
- Sales performance metrics

### ✅ Task Management
- Task creation, assignment, and tracking
- Priority levels and deadline management
- Task comments and collaboration
- Automated deadline notifications
- Team task overview and reporting

### 📅 Calendar & Scheduling
- Integrated calendar with event management
- Meeting scheduling and invitations
- Event participants and locations
- Calendar synchronization
- Reminder notifications

### 📊 Analytics & Reporting
- Interactive dashboards with Chart.js and Recharts
- Real-time business metrics
- Customizable reports and data visualization
- Export reports to PDF and Excel
- Performance trend analysis

### 🔔 Notification System
- Real-time notifications for important events
- Customizable notification preferences
- Email and in-app notifications
- Notification history and management
- Smart notification scheduling

## 🛠 Technology Stack

### Backend
- **Django 4.2.7** - High-level Python web framework
- **Django REST Framework 3.14.0** - Powerful toolkit for building APIs
- **PostgreSQL** - Advanced open-source relational database
- **JWT Authentication** - Secure token-based authentication
- **Django CORS Headers 4.3.0** - Cross-Origin Resource Sharing
- **Pillow 10.1.0** - Python Imaging Library for image processing
- **Python-dotenv 1.0.0** - Environment variable management

### Frontend
- **React 18.2.0** - Modern JavaScript library for building user interfaces
- **Material-UI 5.15.12** - Comprehensive React component library
- **React Router 6.22.3** - Declarative routing for React applications
- **Chart.js 4.4.1** - Simple yet flexible JavaScript charting library
- **FullCalendar 6.1.17** - Full-sized drag & drop calendar
- **Axios 1.9.0** - Promise-based HTTP client
- **Formik 2.4.6** - Build forms in React without tears
- **Yup 1.6.1** - JavaScript schema builder for value parsing and validation

### Development Tools
- **React Testing Library** - Simple and complete testing utilities
- **Jest** - JavaScript testing framework
- **ESLint** - Code quality and style checking
- **HTML2Canvas & jsPDF** - Client-side PDF generation

## 📁 Project Structure

```
├── backend/                    # Django backend application
│   ├── crm/                   # Main Django project settings
│   │   ├── settings.py        # Django configuration
│   │   ├── urls.py            # URL routing
│   │   └── db_config.py       # Database configuration
│   ├── accounts/              # User authentication & management
│   │   ├── models.py          # User models and profiles
│   │   ├── views.py           # Authentication views
│   │   ├── middleware.py      # Custom middleware
│   │   └── validators.py      # Password validation
│   ├── customers/             # Customer management module
│   │   ├── models.py          # Customer data models
│   │   └── views.py           # Customer CRUD operations
│   ├── sales/                 # Sales pipeline management
│   │   ├── models.py          # Sales and deal models
│   │   └── serializers.py     # API serializers
│   ├── tasks/                 # Task management system
│   │   ├── models.py          # Task and comment models
│   │   ├── scheduler.py       # Task scheduling logic
│   │   └── management/        # Custom management commands
│   ├── calendar_scheduling/   # Calendar integration
│   │   ├── models.py          # Calendar event models
│   │   └── views.py           # Calendar API views
│   ├── notifications/         # Notification system
│   │   ├── models.py          # Notification models
│   │   ├── services.py        # Notification services
│   │   └── signals.py         # Django signals
│   ├── reporting/             # Analytics and reporting
│   │   ├── analytics.py       # Business analytics logic
│   │   ├── utils.py           # Reporting utilities
│   │   └── views.py           # Report generation
│   ├── api/                   # Centralized API configuration
│   │   ├── serializers.py     # Common serializers
│   │   ├── permissions.py     # API permissions
│   │   └── utils.py           # API utilities
│   ├── requirements.txt       # Python dependencies
│   └── manage.py              # Django management script
├── frontend/                  # React frontend application
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   │   ├── auth/          # Authentication components
│   │   │   ├── calendar/      # Calendar components
│   │   │   ├── charts/        # Chart components
│   │   │   ├── customer/      # Customer components
│   │   │   ├── dashboard/     # Dashboard components
│   │   │   ├── layout/        # Layout components
│   │   │   ├── notifications/ # Notification components
│   │   │   └── tasks/         # Task components
│   │   ├── pages/             # Page-level components
│   │   │   ├── Dashboard.js   # Main dashboard
│   │   │   ├── Customers.js   # Customer management
│   │   │   ├── Sales.js       # Sales pipeline
│   │   │   ├── TasksPage.js   # Task management
│   │   │   ├── Calendar.js    # Calendar view
│   │   │   ├── Analytics.js   # Analytics dashboard
│   │   │   └── Reports.js     # Reporting interface
│   │   ├── services/          # API service clients
│   │   │   ├── api.js         # Base API configuration
│   │   │   ├── customerService.js
│   │   │   ├── saleService.js
│   │   │   ├── taskService.js
│   │   │   ├── calendarService.js
│   │   │   └── reportingService.js
│   │   ├── context/           # React context providers
│   │   │   ├── AuthContext.js # Authentication context
│   │   │   ├── ThemeContext.js # Theme management
│   │   │   └── NotificationContext.js
│   │   └── utils/             # Utility functions
│   │       ├── constants.js   # Application constants
│   │       └── dateUtils.js   # Date manipulation utilities
│   ├── package.json           # Node.js dependencies
│   └── public/                # Static files and assets
├── start.bat                  # Windows startup script
├── .gitignore                 # Git ignore rules
├── LICENSE                    # MIT License
└── README.md                  # Project documentation
```

## 🚀 Setup Instructions

### Prerequisites
- **Python 3.8+**
- **Node.js 16+**
- **PostgreSQL 12+**
- **Git**

### Environment Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/web-crm-system.git
   cd web-crm-system
   ```

2. **Backend Setup:**
   ```bash
   cd backend
   
   # Create virtual environment
   python -m venv venv
   
   # Activate virtual environment
   # Windows:
   venv\Scripts\activate
   # macOS/Linux:
   source venv/bin/activate
   
   # Install dependencies
   pip install -r requirements.txt
   ```

3. **Environment Configuration:**
   Create a `.env` file in the backend directory:
   ```env
   # Debug and Security
   DEBUG=True
   SECRET_KEY=your-super-secret-key-here-make-it-long-and-random
   ALLOWED_HOSTS=127.0.0.1,localhost,testserver
   
   # CORS Settings
   CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
   
   # Database Configuration
   DB_NAME=crm_database
   DB_USER=postgres
   DB_PASSWORD=your_password
   DB_HOST=localhost
   DB_PORT=5432
   
   # JWT Settings
   JWT_ACCESS_TOKEN_LIFETIME=15
   JWT_REFRESH_TOKEN_LIFETIME=1
   ```

4. **Database Setup:**
   ```bash
   # Create database migrations
   python manage.py makemigrations
   
   # Apply migrations
   python manage.py migrate
   
   # Create superuser account
   python manage.py createsuperuser
   
   # (Optional) Load sample data
   python manage.py create_example_data
   ```

5. **Frontend Setup:**
   ```bash
   cd frontend
   
   # Install dependencies
   npm install
   ```

## ⚡ Quick Start

### Option 1: Using the Startup Script (Windows)
```bash
# From project root directory
start.bat
```

### Option 2: Manual Startup
```bash
# Terminal 1 - Start Backend
cd backend
python manage.py runserver

# Terminal 2 - Start Frontend
cd frontend
npm start
```

### Access the Application
- **Frontend Application**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **Django Admin Panel**: http://localhost:8000/admin
- **API Documentation**: http://localhost:8000/api/

### Default Login Credentials
Use the superuser account you created, or create a new user through the registration interface.

## 📖 API Documentation

The API follows RESTful conventions with the following main endpoints:

### Authentication
- `POST /api/auth/login/` - User login
- `POST /api/auth/refresh/` - Refresh JWT token
- `POST /api/auth/logout/` - User logout
- `POST /api/auth/register/` - User registration

### Customers
- `GET /api/customers/` - List customers
- `POST /api/customers/` - Create customer
- `GET /api/customers/{id}/` - Get customer details
- `PUT /api/customers/{id}/` - Update customer
- `DELETE /api/customers/{id}/` - Delete customer

### Sales
- `GET /api/sales/` - List sales/deals
- `POST /api/sales/` - Create new deal
- `PUT /api/sales/{id}/` - Update deal
- `GET /api/sales/stats/` - Sales statistics

### Tasks
- `GET /api/tasks/` - List tasks
- `POST /api/tasks/` - Create task
- `PUT /api/tasks/{id}/` - Update task
- `POST /api/tasks/{id}/comments/` - Add task comment

### Calendar
- `GET /api/calendar/events/` - List calendar events
- `POST /api/calendar/events/` - Create event
- `PUT /api/calendar/events/{id}/` - Update event

### Reports
- `GET /api/reports/dashboard/` - Dashboard statistics
- `GET /api/reports/sales-analytics/` - Sales analytics
- `GET /api/reports/export/` - Export reports

## 🔄 Development Workflow

### Code Quality Standards
- **Python**: Follow PEP 8 style guide
- **JavaScript**: Use ESLint configuration
- **Testing**: Maintain 80% code coverage
- **Documentation**: Update docstrings and comments

### Git Workflow
```bash
# Create feature branch
git checkout -b feature/feature-name

# Make changes and commit
git add .
git commit -m "feat: add new feature description"

# Push to repository
git push origin feature/feature-name

# Create pull request for review
```

### Testing
```bash
# Backend tests
cd backend
python manage.py test

# Frontend tests
cd frontend
npm test

# Run all tests with coverage
npm run test:coverage
```

## 🔒 Security Features

- **Authentication**: JWT with automatic token refresh and blacklisting
- **Authorization**: Role-based access control (RBAC)
- **Data Protection**: CSRF and XSS protection enabled
- **Password Security**: Complex password requirements and validation
- **Audit Logging**: Comprehensive user action logging
- **Session Management**: Automatic session timeout
- **API Security**: Rate limiting and request validation

## ⚡ Performance

- **Response Time**: Sub-3-second response for all operations
- **Concurrent Users**: Supports 500+ simultaneous users
- **Database Optimization**: Optimized queries with select_related and prefetch_related
- **Caching**: Strategic caching implementation
- **Frontend Performance**: Code splitting and lazy loading
- **Monitoring**: Built-in performance monitoring and logging


## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

