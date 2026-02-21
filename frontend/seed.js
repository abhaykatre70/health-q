import { createClient } from '@supabase/supabase-js';

import dotenv from 'dotenv';
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://eysqkaamfmgpblezkshy.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
});

const COMMON_PASSWORD = '123456';

const PROVIDERS = [
    { email: 'dr.john@healthq.com', name: 'Dr. John Smith', specialty: 'Cardiology', dept: 'Cardiology Unit' },
    { email: 'dr.sarah@healthq.com', name: 'Dr. Sarah Wilson', specialty: 'Neurology', dept: 'Neurology Dept' },
    { email: 'dr.mike@healthq.com', name: 'Dr. Mike Johnson', specialty: 'Pediatrics', dept: 'Children Wing' },
];

const PATIENTS = [
    { email: 'john@gmail.com', name: 'John Doe' },
    { email: 'jane@gmail.com', name: 'Jane Smith' },
    { email: 'alice@gmail.com', name: 'Alice Brown' },
];

async function seed() {
    console.log("🚀 Starting DB Seeding with password:", COMMON_PASSWORD);

    // 1. Create Providers
    for (const p of PROVIDERS) {
        console.log(`Processing Provider: ${p.email}`);
        const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
            email: p.email, password: COMMON_PASSWORD, email_confirm: true,
            user_metadata: { full_name: p.name, role: 'provider' }
        });

        let uid = authUser?.user?.id;
        if (authError) {
            console.log(`Auth user ${p.email} might exist, checking...`);
            const { data: list } = await supabase.auth.admin.listUsers();
            uid = list.users.find(u => u.email === p.email)?.id;
        }

        if (!uid) continue;

        await supabase.from('users').upsert({ id: uid, email: p.email, full_name: p.name, role: 'provider' });
        const { data: prov } = await supabase.from('providers').upsert({
            user_id: uid, specialty: p.specialty, department: p.dept,
            experience_years: 10, consultation_fee: 1000, is_available: true
        }).select().single();

        // Add some slots
        const slots = [];
        for (let i = 0; i < 5; i++) {
            const date = new Date();
            date.setDate(date.getDate() + i);
            [9, 10, 11, 14, 15].forEach(h => {
                const s = new Date(date); s.setHours(h, 0, 0, 0);
                const e = new Date(s); e.setMinutes(30);
                slots.push({ provider_id: prov.id, slot_start: s.toISOString(), slot_end: e.toISOString(), is_booked: false });
            });
        }
        await supabase.from('availability_slots').upsert(slots, { onConflict: 'provider_id,slot_start' });
    }

    // 2. Create Patients
    const patientIds = [];
    for (const p of PATIENTS) {
        console.log(`Processing Patient: ${p.email}`);
        const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
            email: p.email, password: COMMON_PASSWORD, email_confirm: true,
            user_metadata: { full_name: p.name, role: 'patient' }
        });

        let uid = authUser?.user?.id;
        if (authError) {
            const { data: list } = await supabase.auth.admin.listUsers();
            uid = list.users.find(u => u.email === p.email)?.id;
        }
        if (uid) {
            patientIds.push(uid);
            await supabase.from('users').upsert({ id: uid, email: p.email, full_name: p.name, role: 'patient' });
        }
    }

    // 3. Add Historical Appointments for Graphs
    console.log("Adding historical data for charts...");
    const { data: providersList } = await supabase.from('providers').select('id');
    const appts = [];
    for (let i = 0; i < 100; i++) {
        const date = new Date();
        date.setDate(date.getDate() - Math.floor(Math.random() * 60)); // last 60 days
        appts.push({
            patient_id: patientIds[Math.floor(Math.random() * patientIds.length)],
            provider_id: providersList[Math.floor(Math.random() * providersList.length)].id,
            scheduled_at: date.toISOString(),
            status: ['completed', 'cancelled', 'confirmed'][Math.floor(Math.random() * 3)],
            reason: 'Routine checkup'
        });
    }
    await supabase.from('appointments').insert(appts);

    console.log("✅ Seeding Ready!");
}

seed().catch(console.error);
