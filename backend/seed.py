import os
import httpx
from dotenv import load_dotenv
import random
import uuid
from datetime import datetime, timedelta, timezone

load_dotenv()

URL = os.environ.get("SUPABASE_URL")
KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

if not URL or not KEY:
    print("Cannot find SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env!")
    exit(1)

HEADERS = {
    "apikey": KEY,
    "Authorization": f"Bearer {KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=representation"
}

SPECIALTIES = ['Cardiology', 'Neurology', 'Pediatrics', 'Orthopedics', 'Dermatology', 'Psychiatry', 'General Medicine']

print("Starting HTTP REST DB Seeding...")

today = datetime.now(timezone.utc)

for spec in SPECIALTIES:
    for i in range(2):
        email = f"mock_{spec.lower().replace(' ', '')}_{i}@healthq.com"
        full_name = f"Dr. {spec} {i+1}"
        
        # 1. Create User in Auth
        user_data = {
            "email": email,
            "password": "password123",
            "email_confirm": True,
            "user_metadata": {"full_name": full_name, "role": "provider"}
        }
        res = httpx.post(f"{URL}/auth/v1/admin/users", json=user_data, headers=HEADERS)
        
        if res.status_code not in (200, 201):
            if "already exists" in res.text or "already registered" in res.text:
                print(f"Skipping {email} (already exists)")
                continue
            else:
                print(f"Failed to create user {email}: {res.text}")
                continue
                
        user = res.json()
        user_id = user.get("id")
        
        # 2. Insert into public.users
        users_payload = {
            "id": user_id,
            "email": email,
            "full_name": full_name,
            "role": "provider"
        }
        # postgrest upsert
        upsert_headers = HEADERS.copy()
        upsert_headers["Prefer"] = "resolution=merge-duplicates,return=representation"
        res2 = httpx.post(f"{URL}/rest/v1/users", json=users_payload, headers=upsert_headers)
        
        # 3. Insert into public.providers
        provider_payload = {
            "user_id": user_id,
            "specialty": spec,
            "department": f"{spec} Department",
            "experience_years": random.randint(5, 30),
            "consultation_fee": random.randint(500, 2500),
            "is_available": True,
            "buffer_minutes": 15
        }
        res3 = httpx.post(f"{URL}/rest/v1/providers", json=provider_payload, headers=upsert_headers)
        if res3.status_code not in (200, 201):
            print(f"Failed to insert provider for {email}: {res3.text}")
            continue
            
        provider_data = res3.json()
        if isinstance(provider_data, list) and len(provider_data) > 0:
            provider_id = provider_data[0].get("id")
        else:
            continue
            
        # 4. Insert Slots
        slots = []
        for days_ahead in range(5):
            for hour in [9, 10, 11, 14, 15, 16]:
                if random.random() < 0.3: continue
                start_time = (today + timedelta(days=days_ahead)).replace(hour=hour, minute=0, second=0, microsecond=0)
                end_time = start_time + timedelta(minutes=30)
                slots.append({
                    "provider_id": provider_id,
                    "slot_start": start_time.isoformat(),
                    "slot_end": end_time.isoformat(),
                    "is_booked": False
                })
                
        if slots:
            res4 = httpx.post(f"{URL}/rest/v1/availability_slots", json=slots, headers=HEADERS)
            if res4.status_code in (200, 201):
                print(f"Successfully seeded {full_name} and {len(slots)} slots.")
            else:
                print(f"Failed to insert slots for {full_name}: {res4.text}")

print("Data Seeding Completed Successfully!")
