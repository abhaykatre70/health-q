import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://eysqkaamfmgpblezkshy.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'REDACTED';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
});

const SPECIALTIES = ['Cardiology', 'Neurology', 'Pediatrics', 'Orthopedics', 'Dermatology', 'Psychiatry', 'General Medicine'];

async function seedData() {
    console.log("Step 2: Force Seeding mock data...");
    const today = new Date();
    let successCount = 0;

    for (const spec of SPECIALTIES) {
        for (let i = 0; i < 2; i++) {
            const email = `mock_${spec.toLowerCase().replace(' ', '')}_${i}@healthq.com`;
            const fullName = `Dr. ${spec} ${i + 1}`;

            console.log(`\n--- Processing ${fullName} (${email}) ---`);

            // 1. Get or Create Auth User
            let userId = null;
            const { data: authData, error: authError } = await supabase.auth.admin.createUser({
                email, password: 'password123', email_confirm: true,
                user_metadata: { full_name: fullName, role: 'provider' }
            });

            if (authError) {
                if (authError.message.toLowerCase().includes('already')) {
                    const { data: listRes } = await supabase.auth.admin.listUsers();
                    const existing = listRes.users.find(u => u.email === email);
                    if (existing) userId = existing.id;
                } else {
                    console.error(`=> Auth error: ${authError.message}`);
                    continue;
                }
            } else {
                userId = authData.user.id;
            }

            if (!userId) { console.error("=> Failed to get userId"); continue; }

            // 2. Upsert public.users
            const { error: ue } = await supabase.from('users').upsert({
                id: userId, email, full_name: fullName, role: 'provider'
            });
            if (ue) { console.error(`=> public.users error: ${ue.message}`); continue; }

            // 3. Delete existing provider to force recreate slots
            await supabase.from('providers').delete().eq('user_id', userId);

            // 4. Create provider
            const { data: provData, error: pe } = await supabase.from('providers').insert({
                user_id: userId, specialty: spec, department: `${spec} Department`,
                experience_years: Math.floor(Math.random() * 25) + 5,
                consultation_fee: Math.floor(Math.random() * 2000) + 500,
                is_available: true, buffer_minutes: 15
            }).select('id').single();

            if (pe) { console.error(`=> provider insert error: ${pe.message}`); continue; }
            const providerId = provData.id;

            // 5. Insert Slots
            const slotsData = [];
            for (let d = 0; d < 5; d++) {
                for (const hour of [9, 10, 11, 14, 15, 16]) {
                    if (Math.random() < 0.25) continue;
                    const start = new Date(today);
                    start.setDate(today.getDate() + d);
                    start.setHours(hour, 0, 0, 0);
                    const end = new Date(start);
                    end.setMinutes(30);
                    slotsData.push({
                        provider_id: providerId, slot_start: start.toISOString(),
                        slot_end: end.toISOString(), is_booked: false
                    });
                }
            }

            if (slotsData.length > 0) {
                const { error: se } = await supabase.from('availability_slots').insert(slotsData);
                if (se) {
                    console.error(`=> slots error: ${se.message}`);
                } else {
                    console.log(`=> Seeded ${fullName} with ${slotsData.length} slots`);
                    successCount++;
                }
            } else {
                console.log(`=> No slots generated randomly for ${fullName}`);
            }
        }
    }
    return successCount;
}

// ─── Step 3: Create sample patient for testing ───────────────────────────────
async function seedPatient() {
    console.log("\nStep 3: Creating test patient...");
    const email = 'test_patient@healthq.com';
    const { data, error } = await supabase.auth.admin.createUser({
        email, password: 'patient123', email_confirm: true,
        user_metadata: { full_name: 'Test Patient', role: 'patient' }
    });

    let userId;
    if (error) {
        if (error.message.toLowerCase().includes('already')) {
            const { data: listRes } = await supabase.auth.admin.listUsers();
            const existing = listRes.users.find(u => u.email === email);
            if (existing) userId = existing.id;
        } else {
            console.error(`  Patient auth error: ${error.message}`);
            return;
        }
    } else {
        userId = data.user.id;
    }

    if (userId) {
        await supabase.from('users').upsert({ id: userId, email, full_name: 'Test Patient', role: 'patient' });
        console.log(`  Test patient ready (email: ${email}, pw: patient123)`);
    }
}

// ─── Step 4: Create admin user ───────────────────────────────────────────────
async function seedAdmin() {
    console.log("\nStep 4: Creating admin user...");
    const email = 'admin@healthq.com';
    const { data, error } = await supabase.auth.admin.createUser({
        email, password: 'admin123', email_confirm: true,
        user_metadata: { full_name: 'HealthQ Admin', role: 'admin' }
    });

    let userId;
    if (error) {
        if (error.message.toLowerCase().includes('already')) {
            const { data: listRes } = await supabase.auth.admin.listUsers();
            const existing = listRes.users.find(u => u.email === email);
            if (existing) userId = existing.id;
        } else {
            console.error(`  Admin auth error: ${error.message}`);
            return;
        }
    } else {
        userId = data.user.id;
    }

    if (userId) {
        await supabase.from('users').upsert({ id: userId, email, full_name: 'HealthQ Admin', role: 'admin' });
        console.log(`  Admin user ready (email: ${email}, pw: admin123)`);
    }
}

async function main() {
    console.log("=== HealthQ Database Force Seeding ===\n");
    await seedData();
    await seedPatient();
    await seedAdmin();
    console.log("\n=== Setup Complete! ===");
}

main().catch(console.error);
