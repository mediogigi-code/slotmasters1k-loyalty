'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function CallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Sincronizando con la base de datos...');

  useEffect(() => {
    const handleAuth = async () => {
      try {
        // 1. Obtener sesión de Discord
        const { data: { session }, error: authError } = await supabase.auth.getSession();
        if (authError) throw authError;
        if (!session) throw new Error("No hay sesión activa");

        const user = session.user;

        // 2. Verificar si el usuario ya tiene Nick de Kick
        const { data: profile } = await supabase
          .from('users')
          .select('kick_username')
          .eq('id', user.id)
          .single();

        let currentKickNick = profile?.kick_username;

        // 3. Si no tiene Nick, pedirlo
        if (!currentKickNick) {
          const inputNick = window.prompt("¡Hola! Introduce tu nombre de usuario de KICK (exacto):");
          
          if (inputNick && inputNick.trim() !== "") {
            currentKickNick = inputNick.trim();

            // 4. Guardar en la tabla 'users' (UPSERT crea o actualiza)
            const { error: upsertError } = await supabase
              .from('users')
              .upsert({
                id: user.id,
                email: user.email, // Ahora la columna ya existe por el SQL anterior
                kick_username: currentKickNick,
                updated_at: new Date().toISOString(),
                points_balance: 0
              });

            if (upsertError) throw upsertError;
          } else {
            setStatus('error');
            setMessage('El nombre de Kick es necesario.');
            setTimeout(() => router.push('/'), 3000);
            return;
          }
        }

        // 5. Finalizar
        setStatus('success');
        setMessage(`¡Bienvenido ${currentKickNick}! Redirigiendo...`);
        setTimeout(() => router.push('/'), 2000);

      } catch (err: any) {
        console.error('Error:', err);
        setStatus('error');
        setMessage(err.message || 'Error en la vinculación.');
      }
    };

    handleAuth();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white">
      <div className="p-8 rounded-xl border border-gray-800 bg-gray-900 text-center shadow-2xl">
        {status === 'loading' && <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>}
        <h1 className="text-xl font-bold mb-2">{status === 'loading' ? 'Cargando...' : 'Estado'}</h1>
        <p className="text-gray-400">{message}</p>
      </div>
    </div>
  );
}