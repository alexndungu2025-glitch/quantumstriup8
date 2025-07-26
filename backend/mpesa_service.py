import requests
import base64
import json
from datetime import datetime
import os
from typing import Optional, Dict, Any
import logging

logger = logging.getLogger(__name__)

class MpesaService:
    """
    M-Pesa STK Push service for QuantumStrip token purchases
    """
    
    def __init__(self):
        self.consumer_key = os.getenv("MPESA_CONSUMER_KEY")
        self.consumer_secret = os.getenv("MPESA_CONSUMER_SECRET")
        self.business_short_code = os.getenv("MPESA_BUSINESS_SHORT_CODE")
        self.passkey = os.getenv("MPESA_PASSKEY")
        self.callback_url = os.getenv("MPESA_CALLBACK_URL")
        self.environment = os.getenv("MPESA_ENVIRONMENT", "production")
        
        # Set URLs based on environment
        if self.environment == "production":
            self.base_url = "https://api.safaricom.co.ke"
        else:
            self.base_url = "https://sandbox.safaricom.co.ke"
        
        self.token_url = f"{self.base_url}/oauth/v1/generate?grant_type=client_credentials"
        self.stk_push_url = f"{self.base_url}/mpesa/stkpush/v1/processrequest"
        self.query_url = f"{self.base_url}/mpesa/stkpushquery/v1/query"
    
    def get_access_token(self) -> Optional[str]:
        """
        Get M-Pesa access token for API calls
        """
        try:
            # Create authorization header
            auth_string = f"{self.consumer_key}:{self.consumer_secret}"
            auth_bytes = auth_string.encode('ascii')
            auth_b64 = base64.b64encode(auth_bytes).decode('ascii')
            
            headers = {
                'Authorization': f'Basic {auth_b64}',
                'Content-Type': 'application/json'
            }
            
            response = requests.get(self.token_url, headers=headers)
            response.raise_for_status()
            
            data = response.json()
            return data.get('access_token')
            
        except Exception as e:
            logger.error(f"Error getting M-Pesa access token: {e}")
            return None
    
    def generate_password(self) -> tuple[str, str]:
        """
        Generate password and timestamp for STK push
        """
        timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
        password_string = f"{self.business_short_code}{self.passkey}{timestamp}"
        password_bytes = password_string.encode('ascii')
        password = base64.b64encode(password_bytes).decode('ascii')
        
        return password, timestamp
    
    def initiate_stk_push(
        self, 
        phone_number: str, 
        amount: float, 
        transaction_id: str,
        account_reference: str = "QuantumStrip",
        transaction_desc: str = "Token Purchase"
    ) -> Dict[str, Any]:
        """
        Initiate STK push for token purchase
        """
        try:
            # Get access token
            access_token = self.get_access_token()
            if not access_token:
                return {
                    'success': False,
                    'message': 'Failed to get M-Pesa access token'
                }
            
            # Generate password and timestamp
            password, timestamp = self.generate_password()
            
            # Format phone number (ensure it starts with 254)
            if phone_number.startswith('0'):
                phone_number = '254' + phone_number[1:]
            elif phone_number.startswith('+254'):
                phone_number = phone_number[1:]
            elif not phone_number.startswith('254'):
                phone_number = '254' + phone_number
            
            # Prepare request payload
            payload = {
                "BusinessShortCode": self.business_short_code,
                "Password": password,
                "Timestamp": timestamp,
                "TransactionType": "CustomerPayBillOnline",
                "Amount": int(amount),  # M-Pesa requires integer amount
                "PartyA": phone_number,
                "PartyB": self.business_short_code,
                "PhoneNumber": phone_number,
                "CallBackURL": self.callback_url,
                "AccountReference": account_reference,
                "TransactionDesc": transaction_desc
            }
            
            # Prepare headers
            headers = {
                'Authorization': f'Bearer {access_token}',
                'Content-Type': 'application/json'
            }
            
            # Make STK push request
            response = requests.post(self.stk_push_url, json=payload, headers=headers)
            response.raise_for_status()
            
            data = response.json()
            
            logger.info(f"STK Push Response: {data}")
            
            # Check if request was successful
            if data.get('ResponseCode') == '0':
                return {
                    'success': True,
                    'message': data.get('ResponseDescription', 'STK push initiated successfully'),
                    'merchant_request_id': data.get('MerchantRequestID'),
                    'checkout_request_id': data.get('CheckoutRequestID'),
                    'response_code': data.get('ResponseCode'),
                    'customer_message': data.get('CustomerMessage')
                }
            else:
                return {
                    'success': False,
                    'message': data.get('ResponseDescription', 'STK push failed'),
                    'response_code': data.get('ResponseCode'),
                    'error_code': data.get('errorCode'),
                    'error_message': data.get('errorMessage')
                }
                
        except requests.RequestException as e:
            logger.error(f"M-Pesa API request error: {e}")
            return {
                'success': False,
                'message': f'M-Pesa API error: {str(e)}'
            }
        except Exception as e:
            logger.error(f"Error initiating STK push: {e}")
            return {
                'success': False,
                'message': f'Internal error: {str(e)}'
            }
    
    def query_stk_push_status(
        self, 
        checkout_request_id: str
    ) -> Dict[str, Any]:
        """
        Query the status of an STK push transaction
        """
        try:
            # Get access token
            access_token = self.get_access_token()
            if not access_token:
                return {
                    'success': False,
                    'message': 'Failed to get M-Pesa access token'
                }
            
            # Generate password and timestamp
            password, timestamp = self.generate_password()
            
            # Prepare request payload
            payload = {
                "BusinessShortCode": self.business_short_code,
                "Password": password,
                "Timestamp": timestamp,
                "CheckoutRequestID": checkout_request_id
            }
            
            # Prepare headers
            headers = {
                'Authorization': f'Bearer {access_token}',
                'Content-Type': 'application/json'
            }
            
            # Make query request
            response = requests.post(self.query_url, json=payload, headers=headers)
            response.raise_for_status()
            
            data = response.json()
            
            logger.info(f"STK Push Query Response: {data}")
            
            return {
                'success': True,
                'data': data,
                'response_code': data.get('ResponseCode'),
                'response_description': data.get('ResponseDescription'),
                'result_code': data.get('ResultCode'),
                'result_description': data.get('ResultDesc')
            }
            
        except Exception as e:
            logger.error(f"Error querying STK push status: {e}")
            return {
                'success': False,
                'message': f'Query error: {str(e)}'
            }

# Token package pricing
TOKEN_PACKAGES = {
    50: 500,    # 50 tokens = KES 500
    100: 1000,  # 100 tokens = KES 1000
    200: 1900,  # 200 tokens = KES 1900
    500: 4500,  # 500 tokens = KES 4500
    1000: 8500  # 1000 tokens = KES 8500
}

def get_token_price(tokens: int) -> Optional[float]:
    """Get price for token package"""
    return TOKEN_PACKAGES.get(tokens)

def get_available_packages() -> Dict[int, float]:
    """Get all available token packages"""
    return TOKEN_PACKAGES.copy()

# Create singleton instance
mpesa_service = MpesaService()