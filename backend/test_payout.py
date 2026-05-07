import os
from dotenv import load_dotenv
from core.payaza_service import PayazaService

load_dotenv()

def trigger_test_payout():
    service = PayazaService()
    print("Triggering test payout...")
    
    # Using the data from your curl example
    result = service.payout(
        amount=30,
        account_number="8185003687",
        bank_code="100004",
        account_name="Obinna Okafor",
        task_ref="TEST-TASK-001"
    )
    
    print(f"Payout Result: {result}")

if __name__ == "__main__":
    trigger_test_payout()
