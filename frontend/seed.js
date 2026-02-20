import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://eysqkaamfmgpblezkshy.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'REDACTED';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

const SPECIALTIES = ['Cardiology', 'Neurology', 'Pediatrics', 'Orthopedics', 'Dermatology', 'Psychiatry', 'General Medicine'];

async function seed() {
    console.log("Starting DB Seeding...");

    for (const spec of SPECIALTIES) {
        for (let i = 0; i < 2; i++) {
            const email = `mock_${spec.toLowerCase().replace(' ', '')}_${i}@healthq.com`;
            const fullName = `Dr. ${spec} ${i + 1}`;

            console.log(`Processing ${email}...`);

            // 1. Create Auth User
            const { data: authData, error: authError } = await supabase.auth.admin.createUser({
                email: email,
                password: 'password123',
                email_confirm: true,
                user_metadata: { full_name: fullName, role: 'provider' }
            });

            let userId = null;
            if (authError) {
                if (authError.message.toLowerCase().includes('already exists') || authError.message.toLowerCase().includes('already registered') || authError.message.toLowerCase().includes('already been registered')) {
                    // Get existing user ID
                    console.log(`${email} already exists. Fetching...`);
                    const { data: listRes } = await supabase.auth.admin.listUsers();
                    const existingUser = listRes.users.find(u => u.email === email);
                    if (existingUser) userId = existingUser.id;
                } else {
                    console.error(`Failed to create auth user ${email}:`, authError.message);
                    continue;
                }
            } else {
                userId = authData.user.id;
            }

            if (!userId) {
                console.error(`Could not resolve user ID for ${email}`);
                continue;
            }

            // 2. Upsert Public User Profile
            const { error: userError } = await supabase.from('users').upsert({
                id: userId,
                email: email,
                full_name: fullName,
                role: 'provider'
            });

            if (userError) {
                console.error(`Error inserting into public.users:`, userError.message);
            }

            // 3. Upsert Provider Profile
            const { data: providerData, error: provError } = await supabase.from('providers').upsert({
                user_id: userId,
                specialty: spec,
                department: `${spec} Department`,
                experience_years: Math.floor(Math.random() * 25) + 5,
                consultation_fee: Math.floor(Math.random() * 2000) + 500,
                is_available: true,
                buffer_minutes: 15
            }).select('id').single();

            if (provError) {
                console.error(`Error inserting provider:`, provError.message);
                continue;
            }

            const providerId = providerData.id;

            // 4. Insert Slots
            const today = new Date();
            const slotsData = [];

            for (let daysAhead = 0; daysAhead < 5; daysAhead++) {
                const hours = [9, 10, 11, 14, 15, 16];
                for (let hour of hours) {
                    if (Math.random() < 0.3) continue; // Skip some

                    const slotStart = new Date(today);
                    slotStart.setDate(today.getDate() + daysAhead);
                    slotStart.setHours(hour, 0, 0, 0);

                    const slotEnd = new Date(slotStart);
                    slotEnd.setMinutes(30);

                    slotsData.push({
                        provider_id: providerId,
                        slot_start: slotStart.toISOString(),
                        slot_end: slotEnd.toISOString(),
                        is_booked: false
                    });
                }
            }

            if (slotsData.length > 0) {
                const { error: slotError } = await supabase.from('availability_slots').insert(slotsData);
                if (slotError && !slotError.message.includes('duplicate key')) {
                    console.error(`Error inserting slots:`, slotError.message);
                } else {
                    console.log(`Created profile and ${slotsData.length} slots for ${fullName}`);
                }
            }
        }
    }

    console.log("Data Seeding Completed!");
}

seed().catch(console.error);
