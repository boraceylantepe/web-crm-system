from django.apps import AppConfig
import sys


class TasksConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'tasks'
    
    def ready(self):
        # Avoid running scheduler in management commands or tests
        if 'runserver' in sys.argv:
            # Import here to avoid circular imports
            from .scheduler import run_scheduler_in_thread
            run_scheduler_in_thread()
