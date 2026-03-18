CREATE TABLE finance_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  week INTEGER,
  month_code TEXT,
  month_name TEXT,
  transaction_date DATE NOT NULL,
  account_identifier TEXT,
  description TEXT,
  credit NUMERIC,
  debit NUMERIC,
  account_label TEXT,
  category_1 TEXT,
  category_2 TEXT,
  is_work BOOLEAN DEFAULT FALSE,
  amount NUMERIC,
  notes TEXT,
  mmm_yyyy TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE finance_transactions ENABLE ROW LEVEL SECURITY;

-- Create policy so users can only see their own data
CREATE POLICY "Users can manage their own finance transactions"
  ON finance_transactions
  FOR ALL
  USING (auth.uid() = user_id);