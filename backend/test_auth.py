import os
import requests
import base64
import uuid
from dotenv import load_dotenv

load_dotenv()

public_key = os.getenv("PAYAZA_PUBLIC_KEY")
secret_key = os.getenv("PAYAZA_SECRET_KEY")

def test_auth_variations():
    url = "http://api.payaza.africa/live/payout-receptor/payout"
    
    payload = {
        "transaction_type": "mobile_money",
        "service_payload": {
            "payout_amount": 30,
            "transaction_pin": 218056,
            "account_reference": "1010113812",
            "country": "NGA",
            "currency": "NGN",
            "payout_beneficiaries": [
                {
                    "credit_amount": 30,
                    "account_name": "Obinna Okafor",
                    "account_number": "8185003687",
                    "bank_code": "100004",
                    "narration": "Test",
                    "transaction_reference": f"REF-{uuid.uuid4().hex[:6]}",
                    "sender": {
                        "sender_name": "Jane Doe",
                        "sender_id": 58921,
                        "sender_phone_number": "01234595",
                        "sender_address": "123, Ace Street"
                    }
                }
            ]
        }
    }

    # Variation 1: Base64 Secret Key
    encoded_sk = base64.b64encode(secret_key.encode()).decode()
    headers1 = {"Authorization": f"Payaza {encoded_sk}", "X-TenantID": "test", "Content-Type": "application/json"}
    
    # Variation 2: Base64 Public Key
    encoded_pk = base64.b64encode(public_key.encode()).decode()
    headers2 = {"Authorization": f"Payaza {encoded_pk}", "X-TenantID": "test", "Content-Type": "application/json"}

    # Variation 3: Raw Secret Key
    headers3 = {"Authorization": f"Payaza {secret_key}", "X-TenantID": "test", "Content-Type": "application/json"}

    for i, headers in enumerate([headers1, headers2, headers3], 1):
        print(f"\nTesting Variation {i}...")
        try:
            res = requests.post(url, json=payload, headers=headers, timeout=10)
            print(f"Status: {res.status_code}")
            print(f"Response: {res.text}")
        except Exception as e:
            print(f"Error: {e}")

if __name__ == "__main__":
    test_auth_variations()
