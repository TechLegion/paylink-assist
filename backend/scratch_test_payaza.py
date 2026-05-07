import os
import requests
import uuid
from dotenv import load_dotenv

load_dotenv()

public_key = os.getenv("PAYAZA_PUBLIC_KEY")
secret_key = os.getenv("PAYAZA_SECRET_KEY")

print(f"Using Public Key: {public_key}")
print(f"Using Secret Key: {secret_key}")

def test_payaza():
    base_url = "https://api.payaza.africa/live"
    transaction_ref = f"TEST-REF-{uuid.uuid4().hex[:6].upper()}"
    
    # Try a simpler payload first
    payload = {
        "amount": 1000,
        "email_address": "test@example.com",
        "first_name": "Test",
        "last_name": "User",
        "transaction_reference": transaction_ref,
        "currency_code": "NGN",
        "callback_url": "http://localhost:3000/dashboard",
        "checkout_mode": "redirect"
    }
    
    # Try the complex one if simpler fails, or vice versa.
    # Actually, let's try the one from the docs if we can.
    
    import base64
    encoded_key = base64.b64encode(secret_key.encode()).decode()
    
    headers = {
        "Authorization": f"Bearer {secret_key}",
        "Content-Type": "application/json"
    }

    print("Attempting v2 payload with Bearer...")
    v2_url = "https://api.payaza.africa/v2/payment/checkout" # Guessed v2 endpoint
    res = requests.post(v2_url, json=payload, headers=headers)
    print(f"Status: {res.status_code}")
    print(f"Response: {res.text}")

    print("\nAttempting complex payload...")
    complex_payload = {
        "service_type": "Account",
        "service_payload": {
            "request_application": "Payaza",
            "application_module": "Authentication",
            "application_version": "1.0.0",
            "request_class": "MerchantCreatePaymentRequest",
            "connection_map": public_key,
            "amount": 1000,
            "transaction_reference": transaction_ref + "C",
            "currency_code": "NGN",
            "email_address": "test@example.com",
            "first_name": "Test",
            "last_name": "User",
            "callback_url": "http://localhost:3000/dashboard",
            "checkout_mode": "redirect"
        }
    }
    res = requests.post(f"{base_url}/merchant-api/v1/payment/initialize", json=complex_payload, headers=headers)
    print(f"Status: {res.status_code}")
    print(f"Response: {res.text}")

if __name__ == "__main__":
    test_payaza()
