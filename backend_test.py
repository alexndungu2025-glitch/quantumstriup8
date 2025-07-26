#!/usr/bin/env python3
"""
QuantumStrip Backend Authentication System Test Suite
Tests all authentication endpoints and functionality
"""

import requests
import json
import sys
from datetime import datetime
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv('/app/frontend/.env')

# Get backend URL from environment
BACKEND_URL = os.getenv('REACT_APP_BACKEND_URL', 'http://localhost:8001')
API_BASE = f"{BACKEND_URL}/api"

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'

def print_test_header(test_name):
    print(f"\n{Colors.BLUE}{Colors.BOLD}{'='*60}{Colors.ENDC}")
    print(f"{Colors.BLUE}{Colors.BOLD}Testing: {test_name}{Colors.ENDC}")
    print(f"{Colors.BLUE}{Colors.BOLD}{'='*60}{Colors.ENDC}")

def print_success(message):
    print(f"{Colors.GREEN}✅ {message}{Colors.ENDC}")

def print_error(message):
    print(f"{Colors.RED}❌ {message}{Colors.ENDC}")

def print_warning(message):
    print(f"{Colors.YELLOW}⚠️  {message}{Colors.ENDC}")

def print_info(message):
    print(f"{Colors.BLUE}ℹ️  {message}{Colors.ENDC}")

