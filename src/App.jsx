import { useState, useEffect, useRef } from "react";

const COLORS = {
  bg: "#080c14", surface: "#0f1629", surface2: "#162036", surface3: "#1c2a4a",
  border: "#1e3055", borderLight: "#2a4070",
  blue: "#4a90f7", cyan: "#22d3ee", green: "#34d399", orange: "#f59e0b",
  red: "#ef4444", purple: "#a78bfa", yellow: "#fbbf24", pink: "#f472b6",
  amazonOrange: "#ff9900", traboxBlue: "#3b82f6", webkitGreen: "#10b981", jlRed: "#ef4444",
  text: "#e8edf5", text2: "#94a3b8", text3: "#5a6a85",
  lineGreen: "#06c755", lineBg: "#7aac8b",
};

// ============ MOCK DATA ============
const TRUCKS = [
  { id: "北九01", driver: "佐藤 太郎", type: "4t", status: "running", from: "北九州", to: "大阪", progress: 65, eta: "14:30" },
  { id: "福岡03", driver: "田中 健一", type: "10t", status: "idle", location: "福岡IC付近", idleSince: "10:20" },
  { id: "北九02", driver: "山本 誠", type: "4t", status: "running", from: "福岡", to: "名古屋", progress: 30, eta: "18:00" },
  { id: "福岡05", driver: "鈴木 一郎", type: "2t", status: "idle", location: "博多駅付近", idleSince: "09:45" },
  { id: "北九04", driver: "高橋 翔", type: "10t", status: "running", from: "北九州", to: "東京", progress: 45, eta: "21:00" },
  { id: "福岡07", driver: "渡辺 大輔", type: "4t", status: "maintenance", note: "定期点検（〜2/26）" },
  { id: "北九06", driver: "伊藤 慎太郎", type: "2t", status: "running", from: "小倉", to: "広島", progress: 80, eta: "12:15" },
];

const AVAILABLE_JOBS = [
  { id: 1, source: "amazon", label: "Amazon Relay", from: "福岡", to: "大阪", type: "4t", fare: 52000, profit: 18500, auto: true, urgency: "high", time: "本日 15:00発" },
  { id: 2, source: "trabox", label: "トラボックス", from: "北九州", to: "名古屋", type: "10t", fare: 78000, profit: 32000, auto: false, urgency: "high", time: "本日 14:00発" },
  { id: 3, source: "amazon", label: "Amazon Relay", from: "博多", to: "広島", type: "2t", fare: 28000, profit: 9500, auto: true, urgency: "mid", time: "明日 08:00発" },
  { id: 4, source: "webkit", label: "WebKIT", from: "福岡", to: "東京", type: "10t", fare: 120000, profit: 45000, auto: false, urgency: "mid", time: "明日 06:00発" },
  { id: 5, source: "jl", label: "JLネット", from: "久留米", to: "広島", type: "4t", fare: 35000, profit: 12000, auto: false, urgency: "low", time: "2/26 09:00発" },
  { id: 6, source: "trabox", label: "トラボックス", from: "北九州", to: "大阪", type: "4t", fare: 55000, profit: 20000, auto: false, urgency: "mid", time: "本日 16:00発" },
  { id: 7, source: "amazon", label: "Amazon Relay", from: "福岡", to: "鳥栖", type: "10t", fare: 15000, profit: 6800, auto: true, urgency: "low", time: "明日 10:00発" },
  { id: 8, source: "jl", label: "JLネット", from: "小倉", to: "下関", type: "2t", fare: 12000, profit: 5500, auto: false, urgency: "low", time: "2/26 13:00発" },
];

const MONTHLY_DATA = {
  amazon: { jobs: 18, revenue: 890000, profit: 340000, rate: 38 },
  trabox: { jobs: 12, revenue: 1000000, profit: 420000, rate: 42 },
  webkit: { jobs: 5, revenue: 510000, profit: 180000, rate: 35 },
  jl: { jobs: 8, revenue: 720000, profit: 290000, rate: 40 },
  direct: { jobs: 15, revenue: 1250000, profit: 560000, rate: 45 },
};

const WEEKLY_PROFIT = [
  { week: "1月W4", value: 380000 },
  { week: "2月W1", value: 420000 },
  { week: "2月W2", value: 510000 },
  { week: "2月W3", value: 460000 },
  { week: "2月W4", value: 490000 },
];

