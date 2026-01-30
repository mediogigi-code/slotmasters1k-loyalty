'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

interface KickUsernameModalProps {
  userId: string;
  onComplete: () => void;
}

export default function KickUsernameModal({ userId, onComplete }: KickUsernameModalProps) {
  const [kickUsername, setKickUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!kickUsername.trim()) {
      setError('Por favor, escribe tu username de Kick');
      return;
    }

    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!usernameRegex.test(kickUsername)) {
      setError('El username solo puede contener letras, números y guiones bajos');
      return;
    }

    setLoading(true);

    try {
      const { data: existing } = await supabase
        .from('users')
        .select('id')
        .eq('kick_username', kickUsername)
        .neq('id', userId)
        .single();

      if (existing) {
        setError('Este username de Kick ya está en uso');
        setLoading(false);
        return;
      }

      const { error: updateError } = await supabase
        .from('users')
        .update({ 
          kick_username: kickUsername,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (updateError) throw updateError;

      onComplete();
    } catch (err) {
      console.error('Error:', err);
      setError('Error al guardar. Inténtalo de nuevo.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-8 border border-purple-500/30">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Vincula tu cuenta de Kick
          </h2>
          <p className="text-gray-400">
            Necesitamos tu username de Kick para darte puntos
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="kick_username" className="block text-sm font-medium text-gray-300 mb-2">
              Username de Kick
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
                @
              </span>
              <input
                type="text"
                id="kick_username"
                value={kickUsername}
                onChange={(e) => setKickUsername(e.target.value.trim().toLowerCase())}
                placeholder="tuusername"
                className="w-full pl-8 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                disabled={loading}
                autoFocus
              />
            </div>
            <p className="mt-2 text-xs text-gray-500">
              Escribe exactamente como aparece en Kick (sin el @)
            </p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500 rounded-lg p-3">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <div className="bg-blue-500/10 border border-blue-500 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-400">
                  <strong>Importante:</strong> Este username debe coincidir con tu nombre en Kick
                </p>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !kickUsername.trim()}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Guardando...
              </>
            ) : (
              'Confirmar y Continuar'
            )}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-gray-500">
          Podrás cambiar esto en tu perfil
        </p>
      </div>
    </div>
  );
}
