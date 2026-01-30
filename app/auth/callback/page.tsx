'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import KickUsernameModal from '@/components/KickUsernameModal';

export default function DiscordCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'need_kick_username'>('loading');
  const [message, setMessage] = useState('Procesando autenticación...');
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    handleDiscordCallback();
  }, []);

  async function handleDiscordCallback() {
    try {
      const hash = window.location.hash.substring(1);
      const params = new URLSearchParams(hash);
      const accessToken = params.get('access_token');

      if (!accessToken) {
        throw new Error('No se recibió token');
      }

      const userResponse = await fetch('https://discord.com/api/users/@me', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!userResponse.ok) throw new Error('Error al obtener datos');

      const discordUser = await userResponse.json();

      const { data: existingUser } = await supabase
        .from('users')
        .select('*')
        .eq('discord_user_id', discordUser.id)
        .single();

      if (existingUser) {
        await supabase
          .from('users')
          .update({
            discord_username: discordUser.username,
            discord_avatar_url: discordUser.avatar 
              ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`
              : null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingUser.id);

        localStorage.setItem('user_id', existingUser.id);
        localStorage.setItem('discord_user', JSON.stringify(discordUser));

        if (!existingUser.kick_username) {
          setUserId(existingUser.id);
          setStatus('need_kick_username');
          return;
        }

        setStatus('success');
        setMessage('¡Bienvenido!');
        setTimeout(() => router.push('/dashboard'), 1500);

      } else {
        const { data: newUser, error: createError } = await supabase
          .from('users')
          .insert({
            discord_user_id: discordUser.id,
            discord_username: discordUser.username,
            discord_avatar_url: discordUser.avatar 
              ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`
              : null,
            points_balance: 0,
          })
          .select()
          .single();

        if (createError) throw createError;

        localStorage.setItem('user_id', newUser.id);
        localStorage.setItem('discord_user', JSON.stringify(discordUser));

        setUserId(newUser.id);
        setStatus('need_kick_username');
      }

    } catch (error) {
      console.error('Error:', error);
      setStatus('error');
      setMessage('Error al procesar');
      
      setTimeout(() => router.push('/?error=auth_failed'), 2000);
    }
  }

  function handleKickUsernameComplete() {
    setStatus('success');
    setMessage('¡Cuenta vinculada!');
    setTimeout(() => router.push('/dashboard'), 1500);
  }

  if (status === 'need_kick_username' && userId) {
    return <KickUsernameModal userId={userId} onComplete={handleKickUsernameComplete} />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-blue-800 to-purple-900">
      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full mx-4">
        <div className="text-center">
          {status === 'loading' && (
            <>
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Procesando...</h2>
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
              <h2 className="text-xl font-bold text-gray-900 mb-2">¡Éxito!</h2>
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
              <h2 className="text-xl font-bold text-gray-900 mb-2">Error</h2>
              <p className="text-gray-600">{message}</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
