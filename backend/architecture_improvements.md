# CRM Architecture & Code Structure Improvements

## Current Architecture Analysis

### ✅ Strengths
- Well-modularized Django apps (customers, sales, tasks, etc.)
- RESTful API design with DRF
- JWT authentication properly implemented
- Role-based permissions system
- React component-based frontend

### ❌ Areas for Improvement
- Mixed responsibilities in views
- Lack of service layer abstraction
- No dependency injection pattern
- Inconsistent error handling
- Limited design patterns usage
- No CQRS pattern for complex operations

## Recommended Architecture Improvements

### 1. Service Layer Pattern Implementation

#### Current Problem
```python
# Currently in views.py - mixed responsibilities
class CustomerViewSet(viewsets.ModelViewSet):
    def create(self, request):
        # Business logic mixed with HTTP handling
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            customer = serializer.save(owner=request.user)
            # Email sending logic here
            send_welcome_email(customer)
            # Analytics tracking here
            track_customer_creation(customer)
            return Response(serializer.data)
```

#### Improved Service Layer
```python
# services/customer_service.py
class CustomerService:
    def __init__(self, email_service=None, analytics_service=None):
        self.email_service = email_service or EmailService()
        self.analytics_service = analytics_service or AnalyticsService()
    
    def create_customer(self, customer_data, owner):
        """Create customer with all business logic encapsulated"""
        try:
            with transaction.atomic():
                # Create customer
                customer = Customer.objects.create(
                    owner=owner,
                    **customer_data
                )
                
                # Business logic
                self._initialize_customer_workflow(customer)
                self._send_welcome_communication(customer)
                self._track_customer_creation(customer)
                
                return customer
                
        except Exception as e:
            logger.error(f"Failed to create customer: {str(e)}")
            raise ServiceException(f"Customer creation failed: {str(e)}")
    
    def _initialize_customer_workflow(self, customer):
        """Initialize customer onboarding workflow"""
        # Create initial tasks
        Task.objects.create(
            title="Initial customer contact",
            customer=customer,
            assigned_to=customer.owner,
            priority='HIGH',
            due_date=timezone.now() + timedelta(days=1)
        )
    
    def _send_welcome_communication(self, customer):
        """Send welcome email and notifications"""
        self.email_service.send_welcome_email(customer)
        self.analytics_service.track_event('customer_created', customer.id)
    
    def update_customer(self, customer_id, update_data, user):
        """Update customer with validation and audit trail"""
        customer = self._get_customer_or_raise(customer_id, user)
        
        # Track changes for audit
        original_data = model_to_dict(customer)
        
        # Apply updates
        for field, value in update_data.items():
            if hasattr(customer, field):
                setattr(customer, field, value)
        
        customer.save()
        
        # Create audit trail
        self._create_audit_record(customer, original_data, update_data, user)
        
        return customer

# Simplified view
class CustomerViewSet(viewsets.ModelViewSet):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.customer_service = CustomerService()
    
    def create(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            customer = self.customer_service.create_customer(
                serializer.validated_data,
                request.user
            )
            response_serializer = self.get_serializer(customer)
            return Response(response_serializer.data, status=status.HTTP_201_CREATED)
            
        except ServiceException as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
```

### 2. Repository Pattern for Data Access

