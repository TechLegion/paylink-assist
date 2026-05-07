import os
import requests
import uuid
import base64

class PayazaService:
    def __init__(self):
        self.public_key = os.getenv("PAYAZA_PUBLIC_KEY")
        self.secret_key = os.getenv("PAYAZA_SECRET_KEY")
        self.base_url = os.getenv("PAYAZA_BASE_URL", "https://api.payaza.africa/live")

    def get_headers(self, key=None, include_product=False):
        if not key:
            key = self.public_key

        encoded_key = base64.b64encode(key.encode()).decode()
        headers = {
            "Authorization": f"Payaza {encoded_key}",
            "X-TenantID": "test",
            "Content-Type": "application/json",
        }

        if include_product:
            headers["X-ProductID"] = "app"

        return headers

    def get_collection_headers(self):
        return self.get_headers(self.public_key, include_product=True)

    def get_transfer_headers(self):
        return self.get_headers(self.secret_key or self.public_key)

    def _ensure_keys(self):
        if not self.public_key:
            return {"status": "error", "message": "PAYAZA_PUBLIC_KEY is not configured"}
        return None

    def process_momo_collection(
        self,
        amount,
        email,
        first_name,
        last_name,
        transaction_ref=None,
        description="PayLink Assist escrow funding",
        customer_number=None,
        customer_bank_code=None,
        currency_code=None,
        country_code=None,
        phone_number=None,
    ):
        missing_keys = self._ensure_keys()
        if missing_keys:
            return missing_keys

        transaction_ref = transaction_ref or f"UDH{uuid.uuid4().hex[:10].upper()}"
        country_code = country_code or os.getenv("PAYAZA_COLLECTION_COUNTRY", "GH")
        currency_code = currency_code or os.getenv("PAYAZA_COLLECTION_CURRENCY", "GHS")
        customer_bank_code = customer_bank_code or os.getenv("PAYAZA_CUSTOMER_BANK_CODE", "AIR")
        customer_number = customer_number or os.getenv("PAYAZA_CUSTOMER_NUMBER", "23372423405")
        phone_number = phone_number or os.getenv("PAYAZA_CUSTOMER_PHONE", "012345678901")

        payload = {
            "amount": float(amount),
            "customer_number": customer_number,
            "transaction_reference": transaction_ref,
            "transaction_description": description,
            "customer_bank_code": customer_bank_code,
            "currency_code": currency_code,
            "customer_email": email,
            "customer_first_name": first_name,
            "customer_last_name": last_name,
            "customer_phone_number": phone_number,
            "country_code": country_code,
        }

        try:
            response = requests.post(
                f"{self.base_url}/subsidiary/collections/v1/process-collection",
                json=payload,
                headers=self.get_collection_headers(),
                timeout=20,
            )
            data = response.json()
            response_code = data.get("response_code")
            if response.status_code == 200 and response_code in {"00", "09"}:
                return {
                    "status": "success",
                    "payment_status": data.get("response_message", "PENDING"),
                    "reference": data.get("transaction_reference", transaction_ref),
                    "details": data,
                }

            return {
                "status": "error",
                "message": data.get("response_message") or data.get("message", "Collection failed"),
                "details": data,
                "http_status": response.status_code,
            }
        except Exception as e:
            return {"status": "error", "message": str(e)}

    def create_dynamic_virtual_account(
        self,
        amount,
        email,
        first_name,
        last_name,
        transaction_ref=None,
        description="PayLink Assist escrow funding",
        phone_number=None,
    ):
        missing_keys = self._ensure_keys()
        if missing_keys:
            return missing_keys

        transaction_ref = transaction_ref or f"PAYLINK{uuid.uuid4().hex[:10].upper()}"
        payload = {
            "account_name": f"PayLink {first_name} {last_name}".strip(),
            "account_type": "Dynamic",
            "bank_code": os.getenv("PAYAZA_VIRTUAL_ACCOUNT_BANK_CODE", "1067"),
            "account_reference": transaction_ref,
            "customer_first_name": first_name,
            "customer_last_name": last_name,
            "customer_email": email,
            "customer_phone_number": phone_number or os.getenv("PAYAZA_CUSTOMER_PHONE", "09012345678"),
            "transaction_description": description,
            "transaction_amount": float(amount),
            "expires_in_minutes": os.getenv("PAYAZA_VIRTUAL_ACCOUNT_EXPIRY_MINUTES", "30"),
        }

        try:
            response = requests.post(
                f"{self.base_url}/merchant-collection/merchant/virtual_account/generate_virtual_account/",
                json=payload,
                headers=self.get_headers(self.public_key),
                timeout=20,
            )
            data = response.json()
            account_data = data.get("data") or {}
            if response.status_code == 200 and data.get("success"):
                return {
                    "status": "success",
                    "payment_status": "PENDING",
                    "reference": account_data.get("transaction_reference", transaction_ref),
                    "virtual_account": account_data,
                    "details": data,
                }

            return {
                "status": "error",
                "message": data.get("message", "Virtual account generation failed"),
                "details": data,
                "http_status": response.status_code,
            }
        except Exception as e:
            return {"status": "error", "message": str(e)}

    def get_headers_legacy(self):
        # Kept for endpoints not covered by the hackathon collection.
        encoded_key = base64.b64encode(self.public_key.encode()).decode()
        return {
            "Authorization": f"Payaza {encoded_key}",
            "X-TenantID": "test",
            "Content-Type": "application/json"
        }

    def initialize_payment(self, amount, email, first_name, last_name, return_url):
        """
        Initializes escrow funding through the hackathon Momo collection endpoint.
        """
        return self.create_dynamic_virtual_account(
            amount=amount,
            email=email,
            first_name=first_name,
            last_name=last_name,
            transaction_ref=f"PAYLINK{uuid.uuid4().hex[:12].upper()}",
            description="PayLink Assist task escrow funding",
        )

    def verify_transaction(self, transaction_ref):
        """
        Verifies a transaction using Payaza V2.
        """
        try:
            virtual_account_response = requests.get(
                f"{self.base_url}/merchant-collection/transfer_notification_controller/transaction-query",
                params={"transaction_reference": transaction_ref},
                headers=self.get_headers(self.public_key),
                timeout=15,
            )
            virtual_account_data = virtual_account_response.json()
            if virtual_account_response.status_code == 200:
                if virtual_account_data.get("success") or virtual_account_data.get("status") == "success":
                    return {"status": "success", "data": virtual_account_data}

                return {
                    "status": "pending",
                    "message": virtual_account_data.get("message", "Payment is still pending"),
                    "details": virtual_account_data,
                }
        except Exception:
            pass

        try:
            response = requests.get(
                f"{self.base_url}/subsidiary/collections/v1/check-status",
                params={
                    "transaction_reference": transaction_ref,
                    "country_code": os.getenv("PAYAZA_COLLECTION_COUNTRY", "GH"),
                },
                headers=self.get_collection_headers(),
                timeout=10
            )
            data = response.json()
            if response.status_code == 200 and data.get("response_code") == "00":
                return {"status": "success", "data": data}
            return {
                "status": "pending" if response.status_code == 200 else "error",
                "message": data.get("response_message") or data.get("message", "Verification failed"),
                "details": data,
            }
        except Exception as e:
            return {"status": "error", "message": str(e)}

    def payout(self, amount, account_number, bank_code, account_name, task_ref):
        """
        Releases funds to a worker (Payout) using Payaza V2.
        """
        transaction_ref = f"TRF-{uuid.uuid4().hex[:12].upper()}"
        
        payload = {
            "transaction_type": "mobile_money",
            "service_payload": {
                "payout_amount": float(amount),
                "transaction_pin": 370300, 
                "account_reference": os.getenv("PAYAZA_ACCOUNT_REFERENCE", "1010113812"), 
                "country": "NGA",
                "currency": "NGN",
                "payout_beneficiaries": [
                    {
                        "credit_amount": float(amount),
                        "account_name": account_name,
                        "account_number": account_number,
                        "bank_code": bank_code,
                        "narration": f"Payment for task {task_ref}",
                        "transaction_reference": transaction_ref,
                        "sender": {
                            "sender_name": "PayLink Assist",
                            "sender_id": 58921,
                            "sender_phone_number": "08000000000",
                            "sender_address": "PayLink HQ"
                        }
                    }
                ]
            }
        }
        
        try:
            # Using the specific live endpoint provided by the user for payouts
            response = requests.post(
                "https://api.payaza.africa/live/payout-receptor/payout",
                json=payload,
                headers=self.get_transfer_headers(),
                timeout=10
            )
            data = response.json()
            if response.status_code == 200:
                # Transaction status for the payout can be verified later using the same reference.
                return {"status": "success", "transaction_reference": transaction_ref, "data": data}
            return {
                "status": "error",
                "transaction_reference": transaction_ref,
                "message": data.get("message", "Payout failed"),
                "details": data,
            }
        except Exception as e:
            print(f"Payout error: {e}")
            return {"status": "error", "transaction_reference": transaction_ref, "message": str(e)}
