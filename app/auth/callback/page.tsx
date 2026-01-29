'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function CallbackPage() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Procesando autenticación...');

  useEffect(() => {
    handleCallback();
  }, [searchParams]);

  async function handleCallback() {
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      setStatus('error');
      setMessage('Autenticación cancelada');
      setTimeout(() => {
        window.location.href = '/';
      }, 2000);
      return;
    }

    if (!code) {
      setStatus('error');
      setMessage('Código de autorización no recibido');
      setTimeout(() => {
        window.location.href = '/';
      }, 2000);
      return;
    }

    try {
      // Llamar al API endpoint del mismo servidor
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const endpoint = apiUrl 
        ? `${apiUrl}/api/auth/kick-callback`  // Railway o servidor externo
        : '/api/auth/kick-callback';           // Mismo servidor (SiteGround)
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      });

      if (!response.ok) {
        throw new Error('Error en la autenticación');
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Error desconocido');
      }

      // Guardar datos del usuario en localStorage temporalmente
      localStorage.setItem('kick_user', JSON.stringify(data.user));
      localStorage.setItem('kick_token', data.token);

      // Crear/actualizar usuario en Supabase
      const { data: existingUser } = await supabase
        .from('users')
        .select('*')
        .eq('kick_user_id', data.user.id.toString())
        .single();

      if (existingUser) {
        // Actualizar usuario existente
        await supabase
          .from('users')
          .update({
            kick_username: data.user.username,
            kick_avatar_url: data.user.avatar,
            is_subscriber: data.user.is_subscriber,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingUser.id);

        localStorage.setItem('user_id', existingUser.id);
      } else {
        // Crear nuevo usuario
        const { data: newUser, error: createError } = await supabase
          .from('users')
          .insert({
            kick_user_id: data.user.id.toString(),
            kick_username: data.user.username,
            kick_avatar_url: data.user.avatar,
            is_subscriber: data.user.is_subscriber,
            points_balance: 0,
          })
          .select()
          .single();

        if (createError) throw createError;
        
        localStorage.setItem('user_id', newUser.id);
      }

      setStatus('success');
      setMessage('¡Autenticación exitosa! Redirigiendo...');

      // Redirigir al dashboard
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 1500);

    } catch (error) {
      console.error('Callback error:', error);
      setStatus('error');
      setMessage('Error al procesar la autenticación');
      
      setTimeout(() => {
        window.location.href = '/?error=auth_failed';
      }, 2000);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-blue-800 to-purple-900">
      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full mx-4">
        <div className="text-center">
          {status === 'loading' && (
            <>
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                Procesando...
              </h2>
              <p className="text-gray-600">{message}</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                ¡Éxito!
              </h2>
              <p className="text-gray-600">{message}</p>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                Error
              </h2>
              <p className="text-gray-600">{message}</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
