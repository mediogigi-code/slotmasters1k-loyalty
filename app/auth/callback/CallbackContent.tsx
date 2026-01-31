'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function CallbackContent() {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verificando cuenta...');

  useEffect(() => {
    async function handleAuth() {
      try {
        // 1. Validar sesión de Supabase
        const { data: { session }, error: authError } = await supabase.auth.getSession();
        if (authError) throw authError;

        if (session) {
          const user = session.user;

          // 2. Esperar un momento a que el Trigger de la DB cree el usuario
          // Buscamos el perfil en la tabla 'users'
          const { data: profile, error: profileError } = await supabase
            .from('users')
            .select('kick_username')
            .eq('id', user.id)
            .single();

          if (profileError && profileError.code !== 'PGRST116') {
             console.error("Error DB:", profileError);
          }

          let kickNick = profile?.kick_username;

          // 3. Si el Nick está vacío, lo pedimos con el Prompt
          // (Si ya tiene uno de Discord, lo tratamos como vacío para que ponga el de KICK)
          if (!kickNick || kickNick === user.user_metadata?.full_name) {
            const inputNick = window.prompt("Introduce tu nombre de usuario de KICK (exacto) para el bot:");
            
            if (inputNick && inputNick.trim() !== "") {
              const { error: updateError } = await supabase
                .from('users')
                .update({ 
                  kick_username: inputNick.trim(),
                  updated_at: new Date().toISOString()
                })
                .eq('id', user.id);

              if (updateError) throw updateError;
              kickNick = inputNick.trim();
            } else {
              // Si no pone nada, no podemos dejarle pasar si el bot lo necesita
              setStatus('error');
              setMessage('El nombre de Kick es obligatorio.');
              setTimeout(() => router.push('/'), 3000);
              return;
            }
          }

          // 4. Éxito total
          setStatus('success');
          setMessage(`¡Bienvenido ${kickNick}!`);
          localStorage.setItem('user_id', user.id);
          
          setTimeout(() => router.push('/'), 1500);
        } else {
          router.push('/');
        }
      } catch (err) {
        console.error('Error:', err);
        setStatus('error');
        setMessage('Hubo un error al vincular tu cuenta.');
      }
    }

    handleAuth();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-sm w-full">
        {status === 'loading' && <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>}
        <h2 className="text-2xl font-bold mb-2 text-gray-800">
          {status === 'loading' ? 'Conectando...' : status === 'success' ? '¡Listo!' : 'Atención'}
        </h2>
        <p className="text-gray-600">{message}</p>
      </div>
    </div>
  );
}