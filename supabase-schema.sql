-- =====================================================
-- SLOTMASTERS1K LOYALTY APP - SUPABASE SCHEMA
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. USERS TABLE
-- =====================================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  kick_user_id TEXT UNIQUE NOT NULL,
  kick_username TEXT UNIQUE NOT NULL,
  kick_avatar_url TEXT,
  wallet_address TEXT,
  points_balance BIGINT DEFAULT 0 NOT NULL,
  is_subscriber BOOLEAN DEFAULT FALSE,
  last_message_timestamp TIMESTAMPTZ,
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index para búsquedas rápidas
CREATE INDEX idx_users_kick_username ON users(kick_username);
CREATE INDEX idx_users_ip_address ON users(ip_address);
CREATE INDEX idx_users_points ON users(points_balance DESC);

-- =====================================================
-- 2. REWARDS STOCK TABLE
-- =====================================================
CREATE TABLE rewards_stock (
  id SERIAL PRIMARY KEY,
  reward_name TEXT NOT NULL,
  value_eur DECIMAL(10,2) NOT NULL,
  points_cost BIGINT NOT NULL,
  initial_stock INT NOT NULL,
  current_stock INT NOT NULL,
  week_number INT NOT NULL,
  year INT NOT NULL,
  delivery_type TEXT NOT NULL, -- 'CODE', 'USDT'
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(reward_name, week_number, year)
);

-- Index para stock semanal activo
CREATE INDEX idx_rewards_active_week ON rewards_stock(week_number, year, is_active);

-- =====================================================
-- 3. TRANSACTIONS TABLE
-- =====================================================
CREATE TYPE transaction_type AS ENUM ('earn', 'bet_win', 'bet_loss', 'redeem', 'cpa_bonus');
CREATE TYPE transaction_status AS ENUM ('pending', 'completed', 'failed', 'cancelled');

CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type transaction_type NOT NULL,
  amount BIGINT NOT NULL,
  status transaction_status DEFAULT 'completed',
  description TEXT,
  metadata JSONB, -- Datos extra: poll_id, reward_id, etc.
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indices para consultas rápidas
CREATE INDEX idx_transactions_user ON transactions(user_id, created_at DESC);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_status ON transactions(status);

-- =====================================================
-- 4. POLLS (APUESTAS EN VIVO)
-- =====================================================
CREATE TYPE poll_status AS ENUM ('open', 'locked', 'resolved', 'cancelled');

CREATE TABLE polls (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  total_bet_a BIGINT DEFAULT 0,
  total_bet_b BIGINT DEFAULT 0,
  status poll_status DEFAULT 'open',
  winning_option TEXT, -- 'A' or 'B'
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  locked_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ
);

CREATE INDEX idx_polls_status ON polls(status, created_at DESC);

-- =====================================================
-- 5. POLL BETS (APUESTAS INDIVIDUALES)
-- =====================================================
CREATE TABLE poll_bets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  poll_id UUID REFERENCES polls(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  chosen_option TEXT NOT NULL, -- 'A' or 'B'
  bet_amount BIGINT NOT NULL,
  potential_win BIGINT, -- Calculado al momento de apostar
  actual_win BIGINT, -- Calculado al resolver
  is_winner BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(poll_id, user_id) -- Un usuario solo puede apostar una vez por poll
);

CREATE INDEX idx_poll_bets_poll ON poll_bets(poll_id);
CREATE INDEX idx_poll_bets_user ON poll_bets(user_id);

-- =====================================================
-- 6. WITHDRAWALS (CANJES DE RECOMPENSAS)
-- =====================================================
CREATE TYPE withdrawal_status AS ENUM ('pending', 'processing', 'completed', 'rejected');

CREATE TABLE withdrawals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  reward_id INT REFERENCES rewards_stock(id),
  points_spent BIGINT NOT NULL,
  wallet_address TEXT, -- Para USDT
  reward_code TEXT, -- Para códigos
  status withdrawal_status DEFAULT 'pending',
  transaction_hash TEXT, -- Hash de la transacción USDT
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

CREATE INDEX idx_withdrawals_user ON withdrawals(user_id, created_at DESC);
CREATE INDEX idx_withdrawals_status ON withdrawals(status);

-- =====================================================
-- 7. CPA DEPOSITS (INGRESOS POR AFILIACIÓN)
-- =====================================================
CREATE TYPE cpa_status AS ENUM ('pending', 'approved', 'rejected');

CREATE TABLE cpa_deposits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  casino_name TEXT NOT NULL,
  casino_username TEXT NOT NULL,
  transaction_id TEXT NOT NULL,
  screenshot_url TEXT NOT NULL,
  bonus_amount DECIMAL(10,2) DEFAULT 5.00,
  status cpa_status DEFAULT 'pending',
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

CREATE INDEX idx_cpa_user ON cpa_deposits(user_id);
CREATE INDEX idx_cpa_status ON cpa_deposits(status);

