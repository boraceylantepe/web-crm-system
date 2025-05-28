# CRM Performance Optimization Guide

## Database Optimization

### 1. Switch to PostgreSQL Everywhere
- Currently using SQLite in development, PostgreSQL in production
- This creates environment parity issues
- **Action**: Use PostgreSQL in development too

### 2. Query Optimization Needed

#### Current Problem Areas:
```python
# In sales/views.py - Missing select_related optimization
sales = Sale.objects.filter(is_archived=False).select_related('customer', 'assigned_to')
# Good! But could be better with prefetch_related for related notes

# In notifications/views.py - Missing optimization
queryset = SaleNote.objects.all().select_related('author').order_by('-created_at')
# Should also include sale data
```

#### Recommended Optimizations:
```python
# Better sales query
sales = Sale.objects.filter(is_archived=False).select_related(
    'customer', 'assigned_to'
).prefetch_related('notes', 'events')

# Better notifications query
notifications = Notification.objects.filter(recipient=user).select_related(
    'category', 'content_type'
).order_by('-created_at')

# Customer queries with related data
customers = Customer.objects.select_related('owner').prefetch_related(
    'sales', 'tasks', 'events'
)
```

### 3. Database Indexing Strategy

Add these indexes to models:
```python
# In customers/models.py
class Customer(TimeStampedModel):
    class Meta:
        indexes = [
            models.Index(fields=['email']),  # Unique lookups
            models.Index(fields=['status', 'is_active']),  # Filtering
            models.Index(fields=['engagement_level']),
            models.Index(fields=['region']),
            models.Index(fields=['owner', 'status']),  # Composite for permissions
        ]

# In sales/models.py  
class Sale(TimeStampedModel):
    class Meta:
        indexes = [
            models.Index(fields=['status', 'is_archived']),  # Pipeline queries
            models.Index(fields=['assigned_to', 'status']),
            models.Index(fields=['expected_close_date']),
            models.Index(fields=['customer', 'status']),
            models.Index(fields=['created_at']),  # Ordering
        ]

# In tasks/models.py
class Task(TimeStampedModel):
    class Meta:
        indexes = [
            models.Index(fields=['assigned_to', 'status']),
            models.Index(fields=['due_date']),
            models.Index(fields=['priority', 'status']),
        ]
```

## Caching Strategy

### 1. Redis Implementation
```python
# settings.py - Replace database cache with Redis
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.redis.RedisCache',
        'LOCATION': 'redis://127.0.0.1:6379/1',
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
        },
        'KEY_PREFIX': 'crm',
        'TIMEOUT': 300,
    }
}
```

### 2. View-Level Caching
```python
from django.views.decorators.cache import cache_page
from django.utils.decorators import method_decorator

@method_decorator(cache_page(60 * 5), name='dispatch')  # 5 minutes
class CustomerViewSet(viewsets.ModelViewSet):
    # Cached for read operations
    pass
```

### 3. Template Fragment Caching
```python
# For dashboard widgets
@cache_page(60 * 15)  # 15 minutes
def dashboard_kpis(request):
    # Cache expensive KPI calculations
    pass
```

## Frontend Performance

### 1. React Optimization
```javascript
// Implement React.memo for expensive components
const CustomerCard = React.memo(({ customer, onEdit }) => {
  return (
    <div className="customer-card">
      {/* Component content */}
    </div>
  );
});

// Use useCallback for event handlers
const CustomerList = () => {
  const handleEdit = useCallback((customerId) => {
    // Edit logic
  }, []);
  
  const handleDelete = useCallback((customerId) => {
    // Delete logic
  }, []);
};

// Implement virtual scrolling for large lists
import { FixedSizeList as List } from 'react-window';
```

### 2. API Request Optimization
```javascript
// Implement request debouncing
import { debounce } from 'lodash';

const debouncedSearch = useCallback(
  debounce((searchTerm) => {
    // API call
  }, 300),
  []
);

// Request batching
const BatchedAPI = {
  queue: [],
  
  addRequest(request) {
    this.queue.push(request);
    this.processBatch();
  },
  
  processBatch: debounce(function() {
    // Process queued requests together
  }, 100)
};
```

## Background Jobs

### 1. Celery Implementation
```python
# Install: pip install celery redis

# celery.py
from celery import Celery
import os

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'crm.settings')

app = Celery('crm')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()

# Background tasks
@app.task
def send_notification_email(user_id, message):
    # Email sending logic
    pass

@app.task  
def generate_report(report_id):
    # Heavy report generation
    pass

@app.task
def cleanup_old_data():
    # Data cleanup tasks
    pass
```

## Monitoring & Profiling

### 1. Django Debug Toolbar (Development)
```python
# settings.py
if DEBUG:
    INSTALLED_APPS += ['debug_toolbar']
    MIDDLEWARE += ['debug_toolbar.middleware.DebugToolbarMiddleware']
```

### 2. Performance Monitoring
```python
# Custom middleware for API response times
class PerformanceMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        start_time = time.time()
        response = self.get_response(request)
        duration = time.time() - start_time
        
        if duration > 1.0:  # Log slow requests
            logger.warning(f"Slow request: {request.path} took {duration:.2f}s")
        
        return response
``` 