import requests
import sys
import json
import time
from datetime import datetime

class VentasAIAPITester:
    def __init__(self, base_url="https://db56f08e-9e9a-409a-8d04-cfba074684c0.preview.emergentagent.com"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0

    def run_test(self, name, method, endpoint, expected_status, data=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    print(f"Response: {json.dumps(response.json(), indent=2)}")
                except:
                    print(f"Response: {response.text}")
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"Response: {response.text}")

            return success, response.json() if success and response.text else {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_root_endpoint(self):
        """Test the root API endpoint"""
        return self.run_test(
            "Root API Endpoint",
            "GET",
            "api",
            200
        )

    def test_status_endpoint(self):
        """Test the status endpoint"""
        return self.run_test(
            "Status Endpoint",
            "GET",
            "api/status",
            200
        )

    def test_create_status_check(self, client_name):
        """Test creating a status check"""
        return self.run_test(
            "Create Status Check",
            "POST",
            "api/status",
            200,
            data={"client_name": client_name}
        )

    def test_api_status(self):
        """Test the API status endpoint"""
        return self.run_test(
            "API Status",
            "GET",
            "api/api-status",
            200
        )

    def test_zip_code_data(self, zip_code="10001"):
        """Test getting ZIP code data"""
        return self.run_test(
            f"ZIP Code Data for {zip_code}",
            "GET",
            f"api/geo/zip/{zip_code}",
            200
        )

    def test_dma_data(self, dma_id="501"):
        """Test getting DMA data"""
        return self.run_test(
            f"DMA Data for {dma_id}",
            "GET",
            f"api/geo/dma/{dma_id}",
            200
        )

    def test_validate_api_key(self, api_name="census", api_key="test_key"):
        """Test validating an API key"""
        return self.run_test(
            f"Validate {api_name} API Key",
            "POST",
            "api/validate-key",
            200,
            data={"api_name": api_name, "api_key": api_key}
        )

    def test_usage_statistics(self):
        """Test getting usage statistics"""
        return self.run_test(
            "Usage Statistics",
            "GET",
            "api/usage-stats",
            200
        )

def main():
    # Setup
    tester = VentasAIAPITester()
    test_client = f"test_client_{datetime.now().strftime('%Y%m%d%H%M%S')}"
    
    # Run tests
    print("🚀 Starting VentasAI API Tests...")
    
    # Test root endpoint
    tester.test_root_endpoint()
    
    # Test status endpoints
    tester.test_status_endpoint()
    tester.test_create_status_check(test_client)
    
    # Test API status
    tester.test_api_status()
    
    # Test geographic data endpoints
    tester.test_zip_code_data("10001")
    tester.test_zip_code_data("90210")
    tester.test_dma_data("501")
    
    # Test API key validation
    tester.test_validate_api_key("census", "test_census_key")
    tester.test_validate_api_key("nielsen", "test_nielsen_key")
    
    # Test usage statistics
    tester.test_usage_statistics()
    
    # Print results
    print(f"\n📊 Tests passed: {tester.tests_passed}/{tester.tests_run}")
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())
