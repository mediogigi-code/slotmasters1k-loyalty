import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    // Obtener ronda actual (última ronda con estado 'open' o 'closed')
    const { data: round, error } = await supabase
      .from('bet_rounds')
      .select('*')
      .in('status', ['open', 'closed'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    if (!round) {
      return NextResponse.json(
        { message: 'No hay ronda activa' },
        { status: 404 }
      );
    }

    // Obtener apuestas de la ronda actual
    const { data: bets, error: betsError } = await supabase
      .from('bets')
      .select('option, amount')
      .eq('round_id', round.id);

    if (betsError) throw betsError;

    // Calcular totales
    const totalA = bets?.filter(b => b.option === 'A').reduce((sum, b) => sum + b.amount, 0) || 0;
    const totalB = bets?.filter(b => b.option === 'B').reduce((sum, b) => sum + b.amount, 0) || 0;

    return NextResponse.json({
      round: {
        id: round.id,
        status: round.status,
        winner: round.winner,
        totalA,
        totalB,
        created_at: round.created_at,
        resolved_at: round.resolved_at
      }
    });

  } catch (error) {
    console.error('Error en /api/bets/current:', error);
    return NextResponse.json(
      { error: 'Error al obtener ronda actual' },
      { status: 500 }
    );
  }
}
