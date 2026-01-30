'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Menu, LogOut, Store, Home, Trophy, Star, Zap, Activity } from 'lucide-react';
import Link from 'next/link';

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserData();
  }, []);

  async function loadUserData() {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        window.location.href = '/';
        return;
      }

      // Intentar obtener datos de la tabla 'users'
      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      // Si no existe en la tabla aún, usamos los datos de Auth de Discord
      setUser(userData || {
        kick_username: authUser.user_metadata.full_name,
        points_balance: 0,
        avatar_url: authUser.user_metadata.avatar_url
      });

    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = '/';
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header Simplificado */}
      <header className="bg-gray-900 border-b border-gray-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded shadow-lg shadow-blue-500/20 flex items-center justify-center font-bold">SM</div>
            <span className="font-bold hidden sm:block">SlotMasters1K</span>
          </div>
          
          <nav className="flex items-center gap-4 sm:gap-8">
            <Link href="/" className="text-blue-400 flex items-center gap-1 text-sm"><Home size={18}/> <span className="hidden sm:inline">Inicio</span></Link>
            <Link href="#" className="text-gray-400 flex items-center gap-1 text-sm"><Store size={18}/> <span className="hidden sm:inline">Tienda</span></Link>
            <button onClick={handleLogout} className="text-gray-400 hover:text-red-400"><LogOut size={18}/></button>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid gap-6">
          
          {/* Tarjeta de Puntos Principal */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-8 shadow-xl shadow-blue-900/20">
            <div className="flex items-center gap-4 mb-4">
               <img src={user?.avatar_url || user?.kick_avatar_url} className="w-16 h-16 rounded-full border-2 border-white/20" alt="avatar" />
               <div>
                 <h2 className="text-2xl font-bold">¡Hola, {user?.kick_username}!</h2>
                 <p className="text-blue-100 opacity-80 text-sm">Nivel de Lealtad: Bronce</p>
               </div>
            </div>
            <div className="mt-6 bg-white/10 rounded-xl p-4 inline-block">
              <p className="text-xs uppercase tracking-wider text-blue-100">Saldo Disponible</p>
              <p className="text-4xl font-black">{user?.points_balance?.toLocaleString() || 0} <span className="text-lg font-normal">PTS</span></p>
            </div>
          </div>

          {/* Estadísticas Rápidas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Ganados', val: '0', icon: Star, color: 'text-yellow-400' },
              { label: 'Apuestas', val: '0', icon: Trophy, color: 'text-purple-400' },
              { label: 'Canjeados', val: '0', icon: Zap, color: 'text-green-400' },
              { label: 'Win Rate', val: '0%', icon: Activity, color: 'text-blue-400' },
            ].map((s, i) => (
              <div key={i} className="bg-gray-900 border border-gray-800 p-4 rounded-xl">
                <s.icon className={`${s.color} mb-2`} size={20} />
                <p className="text-gray-500 text-xs uppercase">{s.label}</p>
                <p className="text-xl font-bold">{s.val}</p>
              </div>
            ))}
          </div>

          {/* Info Section */}
          <div className="grid md:grid-cols-2 gap-6 mt-4">
            <div className="bg-blue-900/20 border border-blue-500/20 p-6 rounded-2xl">
              <h3 className="text-blue-400 font-bold mb-4 flex items-center gap-2"><Star size={20}/> Cómo ganar</h3>
              <ul className="space-y-3 text-sm text-gray-300">
                <li className="flex justify-between"><span>Viendo el stream</span> <span className="text-white font-mono">5 pts / 10m</span></li>
                <li className="flex justify-between"><span>Escribir en chat</span> <span className="text-white font-mono">+2 pts</span></li>
                <li className="flex justify-between"><span>Suscriptores</span> <span className="text-white font-mono">x2 MULTI</span></li>
              </ul>
            </div>
            <div className="bg-purple-900/20 border border-purple-500/20 p-6 rounded-2xl">
              <h3 className="text-purple-400 font-bold mb-4 flex items-center gap-2"><Trophy size={20}/> Recompensas</h3>
              <p className="text-sm text-gray-300 mb-4">Canjea tus puntos por premios reales cada semana.</p>
              <button className="w-full bg-purple-600 hover:bg-purple-500 py-2 rounded-lg font-bold transition-colors">Ver Tienda</button>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
