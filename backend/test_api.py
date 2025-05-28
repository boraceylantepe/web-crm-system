import requests
import json
import sys

BASE_URL = 'http://localhost:8000/api'

def get_token(email, password):
    """Get a JWT token"""
    url = f"{BASE_URL}/token/"
    response = requests.post(url, json={"email": email, "password": password})
    
    if response.status_code != 200:
        print(f"Failed to get token: {response.status_code}")
        print(response.text)
        return None
    
    return response.json().get('access')

def get_pipeline(token):
    """Get sales pipeline"""
    url = f"{BASE_URL}/sales/pipeline/"
    headers = {'Authorization': f'Bearer {token}'}
    
    response = requests.get(url, headers=headers)
    print(f"Pipeline status code: {response.status_code}")
    
    if response.status_code != 200:
        print(f"Failed to get pipeline: {response.status_code}")
        print(response.text)
        return False
    
    result = response.json()
    print("Pipeline keys:", list(result.keys()))
    
    # Print sales count by status
    for status, sales in result.items():
        print(f"Status {status}: {len(sales)} sales")
    
    return True

def get_stats(token):
    """Get sales stats"""
    url = f"{BASE_URL}/sales/stats/"
    headers = {'Authorization': f'Bearer {token}'}
    
    response = requests.get(url, headers=headers)
    print(f"Stats status code: {response.status_code}")
    
    if response.status_code != 200:
        print(f"Failed to get stats: {response.status_code}")
        print(response.text)
        return False
    
    result = response.json()
    print("Stats:", json.dumps(result, indent=2))
    
    return True

def create_sale(token):
    """Create a sale"""
    url = f"{BASE_URL}/sales/"
    headers = {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}
    
    # Get a customer
    customers_response = requests.get(f"{BASE_URL}/customers/", headers=headers)
    if customers_response.status_code != 200 or not customers_response.json():
        print("No customers found")
        return False
    
    customer_id = customers_response.json()[0]['id']
    
    # Create sale
    sale_data = {
        "title": "Test Sale from API",
        "customer": customer_id,
        "status": "NEW",
        "amount": 5000,
        "priority": "MEDIUM"
    }
    
    response = requests.post(url, json=sale_data, headers=headers)
    print(f"Create sale status code: {response.status_code}")
    
    if response.status_code not in [200, 201]:
        print(f"Failed to create sale: {response.status_code}")
        print(response.text)
        return False
    
    print("Sale created:", json.dumps(response.json(), indent=2))
    return response.json()['id']

def update_sale_status(token, sale_id, new_status):
    """Update sale status"""
    url = f"{BASE_URL}/sales/{sale_id}/update_status/"
    headers = {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}
    
    response = requests.post(url, json={"status": new_status}, headers=headers)
    print(f"Update status code: {response.status_code}")
    
    if response.status_code != 200:
        print(f"Failed to update sale status: {response.status_code}")
        print(response.text)
        return False
    
    print("Sale updated:", json.dumps(response.json(), indent=2))
    return True

if __name__ == "__main__":
    email = "bora.ceylantepe@gmail.com"  # Use provided credentials
    password = "Ea188000."  # Use provided credentials
    
    token = get_token(email, password)
    
    if not token:
        print("Couldn't get authentication token. Exiting.")
        sys.exit(1)
    
    print("Token obtained successfully.")
    
    # Test getting pipeline and stats
    print("\n--- Testing Pipeline API ---")
    get_pipeline(token)
    
    print("\n--- Testing Stats API ---")
    get_stats(token)
    
    # Test creating a sale
    print("\n--- Creating a Test Sale ---")
    sale_id = create_sale(token)
    
    if sale_id:
        # Test updating sale status
        print("\n--- Updating Sale Status ---")
        update_sale_status(token, sale_id, "CONTACTED")
    
    # Check pipeline and stats again to see the new sale
    print("\n--- Checking Pipeline After Changes ---")
    get_pipeline(token)
    
    print("\n--- Checking Stats After Changes ---")
    get_stats(token) 