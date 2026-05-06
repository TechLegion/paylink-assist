import os
import requests
import uuid

class PayazaService:
    def __init__(self):
        self.public_key = os.getenv("PAYAZA_PUBLIC_KEY")
        self.secret_key = os.getenv("PAYAZA_SECRET_KEY")
        self.base_url = "https://api.payaza.africa/live"

    def get_headers(self):
        return {
            "Authorization": f"Payaza {self.secret_key}",
            "Content-Type": "application/json"
        }

    def initialize_payment(self, amount, email, first_name, last_name, return_url):
        """
        Initializes a payment with Payaza.
        """
        transaction_ref = f"PAY-REF-{uuid.uuid4().hex[:12].upper()}"
        
        # Standard Payaza initialization payload
        payload = {
            "service_type": "Account",
            "service_payload": {
                "request_application": "Payaza",
                "application_module": "Authentication",
                "application_version": "1.0.0",
                "request_class": "MerchantCreatePaymentRequest",
                "connection_map": self.public_key,
                "amount": float(amount),
                "transaction_reference": transaction_ref,
                "currency_code": "USD", # or NGN
                "email_address": email,
                "first_name": first_name,
                "last_name": last_name,
                "callback_url": return_url,
                "checkout_mode": "redirect"
            }
        }
        
        try:
            # Try making the actual call
            response = requests.post(
                f"{self.base_url}/merchant-api/v1/payment/initialize",
                json=payload,
                headers=self.get_headers(),
                timeout=10
            )
            data = response.json()
            if response.status_code == 200 and data.get("checkout_url"):
                return {
                    "status": "success",
                    "checkout_url": data["checkout_url"],
                    "reference": transaction_ref
                }
        except Exception as e:
            print(f"Payaza API error: {e}")

        # Hackathon Fallback: If API fails or keys aren't active, mock a success response
        # by redirecting directly back to the dashboard with a success param.
        return {
            "status": "mocked",
            "checkout_url": f"http://localhost:3000/dashboard?payment=success&ref={transaction_ref}",
            "reference": transaction_ref
        }
