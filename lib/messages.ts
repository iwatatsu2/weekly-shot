const NOTE_BASE_URL = process.env.NOTE_BASE_URL || "https://note.com/dr_iwatatsu";
const X_URL = "https://x.com/KenKyu1019799";
const DIARY_URL = "https://liff.line.me/2010011578-1vSQw5Gj";

function formatDate(date: Date): string {
  const weekdays = ["日", "月", "火", "水", "木", "金", "土"];
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const w = weekdays[date.getDay()];
  return `${m}/${d}(${w})`;
}

function formatTime(time: string): string {
  return time.slice(0, 5); // "21:00:00" -> "21:00"
}

export const messages = {
  welcome: `WeeklyShotへようこそ!
週1回のGLP-1注射の打ち忘れを防ぐリマインダーボットです。

本サービスは記録補助ツールであり、医療行為ではありません。処方・用量変更は必ず主治医にご相談ください。

下のメニューから「設定する」を押して、注射する曜日と時刻を登録してください(30秒で完了します)。

📖 GLP-1注射のコツや副作用対策:
${NOTE_BASE_URL}`,

  preDay(injectionDate: Date): string {
    return `明日(${formatDate(injectionDate)})はGLP-1注射の日です💉
夜にお時間がとれそうか、確認してみてくださいね。

※体調が優れないなど、判断に迷うときは主治医にご相談ください。`;
  },

  onDay(): string {
    return `今日はGLP-1注射の日です💉
準備ができたら下のボタンを押してください。`;
  },

  confirmed(nextDate: Date, nextTime: string, includeNote: boolean): string {
    let msg = `お疲れさまでした👏
次回は${formatDate(nextDate)} ${formatTime(nextTime)}にお知らせします。

📊 体重を記録する:
${DIARY_URL}`;

    if (includeNote) {
      msg += `\n\n📖 副作用が出たときの対処法は、こちらのnote記事で解説しています:\n${NOTE_BASE_URL}`;
    }

    return msg;
  },

  missed(): string {
    return `昨日の注射、確認できませんでした。
打ち忘れた場合の対応は人によって異なるため、不明な点は主治医にご相談ください。

(次回の予定はそのまま継続されます)

📖 打ち忘れたときの対処法:
${NOTE_BASE_URL}`;
  },

  followUp(count: number): string {
    return `注射のリマインドです(${count}回目)💉
準備ができたら「打ちました」を押してください。`;
  },

  scheduleRegistered(nextDate: Date, nextTime: string): string {
    return `登録が完了しました!
次回の注射予定: ${formatDate(nextDate)} ${formatTime(nextTime)}

毎週、前日と当日にLINEでお知らせします。`;
  },

  paused: "通知を一時停止しました。再開するときは「再開」と送ってください。",

  resumed: "通知を再開しました!次回の予定日にお知らせします。",

  withdrawn:
    "ご利用ありがとうございました。データは30日以内に削除されます。",
};
