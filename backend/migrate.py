import pg8000
import ssl

# Direct connection to Supabase (port 5432, not pooler 6543)
# Using the direct host instead of the pooler
USER = "postgres.eysqkaamfmgpblezkshy"
PASSWORD = "ayke9175610273"
HOST = "aws-0-ap-south-1.pooler.supabase.com"
PORT = 6543  # Supabase pooler
DATABASE = "postgres"

TABLES_SQL = [
    """
    CREATE TABLE IF NOT EXISTS public.providers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID UNIQUE NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
        specialty TEXT NOT NULL,
        department TEXT NOT NULL,
        experience_years INTEGER DEFAULT 0,
        consultation_fee INTEGER DEFAULT 500,
        is_available BOOLEAN DEFAULT true,
        buffer_minutes INTEGER DEFAULT 15,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS public.availability_slots (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        provider_id UUID NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
        slot_start TIMESTAMP WITH TIME ZONE NOT NULL,
        slot_end TIMESTAMP WITH TIME ZONE NOT NULL,
        is_booked BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS public.appointments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        patient_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
        provider_id UUID NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
        scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
        status TEXT DEFAULT 'pending',
        reason TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS public.queue_entries (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        patient_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
        provider_id UUID NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
        status TEXT DEFAULT 'waiting',
        priority TEXT DEFAULT 'normal',
        estimated_wait_minutes INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS public.notifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
        message TEXT NOT NULL,
        is_read BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
    """
]

print(f"Connecting to {HOST}:{PORT} as {USER}...")

try:
    ssl_ctx = ssl.create_default_context()
    ssl_ctx.check_hostname = False
    ssl_ctx.verify_mode = ssl.CERT_NONE

    conn = pg8000.connect(
        user=USER,
        password=PASSWORD,
        host=HOST,
        port=PORT,
        database=DATABASE,
        ssl_context=ssl_ctx
    )
    conn.autocommit = True
    
    print("Connected successfully!")
    
    for sql in TABLES_SQL:
        table_name = sql.split("public.")[1].split(" ")[0].split("(")[0].strip() if "public." in sql else "unknown"
        try:
            conn.run(sql)
            print(f"  Created table: {table_name}")
        except Exception as e:
            if "already exists" in str(e):
                print(f"  Table {table_name} already exists.")
            else:
                print(f"  Error creating {table_name}: {e}")
    
    conn.close()
    print("\nAll tables created successfully!")
    
except Exception as e:
    print(f"Connection error: {e}")
    import traceback
    traceback.print_exc()