#### Abstract Repository Interface
```python
# repositories/base.py
from abc import ABC, abstractmethod
from typing import List, Optional, Dict, Any

class BaseRepository(ABC):
    @abstractmethod
    def get_by_id(self, id: int) -> Optional[Any]:
        pass
    
    @abstractmethod
    def get_all(self, filters: Dict = None) -> List[Any]:
        pass
    
    @abstractmethod
    def create(self, data: Dict) -> Any:
        pass
    
    @abstractmethod
    def update(self, id: int, data: Dict) -> Any:
        pass
    
    @abstractmethod
    def delete(self, id: int) -> bool:
        pass

# repositories/customer_repository.py
class CustomerRepository(BaseRepository):
    def __init__(self):
        self.model = Customer
    
    def get_by_id(self, id: int) -> Optional[Customer]:
        try:
            return self.model.objects.select_related('owner').get(id=id)
        except self.model.DoesNotExist:
            return None
    
    def get_all(self, filters: Dict = None) -> List[Customer]:
        queryset = self.model.objects.select_related('owner').prefetch_related('sales', 'tasks')
        
        if filters:
            if 'owner' in filters:
                queryset = queryset.filter(owner=filters['owner'])
            if 'status' in filters:
                queryset = queryset.filter(status=filters['status'])
            if 'search' in filters:
                queryset = queryset.filter(
                    Q(name__icontains=filters['search']) |
                    Q(email__icontains=filters['search']) |
                    Q(company__icontains=filters['search'])
                )
        
        return list(queryset)
    
    def create(self, data: Dict) -> Customer:
        return self.model.objects.create(**data)
    
    def update(self, id: int, data: Dict) -> Customer:
        customer = self.get_by_id(id)
        if not customer:
            raise ValueError(f"Customer with id {id} not found")
        
        for field, value in data.items():
            setattr(customer, field, value)
        customer.save()
        return customer
    
    def get_by_owner(self, owner) -> List[Customer]:
        return list(self.model.objects.filter(owner=owner).select_related('owner'))
    
    def get_high_value_customers(self, threshold: float = 10000) -> List[Customer]:
        """Get customers with high total sales value"""
        return list(
            self.model.objects.annotate(
                total_sales=models.Sum('sales__amount')
            ).filter(
                total_sales__gte=threshold
            ).select_related('owner')
        )
```

### 3. Domain-Driven Design (DDD) Approach

#### Domain Models with Business Logic
```python
# domains/customer.py
class CustomerDomain:
    def __init__(self, customer: Customer):
        self.customer = customer
    
    def calculate_customer_value(self) -> float:
        """Calculate total customer value"""
        return sum(
            float(sale.amount or 0) 
            for sale in self.customer.sales.filter(status='WON')
        )
    
    def get_engagement_score(self) -> int:
        """Calculate customer engagement score"""
        score = 0
        
        # Recent activity score
        recent_activities = self.customer.activities.filter(
            created_at__gte=timezone.now() - timedelta(days=30)
        )
        score += min(recent_activities.count() * 10, 50)
        
        # Email engagement score
        if hasattr(self.customer, 'email_stats'):
            open_rate = self.customer.email_stats.open_rate
            score += int(open_rate * 30)
        
        # Sales pipeline score
        active_sales = self.customer.sales.filter(
            status__in=['NEW', 'CONTACTED', 'PROPOSAL', 'NEGOTIATION']
        )
        score += min(active_sales.count() * 15, 30)
        
        return min(score, 100)
    
    def is_at_risk(self) -> bool:
        """Determine if customer is at risk of churning"""
        if not self.customer.last_contact_date:
            return True
        
        days_since_contact = (timezone.now().date() - self.customer.last_contact_date).days
        
        # High-value customers get more attention
        if self.calculate_customer_value() > 50000:
            return days_since_contact > 14
        else:
            return days_since_contact > 30
    
    def get_recommended_actions(self) -> List[str]:
        """Get recommended actions for this customer"""
        actions = []
        
        if self.is_at_risk():
            actions.append("Schedule immediate follow-up call")
            actions.append("Send personalized check-in email")
        
        if self.get_engagement_score() < 30:
            actions.append("Increase engagement with valuable content")
            actions.append("Offer product demo or consultation")
        
        if not self.customer.sales.exists():
            actions.append("Create sales opportunity")
            actions.append("Schedule needs assessment")
        
        return actions

# domains/sales.py
class SalesDomain:
    def __init__(self, sale: Sale):
        self.sale = sale
    
    def calculate_win_probability(self) -> float:
        """Calculate probability of winning this sale"""
        base_probability = {
            'NEW': 0.10,
            'CONTACTED': 0.25,
            'PROPOSAL': 0.50,
            'NEGOTIATION': 0.75,
        }
        
        prob = base_probability.get(self.sale.status, 0.10)
        
        # Adjust based on customer engagement
        customer_domain = CustomerDomain(self.sale.customer)
        engagement_score = customer_domain.get_engagement_score()
        
        if engagement_score > 70:
            prob *= 1.3
        elif engagement_score < 30:
            prob *= 0.7
        
        # Adjust based on deal age
        days_old = (timezone.now().date() - self.sale.created_at.date()).days
        if days_old > 90:
            prob *= 0.8
        
        return min(prob, 0.95)
    
    def get_next_actions(self) -> List[str]:
        """Get recommended next actions for this sale"""
        actions = []
        
        if self.sale.status == 'NEW':
            actions.extend([
                "Make initial contact within 24 hours",
                "Research customer background",
                "Qualify budget and timeline"
            ])
        elif self.sale.status == 'CONTACTED':
            actions.extend([
                "Send product information",
                "Schedule discovery call",
                "Identify decision makers"
            ])
        elif self.sale.status == 'PROPOSAL':
            actions.extend([
                "Follow up on proposal",
                "Address questions/objections",
                "Schedule closing call"
            ])
        
        return actions
```

