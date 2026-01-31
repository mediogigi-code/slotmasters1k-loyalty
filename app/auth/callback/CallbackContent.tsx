'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function CallbackContent() {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verificando sesión...');

  useEffect(() => {
    async function handleAuth() {
      try {
        // 1. Obtener la sesión de la URL (Discord/Supabase)
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) throw sessionError;

        if (session) {
          const user = session.user;
          
          // 2. Verificar si el usuario ya existe en nuestra tabla pública
          const { data: profile, error: profileError } = await supabase
            .from('users')
            .select('kick_nickname')
            .eq('id', user.id)
            .single();

          let currentKickNick = profile?.kick_nickname;

          // 3. Si no existe o no tiene Nick de Kick, se lo pedimos
          if (!currentKickNick) {
            const nick = window.prompt(
              "¡Hola! Para que el bot te reconozca, introduce tu nombre de usuario de KICK:"
            );

            if (nick && nick.trim() !== "") {
              // Guardar/Actualizar en la tabla pública
              const { error: upsertError } = await supabase
                .from('users')
                .upsert({
                  id: user.id,
                  email: user.email,
                  kick_nickname: nick.trim(),
                  updated_at: new Date()
                });

              if (upsertError) throw upsertError;
              currentKickNick = nick;
              setMessage(`¡Configurado! Bienvenido ${nick}`);
            } else {
              // Si cancela el prompt, avisamos que es necesario
              setMessage("El nombre de Kick es necesario para el bot.");
              setStatus('error');
              setTimeout(() => router.push('/'), 3000);
              return;
            }
          }

          // 4. Todo OK: Guardar localmente y entrar
          setStatus('success');
          setMessage(`Sesión iniciada como ${currentKickNick || user.email}`);
          localStorage.setItem('user_id', user.id);
          localStorage.setItem('kick_nick', currentKickNick || '');

          setTimeout(() => {
            router.push('/'); 
          }, 1500);

        } else {
          setStatus('error');
          setMessage('No se pudo recuperar la sesión.');
          setTimeout(() => router.push('/'), 2000);
        }
      } catch (err) {
        console.error('Error en el callback:', err);
        setStatus('error');
        setMessage('Error al procesar la cuenta.');
        setTimeout(() => router.push('/'), 2000);
      }
    }

    handleAuth();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-blue-800 to-purple-900">
      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full mx-4 text-center">
        {status === 'loading' && (
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
        )}
        {status === 'success' && (
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}
        {status === 'error' && (
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        )}
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          {status === 'loading' ? 'Procesando...' : status === 'success' ? '¡Éxito!' : 'Aviso'}
        </h2>
        <p className="text-gray-600">{message}</p>
      </div>
    </div>
  );
}