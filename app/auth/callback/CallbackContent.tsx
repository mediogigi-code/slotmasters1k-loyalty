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
        // Supabase detecta automáticamente el código en la URL y crea la sesión
        const { data, error } = await supabase.auth.getSession();

        if (error) throw error;

        if (data?.session) {
          setStatus('success');
          setMessage('¡Sesión iniciada con éxito!');
          
          // Guardamos el ID para compatibilidad con tu sistema actual
          localStorage.setItem('user_id', data.session.user.id);
          
          setTimeout(() => {
            router.push('/'); // O a /dashboard si ya lo tienes creado
          }, 1500);
        } else {
          // Si no hay sesión, puede que sea un login de Kick externo
          // Aquí podrías mantener tu lógica de Kick si la necesitas
          setStatus('error');
          setMessage('No se encontró una sesión activa.');
          setTimeout(() => router.push('/'), 2000);
        }
      } catch (err) {
        console.error('Error en el callback:', err);
        setStatus('error');
        setMessage('Error al procesar la autenticación');
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
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          </div>
        )}
        {status === 'error' && (
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </div>
        )}
        <h2 className="text-xl font-bold text-gray-900 mb-2">{status === 'loading' ? 'Procesando...' : status === 'success' ? '¡Éxito!' : 'Error'}</h2>
        <p className="text-gray-600">{message}</p>
      </div>
    </div>
  );
}