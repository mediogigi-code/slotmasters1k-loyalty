import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { user_id, option, amount } = await request.json();

    // Validaciones
    if (!user_id || !option || !amount) {
      return NextResponse.json(
        { error: 'Faltan datos requeridos' },
        { status: 400 }
      );
    }

    if (!['A', 'B'].includes(option)) {
      return NextResponse.json(
        { error: 'Opción inválida. Debe ser A o B' },
        { status: 400 }
      );
    }

    if (amount < 10) {
      return NextResponse.json(
        { error: 'Apuesta mínima: 10 puntos' },
        { status: 400 }
      );
    }

    // Obtener usuario
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('points_balance')
      .eq('id', user_id)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    if (user.points_balance < amount) {
      return NextResponse.json(
        { error: 'Puntos insuficientes' },
        { status: 400 }
      );
    }

    // Obtener ronda activa
    const { data: round, error: roundError } = await supabase
      .from('bet_rounds')
      .select('*')
      .eq('status', 'open')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (roundError || !round) {
      return NextResponse.json(
        { error: 'No hay ronda activa' },
        { status: 404 }
      );
    }

    // Verificar si ya apostó en esta ronda
    const { data: existingBet } = await supabase
      .from('bets')
      .select('id')
      .eq('round_id', round.id)
      .eq('user_id', user_id)
      .single();

    if (existingBet) {
      return NextResponse.json(
        { error: 'Ya apostaste en esta ronda' },
        { status: 400 }
      );
    }

    // Restar puntos del usuario
    const { error: updateError } = await supabase
      .from('users')
      .update({ points_balance: user.points_balance - amount })
      .eq('id', user_id);

    if (updateError) throw updateError;

    // Crear apuesta
    const { data: bet, error: betError } = await supabase
      .from('bets')
      .insert({
        round_id: round.id,
        user_id,
        option,
        amount
      })
      .select()
      .single();

    if (betError) throw betError;

    return NextResponse.json({
      success: true,
      bet,
      new_balance: user.points_balance - amount,
      message: `Apostaste ${amount} puntos a la opción ${option}`
    });

  } catch (error) {
    console.error('Error en /api/bets/place:', error);
    return NextResponse.json(
      { error: 'Error al realizar apuesta' },
      { status: 500 }
    );
  }
}
