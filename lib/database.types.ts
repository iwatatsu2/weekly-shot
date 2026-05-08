export type Database = {
  public: {
    Tables: {
      ws_users: {
        Row: {
          id: string;
          line_user_id: string;
          display_name: string | null;
          timezone: string;
          status: "active" | "paused" | "withdrawn";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          line_user_id: string;
          display_name?: string | null;
          timezone?: string;
          status?: "active" | "paused" | "withdrawn";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          line_user_id?: string;
          display_name?: string | null;
          timezone?: string;
          status?: "active" | "paused" | "withdrawn";
          created_at?: string;
          updated_at?: string;
        };
      };
      ws_schedules: {
        Row: {
          id: string;
          user_id: string;
          weekday: number;
          time_of_day: string;
          medication: "wegovy" | "zepbound" | "other_glp1" | "unspecified";
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          weekday: number;
          time_of_day: string;
          medication?: "wegovy" | "zepbound" | "other_glp1" | "unspecified";
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          weekday?: number;
          time_of_day?: string;
          medication?: "wegovy" | "zepbound" | "other_glp1" | "unspecified";
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      ws_injection_logs: {
        Row: {
          id: string;
          user_id: string;
          scheduled_at: string;
          confirmed_at: string | null;
          status: "pending" | "confirmed" | "missed";
          reminder_count: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          scheduled_at: string;
          confirmed_at?: string | null;
          status?: "pending" | "confirmed" | "missed";
          reminder_count?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          scheduled_at?: string;
          confirmed_at?: string | null;
          status?: "pending" | "confirmed" | "missed";
          reminder_count?: number;
          created_at?: string;
        };
      };
      ws_notification_queue: {
        Row: {
          id: string;
          user_id: string;
          log_id: string;
          send_at: string;
          message_type: "pre_day" | "on_day" | "follow_up";
          sent_at: string | null;
          status: "queued" | "sent" | "failed" | "cancelled";
        };
        Insert: {
          id?: string;
          user_id: string;
          log_id: string;
          send_at: string;
          message_type: "pre_day" | "on_day" | "follow_up";
          sent_at?: string | null;
          status?: "queued" | "sent" | "failed" | "cancelled";
        };
        Update: {
          id?: string;
          user_id?: string;
          log_id?: string;
          send_at?: string;
          message_type?: "pre_day" | "on_day" | "follow_up";
          sent_at?: string | null;
          status?: "queued" | "sent" | "failed" | "cancelled";
        };
      };
    };
  };
};
