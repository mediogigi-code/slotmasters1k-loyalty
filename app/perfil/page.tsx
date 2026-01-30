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
    loadUser();
  }, []);

  async function loadUser() {
    const userId = localStorage.getItem('user_id');
    if (!userId) {
      router.push('/');
      return;
    }

    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (data) {
      setUser(data);
      setKickUsername(data.kick_username || '');
    }
    setLoading(false);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');

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
      .eq('id', user.id);

    if (updateError) {
      setError('Error al guardar');
      setSaving(false);
      return;
    }

    setSuccess('✅ Guardado!');
    setSaving(false);
    setTimeout(() => setSuccess(''), 3000);
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
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => router.push('/dashboard')}
          className="text-purple-400 hover:text-purple-300 mb-6 flex items-center gap-2"
        >
          ← Volver
        </button>

        <h1 className="text-4xl font-bold text-white mb-8">Mi Perfil</h1>

        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 border border-purple-500/30">
          <h2 className="text-2xl font-bold text-white mb-6">Vincula tu Kick</h2>

          {!user.kick_username && (
            <div className="bg-yellow-500/10 border border-yellow-500 rounded-lg p-4 mb-6">
              <p className="text-yellow-400 text-sm">
                ⚠️ Necesitas vincular tu username de Kick para recibir puntos
              </p>
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-6">
            <div>
              <label className="block text-sm text-gray-300 mb-2">
                Username de Kick
              </label>
              <div className="flex gap-2">
                <span className="bg-gray-900 text-gray-500 px-4 py-3 rounded-lg">@</span>
                <input
                  type="text"
                  value={kickUsername}
                  onChange={(e) => setKickUsername(e.target.value.trim().toLowerCase())}
                  placeholder="dark6666"
                  className="flex-1 px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white"
                  disabled={saving}
                />
              </div>
              <p className="mt-2 text-xs text-gray-500">Sin el @, solo el nombre</p>
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
              disabled={saving}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold py-3 rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50"
            >
              {saving ? 'Guardando...' : 'Guardar Username'}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-700">
            <h3 className="text-white font-bold mb-3">💡 Importante:</h3>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li>• Escribe tu username exactamente como aparece en Kick</li>
              <li>• El bot te dará puntos automáticamente cuando estés en el chat</li>
              <li>• Recibes 5 pts cada 10 minutos viendo el stream</li>
              <li>• +2 pts bonus si escribes en el chat</li>
              <li>• x2 multiplicador si eres suscriptor</li>
            </ul>
          </div>
        </div>

        {user.points_balance !== undefined && (
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 border border-gray-700 mt-6">
            <h3 className="text-white font-bold mb-2">Tu Saldo</h3>
            <div className="text-4xl font-bold text-purple-400">
              {user.points_balance.toLocaleString()} <span className="text-2xl">pts</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
