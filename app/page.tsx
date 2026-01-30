'use client';

import React, { useState } from 'react';
import { Trophy, Zap, Gift, TrendingUp, Users, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
// Importamos la instancia de supabase que ya tienes configurada
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

    // Login con Discord a través de Supabase
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'discord',
      options: {
        // Redirige automáticamente a tu URL de Railway o Localhost
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      console.error('Error al conectar con Discord:', error.message);
      alert('Hubo un problema al conectar con Discord. Revisa la consola.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-purple-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 -left-4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse-slow"></div>
          <div className="absolute top-0 -right-4 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse-slow animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-20 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse-slow animation-delay-4000"></div>
        </div>

        {/* Content */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          {/* Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-3 mb-6">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-white font-bold text-2xl border border-white/30">
                SM
              </div>
            </div>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-6">
              SlotMasters1K
              <span className="block text-blue-300 text-3xl sm:text-4xl mt-2">
                Sistema de Lealtad
              </span>
            </h1>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto mb-8">
              Gana puntos viendo streams, apuesta en vivo y canjea recompensas reales
            </p>

            {/* Advertencia de Juego Responsable */}
            <div className="max-w-2xl mx-auto mb-6">
              <div className="bg-red-500/20 border-2 border-red-300 rounded-xl p-4 backdrop-blur-sm">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-6 h-6 text-red-200 flex-shrink-0 mt-0.5" />
                  <div className="text-left">
                    <p className="text-red-100 font-semibold mb-1">⚠️ Solo para mayores de 18 años</p>
                    <p className="text-red-200 text-sm">
                      El juego puede crear adicción. Juega de forma responsable.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Checkbox de Términos */}
            <div className="max-w-2xl mx-auto mb-6">
              <label className="flex items-start gap-3 cursor-pointer bg-white/10 backdrop-blur-sm rounded-xl p-4 border-2 border-white/20 hover:border-white/40 transition-colors">
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => {
                    setAcceptedTerms(e.target.checked);
                    setShowWarning(false);
                  }}
                  className="mt-1 w-5 h-5 rounded border-white/30 text-blue-600 focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm text-blue-100 text-left">
                  He leído y acepto los{' '}
                  <Link 
                    href="/terminos" 
                    target="_blank"
                    className="text-white font-semibold underline hover:text-blue-200"
                  >
                    términos y condiciones
                  </Link>
                  . Soy mayor de 18 años y entiendo que los puntos no tienen valor monetario real.
                </span>
              </label>
              
              {showWarning && (
                <p className="mt-2 text-red-300 text-sm text-center animate-pulse">
                  Debes aceptar los términos para continuar
                </p>
              )}
            </div>
            
            {/* BOTÓN ACTUALIZADO PARA DISCORD */}
            <button
              onClick={handleLogin}
              disabled={!acceptedTerms || loading}
              className={`inline-flex items-center gap-3 px-8 py-4 rounded-xl font-bold text-lg transform transition-all shadow-2xl ${
                acceptedTerms && !loading
                  ? 'bg-[#5865F2] text-white hover:bg-[#4752C4] hover:scale-105'
                  : 'bg-gray-400 text-gray-600 cursor-not-allowed opacity-50'
              }`}
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037 19.736 19.736 0 0 0-4.885 1.515.069.069 0 0 0-.032.027C.533 9.048-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.196.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
              </svg>
              {loading ? 'Cargando...' : 'Iniciar Sesión con Discord'}
            </button>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {[
              {
                icon: Zap,
                title: 'Minado Automático',
                description: '5 pts cada 10min viendo el stream',
                color: 'from-yellow-500 to-orange-500'
              },
              {
                icon: Trophy,
                title: 'Apuestas en Vivo',
                description: 'Predice resultados y multiplica tus puntos',
                color: 'from-purple-500 to-pink-500'
              },
              {
                icon: Gift,
                title: 'Recompensas Reales',
                description: 'Tarjetas regalo y USDT',
                color: 'from-blue-500 to-cyan-500'
              },
              {
                icon: TrendingUp,
                title: 'Bonus Suscriptor',
                description: 'x2 multiplicador siendo sub',
                color: 'from-green-500 to-emerald-500'
              }
            ].map((feature, i) => (
              <div
                key={i}
                className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6 hover:bg-white/15 transition-all"
              >
                <div className={`w-12 h-12 bg-gradient-to-br ${feature.color} rounded-lg flex items-center justify-center mb-4`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-blue-100">{feature.description}</p>
              </div>
            ))}
          </div>

          {/* Stats */}
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div>
                <Users className="w-8 h-8 text-blue-300 mx-auto mb-2" />
                <p className="text-3xl font-bold text-white">1000+</p>
                <p className="text-sm text-blue-200">Usuarios Activos</p>
              </div>
              <div>
                <Gift className="w-8 h-8 text-purple-300 mx-auto mb-2" />
                <p className="text-3xl font-bold text-white">200€</p>
                <p className="text-sm text-blue-200">Presupuesto Semanal</p>
              </div>
              <div>
                <Trophy className="w-8 h-8 text-yellow-300 mx-auto mb-2" />
                <p className="text-3xl font-bold text-white">24/7</p>
                <p className="text-sm text-blue-200">Sistema Activo</p>
              </div>
            </div>
          </div>

          {/* How it works */}
          <div className="mt-16 text-center">
            <h2 className="text-3xl font-bold text-white mb-8">¿Cómo Funciona?</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { step: '1', title: 'Conecta con Discord', desc: 'Inicia sesión con tu cuenta de Discord' },
                { step: '2', title: 'Gana Puntos', desc: 'Mira streams y participa en apuestas' },
                { step: '3', title: 'Canjea Premios', desc: 'Cambia puntos por recompensas reales' }
              ].map((item) => (
                <div key={item.step} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
                  <div