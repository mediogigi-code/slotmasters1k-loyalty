'use client';

import React, { useState } from 'react';
import { Trophy, Zap, Gift, TrendingUp, Users, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showWarning, setShowWarning] = useState(false);

  const handleLogin = () => {
    if (!acceptedTerms) {
      setShowWarning(true);
      return;
    }

    // Redirigir a Kick OAuth
    const kickClientId = process.env.NEXT_PUBLIC_KICK_CLIENT_ID;
    const redirectUri = process.env.NEXT_PUBLIC_KICK_REDIRECT_URI;
    
    const authUrl = `https://kick.com/oauth2/authorize?` +
      `client_id=${kickClientId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri!)}&` +
      `response_type=code&` +
      `scope=user:read`;
    
    window.location.href = authUrl;
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
            
            <button
              onClick={handleLogin}
              disabled={!acceptedTerms}
              className={`inline-flex items-center gap-3 px-8 py-4 rounded-xl font-bold text-lg transform transition-all shadow-2xl ${
                acceptedTerms
                  ? 'bg-white text-blue-900 hover:bg-blue-50 hover:scale-105'
                  : 'bg-gray-400 text-gray-600 cursor-not-allowed opacity-50'
              }`}
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"/>
              </svg>
              Iniciar Sesión con Kick
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
                { step: '1', title: 'Conecta con Kick', desc: 'Inicia sesión con tu cuenta de Kick' },
                { step: '2', title: 'Gana Puntos', desc: 'Mira streams y participa en apuestas' },
                { step: '3', title: 'Canjea Premios', desc: 'Cambia puntos por recompensas reales' }
              ].map((item) => (
                <div key={item.step} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
                  <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto mb-4">
                    {item.step}
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
                  <p className="text-sm text-blue-200">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Footer Legal */}
          <div className="mt-16 pt-8 border-t border-white/20">
            <div className="text-center space-y-4">
              <div className="flex justify-center gap-6 text-sm text-blue-200">
                <Link href="/terminos" className="hover:text-white transition-colors">
                  Términos y Condiciones
                </Link>
                <span>•</span>
                <a 
                  href="https://www.jugarbien.es" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  Juego Responsable
                </a>
                <span>•</span>
                <a href="mailto:soporte@slotmasters1k.net" className="hover:text-white transition-colors">
                  Contacto
                </a>
              </div>
              <p className="text-xs text-blue-300">
                © 2025 SlotMasters1K. Los puntos no tienen valor monetario real. +18 años.
              </p>
              <p className="text-xs text-blue-300">
                El juego puede crear adicción. Juega de forma responsable.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
