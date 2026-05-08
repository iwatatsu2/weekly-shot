-- ws_weight_logs: 体重記録テーブル
CREATE TABLE ws_weight_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES ws_users(id) ON DELETE CASCADE NOT NULL,
  recorded_date date NOT NULL,
  weight numeric(5,1) NOT NULL,
  body_fat numeric(4,1),
  memo text,
  created_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX idx_ws_weight_logs_user_date
  ON ws_weight_logs(user_id, recorded_date);
CREATE INDEX idx_ws_weight_logs_user
  ON ws_weight_logs(user_id);

ALTER TABLE ws_weight_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON ws_weight_logs
  FOR ALL USING (true) WITH CHECK (true);
