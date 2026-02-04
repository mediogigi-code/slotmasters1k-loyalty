'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Image from 'next/image';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [userData, setUserData] = useState(null);
  const [currentRound, setCurrentRound] = useState(null);
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

  async function placeBet(option) {
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
            {/* Avatar */}
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
            
            {/* Nombre y subtítulo */}
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">
                ¡Bienvenido, {userData?.discord_username || session.user?.name || 'Usuario'}!
              </h1>
              <p className="text-blue-200">Panel de Usuario - SlotMasters1K</p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {/* Puntos */}
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 shadow-2xl">
            <div className="text-white/80 text-sm mb-2">Mis Puntos</div>
            <div className="text-4xl font-bold text-white mb-2">
              {userData?.points_balance || 0}
            </div>
            <div className="text-white/60 text-xs">Puntos disponibles</div>
          </div>

          {/* Estado */}
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 shadow-2xl">
            <div className="text-white/80 text-sm mb-2">Estado</div>
            <div className="text-2xl font-bold text-white mb-2">
              {userData?.is_subscriber ? '⭐ VIP' : '👤 Normal'}
            </div>
            <div className="text-white/60 text-xs">
              {userData?.is_subscriber ? 'Multiplicador x2' : 'Sin beneficios'}
            </div>
          </div>

          {/* Usuario Kick */}
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 shadow-2xl">
            <div className="text-white/80 text-sm mb-2">Usuario Kick</div>
            <div className="text-2xl font-bold text-white mb-2">
              {userData?.kick_username || 'No vinculado'}
            </div>
            <div className="text-white/60 text-xs">Nickname</div>
          </div>
        </div>

        {/* Sección de Apuestas */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 mb-8 border border-white/20">
          <h2 className="text-3xl font-bold text-white mb-6">🎲 Apuestas en Vivo</h2>

          {currentRound ? (
            currentRound.status === 'open' ? (
              <div>
                {/* Botones A/B */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <button
                    onClick={() => placeBet('A')}
                    disabled={isPlacingBet || (userData?.points_balance || 0) < 10}
                    className="bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold text-2xl py-12 rounded-xl shadow-2xl transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    🅰️ OPCIÓN A
                    <div className="text-sm font-normal mt-2">
                      {currentRound.totalA || 0} puntos apostados
                    </div>
                  </button>

                  <button
                    onClick={() => placeBet('B')}
                    disabled={isPlacingBet || (userData?.points_balance || 0) < 10}
                    className="bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold text-2xl py-12 rounded-xl shadow-2xl transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    🅱️ OPCIÓN B
                    <div className="text-sm font-normal mt-2">
                      {currentRound.totalB || 0} puntos apostados
                    </div>
                  </button>
                </div>

                {/* Input de cantidad */}
                <div className="mb-6">
                  <label className="text-white text-sm mb-2 block">Cantidad a apostar:</label>
                  <input
                    type="number"
                    value={betAmount}
                    onChange={(e) => setBetAmount(Number(e.target.value))}
                    min="10"
                    max={userData?.points_balance || 0}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white text-lg focus:outline-none focus:border-blue-500"
                    placeholder="Mínimo 10 puntos"
                    disabled={isPlacingBet}
                  />
                  <div className="text-white/60 text-sm mt-2">
                    Mínimo: 10 pts | Disponible: {userData?.points_balance || 0} pts
                  </div>
                </div>

                {/* Mensaje */}
                {message && (
                  <div className={`p-4 rounded-xl mb-4 ${message.includes('✅') ? 'bg-green-500/20 text-green-200' : 'bg-red-500/20 text-red-200'}`}>
                    {message}
                  </div>
                )}

                {/* Bote Total */}
                <div className="bg-white/5 rounded-xl p-4 text-center">
                  <div className="text-white/60 text-sm">BOTE TOTAL</div>
                  <div className="text-3xl font-bold text-yellow-400">
                    {(currentRound.totalA || 0) + (currentRound.totalB || 0)} pts
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🔒</div>
                <div className="text-2xl font-bold text-white mb-2">
                  Apuestas Cerradas
                </div>
                <div className="text-white/60">
                  Esperando resultado...
                </div>
              </div>
            )
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">⏳</div>
              <div className="text-2xl font-bold text-white mb-2">
                No hay ronda activa
              </div>
              <div className="text-white/60">
                Espera a que el streamer inicie la siguiente ronda
              </div>
            </div>
          )}
        </div>

        {/* Botones de acción */}
        <div className="grid md:grid-cols-3 gap-4">
          <button
            onClick={() => window.open('https://slotmasters1k.net/', '_blank')}
            className="bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white font-bold py-4 rounded-xl shadow-xl transition-all"
          >
            🌐 Ir a SlotMasters1K
          </button>

          <button
            onClick={() => router.push('/tienda')}
            className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white font-bold py-4 rounded-xl shadow-xl transition-all"
          >
            🛒 Ir a la Tienda
          </button>

          <button
            onClick={() => router.push('/')}
            className="bg-white/10 hover:bg-white/20 text-white font-bold py-4 rounded-xl border border-white/20 transition-all"
          >
            🏠 Volver al Inicio
          </button>
        </div>
      </div>
    </div>
  );
}
