'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function DiscordCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    handleCallback();
  }, []);

  async function handleCallback() {
    try {
      const hash = window.location.hash.substring(1);
      const params = new URLSearchParams(hash);
      const accessToken = params.get('access_token');

      if (!accessToken) throw new Error('No token');

      const userResponse = await fetch('https://discord.com/api/users/@me', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const discordUser = await userResponse.json();

      const { data: existingUser } = await supabase
        .from('users')
        .select('*')
        .eq('discord_user_id', discordUser.id)
        .single();

      if (existingUser) {
        localStorage.setItem('user_id', existingUser.id);
      } else {
        const { data: newUser } = await supabase
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

        localStorage.setItem('user_id', newUser.id);
      }

      setStatus('success');
      setTimeout(() => router.push('/dashboard'), 1000);

    } catch (error) {
      setStatus('error');
      setTimeout(() => router.push('/'), 2000);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-blue-800 to-purple-900">
      <div className="bg-white rounded-xl p-8 max-w-md w-full">
        <div className="text-center">
          {status === 'loading' && (
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
          )}
          {status === 'success' && <p className="text-green-600 font-bold">✅ Éxito</p>}
          {status === 'error' && <p className="text-red-600 font-bold">❌ Error</p>}
        </div>
      </div>
    </div>
  );
}