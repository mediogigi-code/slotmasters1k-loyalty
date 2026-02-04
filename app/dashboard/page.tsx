'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Image from 'next/image';

export const dynamic = 'force-dynamic';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [userData, setUserData] = useState<any>(null);
  const [currentRound, setCurrentRound] = useState<any>(null);
  const [betAmount, setBetAmount] = useState(50);
  const [isPlacingBet, setIsPlacingBet] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user?.id) {
      loadUserData();
      loadCurrentRound();
    }
  }, [session]);

  async function loadUserData() {
    if (!session?.user?.id) return;
    try {
      const res = await fetch(`/api/user/${session.user.id}`);
      const data = await res.json();
      setUserData(data);
    } catch (error) {
      console.error('Error cargando datos:', error);
    }
  }

  async function loadCurrentRound() {
    try {
      const res = await fetch('/api/bets/current');
      if (res.ok) {
        const data = await res.json();
        setCurrentRound(data.round);
      } else {
        setCurrentRound(null);
      }
    } catch (error) {
      console.error('Error cargando ronda:', error);
      setCurrentRound(null);
    }
  }

  async function placeBet(option: 'A' | 'B') {
    if (!session?.user?.id || !currentRound) return;
    setIsPlacingBet(true);
    setMessage('');
    try {
      const res = await fetch('/api/bets/place', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: session.user.id,
          option,
          amount: betAmount
        })
      });
      const data = await res.json();
      if (data.success) {
        setMessage(`✅ ${data.message}`);
        await loadUserData();
        await loadCurrentRound();
      } else {
        setMessage(`❌ ${data.error}`);
      }
    } catch (error) {
      console.error('Error en apuesta:', error);
      setMessage('❌ Error al realizar apuesta');
    } finally {
      setIsPlacingBet(false);
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Cargando...</div>
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header con Avatar */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 mb-8 border border-white/20">
          <div className="flex items-center gap-6 mb-4">
            <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-blue-400 shadow-2xl flex-shrink-0">
              <Image 
                src="/avatar.png" 
                alt="Avatar SlotMasters1K"
                width={96}
                height={96}
                className="w-full h-full object-cover"
                priority
              />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">
                ¡Bienvenido, {userData?.discord_username || session.user?.name || 'Usuario'}!
              </h1>
              {/* ESTO ES PARA PROBAR SI ACTUALIZA */}
              <p className="text-yellow-400 font-bold text-xl animate-pulse">
                🚀 CONTROL DE APUESTAS ACTIVADO - VERSIÓN 2026
              </p>
              <p className="text-blue-200 mt-2">Panel de Usuario - SlotMasters1K</p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 shadow-2xl">
            <div className="text-white/80 text-sm mb-2">Mis Puntos (Balance Neto)</div>
            <div className="text-4xl font-bold text-white mb-2">
              {userData?.points_balance || 0}
            </div>
            <div className="text-white/60 text-xs">Puntos disponibles para jugar</div>
          </div>
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 shadow-2xl">
