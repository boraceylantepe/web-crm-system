# CRM Testing Strategy & Implementation Guide

## Current State
- All test files are empty (`from django.test import TestCase`)
- No test coverage
- No CI/CD pipeline
- Frontend has basic test setup but minimal tests

## Comprehensive Testing Plan

### 1. Backend Testing Strategy

#### Unit Tests for Models
```python
# customers/tests.py
from django.test import TestCase
from django.contrib.auth import get_user_model
from customers.models import Customer
from django.core.exceptions import ValidationError

User = get_user_model()

class CustomerModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123'
        )
        
    def test_customer_creation(self):
        customer = Customer.objects.create(
            name='Test Customer',
            email='customer@example.com',
            owner=self.user
        )
        self.assertEqual(customer.name, 'Test Customer')
        self.assertEqual(customer.status, 'ACTIVE')
        
    def test_customer_unique_email(self):
        Customer.objects.create(
            name='Customer 1',
            email='duplicate@example.com',
            owner=self.user
        )
        
        with self.assertRaises(ValidationError):
            Customer.objects.create(
                name='Customer 2',
                email='duplicate@example.com',
                owner=self.user
            )
```

#### API Tests  
```python
# api/tests.py
from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model
from customers.models import Customer

User = get_user_model()

class CustomerAPITest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123'
        )
        self.client.force_authenticate(user=self.user)
        
    def test_create_customer(self):
        data = {
            'name': 'Test Customer',
            'email': 'test@customer.com',
            'company': 'Test Company'
        }
        response = self.client.post('/api/customers/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Customer.objects.count(), 1)
        
    def test_list_customers(self):
        Customer.objects.create(
            name='Customer 1',
            email='customer1@example.com',
            owner=self.user
        )
        response = self.client.get('/api/customers/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        
    def test_unauthorized_access(self):
        self.client.logout()
        response = self.client.get('/api/customers/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
```

#### Integration Tests
```python
# integration_tests.py
from django.test import TransactionTestCase
from django.db import transaction
from customers.models import Customer
from sales.models import Sale
from tasks.models import Task

class CRMWorkflowTest(TransactionTestCase):
    def test_complete_sales_workflow(self):
        """Test complete customer -> sale -> task workflow"""
        with transaction.atomic():
            # Create customer
            customer = Customer.objects.create(
                name='Integration Test Customer',
                email='integration@test.com',
                owner=self.user
            )
            
            # Create sale
            sale = Sale.objects.create(
                title='Test Sale',
                customer=customer,
                assigned_to=self.user,
                amount=1000.00
            )
            
            # Create related task
            task = Task.objects.create(
                title='Follow up with customer',
                assigned_to=self.user,
                customer=customer,
                sale=sale
            )
            
            # Verify relationships
            self.assertEqual(customer.sales.count(), 1)
            self.assertEqual(customer.tasks.count(), 1)
            self.assertEqual(sale.tasks.count(), 1)
```

#### Performance Tests
```python
# performance_tests.py
from django.test import TestCase
from django.test.utils import override_settings
from django.core.cache import cache
import time

class PerformanceTest(TestCase):
    def test_customer_list_performance(self):
        # Create 1000 customers
        customers = []
        for i in range(1000):
            customers.append(Customer(
                name=f'Customer {i}',
                email=f'customer{i}@example.com',
                owner=self.user
            ))
        Customer.objects.bulk_create(customers)
        
        # Test query performance
        start_time = time.time()
        response = self.client.get('/api/customers/')
        duration = time.time() - start_time
        
        self.assertLess(duration, 2.0)  # Should complete in under 2 seconds
        self.assertEqual(response.status_code, 200)
```

### 2. Frontend Testing Strategy

#### Component Tests
```javascript
// src/components/__tests__/CustomerCard.test.js
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import CustomerCard from '../customer/CustomerCard';

const mockCustomer = {
  id: 1,
  name: 'Test Customer',
  email: 'test@customer.com',
  company: 'Test Company'
};

describe('CustomerCard', () => {
  test('renders customer information', () => {
    render(<CustomerCard customer={mockCustomer} />);
    
    expect(screen.getByText('Test Customer')).toBeInTheDocument();
    expect(screen.getByText('test@customer.com')).toBeInTheDocument();
    expect(screen.getByText('Test Company')).toBeInTheDocument();
  });
  
  test('calls onEdit when edit button is clicked', () => {
    const mockOnEdit = jest.fn();
    render(<CustomerCard customer={mockCustomer} onEdit={mockOnEdit} />);
    
    fireEvent.click(screen.getByText('Edit'));
    expect(mockOnEdit).toHaveBeenCalledWith(mockCustomer.id);
  });
});
```

#### Integration Tests  
```javascript
// src/pages/__tests__/Customers.test.js
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Customers from '../Customers';
import * as customerService from '../../services/customerService';

// Mock the service
jest.mock('../../services/customerService');

const MockedCustomers = () => (
  <BrowserRouter>
    <Customers />
  </BrowserRouter>
);

describe('Customers Page', () => {
  test('displays customers after loading', async () => {
    const mockCustomers = [
      { id: 1, name: 'Customer 1', email: 'customer1@test.com' },
      { id: 2, name: 'Customer 2', email: 'customer2@test.com' }
    ];
    
    customerService.getCustomers.mockResolvedValue({
      data: { results: mockCustomers }
    });
    
    render(<MockedCustomers />);
    
    await waitFor(() => {
      expect(screen.getByText('Customer 1')).toBeInTheDocument();
      expect(screen.getByText('Customer 2')).toBeInTheDocument();
    });
  });
});
```

