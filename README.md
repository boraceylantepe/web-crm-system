# Web-Based CRM System

A comprehensive Customer Relationship Management (CRM) system built with Django and React, following IEEE 1016-2009 software design standards.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Documentation](#documentation)
- [Setup Instructions](#setup-instructions)
- [Development Workflow](#development-workflow)
- [License](#license)

## 🎯 Overview

This CRM system allows businesses to manage customer relationships, track sales, manage tasks, and schedule calendar events in a single web-based platform. The system is designed to support 500+ concurrent users with enterprise-grade security and performance.

## ✨ Features

- **🔐 Authentication**: Secure JWT-based authentication with role-based access control
- **👥 Customer Management**: Comprehensive customer data management and interaction tracking
- **📈 Sales Pipeline**: Visual Kanban board for sales tracking and forecasting
- **✅ Task Management**: Task assignment, tracking, and deadline management
- **📅 Calendar Integration**: Event scheduling with calendar integration
- **📊 Analytics & Reporting**: Business intelligence with interactive dashboards
- **🔔 Real-time Notifications**: Instant alerts and notification system
- **📱 Responsive Design**: Mobile-friendly interface using Material-UI

## 🛠 Technology Stack

### Backend
- **Django 4.2.7** - Python web framework
- **Django REST Framework 3.14.0** - REST API development
- **PostgreSQL** - Primary database
- **JWT Authentication** - Secure token-based authentication

### Frontend
- **React 18.2.0** - JavaScript library for UI
- **Material-UI 5.15.12** - React component library
- **React Router 6.22.3** - Client-side routing
- **Chart.js 4.4.1** - Data visualization
- **FullCalendar 6.1.17** - Calendar integration
- **Axios 1.9.0** - HTTP client

## 📁 Project Structure

```
├── backend/                    # Django backend application
│   ├── crm/                   # Django project settings
│   ├── accounts/              # User authentication & management
│   ├── customers/             # Customer management module
│   ├── sales/                 # Sales pipeline management
│   ├── tasks/                 # Task management system
│   ├── calendar_scheduling/   # Calendar integration
│   ├── notifications/         # Notification system
│   ├── reporting/             # Analytics and reporting
│   ├── api/                   # Centralized API configuration
│   ├── requirements.txt       # Python dependencies
│   └── manage.py              # Django management script
├── frontend/                  # React frontend application
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   ├── pages/             # Page-level components
│   │   ├── services/          # API service clients
│   │   ├── context/           # React context providers
│   │   └── utils/             # Utility functions
│   ├── package.json           # Node.js dependencies
│   └── public/                # Static files
├── Software_Design_Document.md # IEEE 1016-2009 compliant SDD
├── README.md                  # Project documentation
└── .gitignore                # Git ignore rules
```

## 📖 Documentation

- **[Software Design Document](./Software_Design_Document.md)** - Comprehensive architectural design following IEEE 1016-2009 standards
- **API Documentation** - Available at `/api/docs/` when running the backend server
- **Frontend Component Library** - Material-UI components documentation

## 🚀 Setup Instructions

### Prerequisites
- **Python 3.8+**
- **Node.js 14+**
- **PostgreSQL 12+**
- **Git**

### Backend Setup

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd web-crm-system
   ```

2. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

3. **Create virtual environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

4. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

5. **Environment configuration:**
   Create a `.env` file in the backend directory:
   ```env
   DEBUG=True
   SECRET_KEY=your-secret-key-here
   ALLOWED_HOSTS=127.0.0.1,localhost
   CORS_ALLOWED_ORIGINS=http://localhost:3000

   # Database settings
   DB_NAME=crm_db
   DB_USER=postgres
   DB_PASSWORD=postgres
   DB_HOST=localhost
   DB_PORT=5432
   ```

6. **Database setup:**
   ```bash
   python manage.py migrate
   python manage.py createsuperuser
   ```

7. **Start development server:**
   ```bash
   python manage.py runserver
   ```

### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start development server:**
   ```bash
   npm start
   ```

The application will be available at:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **Admin Panel**: http://localhost:8000/admin

## 🔄 Development Workflow

1. **Start Development Servers:**
   ```bash
   # Terminal 1 - Backend
   cd backend && python manage.py runserver

   # Terminal 2 - Frontend
   cd frontend && npm start
   ```

2. **Code Quality:**
   - Follow PEP 8 for Python code
   - Use ESLint for JavaScript code
   - Write tests for new features
   - Update documentation as needed

3. **Git Workflow:**
   ```bash
   git add .
   git commit -m "feat: description of changes"
   git push origin main
   ```

## 🏗 Architecture Overview

The system follows a **three-tier architecture**:

- **Presentation Tier**: React frontend with Material-UI components
- **Application Tier**: Django REST API with business logic
- **Data Tier**: PostgreSQL database with optimized queries

### Key Design Principles

- **Scalability**: Supports 500+ concurrent users
- **Security**: JWT authentication with role-based access control
- **Performance**: Sub-3-second response times
- **Maintainability**: Modular component architecture
- **Accessibility**: WCAG 2.1 AA compliance

## 🔧 System Requirements

### Performance Requirements
- **Response Time**: < 3 seconds for all operations
- **Concurrent Users**: 500+ supported
- **Uptime**: 99.5% availability
- **Browser Support**: Chrome, Firefox, Safari, Edge (latest versions)

### Security Requirements
- **Authentication**: JWT tokens with 15-minute expiration
- **Authorization**: Role-based access control (RBAC)
- **Communication**: HTTPS-only in production
- **Data Protection**: Encrypted data storage and transmission

## 🧪 Testing

### Backend Testing
```bash
cd backend
python manage.py test
```

### Frontend Testing
```bash
cd frontend
npm test
```

**Test Coverage Goal**: 80% minimum coverage for both frontend and backend

## 📊 Monitoring

The system includes comprehensive monitoring:
- **Application Performance**: Response times, error rates
- **Business Metrics**: User activity, feature usage
- **System Health**: CPU, memory, database performance
- **Security**: Authentication logs, access patterns

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/new-feature`)
3. Commit your changes (`git commit -m 'Add new feature'`)
4. Push to the branch (`git push origin feature/new-feature`)
5. Open a Pull Request



---

**Project Status**: Active Development  
**Version**: 1.0  
**Last Updated**: January 2025

For detailed architectural information, see the [Software Design Document](./Software_Design_Document.md). 