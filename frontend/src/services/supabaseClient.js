import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const signInUser = async (email, password) => {
    return await supabase.auth.signInWithPassword({ email, password });
};

export const signInWithGoogle = async () => {
    return await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: window.location.origin,
            queryParams: {
                access_type: 'offline',
                prompt: 'consent',
            },
        },
    })
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
    return { data: authData };
};

export const fetchProviders = async () => {
    return await supabase
        .from('providers')
        .select(`*, users ( full_name, email )`);
};

export const fetchAppointments = async (userId) => {
    return await supabase
        .from('appointments')
        .select(`*, providers(users(full_name))`)
        .eq('patient_id', userId);
};

export const bookAppointment = async (appointmentData) => {
    return await supabase
        .from('appointments')
        .insert([appointmentData])
        .select();
};
