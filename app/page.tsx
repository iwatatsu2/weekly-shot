import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="px-4 pt-16 pb-12 text-center">
        <Image
          src="/logo.png"
          alt="WeeklyShot"
          width={120}
          height={120}
          className="mx-auto mb-4"
        />
        <h1 className="text-3xl font-bold mb-2">
          WeeklyShot
        </h1>
        <p className="text-lg text-gray-600 mb-1">
          週1回のGLP-1注射、
          <br />
          もう打ち忘れない。
        </p>
        <p className="text-sm text-gray-400 mb-4">
          糖尿病・内分泌専門医が作った無料LINEリマインダー
        </p>
        <p className="text-xs text-gray-400">
          完全無料・登録30秒・アプリ不要
        </p>
      </section>

      {/* Features */}
      <section className="px-4 py-12 bg-gray-50">
        <div className="max-w-md mx-auto space-y-8">
          <div className="text-center">
            <div className="text-3xl mb-2">💉</div>
            <h3 className="font-semibold mb-1">注射日の当日にLINEでお知らせ</h3>
            <p className="text-sm text-gray-500">
              設定した曜日・時刻に
              <br />
              リマインドが届きます
            </p>
          </div>

          <div className="text-center">
            <div className="text-3xl mb-2">📊</div>
            <h3 className="font-semibold mb-1">体重記録＆グラフ</h3>
            <p className="text-sm text-gray-500">
              体重・体脂肪率を記録して
              <br />
              推移をグラフで確認できます
            </p>
          </div>

          <div className="text-center">
            <div className="text-3xl mb-2">⏱️</div>
            <h3 className="font-semibold mb-1">登録はたった30秒</h3>
            <p className="text-sm text-gray-500">
              友だち追加して、曜日と時刻を選ぶだけ。
              <br />
              アプリのインストールは不要です
            </p>
          </div>
        </div>
      </section>

      {/* 対応薬剤 */}
      <section className="px-4 py-12">
        <div className="max-w-md mx-auto text-center">
          <h2 className="text-lg font-bold mb-4">対応薬剤</h2>
          <div className="flex justify-center gap-4">
            <div className="bg-blue-50 rounded-xl px-6 py-4">
              <p className="font-semibold text-blue-700">ウゴービ</p>
              <p className="text-xs text-blue-500 mt-1">セマグルチド</p>
            </div>
            <div className="bg-purple-50 rounded-xl px-6 py-4">
              <p className="font-semibold text-purple-700">ゼップバウンド</p>
              <p className="text-xs text-purple-500 mt-1">チルゼパチド</p>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-3">
            その他のGLP-1製剤にも対応しています
          </p>
        </div>
      </section>

      {/* Developer Profile */}
      <section className="px-4 py-12 bg-gray-50">
        <div className="max-w-md mx-auto">
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-4">
              <Image
                src="/dr-iwatatsu.png"
                alt="Dr.いわたつ"
                width={48}
                height={64}
                className="rounded-lg object-cover"
              />
              <div className="flex flex-col gap-0.5">
                <span className="text-[.65rem] text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full w-fit font-semibold">
                  開発・監修
                </span>
                <strong className="text-base">Dr.いわたつ</strong>
                <span className="text-xs text-gray-500">
                  糖尿病・内分泌専門医 / 医療×AI×実装
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <a href="https://driwatatsu.readdy.co" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2.5 bg-gray-50 border border-gray-100 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors">
                <span className="w-5 text-center">🏠</span>HP
                <span className="ml-auto text-[.7rem] text-gray-400 font-normal">プロフィール・実績</span>
              </a>
              <a href="https://note.com/dr_iwatatsu" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2.5 bg-gray-50 border border-gray-100 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors">
                <span className="w-5 text-center">📖</span>note
                <span className="ml-auto text-[.7rem] text-gray-400 font-normal">GLP-1の副作用対策など</span>
              </a>
              <a href="https://x.com/KenKyu1019799" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2.5 bg-gray-50 border border-gray-100 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors">
                <span className="w-5 text-center">𝕏</span>X
                <span className="ml-auto text-[.7rem] text-gray-400 font-normal">医療AIの最新情報</span>
              </a>
              <a href="https://www.instagram.com/dr.iwatatsu/" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2.5 bg-gray-50 border border-gray-100 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors">
                <span className="w-5 text-center">📸</span>Instagram
                <span className="ml-auto text-[.7rem] text-gray-400 font-normal">ライフスタイル</span>
              </a>
              <a href="https://medapp-market.vercel.app/" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2.5 bg-gray-50 border border-gray-100 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors">
                <span className="w-5 text-center">💊</span>MedApp Market
                <span className="ml-auto text-[.7rem] text-gray-400 font-normal">医療アプリまとめ</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-12 text-center">
        <a
          href="https://lin.ee/5MLyw4d"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-[#06C755] text-white font-bold text-lg px-8 py-4 rounded-full shadow-lg hover:opacity-90 transition-opacity"
        >
          LINEで友だち追加
        </a>
        <p className="text-xs text-gray-400 mt-3">
          友だち追加後、注射リマインダー＆体重記録が使えます
        </p>
        <a
          href="https://liff.line.me/2010011578-1vSQw5Gj"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-blue-600 text-white font-bold text-lg px-8 py-4 rounded-full shadow-lg hover:opacity-90 transition-opacity mt-4"
        >
          📊 体重を記録する
        </a>
        <a
          href="https://liff.line.me/2010011578-BsNXGUao"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-gray-700 text-white font-bold text-lg px-8 py-4 rounded-full shadow-lg hover:opacity-90 transition-opacity mt-4"
        >
          💉 注射スケジュール設定
        </a>
        <a
          href="https://line.me/R/share?text=GLP-1注射の打ち忘れ防止に！無料のLINEリマインダー「WeeklyShot」%0Ahttps://weekly-shot.vercel.app"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-white text-gray-700 font-bold text-base px-8 py-3 rounded-full shadow border border-gray-200 hover:bg-gray-50 transition-colors mt-4"
        >
          🔗 LINEで友達にシェア
        </a>
      </section>

      {/* Footer links */}
      <div className="px-4 py-6 text-center text-xs text-gray-400 space-x-4">
        <Link href="/terms" className="hover:underline">
          利用規約
        </Link>
        <Link href="/privacy" className="hover:underline">
          プライバシーポリシー
        </Link>
      </div>
    </div>
  );
}
