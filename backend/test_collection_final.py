import os
import requests
import base64
import uuid
from dotenv import load_dotenv

load_dotenv()

public_key = os.getenv("PAYAZA_PUBLIC_KEY")
secret_key = os.getenv("PAYAZA_SECRET_KEY")

def test_collection_variations():
    # Endpoints to try
    endpoints = [
        "http://api.payaza.africa/live/payment/initialize",
        "http://api.payaza.africa/live/payment/request",
        "https://api.payaza.africa/live/merchant-api/v1/payment/initialize"
    ]
    
    payload = {
        "amount": 1000,
        "email_address": "buyer@example.com",
        "transaction_reference": f"TXN-{uuid.uuid4().hex[:8].upper()}",
        "callback_url": "http://localhost:3000/dashboard",
        "first_name": "Test",
        "last_name": "Buyer",
        "currency_code": "NGN",
        "checkout_mode": "redirect"
    }

    # Auth headers to try
    encoded_sk = base64.b64encode(secret_key.encode()).decode()
    encoded_pk = base64.b64encode(public_key.encode()).decode()
    
    auth_options = [
        f"Payaza {encoded_sk}",
        f"Payaza {encoded_pk}",
        f"Bearer {secret_key}",
        f"Payaza {secret_key}",
        f"Payaza {public_key}"
    ]

    for url in endpoints:
        for auth in auth_options:
            print(f"\nTesting URL: {url}")
            print(f"Auth: {auth[:20]}...")
            headers = {
                "Authorization": auth,
                "X-TenantID": "test",
                "Content-Type": "application/json"
            }
            try:
                res = requests.post(url, json=payload, headers=headers, timeout=5)
                print(f"Status: {res.status_code}")
                if res.status_code == 200:
                    print("SUCCESS!")
                    print(res.text)
                    return
                else:
                    print(f"Response: {res.text[:100]}")
            except Exception as e:
                print(f"Error: {e}")

if __name__ == "__main__":
    test_collection_variations()
