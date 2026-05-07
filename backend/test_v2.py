import os
from dotenv import load_dotenv
from core.payaza_service import PayazaService

load_dotenv()

def test():
    service = PayazaService()
    print("Initializing payment...")
    result = service.initialize_payment(
        amount=100,
        email="test@example.com",
        first_name="Test",
        last_name="User",
        return_url="http://localhost:3000/dashboard"
    )
    print(f"Result: {result}")

if __name__ == "__main__":
    test()
