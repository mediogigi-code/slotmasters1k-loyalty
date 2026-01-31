'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function CallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verificando conexión...');

  useEffect(() => {
    const handleAuth = async () => {
      try {
        // 1. Obtener la sesión de Supabase (Discord ya hizo su parte)
        const { data: { session }, error: authError } = await supabase.auth.getSession();
        
        if (authError) throw authError;
        if (!session) {
          setStatus('error');
          setMessage('No se encontró sesión activa.');
          return;
        }

        const user = session.user;

        // 2. Intentar leer si ya existe en la tabla users
        const { data: profile } = await supabase
          .from('users')
          .select('kick_username')
          .eq('id', user.id)
          .single();

        let kickNick = profile?.kick_username;

        // 3. Si no hay Nick de Kick, lanzamos el cartelito (Prompt)
        if (!kickNick) {
          const input = window.prompt("¡CONEXIÓN EXITOSA!\n\nEscribe tu nombre de usuario de KICK (exacto) para el bot:");
          
          if (input && input.trim() !== "") {
            kickNick = input.trim();

            // 4. USAMOS UPSERT: Esto crea la fila si no existe o la actualiza
            const { error: upsertError } = await supabase
              .from('users')
              .upsert({
                id: user.id,
                email: user.email,
                kick_username: kickNick,
                updated_at: new Date().toISOString(),
                points_balance: 0 
              });

            if (upsertError) throw upsertError;
          } else {
            setStatus('error');
            setMessage('El nombre de Kick es obligatorio para continuar.');
            setTimeout(() => router.push('/'), 3000);
            return;
          }
        }

        // 5. Guardar y entrar
        localStorage.setItem('user_id', user.id);
        
        setStatus('success');
        setMessage(`¡Bienvenido, ${kickNick}! Entrando...`);
        
        setTimeout(() => router.push('/'), 2000);

      } catch (err: any) {
        console.error('Error:', err);
        setStatus('error');
        setMessage(err.message || 'Error al vincular la cuenta.');
      }
    };

    handleAuth();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0d1117] text-white">
      <div className="bg-[#161b22] p-8 rounded-2xl shadow-2xl border border-gray-700 text-center max-w-sm w-full">
        {status === 'loading' && (
          <div className="animate-spin h-12 w-12 border-4 border-green-500 border-t-transparent rounded-full mx-auto mb-4"></div>
        )}
        <h2 className={`text-2xl font-bold mb-2 ${status === 'error' ? 'text-red-500' : 'text-green-500'}`}>
          {status === 'loading' ? 'Procesando...' : status === 'success' ? '¡Hecho!' : 'Error'}
        </h2>
        <p className="text-gray-400">{message}</p>
      </div>
    </div>
  );
}