#### E2E Tests with Cypress
```javascript
// cypress/integration/customer_management.spec.js
describe('Customer Management', () => {
  beforeEach(() => {
    // Login
    cy.visit('/login');
    cy.get('[data-testid=email]').type('admin@example.com');
    cy.get('[data-testid=password]').type('password');
    cy.get('[data-testid=login-button]').click();
  });
  
  it('should create a new customer', () => {
    cy.visit('/customers');
    cy.get('[data-testid=add-customer-button]').click();
    
    cy.get('[data-testid=customer-name]').type('New Customer');
    cy.get('[data-testid=customer-email]').type('new@customer.com');
    cy.get('[data-testid=save-button]').click();
    
    cy.contains('Customer created successfully');
    cy.contains('New Customer');
  });
  
  it('should edit existing customer', () => {
    cy.visit('/customers');
    cy.get('[data-testid=customer-card]').first().click();
    cy.get('[data-testid=edit-button]').click();
    
    cy.get('[data-testid=customer-name]').clear().type('Updated Customer');
    cy.get('[data-testid=save-button]').click();
    
    cy.contains('Customer updated successfully');
    cy.contains('Updated Customer');
  });
});
```

### 3. Test Configuration & Setup

#### pytest Configuration
```python
# pytest.ini
[tool:pytest]
DJANGO_SETTINGS_MODULE = crm.test_settings
python_files = tests.py test_*.py *_tests.py
addopts = --tb=short --strict-markers --disable-warnings
markers = 
    unit: Unit tests
    integration: Integration tests
    performance: Performance tests
    slow: Slow running tests
```

#### Test Settings
```python
# crm/test_settings.py
from .settings import *

# Use in-memory database for faster tests
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': ':memory:',
    }
}

# Disable cache during tests
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.dummy.DummyCache',
    }
}

# Speed up password hashing
PASSWORD_HASHERS = [
    'django.contrib.auth.hashers.MD5PasswordHasher',
]

# Disable migrations for faster tests
class DisableMigrations:
    def __contains__(self, item):
        return True
    
    def __getitem__(self, item):
        return None

MIGRATION_MODULES = DisableMigrations()
```

#### Coverage Configuration
```ini
# .coveragerc
[run]
source = .
omit = 
    */venv/*
    */migrations/*
    */test_*
    manage.py
    */settings/*
    */node_modules/*

[report]
exclude_lines =
    pragma: no cover
    def __repr__
    raise AssertionError
    raise NotImplementedError
```

### 4. CI/CD Pipeline

#### GitHub Actions
```yaml
# .github/workflows/test.yml
name: Test Suite

on: [push, pull_request]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:13
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: test_crm
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Set up Python
      uses: actions/setup-python@v2
      with:
        python-version: 3.9
    
    - name: Install dependencies
      run: |
        cd backend
        pip install -r requirements.txt
        pip install pytest-django coverage
    
    - name: Run tests with coverage
      run: |
        cd backend
        coverage run --source='.' manage.py test
        coverage report --fail-under=80
    
  frontend-tests:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '16'
    
    - name: Install dependencies
      run: |
        cd frontend
        npm install
    
    - name: Run tests
      run: |
        cd frontend
        npm test -- --coverage --watchAll=false
    
    - name: Run E2E tests
      run: |
        cd frontend
        npm run test:e2e
```

### 5. Testing Commands

```bash
# Backend testing
cd backend
python manage.py test                     # Run all tests
python manage.py test customers          # Test specific app
pytest -m unit                          # Run only unit tests  
pytest -m integration                   # Run only integration tests
coverage run manage.py test && coverage report

# Frontend testing
cd frontend
npm test                                 # Interactive test runner
npm test -- --coverage                  # With coverage
npm run test:e2e                        # E2E tests
```

### 6. Test Data Management

#### Factory Pattern
```python
# tests/factories.py
import factory
from django.contrib.auth import get_user_model
from customers.models import Customer
from sales.models import Sale

User = get_user_model()

class UserFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = User
    
    email = factory.Sequence(lambda n: f'user{n}@example.com')
    first_name = factory.Faker('first_name')
    last_name = factory.Faker('last_name')

class CustomerFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Customer
    
    name = factory.Faker('company')
    email = factory.Faker('email')
    owner = factory.SubFactory(UserFactory)

class SaleFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Sale
    
    title = factory.Faker('catch_phrase')
    customer = factory.SubFactory(CustomerFactory)
    assigned_to = factory.SubFactory(UserFactory)
    amount = factory.Faker('pydecimal', left_digits=5, right_digits=2, positive=True)
```

### 7. Testing Best Practices

1. **AAA Pattern**: Arrange, Act, Assert
2. **Test isolation**: Each test should be independent
3. **Descriptive names**: Test names should describe what they test
4. **Mock external dependencies**: Don't rely on external services
5. **Test edge cases**: Include error conditions and boundary values
6. **Regular test runs**: Integrate with development workflow 