'use client';

import React, { useState, useEffect } from 'react';
import { PointsCard } from '@/components/dashboard/PointsCard';
import { QuickStats } from '@/components/dashboard/QuickStats';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { supabase } from '@/lib/supabase';
import type { User, Transaction } from '@/types';
import { Menu, LogOut, Store, Home, Trophy } from 'lucide-react';
import Link from 'next/link';

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState({
    totalEarned: 0,
    totalBets: 0,
    totalRedeemed: 0,
    winRate: 0
  });
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  async function loadUserData() {
    try {
      // Obtener usuario autenticado
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (!authUser) {
        window.location.href = '/';
        return;
      }

      // Obtener datos del usuario
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (userError) throw userError;
      setUser(userData);

      // Obtener transacciones recientes
      const { data: txData, error: txError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', authUser.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (txError) throw txError;
      setTransactions(txData || []);

      // Calcular estadísticas
      const earned = txData?.filter(t => t.type === 'earn').reduce((sum, t) => sum + t.amount, 0) || 0;
      const redeemed = txData?.filter(t => t.type === 'redeem').reduce((sum, t) => sum + t.amount, 0) || 0;
      const bets = txData?.filter(t => t.type === 'bet_win' || t.type === 'bet_loss').length || 0;
      const wins = txData?.filter(t => t.type === 'bet_win').length || 0;

      setStats({
        totalEarned: earned,
        totalBets: bets,
        totalRedeemed: redeemed,
        winRate: bets > 0 ? Math.round((wins / bets) * 100) : 0
      });

    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = '/';
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
                SM
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">SlotMasters1K</h1>
                <p className="text-xs text-gray-500">Comunidad</p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              <Link href="/dashboard" className="flex items-center gap-2 text-blue-600 font-medium">
                <Home className="w-5 h-5" />
                Dashboard
              </Link>
              <Link href="/tienda" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
                <Store className="w-5 h-5" />
                Tienda
              </Link>
              <Link href="/apuestas" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
                <Trophy className="w-5 h-5" />
                Apuestas
              </Link>
            </nav>

            {/* User Menu */}
            <div className="flex items-center gap-4">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-gray-900">{user.kick_username}</p>
                <p className="text-xs text-gray-500">{user.points_balance.toLocaleString()} pts</p>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-gray-600 hover:text-red-600 transition-colors"
              >
                <LogOut className="w-5 h-5" />
              </button>
              <button
                className="md:hidden p-2"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                <Menu className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-gray-200">
              <nav className="flex flex-col gap-2">
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2 px-4 py-2 text-blue-600 bg-blue-50 rounded-lg"
                >
                  <Home className="w-5 h-5" />
                  Dashboard
                </Link>
                <Link
                  href="/tienda"
                  className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  <Store className="w-5 h-5" />
                  Tienda
                </Link>
                <Link
                  href="/apuestas"
                  className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  <Trophy className="w-5 h-5" />
                  Apuestas
                </Link>
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Points Card */}
          <PointsCard user={user} recentEarnings={stats.totalEarned} />

          {/* Quick Stats */}
          <QuickStats
            totalEarned={stats.totalEarned}
            totalBets={stats.totalBets}
            totalRedeemed={stats.totalRedeemed}
            winRate={stats.winRate}
          />

          {/* Recent Activity */}
          <RecentActivity transactions={transactions} />

          {/* Info Cards */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
              <h3 className="text-lg font-bold text-blue-900 mb-2">
                💎 Cómo ganar puntos
              </h3>
              <ul className="space-y-2 text-sm text-blue-800">
                <li>• <strong>5 puntos base</strong> cada 10 minutos viendo el stream</li>
                <li>• <strong>+2 puntos</strong> si escribiste en chat recientemente</li>
                <li>• <strong>x2 multiplicador</strong> si eres suscriptor</li>
                <li>• <strong>Gana en apuestas</strong> durante el stream</li>
              </ul>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-xl p-6">
              <h3 className="text-lg font-bold text-purple-900 mb-2">
                🎁 Recompensas Disponibles
              </h3>
              <ul className="space-y-2 text-sm text-purple-800">
                <li>• Tarjetas de regalo desde 1€</li>
                <li>• Retiros en USDT a tu wallet</li>
                <li>• Stock limitado semanal (reset lunes)</li>
                <li>• Bonos CPA por depósitos verificados</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
