'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function PerfilPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [kickUsername, setKickUsername] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadUserData();
  }, []);

  async function loadUserData() {
    try {
      const userId = localStorage.getItem('user_id');
      
      if (!userId) {
        router.push('/');
        return;
      }

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;

      setUser(data);
      setKickUsername(data.kick_username || '');
    } catch (err) {
      console.error('Error:', err);
      router.push('/');
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateUsername(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!kickUsername.trim()) {
      setError('Por favor, escribe tu username de Kick');
      return;
    }

    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!usernameRegex.test(kickUsername)) {
      setError('El username solo puede contener letras, números y guiones bajos');
      return;
    }

    setSaving(true);

    try {
      const { data: existing } = await supabase
        .from('users')
        .select('id')
        .eq('kick_username', kickUsername)
        .neq('id', user.id)
        .single();

      if (existing) {
        setError('Este username ya está en uso');
        setSaving(false);
        return;
      }

      const { error: updateError } = await supabase
        .from('users')
        .update({ 
          kick_username: kickUsername,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setSuccess('✅ Username actualizado');
      setUser({ ...user, kick_username: kickUsername });
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error:', err);
      setError('Error al actualizar');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <button
            onClick={() => router.push('/dashboard')}
            className="text-purple-400 hover:text-purple-300 flex items-center gap-2 mb-4"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Volver al Dashboard
          </button>
          <h1 className="text-4xl font-bold text-white">Mi Perfil</h1>
        </div>

        <div className="grid gap-6">
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 border border-purple-500/30">
            <h2 className="text-2xl font-bold text-white mb-4">Información</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Saldo</label>
                <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg p-4">
                  <span className="text-3xl font-bold text-white">
                    {user.points_balance?.toLocaleString() || 0}
                  </span>
                  <span className="text-purple-200 ml-2">puntos</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 border border-purple-500/30">
            <h2 className="text-2xl font-bold text-white mb-4">Username de Kick</h2>

            {!user.kick_username && (
              <div className="bg-yellow-500/10 border border-yellow-500 rounded-lg p-4 mb-6">
                <p className="text-yellow-400 text-sm">
                  ⚠️ Vincula tu username de Kick para recibir puntos
                </p>
              </div>
            )}

            <form onSubmit={handleUpdateUsername} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-300 mb-2">Username de Kick</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">@</span>
                  <input
                    type="text"
                    value={kickUsername}
                    onChange={(e) => setKickUsername(e.target.value.trim().toLowerCase())}
                    placeholder="tuusername"
                    className="w-full pl-8 pr-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white"
                    disabled={saving}
                  />
                </div>
                <p className="mt-2 text-xs text-gray-500">Sin el @</p>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500 rounded-lg p-3">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              {success && (
                <div className="bg-green-500/10 border border-green-500 rounded-lg p-3">
                  <p className="text-green-400 text-sm">{success}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={saving || kickUsername === user.kick_username}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50"
              >
                {saving ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
