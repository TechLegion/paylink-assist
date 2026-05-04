# PayLink Assist

PayLink Assist is a secure gig-economy platform designed to connect people who need help with everyday tasks (e.g., furniture assembly, cleaning, moving) with verified community workers. It features an integrated **escrow payment system powered by Payaza**, ensuring that funds are held securely until tasks are completed to the user's satisfaction.

## 🚀 Tech Stack

*   **Frontend**: Next.js (React), standard CSS modules, Lucide React (Icons), React-Leaflet (Interactive Maps).
*   **Backend**: Django, Django REST Framework (DRF), PostgreSQL.
*   **Payments**: Payaza API Integration (Initialize and Verify transactions).

## ✨ Key Features

*   **Task Posting & Browsing**: Users can post detailed tasks with budgets, urgency, and category. An interactive map (Leaflet) allows users to view tasks geographically.
*   **Escrow Protection**: Escrow payments are initiated through the Payaza Gateway API. Funds are only released when the poster confirms task completion.
*   **Dashboard & Wallet**: Comprehensive tracking of active tasks, escrow timelines, and wallet transaction history.
*   **Premium UI**: Custom-built, responsive CSS design system with an emphasis on trust, security, and aesthetics.

## 🛠️ Local Setup

### 1. Database (PostgreSQL)
Ensure you have PostgreSQL running locally.
*   Database Name: `paylink`
*   User: `postgres`
*   Password: `sammyokay`
*   Port: `5432`

### 2. Backend (Django)
```bash
cd backend
python -m venv venv
.\venv\Scripts\activate  # Windows
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```
*(Note: A `.env` file is required in the `backend/` directory containing `PAYAZA_PUBLIC_KEY`, `PAYAZA_SECRET_KEY`, and DB credentials).*

### 3. Frontend (Next.js)
```bash
cd frontend
npm install
npm run dev
```

## 📜 License
Built for the Payaza Hackathon.
