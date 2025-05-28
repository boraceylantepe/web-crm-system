import json
import time

class DebugMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Log incoming request details
        start_time = time.time()
        
        # Get request body details, but don't read if it's a file upload
        if request.content_type and 'multipart/form-data' not in request.content_type:
            try:
                if request.body:
                    body = json.loads(request.body.decode('utf-8'))
                    print(f"Request Body: {json.dumps(body, indent=2)}")
                else:
                    print("Request Body: empty")
            except:
                print(f"Request Body: could not parse - {request.body[:100]}")
        
        # Process the request
        response = self.get_response(request)
        
        # Log response details
        duration = time.time() - start_time
        print(f"Request: {request.method} {request.path} - Status: {response.status_code} - Duration: {duration:.2f}s")
        
        if hasattr(response, 'data'):
            print(f"Response Data: {json.dumps(response.data, indent=2)}")
            
        return response 