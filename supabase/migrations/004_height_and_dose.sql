-- 身長カラム追加（BMI計算用）
ALTER TABLE ws_users ADD COLUMN height numeric(4,1);

-- 用量変更ログ
CREATE TABLE ws_dose_changes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES ws_users(id) ON DELETE CASCADE NOT NULL,
  changed_date date NOT NULL,
  medication text NOT NULL,
  dose text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_ws_dose_changes_user ON ws_dose_changes(user_id);

ALTER TABLE ws_dose_changes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON ws_dose_changes
  FOR ALL USING (true) WITH CHECK (true);