// ============ LINE CHAT SCENARIOS ============
const LINE_SCENARIOS = [
  {
    name: "🌅 朝のサマリー",
    messages: [
      { from: "bot", text: "🌅 おはようございます！2/24(月) 配車サマリー\n\n🚛 稼働車両: 5/7台\n🟢 運行中: 4台\n🔴 空車: 2台（福岡03号・福岡05号）\n🔧 整備中: 1台\n\n📊 本日の案件状況:\n・Amazon Relay: 北九州発 8件 / 福岡発 12件\n・トラボックス新着: 九州発 23件（利益¥2万超: 5件）\n・WebKIT: 組合内案件 3件\n\n💰 今月売上: ¥4,370,000 / 利益: ¥1,790,000\n（前月同日比 +12%）\n\n空車2台にAmazon Relay自動落札を設定しますか？" },
      { from: "user", text: "はい、自動でお願い" },
      { from: "bot", text: "✅ 設定完了！\n\n🚛 福岡03号（田中）→ Amazon Relay 自動落札ON\n🚛 福岡05号（鈴木）→ Amazon Relay 自動落札ON\n\n案件が見つかり次第、すぐに通知します。\nトラボックスで利益率の高い案件も並行監視中です 🔍" },
    ],
  },
  {
    name: "📦 空車→案件提案",
    messages: [
      { from: "user", text: "配送完了しました。福岡IC付近です 🚛" },
      { from: "bot", text: "お疲れ様です！福岡03号を空車登録しました ✅\n\n📦 案件候補（利益順）:\n\n①【トラボックス】北九州→名古屋 10t\n　運賃: ¥78,000 / 利益予測: ¥32,000\n　📞 電話交渉必要\n\n②【Amazon Relay】福岡→大阪 4t\n　運賃: ¥52,000 / 利益予測: ¥18,500\n　⚡ 自動落札可能\n\n③【JLネット】久留米→広島 4t\n　運賃: ¥35,000 / 利益予測: ¥12,000\n　👤 田中運送（実績8回）\n\nどれにしますか？" },
      { from: "user", text: "①でいく。電話番号見せて" },
      { from: "bot", text: "📞 トラボックス案件詳細:\n\n荷物: 工業部品（パレット積み）\n発: 北九州市門司区\n着: 名古屋市港区\n希望発時間: 本日 14:00\n\n発荷主: ○○物流\n担当: 山田様\nTEL: 093-XXX-XXXX\n\n💡 この荷主との過去取引: 3回\n　平均運賃: ¥75,000\n　支払い遅延: なし ✅\n\n成約したら「成約①」と送ってください！" },
      { from: "user", text: "成約①" },
      { from: "bot", text: "✅ 成約登録しました！\n\n🚛 福岡03号（田中）\n📍 北九州→名古屋\n💰 運賃: ¥78,000 / 利益予測: ¥32,000\n\n配車表に反映済みです。\n田中ドライバーに運行指示を送信しますか？" },
    ],
  },
  {
    name: "💰 利益レポート",
    messages: [
      { from: "user", text: "今月のサイト別の利益教えて" },
      { from: "bot", text: "📊 2月 サイト別利益レポート\n（2/1〜2/24 実績）\n\n🟠 Amazon Relay\n　18件 / 売上 ¥890,000 / 利益 ¥340,000\n　利益率: 38% / 時間効率: ◎\n\n🔵 トラボックス\n　12件 / 売上 ¥1,000,000 / 利益 ¥420,000\n　利益率: 42% / 最高利益率 🏆\n\n🟢 WebKIT\n　5件 / 売上 ¥510,000 / 利益 ¥180,000\n　利益率: 35%\n\n🔴 JLネット\n　8件 / 売上 ¥720,000 / 利益 ¥290,000\n　利益率: 40%\n\n📦 直取引\n　15件 / 売上 ¥1,250,000 / 利益 ¥560,000\n　利益率: 45% / 安定収益源\n\n━━━━━━━━━━━━\n💰 合計: 58件 / 利益 ¥1,790,000\n前月比: +8.2% 📈" },
      { from: "user", text: "一番効率いいのどこ？" },
      { from: "bot", text: "📊 効率分析:\n\n「配車作業1時間あたりの利益」で比較すると：\n\n🥇 Amazon Relay: ¥68,000/h\n　→ 自動落札なので配車作業ほぼゼロ\n\n🥈 直取引: ¥35,000/h\n　→ 既存顧客なので交渉が短い\n\n🥉 JLネット: ¥29,000/h\n　→ 信頼関係ができていて話が早い\n\n4位 トラボックス: ¥21,000/h\n　→ 利益額は最高だが電話交渉に時間\n\n5位 WebKIT: ¥18,000/h\n\n💡 提案: Amazon Relayで空車率を下げつつ、\nトラボックスは¥3万超の高額案件のみに絞ると\n全体効率が上がります！" },
    ],
  },
  {
    name: "🚛 車両状況確認",
    messages: [
      { from: "user", text: "今の車両の状況は？" },
      { from: "bot", text: "🚛 車両ステータス一覧\n\n【運行中】\n🟢 北九01号（佐藤）4t\n　北九州→大阪 / 進捗65% / 到着14:30\n\n🟢 北九02号（山本）4t\n　福岡→名古屋 / 進捗30% / 到着18:00\n\n🟢 北九04号（高橋）10t\n　北九州→東京 / 進捗45% / 到着21:00\n\n🟢 北九06号（伊藤）2t\n　小倉→広島 / 進捗80% / 到着12:15\n\n【空車】\n🔴 福岡03号（田中）福岡IC付近\n　空車10:20〜\n🔴 福岡05号（鈴木）博多駅付近\n　空車09:45〜\n\n【整備】\n🔧 福岡07号（渡辺）4t\n　定期点検（〜2/26）\n\n空車2台に案件を探しますか？" },
    ],
  },
];

