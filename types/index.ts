// =====================================================
// SLOTMASTERS1K TYPES
// =====================================================

export interface User {
  id: string;
  kick_user_id: string;
  kick_username: string;
  kick_avatar_url?: string;
  wallet_address?: string;
  points_balance: number;
  is_subscriber: boolean;
  last_message_timestamp?: string;
  ip_address?: string;
  created_at: string;
  updated_at: string;
}

export interface Reward {
  id: number;
  reward_name: string;
  value_eur: number;
  points_cost: number;
  initial_stock: number;
  current_stock: number;
  week_number: number;
  year: number;
  delivery_type: 'CODE' | 'USDT';
  is_active: boolean;
  created_at: string;
}

export type TransactionType = 'earn' | 'bet_win' | 'bet_loss' | 'redeem' | 'cpa_bonus';
export type TransactionStatus = 'pending' | 'completed' | 'failed' | 'cancelled';

export interface Transaction {
  id: string;
  user_id: string;
  type: TransactionType;
  amount: number;
  status: TransactionStatus;
  description?: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export type PollStatus = 'open' | 'locked' | 'resolved' | 'cancelled';

export interface Poll {
  id: string;
  title: string;
  option_a: string;
  option_b: string;
  total_bet_a: number;
  total_bet_b: number;
  status: PollStatus;
  winning_option?: 'A' | 'B';
  created_by?: string;
  created_at: string;
  locked_at?: string;
  resolved_at?: string;
}

export interface PollBet {
  id: string;
  poll_id: string;
  user_id: string;
  chosen_option: 'A' | 'B';
  bet_amount: number;
  potential_win?: number;
  actual_win?: number;
  is_winner?: boolean;
  created_at: string;
}

export type WithdrawalStatus = 'pending' | 'processing' | 'completed' | 'rejected';

export interface Withdrawal {
  id: string;
  user_id: string;
  reward_id: number;
  points_spent: number;
  wallet_address?: string;
  reward_code?: string;
  status: WithdrawalStatus;
  transaction_hash?: string;
  admin_notes?: string;
  created_at: string;
  processed_at?: string;
}

export type CPAStatus = 'pending' | 'approved' | 'rejected';

export interface CPADeposit {
  id: string;
  user_id: string;
  casino_name: string;
  casino_username: string;
  transaction_id: string;
  screenshot_url: string;
  bonus_amount: number;
  status: CPAStatus;
  admin_notes?: string;
  created_at: string;
  processed_at?: string;
}

export interface MiningLog {
  id: string;
  user_id: string;
  base_points: number;
  active_bonus: number;
  subscriber_multiplier: number;
  total_points: number;
  was_live: boolean;
  mining_timestamp: string;
}

// WebSocket Events
export interface WSPollUpdate {
  type: 'POLL_UPDATE';
  poll: Poll;
  multipliers: {
    option_a: number;
    option_b: number;
  };
}

export interface WSNewBet {
  type: 'NEW_BET';
  poll_id: string;
  option: 'A' | 'B';
  amount: number;
  total_a: number;
  total_b: number;
}

export interface WSPollResolved {
  type: 'POLL_RESOLVED';
  poll_id: string;
  winner: 'A' | 'B';
  winners_count: number;
  total_distributed: number;
}

export type WSMessage = WSPollUpdate | WSNewBet | WSPollResolved;

// Helper para calcular multiplicadores
export interface PollMultipliers {
  option_a: number;
  option_b: number;
}

export function calculateMultipliers(total_a: number, total_b: number): PollMultipliers {
  const TAX = 0.05;
  
  if (total_a === 0 && total_b === 0) {
    return { option_a: 2.0, option_b: 2.0 };
  }
  
  if (total_a === 0) {
    return { option_a: 2.0, option_b: 1.0 };
  }
  
  if (total_b === 0) {
    return { option_a: 1.0, option_b: 2.0 };
  }
  
  const mult_a = (total_b / total_a) * (1 - TAX) + 1;
  const mult_b = (total_a / total_b) * (1 - TAX) + 1;
  
  return {
    option_a: Math.max(1.0, parseFloat(mult_a.toFixed(2))),
    option_b: Math.max(1.0, parseFloat(mult_b.toFixed(2)))
  };
}
