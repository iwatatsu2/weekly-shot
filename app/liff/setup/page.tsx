"use client";

import { useState, useEffect } from "react";
import { useLiff } from "@/hooks/useLiff";

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];
const TIMES = Array.from({ length: 48 }, (_, i) => {
  const h = Math.floor(i / 2)
    .toString()
    .padStart(2, "0");
  const m = i % 2 === 0 ? "00" : "30";
  return `${h}:${m}`;
});
const MEDICATIONS = [
  { value: "wegovy", label: "ウゴービ" },
  { value: "zepbound", label: "ゼップバウンド" },
  { value: "other_glp1", label: "その他GLP-1" },
  { value: "unspecified", label: "未選択" },
];

type Schedule = {
  weekday: number;
  time_of_day: string;
  medication: string;
} | null;

export default function SetupPage() {
  const { isReady, error: liffError, accessToken } = useLiff();
  const [weekday, setWeekday] = useState(6); // 土曜
  const [time, setTime] = useState("21:00");
  const [medication, setMedication] = useState("unspecified");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [nextDate, setNextDate] = useState("");
  const [existingSchedule, setExistingSchedule] = useState<Schedule>(null);
  const [fetching, setFetching] = useState(true);

  // 既存スケジュール取得
  useEffect(() => {
    if (!isReady || !accessToken) return;
    fetch("/api/schedule", {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.schedule) {
          setExistingSchedule(data.schedule);
          setWeekday(data.schedule.weekday);
          setTime(data.schedule.time_of_day.slice(0, 5));
          setMedication(data.schedule.medication);
        }
      })
      .finally(() => setFetching(false));
  }, [isReady, accessToken]);

  const handleSubmit = async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const res = await fetch("/api/schedule", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          weekday,
          time_of_day: time,
          medication,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        const d = new Date(data.next_injection);
        const formatted = `${d.getMonth() + 1}/${d.getDate()}(${WEEKDAYS[d.getDay()]}) ${time}`;
        setNextDate(formatted);
        setDone(true);
      }
    } finally {
      setLoading(false);
    }
  };

  if (liffError) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <p className="text-red-500">{liffError}</p>
      </div>
    );
  }

  if (!isReady || fetching) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">読み込み中...</div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
        <div className="text-5xl mb-4">&#x2705;</div>
        <h1 className="text-xl font-bold mb-2">
          {existingSchedule ? "設定を更新しました" : "登録が完了しました"}
        </h1>
        <p className="text-gray-600 mb-6">
          次回の注射予定: <span className="font-semibold">{nextDate}</span>
          <br />
          毎週、前日と当日にLINEでお知らせします。
        </p>
        <p className="text-xs text-gray-400">この画面を閉じてください</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto">
        <h1 className="text-xl font-bold text-center mb-1 mt-6">
          注射スケジュール設定
        </h1>
        <p className="text-sm text-gray-500 text-center mb-8">
          曜日と時刻を選ぶだけ。30秒で完了します。
        </p>

        {/* 曜日選択 */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            注射する曜日
          </label>
          <div className="grid grid-cols-7 gap-1">
            {WEEKDAYS.map((name, i) => (
              <button
                key={i}
                onClick={() => setWeekday(i)}
                className={`py-3 rounded-lg text-sm font-medium transition-colors ${
                  weekday === i
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-700 border border-gray-200"
                }`}
              >
                {name}
              </button>
            ))}
          </div>
        </div>

        {/* 時刻選択 */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            注射する時刻
          </label>
          <select
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="w-full p-3 border border-gray-200 rounded-lg bg-white text-lg"
          >
            {TIMES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        {/* 薬剤選択 */}
        <div className="mb-8">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            使用している薬剤
          </label>
          <div className="grid grid-cols-2 gap-2">
            {MEDICATIONS.map((med) => (
              <button
                key={med.value}
                onClick={() => setMedication(med.value)}
                className={`py-3 px-4 rounded-lg text-sm font-medium transition-colors ${
                  medication === med.value
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-700 border border-gray-200"
                }`}
              >
                {med.label}
              </button>
            ))}
          </div>
        </div>

        {/* 登録ボタン */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full py-4 bg-green-500 text-white font-bold rounded-xl text-lg disabled:opacity-50 transition-colors hover:bg-green-600"
        >
          {loading
            ? "登録中..."
            : existingSchedule
              ? "設定を更新する"
              : "登録する"}
        </button>

        <p className="text-xs text-gray-400 text-center mt-4">
          ※ 処方・用量変更は必ず主治医にご相談ください
        </p>
      </div>
    </div>
  );
}