class QuantumStripTester:
    def __init__(self):
        self.session = requests.Session()
        self.tokens = {}  # Store tokens for different users
        self.test_results = {
            'passed': 0,
            'failed': 0,
            'total': 0
        }
        
    def assert_test(self, condition, success_msg, error_msg):
        """Assert a test condition and track results"""
        self.test_results['total'] += 1
        if condition:
            self.test_results['passed'] += 1
            print_success(success_msg)
            return True
        else:
            self.test_results['failed'] += 1
            print_error(error_msg)
            return False

    def test_basic_api_health(self):
        """Test basic API health endpoints"""
        print_test_header("Basic API Health Check")
        
        # Test root endpoint
        try:
            response = self.session.get(f"{API_BASE}/")
            self.assert_test(
                response.status_code == 200,
                f"Root endpoint accessible: {response.json()}",
                f"Root endpoint failed: {response.status_code}"
            )
            
            if response.status_code == 200:
                data = response.json()
                self.assert_test(
                    "QuantumStrip API" in data.get("message", ""),
                    "API returns correct platform info",
                    "API doesn't return expected platform info"
                )
        except Exception as e:
            self.assert_test(False, "", f"Root endpoint error: {str(e)}")

        # Test health endpoint
        try:
            response = self.session.get(f"{API_BASE}/health")
            self.assert_test(
                response.status_code == 200,
                f"Health endpoint accessible: {response.json()}",
                f"Health endpoint failed: {response.status_code}"
            )
            
            if response.status_code == 200:
                data = response.json()
                self.assert_test(
                    data.get("status") == "healthy",
                    "Health endpoint returns healthy status",
                    "Health endpoint doesn't return healthy status"
                )
        except Exception as e:
            self.assert_test(False, "", f"Health endpoint error: {str(e)}")

    def test_user_registration(self):
        """Test user registration functionality"""
        print_test_header("User Registration")
        
        # Test viewer registration
        viewer_data = {
            "username": "testviewer2024",
            "email": "testviewer2024@example.com",
            "phone": "254712345679",
            "password": "securepass123",
            "role": "viewer",
            "age": 25,
            "country": "ke"
        }
        
        try:
            response = self.session.post(f"{API_BASE}/auth/register", json=viewer_data)
            self.assert_test(
                response.status_code == 200,
                f"Viewer registration successful: {response.status_code}",
                f"Viewer registration failed: {response.status_code} - {response.text}"
            )
            
            if response.status_code == 200:
                data = response.json()
                self.assert_test(
                    "access_token" in data,
                    "Registration returns access token",
                    "Registration doesn't return access token"
                )
                self.assert_test(
                    data.get("user", {}).get("role") == "viewer",
                    "User role correctly set to viewer",
                    "User role not correctly set"
                )
                # Store token for later tests
                self.tokens['viewer'] = data.get("access_token")
                
        except Exception as e:
            self.assert_test(False, "", f"Viewer registration error: {str(e)}")

        # Test model registration
        model_data = {
            "username": "testmodel2024",
            "email": "testmodel2024@example.com",
            "phone": "254787654322",
            "password": "securepass123",
            "role": "model",
            "age": 22,
            "country": "ke"
        }
        
        try:
            response = self.session.post(f"{API_BASE}/auth/register", json=model_data)
            self.assert_test(
                response.status_code == 200,
                f"Model registration successful: {response.status_code}",
                f"Model registration failed: {response.status_code} - {response.text}"
            )
            
            if response.status_code == 200:
                data = response.json()
                self.assert_test(
                    data.get("user", {}).get("role") == "model",
                    "User role correctly set to model",
                    "User role not correctly set"
                )
                # Store token for later tests
                self.tokens['model'] = data.get("access_token")
                
        except Exception as e:
            self.assert_test(False, "", f"Model registration error: {str(e)}")

        # Test duplicate email registration
        try:
            response = self.session.post(f"{API_BASE}/auth/register", json=viewer_data)
            self.assert_test(
                response.status_code == 400,
                "Duplicate email registration properly rejected",
                f"Duplicate email registration should fail but got: {response.status_code}"
            )
        except Exception as e:
            self.assert_test(False, "", f"Duplicate email test error: {str(e)}")

        # Test duplicate username registration
        duplicate_username_data = {
            "username": "testviewer2024",  # Same username
            "email": "different@example.com",  # Different email
            "phone": "254712345680",
            "password": "securepass123",
            "role": "viewer",
            "age": 25,
            "country": "ke"
        }
        
        try:
            response = self.session.post(f"{API_BASE}/auth/register", json=duplicate_username_data)
            self.assert_test(
                response.status_code == 400,
                "Duplicate username registration properly rejected",
                f"Duplicate username registration should fail but got: {response.status_code}"
            )
        except Exception as e:
            self.assert_test(False, "", f"Duplicate username test error: {str(e)}")

        # Test invalid data validation
        invalid_data = {
            "username": "ab",  # Too short
            "email": "invalid-email",  # Invalid email
            "password": "123",  # Too short
            "age": 15,  # Under 18
            "role": "viewer"
        }
        
        try:
            response = self.session.post(f"{API_BASE}/auth/register", json=invalid_data)
            self.assert_test(
                response.status_code == 422,
                "Invalid data validation working",
                f"Invalid data should be rejected but got: {response.status_code}"
            )
        except Exception as e:
            self.assert_test(False, "", f"Invalid data validation test error: {str(e)}")

    def test_user_login(self):
        """Test user login functionality"""
        print_test_header("User Login")
        
        # Test login with existing test user (viewer)
        login_data = {
            "email": "viewer@test.com",
            "password": "password123"
        }
        
        try:
            response = self.session.post(f"{API_BASE}/auth/login", json=login_data)
            self.assert_test(
                response.status_code == 200,
                f"Valid login successful: {response.status_code}",
                f"Valid login failed: {response.status_code} - {response.text}"
            )
            
            if response.status_code == 200:
                data = response.json()
                self.assert_test(
                    "access_token" in data,
                    "Login returns access token",
                    "Login doesn't return access token"
                )
                self.assert_test(
                    data.get("user", {}).get("email") == "viewer@test.com",
                    "Login returns correct user info",
                    "Login doesn't return correct user info"
                )
                # Store token for later tests
                self.tokens['test_viewer'] = data.get("access_token")
                
        except Exception as e:
            self.assert_test(False, "", f"Valid login test error: {str(e)}")

        # Test login with existing test user (model)
        model_login_data = {
            "email": "model@test.com",
            "password": "password123"
        }
        
        try:
            response = self.session.post(f"{API_BASE}/auth/login", json=model_login_data)
            self.assert_test(
                response.status_code == 200,
                f"Model login successful: {response.status_code}",
                f"Model login failed: {response.status_code} - {response.text}"
            )
            
            if response.status_code == 200:
                data = response.json()
                self.tokens['test_model'] = data.get("access_token")
                
        except Exception as e:
            self.assert_test(False, "", f"Model login test error: {str(e)}")

        # Test login with invalid credentials
        invalid_login = {
            "email": "viewer@test.com",
            "password": "wrongpassword"
        }
        
        try:
            response = self.session.post(f"{API_BASE}/auth/login", json=invalid_login)
            self.assert_test(
                response.status_code == 401,
                "Invalid credentials properly rejected",
                f"Invalid credentials should fail but got: {response.status_code}"
            )
        except Exception as e:
            self.assert_test(False, "", f"Invalid credentials test error: {str(e)}")

        # Test login with non-existent user
        nonexistent_login = {
            "email": "nonexistent@test.com",
            "password": "password123"
        }
        
        try:
            response = self.session.post(f"{API_BASE}/auth/login", json=nonexistent_login)
            self.assert_test(
                response.status_code == 401,
                "Non-existent user login properly rejected",
                f"Non-existent user login should fail but got: {response.status_code}"
            )
        except Exception as e:
            self.assert_test(False, "", f"Non-existent user test error: {str(e)}")

    def test_authentication_protected_routes(self):
        """Test authentication protected routes"""
        print_test_header("Authentication Protected Routes")
        
        # Test /me endpoint with valid token
        if 'test_viewer' in self.tokens:
            headers = {"Authorization": f"Bearer {self.tokens['test_viewer']}"}
            try:
                response = self.session.get(f"{API_BASE}/auth/me", headers=headers)
                self.assert_test(
                    response.status_code == 200,
                    f"/me endpoint with valid token successful: {response.status_code}",
                    f"/me endpoint with valid token failed: {response.status_code} - {response.text}"
                )
                
                if response.status_code == 200:
                    data = response.json()
                    self.assert_test(
                        data.get("email") == "viewer@test.com",
                        "/me endpoint returns correct user data",
                        "/me endpoint doesn't return correct user data"
                    )
                    
            except Exception as e:
                self.assert_test(False, "", f"/me endpoint test error: {str(e)}")

        # Test /me endpoint without token
        try:
            response = self.session.get(f"{API_BASE}/auth/me")
            self.assert_test(
                response.status_code == 403,
                "/me endpoint without token properly rejected",
                f"/me endpoint without token should fail but got: {response.status_code}"
            )
        except Exception as e:
            self.assert_test(False, "", f"/me endpoint without token test error: {str(e)}")

        # Test /me endpoint with invalid token
        invalid_headers = {"Authorization": "Bearer invalid_token_here"}
        try:
            response = self.session.get(f"{API_BASE}/auth/me", headers=invalid_headers)
            self.assert_test(
                response.status_code == 401,
                "/me endpoint with invalid token properly rejected",
                f"/me endpoint with invalid token should fail but got: {response.status_code}"
            )
        except Exception as e:
            self.assert_test(False, "", f"/me endpoint with invalid token test error: {str(e)}")

    def test_role_based_access_control(self):
        """Test role-based access control"""
        print_test_header("Role-Based Access Control")
        
        # Test viewer dashboard with viewer token
        if 'test_viewer' in self.tokens:
            headers = {"Authorization": f"Bearer {self.tokens['test_viewer']}"}
            try:
                response = self.session.get(f"{API_BASE}/auth/viewer/dashboard", headers=headers)
                self.assert_test(
                    response.status_code == 200,
                    f"Viewer dashboard with viewer token successful: {response.status_code}",
                    f"Viewer dashboard with viewer token failed: {response.status_code} - {response.text}"
                )
                
                if response.status_code == 200:
                    data = response.json()
                    self.assert_test(
                        "profile" in data and "user" in data,
                        "Viewer dashboard returns expected data structure",
                        "Viewer dashboard doesn't return expected data structure"
                    )
                    
            except Exception as e:
                self.assert_test(False, "", f"Viewer dashboard test error: {str(e)}")

        # Test model dashboard with model token
        if 'test_model' in self.tokens:
            headers = {"Authorization": f"Bearer {self.tokens['test_model']}"}
            try:
                response = self.session.get(f"{API_BASE}/auth/model/dashboard", headers=headers)
                self.assert_test(
                    response.status_code == 200,
                    f"Model dashboard with model token successful: {response.status_code}",
                    f"Model dashboard with model token failed: {response.status_code} - {response.text}"
                )
                
                if response.status_code == 200:
                    data = response.json()
                    self.assert_test(
                        "profile" in data and "user" in data,
                        "Model dashboard returns expected data structure",
                        "Model dashboard doesn't return expected data structure"
                    )
                    
            except Exception as e:
                self.assert_test(False, "", f"Model dashboard test error: {str(e)}")

        # Test viewer trying to access model dashboard (should fail)
        if 'test_viewer' in self.tokens:
            headers = {"Authorization": f"Bearer {self.tokens['test_viewer']}"}
            try:
                response = self.session.get(f"{API_BASE}/auth/model/dashboard", headers=headers)
                self.assert_test(
                    response.status_code == 403,
                    "Viewer accessing model dashboard properly rejected",
                    f"Viewer accessing model dashboard should fail but got: {response.status_code}"
                )
            except Exception as e:
                self.assert_test(False, "", f"Cross-role access test error: {str(e)}")

        # Test model trying to access viewer dashboard (should fail)
        if 'test_model' in self.tokens:
            headers = {"Authorization": f"Bearer {self.tokens['test_model']}"}
            try:
                response = self.session.get(f"{API_BASE}/auth/viewer/dashboard", headers=headers)
                self.assert_test(
                    response.status_code == 403,
                    "Model accessing viewer dashboard properly rejected",
                    f"Model accessing viewer dashboard should fail but got: {response.status_code}"
                )
            except Exception as e:
                self.assert_test(False, "", f"Cross-role access test error: {str(e)}")

    def test_database_integration(self):
        """Test database integration and data persistence"""
        print_test_header("Database Integration")
        
        print_info("Database integration tests require direct database access")
        print_info("Testing through API endpoints to verify data persistence...")
        
        # Test that user data persists by logging in with previously registered user
        if 'viewer' in self.tokens:
            # Try to get user profile to verify data was stored
            headers = {"Authorization": f"Bearer {self.tokens['viewer']}"}
            try:
                response = self.session.get(f"{API_BASE}/auth/me", headers=headers)
                self.assert_test(
                    response.status_code == 200,
                    "User data persists in database (accessible via /me)",
                    "User data not persisting in database"
                )
                
                if response.status_code == 200:
                    data = response.json()
                    self.assert_test(
                        data.get("username") == "testviewer2024",
                        "User data correctly stored and retrieved",
                        "User data not correctly stored or retrieved"
                    )
                    
            except Exception as e:
                self.assert_test(False, "", f"Database persistence test error: {str(e)}")

        # Test that profiles are created for different user types
        if 'test_viewer' in self.tokens:
            headers = {"Authorization": f"Bearer {self.tokens['test_viewer']}"}
            try:
                response = self.session.get(f"{API_BASE}/auth/viewer/dashboard", headers=headers)
                if response.status_code == 200:
                    data = response.json()
                    self.assert_test(
                        "profile" in data and "token_balance" in data["profile"],
                        "Viewer profile created and accessible",
                        "Viewer profile not created or accessible"
                    )
            except Exception as e:
                self.assert_test(False, "", f"Viewer profile test error: {str(e)}")

        if 'test_model' in self.tokens:
            headers = {"Authorization": f"Bearer {self.tokens['test_model']}"}
            try:
                response = self.session.get(f"{API_BASE}/auth/model/dashboard", headers=headers)
                if response.status_code == 200:
                    data = response.json()
                    self.assert_test(
                        "profile" in data and "display_name" in data["profile"],
                        "Model profile created and accessible",
                        "Model profile not created or accessible"
                    )
            except Exception as e:
                self.assert_test(False, "", f"Model profile test error: {str(e)}")

    def test_password_hashing(self):
        """Test password hashing functionality"""
        print_test_header("Password Hashing")
        
        print_info("Password hashing tested indirectly through login functionality")
        
        # Test that we can login with correct password (proves hashing/verification works)
        login_data = {
            "email": "viewer@test.com",
            "password": "password123"
        }
        
        try:
            response = self.session.post(f"{API_BASE}/auth/login", json=login_data)
            self.assert_test(
                response.status_code == 200,
                "Password hashing and verification working (successful login)",
                "Password hashing/verification may have issues"
            )
        except Exception as e:
            self.assert_test(False, "", f"Password hashing test error: {str(e)}")

        # Test that wrong password fails (proves hashing works)
        wrong_login_data = {
            "email": "viewer@test.com",
            "password": "wrongpassword"
        }
        
        try:
            response = self.session.post(f"{API_BASE}/auth/login", json=wrong_login_data)
            self.assert_test(
                response.status_code == 401,
                "Password verification correctly rejects wrong password",
                "Password verification not working correctly"
            )
        except Exception as e:
            self.assert_test(False, "", f"Wrong password test error: {str(e)}")

    def test_jwt_token_functionality(self):
        """Test JWT token generation and validation"""
        print_test_header("JWT Token Functionality")
        
        print_info("JWT token functionality tested through authentication flows")
        
        # Test that tokens are generated on login
        login_data = {
            "email": "viewer@test.com",
            "password": "password123"
        }
        
        try:
            response = self.session.post(f"{API_BASE}/auth/login", json=login_data)
            if response.status_code == 200:
                data = response.json()
                token = data.get("access_token")
                self.assert_test(
                    token is not None and len(token) > 50,
                    "JWT token generated successfully",
                    "JWT token not generated or too short"
                )
                
                # Test that token works for authentication
                headers = {"Authorization": f"Bearer {token}"}
                auth_response = self.session.get(f"{API_BASE}/auth/me", headers=headers)
                self.assert_test(
                    auth_response.status_code == 200,
                    "JWT token validation working",
                    "JWT token validation not working"
                )
                
        except Exception as e:
            self.assert_test(False, "", f"JWT token test error: {str(e)}")

    def run_all_tests(self):
        """Run all test suites"""
        print(f"{Colors.BOLD}{Colors.BLUE}")
        print("=" * 80)
        print("QUANTUMSTRIP BACKEND AUTHENTICATION SYSTEM TEST SUITE")
        print("=" * 80)
        print(f"{Colors.ENDC}")
        
        print_info(f"Testing backend at: {API_BASE}")
        print_info(f"Test started at: {datetime.now().isoformat()}")
        
        # Run all test suites
        self.test_basic_api_health()
        self.test_user_registration()
        self.test_user_login()
        self.test_authentication_protected_routes()
        self.test_role_based_access_control()
        self.test_database_integration()
        self.test_password_hashing()
        self.test_jwt_token_functionality()
        
        # Print final results
        self.print_final_results()

    def print_final_results(self):
        """Print final test results"""
        print(f"\n{Colors.BOLD}{Colors.BLUE}")
        print("=" * 80)
        print("FINAL TEST RESULTS")
        print("=" * 80)
        print(f"{Colors.ENDC}")
        
        total = self.test_results['total']
        passed = self.test_results['passed']
        failed = self.test_results['failed']
        
        print(f"{Colors.BOLD}Total Tests: {total}{Colors.ENDC}")
        print(f"{Colors.GREEN}Passed: {passed}{Colors.ENDC}")
        print(f"{Colors.RED}Failed: {failed}{Colors.ENDC}")
        
        if failed == 0:
            print(f"\n{Colors.GREEN}{Colors.BOLD}🎉 ALL TESTS PASSED! 🎉{Colors.ENDC}")
            print(f"{Colors.GREEN}QuantumStrip authentication system is working correctly!{Colors.ENDC}")
        else:
            print(f"\n{Colors.RED}{Colors.BOLD}❌ {failed} TEST(S) FAILED{Colors.ENDC}")
            print(f"{Colors.YELLOW}Please review the failed tests above.{Colors.ENDC}")
        
        success_rate = (passed / total * 100) if total > 0 else 0
        print(f"\n{Colors.BOLD}Success Rate: {success_rate:.1f}%{Colors.ENDC}")
        
        return failed == 0

if __name__ == "__main__":
    tester = QuantumStripTester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)