### 4. Event-Driven Architecture

#### Domain Events System
```python
# events/base.py
from abc import ABC, abstractmethod
from typing import Any, Dict
import uuid
from datetime import datetime

class DomainEvent(ABC):
    def __init__(self):
        self.id = str(uuid.uuid4())
        self.occurred_at = datetime.now()
        self.version = 1
    
    @abstractmethod
    def to_dict(self) -> Dict[str, Any]:
        pass

class EventHandler(ABC):
    @abstractmethod
    def handle(self, event: DomainEvent):
        pass

# events/customer_events.py
class CustomerCreatedEvent(DomainEvent):
    def __init__(self, customer_id: int, customer_data: Dict):
        super().__init__()
        self.customer_id = customer_id
        self.customer_data = customer_data
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            'id': self.id,
            'type': 'customer_created',
            'customer_id': self.customer_id,
            'customer_data': self.customer_data,
            'occurred_at': self.occurred_at.isoformat()
        }

class CustomerUpdatedEvent(DomainEvent):
    def __init__(self, customer_id: int, changes: Dict):
        super().__init__()
        self.customer_id = customer_id
        self.changes = changes
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            'id': self.id,
            'type': 'customer_updated',
            'customer_id': self.customer_id,
            'changes': self.changes,
            'occurred_at': self.occurred_at.isoformat()
        }

# Event handlers
class WelcomeEmailHandler(EventHandler):
    def __init__(self, email_service):
        self.email_service = email_service
    
    def handle(self, event: CustomerCreatedEvent):
        customer = Customer.objects.get(id=event.customer_id)
        self.email_service.send_welcome_email(customer)

class CustomerAnalyticsHandler(EventHandler):
    def __init__(self, analytics_service):
        self.analytics_service = analytics_service
    
    def handle(self, event: CustomerCreatedEvent):
        self.analytics_service.track_customer_creation(event.customer_id)

# Event dispatcher
class EventDispatcher:
    def __init__(self):
        self.handlers = {}
    
    def register_handler(self, event_type: str, handler: EventHandler):
        if event_type not in self.handlers:
            self.handlers[event_type] = []
        self.handlers[event_type].append(handler)
    
    def dispatch(self, event: DomainEvent):
        event_type = event.__class__.__name__
        
        if event_type in self.handlers:
            for handler in self.handlers[event_type]:
                try:
                    handler.handle(event)
                except Exception as e:
                    logger.error(f"Event handler failed: {str(e)}")
```

### 5. CQRS Pattern for Complex Operations

