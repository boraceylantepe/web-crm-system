import requests
import json

def get_token():
    url = 'http://localhost:8000/api/token/'
    email = 'bora.ceylantepe@gmail.com'
    password = 'Ea188000.'
    
    response = requests.post(url, json={'email': email, 'password': password})
    if response.status_code == 200:
        token = response.json().get('access')
        print(f"Token obtained successfully: {token[:10]}...")
        return token
    print(f"Failed to get token: {response.status_code}")
    print(response.text)
    return None

def check_url(url, token=None):
    headers = {}
    if token:
        headers['Authorization'] = f'Bearer {token}'
    
    try:
        response = requests.get(url, headers=headers)
        print(f'Status: {response.status_code}')
        print(f'Response: {response.text[:200]}' + ('...' if len(response.text) > 200 else ''))
        return response.status_code == 200
    except Exception as e:
        print(f'Error: {str(e)}')
        return False

if __name__ == "__main__":
    # Get authentication token
    token = get_token()
    
    # Test URLs
    urls_to_test = [
        'http://localhost:8000/api/test/',
        'http://localhost:8000/api/sales/test/',
        'http://localhost:8000/api/sales/pipeline/',
        'http://localhost:8000/api/sales/stats/'
    ]
    
    for url in urls_to_test:
        print(f'\nTesting URL: {url}')
        print(f'With authentication: {"Yes" if token else "No"}')
        check_url(url, token) 