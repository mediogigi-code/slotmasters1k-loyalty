'use client';

import React, { useState, useEffect } from 'react';
import { RewardCard } from '@/components/shop/RewardCard';
import { WeeklyReset } from '@/components/shop/WeeklyReset';
import { supabase } from '@/lib/supabase';
import { getCurrentWeek } from '@/lib/utils';
import type { User, Reward } from '@/types';
import { ArrowLeft, Wallet } from 'lucide-react';
import Link from 'next/link';

export default function ShopPage() {
  const [user, setUser] = useState<User | null>(null);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        window.location.href = '/';
        return;
      }

      // Cargar usuario
      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      setUser(userData);
      setWalletAddress(userData?.wallet_address || '');

      // Cargar recompensas de la semana actual
      const { week, year } = getCurrentWeek();
      const { data: rewardsData } = await supabase
        .from('rewards_stock')
        .select('*')
        .eq('week_number', week)
        .eq('year', year)
        .eq('is_active', true)
        .order('value_eur', { ascending: true });

      setRewards(rewardsData || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleRedeem(reward: Reward) {
    if (!user) return;

    // Si es USDT y no tiene wallet, mostrar modal
    if (reward.delivery_type === 'USDT' && !user.wallet_address) {
      setShowWalletModal(true);
      return;
    }

    setProcessing(true);

    try {
      // Verificar que tenga suficientes puntos
      if (user.points_balance < reward.points_cost) {
        alert('No tienes suficientes puntos');
        return;
      }

      // Verificar stock
      if (reward.current_stock <= 0) {
        alert('Esta recompensa está agotada');
        return;
      }

      // Crear withdrawal
      const { error: withdrawalError } = await supabase
        .from('withdrawals')
        .insert({
          user_id: user.id,
          reward_id: reward.id,
          points_spent: reward.points_cost,
          wallet_address: reward.delivery_type === 'USDT' ? user.wallet_address : null,
          status: 'pending'
        });

      if (withdrawalError) throw withdrawalError;

      // Descontar puntos
      const newBalance = user.points_balance - reward.points_cost;
      const { error: updateError } = await supabase
        .from('users')
        .update({ points_balance: newBalance })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Crear transacción
      await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          type: 'redeem',
          amount: reward.points_cost,
          description: `Canje: ${reward.reward_name}`,
          status: 'completed'
        });

      // Reducir stock
      await supabase
        .from('rewards_stock')
        .update({ current_stock: reward.current_stock - 1 })
        .eq('id', reward.id);

      alert('¡Canje exitoso! Tu solicitud está pendiente de procesamiento.');
      
      // Recargar datos
      loadData();

    } catch (error) {
      console.error('Error redeeming reward:', error);
      alert('Error al procesar el canje. Inténtalo de nuevo.');
    } finally {
      setProcessing(false);
    }
  }

  async function saveWallet() {
    if (!user) return;

    // Validación básica de wallet
    const isValid = /^(0x[a-fA-F0-9]{40}|T[a-zA-Z0-9]{33})$/.test(walletAddress);
    if (!isValid) {
      alert('Dirección de wallet inválida. Debe ser formato ERC20 (0x...) o TRC20 (T...)');
      return;
    }

    try {
      const { error } = await supabase
        .from('users')
        .update({ wallet_address: walletAddress })
        .eq('id', user.id);

      if (error) throw error;

      setUser({ ...user, wallet_address: walletAddress });
      setShowWalletModal(false);
      alert('Wallet guardada correctamente');
    } catch (error) {
      console.error('Error saving wallet:', error);
      alert('Error al guardar wallet');
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard"
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Tienda de Recompensas</h1>
                <p className="text-sm text-gray-600">
                  Tienes {user?.points_balance.toLocaleString('es-ES')} puntos disponibles
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowWalletModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Wallet className="w-4 h-4" />
              {user?.wallet_address ? 'Editar Wallet' : 'Configurar Wallet'}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Weekly Reset Banner */}
          <WeeklyReset />

          {/* Info Banner */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
            <h3 className="text-lg font-bold text-yellow-900 mb-2">
              ℹ️ Información Importante
            </h3>
            <ul className="space-y-1 text-sm text-yellow-800">
              <li>• El stock se resetea cada <strong>lunes a las 00:00h</strong></li>
              <li>• Tarjetas Mini, Bronze y Silver se entregan como <strong>código digital</strong></li>
              <li>• Tarjetas Gold y Epic se envían en <strong>USDT a tu wallet</strong></li>
              <li>• Los canjes pueden tardar hasta 24h en procesarse</li>
              <li>• Presupuesto semanal limitado: <strong>200€</strong></li>
            </ul>
          </div>

          {/* Rewards Grid */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-6">Recompensas Disponibles</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {rewards.map((reward) => (
                <RewardCard
                  key={reward.id}
                  reward={reward}
                  userPoints={user?.points_balance || 0}
                  onRedeem={handleRedeem}
                  isProcessing={processing}
                />
              ))}
            </div>

            {rewards.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <p className="text-lg">No hay recompensas disponibles esta semana</p>
                <p className="text-sm mt-2">El stock se renueva cada lunes</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Wallet Modal */}
      {showWalletModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Configurar Wallet USDT
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Introduce tu dirección de wallet USDT (ERC20 o TRC20) para recibir recompensas en criptomonedas.
            </p>
            
            <input
              type="text"
              value={walletAddress}
              onChange={(e) => setWalletAddress(e.target.value)}
              placeholder="0x... o T..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowWalletModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={saveWallet}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
