import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Helper para obtener el usuario actual
export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
}

// Helper para obtener datos del usuario de la DB
export async function getUserProfile(userId: string) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();
  
  if (error) throw error;
  return data;
}

// Helper para actualizar puntos
export async function updateUserPoints(userId: string, points: number) {
  const { error } = await supabase
    .from('users')
    .update({ points_balance: points })
    .eq('id', userId);
  
  if (error) throw error;
}

// Helper para crear transacción
export async function createTransaction(
  userId: string,
  type: string,
  amount: number,
  description?: string,
  metadata?: Record<string, any>
) {
  const { data, error } = await supabase
    .from('transactions')
    .insert({
      user_id: userId,
      type,
      amount,
      description,
      metadata,
      status: 'completed'
    })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}
