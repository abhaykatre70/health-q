# HealthQ Backend & Database Setup

## Database Setup (Supabase)

Since this project connects directly to Supabase from the frontend, you need to set up the database schema.

1.  **Go to your Supabase Dashboard.**
2.  Navigate to the **SQL Editor**.
3.  Open the `schema.sql` file located in this directory (`backend/schema.sql`).
4.  Copy the contents and paste them into the Supabase SQL Editor.
5.  **Run** the SQL query.

This will create:
-   `users`, `providers`, `appointments`, `notifications` tables.
-   Row Level Security (RLS) policies.

## Python Backend

The Python backend (FastAPI) is currently a skeleton for future advanced features (AI analysis, heavy processing).
To run it:

```bash
cd backend
python -m venv venv
# Windows
.\venv\Scripts\activate
# Mac/Linux
source venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload
```

## Frontend

The frontend handles authentication and data logic.

```bash
cd frontend
npm install
npm run dev
```
