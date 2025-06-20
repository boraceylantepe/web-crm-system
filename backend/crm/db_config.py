# Database Configuration for PostgreSQL
import os

POSTGRESQL_CONFIG = {
    'ENGINE': 'django.db.backends.postgresql',
    'NAME': os.getenv('DB_NAME', 'crm_database'),
    'USER': os.getenv('DB_USER', 'postgres'),
    'PASSWORD': os.getenv('DB_PASSWORD'),  # Must be set in environment variables
    'HOST': os.getenv('DB_HOST', 'localhost'),
    'PORT': os.getenv('DB_PORT', '5432'),
}

# Validate that critical environment variables are set
if not POSTGRESQL_CONFIG['PASSWORD']:
    raise ValueError(
        "DB_PASSWORD environment variable must be set. "
        "Please create a .env file in the backend directory with your database credentials."
    )

