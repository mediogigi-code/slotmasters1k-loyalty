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
      setMessage('❌ Error al realizar apuesta');
    } finally {
      setIsPlacingBet(false);
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Cargando...</div>
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 mb-8 border border-white/20">
          <div className="flex items-center gap-6 mb-4">
            <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-blue-400 flex-shrink-0">
              <Image 
                src="/avatar.png" 
                alt="Avatar"
                width={96}
                height={96}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">
                ¡Bienvenido, {userData?.discord_username || session.user?.name || 'Usuario'}!
              </h1>
              <p className="text-yellow-400 font-bold text-xl">
                🚀 CONTROL DE APUESTAS ACTIVADO - VERSIÓN 2026
              </p>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-blue-600 rounded-2xl p-6">
            <div className="text-white/80 text-sm mb-2">Mis Puntos (Balance Neto)</div>
            <div className="text-4xl font-bold text-white">{userData?.points_balance || 0}</div>
          </div>
          <div className="bg-purple-600 rounded-2xl p-6">
            <div className="text-white/80 text-sm mb-2">Estado</div>
            <div className="text-2xl font-bold text-white">{userData?.is_subscriber ? '⭐ VIP' : '👤 Normal'}</div>
          </div>
          <div className="bg-green-600 rounded-2xl p-6">
            <div className="text-white/80 text-sm mb-2">Usuario Kick (Ingresos)</div>
            <div className="text-2xl font-bold text-white">{userData?.kick_username || 'No vinculado'}</div>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 mb-8 border border-white/20">
          <h2 className="text-3xl font-bold text-white mb-6">🎲 Apuestas en Vivo</h2>
          {currentRound && currentRound.status === 'open' ? (
            <div>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <button
                  onClick={() => placeBet('A')}
                  disabled={isPlacingBet || (userData?.points_balance || 0) < 10}
                  className="bg-red-500 hover:bg-red-600 text-white font-bold text-2xl py-12 rounded-xl transition-all transform hover:scale-105 disabled:opacity-50"
                >
                  🅰️ OPCIÓN A
                  <div className="text-sm font-normal mt-2">{currentRound.totalA || 0} pts en bote</div>
                </button>
                <button
                  onClick={() => placeBet('B')}
                  disabled={isPlacingBet || (userData?.points_balance || 0) < 10}
                  className="bg-blue-500 hover:bg-blue-600 text-white font-bold text-2xl py-12 rounded-xl transition-all transform hover:scale-105 disabled:opacity-50"
                >
                  🅱️ OPCIÓN B
                  <div className="text-sm font-normal mt-2">{currentRound.totalB || 0} pts en bote</div>
                </button>
              </div>
              <div className="mb-6">
                <label className="text-white text-sm mb-2 block">Cantidad a apostar (Gastos):</label>
                <input
                  type="number"
                  value={betAmount}
                  onChange={(e) => setBetAmount(Number(e.target.value))}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white text-lg"
                  disabled={isPlacingBet}
                />
              </div>
              {message && (
                <div className={`p-4 rounded-xl mb-4 ${message.includes('✅') ? 'bg-green-500/20 text-green-200' : 'bg-red-500/20 text-red-200'}`}>
                  {message}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-white/60 text-xl">⏳ Esperando a que el streamer inicie ronda...</div>
          )}
        </div>
      </div>
    </div>
  );
}
