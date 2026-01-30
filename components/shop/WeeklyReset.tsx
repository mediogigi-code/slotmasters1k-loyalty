'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Calendar, Clock } from 'lucide-react';

export function WeeklyReset() {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const nextMonday = new Date(now);
      
      // Calcular próximo lunes a las 00:00
      const daysUntilMonday = (8 - now.getDay()) % 7 || 7;
      nextMonday.setDate(now.getDate() + daysUntilMonday);
      nextMonday.setHours(0, 0, 0, 0);
      
      const diff = nextMonday.getTime() - now.getTime();
      
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      
      return `${days}d ${hours}h ${minutes}m`;
    };

    setTimeLeft(calculateTimeLeft());
    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 60000); // Actualizar cada minuto

    return () => clearInterval(interval);
  }, []);

  return (
    <Card className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/20 rounded-full">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-purple-100">Stock Semanal</p>
              <p className="text-xl font-bold">Se resetea en</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-lg">
            <Clock className="w-5 h-5" />
            <span className="text-lg font-mono font-bold">
              {timeLeft}
            </span>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-white/20">
          <p className="text-sm text-purple-100">
            El stock de recompensas se renueva cada lunes a las 00:00h
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