#### Command and Query Separation
```python
# commands/customer_commands.py
from dataclasses import dataclass
from typing import Optional

@dataclass
class CreateCustomerCommand:
    name: str
    email: str
    company: Optional[str] = None
    phone: Optional[str] = None
    owner_id: int = None

@dataclass
class UpdateCustomerCommand:
    customer_id: int
    name: Optional[str] = None
    email: Optional[str] = None
    company: Optional[str] = None
    phone: Optional[str] = None

# Command handlers
class CreateCustomerCommandHandler:
    def __init__(self, customer_repository, event_dispatcher):
        self.customer_repository = customer_repository
        self.event_dispatcher = event_dispatcher
    
    def handle(self, command: CreateCustomerCommand) -> Customer:
        # Validation
        if self.customer_repository.get_by_email(command.email):
            raise ValueError("Customer with this email already exists")
        
        # Create customer
        customer_data = {
            'name': command.name,
            'email': command.email,
            'company': command.company,
            'phone': command.phone,
            'owner_id': command.owner_id
        }
        
        customer = self.customer_repository.create(customer_data)
        
        # Dispatch event
        event = CustomerCreatedEvent(customer.id, customer_data)
        self.event_dispatcher.dispatch(event)
        
        return customer

# queries/customer_queries.py
@dataclass
class GetCustomersQuery:
    owner_id: Optional[int] = None
    status: Optional[str] = None
    search: Optional[str] = None
    limit: int = 50
    offset: int = 0

class CustomerQueryHandler:
    def __init__(self, customer_repository):
        self.customer_repository = customer_repository
    
    def handle(self, query: GetCustomersQuery) -> List[Customer]:
        filters = {}
        
        if query.owner_id:
            filters['owner'] = query.owner_id
        if query.status:
            filters['status'] = query.status
        if query.search:
            filters['search'] = query.search
        
        return self.customer_repository.get_all(filters)
```

### 6. Dependency Injection Container

#### Service Container Implementation
```python
# core/container.py
class ServiceContainer:
    def __init__(self):
        self._services = {}
        self._singletons = {}
    
    def register(self, service_name: str, service_class, singleton: bool = False):
        """Register a service"""
        self._services[service_name] = {
            'class': service_class,
            'singleton': singleton
        }
    
    def get(self, service_name: str):
        """Get service instance"""
        if service_name not in self._services:
            raise ValueError(f"Service {service_name} not registered")
        
        service_config = self._services[service_name]
        
        if service_config['singleton']:
            if service_name not in self._singletons:
                self._singletons[service_name] = service_config['class']()
            return self._singletons[service_name]
        
        return service_config['class']()

# Setup container
def setup_container() -> ServiceContainer:
    container = ServiceContainer()
    
    # Repositories
    container.register('customer_repository', CustomerRepository, singleton=True)
    container.register('sales_repository', SalesRepository, singleton=True)
    
    # Services
    container.register('email_service', EmailService, singleton=True)
    container.register('analytics_service', AnalyticsService, singleton=True)
    container.register('customer_service', lambda: CustomerService(
        container.get('customer_repository'),
        container.get('email_service'),
        container.get('analytics_service')
    ))
    
    return container
```

### 7. Improved Error Handling

#### Custom Exception Hierarchy
```python
# exceptions/base.py
class CRMException(Exception):
    """Base exception for CRM application"""
    def __init__(self, message: str, error_code: str = None):
        self.message = message
        self.error_code = error_code
        super().__init__(message)

class ValidationException(CRMException):
    """Raised when validation fails"""
    pass

class ServiceException(CRMException):
    """Raised when service operation fails"""
    pass

class RepositoryException(CRMException):
    """Raised when repository operation fails"""
    pass

class PermissionException(CRMException):
    """Raised when user lacks permission"""
    pass

# Custom exception handler
def custom_exception_handler(exc, context):
    """Enhanced exception handler with proper error responses"""
    
    if isinstance(exc, ValidationException):
        return Response({
            'error': 'Validation Error',
            'message': exc.message,
            'error_code': exc.error_code
        }, status=status.HTTP_400_BAD_REQUEST)
    
    if isinstance(exc, PermissionException):
        return Response({
            'error': 'Permission Denied',
            'message': exc.message,
        }, status=status.HTTP_403_FORBIDDEN)
    
    if isinstance(exc, ServiceException):
        return Response({
            'error': 'Service Error',
            'message': exc.message,
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    # Log unexpected errors
    logger.error(f"Unexpected error: {str(exc)}", exc_info=True)
    
    return Response({
        'error': 'Internal Server Error',
        'message': 'An unexpected error occurred'
    }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
```

