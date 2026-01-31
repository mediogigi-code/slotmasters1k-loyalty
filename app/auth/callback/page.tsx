'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function DiscordCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    handleCallback();
  }, []);

  async function handleCallback() {
    try {
      const hash = window.location.hash.substring(1);
      const params = new URLSearchParams(hash);
      const accessToken = params.get('access_token');

      if (!accessToken) {
        console.error('No access token');
        setStatus('error');
        setTimeout(() => router.push('/'), 2000);
        return;
      }

      // Obtener datos de Discord
      const userResponse = await fetch('https://discord.com/api/users/@me', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!userResponse.ok) {
        console.error('Error fetching Discord user');
        setStatus('error');
        setTimeout(() => router.push('/'), 2000);
        return;
      }

      const discordUser = await userResponse.json();
      console.log('Discord user:', discordUser);

      // Buscar usuario existente
      const { data: existingUser, error: searchError } = await supabase
        .from('users')
        .select('*')
        .eq('discord_user_id', discordUser.id)
        .maybeSingle();

      console.log('Existing user:', existingUser);

      if (existingUser) {
        // Usuario existe
        localStorage.setItem('user_id', existingUser.id);
        console.log('User exists, going to dashboard');
        setStatus('success');
        setTimeout(() => router.push('/dashboard'), 1000);
      } else {
        // Crear nuevo usuario
        console.log('Creating new user...');
        
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

        if (createError) {
          console.error('Error creating user:', createError);
          setStatus('error');
          setTimeout(() => router.push('/'), 2000);
          return;
        }

        console.log('New user created:', newUser);
        localStorage.setItem('user_id', newUser.id);
        setStatus('success');
        setTimeout(() => router.push('/dashboard'), 1000);
      }

    } catch (error) {
      console.error('Callback error:', error);
      setStatus('error');
      setTimeout(() => router.push('/'), 2000);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-blue-800 to-purple-900">
      <div className="bg-white rounded-xl p-8 max-w-md w-full">
        <div className="text-center">
          {status === 'loading' && (
            <>
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-900">Procesando...</p>
            </>
          )}
          {status === 'success' && <p className="text-green-600 font-bold">✅ Éxito</p>}
          {status === 'error' && <p className="text-red-600 font-bold">❌ Error</p>}
        </div>
      </div>
    </div>
  );
}