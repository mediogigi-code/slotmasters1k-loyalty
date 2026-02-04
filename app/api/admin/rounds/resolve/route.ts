import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { round_id, winner } = await request.json();

    // TODO: Añadir autenticación de admin aquí

    if (!round_id || !winner) {
      return NextResponse.json(
        { error: 'Faltan datos requeridos' },
        { status: 400 }
      );
    }

    if (!['A', 'B'].includes(winner)) {
      return NextResponse.json(
        { error: 'Ganador inválido. Debe ser A o B' },
        { status: 400 }
      );
    }

    // Obtener ronda
    const { data: round, error: roundError } = await supabase
      .from('bet_rounds')
      .select('*')
      .eq('id', round_id)
      .single();

    if (roundError || !round) {
      return NextResponse.json(
        { error: 'Ronda no encontrada' },
        { status: 404 }
      );
    }

    if (round.status === 'resolved') {
      return NextResponse.json(
        { error: 'Ronda ya resuelta' },
        { status: 400 }
      );
    }

    // Obtener todas las apuestas de la ronda
    const { data: allBets, error: betsError } = await supabase
      .from('bets')
      .select('*, users(points_balance)')
      .eq('round_id', round_id);

    if (betsError) throw betsError;

    if (!allBets || allBets.length === 0) {
      return NextResponse.json(
        { error: 'No hay apuestas en esta ronda' },
        { status: 400 }
      );
    }

    // Separar ganadores y perdedores
    const winners = allBets.filter(bet => bet.option === winner);
    const losers = allBets.filter(bet => bet.option !== winner);

    const totalWinners = winners.reduce((sum, bet) => sum + bet.amount, 0);
    const totalLosers = losers.reduce((sum, bet) => sum + bet.amount, 0);

    // Si no hay ganadores, devolver apuestas
    if (winners.length === 0) {
      for (const bet of allBets) {
        await supabase
          .from('users')
          .update({ 
            points_balance: (bet.users as any).points_balance + bet.amount 
          })
          .eq('id', bet.user_id);

        await supabase
          .from('bets')
          .update({ 
            won: null, 
            payout: bet.amount 
          })
          .eq('id', bet.id);
      }

      await supabase
        .from('bet_rounds')
        .update({ 
          status: 'resolved', 
          winner,
          resolved_at: new Date().toISOString() 
        })
        .eq('id', round_id);

      return NextResponse.json({
        success: true,
        message: 'No hubo ganadores. Apuestas devueltas.',
        winner,
        total_returned: totalWinners + totalLosers
      });
    }

    // Comisión de la casa (5%)
    const houseCommission = 0.05;
    const houseAmount = Math.floor(totalLosers * houseCommission);
    const availablePot = totalLosers - houseAmount;

    // Calcular ganancias para cada ganador
    for (const bet of winners) {
      // Ganancia proporcional del bote perdedor (después de comisión)
      const proportion = bet.amount / totalWinners;
      const winnings = Math.floor(proportion * availablePot);
      const totalPayout = bet.amount + winnings; // Recupera apuesta + ganancias

      // Actualizar puntos del usuario
      await supabase
        .from('users')
        .update({ 
          points_balance: (bet.users as any).points_balance + totalPayout 
        })
        .eq('id', bet.user_id);

      // Actualizar apuesta
      await supabase
        .from('bets')
        .update({ 
          won: true, 
          payout: totalPayout 
        })
        .eq('id', bet.id);
    }

    // Marcar perdedores
    for (const bet of losers) {
      await supabase
        .from('bets')
        .update({ 
          won: false, 
          payout: 0 
        })
        .eq('id', bet.id);
    }

    // Actualizar ronda como resuelta
    await supabase
      .from('bet_rounds')
      .update({ 
        status: 'resolved', 
        winner,
        total_a: allBets.filter(b => b.option === 'A').reduce((s, b) => s + b.amount, 0),
        total_b: allBets.filter(b => b.option === 'B').reduce((s, b) => s + b.amount, 0),
        resolved_at: new Date().toISOString() 
      })
      .eq('id', round_id);

    return NextResponse.json({
      success: true,
      winner,
      total_winners: winners.length,
      total_losers: losers.length,
      total_pot: totalWinners + totalLosers,
      house_commission: houseAmount,
      total_distributed: totalWinners + availablePot,
      message: `Ronda resuelta. Ganó la opción ${winner}. Casa: ${houseAmount} puntos`
    });

  } catch (error) {
    console.error('Error en /api/admin/rounds/resolve:', error);
    return NextResponse.json(
      { error: 'Error al resolver ronda' },
      { status: 500 }
    );
  }
}
