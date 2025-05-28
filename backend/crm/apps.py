from django.apps import AppConfig

class CrmConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'crm'

    def ready(self):
        # Unregister the Group model only after all apps are loaded
        from django.contrib import admin
        from django.contrib.auth.models import Group
        
        # Only try to unregister if it's registered
        if Group in admin.site._registry:
            admin.site.unregister(Group) 