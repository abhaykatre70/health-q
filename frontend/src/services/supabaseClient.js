import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ── Auth ──────────────────────────────────────────────────────────────────────
export const signInUser = async (email, password) => {
    return await supabase.auth.signInWithPassword({ email, password });
};

export const signInWithGoogle = async () => {
    return await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: window.location.origin,
        },
    });
};


export const signUpUser = async (email, password, fullName, role) => {
    const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: { full_name: fullName, role: role }
        }
    });

    if (authError) return { error: authError };

    // Also insert into public.users
    if (authData.user) {
        const { error: insertError } = await supabase.from('users').upsert({
            id: authData.user.id,
            email: email,
            full_name: fullName,
            role: role,
        });

        if (insertError) {
            console.error('Error creating user profile:', insertError);
            // Optional: delete the auth user if profile creation fails to keep consistency
            // await supabase.auth.admin.deleteUser(authData.user.id);
            return { error: insertError };
        }

        // SEED DUMMY DATA FOR DEMO
        if (role === 'patient') {
            await seedNewUser(authData.user.id);
        }
    }

    return { data: authData };
};

const seedNewUser = async (userId) => {
    // 1. Add Welcome Notification
    await supabase.from('notifications').insert([
        {
            user_id: userId,
            title: 'Welcome to HealthQ! 👋',
            body: 'Your account has been created successfully. Explore our AI-powered features to manage your health.',
            is_read: false
        }
    ]);

    // 2. Try to find a provider to create a dummy appointment with
    const { data: providers } = await supabase.from('providers').select('id').limit(1);
    
    if (providers && providers.length > 0) {
        const providerId = providers[0].id;
        // Add a dummy upcoming appointment
        await supabase.from('appointments').insert([
            {
                patient_id: userId,
                provider_id: providerId,
                scheduled_at: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
                status: 'confirmed',
                reason: 'Initial Consultation (Demo)'
            }
        ]);
    }
};

export const resetPassword = async (email) => {
    return await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
    });
};

export const updatePassword = async (newPassword) => {
    return await supabase.auth.updateUser({ password: newPassword });
};

// ── Providers ─────────────────────────────────────────────────────────────────
export const fetchProviders = async (specialty = null) => {
    let query = supabase
        .from('providers')
        .select(`id, specialty, department, bio, avg_consultation_minutes, buffer_minutes, max_concurrent, users(id, full_name, email)`)
        .order('specialty');

    if (specialty) {
        query = query.eq('specialty', specialty);
    }

    return await query;
};

export const fetchProviderSlots = async (providerId) => {
    return await supabase
        .from('availability_slots')
        .select('*')
        .eq('provider_id', providerId)
        .eq('is_active', true)
        .order('day_of_week')
        .order('start_time');
};

// ── Appointments ──────────────────────────────────────────────────────────────
export const fetchAppointments = async (userId) => {
    return await supabase
        .from('appointments')
        .select(`*, providers(specialty, avg_consultation_minutes, department, users(full_name, email))`)
        .eq('patient_id', userId)
        .order('scheduled_at', { ascending: true });
};

export const fetchProviderAppointments = async (providerId) => {
    return await supabase
        .from('appointments')
        .select(`*, users!appointments_patient_id_fkey(full_name, email)`)
        .eq('provider_id', providerId)
        .order('scheduled_at', { ascending: true });
};

export const bookAppointment = async (appointmentData) => {
    return await supabase
        .from('appointments')
        .insert([appointmentData])
        .select();
};

export const updateAppointmentStatus = async (id, status) => {
    return await supabase
        .from('appointments')
        .update({ status })
        .eq('id', id)
        .select();
};

// ── Notifications ─────────────────────────────────────────────────────────────
export const fetchNotifications = async (userId) => {
    return await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);
};

export const markNotificationRead = async (id) => {
    return await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id);
};

export const markAllNotificationsRead = async (userId) => {
    return await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false);
};

// ── User Profile ──────────────────────────────────────────────────────────────
export const fetchUserProfile = async (userId) => {
    return await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
};

export const subscribeToNotifications = (userId, callback) => {
    return supabase
        .channel(`notifications:${userId}`)
        .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${userId}`
        }, callback)
        .subscribe();
};