-- =====================================================
-- 8. POINT MINING LOGS
-- =====================================================
CREATE TABLE mining_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  base_points INT DEFAULT 5,
  active_bonus INT DEFAULT 0,
  subscriber_multiplier DECIMAL(3,2) DEFAULT 1.0,
  total_points INT NOT NULL,
  was_live BOOLEAN DEFAULT TRUE,
  mining_timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_mining_user_time ON mining_logs(user_id, mining_timestamp DESC);

-- =====================================================
-- 9. WEEKLY STOCK RESET LOGS
-- =====================================================
CREATE TABLE stock_reset_logs (
  id SERIAL PRIMARY KEY,
  week_number INT NOT NULL,
  year INT NOT NULL,
  reset_timestamp TIMESTAMPTZ DEFAULT NOW(),
  rewards_reset JSONB -- Array con info de cada reward reseteado
);

-- =====================================================
-- TRIGGERS PARA UPDATED_AT
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at 
  BEFORE UPDATE ON users 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- FUNCTIONS ÚTILES
-- =====================================================

-- Función para obtener el número de semana actual
CREATE OR REPLACE FUNCTION get_current_week()
RETURNS TABLE(week_num INT, year_num INT) AS $$
BEGIN
  RETURN QUERY SELECT 
    EXTRACT(WEEK FROM NOW())::INT AS week_num,
    EXTRACT(YEAR FROM NOW())::INT AS year_num;
END;
$$ LANGUAGE plpgsql;

-- Función para resetear stock semanal (correr cada lunes 00:00)
CREATE OR REPLACE FUNCTION reset_weekly_stock()
RETURNS VOID AS $$
DECLARE
  current_week INT;
  current_year INT;
BEGIN
  SELECT week_num, year_num INTO current_week, current_year FROM get_current_week();
  
  -- Insertar stock para la nueva semana
  INSERT INTO rewards_stock (reward_name, value_eur, points_cost, initial_stock, current_stock, week_number, year, delivery_type)
  VALUES
    ('Tarjeta Mini 1€', 1.00, 2500, 10, 10, current_week, current_year, 'CODE'),
    ('Tarjeta Bronze 2€', 2.00, 4800, 8, 8, current_week, current_year, 'CODE'),
    ('Tarjeta Silver 3€', 3.00, 7000, 3, 3, current_week, current_year, 'CODE'),
    ('Tarjeta Gold 5€', 5.00, 11500, 3, 3, current_week, current_year, 'USDT'),
    ('Tarjeta Epic 10€', 10.00, 22000, 1, 1, current_week, current_year, 'USDT')
  ON CONFLICT (reward_name, week_number, year) DO NOTHING;
  
  -- Log del reset
  INSERT INTO stock_reset_logs (week_number, year, rewards_reset)
  VALUES (current_week, current_year, 
    (SELECT jsonb_agg(jsonb_build_object('name', reward_name, 'stock', current_stock))
     FROM rewards_stock 
     WHERE week_number = current_week AND year = current_year)
  );
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_bets ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE cpa_deposits ENABLE ROW LEVEL SECURITY;

-- Políticas para USERS
CREATE POLICY "Users can view their own data"
  ON users FOR SELECT
  USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update their own wallet"
  ON users FOR UPDATE
  USING (auth.uid()::text = id::text)
  WITH CHECK (auth.uid()::text = id::text);

-- Políticas para TRANSACTIONS
CREATE POLICY "Users can view their own transactions"
  ON transactions FOR SELECT
  USING (user_id::text = auth.uid()::text);

-- Políticas para POLL_BETS
CREATE POLICY "Users can view their own bets"
  ON poll_bets FOR SELECT
  USING (user_id::text = auth.uid()::text);

CREATE POLICY "Users can create their own bets"
  ON poll_bets FOR INSERT
  WITH CHECK (user_id::text = auth.uid()::text);

-- Políticas para WITHDRAWALS
CREATE POLICY "Users can view their own withdrawals"
  ON withdrawals FOR SELECT
  USING (user_id::text = auth.uid()::text);

CREATE POLICY "Users can create withdrawal requests"
  ON withdrawals FOR INSERT
  WITH CHECK (user_id::text = auth.uid()::text);

-- Políticas para CPA_DEPOSITS
CREATE POLICY "Users can view their own CPA deposits"
  ON cpa_deposits FOR SELECT
  USING (user_id::text = auth.uid()::text);

CREATE POLICY "Users can create CPA deposit requests"
  ON cpa_deposits FOR INSERT
  WITH CHECK (user_id::text = auth.uid()::text);

-- =====================================================
-- DATOS INICIALES
-- =====================================================

-- Insertar stock inicial para la semana actual
SELECT reset_weekly_stock();

-- =====================================================
-- NOTAS DE IMPLEMENTACIÓN
-- =====================================================
/*
1. Este schema usa UUID para IDs de usuarios y transacciones
2. Los ENUM types permiten validación a nivel de DB
3. Las políticas RLS protegen los datos de cada usuario
4. La función reset_weekly_stock() debe ejecutarse vía cron job cada lunes
5. Los índices optimizan las consultas más frecuentes
6. JSONB en metadata permite flexibilidad para datos extras
*/
