import logging
import traceback
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status

logger = logging.getLogger(__name__)

def custom_exception_handler(exc, context):
    """
    Custom exception handler to provide better error logging
    """
    # Call REST framework's default exception handler first to get the standard response
    response = exception_handler(exc, context)
    
    # If response is None then there was an unhandled exception
    if response is None:
        logger.error(f"Unhandled exception: {str(exc)}")
        logger.error(traceback.format_exc())
        
        return Response(
            {'error': 'An unexpected error occurred. Please try again later.'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    
    # Log details about the error
    logger.error(f"API Error: {str(exc)}")
    logger.error(f"API Error context: {context['view'].__class__.__name__}.{context['request'].method}")
    
    # Add more detail to the response if needed
    if response.status_code == 404:
        view_name = context['view'].__class__.__name__
        view_method = context['request'].method
        logger.error(f"Not found error in {view_name} with method {view_method}")
        response.data = {
            'detail': 'The requested resource was not found.',
            'status_code': 404
        }
    
    return response 