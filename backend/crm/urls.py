"""
URL configuration for crm project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/4.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import (
    TokenRefreshView,
)
from accounts.authentication import CustomTokenObtainPairView
from sales import views as sales_views

# Create a custom admin site
class CustomAdminSite(admin.AdminSite):
    """Custom admin site to override the default admin site"""
    
    def get_app_list(self, request, app_label=None):
        """
        Return a sorted list of all the installed apps that have been
        registered in this site.
        """
        app_list = super().get_app_list(request, app_label)
        
        # Remove the Auth Group model from the admin
        for app in app_list:
            if app['app_label'] == 'auth':
                # Filter out Group model from the models list
                app['models'] = [model for model in app['models'] if model['object_name'] != 'Group']
                # If there are no models left in this app, remove the app
                if not app['models']:
                    app_list.remove(app)
                    
        return app_list

# Create an instance of the custom admin site
admin_site = CustomAdminSite(name='admin')

# Copy registrations from the default admin site to our custom site
admin_models = list(admin.site._registry.items())
for model, model_admin in admin_models:
    admin_site.register(model, model_admin.__class__)

urlpatterns = [
    # Admin site
    path('admin/', admin_site.urls),

    # API test endpoint
    path('api/test/', sales_views.test_endpoint, name='test-endpoint'),
    
    # CRITICAL - Exact URL endpoints as expected by frontend
    path('api/sales/pipeline/', sales_views.sales_pipeline, name='sales-pipeline-exact'),
    path('api/sales/stats/', sales_views.sales_stats, name='sales-stats-exact'),
    
    # API Router for standard views
    path('api/', include('api.urls')),
    
    # Authentication
    path('api/token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # Include sales URLs with prefix
    path('api/sales/', include('sales.urls')),
    
    # Include reporting URLs
    path('api/reporting/', include('reporting.urls')),
]

# Serve static and media files in development
if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