// ============ UTILITY ============
const fmt = (n) => "¥" + n.toLocaleString();
const sourceColor = (s) => ({ amazon: COLORS.amazonOrange, trabox: COLORS.traboxBlue, webkit: COLORS.webkitGreen, jl: COLORS.jlRed, direct: COLORS.purple }[s] || COLORS.text2);
const sourceIcon = (s) => ({ amazon: "🟠", trabox: "🔵", webkit: "🟢", jl: "🔴", direct: "📦" }[s] || "");
const statusLabel = (s) => ({ running: "運行中", idle: "空車", maintenance: "整備中" }[s]);
const statusColor = (s) => ({ running: COLORS.green, idle: COLORS.red, maintenance: COLORS.orange }[s]);

// ============ COMPONENTS ============
function MiniBar({ value, max, color }) {
  return (
    <div style={{ width: "100%", height: 6, background: COLORS.surface3, borderRadius: 3 }}>
      <div style={{ width: `${(value / max) * 100}%`, height: "100%", background: color, borderRadius: 3, transition: "width 0.8s ease" }} />
    </div>
  );
}

function StatCard({ label, value, sub, color, icon }) {
  return (
    <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: "18px 20px", flex: 1, minWidth: 150 }}>
      <div style={{ fontSize: 11, color: COLORS.text3, marginBottom: 6, letterSpacing: "0.04em" }}>{icon} {label}</div>
      <div style={{ fontSize: 22, fontWeight: 800, color: color || COLORS.text, letterSpacing: "-0.02em" }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: COLORS.text2, marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

// ============ DASHBOARD TAB ============
function Dashboard() {
  const total = Object.values(MONTHLY_DATA).reduce((a, b) => ({ jobs: a.jobs + b.jobs, revenue: a.revenue + b.revenue, profit: a.profit + b.profit }), { jobs: 0, revenue: 0, profit: 0 });
  const maxProfit = Math.max(...WEEKLY_PROFIT.map((w) => w.value));
  const idleTrucks = TRUCKS.filter((t) => t.status === "idle").length;
  const runningTrucks = TRUCKS.filter((t) => t.status === "running").length;

  return (
    <div>
      {/* KPI Row */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <StatCard icon="💰" label="今月利益" value={fmt(total.profit)} sub={`売上 ${fmt(total.revenue)}`} color={COLORS.green} />
        <StatCard icon="📦" label="成約件数" value={`${total.jobs}件`} sub="前月比 +8.2%" color={COLORS.blue} />
        <StatCard icon="🚛" label="稼働率" value={`${Math.round((runningTrucks / TRUCKS.length) * 100)}%`} sub={`${runningTrucks}台運行 / ${idleTrucks}台空車`} color={runningTrucks > idleTrucks ? COLORS.green : COLORS.orange} />
        <StatCard icon="📈" label="平均利益率" value={`${Math.round(total.profit / total.revenue * 100)}%`} sub="目標: 40%" color={COLORS.cyan} />
      </div>

      {/* Profit Chart + Site Breakdown */}
      <div style={{ display: "flex", gap: 16, marginBottom: 20, flexWrap: "wrap" }}>
        {/* Weekly Profit Chart */}
        <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: 20, flex: 2, minWidth: 280 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 16 }}>📈 週間利益推移</div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 120 }}>
            {WEEKLY_PROFIT.map((w, i) => (
              <div key={i} style={{ flex: 1, textAlign: "center" }}>
                <div style={{ fontSize: 10, color: COLORS.cyan, marginBottom: 4, fontWeight: 600 }}>{fmt(w.value)}</div>
                <div style={{
                  height: `${(w.value / maxProfit) * 90}px`,
                  background: `linear-gradient(to top, ${COLORS.blue}, ${COLORS.cyan})`,
                  borderRadius: "6px 6px 2px 2px",
                  transition: "height 0.6s ease",
                  minHeight: 4,
                }} />
                <div style={{ fontSize: 9, color: COLORS.text3, marginTop: 6 }}>{w.week}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Site Breakdown */}
        <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: 20, flex: 3, minWidth: 300 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>📊 サイト別実績</div>
          {Object.entries(MONTHLY_DATA).map(([key, d]) => (
            <div key={key} style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                <span style={{ color: sourceColor(key), fontWeight: 600 }}>
                  {sourceIcon(key)} {{ amazon: "Amazon Relay", trabox: "トラボックス", webkit: "WebKIT", jl: "JLネット", direct: "直取引" }[key]}
                </span>
                <span style={{ color: COLORS.text2 }}>
                  {d.jobs}件 / {fmt(d.profit)} <span style={{ color: sourceColor(key), fontWeight: 700 }}>({d.rate}%)</span>
                </span>
              </div>
              <MiniBar value={d.profit} max={560000} color={sourceColor(key)} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============ DISPATCH BOARD TAB ============
function DispatchBoard() {
  const [selectedTruck, setSelectedTruck] = useState(null);
  const [assignedJobs, setAssignedJobs] = useState({});
  const [notification, setNotification] = useState(null);

  const handleAssign = (truck, job) => {
    setAssignedJobs((prev) => ({ ...prev, [truck.id]: job }));
    setNotification(`✅ ${truck.id}号（${truck.driver}）に案件を配車しました！ ${job.from}→${job.to} ${fmt(job.fare)}`);
    setSelectedTruck(null);
    setTimeout(() => setNotification(null), 4000);
  };

  return (
    <div>
      {notification && (
        <div style={{ background: "rgba(52,211,153,0.12)", border: `1px solid ${COLORS.green}`, borderRadius: 10, padding: "12px 16px", marginBottom: 16, fontSize: 13, color: COLORS.green, fontWeight: 600, animation: "fadeIn 0.3s" }}>
          {notification}
        </div>
      )}

      {/* Truck Grid */}
      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>🚛 車両一覧</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12, marginBottom: 24 }}>
        {TRUCKS.map((t) => (
          <div key={t.id} onClick={() => t.status === "idle" && !assignedJobs[t.id] && setSelectedTruck(t)}
            style={{
              background: selectedTruck?.id === t.id ? COLORS.surface3 : COLORS.surface,
              border: `1px solid ${selectedTruck?.id === t.id ? COLORS.blue : assignedJobs[t.id] ? COLORS.green : COLORS.border}`,
              borderRadius: 12, padding: 16,
              cursor: t.status === "idle" && !assignedJobs[t.id] ? "pointer" : "default",
              transition: "all 0.2s",
              borderLeft: `4px solid ${assignedJobs[t.id] ? COLORS.green : statusColor(t.status)}`,
            }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{t.id}号</div>
              <span style={{
                fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 6,
                background: `${statusColor(t.status)}20`, color: statusColor(t.status),
              }}>
                {assignedJobs[t.id] ? "✅ 配車済" : statusLabel(t.status)}
              </span>
            </div>
            <div style={{ fontSize: 12, color: COLORS.text2, marginBottom: 4 }}>👤 {t.driver} / {t.type}バン</div>
            {t.status === "running" && (
              <>
                <div style={{ fontSize: 12, color: COLORS.text2, marginBottom: 6 }}>📍 {t.from} → {t.to}（到着 {t.eta}）</div>
                <MiniBar value={t.progress} max={100} color={COLORS.green} />
                <div style={{ fontSize: 10, color: COLORS.text3, marginTop: 3, textAlign: "right" }}>{t.progress}%</div>
              </>
            )}
            {t.status === "idle" && !assignedJobs[t.id] && (
              <div style={{ fontSize: 12, color: COLORS.red }}>📍 {t.location}（{t.idleSince}〜空車）</div>
            )}
            {t.status === "idle" && assignedJobs[t.id] && (
              <div style={{ fontSize: 12, color: COLORS.green }}>📦 {assignedJobs[t.id].from}→{assignedJobs[t.id].to} {fmt(assignedJobs[t.id].fare)}</div>
            )}
            {t.status === "maintenance" && (
              <div style={{ fontSize: 12, color: COLORS.orange }}>🔧 {t.note}</div>
            )}
          </div>
        ))}
      </div>

      {/* Job Matching Panel */}
      {selectedTruck && (
        <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.blue}`, borderRadius: 14, padding: 20, marginBottom: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4, color: COLORS.blue }}>
            📦 {selectedTruck.id}号（{selectedTruck.driver}）への案件候補
          </div>
          <div style={{ fontSize: 11, color: COLORS.text3, marginBottom: 16 }}>
            {selectedTruck.location} / {selectedTruck.type}バン — タップで配車
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {AVAILABLE_JOBS.filter(j => j.type === selectedTruck.type || selectedTruck.type === "10t").sort((a, b) => b.profit - a.profit).slice(0, 4).map((job) => (
              <div key={job.id} onClick={() => handleAssign(selectedTruck, job)}
                style={{
                  background: COLORS.surface2, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: "14px 16px",
                  cursor: "pointer", transition: "all 0.2s", display: "flex", justifyContent: "space-between", alignItems: "center",
                  borderLeft: `3px solid ${sourceColor(job.source)}`,
                }}
                onMouseOver={(e) => { e.currentTarget.style.borderColor = sourceColor(job.source); e.currentTarget.style.background = COLORS.surface3; }}
                onMouseOut={(e) => { e.currentTarget.style.borderColor = COLORS.border; e.currentTarget.style.background = COLORS.surface2; }}
              >
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                    <span style={{ color: sourceColor(job.source) }}>[{job.label}]</span> {job.from} → {job.to}
                  </div>
                  <div style={{ fontSize: 11, color: COLORS.text3 }}>
                    {job.time} / {job.type}
                    {job.auto && <span style={{ marginLeft: 8, fontSize: 10, background: `${COLORS.green}20`, color: COLORS.green, padding: "1px 6px", borderRadius: 4, fontWeight: 600 }}>⚡自動落札</span>}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: COLORS.green }}>{fmt(job.profit)}</div>
                  <div style={{ fontSize: 10, color: COLORS.text3 }}>運賃 {fmt(job.fare)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Available Jobs */}
      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>📋 全案件一覧（{AVAILABLE_JOBS.length}件）</div>
      <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 14, overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "80px 1fr 80px 90px 90px", padding: "10px 16px", background: COLORS.surface2, fontSize: 10, color: COLORS.text3, fontWeight: 600, letterSpacing: "0.04em" }}>
          <div>ソース</div><div>ルート</div><div>車種</div><div>運賃</div><div>利益予測</div>
        </div>
        {AVAILABLE_JOBS.sort((a, b) => b.profit - a.profit).map((j) => (
          <div key={j.id} style={{ display: "grid", gridTemplateColumns: "80px 1fr 80px 90px 90px", padding: "12px 16px", borderBottom: `1px solid ${COLORS.border}`, fontSize: 12, alignItems: "center" }}>
            <span style={{ color: sourceColor(j.source), fontWeight: 600, fontSize: 11 }}>{sourceIcon(j.source)} {j.label.replace("トラボックス", "トラボ")}</span>
            <span style={{ color: COLORS.text }}>{j.from}→{j.to}{j.auto ? " ⚡" : ""}</span>
            <span style={{ color: COLORS.text2 }}>{j.type}</span>
            <span style={{ color: COLORS.text2 }}>{fmt(j.fare)}</span>
            <span style={{ color: COLORS.green, fontWeight: 700 }}>{fmt(j.profit)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============ LINE CHAT TAB ============
function LineChat() {
  const [activeScenario, setActiveScenario] = useState(0);
  const [visibleMessages, setVisibleMessages] = useState([]);
  const [msgIndex, setMsgIndex] = useState(0);
  const chatRef = useRef(null);
  const scenario = LINE_SCENARIOS[activeScenario];

  useEffect(() => {
    setVisibleMessages([]);
    setMsgIndex(0);
  }, [activeScenario]);

  useEffect(() => {
    if (msgIndex < scenario.messages.length) {
      const delay = scenario.messages[msgIndex].from === "bot" ? 800 : 400;
      const timer = setTimeout(() => {
        setVisibleMessages((prev) => [...prev, scenario.messages[msgIndex]]);
        setMsgIndex((prev) => prev + 1);
      }, delay);
      return () => clearTimeout(timer);
    }
  }, [msgIndex, activeScenario]);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [visibleMessages]);

  return (
    <div style={{ display: "flex", gap: 16, height: "calc(100vh - 200px)", minHeight: 500, flexWrap: "wrap" }}>
      {/* Scenario Selector */}
      <div style={{ width: 200, minWidth: 160, display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.text2, marginBottom: 4 }}>シナリオ選択</div>
        {LINE_SCENARIOS.map((s, i) => (
          <button key={i} onClick={() => setActiveScenario(i)}
            style={{
              background: i === activeScenario ? COLORS.surface3 : COLORS.surface,
              border: `1px solid ${i === activeScenario ? COLORS.lineGreen : COLORS.border}`,
              borderRadius: 10, padding: "10px 14px", color: COLORS.text,
              fontSize: 12, fontWeight: 600, cursor: "pointer", textAlign: "left",
              transition: "all 0.2s",
            }}>
            {s.name}
          </button>
        ))}
        <div style={{ marginTop: "auto", padding: 14, background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 10, fontSize: 11, color: COLORS.text3, lineHeight: 1.6 }}>
          💡 各シナリオをクリックすると、LINE Botとのやり取りをリアルタイムで再現します
        </div>
      </div>

      {/* Chat Window */}
      <div style={{ flex: 1, minWidth: 300, display: "flex", flexDirection: "column", background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 16, overflow: "hidden" }}>
        {/* Header */}
        <div style={{ background: COLORS.lineGreen, padding: "14px 20px", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🚛</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: "#fff" }}>MAI配車AI</div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.7)" }}>空車自動配車管理システム</div>
          </div>
        </div>

        {/* Messages */}
        <div ref={chatRef} style={{
          flex: 1, overflow: "auto", padding: 16,
          background: `linear-gradient(180deg, ${COLORS.surface2} 0%, ${COLORS.bg} 100%)`,
        }}>
          <div style={{ textAlign: "center", fontSize: 10, color: COLORS.text3, marginBottom: 16, padding: "4px 12px", background: COLORS.surface3, borderRadius: 10, display: "inline-block", marginLeft: "auto", marginRight: "auto", width: "fit-content", position: "relative", left: "50%", transform: "translateX(-50%)" }}>
            2026年2月24日（月）
          </div>
          {visibleMessages.map((m, i) => (
            <div key={i} style={{
              display: "flex", justifyContent: m.from === "user" ? "flex-end" : "flex-start",
              marginBottom: 10, animation: "slideUp 0.3s ease",
            }}>
              {m.from === "bot" && <div style={{ width: 30, height: 30, borderRadius: 8, background: COLORS.lineGreen, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, marginRight: 8, flexShrink: 0, marginTop: 2 }}>🤖</div>}
              <div style={{
                maxWidth: "80%", padding: "10px 14px", borderRadius: 14,
                background: m.from === "user" ? COLORS.lineGreen : COLORS.surface,
                color: m.from === "user" ? "#fff" : COLORS.text,
                fontSize: 12.5, lineHeight: 1.7, whiteSpace: "pre-wrap",
                borderBottomRightRadius: m.from === "user" ? 4 : 14,
                borderBottomLeftRadius: m.from === "bot" ? 4 : 14,
                border: m.from === "bot" ? `1px solid ${COLORS.border}` : "none",
              }}>
                {m.text}
              </div>
            </div>
          ))}
          {msgIndex < scenario.messages.length && (
            <div style={{ display: "flex", gap: 8, alignItems: "center", padding: "8px 0" }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: COLORS.lineGreen, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>🤖</div>
              <div style={{ display: "flex", gap: 4 }}>
                {[0, 1, 2].map((d) => (
                  <div key={d} style={{
                    width: 7, height: 7, borderRadius: "50%", background: COLORS.text3,
                    animation: `bounce 1s ease-in-out ${d * 0.15}s infinite`,
                  }} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div style={{ padding: "12px 16px", borderTop: `1px solid ${COLORS.border}`, background: COLORS.surface, display: "flex", gap: 10, alignItems: "center" }}>
          <div style={{ flex: 1, background: COLORS.surface2, border: `1px solid ${COLORS.border}`, borderRadius: 20, padding: "8px 16px", fontSize: 12, color: COLORS.text3 }}>
            メッセージを入力（デモ）
          </div>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: COLORS.lineGreen, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, cursor: "pointer" }}>▶</div>
        </div>
      </div>
    </div>
  );
}

// ============ PROFIT ANALYSIS TAB ============
function ProfitAnalysis() {
  const entries = Object.entries(MONTHLY_DATA);
  const total = entries.reduce((a, [, d]) => a + d.profit, 0);
  const totalRev = entries.reduce((a, [, d]) => a + d.revenue, 0);
  const maxRev = Math.max(...entries.map(([, d]) => d.revenue));

  const routes = [
    { route: "北九州→大阪", count: 8, avgProfit: 19000, trend: "+5%" },
    { route: "福岡→名古屋", count: 6, avgProfit: 31000, trend: "+12%" },
    { route: "北九州→東京", count: 5, avgProfit: 42000, trend: "+3%" },
    { route: "小倉→広島", count: 7, avgProfit: 11000, trend: "-2%" },
    { route: "福岡→鳥栖", count: 12, avgProfit: 6500, trend: "+8%" },
    { route: "博多→下関", count: 4, avgProfit: 5200, trend: "+1%" },
  ];

  const truckPerf = TRUCKS.filter(t => t.status !== "maintenance").map((t, i) => ({
    ...t, monthJobs: [12, 10, 11, 8, 14, 9][i] || 8,
    monthProfit: [380000, 310000, 350000, 180000, 420000, 150000][i] || 200000,
    utilization: [92, 85, 88, 75, 95, 80][i] || 80,
  }));

  return (
    <div>
      {/* Top KPIs */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <StatCard icon="💰" label="月間純利益" value={fmt(total)} sub={`売上 ${fmt(totalRev)}`} color={COLORS.green} />
        <StatCard icon="📊" label="平均利益率" value={`${Math.round(total / totalRev * 100)}%`} sub="目標 40%" color={COLORS.cyan} />
        <StatCard icon="🏆" label="最高利益ルート" value="福岡→名古屋" sub="平均利益 ¥31,000" color={COLORS.orange} />
        <StatCard icon="⚡" label="最高効率ソース" value="Amazon Relay" sub="時間あたり ¥68,000" color={COLORS.amazonOrange} />
      </div>

      <div style={{ display: "flex", gap: 16, marginBottom: 20, flexWrap: "wrap" }}>
        {/* Revenue Bar Chart */}
        <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: 20, flex: 1, minWidth: 320 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 16 }}>💰 サイト別 売上 vs 利益</div>
          {entries.map(([key, d]) => {
            const name = { amazon: "Amazon", trabox: "トラボ", webkit: "WebKIT", jl: "JLネット", direct: "直取引" }[key];
            return (
              <div key={key} style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 4 }}>
                  <span style={{ color: sourceColor(key), fontWeight: 700 }}>{sourceIcon(key)} {name}</span>
                  <span style={{ color: COLORS.text2 }}>{fmt(d.revenue)} / <span style={{ color: COLORS.green }}>{fmt(d.profit)}</span></span>
                </div>
                <div style={{ display: "flex", gap: 3, height: 16 }}>
                  <div style={{ width: `${(d.revenue / maxRev) * 100}%`, height: "100%", background: `${sourceColor(key)}30`, borderRadius: 4, position: "relative" }}>
                    <div style={{ width: `${(d.profit / d.revenue) * 100}%`, height: "100%", background: sourceColor(key), borderRadius: 4 }} />
                  </div>
                </div>
                <div style={{ fontSize: 10, color: COLORS.text3, marginTop: 2 }}>利益率 {d.rate}% / {d.jobs}件</div>
              </div>
            );
          })}
        </div>

        {/* Route Analysis */}
        <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: 20, flex: 1, minWidth: 300 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>🗺️ ルート別利益ランキング</div>
          {routes.sort((a, b) => b.avgProfit - a.avgProfit).map((r, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: i < routes.length - 1 ? `1px solid ${COLORS.border}` : "none" }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600 }}>
                  <span style={{ color: COLORS.text3, marginRight: 8, fontSize: 11 }}>#{i + 1}</span>
                  {r.route}
                </div>
                <div style={{ fontSize: 10, color: COLORS.text3 }}>{r.count}件/月</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.green }}>{fmt(r.avgProfit)}</div>
                <div style={{ fontSize: 10, color: r.trend.startsWith("+") ? COLORS.green : COLORS.red }}>{r.trend}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Truck Performance */}
      <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>🚛 車両別パフォーマンス</div>
        <div style={{ overflowX: "auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "100px 100px 70px 90px 100px 1fr", padding: "10px 16px", background: COLORS.surface2, borderRadius: 8, fontSize: 10, color: COLORS.text3, fontWeight: 600, gap: 8, minWidth: 600, letterSpacing: "0.04em" }}>
            <div>車両</div><div>ドライバー</div><div>稼働率</div><div>月間件数</div><div>月間利益</div><div>稼働率バー</div>
          </div>
          {truckPerf.sort((a, b) => b.monthProfit - a.monthProfit).map((t) => (
            <div key={t.id} style={{ display: "grid", gridTemplateColumns: "100px 100px 70px 90px 100px 1fr", padding: "12px 16px", borderBottom: `1px solid ${COLORS.border}`, fontSize: 12, alignItems: "center", gap: 8, minWidth: 600 }}>
              <span style={{ fontWeight: 700 }}>{t.id}号</span>
              <span style={{ color: COLORS.text2 }}>{t.driver}</span>
              <span style={{ color: t.utilization >= 90 ? COLORS.green : t.utilization >= 80 ? COLORS.yellow : COLORS.red, fontWeight: 700 }}>{t.utilization}%</span>
              <span style={{ color: COLORS.text2 }}>{t.monthJobs}件</span>
              <span style={{ color: COLORS.green, fontWeight: 700 }}>{fmt(t.monthProfit)}</span>
              <div><MiniBar value={t.utilization} max={100} color={t.utilization >= 90 ? COLORS.green : t.utilization >= 80 ? COLORS.yellow : COLORS.orange} /></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============ MAIN APP ============
export default function App() {
  const [tab, setTab] = useState("dashboard");
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const tabs = [
    { id: "dashboard", label: "📊 ダッシュボード" },
    { id: "dispatch", label: "🚛 配車ボード" },
    { id: "line", label: "💬 LINE Bot" },
    { id: "profit", label: "💰 利益分析" },
  ];

  return (
    <div style={{ fontFamily: "'Noto Sans JP', -apple-system, sans-serif", background: COLORS.bg, minHeight: "100vh", color: COLORS.text }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@300;400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: ${COLORS.bg}; }
        ::-webkit-scrollbar-thumb { background: ${COLORS.surface3}; border-radius: 3px; }
        @keyframes slideUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes bounce { 0%, 80%, 100% { transform: translateY(0); } 40% { transform: translateY(-6px); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
      `}</style>

      {/* Header */}
      <div style={{ padding: "16px 24px", borderBottom: `1px solid ${COLORS.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, background: `linear-gradient(180deg, ${COLORS.surface} 0%, ${COLORS.bg} 100%)` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: `linear-gradient(135deg, ${COLORS.blue}, ${COLORS.cyan})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 900, color: "#fff" }}>M</div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, letterSpacing: "-0.02em" }}>MAI 配車AI管理システム</div>
            <div style={{ fontSize: 10, color: COLORS.text3 }}>合同会社MAIパートナーズ — デモ版</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: COLORS.green, animation: "pulse 2s infinite" }} />
            <span style={{ fontSize: 11, color: COLORS.green, fontWeight: 600 }}>AIアクティブ</span>
          </div>
          <div style={{ fontSize: 12, color: COLORS.text2, fontFamily: "'JetBrains Mono', monospace" }}>
            {time.toLocaleTimeString("ja-JP")}
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={{ display: "flex", gap: 4, padding: "12px 24px", overflowX: "auto", borderBottom: `1px solid ${COLORS.border}` }}>
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{
              padding: "8px 18px", borderRadius: 10, fontSize: 12.5, fontWeight: 600,
              border: "none", cursor: "pointer", whiteSpace: "nowrap",
              background: tab === t.id ? COLORS.surface3 : "transparent",
              color: tab === t.id ? COLORS.text : COLORS.text2,
              transition: "all 0.2s",
              outline: tab === t.id ? `1px solid ${COLORS.borderLight}` : "1px solid transparent",
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: "20px 24px", maxWidth: 1200, margin: "0 auto" }}>
        {tab === "dashboard" && <Dashboard />}
        {tab === "dispatch" && <DispatchBoard />}
        {tab === "line" && <LineChat />}
        {tab === "profit" && <ProfitAnalysis />}
      </div>
    </div>
  );
}
