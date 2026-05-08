-- Push OFF機能: ユーザーごとにPush通知のON/OFF
ALTER TABLE ws_users ADD COLUMN push_enabled boolean DEFAULT true;

-- スマートスキップ用: 最終メッセージ受信日時
ALTER TABLE ws_users ADD COLUMN last_active_at timestamptz;
