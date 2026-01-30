'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function DiscordCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'need_username'>('loading');
  const [userId, setUserId] = useState<string | null>(null);
  const [kickUsername, setKickUsername] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

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
        
        // Si ya tiene username, ir al dashboard
        if (existingUser.kick_username) {
          setStatus('success');
          setTimeout(() => router.push('/dashboard'), 1000);
        } else {
          // Si NO tiene username, mostrar formulario
          setUserId(existingUser.id);
          setStatus('need_username');
        }
      } else {
        // Usuario nuevo
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
        setUserId(newUser.id);
        setStatus('need_username');
      }

    } catch (error) {
      console.error('Error:', error);
      setStatus('error');
      setTimeout(() => router.push('/'), 2000);
    }
  }

  async function handleSaveUsername(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!kickUsername.trim()) {
      setError('Escribe tu username');
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(kickUsername)) {
      setError('Solo letras, números y guiones bajos');
      return;
    }

    setSaving(true);

    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        kick_username: kickUsername.toLowerCase(),
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (updateError) {
      setError('Error al guardar');
      setSaving(false);
      return;
    }

    setStatus('success');
    setTimeout(() => router.push('/dashboard'), 1000);
  }

  // FORMULARIO DE USERNAME
  if (status === 'need_username') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-blue-800 to-purple-900 p-4">
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-8 border border-purple-500/30">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Vincula tu Kick
            </h2>
            <p className="text-gray-400">
              Necesitamos tu username de Kick para darte puntos
            </p>
          </div>

          <form onSubmit={handleSaveUsername} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Username de Kick
              </label>
              <div className="flex gap-2">
                <span className="bg-gray-800 text-gray-500 px-4 py-3 rounded-lg border border-gray-700">@</span>
                <input
                  type="text"
                  value={kickUsername}
                  onChange={(e) => setKickUsername(e.target.value.trim().toLowerCase())}
                  placeholder="dark6666"
                  className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  disabled={saving}
                  autoFocus
                />
              </div>
              <p className="mt-2 text-xs text-gray-500">Sin el @, solo el nombre</p>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500 rounded-lg p-3">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <div className="bg-blue-500/10 border border-blue-500 rounded-lg p-4">
              <p className="text-sm text-blue-400">
                <strong>Importante:</strong> Debe coincidir con tu nombre en Kick
              </p>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50"
            >
              {saving ? 'Guardando...' : 'Confirmar y Continuar'}
            </button>
          </form>

          <p className="mt-4 text-center text-xs text-gray-500">
            Podrás cambiar esto en tu perfil
          </p>
        </div>
      </div>
    );
  }

  // PANTALLAS DE LOADING/SUCCESS/ERROR
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-blue-800 to-purple-900">
      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full mx-4">
        <div className="text-center">
          {status === 'loading' && (
            <>
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Procesando...</h2>
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}
