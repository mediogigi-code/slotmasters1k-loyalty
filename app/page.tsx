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

    // Determinamos la URL de redirección dinámicamente
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://dazzling-quietude-production-65d6.up.railway.app';

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'discord',
      options: {
        // Esto asegura que regreses a la web de Railway
        redirectTo: `${origin}/auth/callback`,
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
        {/* Animated background */}
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
                  onChange={(e) => {
                    setAcceptedTerms(e.target.checked);
                    setShowWarning(false);
                  }}
                  className="mt-1"
                />
                <span className="text-sm text-blue-100 text-left">
                  He leído y acepto los términos y condiciones. Soy mayor de 18 años.
                </span>
              </label>
              {showWarning && (
                <p className="mt-2 text-red-400 text-sm animate-pulse">
                  Debes aceptar los términos para continuar
                </p>
              )}
            </div>

            <button
              onClick={handleLogin}
              disabled={!acceptedTerms || loading}
              className={`inline-flex items-center gap-3 px-8 py-4 rounded-xl font-bold text-lg transform transition-all shadow-2xl ${
                acceptedTerms && !loading
                  ? 'bg-[#5865F2] text-white hover:bg-[#4752C4] hover:scale-105'
                  : 'bg-gray-500 text-gray-300 cursor-not-allowed opacity-50'
              }`}
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037 19.736 19.736 0 0 0-4.885 1.515.069.069 0 0 0-.032.027C.533 9.048-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.196.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
              </svg>
              {loading ? 'Conectando...' : 'Iniciar Sesión con Discord'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}