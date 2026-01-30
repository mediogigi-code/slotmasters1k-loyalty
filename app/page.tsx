'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [loading, setLoading] = useState(true); // Empezamos cargando para revisar la sesión
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    // 1. Revisar si hay una sesión activa al cargar la página
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);
        // Si quieres que vaya directo al dashboard al estar logueado, descomenta la siguiente línea:
        // router.push('/dashboard'); 
      }
      setLoading(false);
    };
    checkUser();
  }, [router]);

  const handleLogin = async () => {
    if (!acceptedTerms) {
      setShowWarning(true);
      return;
    }

    setLoading(true);
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://dazzling-quietude-production-65d6.up.railway.app';

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'discord',
      options: {
        redirectTo: `${origin}/auth/callback`,
      },
    });

    if (error) {
      console.error('Error:', error.message);
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    router.refresh();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-purple-900">
      <div className="relative overflow-hidden">
        <div className="relative max-w-7xl mx-auto px-4 py-20">
          <div className="text-center mb-16">
            <h1 className="text-5xl font-bold text-white mb-6">SlotMasters1K</h1>

            {user ? (
              // --- VISTA CUANDO EL USUARIO YA ESTÁ LOGUEADO ---
              <div className="bg-white/10 p-8 rounded-2xl border border-white/20 backdrop-blur-md inline-block">
                <img 
                  src={user.user_metadata.avatar_url} 
                  alt="Avatar" 
                  className="w-20 h-20 rounded-full mx-auto mb-4 border-2 border-blue-400"
                />
                <h2 className="text-2xl font-bold text-white mb-2">¡Bienvenido, {user.user_metadata.full_name}!</h2>
                <p className="text-blue-200 mb-6">Ya estás autenticado correctamente.</p>
                <div className="flex gap-4 justify-center">
                  <button 
                    onClick={() => router.push('/dashboard')}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-bold transition-all"
                  >
                    Ir al Dashboard
                  </button>
                  <button 
                    onClick={handleLogout}
                    className="bg-red-500/20 hover:bg-red-500/40 text-red-200 px-6 py-2 rounded-lg font-bold transition-all"
                  >
                    Cerrar Sesión
                  </button>
                </div>
              </div>
            ) : (
              // --- VISTA DE REGISTRO/LOGIN ---
              <div className="max-w-md mx-auto">
                <div className="mb-6">
                  <label className="flex items-start gap-3 cursor-pointer bg-white/10 p-4 rounded-xl border border-white/20">
                    <input
                      type="checkbox"
                      checked={acceptedTerms}
                      onChange={(e) => setAcceptedTerms(e.target.checked)}
                      className="mt-1"
                    />
                    <span className="text-sm text-blue-100 text-left">Acepto los términos y soy mayor de 18 años.</span>
                  </label>
                  {showWarning && <p className="text-red-400 text-sm mt-2 font-bold">Debes aceptar los términos</p>}
                </div>

                <button
                  onClick={handleLogin}
                  disabled={loading}
                  className="bg-[#5865F2] hover:scale-105 text-white px-8 py-4 rounded-xl font-bold transition-all flex items-center gap-3 mx-auto"
                >
                  Iniciar Sesión con Discord
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}