### 8. Clean Architecture Structure

#### Recommended Project Structure
```
backend/
├── core/                    # Core application logic
│   ├── container.py        # Dependency injection
│   ├── settings/           # Environment-specific settings
│   └── middleware/         # Custom middleware
├── domains/                # Domain models and business logic
│   ├── customer.py
│   ├── sales.py
│   └── tasks.py
├── applications/           # Application services
│   ├── customer_service.py
│   ├── sales_service.py
│   └── notification_service.py
├── repositories/           # Data access layer
│   ├── base.py
│   ├── customer_repository.py
│   └── sales_repository.py
├── commands/               # CQRS commands
│   ├── customer_commands.py
│   └── sales_commands.py
├── queries/                # CQRS queries
│   ├── customer_queries.py
│   └── sales_queries.py
├── events/                 # Domain events
│   ├── base.py
│   ├── customer_events.py
│   └── sales_events.py
├── infrastructure/         # External services
│   ├── email/
│   ├── cache/
│   └── storage/
├── api/                    # API layer
│   ├── serializers/
│   ├── views/
│   └── permissions/
└── exceptions/             # Custom exceptions
    ├── base.py
    └── handlers.py
```

### 9. Performance Patterns

#### Caching Strategy Implementation
```python
# infrastructure/cache.py
from django.core.cache import cache
from typing import Any, Optional, Callable
import functools
import hashlib
import json

class CacheService:
    def __init__(self, default_timeout: int = 300):
        self.default_timeout = default_timeout
    
    def get(self, key: str) -> Optional[Any]:
        return cache.get(key)
    
    def set(self, key: str, value: Any, timeout: Optional[int] = None) -> None:
        cache.set(key, value, timeout or self.default_timeout)
    
    def delete(self, key: str) -> None:
        cache.delete(key)
    
    def get_or_set(self, key: str, callable_func: Callable, timeout: Optional[int] = None) -> Any:
        """Get from cache or set using callable"""
        value = self.get(key)
        if value is None:
            value = callable_func()
            self.set(key, value, timeout)
        return value

def cached_method(timeout: int = 300, key_prefix: str = ''):
    """Decorator for caching method results"""
    def decorator(func):
        @functools.wraps(func)
        def wrapper(self, *args, **kwargs):
            # Generate cache key
            key_data = {
                'class': self.__class__.__name__,
                'method': func.__name__,
                'args': args,
                'kwargs': kwargs
            }
            key_hash = hashlib.md5(json.dumps(key_data, sort_keys=True).encode()).hexdigest()
            cache_key = f"{key_prefix}:{key_hash}"
            
            # Try to get from cache
            cached_result = cache.get(cache_key)
            if cached_result is not None:
                return cached_result
            
            # Execute and cache
            result = func(self, *args, **kwargs)
            cache.set(cache_key, result, timeout)
            return result
        
        return wrapper
    return decorator
```

### 10. Implementation Checklist

#### Phase 1: Core Architecture (2-3 weeks)
- [ ] Implement service layer pattern
- [ ] Create repository interfaces
- [ ] Set up dependency injection container
- [ ] Implement custom exception hierarchy
- [ ] Create domain models with business logic

#### Phase 2: Advanced Patterns (3-4 weeks)
- [ ] Implement event-driven architecture
- [ ] Add CQRS pattern for complex operations
- [ ] Create caching service layer
- [ ] Implement audit logging improvements
- [ ] Add performance monitoring

#### Phase 3: Testing & Documentation (2 weeks)
- [ ] Update tests for new architecture
- [ ] Create architecture documentation
- [ ] Performance testing
- [ ] Code review and refactoring

This architectural improvement will make your CRM system more maintainable, testable, and scalable while following industry best practices and design patterns. 