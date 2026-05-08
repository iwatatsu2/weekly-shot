export const metadata = {
  title: "プライバシーポリシー - WeeklyShot",
};

export default function PrivacyPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold mb-8">プライバシーポリシー</h1>
      <p className="text-sm text-gray-500 mb-6">最終更新日: 2026年5月8日</p>

      <div className="space-y-6 text-sm leading-relaxed text-gray-700">
        <section>
          <h2 className="text-base font-semibold mb-2">1. 運営者</h2>
          <p>
            本サービス「WeeklyShot」は、糖尿病・肥満症専門医の岩本達也が個人で
            運営しています。
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold mb-2">2. 取得する情報</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>LINE User ID（ユーザー識別のため）</li>
            <li>LINE表示名（任意、画面表示のため）</li>
            <li>注射スケジュール（曜日・時刻・薬剤名）</li>
            <li>注射記録（予定日時・確認日時・ステータス）</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold mb-2">3. 取得しない情報</h2>
          <p>以下の情報は一切取得・保存しません：</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>氏名、住所、電話番号、メールアドレス</li>
            <li>体重、検査値、処方箋情報</li>
            <li>その他の個人を直接特定できる情報</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold mb-2">4. 利用目的</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>注射リマインド通知の送信</li>
            <li>注射記録の保存・表示</li>
            <li>サービスの改善・統計分析（個人を特定しない形で）</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold mb-2">5. 第三者提供</h2>
          <p>
            取得した情報は第三者に提供しません。
            ただし、法令に基づく場合を除きます。
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold mb-2">6. データの保管</h2>
          <p>
            データはSupabase（クラウドデータベース）に保管されます。
            通信はSSL/TLSにより暗号化されています。
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold mb-2">7. データの削除</h2>
          <p>
            ユーザーがLINE公式アカウントをブロック（退会）した場合、
            30日以内にすべてのユーザーデータを削除します。
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold mb-2">8. お問い合わせ</h2>
          <p>
            本ポリシーに関するお問い合わせは、LINE公式アカウントのチャットまたは
            X（@iwatatsu_dm）までご連絡ください。
          </p>
        </section>
      </div>
    </div>
  );
}
