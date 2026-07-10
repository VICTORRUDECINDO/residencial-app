import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/db';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

// Validación: la URL debe comenzar con http/https (formato: https://xxx.supabase.co)
const isValidUrl = supabaseUrl.startsWith('http://') || supabaseUrl.startsWith('https://');

if (!isValidUrl && typeof window !== 'undefined') {
  console.warn(
    '[Supabase] ⚠️  NEXT_PUBLIC_SUPABASE_URL no es una URL válida.\n' +
    'Debe tener el formato: https://xxxxxxxxxxxx.supabase.co\n' +
    'Verifica tu archivo .env.local'
  );
}

// Usamos un placeholder seguro si la URL no es válida, para no romper el cliente durante setup
export const supabase = createClient<Database>(
  isValidUrl ? supabaseUrl : 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key',
  {
    auth: {
      persistSession: false, // Sin sesión persistente en Electron
      autoRefreshToken: false,
    },
  }
);
