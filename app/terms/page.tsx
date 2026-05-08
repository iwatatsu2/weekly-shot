export const metadata = {
  title: "利用規約 - WeeklyShot",
};

export default function TermsPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold mb-8">利用規約</h1>
      <p className="text-sm text-gray-500 mb-6">最終更新日: 2026年5月8日</p>

      <div className="space-y-6 text-sm leading-relaxed text-gray-700">
        <section>
          <h2 className="text-base font-semibold mb-2">第1条（サービス概要）</h2>
          <p>
            WeeklyShot（以下「本サービス」）は、GLP-1受容体作動薬の週1回注射スケジュールを
            LINEでリマインドする無料の記録補助ツールです。
            運営者（以下「当方」）は岩本達也が個人で運営しています。
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold mb-2">第2条（医療行為ではないこと）</h2>
          <p>
            本サービスは医療行為、医学的助言、診断または治療を提供するものではありません。
            処方・用量変更・副作用への対応は、必ず主治医の指示に従ってください。
            本サービスの利用により生じたいかなる結果についても、当方は責任を負いません。
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold mb-2">第3条（利用条件）</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>本サービスの利用にはLINEアカウントが必要です</li>
            <li>本サービスは無料で提供されます</li>
            <li>当方は事前の通知なくサービス内容を変更・中断・終了できます</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold mb-2">第4条（禁止事項）</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>本サービスの不正利用またはシステムへの攻撃</li>
            <li>他のユーザーへの迷惑行為</li>
            <li>法令または公序良俗に反する行為</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold mb-2">第5条（免責事項）</h2>
          <p>
            本サービスは「現状のまま」提供されます。
            通知の遅延・未送信・システム障害等により生じた損害について、
            当方は一切の責任を負いません。
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold mb-2">第6条（退会）</h2>
          <p>
            ユーザーはいつでもLINE公式アカウントをブロックすることで退会できます。
            退会後、ユーザーデータは30日以内に削除されます。
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold mb-2">第7条（規約の変更）</h2>
          <p>
            当方は本規約を変更できるものとし、変更後の規約は本ページに掲載した時点で
            効力を生じます。
          </p>
        </section>
      </div>
    </div>
  );
}
