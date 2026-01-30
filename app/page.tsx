'use client';

import React, { useState } from 'react';
import { Trophy, Zap, Gift, TrendingUp, Users, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function Home() {
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!acceptedTerms) {
      setShowWarning(true);
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'discord',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      console.error('Error:', error.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-purple-900">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 -left-4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse-slow"></div>
          <div className="absolute top-0 -right-4 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl animation-delay-2000"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 py-20">
          <div className="text-center mb-16">
            <h1 className="text-5xl font-bold text-white mb-6">
              SlotMasters1K
              <span className="block text-blue-300 text-3xl mt-2">Sistema de Lealtad</span>
            </h1>

            <div className="max-w-2xl mx-auto mb-6">
              <label className="flex items-start gap-3 cursor-pointer bg-white/10 p-4 rounded-xl border border-white/20">
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="mt-1"
                />
                <span className="text-sm text-blue-100">Acepto los términos y soy mayor de 18 años.</span>
              </label>
              {showWarning && <p className="text-red-400 text-sm mt-2">Debes aceptar los términos</p>}
            </div>

            <button
              onClick={handleLogin}
              disabled={!acceptedTerms || loading}
              className={`inline-flex items-center gap-3 px-8 py-4 rounded-xl font-bold transition-all ${
                acceptedTerms ? 'bg-[#5865F2] text-white hover:scale-105' : 'bg-gray-500 text-gray-300'
              }`}
            >
              {loading ? 'Conectando...' : 'Iniciar Sesión con Discord'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}