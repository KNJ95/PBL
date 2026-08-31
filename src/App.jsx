import { useState, useEffect, useMemo } from "react";
import {
  Home, ClipboardList, BookOpen, LogOut,
  ChevronRight, Trash2, Save, Star,
  Users, MessageSquare, ThumbsUp, Zap, TrendingUp,
  Send, X,
  HelpCircle, Info, ChevronLeft
} from "lucide-react";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  ResponsiveContainer, Legend, Tooltip
} from "recharts";

// ─── カラーパレット ─────────────────────────────────────────────────────────
const C = {
  primary:      "#A100FF",
  primaryDark:  "#7500C0",
  primaryLight: "#E8CCFF",
  bg:           "#f5f3ff",
  surface:      "#ffffff",
  surface2:     "#f0eeff",
  surface3:     "#e4dff5",
  border:       "rgba(117,0,192,0.15)",
  borderLight:  "rgba(117,0,192,0.1)",
  text:         "#1a0030",
  textSub:      "#6b5f8a",
  textMuted:    "#a09abf",
  accent1:      "#0088aa",
  accent2:      "#cc3333",
  success:      "#007a52",
  warn:         "#7a5900",
};

// ─── 評価定数 ──────────────────────────────────────────────────────────────
const AXES = [
  { id:1, key:"axis1", name:"課題設定力",      short:"課題",  category:"A", ref:false, evalText:"仕事について自分の視点からその価値・意味を理解しているか" },
  { id:2, key:"axis2", name:"情報活用力",      short:"情報",  category:"A", ref:false, evalText:"必要な情報を収集・整理し、意思決定や行動に活かせるか" },
  { id:3, key:"axis3", name:"不確実性への耐性", short:"不確実",category:"A", ref:false, evalText:"不確実性の高い仕事でも粘り強くかつ柔軟に取り組めるか" },
  { id:4, key:"axis4", name:"提案・発信力",    short:"提案",  category:"B", ref:false, evalText:"やるべき・やりたいと考えることを他者に伝えられるか" },
  { id:5, key:"axis5", name:"実行・改善力",    short:"実行",  category:"B", ref:false, evalText:"他でもない自分のこととして粘り強く関われるか" },
  { id:6, key:"axis6", name:"オーナーシップ",  short:"責任",  category:"B", ref:false, evalText:"やりたいと思っているか・意味を自分なりに理解できているか" },
  { id:7, key:"axis7", name:"協働・調整力",    short:"協働",  category:"C", ref:false, evalText:"他者の意見を取り入れつつ柔軟に対応できるか" },
  { id:8, key:"axis8", name:"自律・内発的動機", short:"動機",  category:"C", ref:false, evalText:"自分なりの理由・動機を持ってやりたいと語れるか" },
  { id:9, key:"axis9", name:"行動変容力",      short:"変容",  category:"C", ref:false, evalText:"フィードバックを行動の変化につなげられるか" },
];

// 0626ルーブリック準拠のレベル定義
const LEVELS = [
  { lv:1, name:"受動性", color:"#6B7280", def:"対象を外から（外在的視点）見て、傍観者的・人ごと的にただ知っているだけの状態" },
  { lv:2, name:"能動性", color:C.accent1, def:"他者の立場に立てば確かにそう思える、となっている状態" },
  { lv:3, name:"自律性", color:C.primary, def:"他者ではなく、自分の視点から見て確かにそう思える、となっている状態" },
  { lv:4, name:"創造性", color:C.warn,    def:"自らの行為・経験から新たにやりたい・やるべきことを見つけ出している" },
];

const LEVEL_COLOR = { 1:"#6B7280", 2:C.accent1, 3:C.primary, 4:C.warn };

const RUBRIC_DATA = {
  1: { levels: [
    "他者から示された課題を受け売り的に知っているだけで、自分ごとして課題を受け取れていない。",
    "他者（管理者）の課題感を他者の視点から理解・共有できており、それを意識している。ただしあくまで他者の課題を理解しているに過ぎず、自分の課題として取り組んでいるわけではない。",
    "他者から与えられた課題について、自分なりの根拠（原因・理由）を見つけ出し納得できている。",
    "他者に与えられた課題ではなく、自分の経験から課題をオリジナルに設定している。",
  ]},
  2: { levels: null },
  3: { levels: [
    "指示される仕事の価値や意味を理解しておらず、与えられた仕事しか取り組まない。不確実性や偶発性に直面した段階で諦めてしまう。",
    "上司から説明されることで「そう言うのも分かる」という理解で仕事に取り組み、不確実性に直面しても一応柔軟に対応しようとする。ただし他者視点での理解にすぎないため耐性は強くない。",
    "自分自身がやるべき・やりたいと思うようになっているので、不確実性にできるだけ対応しようとするし、そうした状況への耐性が強い。",
    "仕事を指示されるのではなく、自らやるべき・やりたい仕事を見出して行為している。そもそも模索的に行為しているので耐性は非常に強い。",
  ]},
  4: { levels: [
    "与えられた仕事をこなしているだけなので、自ら意見を伝えたり提案を行うことはない。",
    "仕事の価値や意味を管理者の立場から理解しているだけなので、提案や意見の発信は少ないかほとんどない。",
    "仕事の価値や意味を自分のこととして理解しているので、提案や意見を自ら発信しようとする。",
    "そもそも自分で始めたことなので、積極的に自らの提案や意見を発信しようとする。",
  ]},
  5: { levels: [
    "与えられた仕事をこなしているだけなので、すぐに諦めるし最後までやりきろうとする粘り強さはない。",
    "仕事の価値や意味を管理者の立場から理解しているだけなので、改善しながらやりきろうとはするが粘り強さはない。",
    "仕事の価値や意味を自分のこととして理解しているので、できるだけ改善しつつ粘り強くやりきろうとする。",
    "そもそも自分で始めたことなので、継続的に改善を繰り返し最後までやりきろうとする。",
  ]},
  6: { levels: [
    "与えられた仕事をこなしているだけなので、人ごと的に取り組んでいて無責任。",
    "仕事の価値や意味を管理者の立場から理解しているだけなので、ひとまず当事者的に取り組むものの責任感は弱い。",
    "仕事の価値や意味を自分のこととして理解しているので、責任を持って取り組もうとする。",
    "そもそも自分で始めたことなので、責任を持って取り組むし、孤立しても最後までやりきろうとする。",
  ]},
  7: { levels: [
    "与えられた仕事をこなしているだけなので、他者とのコミュニケーションは最低限か避けようとする。",
    "仕事の価値や意味を管理者の立場からは理解しており必要に応じて協働に取り組めるが、煩わしい人間関係には脆弱でコミュニケーションを諦めてしまいやすい。",
    "仕事の価値や意味を自分のこととして理解しているので、必要があれば積極的にコミュニケーションを取り協働しようとする。",
    "そもそも自分で始めたことなので、必要があれば他者とのコミュニケーションを取るし、協働にも積極的に関与する。",
  ]},
  8: { levels: null },
  9: { levels: [
    "与えられた仕事をただこなしているだけなので、FBがあるだけでは自分から行動変容を起こせず、他者が改めて指示を出す必要がある。",
    "一応当事者的にその仕事をすべき・したい理由を理解しているので、FBがあれば対応しようとする。ただし微修正はできるものの根本的な行動の変化は起こしにくい。",
    "自分自身の仕事として飲み込めているので、FBがあれば自分自身の成果を上げるために行為を変えようとする。根本的な変容が求められる場合も対応できる。",
    "自分自身の問題意識で始めた取り組みなので、もともとが模索的な行為となっている。FBを他者にもらうことなく、自分自身で柔軟に状況に対応しながら行為する。",
  ]},
};

const STUDENT_TUTORIAL_STEPS = [
  {
    title: "Be-Readyへようこそ",
    icon: "⭐",
    tab: null,
    content: "このアプリは、PBLの活動を通じてあなたの成長を「Be-Ready人材」の観点で記録・可視化するツールです。\n\n自己評価・メンター評価・AI分析を組み合わせて、あなたの強みと成長ポイントを明らかにします。",
    visual: "radar",
  },
  {
    title: "ホーム画面",
    icon: "🏠",
    tab: "ホーム",
    content: "【できること】\n• レーダーチャートで自己評価とメンター評価を比較\n• 過去の評価の推移をグラフで確認\n• ネクストアクション（次の目標）を設定・管理\n\n【使い方】\n画面下のナビから「ホーム」を選択。チャートをタップするとスコアの詳細が確認できます。",
    visual: "home",
  },
  {
    title: "アンケートタブ",
    icon: "📋",
    tab: "アンケート",
    content: "【できること】\n• 9つの評価軸について自分で採点（1〜4）\n• 期・日付を選んで保存\n• 回答途中でも「下書き保存」されるので安心\n\n【使い方】\n各質問に回答 → 期と日付を入力 → 「回答を保存する」を押す。\n保存後はホームのレーダーチャートに反映されます。",
    visual: "survey",
  },
  {
    title: "振り返りタブ",
    icon: "📝",
    tab: "振り返り",
    content: "【できること】\n• 活動の振り返りをメンターに提出\n• メンチメーター形式（10段階スライダー）で回答\n• 提出するとメンターが採点・フィードバックできる\n\n【使い方】\n各質問に回答 → 「振り返りを提出する」を押す。\nメンターが採点すると「フィードバック」タブに結果が届きます。",
    visual: "student",
  },
  {
    title: "問いタブ",
    icon: "💬",
    tab: "問い",
    content: "【できること】\n• メンターからあなた宛に届いた「問い」を確認\n• 問いに対して自分の考えを回答して送信\n\n【使い方】\n未回答の問いは赤いバッジで表示されます。\n問いをタップして回答を入力 → 「回答する」を押す。",
    visual: "question",
  },
];

const MENTOR_TUTORIAL_STEPS = [
  {
    title: "Be-Readyへようこそ",
    icon: "⭐",
    tab: null,
    content: "このアプリは、PBL学生の成長を「Be-Ready人材」の観点で評価・支援するメンター向けツールです。\n\n学生の自己評価への他者評価付与・振り返り採点・問いの送信を一元管理できます。",
    visual: "radar",
  },
  {
    title: "学生/評価タブ",
    icon: "👥",
    tab: "学生/評価",
    content: "【できること】\n• 担当学生の一覧を確認（同じチームIDの学生のみ表示）\n• 学生を選択してレーダーチャート・評価履歴を確認\n• 「評価を入力」フォームで他者評価スコアを記録\n\n【使い方】\n学生名をタップして選択 → チャート下のフォームで各軸を採点 → 「評価を保存」を押す。\n軸名の横の ⓘ をタップすると採点基準（ルーブリック）を確認できます。",
    visual: "mentor",
  },
  {
    title: "採点タブ",
    icon: "✅",
    tab: "採点",
    content: "【できること】\n• 学生が提出した振り返りを一覧で確認\n• 振り返り内容を読んで9軸でスコアを付ける\n• AIによる採点提案を参考にして効率化\n\n【使い方】\n「採点する」ボタンを押す → 振り返り内容を確認 → 各軸のスコアを選択 → 「他者評価を確定・承認する」を押す。\n軸名をタップするとルーブリック（採点基準）が表示されます。",
    visual: "scoring",
  },
  {
    title: "問いタブ",
    icon: "❓",
    tab: "問い",
    content: "【できること】\n• 担当学生に「問い」を送信して思考を促す\n• 全学生への問いと回答状況を一覧で確認\n• 「回答済」「未回答」のステータスをひと目で把握\n\n【使い方】\n学生をドロップダウンで選択 → 問いを入力 → 「送信」を押す。\n送信済みの問いは画面下部に一覧表示されます。",
    visual: "question",
  },
];



const REFLECTION_QUESTIONS = [
  { id:1, text:"以前に比べて積極的に発言できましたか？" },
  { id:2, text:"新たに学んだことはありましたか？" },
  { id:3, text:"思うように行かなかったことや困ったことはありましたか？" },
  { id:4, text:"失敗したなーと後悔したシーンはありましたか？" },
  { id:5, text:"チームと協力して動けましたか？" },
  { id:6, text:"自分から課題や問題を見つけようとしましたか？" },
  { id:7, text:"今日の活動への満足度はどのくらいですか？" },
];

// ─── 深堀り設定（選択肢の値 1〜4 ごとに変化） ──────────────────
function getDrillConfig(mainValue) {
  if (mainValue === 1) {
    return {
      d1q: "どんな状況でそうなりましたか？",
      d1opts: ["時間や余裕がなかった", "どうすればよいか分からなかった", "その必要性を感じなかった", "気づかなかった"],
      d2q: "次回どう取り組みますか？",
      d2opts: ["まず自分で考える時間をつくる", "チームや周囲に聞いてみる", "具体的な方法を調べる", "意識して変えてみる"],
    };
  }
  if (mainValue === 2) {
    return {
      d1q: "どこまで取り組めましたか？",
      d1opts: ["ざっくりとした方向性を考えた", "いくつかの案を出してみた", "もう少し深く考えたかった", "時間が足りなかった"],
      d2q: "次回どう深めますか？",
      d2opts: ["もう少し時間をかけて考える", "考えを言葉や図にしてみる", "チームで話し合う", "メモに整理してみる"],
    };
  }
  if (mainValue === 3) {
    return {
      d1q: "どうやって取り組みましたか？",
      d1opts: ["紙やメモに書き出した", "チームと話し合って整理した", "頭の中で考えを組み立てた", "過去の経験を参考にした"],
      d2q: "さらに深めるためには？",
      d2opts: ["整理の質をさらに上げる", "チームにも共有・展開する", "違う視点からも考えてみる", "引き続き同じように続ける"],
    };
  }
  // value === 4
  return {
    d1q: "どんなきっかけでそうできましたか？",
    d1opts: ["チームの異なる意見を聞いた", "一歩引いて全体を見た", "「なぜ？」と繰り返し問いかけた", "過去の経験から学んだ"],
    d2q: "この強みをどう活かしますか？",
    d2opts: ["チームにも広めてみる", "次の課題でも同じように取り組む", "さらに深い分析に挑戦する", "他のメンバーに伝えてみる"],
  };
}

const EMOTIONS = ["😢","😕","😐","🙂","😄"];

const DEMO_EXAMPLES = [
  { text:"チームの意見がバラバラで困ったが、先生に聞いて解決した。", scores:{1:1,2:1,3:1,4:1,5:1,6:1,7:1,8:2,9:1} },
  { text:"課題の原因を自分なりに分析し、インタビューを設計して実施した。", scores:{1:3,2:3,3:3,4:2,5:2,6:3,7:3,8:3,9:2} },
];

// ─── ストレージ（localStorage + DynamoDB 二重書き） ───────────────────────
const CLOUD_API = "https://lov5ejwmxbqzci5gagmcrzr3ia0qphjl.lambda-url.ap-northeast-1.on.aws";
let _cloudUid = null;

const storage = {
  get: (k) => { try { const v=localStorage.getItem(k); return v?JSON.parse(v):null; } catch { return null; } },
  set: (k,v) => {
    try { localStorage.setItem(k,JSON.stringify(v)); } catch {}
    if (_cloudUid) fetch(CLOUD_API, { method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ userId:_cloudUid, dataKey:k, payload:JSON.stringify(v) }) }).catch(()=>{});
  },
  del: (k) => {
    try { localStorage.removeItem(k); } catch {}
    if (_cloudUid) fetch(`${CLOUD_API}?userId=${encodeURIComponent(_cloudUid)}&dataKey=${encodeURIComponent(k)}`,
      { method:"DELETE" }).catch(()=>{});
  },
  keys: (prefix) => { try { return Object.keys(localStorage).filter(k=>k.startsWith(prefix)); } catch { return []; } },
  setUser: (uid) => { _cloudUid = uid; },
  clearUser: () => { _cloudUid = null; },
  // skipKeys: 上書きしないキーのSet（他ユーザー同期時に current_user 等を保護）
  syncFromCloud: async (uid, skipKeys = new Set()) => {
    try {
      const r = await fetch(`${CLOUD_API}?userId=${encodeURIComponent(uid)}`);
      const json = await r.json();
      if (json.ok && Array.isArray(json.data)) {
        json.data.forEach(item => { try { if (item.payload && !skipKeys.has(item.dataKey)) localStorage.setItem(item.dataKey, item.payload); } catch {} });
      }
    } catch {}
  },
};

// パスワードを SHA-256 でハッシュ化（Web Crypto API）
const hashPassword = async (pw) => {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(pw));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,"0")).join("");
};

// DynamoDB からユーザープロファイルを取得
const fetchUserProfile = async (userId) => {
  try {
    const r = await fetch(`${CLOUD_API}?userId=${encodeURIComponent(userId)}&dataKey=user_profile`);
    const json = await r.json();
    if (json.ok && json.data?.payload) return JSON.parse(json.data.payload);
  } catch {}
  return null;
};

const getStudents = () => storage.get("students_list") || [];
const getSurveys  = (uid) => storage.keys(`survey:${uid}:`).map(k=>storage.get(k)).filter(Boolean).sort((a,b)=>b.timestamp-a.timestamp);
const getLogs     = (uid) => storage.keys(`log:${uid}:`).map(k=>storage.get(k)).filter(Boolean).sort((a,b)=>b.timestamp-a.timestamp);
const getMentorSurveys = (sid) => storage.keys(`mentor_survey:${sid}:`).map(k=>storage.get(k)).filter(Boolean).sort((a,b)=>b.timestamp-a.timestamp);

// ─── インタラクション（問い/フィードバック）localStorage ──────────────────
const getQuestions  = () => storage.get("questions_store") || [];
const getFeedbacks  = () => storage.get("feedbacks_store") || [];
// pending_evals は学生ごとのキー pending_evals:{studentId} で管理
// （PC/スマホ切替でも上書きされないよう per-student 化）
const getPending = () => {
  // 新形式: pending_evals:{studentId}
  const perStudent = storage.keys("pending_evals:").flatMap(k => {
    const v = storage.get(k); return Array.isArray(v) ? v : [];
  });
  // 旧形式（移行期間の互換読み込み）
  const legacy = storage.get("pending_evals");
  const all = [...perStudent, ...(Array.isArray(legacy) ? legacy : [])];
  // id 重複除去
  const seen = new Set();
  return all.filter(p => { if (seen.has(p.id)) return false; seen.add(p.id); return true; });
};

const saveQuestions = (d) => storage.set("questions_store", d);
const savePending = (list) => {
  // studentId ごとにグループ化して保存
  const grouped = {};
  list.forEach(p => {
    if (!p.studentId) return;
    if (!grouped[p.studentId]) grouped[p.studentId] = [];
    grouped[p.studentId].push(p);
  });
  // リストから消えた studentId のキーを削除
  storage.keys("pending_evals:").forEach(k => {
    const sid = k.slice("pending_evals:".length);
    if (!grouped[sid]) storage.del(k);
  });
  // 各 studentId のデータを保存
  Object.entries(grouped).forEach(([sid, entries]) => {
    storage.set(`pending_evals:${sid}`, entries);
  });
  // 旧形式 localStorage キーを削除（DynamoDB の旧エントリは自然消滅）
  try { localStorage.removeItem("pending_evals"); } catch {}
};

// ─── スタイル ──────────────────────────────────────────────────────────────
const S = {
  card:      { background:C.surface,  border:`1px solid ${C.border}`,  borderRadius:14, padding:"1.25rem", marginBottom:"0.875rem" },
  cardGlow:  { background:C.surface,  border:`1px solid ${C.primary}44`, borderRadius:14, padding:"1.25rem", marginBottom:"0.875rem", boxShadow:`0 0 24px ${C.primary}18` },
  scard:     { background:C.surface2, border:`1px solid ${C.border}`,  borderRadius:10, padding:"0.875rem 1rem", marginBottom:"0.5rem" },
  btn:       { cursor:"pointer", padding:"7px 18px", borderRadius:9, border:`1px solid ${C.border}`, background:"transparent", color:C.text, fontSize:13, fontFamily:"inherit", transition:"all 0.15s" },
  btnPrimary:{ cursor:"pointer", padding:"8px 20px", borderRadius:9, border:"none", background:`linear-gradient(135deg, ${C.primary}, ${C.primaryDark})`, color:"#fff", fontSize:13, fontFamily:"inherit", fontWeight:600, boxShadow:`0 4px 14px ${C.primary}44` },
  btnSuccess:{ cursor:"pointer", padding:"8px 20px", borderRadius:9, border:"none", background:C.success, color:"#000", fontSize:13, fontFamily:"inherit", fontWeight:600 },
  input:     { width:"100%", padding:"10px 13px", borderRadius:9, border:`1px solid ${C.border}`, background:C.surface2, color:C.text, fontSize:16, fontFamily:"inherit", outline:"none", boxSizing:"border-box", transition:"border-color 0.2s" },
  textarea:  { width:"100%", padding:"10px 13px", borderRadius:9, border:`1px solid ${C.border}`, background:C.surface2, color:C.text, fontSize:16, fontFamily:"inherit", resize:"vertical", minHeight:72, outline:"none", boxSizing:"border-box" },
  badge:     (lv) => ({ display:"inline-block", padding:"2px 10px", borderRadius:6, background:LEVEL_COLOR[lv]+"22", color:LEVEL_COLOR[lv], fontSize:11, fontWeight:600, border:`1px solid ${LEVEL_COLOR[lv]}44` }),
  navBtn:    (a)  => ({ cursor:"pointer", padding:"7px 15px", borderRadius:8, border:`1px solid ${a?C.primary:C.border}`, background:a?C.primary+"22":"transparent", color:a?C.primary:C.textSub, fontSize:13, fontFamily:"inherit", fontWeight:a?700:400, transition:"all 0.15s" }),
  tag:       (c)  => ({ display:"inline-block", padding:"2px 9px", borderRadius:6, background:c+"22", color:c, fontSize:11, fontWeight:600, border:`1px solid ${c}44` }),
};

const fmt = (ts) => { const d=new Date(ts); return `${d.getFullYear()}/${String(d.getMonth()+1).padStart(2,"0")}/${String(d.getDate()).padStart(2,"0")}`; };
const avg = (arr) => arr.length ? (arr.reduce((a,b)=>a+b,0)/arr.length) : 0;
const axisAvg = (scores) => { if(!scores) return 0; const v=AXES.map(a=>scores[a.id]||0).filter(x=>x>0); return v.length?avg(v):0; };

// ─── 共通コンポーネント ────────────────────────────────────────────────────
function Avatar({ name, size=36, color=C.primary }) {
  return (
    <div style={{ width:size, height:size, borderRadius:"50%", background:color+"22", border:`1.5px solid ${color}66`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:size*0.38, fontWeight:700, color, flexShrink:0 }}>
      {name?.[0] ?? "?"}
    </div>
  );
}


// ─── チャットボット型振り返り設問 ────────────────────────────────────────────
const CHATBOT_QUESTIONS = [
  {
    id: "q1",
    text: "今日の活動で、自分なりに考えることができましたか？",
    options: [
      { v:4, l:"十分できた",          e:"😄" },
      { v:3, l:"だいたいできた",       e:"😊" },
      { v:2, l:"あまりできなかった",    e:"😕" },
      { v:1, l:"全くできなかった",      e:"😢" },
    ],
    getFollowUp: (v) => v===4 ? "どんな点で特に深く考えられましたか？"
                      : v<=2  ? "何が妨げになりましたか？"
                      : null,
  },
  {
    id: "q2",
    text: "気づきや学びはありましたか？",
    options: [
      { v:4, l:"多くあった",           e:"😄" },
      { v:3, l:"まあまああった",        e:"😊" },
      { v:2, l:"あまりなかった",        e:"😕" },
      { v:1, l:"全くなかった",          e:"😢" },
    ],
    getFollowUp: (v) => v===4 ? "どんな気づきでしたか？"
                      : v<=2  ? "振り返ってみて、気づいたことはありますか？"
                      : null,
  },
  {
    id: "q3",
    text: "自分の考えや意見をチーム・関係者に伝えられましたか？",
    options: [
      { v:4, l:"十分伝えられた",        e:"😄" },
      { v:3, l:"だいたい伝えられた",     e:"😊" },
      { v:2, l:"あまり伝えられなかった",  e:"😕" },
      { v:1, l:"全く伝えられなかった",    e:"😢" },
    ],
    getFollowUp: (v) => v<=2 ? "なぜ伝えにくかったと思いますか？" : null,
  },
];


// ─── 軸スコア計算（survey_questions.json の回答から） ─────────────────────
function calcAxesFromAnswers(answers, allQuestions) {
  const raw = {}, maxs = {};
  allQuestions.forEach(q => {
    const val = answers[q.id];
    if (!val || val === 0) return;
    Object.entries(q.axisWeights || {}).forEach(([axId, w]) => {
      raw[axId]  = (raw[axId]  || 0) + val * w;
      maxs[axId] = (maxs[axId] || 0) + 4  * w;
    });
  });
  const axes = {};
  Object.keys(raw).forEach(axId => {
    if (maxs[axId] > 0) {
      const ratio = raw[axId] / maxs[axId];
      axes[String(axId)] = Math.max(1, Math.min(4, Math.round(ratio * 4)));
    }
  });
  return axes;
}

// ─── メインアプリ ──────────────────────────────────────────────────────────
export default function App() {
  const [currentUser, setCurrentUser] = useState(() => storage.get("current_user"));
  const [screen, setScreen]           = useState("home");
  const [refresh, setRefresh]         = useState(0);
  const tick = () => setRefresh(r => r + 1);

  // 学生用 state
  const [activityTitle, setActivityTitle] = useState("");           // ログ：活動タイトル
  const [activityType, setActivityType]   = useState("self");       // ログ："official" | "self"
  const [logAnswers, setLogAnswers] = useState({});                    // ログ：REFLECTION_QUESTIONS 1-10スライダー
  const [logMemo, setLogMemo] = useState("");                          // 活動概要メモ
  const [logDate, setLogDate] = useState(() => new Date().toISOString().slice(0,10));         // ログ日付
  const [reflectionDate, setReflectionDate] = useState(() => new Date().toISOString().slice(0,10)); // 振り返り日付
  const [reflectionDone, setReflectionDone] = useState(false);
  const [reflectionAnswers, setReflectionAnswers]   = useState({});    // 振り返りアンケート回答（survey_json用）
  const [surveyDef, setSurveyDef]                   = useState(null);  // survey_questions.json
  const [surveyLoadErr, setSurveyLoadErr]           = useState(null);  // JSONロードエラー
  const [reflectionTarget, setReflectionTarget]     = useState("");    // 振り返り対象
  const [reflectionPhase, setReflectionPhase]       = useState("target"); // "target"|"survey"
  const [reflectionStep, setReflectionStep]         = useState(0);     // 現在の問い番号（0..N-1）
  const [drillAnswers, setDrillAnswers]             = useState({});    // 問ごと深堀り { [qId]: {d1,d2choice,d2text} }
  const [logPopup, setLogPopup]                     = useState(null);  // 過去ログポップアップ
  const [projEditState, setProjEditState]           = useState({ name:"", summary:"" }); // プロジェクト情報編集用
  const [projSaved, setProjSaved]                   = useState(false); // 保存完了フラッシュ

  // チュートリアル・ポップアップ state
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [rubricAxis, setRubricAxis]     = useState(null);

  // メンター用 state
  const [selStudent, setSelStudent]   = useState(null);
  const [mentorScores, setMentorScores] = useState({});
  const [mentorNote, setMentorNote]   = useState("");
  const [scoringTarget, setScoringTarget] = useState(null);
  const [aiLoading, setAiLoading]     = useState(false);
  const [aiResult, setAiResult]       = useState(null);
  const [answerMap, setAnswerMap]     = useState({});
  const [mentorUncertain, setMentorUncertain] = useState({}); // #14 判定迷いフラグ { [axisId]: boolean }
  const [showAllAnswers, setShowAllAnswers]   = useState(false); // 採点画面：全回答表示トグル

  // ログイン
  const [loginId, setLoginId]             = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginProjectId, setLoginProjectId] = useState("");   // セッション用プロジェクトID（複数PJ対応）
  const [loginLoading, setLoginLoading]   = useState(false);
  const [loginError, setLoginError]       = useState("");
  const [tempUser, setTempUser]           = useState(null);
  const [tempProfile, setTempProfile]     = useState(null);
  const [newPassword, setNewPassword]         = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [profileName, setProfileName]           = useState("");
  const [profileProjectId, setProfileProjectId] = useState("");
  // フィードバック
  const [fbOpen, setFbOpen]         = useState(false);
  const [fbRating, setFbRating]     = useState(0);
  const [fbText, setFbText]         = useState("");
  const [fbSent, setFbSent]         = useState(false);
  const [fbScreen, setFbScreen]     = useState("");

  const login = (u) => {
    storage.setUser(u.id);
    storage.set("current_user", u);
    setCurrentUser(u);
    setScreen("home");
    if (!storage.get("tutorial_seen")) { setShowTutorial(true); setTutorialStep(0); }
    storage.syncFromCloud(u.id).then(() => tick());
  };
  const logout = () => { storage.clearUser(); storage.del("current_user"); setCurrentUser(null); setScreen("home"); };

  const handleLogin = async () => {
    if (!loginId.trim() || !loginPassword.trim()) return;
    setLoginLoading(true); setLoginError("");
    const profile = await fetchUserProfile(loginId.trim());
    if (!profile) { setLoginError("IDが存在しません。管理者に確認してください。"); setLoginLoading(false); return; }
    const hash = await hashPassword(loginPassword);
    const matchesCurrent = hash === profile.passwordHash;
    const matchesInitial  = profile.initialPasswordHash && hash === profile.initialPasswordHash;
    if (!matchesCurrent && !matchesInitial) { setLoginError("パスワードが違います。"); setLoginLoading(false); return; }
    // loginProjectId が入力されていればそのプロジェクトでセッション開始、なければプロフィールのデフォルトを使用
    const sessionProjectId = loginProjectId.trim() || profile.projectId;
    const u = { id: loginId.trim(), name: profile.name, role: profile.role, projectId: sessionProjectId };
    if (profile.isFirstLogin || matchesInitial) {
      setTempUser(u); setTempProfile(profile); setProfileName(profile.name === "氏名" ? "" : profile.name); setProfileProjectId(""); setScreen("changePassword");
    } else {
      if (u.role === "student") {
        const list = getStudents();
        if (!list.find(s => s.id === u.id)) {
          storage.set("students_list", [...list, { id:u.id, name:u.name, projectId:u.projectId, registeredAt:Date.now() }]);
        }
      }
      login(u);
    }
    setLoginLoading(false);
  };

  const openFeedback = () => { setFbScreen(screen); setFbRating(0); setFbText(""); setFbSent(false); setFbOpen(true); };
  const submitFeedback = () => {
    if (!fbRating) return;
    const key = `feedback:${currentUser.id}:${Date.now()}`;
    storage.set(key, { userId: currentUser.id, userName: currentUser.name, role: currentUser.role,
      projectId: currentUser.projectId, screen: fbScreen, rating: fbRating, text: fbText.trim(),
      submittedAt: Date.now() });
    setFbSent(true);
    setTimeout(() => setFbOpen(false), 1500);
  };

  const handleChangePassword = async () => {
    if (!profileName.trim()) { setLoginError("氏名を入力してください。"); return; }
    if (!profileProjectId.trim()) { setLoginError("プロジェクトIDを入力してください。"); return; }
    if (newPassword.length < 8) { setLoginError("パスワードは8文字以上にしてください。"); return; }
    if (newPassword !== confirmPassword) { setLoginError("パスワードが一致しません。"); return; }
    setLoginLoading(true);
    const hash = await hashPassword(newPassword);
    const updatedProfile = { ...tempProfile, name: profileName.trim(), projectId: profileProjectId.trim(), passwordHash: hash, isFirstLogin: false };
    await fetch(CLOUD_API, { method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ userId: tempUser.id, dataKey:"user_profile", payload: JSON.stringify(updatedProfile) }) });
    const finalUser = { ...tempUser, name: profileName.trim(), projectId: profileProjectId.trim() };
    if (finalUser.role === "student") {
      const list = getStudents();
      if (!list.find(s => s.id === finalUser.id)) {
        storage.set("students_list", [...list, { id:finalUser.id, name:finalUser.name, projectId:finalUser.projectId, registeredAt:Date.now() }]);
      }
    }
    login(finalUser);
    setLoginLoading(false);
  };

  // ページリロード後の自動復元（localStorage に currentUser が残っている場合）
  useEffect(() => {
    if (currentUser?.id) {
      storage.setUser(currentUser.id);
      storage.syncFromCloud(currentUser.id).then(() => tick());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // プロジェクト情報をストレージから読み込んで編集ステートに反映
  useEffect(() => {
    if (currentUser?.id) {
      const projKey = `project_info:${currentUser.id}`;
      const info = storage.get(projKey) || {};
      setProjEditState({ name: info.name || "", summary: info.summary || "" });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id]);

  // survey_questions.json の読み込み（振り返りアンケート用）
  useEffect(() => {
    fetch("/survey_questions.json")
      .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(d => setSurveyDef(d))
      .catch(e => setSurveyLoadErr(e.message));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── データ取得 ──────────────────────────────────────────────────────────
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const mySurveys  = useMemo(() => currentUser ? getSurveys(currentUser.id)  : [], [currentUser, refresh]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const myLogs     = useMemo(() => currentUser ? getLogs(currentUser.id)     : [], [currentUser, refresh]);
  const latestSurvey = mySurveys[0] || null;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const students   = useMemo(() => {
    const all = getStudents();
    if (currentUser?.projectId) return all.filter(s => s.projectId === currentUser.projectId);
    return all;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, refresh]);

  // メンター: 担当学生全員のデータをクラウドから同期（ログ・振り返り日表示のため）
  // students 定義の後に置くこと（no-use-before-define 対策）
  // current_user・tutorial_seen はメンター自身のセッションを上書きしないよう除外
  useEffect(() => {
    if (currentUser?.role === "mentor" && students.length > 0) {
      const skip = new Set(["current_user", "tutorial_seen"]);
      Promise.all(students.map(st => storage.syncFromCloud(st.id, skip))).then(() => tick());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id, students.length]);

  // メンター: 採点タブを開くたびに再同期（学生がログイン後に提出した分を拾う）
  useEffect(() => {
    if (currentUser?.role === "mentor" && screen === "scoring" && students.length > 0) {
      const skip = new Set(["current_user", "tutorial_seen"]);
      Promise.all(students.map(st => storage.syncFromCloud(st.id, skip))).then(() => tick());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen]);

  // ─── レーダーチャートデータ ───────────────────────────────────────────
  const radarData = (selfSurvey, mentorSurvey) =>
    AXES.map(a => ({
      subject: a.ref ? `${a.short}※` : a.short,
      自己: selfSurvey?.axes?.[a.id] || 0,
      他者: mentorSurvey?.axes?.[a.id] || 0,
      fullMark: 4,
    }));



  // ─── 学生：ログ保存 ───────────────────────────────────────────────────
  const saveLog = () => {
    if (!activityTitle.trim() && Object.keys(logAnswers).length === 0) return;
    const ts = logDate ? new Date(logDate).setHours(12,0,0,0) : Date.now();
    storage.set(`log:${currentUser.id}:${ts}`, {
      userID: currentUser.id, timestamp: ts,
      activityTitle: activityTitle.trim() || "活動記録",
      activityType,
      logAnswers, logMemo,
    });
    setActivityTitle(""); setActivityType("self");
    setLogAnswers({}); setLogMemo("");
    setLogDate(new Date().toISOString().slice(0,10)); tick();
  };

  // ─── 学生：振り返り提出 ───────────────────────────────────────────────
  const submitReflection = (answers, mode, comment="", nextAction="", allQs=[], extra={}) => {
    let summary;
    if (mode === "chatbot") {
      summary = CHATBOT_QUESTIONS.map(q => {
        const a = answers[q.id];
        if (!a) return "";
        const fu = q.getFollowUp(a.v);
        const line = `${q.text} → ${a.e} ${a.l}`;
        return (fu && a.followUp) ? `${line}\n  └ ${a.followUp}` : line;
      }).filter(Boolean).join("\n");
      if (nextAction) summary += `\n\n⚡ 次回の行動：${nextAction}`;
    } else if (mode === "survey_json") {
      const answered = Object.keys(answers).length;
      const targetLine = reflectionTarget ? `対象：${reflectionTarget}\n` : "";
      const drills = extra.drillAnswers || {};
      const d1lines = Object.values(drills).filter(d=>d.d1).map(d=>`・${d.d1}`).join("\n");
      const d2lines = Object.values(drills).filter(d=>d.d2choice).map(d=>`・${d.d2choice}${d.d2text?`（${d.d2text}）`:""}`).join("\n");
      summary = `${targetLine}アンケート振り返り（${answered}問回答）` +
        (d1lines ? `\n\n[深堀り]\n${d1lines}` : "") +
        (d2lines ? `\n\n[ネクストアクション]\n${d2lines}` : "") +
        (comment ? `\n\nコメント：${comment}` : "");
    } else {
      summary = REFLECTION_QUESTIONS.map(q => `${q.text} → ${typeof answers[q.id]==="number"?answers[q.id]+"/10":answers[q.id]}`).join("\n") + (comment?`\n\nコメント：${comment}`:"");
    }
    const pending = getPending();
    const axes = (mode === "survey_json" && allQs.length > 0) ? calcAxesFromAnswers(answers, allQs) : {};
    const refTs = reflectionDate ? new Date(reflectionDate).setHours(12,0,0,0) : Date.now();
    savePending([...pending, { id:"pe"+refTs, studentId:currentUser.id, date:reflectionDate || fmt(Date.now()), reflection:summary, answers, mode, nextAction, axes, drillAnswers:extra.drillAnswers||{}, status:"pending" }]);
    setReflectionDate(new Date().toISOString().slice(0,10));
    tick();
    setReflectionDone(true);
  };

  // ─── メンター：AI採点 ─────────────────────────────────────────────────
  const runAI = async (text) => {
    setAiLoading(true); setAiResult(null);
    try {
      const ex = DEMO_EXAMPLES.map((e,i) =>
        `【事例${i+1}】「${e.text}」採点:${AXES.map(a=>`${a.name}=${e.scores[a.id]}`).join("、")}`
      ).join("\n");
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body:JSON.stringify({
          model:"claude-sonnet-4-20250514",
          max_tokens:1000,
          messages:[{ role:"user", content:`PBL評価専門家として9軸4段階で採点。【軸】${AXES.map(a=>`${a.id}.${a.name}`).join("、")}【段階】1=受動性,2=能動性,3=自律性,4=創造性【事例】${ex}【対象】「${text}」JSONのみ:{"scores":{"1":数値,...,"9":数値},"rationale":{"1":"根拠",...,"9":"根拠"}}` }]
        })
      });
      const data = await res.json();
      const parsed = JSON.parse(data.content.map(c=>c.text||"").join("").replace(/```json|```/g,"").trim());
      const scores = {};
      Object.entries(parsed.scores).forEach(([k,v]) => scores[parseInt(k)] = parseInt(v));
      setAiResult({ scores, rationale:parsed.rationale });
      setMentorScores({ ...scores });
    } catch(e) { alert("AI採点失敗: " + e.message); }
    setAiLoading(false);
  };

  // ─── メンター：他者評価承認 ──────────────────────────────────────────
  const approveEval = (pending) => {
    const ts = Date.now();
    storage.set(`mentor_survey:${pending.studentId}:${ts}`, {
      studentId:pending.studentId, mentorId:currentUser.id,
      timestamp:ts, axes:{ ...mentorScores }, note:mentorNote, aiSuggested:aiResult?.scores,
      reflection:pending.reflection,
      uncertain: mentorUncertain, // #14 判定迷いフラグ { [axisId]: boolean }
    });
    const newPending = getPending().filter(p => p.id !== pending.id);
    savePending(newPending);
    setAiResult(null); setMentorScores({}); setMentorNote(""); setScoringTarget(null); setMentorUncertain({}); tick();
    alert("他者評価を確定しました。");
  };

  // ─── 学生：問い回答 ──────────────────────────────────────────────────
  const submitAnswer = (qid) => {
    const ans = answerMap[qid] || "";
    if (!ans.trim()) return;
    const qs = getQuestions().map(q => q.id===qid ? {...q, answer:ans} : q);
    saveQuestions(qs); setAnswerMap(m => ({...m,[qid]:""})); tick();
  };

  // ─────────────────────────────────────────────────────────────────────
  // ログイン画面
  // ─────────────────────────────────────────────────────────────────────
  // ─── 初回パスワード変更画面 ───────────────────────────────────────────
  if (screen === "changePassword") return (
    <div style={{ minHeight:"100vh", background:C.bg, display:"flex", alignItems:"center", justifyContent:"center", padding:"1rem", fontFamily:"system-ui,sans-serif" }}>
      <div style={{ width:"100%", maxWidth:420 }}>
        <div style={{ textAlign:"center", marginBottom:"2rem" }}>
          <div style={{ width:56, height:56, borderRadius:14, background:"#f59e0b22", border:"1.5px solid #f59e0b66", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 1rem" }}>
            <Star size={26} color="#f59e0b"/>
          </div>
          <h1 style={{ fontSize:22, fontWeight:700, color:C.text, margin:"0 0 6px" }}>パスワードを変更してください</h1>
          <p style={{ color:C.textSub, fontSize:13, margin:0 }}>初回ログインのため、新しいパスワードを設定してください</p>
        </div>
        <div style={{ ...S.card, padding:"1.75rem" }}>
          <div style={{ marginBottom:14 }}>
            <label style={{ fontSize:12, color:C.textSub, display:"block", marginBottom:6 }}>氏名</label>
            <input value={profileName} onChange={e=>setProfileName(e.target.value)} placeholder="例：山田 太郎" style={S.input}/>
            <p style={{ fontSize:11, color:C.textMuted, margin:"5px 0 0" }}>アプリ内で表示される名前です。正確に入力してください。</p>
          </div>
          <div style={{ marginBottom:14 }}>
            <label style={{ fontSize:12, color:C.textSub, display:"block", marginBottom:6 }}>プロジェクトID</label>
            <input value={profileProjectId} onChange={e=>setProfileProjectId(e.target.value)} placeholder="例：PBL-2026-001" style={S.input}/>
            <p style={{ fontSize:11, color:C.textMuted, margin:"5px 0 0" }}>担当教員またはメンターから配布されたIDを入力してください。</p>
          </div>
          <div style={{ marginBottom:14 }}>
            <label style={{ fontSize:12, color:C.textSub, display:"block", marginBottom:6 }}>新しいパスワード（8文字以上）</label>
            <input type="password" value={newPassword} onChange={e=>setNewPassword(e.target.value)} placeholder="新しいパスワード" style={S.input}/>
          </div>
          <div style={{ marginBottom:20 }}>
            <label style={{ fontSize:12, color:C.textSub, display:"block", marginBottom:6 }}>パスワード（確認）</label>
            <input type="password" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} placeholder="もう一度入力" onKeyDown={e=>e.key==="Enter"&&handleChangePassword()} style={S.input}/>
          </div>
          {loginError && <p style={{ fontSize:12, color:"#dc2626", marginBottom:12 }}>{loginError}</p>}
          <button style={{ ...S.btnPrimary, width:"100%", padding:"11px", fontSize:14, borderRadius:10, opacity:loginLoading?0.6:1 }}
            onClick={handleChangePassword} disabled={loginLoading}>
            {loginLoading ? "設定中..." : "登録してログイン"}
          </button>
        </div>
      </div>
    </div>
  );

  // ─── ログイン画面 ─────────────────────────────────────────────────────
  if (!currentUser) return (
    <div style={{ minHeight:"100vh", background:C.bg, display:"flex", alignItems:"center", justifyContent:"center", padding:"1rem", fontFamily:"system-ui,sans-serif" }}>
      <div style={{ width:"100%", maxWidth:420 }}>
        <div style={{ textAlign:"center", marginBottom:"2rem" }}>
          <div style={{ width:56, height:56, borderRadius:14, background:C.primary+"22", border:`1.5px solid ${C.primary}66`, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 1rem", boxShadow:`0 0 32px ${C.primary}33` }}>
            <Star size={26} color={C.primary}/>
          </div>
          <h1 style={{ fontSize:24, fontWeight:700, color:C.text, margin:"0 0 6px", letterSpacing:-0.5 }}>Be-Ready ポートフォリオ</h1>
          <p style={{ color:C.textSub, fontSize:13, margin:0 }}>Project-Based Learning Portfolio</p>
        </div>
        <div style={{ ...S.card, padding:"1.75rem" }}>
          <div style={{ marginBottom:14 }}>
            <label style={{ fontSize:12, color:C.textSub, display:"block", marginBottom:6 }}>ユーザーID</label>
            <input value={loginId} onChange={e=>setLoginId(e.target.value)} placeholder="配布されたIDを入力" style={S.input}/>
          </div>
          <div style={{ marginBottom:14 }}>
            <label style={{ fontSize:12, color:C.textSub, display:"block", marginBottom:6 }}>パスワード</label>
            <input type="password" value={loginPassword} onChange={e=>setLoginPassword(e.target.value)} placeholder="パスワードを入力" style={S.input}/>
          </div>
          {/* プロジェクトID（複数PJ参加学生向け） */}
          <div style={{ marginBottom:20, padding:"12px 14px", background:C.surface2, borderRadius:10, border:`1px solid ${C.border}` }}>
            <label style={{ fontSize:12, color:C.textSub, display:"block", marginBottom:6 }}>
              プロジェクトID
              <span style={{ marginLeft:6, fontSize:10, color:C.textMuted, fontWeight:400 }}>（複数プロジェクトに参加している場合）</span>
            </label>
            <input
              value={loginProjectId}
              onChange={e=>setLoginProjectId(e.target.value)}
              onKeyDown={e=>e.key==="Enter"&&handleLogin()}
              placeholder="例：PBL-2026-001"
              style={S.input}
            />
            <p style={{ fontSize:10, color:C.textMuted, margin:"5px 0 0", lineHeight:1.5 }}>
              空欄の場合はデフォルトのプロジェクトでログインします
            </p>
          </div>
          {loginError && <p style={{ fontSize:12, color:"#dc2626", marginBottom:12 }}>{loginError}</p>}
          <button
            style={{ ...S.btnPrimary, width:"100%", padding:"11px", fontSize:14, borderRadius:10, opacity:(loginLoading||!loginId.trim()||!loginPassword.trim())?0.5:1 }}
            onClick={handleLogin} disabled={loginLoading||!loginId.trim()||!loginPassword.trim()}
          >
            {loginLoading ? "確認中..." : <>ログイン <ChevronRight size={16} style={{ verticalAlign:"middle" }}/></>}
          </button>
        </div>
        <p style={{ fontSize:11, color:C.textMuted, textAlign:"center", marginTop:14 }}>IDとパスワードは管理者から配布されます</p>
      </div>
    </div>
  );

  // ─── 共通ヘッダー ─────────────────────────────────────────────────────
  const Header = () => (
    <div style={{ borderBottom:`1px solid ${C.border}`, padding:"0.875rem 1.5rem", display:"flex", alignItems:"center", justifyContent:"space-between", background:C.surface, position:"sticky", top:0, zIndex:20, backdropFilter:"blur(12px)" }}>
      <button style={{ background:"none", border:"none", cursor:"pointer", display:"flex", alignItems:"center", gap:10, padding:0 }} onClick={() => setScreen("home")}>
        <Star size={16} color={C.primary}/>
        <div>
          <span style={{ fontSize:15, fontWeight:700, color:C.primary, letterSpacing:-0.3 }}>Be-Ready</span>
          {currentUser?.projectId && (
            <span style={{ display:"block", fontSize:10, color:C.textMuted, lineHeight:1, marginTop:1 }}>
              📁 {currentUser.projectId}
            </span>
          )}
        </div>
      </button>
      <div style={{ display:"flex", gap:8, alignItems:"center" }}>
        <button style={{ ...S.btn, padding:"5px 10px", fontSize:11, display:"flex", alignItems:"center", gap:4 }} onClick={()=>{ setTutorialStep(0); setShowTutorial(true); }}>
          <HelpCircle size={12}/>チュートリアル
        </button>
        <button style={{ ...S.btn, padding:"5px 12px", fontSize:12 }} onClick={logout}><LogOut size={13} style={{ verticalAlign:"middle" }}/> ログアウト</button>
      </div>
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────
  // メンター採点画面（フルスクリーン）
  // ─────────────────────────────────────────────────────────────────────
  if (currentUser.role==="mentor" && scoringTarget) {
    const p = scoringTarget;
    return (
      <div style={{ minHeight:"100vh", background:C.bg, color:C.text, fontFamily:"system-ui,sans-serif" }}>
        <Header/>
        <div style={{ maxWidth:780, margin:"0 auto", padding:`1.5rem 1.5rem calc(2rem + env(safe-area-inset-bottom))` }}>
          <button style={{ ...S.btn, marginBottom:"1rem" }} onClick={()=>{setScoringTarget(null);setAiResult(null);setMentorScores({});}}>← 戻る</button>
          <div style={S.cardGlow}>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
              <Avatar name={p.studentId} size={34}/>
              <div>
                <p style={{ margin:0, fontWeight:700, fontSize:14 }}>{students.find(s=>s.id===p.studentId)?.name || p.studentId}</p>
                <p style={{ margin:0, fontSize:12, color:C.textSub }}>{p.date} · {p.mode==="chatbot"?"チャットボット形式":p.mode==="mentimeter"?"メンチメーター形式":"振り返り"}</p>
              </div>
            </div>

            {/* 振り返り内容 */}
            <div style={{ marginBottom:"1.25rem" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom: showAllAnswers ? 8 : 0 }}>
                <p style={{ fontSize:12, fontWeight:700, color:C.textSub, margin:0, letterSpacing:"0.06em", textTransform:"uppercase" }}>振り返り回答内容（全体）</p>
                <button onClick={()=>setShowAllAnswers(v=>!v)} style={{ background:"none", border:`1px solid ${C.border}`, borderRadius:6, cursor:"pointer", padding:"3px 10px", fontSize:11, color:C.primary }}>
                  {showAllAnswers ? "▲ 閉じる" : "▼ 全回答を見る"}
                </button>
              </div>
              {showAllAnswers && <div style={{ background:C.surface2, borderRadius:10, padding:"0.875rem" }}>
                {p.mode==="chatbot" && p.answers ? (
                  <div>
                    {CHATBOT_QUESTIONS.map((q, i) => {
                      const a = p.answers[q.id];
                      if (!a) return null;
                      const fu = q.getFollowUp(a.v);
                      return (
                        <div key={q.id} style={{ marginBottom: i<CHATBOT_QUESTIONS.length-1?14:0, paddingBottom: i<CHATBOT_QUESTIONS.length-1?14:0, borderBottom: i<CHATBOT_QUESTIONS.length-1?`1px solid ${C.border}`:"none" }}>
                          <p style={{ fontSize:12, color:C.textSub, margin:"0 0 6px", lineHeight:1.5 }}>{q.text}</p>
                          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                            <span style={{ fontSize:18 }}>{a.e}</span>
                            <span style={{ fontSize:13, fontWeight:700, color:C.text }}>{a.l}</span>
                            <span style={{ fontSize:11, padding:"2px 8px", borderRadius:20, background:C.primary+"18", color:C.primary, fontWeight:700 }}>{a.v}/4</span>
                          </div>
                          {fu && a.followUp && <p style={{ fontSize:12, color:C.textSub, margin:"6px 0 0", paddingLeft:10, borderLeft:`2px solid ${C.border}`, lineHeight:1.5 }}>{a.followUp}</p>}
                        </div>
                      );
                    })}
                    {p.nextAction && (
                      <div style={{ marginTop:12, padding:"8px 12px", background:`${C.success}12`, borderRadius:8, borderLeft:`3px solid ${C.success}` }}>
                        <p style={{ fontSize:11, fontWeight:700, color:C.success, margin:"0 0 2px" }}>⚡ 次回の行動</p>
                        <p style={{ fontSize:13, color:C.text, margin:0, lineHeight:1.5 }}>{p.nextAction}</p>
                      </div>
                    )}
                  </div>
                ) : p.mode==="survey_json" && p.answers && surveyDef ? (
                  // survey_json（15問アンケート）回答表示
                  <div>
                    {surveyDef.sections.flatMap(s=>s.questions).map((q, i, allQs) => {
                      const val = p.answers[q.id];
                      const opt = q.options?.find(o => o.value === val);
                      const drill = p.drillAnswers?.[q.id];
                      return (
                        <div key={q.id} style={{ marginBottom: i<allQs.length-1?14:0, paddingBottom: i<allQs.length-1?14:0, borderBottom: i<allQs.length-1?`1px solid ${C.border}`:"none" }}>
                          <p style={{ fontSize:11, color:C.textMuted, margin:"0 0 3px" }}>Q{i+1}</p>
                          <p style={{ fontSize:12, color:C.textSub, margin:"0 0 5px", lineHeight:1.5 }}>{q.text}</p>
                          {opt ? (
                            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                              <span style={{ fontSize:12, fontWeight:700, padding:"3px 10px", borderRadius:20,
                                background: val===0?C.surface3:C.primary+"18", color: val===0?C.textMuted:C.primary,
                                border:`1px solid ${val===0?C.border:C.primary+"44"}` }}>
                                {val===0?"—":` Lv.${val}`}
                              </span>
                              <span style={{ fontSize:13, color:C.text }}>{opt.label}</span>
                            </div>
                          ) : <span style={{ fontSize:12, color:C.textMuted }}>未回答</span>}
                          {drill?.d1 && (
                            <p style={{ fontSize:11, color:C.textSub, margin:"5px 0 0", paddingLeft:10, borderLeft:`2px solid ${C.primary}44` }}>
                              🔍 {drill.d1}
                              {drill.d2choice && <><br/>⚡ {drill.d2choice}{drill.d2text?`（${drill.d2text}）`:""}</>}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : p.mode==="survey_json" && p.answers ? (
                  // surveyDef未ロード時はテキスト表示
                  <p style={{ fontSize:13, color:C.textSub, whiteSpace:"pre-line", margin:0, lineHeight:1.7 }}>{p.reflection}</p>
                ) : p.answers ? REFLECTION_QUESTIONS.map((q, i) => {
                  const val = p.answers[q.id] || 0;
                  return (
                    <div key={q.id} style={{ marginBottom: i < REFLECTION_QUESTIONS.length-1 ? 14 : 0, paddingBottom: i < REFLECTION_QUESTIONS.length-1 ? 14 : 0, borderBottom: i < REFLECTION_QUESTIONS.length-1 ? `1px solid ${C.border}` : "none" }}>
                      <p style={{ fontSize:13, color:C.text, margin:"0 0 8px", lineHeight:1.5 }}>{q.text}</p>
                      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                        <div style={{ flex:1, height:7, background:C.surface3, borderRadius:99, overflow:"hidden" }}>
                          <div style={{ height:"100%", width:`${(val/10)*100}%`, background:`linear-gradient(90deg,${C.primary},${C.accent1})`, borderRadius:99 }}/>
                        </div>
                        <span style={{ fontSize:14, fontWeight:700, color:C.primary, minWidth:38, textAlign:"right" }}>
                          {val}<span style={{ fontSize:10, fontWeight:400, color:C.textSub }}>/10</span>
                        </span>
                      </div>
                    </div>
                  );
                }) : <p style={{ fontSize:13, color:C.textSub, whiteSpace:"pre-line", margin:0, lineHeight:1.7 }}>{p.reflection}</p>}
              </div>}
            </div>

            {/* AI採点ボタン */}
            <div style={{ display:"flex", gap:10, alignItems:"center", marginBottom:"1.5rem" }}>
              <button style={{ ...S.btnPrimary, opacity:aiLoading?0.6:1, display:"flex", alignItems:"center", gap:6 }} onClick={()=>runAI(p.reflection)} disabled={aiLoading}>
                <Zap size={14}/>{aiLoading?"AI採点中…":"✦ AIで他者評価を生成"}
              </button>
              {aiResult && <span style={{ fontSize:12, color:C.success, fontWeight:600 }}>✓ 確認・修正して承認してください</span>}
            </div>

            {/* 採点 */}
            <p style={{ fontSize:13, fontWeight:700, marginBottom:4, color:C.text }}>他者評価スコア</p>
            <p style={{ fontSize:12, color:C.textSub, marginBottom:"1rem" }}>1=受動性　2=能動性　3=自律性　4=創造性　迷った場合は「迷った」にチェック</p>
            {AXES.map(a => {
              const aiScore = aiResult?.scores[a.id];
              const cur = mentorScores[a.id] || aiScore || 1;
              const isUncertain = !!mentorUncertain[a.id];
              return (
                <div key={a.id} style={{ marginBottom:12, paddingBottom:12, borderBottom:`1px solid ${C.border}`,
                  background: isUncertain ? `${C.warn}08` : "transparent", borderRadius: isUncertain ? 8 : 0, padding: isUncertain ? "8px 10px" : 0 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
                    <div>
                      <button onClick={()=>setRubricAxis(a)} style={{ background:"none", border:"none", cursor:"pointer", padding:0, display:"inline-flex", alignItems:"center", gap:5, fontSize:13, color:C.text, fontWeight:600 }} title="採点基準を見る">
                        {a.name}
                        <Info size={13} color={C.primary}/>
                      </button>
                      {aiScore && <p style={{ margin:0, fontSize:11, color:C.primary }}>AI提案: Lv.{aiScore}</p>}
                    </div>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      {mentorScores[a.id]!==undefined && aiScore && mentorScores[a.id]!==aiScore && <span style={S.tag(C.warn)}>修正済</span>}
                      {/* #14 軸ごと迷いフラグ */}
                      <label style={{ display:"flex", alignItems:"center", gap:4, cursor:"pointer", fontSize:11,
                        color: isUncertain ? C.warn : C.textMuted, fontWeight: isUncertain ? 700 : 400 }}>
                        <input
                          type="checkbox"
                          checked={isUncertain}
                          onChange={e => setMentorUncertain(prev => ({ ...prev, [a.id]: e.target.checked }))}
                          style={{ width:13, height:13, accentColor:C.warn, cursor:"pointer" }}
                        />
                        {isUncertain ? "⚠️ 迷った" : "迷った"}
                      </label>
                    </div>
                  </div>
                  <div style={{ display:"flex", gap:6, marginBottom:4 }}>
                    {[1,2,3,4].map(s => (
                      <button key={s} onClick={()=>setMentorScores(sc=>({...sc,[a.id]:s}))} style={{ flex:1, padding:"8px 0", borderRadius:7, border:`1px solid ${cur===s?C.primary:C.border}`, background:cur===s?C.primary+"22":"transparent", color:cur===s?C.primary:C.textSub, fontSize:13, cursor:"pointer", fontWeight:cur===s?700:400, transition:"all 0.15s" }}>{s}</button>
                    ))}
                  </div>
                  {aiResult?.rationale?.[a.id] && <p style={{ fontSize:11, color:C.textMuted, margin:0, lineHeight:1.5 }}>{aiResult.rationale[a.id]}</p>}
                  {/* 関連回答インライン表示（survey_json のみ） */}
                  {p.mode==="survey_json" && surveyDef && (() => {
                    const axisQs = surveyDef.sections.flatMap(s=>s.questions).filter(q => (q.axisWeights?.[a.id] || 0) > 0);
                    if (!axisQs.length) return null;
                    return (
                      <div style={{ marginTop:8, padding:"8px 10px", background:C.surface2, borderRadius:8 }}>
                        <p style={{ fontSize:10, color:C.textMuted, margin:"0 0 6px", fontWeight:700, letterSpacing:"0.05em" }}>この軸に関連する学生の回答</p>
                        {axisQs.map((q, qi) => {
                          const val = p.answers?.[q.id];
                          const opt = q.options?.find(o => o.value === val);
                          const drill = p.drillAnswers?.[q.id];
                          return (
                            <div key={q.id} style={{ paddingBottom: qi<axisQs.length-1?8:0, marginBottom: qi<axisQs.length-1?8:0, borderBottom: qi<axisQs.length-1?`1px solid ${C.border}`:"none" }}>
                              <p style={{ fontSize:11, color:C.textSub, margin:"0 0 3px", lineHeight:1.4 }}>{q.text}</p>
                              {opt ? (
                                <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                                  <span style={{ fontSize:11, fontWeight:700, padding:"2px 7px", borderRadius:20,
                                    background:val===0?C.surface3:C.primary+"18", color:val===0?C.textMuted:C.primary,
                                    border:`1px solid ${val===0?C.border:C.primary+"44"}` }}>
                                    {val===0?"—":`Lv.${val}`}
                                  </span>
                                  <span style={{ fontSize:12, color:C.text }}>{opt.label}</span>
                                </div>
                              ) : <span style={{ fontSize:11, color:C.textMuted }}>未回答</span>}
                              {drill?.d1 && val !== 0 && (
                                <p style={{ fontSize:10, color:C.textSub, margin:"3px 0 0", paddingLeft:8, borderLeft:`2px solid ${C.primary}44`, lineHeight:1.4 }}>
                                  🔍 {drill.d1}
                                  {drill.d2choice && <><br/>⚡ {drill.d2choice}{drill.d2text?`（${drill.d2text}）`:""}</>}
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
              );
            })}
            <textarea value={mentorNote} onChange={e=>setMentorNote(e.target.value)} placeholder="メンターコメント（任意）" style={{ ...S.textarea, marginBottom:12 }}/>
            <button style={S.btnSuccess} onClick={()=>approveEval(p)}>他者評価を確定・承認する</button>
          </div>
        </div>

        {/* ─── ルーブリックポップアップ */}
        {rubricAxis && (
          <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.55)", zIndex:100, display:"flex", alignItems:"center", justifyContent:"center", padding:"1rem" }} onClick={()=>setRubricAxis(null)}>
            <div style={{ background:C.surface, borderRadius:20, padding:"1.5rem", width:"100%", maxWidth:560, maxHeight:"85vh", overflowY:"auto", boxShadow:"0 20px 60px rgba(0,0,0,0.3)" }} onClick={e=>e.stopPropagation()}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"0.5rem" }}>
                <p style={{ margin:0, fontWeight:700, fontSize:16, color:C.text }}>{rubricAxis.name}</p>
                <button onClick={()=>setRubricAxis(null)} style={{ background:"none", border:"none", cursor:"pointer", color:C.textMuted }}><X size={20}/></button>
              </div>
              <p style={{ fontSize:12, color:C.textSub, marginBottom:"1.25rem", lineHeight:1.6 }}>{rubricAxis.evalText}</p>
              {RUBRIC_DATA[rubricAxis.id]?.levels ? (
                LEVELS.map((lv, i) => (
                  <div key={lv.lv} style={{ borderLeft:`4px solid ${lv.color}`, padding:"10px 14px", marginBottom:10, background:C.surface2, borderRadius:"0 10px 10px 0" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
                      <span style={{ fontWeight:700, fontSize:13, color:lv.color }}>Lv.{lv.lv} {lv.name}</span>
                    </div>
                    <p style={{ margin:0, fontSize:13, color:C.text, lineHeight:1.65 }}>{RUBRIC_DATA[rubricAxis.id].levels[i]}</p>
                  </div>
                ))
              ) : (
                <p style={{ fontSize:13, color:C.textSub, padding:"1rem 0" }}>この評価軸は参考値のため、詳細な採点基準は未確定です。</p>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ─── フィードバックボタン＋モーダル（学生・メンター共通）──────────────
  const FeedbackWidget = (
    <>
      <button onClick={openFeedback}
        style={{ position:"fixed", bottom:"calc(72px + env(safe-area-inset-bottom))", right:18, zIndex:100,
          width:48, height:48, borderRadius:"50%", background:"#7c3aed", border:"none", cursor:"pointer",
          display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 4px 14px rgba(124,58,237,0.5)" }}>
        <MessageSquare size={20} color="#fff"/>
      </button>
      {fbOpen && (
        <div onClick={()=>setFbOpen(false)}
          style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.55)", zIndex:200, display:"flex", alignItems:"center", justifyContent:"center", padding:"1rem" }}>
          <div onClick={e=>e.stopPropagation()}
            style={{ background:C.surface, borderRadius:18, padding:"1.5rem", width:"100%", maxWidth:380, boxShadow:"0 20px 60px rgba(0,0,0,0.3)" }}>
            {fbSent ? (
              <div style={{ textAlign:"center", padding:"1rem 0" }}>
                <div style={{ fontSize:36, marginBottom:8 }}>✅</div>
                <p style={{ color:C.text, fontWeight:700, margin:0 }}>送信しました！ありがとうございます</p>
              </div>
            ) : (
              <>
                <h3 style={{ margin:"0 0 4px", fontSize:16, fontWeight:700, color:C.text }}>アプリへのフィードバック</h3>
                <p style={{ margin:"0 0 16px", fontSize:12, color:C.textSub }}>使いやすさについて教えてください</p>
                <div style={{ marginBottom:14 }}>
                  <label style={{ fontSize:12, color:C.textSub, display:"block", marginBottom:8 }}>使いやすさ（必須）</label>
                  <div style={{ display:"flex", gap:8 }}>
                    {[1,2,3,4,5].map(n => (
                      <button key={n} onClick={()=>setFbRating(n)}
                        style={{ fontSize:28, background:"none", border:"none", cursor:"pointer", opacity:fbRating>=n?1:0.3, padding:0 }}>
                        ⭐
                      </button>
                    ))}
                  </div>
                  {fbRating>0 && <p style={{ fontSize:11, color:C.textMuted, margin:"4px 0 0" }}>
                    {["","😢 とても使いにくい","😕 使いにくい","😐 普通","😊 使いやすい","😄 とても使いやすい"][fbRating]}
                  </p>}
                </div>
                <div style={{ marginBottom:16 }}>
                  <label style={{ fontSize:12, color:C.textSub, display:"block", marginBottom:6 }}>気になった点・改善してほしいこと（任意）</label>
                  <textarea value={fbText} onChange={e=>setFbText(e.target.value)}
                    placeholder="例：ボタンがわかりにくい、〇〇の機能が使いづらい…"
                    rows={3} style={{ ...S.input, resize:"vertical", fontSize:13 }}/>
                </div>
                <div style={{ display:"flex", gap:8 }}>
                  <button onClick={()=>setFbOpen(false)}
                    style={{ flex:1, padding:"10px", borderRadius:10, border:`1px solid ${C.border}`, background:"none", color:C.textSub, cursor:"pointer", fontSize:13 }}>
                    キャンセル
                  </button>
                  <button onClick={submitFeedback} disabled={!fbRating}
                    style={{ flex:2, padding:"10px", borderRadius:10, border:"none", background:fbRating?"#7c3aed":"#555", color:"#fff", cursor:fbRating?"pointer":"default", fontSize:13, fontWeight:700 }}>
                    送信する
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );

  // ─────────────────────────────────────────────────────────────────────
  // メンター画面
  // ─────────────────────────────────────────────────────────────────────
  if (currentUser.role === "mentor") {
    const pending   = getPending().filter(p => students.some(s => s.id === p.studentId));
    const selSurveys= selStudent ? getSurveys(selStudent.id) : [];
    const selLogs   = selStudent ? getLogs(selStudent.id) : [];
    const selMentorSvs = selStudent ? getMentorSurveys(selStudent.id) : [];
    const latestSelf  = selSurveys[0];
    const latestOther = selMentorSvs[0];

    const TutorialModal = showTutorial ? (
      <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.6)", zIndex:200, display:"flex", alignItems:"center", justifyContent:"center", padding:"1rem" }}>
        <div style={{ background:C.surface, borderRadius:20, padding:"2rem", width:"100%", maxWidth:520, boxShadow:"0 20px 60px rgba(0,0,0,0.3)" }}>
          {/* ステップ表示 */}
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"1.25rem" }}>
            <div style={{ display:"flex", gap:5 }}>
              {MENTOR_TUTORIAL_STEPS.map((_,i) => (
                <div key={i} style={{ width: i===tutorialStep?20:7, height:7, borderRadius:99, background: i===tutorialStep?C.primary:C.surface3, transition:"width 0.2s" }}/>
              ))}
            </div>
            <button onClick={()=>{ storage.set("tutorial_seen",true); setShowTutorial(false); }} style={{ background:"none", border:"none", cursor:"pointer", color:C.textMuted }}><X size={18}/></button>
          </div>

          {/* ビジュアル */}
          <div style={{ textAlign:"center", marginBottom:"1.25rem" }}>
            <div style={{ fontSize:52, lineHeight:1, marginBottom:10 }}>{MENTOR_TUTORIAL_STEPS[tutorialStep].icon}</div>
            {MENTOR_TUTORIAL_STEPS[tutorialStep].tab && (
              <span style={{ ...S.tag(C.primary), fontSize:14, padding:"5px 16px" }}>
                画面：{MENTOR_TUTORIAL_STEPS[tutorialStep].tab}
              </span>
            )}
          </div>

          {/* テキスト */}
          <p style={{ fontWeight:700, fontSize:19, color:C.text, margin:"0 0 12px" }}>{MENTOR_TUTORIAL_STEPS[tutorialStep].title}</p>
          <p style={{ fontSize:15, color:C.textSub, lineHeight:2.0, margin:"0 0 1.5rem", whiteSpace:"pre-line" }}>{MENTOR_TUTORIAL_STEPS[tutorialStep].content}</p>

          {/* ナビゲーション */}
          <div style={{ display:"flex", gap:8 }}>
            {tutorialStep > 0 && (
              <button style={{ ...S.btn, flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:4 }} onClick={()=>setTutorialStep(s=>s-1)}>
                <ChevronLeft size={14}/>前へ
              </button>
            )}
            {tutorialStep < MENTOR_TUTORIAL_STEPS.length-1 ? (
              <button style={{ ...S.btnPrimary, flex:2, display:"flex", alignItems:"center", justifyContent:"center", gap:4 }} onClick={()=>setTutorialStep(s=>s+1)}>
                次へ<ChevronRight size={14}/>
              </button>
            ) : (
              <button style={{ ...S.btnSuccess, flex:2 }} onClick={()=>{ storage.set("tutorial_seen",true); setShowTutorial(false); }}>
                はじめる ✓
              </button>
            )}
          </div>
        </div>
      </div>
    ) : null;

    return (
      <div style={{ minHeight:"100vh", background:C.bg, color:C.text, fontFamily:"system-ui,sans-serif" }}>
        <Header/>
        {TutorialModal}
        {FeedbackWidget}
        <div style={{ maxWidth:820, margin:"0 auto", padding:`1.5rem 1.5rem calc(7rem + env(safe-area-inset-bottom))` }}>

          {/* 学生一覧 + 評価（マージ） */}
          {screen==="home" && (
            <div>
              {/* 担当学生リスト */}
              <div style={{ marginBottom:"1rem" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"0.75rem" }}>
                  <h3 style={{ fontSize:15, fontWeight:700, color:C.text, margin:0 }}>担当学生 ({students.length}名)</h3>
                  {selStudent && (
                    <button style={{ ...S.btn, fontSize:11, padding:"3px 10px" }} onClick={()=>setSelStudent(null)}>選択解除</button>
                  )}
                </div>
                {students.length===0 && <p style={{ color:C.textSub, fontSize:13 }}>同じチームIDで登録された学生がいません。</p>}
                {students.map(st => {
                  const svs = getSurveys(st.id);
                  const stLogs = getLogs(st.id);
                  const latest = svs[0];
                  const pend = pending.filter(p=>p.studentId===st.id).length;
                  const avg1 = latest ? axisAvg(latest.axes).toFixed(1) : "—";
                  const isSel = selStudent?.id === st.id;
                  // #15 入力日表示
                  const lastLogTs  = stLogs[0]?.timestamp || 0;
                  const pendingItem = pending.find(p=>p.studentId===st.id);
                  const pendingTs  = pendingItem ? parseInt(pendingItem.id.slice(2)) : 0;
                  const lastSurvTs = svs[0]?.timestamp || pendingTs;
                  // #14 迷いフラグ（採点済み評価にuncertain=trueがあるか）
                  const mentorEvs = getMentorSurveys(st.id);
                  const hasUncertain = mentorEvs.some(e => e.uncertain === true || (e.uncertain && Object.values(e.uncertain).some(Boolean)));
                  return (
                    <div key={st.id}
                      onClick={()=>setSelStudent(isSel ? null : st)}
                      style={{ ...S.card, cursor:"pointer", marginBottom:"0.5rem",
                        borderColor: isSel ? C.primary : C.border,
                        background:  isSel ? C.primary+"0a" : C.surface,
                        transition:"all 0.15s"
                      }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                          <Avatar name={st.name} size={34}/>
                          <div>
                            <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                              <p style={{ margin:0, fontWeight:700, fontSize:14, color:C.text }}>{st.name}</p>
                              {hasUncertain && <span title="判定に迷いあり" style={{ fontSize:11, background:C.warn+"22", color:C.warn, border:`1px solid ${C.warn}44`, borderRadius:5, padding:"1px 5px" }}>⚠️ 迷った</span>}
                            </div>
                            <p style={{ margin:0, fontSize:11, color:C.textSub }}>
                              振り返り {svs.length}件{pend>0?` · 採点待ち ${pend}件`:""}
                            </p>
                            <p style={{ margin:"2px 0 0", fontSize:11, color:C.textSub }}>
                              📓 ログ: {lastLogTs > 0 ? fmt(lastLogTs) : "未入力"}
                              　📋 振り返り: {lastSurvTs > 0 ? fmt(lastSurvTs) : "未入力"}
                            </p>
                          </div>
                        </div>
                        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                          <div style={{ textAlign:"center", minWidth:32 }}>
                            <p style={{ fontSize:20, fontWeight:700, color:isSel?C.primary:C.text, margin:0 }}>{avg1}</p>
                            <p style={{ fontSize:9, color:C.textMuted, margin:0 }}>Lv</p>
                          </div>
                          <ChevronRight size={14} color={isSel?C.primary:C.textMuted}
                            style={{ transform:isSel?"rotate(90deg)":"none", transition:"transform 0.2s" }}/>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 選択中学生の詳細 + 評価入力 */}
              {selStudent && (
                <div style={{ borderTop:`2px solid ${C.primary}33`, paddingTop:"1.25rem" }}>
                  {/* 学生ヘッダー */}
                  <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:"1.25rem" }}>
                    <Avatar name={selStudent.name} size={40}/>
                    <div>
                      <p style={{ margin:0, fontSize:16, fontWeight:700, color:C.text }}>{selStudent.name}</p>
                      <p style={{ margin:0, fontSize:12, color:C.textSub }}>ID: {selStudent.id}</p>
                    </div>
                  </div>

                  {/* レーダーチャート */}
                  {latestSelf && (
                    <div style={S.card}>
                      <p style={{ fontSize:13, fontWeight:700, marginBottom:12, color:C.text }}>自己評価 vs 他者評価（最新）</p>
                      <ResponsiveContainer width="100%" height={240}>
                        <RadarChart data={radarData(latestSelf, latestOther)}>
                          <PolarGrid stroke="rgba(117,0,192,0.2)" strokeDasharray="3 3"/>
                          <PolarAngleAxis dataKey="subject" tick={{ fontSize:12, fill:"#460073", fontWeight:600 }}/>
                          <Radar name="自己評価" dataKey="自己" stroke="#CC44FF" fill="#CC44FF" fillOpacity={0.5}/>
                          <Radar name="メンター評価" dataKey="他者" stroke="#0088aa" fill="#0088aa" fillOpacity={0.25}/>
                          <Legend wrapperStyle={{ fontSize:12 }}/>
                          <Tooltip contentStyle={{ background:C.surface2, border:`1px solid ${C.borderLight}`, borderRadius:8, fontSize:12 }}/>
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {/* ログ一覧 */}
                  <p style={{ fontSize:13, fontWeight:700, color:C.textSub, margin:"0 0 0.75rem" }}>活動ログ</p>
                  {selLogs.length===0
                    ? <p style={{ color:C.textSub, fontSize:13 }}>ログデータがありません。</p>
                    : selLogs.map(lg => (
                      <div key={lg.timestamp} style={{ ...S.scard, marginBottom:10 }}>
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:6 }}>
                          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                            <span style={{ fontSize:13, fontWeight:700, color:C.text }}>{lg.activityTitle || "活動記録"}</span>
                          </div>
                          <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:2 }}>
                            <span style={{ fontSize:11, color:C.textSub }}>{fmt(lg.timestamp)}</span>
                            {lg.activityType && <span style={{ fontSize:10, padding:"1px 6px", borderRadius:10, background: lg.activityType==="official"?C.warn+"22":C.accent1+"22", color: lg.activityType==="official"?C.warn:C.accent1, fontWeight:600 }}>{lg.activityType==="official"?"📋 公式":"🙋 自主"}</span>}
                          </div>
                        </div>
                        {/* 新フォーマット：logAnswers（1-10スライダー） */}
                        {lg.logAnswers && Object.keys(lg.logAnswers).filter(k => lg.logAnswers[k]).length > 0 && (
                          <div style={{ marginBottom:8, padding:"8px 10px", background:C.surface2, borderRadius:8 }}>
                            {REFLECTION_QUESTIONS.map(q => {
                              const v = lg.logAnswers[q.id];
                              if (!v) return null;
                              return (
                                <div key={q.id} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:5 }}>
                                  <span style={{ fontSize:12, color:C.textSub, flex:1, lineHeight:1.4 }}>{q.text}</span>
                                  <div style={{ display:"flex", alignItems:"center", gap:4 }}>
                                    <div style={{ width:50, height:5, background:C.surface3, borderRadius:99, overflow:"hidden" }}>
                                      <div style={{ height:"100%", width:`${v*10}%`, background:`linear-gradient(90deg,${C.primary},${C.accent1})`, borderRadius:99 }}/>
                                    </div>
                                    <span style={{ fontSize:14, fontWeight:700, color:C.primary, minWidth:32, textAlign:"right" }}>{v}<span style={{ fontSize:10, fontWeight:400, color:C.textMuted }}>/10</span></span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                        {/* 旧フォーマット後方互換 */}
                        {(lg.logQ1||lg.logQ2||lg.logQ3) && (
                          <div style={{ display:"flex", gap:6, marginBottom:6, flexWrap:"wrap" }}>
                            {[{l:"取り組み",v:lg.logQ1},{l:"気づき",v:lg.logQ2},{l:"連携",v:lg.logQ3}].filter(f=>f.v).map(f=>(
                              <span key={f.l} style={{ fontSize:11, padding:"3px 8px", borderRadius:20, background:C.primary+"18", color:C.primary, fontWeight:700 }}>{f.l} {f.v}/10</span>
                            ))}
                          </div>
                        )}
                        {lg.logMemo && <p style={{ fontSize:13, color:C.text, margin:"4px 0 0", lineHeight:1.5 }}>{lg.logMemo}</p>}
                      </div>
                    ))
                  }

                </div>
              )}
            </div>
          )}

          {/* 採点待ち */}
          {screen==="scoring" && (
            <div>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"1rem" }}>
                <h3 style={{ fontSize:16, fontWeight:700, margin:0 }}>採点待ちの振り返り</h3>
                <button style={{ ...S.btn, fontSize:11, padding:"4px 12px", display:"flex", alignItems:"center", gap:4 }}
                  onClick={()=>{ const skip = new Set(["current_user","tutorial_seen"]); Promise.all(students.map(st=>storage.syncFromCloud(st.id,skip))).then(()=>tick()); }}>
                  🔄 更新
                </button>
              </div>
              {pending.length===0 && <p style={{ color:C.textSub, fontSize:13 }}>採点待ちはありません。</p>}
              {pending.map(p => (
                <div key={p.id} style={S.card}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <Avatar name={p.studentId} size={30}/>
                      <div>
                        <p style={{ margin:0, fontSize:13, fontWeight:700 }}>{students.find(s=>s.id===p.studentId)?.name || p.studentId}</p>
                        <p style={{ margin:0, fontSize:11, color:C.textSub }}>{p.date} · {p.mode==="mentimeter"?"メンチメーター形式":"振り返り"}</p>
                      </div>
                    </div>
                    <button style={S.btnPrimary} onClick={()=>{setScoringTarget(p);setMentorScores({});setAiResult(null);setShowAllAnswers(true);}}>採点する</button>
                  </div>
                  {/* 振り返り内容プレビュー */}
                  {p.mode==="survey_json" && p.answers && surveyDef ? (
                    <div style={{ marginTop:8, display:"flex", flexWrap:"wrap", gap:4 }}>
                      {surveyDef.sections.flatMap(s=>s.questions).filter(q => p.answers[q.id] != null && p.answers[q.id] > 0).slice(0,5).map(q => {
                        const val = p.answers[q.id];
                        const opt = q.options?.find(o => o.value === val);
                        return (
                          <span key={q.id} style={{ fontSize:11, padding:"2px 8px", borderRadius:20, background:C.primary+"15", color:C.primary, border:`1px solid ${C.primary}33` }}>
                            {q.text.slice(0,12)}… Lv.{val}{opt?` (${opt.label.slice(0,8)})` :""}
                          </span>
                        );
                      })}
                      {Object.values(p.answers).filter(v => v > 0).length > 5 && (
                        <span style={{ fontSize:11, color:C.textMuted }}>他{Object.values(p.answers).filter(v=>v>0).length-5}問...</span>
                      )}
                    </div>
                  ) : (
                    <p style={{ fontSize:13, color:C.textSub, whiteSpace:"pre-line", lineHeight:1.7, margin:"8px 0 0" }}>
                      {(p.reflection||"").slice(0,200)}{(p.reflection||"").length>200?"…":""}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

        </div>

        {/* ─── フッターナビ（メンター用） */}
        <div style={{ position:"fixed", bottom:0, left:0, right:0, background:C.surface, borderTop:`1px solid ${C.border}`, display:"flex", zIndex:30, paddingBottom:"env(safe-area-inset-bottom)" }}>
          {[
            { v:"home",    l:"学生",  icon:Users,         badge:0 },
            { v:"scoring", l:"採点",  icon:ClipboardList, badge:pending.length },
          ].map(item => {
            const active = screen===item.v;
            return (
              <button key={item.v} style={{ flex:1, minWidth:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"10px 4px", background:"none", border:"none", borderTop:`2px solid ${active?C.primary:"transparent"}`, cursor:"pointer", color:active?C.primary:C.textMuted, gap:3, transition:"all 0.15s" }}
                onClick={()=>setScreen(item.v)}>
                <div style={{ position:"relative" }}>
                  <item.icon size={22}/>
                  {item.badge > 0 && <span style={{ position:"absolute", top:-5, right:-8, background:C.accent2, color:"#fff", borderRadius:99, fontSize:9, fontWeight:700, minWidth:16, height:16, lineHeight:"16px", textAlign:"center", padding:"0 3px" }}>{item.badge}</span>}
                </div>
                <span style={{ fontSize:10, fontWeight:active?700:400 }}>{item.l}</span>
              </button>
            );
          })}
        </div>

        {/* ─── ルーブリックポップアップ（メンター画面共通） */}
        {rubricAxis && (
          <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.55)", zIndex:100, display:"flex", alignItems:"center", justifyContent:"center", padding:"1rem" }} onClick={()=>setRubricAxis(null)}>
            <div style={{ background:C.surface, borderRadius:20, padding:"1.5rem", width:"100%", maxWidth:560, maxHeight:"85vh", overflowY:"auto", boxShadow:"0 20px 60px rgba(0,0,0,0.3)" }} onClick={e=>e.stopPropagation()}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"0.5rem" }}>
                <p style={{ margin:0, fontWeight:700, fontSize:16, color:C.text }}>{rubricAxis.name}</p>
                <button onClick={()=>setRubricAxis(null)} style={{ background:"none", border:"none", cursor:"pointer", color:C.textMuted }}><X size={20}/></button>
              </div>
              <p style={{ fontSize:12, color:C.textSub, marginBottom:"1.25rem", lineHeight:1.6 }}>{rubricAxis.evalText}</p>
              {RUBRIC_DATA[rubricAxis.id]?.levels ? (
                LEVELS.map((lv, i) => (
                  <div key={lv.lv} style={{ borderLeft:`4px solid ${lv.color}`, padding:"10px 14px", marginBottom:10, background:C.surface2, borderRadius:"0 10px 10px 0" }}>
                    <span style={{ fontWeight:700, fontSize:13, color:lv.color }}>Lv.{lv.lv}　{lv.name}</span>
                    <p style={{ margin:"6px 0 0", fontSize:13, color:C.text, lineHeight:1.65 }}>{RUBRIC_DATA[rubricAxis.id].levels[i]}</p>
                  </div>
                ))
              ) : (
                <p style={{ fontSize:13, color:C.textSub, padding:"1rem 0" }}>この評価軸は参考値のため、詳細な採点基準は未確定です。</p>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────
  // 学生画面
  // ─────────────────────────────────────────────────────────────────────
  const myPending     = getPending().filter(p=>p.studentId===currentUser.id);
  const myQuestions   = getQuestions().filter(q=>q.studentId===currentUser.id);
  const myFeedbacks   = getFeedbacks().filter(f=>f.studentId===currentUser.id);
  const latestMentor  = getMentorSurveys(currentUser.id)[0];

  const unreadQ = myQuestions.filter(q=>!q.answer).length;

  const StudentTutorialModal = showTutorial ? (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.6)", zIndex:200, display:"flex", alignItems:"center", justifyContent:"center", padding:"1rem" }}>
      <div style={{ background:C.surface, borderRadius:20, padding:"2rem", width:"100%", maxWidth:520, boxShadow:"0 20px 60px rgba(0,0,0,0.3)" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"1.25rem" }}>
          <div style={{ display:"flex", gap:5 }}>
            {STUDENT_TUTORIAL_STEPS.map((_,i) => (
              <div key={i} style={{ width: i===tutorialStep?20:7, height:7, borderRadius:99, background: i===tutorialStep?C.primary:C.surface3, transition:"width 0.2s" }}/>
            ))}
          </div>
          <button onClick={()=>{ storage.set("tutorial_seen",true); setShowTutorial(false); }} style={{ background:"none", border:"none", cursor:"pointer", color:C.textMuted }}><X size={18}/></button>
        </div>
        <div style={{ textAlign:"center", marginBottom:"1.25rem" }}>
          <div style={{ fontSize:52, lineHeight:1, marginBottom:10 }}>{STUDENT_TUTORIAL_STEPS[tutorialStep].icon}</div>
          {STUDENT_TUTORIAL_STEPS[tutorialStep].tab && (
            <span style={{ ...S.tag(C.primary), fontSize:14, padding:"5px 16px" }}>
              画面：{STUDENT_TUTORIAL_STEPS[tutorialStep].tab}
            </span>
          )}
        </div>
        <p style={{ fontWeight:700, fontSize:19, color:C.text, margin:"0 0 12px" }}>{STUDENT_TUTORIAL_STEPS[tutorialStep].title}</p>
        <p style={{ fontSize:15, color:C.textSub, lineHeight:2.0, margin:"0 0 1.5rem", whiteSpace:"pre-line" }}>{STUDENT_TUTORIAL_STEPS[tutorialStep].content}</p>
        <div style={{ display:"flex", gap:8 }}>
          {tutorialStep > 0 && (
            <button style={{ ...S.btn, flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:4 }} onClick={()=>setTutorialStep(s=>s-1)}>
              <ChevronLeft size={14}/>前へ
            </button>
          )}
          {tutorialStep < STUDENT_TUTORIAL_STEPS.length-1 ? (
            <button style={{ ...S.btnPrimary, flex:2, display:"flex", alignItems:"center", justifyContent:"center", gap:4 }} onClick={()=>setTutorialStep(s=>s+1)}>
              次へ<ChevronRight size={14}/>
            </button>
          ) : (
            <button style={{ ...S.btnSuccess, flex:2 }} onClick={()=>{ storage.set("tutorial_seen",true); setShowTutorial(false); }}>
              はじめる ✓
            </button>
          )}
        </div>
      </div>
    </div>
  ) : null;


  return (
    <div style={{ minHeight:"100vh", background:C.bg, color:C.text, fontFamily:"system-ui,sans-serif" }}>
      <style>{`@media (max-width: 480px) { body { zoom: 1.2; } }`}</style>
      <Header/>
      {StudentTutorialModal}
      {FeedbackWidget}
      <div style={{ maxWidth:860, margin:"0 auto", padding:`1.5rem 1.5rem calc(7rem + env(safe-area-inset-bottom))` }}>

        {/* ─── ホーム ─────────────────────────────────────────────── */}
        {screen==="home" && (
          <div>
            {/* プロジェクト情報（最上部） */}
            {(() => {
              const projKey = `project_info:${currentUser.id}`;
              const saveProjInfo = () => {
                storage.set(projKey, { ...storage.get(projKey)||{}, name: projEditState.name, summary: projEditState.summary });
                tick();
                setProjSaved(true);
                setTimeout(() => setProjSaved(false), 2000);
              };
              return (
                <div style={{ ...S.card, marginBottom:"1rem", border:`1px solid ${C.primary}33`, background:`${C.primary}06` }}>
                  {/* プロジェクトID バッジ */}
                  {currentUser.projectId && (
                    <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:10 }}>
                      <span style={{ fontSize:11, fontWeight:700, color:C.primary, background:C.primary+"18", border:`1px solid ${C.primary}44`, borderRadius:6, padding:"3px 10px" }}>
                        📁 プロジェクトID: {currentUser.projectId}
                      </span>
                    </div>
                  )}
                  {/* 名前入力 */}
                  <div style={{ marginBottom:8 }}>
                    <label style={{ fontSize:11, fontWeight:700, color:C.textSub, display:"block", marginBottom:4 }}>プロジェクト名</label>
                    <input
                      value={projEditState.name}
                      placeholder="例：北海道農業スタートアップ支援PBL"
                      onChange={e => setProjEditState(s => ({ ...s, name: e.target.value }))}
                      onBlur={saveProjInfo}
                      style={{ ...S.input, width:"100%", boxSizing:"border-box", fontSize:13 }}
                    />
                  </div>
                  {/* 概要入力 */}
                  <div style={{ marginBottom:8 }}>
                    <label style={{ fontSize:11, fontWeight:700, color:C.textSub, display:"block", marginBottom:4 }}>概要</label>
                    <textarea
                      value={projEditState.summary}
                      placeholder="このプロジェクトについて簡単に説明してください"
                      rows={2}
                      onChange={e => setProjEditState(s => ({ ...s, summary: e.target.value }))}
                      onBlur={saveProjInfo}
                      style={{ ...S.textarea, minHeight:48, fontSize:12 }}
                    />
                  </div>
                  {/* 保存ボタン */}
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <button
                      onClick={saveProjInfo}
                      style={{ ...S.btn, background:C.primary, color:"#fff", fontSize:13, padding:"6px 18px" }}
                    >
                      💾 保存する
                    </button>
                    {projSaved && (
                      <span style={{ fontSize:12, color:C.primary, fontWeight:600 }}>✅ 保存しました</span>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* グリーティング */}
            <div style={{ marginBottom:"1.25rem" }}>
              <p style={{ fontSize:20, fontWeight:700, color:C.text, margin:0 }}>
                こんにちは、{currentUser.name}さん
              </p>
              <p style={{ fontSize:12, color:C.textSub, margin:"4px 0 0" }}>
                {new Date().toLocaleDateString("ja-JP", { year:"numeric", month:"long", day:"numeric", weekday:"short" })}
              </p>
            </div>

            {/* レーダーチャート（最優先表示） */}
            {latestSurvey ? (
              <>
                <div style={{ ...S.cardGlow, marginBottom:"1.25rem" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
                    <div>
                      <p style={{ fontSize:14, fontWeight:700, color:C.text, margin:0 }}>Be-Ready 評価レーダー</p>
                      <p style={{ fontSize:11, color:C.textSub, marginTop:3 }}>
                        自己評価{latestMentor ? " / メンター評価" : ""}（最新）
                      </p>
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={300}>
                    <RadarChart data={radarData(latestSurvey, latestMentor)}>
                      <PolarGrid stroke="rgba(117,0,192,0.2)" strokeDasharray="3 3"/>
                      <PolarAngleAxis dataKey="subject" tick={{ fontSize:12, fill:"#460073", fontWeight:600 }}/>
                      <Radar name="自己評価" dataKey="自己" stroke="#CC44FF" fill="#CC44FF" fillOpacity={0.5}/>
                      {latestMentor && <Radar name="メンター評価" dataKey="他者" stroke="#0088aa" fill="#0088aa" fillOpacity={0.25}/>}
                      <Legend wrapperStyle={{ fontSize:12, color:C.textSub }}/>
                      <Tooltip contentStyle={{ background:C.surface2, border:`1px solid ${C.borderLight}`, borderRadius:8, fontSize:12 }}/>
                    </RadarChart>
                  </ResponsiveContainer>
                </div>


              </>
            ) : (
              <div style={{ ...S.cardGlow, textAlign:"center", padding:"2.5rem 1.5rem", marginBottom:"1.25rem" }}>
                <ClipboardList size={40} color={C.primary+"88"} style={{ marginBottom:12 }}/>
                <p style={{ fontSize:15, fontWeight:700, color:C.text, marginBottom:6 }}>まだアンケートがありません</p>
                <p style={{ fontSize:13, color:C.textSub, marginBottom:16 }}>振り返りを提出するとメンターが採点し、レーダーチャートが表示されます。</p>
                <button style={S.btnPrimary} onClick={()=>setScreen("reflection")}>振り返りを提出する</button>
              </div>
            )}

            {/* 統計カード */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10, marginBottom:"1rem" }}>
              {[
                { l:"ログ記録",   v:myLogs.length,      c:C.accent1, icon:BookOpen,      s:"log"    },
                { l:"振り返り",  v:mySurveys.length,   c:C.primary, icon:ClipboardList, s:"reflection" },
                { l:"採点待ち",  v:myPending.length,   c:C.warn,    icon:Star,          s:"reflection" },
              ].map(item => (
                <button key={item.l} onClick={()=>setScreen(item.s)} style={{ ...S.card, cursor:"pointer", textAlign:"center", padding:"1rem 0.5rem", border:`1px solid ${item.c}33`, marginBottom:0 }}>
                  <item.icon size={18} color={item.c} style={{ marginBottom:4 }}/>
                  <p style={{ fontSize:24, fontWeight:700, color:item.c, margin:"0 0 2px" }}>{item.v}</p>
                  <p style={{ fontSize:11, color:C.textSub, margin:0 }}>{item.l}</p>
                </button>
              ))}
            </div>

            {/* 通知 */}
            {myPending.length>0 && (
              <div style={{ ...S.scard, borderLeft:`3px solid ${C.warn}`, marginBottom:"0.75rem" }}>
                <p style={{ fontSize:13, color:C.warn, fontWeight:600, margin:0 }}>⏳ {myPending.length}件の振り返りがメンターの採点を待っています。</p>
              </div>
            )}
            {/* ネクストアクション（最新の振り返りの⚡回答を要約） */}
            {(() => {
              const src = myPending[0] || latestSurvey;
              if (!src?.drillAnswers) return null;
              const actions = Object.values(src.drillAnswers)
                .filter(d => d.d2choice)
                .map(d => d.d2text ? `${d.d2choice}（${d.d2text}）` : d.d2choice);
              if (!actions.length) return null;
              return (
                <div style={{ ...S.scard, borderLeft:`3px solid ${C.accent1}`, marginBottom:"0.75rem" }}>
                  <p style={{ fontSize:12, fontWeight:700, color:C.accent1, margin:"0 0 8px" }}>⚡ ネクストアクション</p>
                  {actions.slice(0,3).map((a, i) => (
                    <p key={i} style={{ fontSize:13, color:C.text, margin: i < actions.length-1 ? "0 0 5px" : 0, lineHeight:1.5 }}>• {a}</p>
                  ))}
                  <p style={{ fontSize:11, color:C.textMuted, margin:"6px 0 0" }}>
                    前回の振り返り（{src.date}）より
                  </p>
                </div>
              );
            })()}
            {unreadQ>0 && (
              <div style={{ ...S.scard, borderLeft:`3px solid ${C.accent1}`, marginBottom:"0.75rem", cursor:"pointer" }} onClick={()=>setScreen("feedback")}>
                <p style={{ fontSize:13, color:C.accent1, fontWeight:600, margin:0 }}>💬 メンターから未回答の問いが {unreadQ}件 あります。</p>
              </div>
            )}

            {/* クイックアクション */}
            <div style={{ marginTop:"0.5rem" }}>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
              {[
                { l:"活動を記録",        d:"メンチメーター形式で記録",   icon:BookOpen,   s:"log",        c:C.accent1 },
                { l:"振り返り提出",      d:"アンケート形式で振り返り",   icon:TrendingUp, s:"reflection", c:C.warn    },
                { l:"プロジェクト情報",  d:"概要・ゴールを確認",        icon:Info,       s:"project",    c:C.textSub },
              ].map(item => (
                <button key={item.l} onClick={()=>setScreen(item.s)} style={{ ...S.card, cursor:"pointer", textAlign:"left", display:"flex", alignItems:"center", gap:10, border:`1px solid ${item.c}33`, minWidth:0, overflow:"hidden", marginBottom:0, padding:"12px 14px" }}>
                  <div style={{ width:36, height:36, borderRadius:10, background:item.c+"22", border:`1px solid ${item.c}44`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                    <item.icon size={16} color={item.c}/>
                  </div>
                  <div style={{ minWidth:0, overflow:"hidden" }}>
                    <p style={{ fontSize:12, fontWeight:700, color:C.text, margin:"0 0 2px", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{item.l}</p>
                    <p style={{ fontSize:11, color:C.textSub, margin:0, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{item.d}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
          </div>
        )}

        {/* ─── ログ ──────────────────────────────────────────────────── */}
        {screen==="log" && (
          <div>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:"1rem", padding:"8px 14px", background:`${C.accent1}15`, borderRadius:12, border:`1px solid ${C.accent1}33` }}>
              <BookOpen size={16} color={C.accent1}/>
              <div>
                <p style={{ margin:0, fontSize:13, fontWeight:700, color:C.accent1 }}>活動ログ</p>
                <p style={{ margin:0, fontSize:11, color:C.textSub }}>活動内容と振り返りを記録しよう。</p>
              </div>
            </div>
            <div style={S.cardGlow}>
              {/* 活動タイトル（何に対してのログなのか） */}
              <div style={{ marginBottom:16 }}>
                <label style={{ fontSize:13, fontWeight:700, color:C.text, display:"block", marginBottom:6 }}>
                  📌 何の活動のログですか？ <span style={{ color:C.accent2 }}>*</span>
                </label>
                <input value={activityTitle} onChange={e=>setActivityTitle(e.target.value)}
                  placeholder="例：チームミーティング、現場視察、企業インタビュー"
                  style={{ ...S.input, width:"100%", boxSizing:"border-box" }}/>
              </div>

              {/* 活動日 */}
              <div style={{ marginBottom:20 }}>
                <label style={{ fontSize:13, fontWeight:700, color:C.text, display:"block", marginBottom:6 }}>
                  📅 活動日
                </label>
                <input
                  type="date"
                  value={logDate}
                  onChange={e => setLogDate(e.target.value)}
                  style={{ ...S.input, width:"100%", boxSizing:"border-box" }}
                />
              </div>

              {/* 公式/自主 区分 */}
              <div style={{ marginBottom:20 }}>
                <label style={{ fontSize:12, fontWeight:700, color:C.text, display:"block", marginBottom:8 }}>活動の種類</label>
                <div style={{ display:"flex", gap:8 }}>
                  {[{ v:"official", l:"📋 公式活動", d:"メンター参加あり" }, { v:"self", l:"🙋 自主活動", d:"チーム・個人" }].map(t => (
                    <button key={t.v} onClick={()=>setActivityType(t.v)}
                      style={{ flex:1, padding:"8px 10px", borderRadius:10, border:`2px solid ${activityType===t.v?C.primary:C.border}`,
                        background: activityType===t.v ? C.primary+"18" : "transparent", cursor:"pointer", textAlign:"left", transition:"all 0.15s" }}>
                      <p style={{ margin:0, fontSize:12, fontWeight:700, color: activityType===t.v?C.primary:C.text }}>{t.l}</p>
                      <p style={{ margin:0, fontSize:10, color:C.textMuted }}>{t.d}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* REFLECTION_QUESTIONS：1-10スライダー（メンチメーター形式） */}
              {REFLECTION_QUESTIONS.map((q, idx) => {
                const val = logAnswers[q.id] || 0;
                return (
                  <div key={q.id} style={{ marginBottom:24, padding:"14px 16px", background:C.surface2, borderRadius:12, border:`1px solid ${C.border}` }}>
                    <label style={{ fontSize:13, fontWeight:700, color:C.text, display:"block", marginBottom:12 }}>
                      Q{idx+1}. {q.text}
                    </label>
                    <div style={{ textAlign:"center", marginBottom:8 }}>
                      <span style={{ fontSize:36, fontWeight:700, color: val===0 ? C.textMuted : C.primary, lineHeight:1 }}>
                        {val===0 ? "–" : val}
                      </span>
                      <span style={{ fontSize:14, color:C.textMuted }}> / 10</span>
                    </div>
                    <input type="range" min={1} max={10} value={val||5}
                      onChange={e=>setLogAnswers(prev=>({...prev,[q.id]:Number(e.target.value)}))}
                      style={{ width:"100%", accentColor:C.primary, cursor:"pointer", height:6, marginBottom:6 }}/>
                    <div style={{ display:"flex", justifyContent:"space-between" }}>
                      <span style={{ fontSize:10, color:C.textMuted }}>1 全くそう思わない</span>
                      <span style={{ fontSize:10, color:C.textMuted }}>非常にそう思う 10</span>
                    </div>
                  </div>
                );
              })}

              {/* 活動概要メモ */}
              {/* コメント（任意） */}
              <div style={{ marginBottom:14 }}>
                <label style={{ fontSize:12, fontWeight:700, color:C.textSub, display:"block", marginBottom:6 }}>コメント（任意）</label>
                <textarea value={logMemo} onChange={e=>setLogMemo(e.target.value)}
                  placeholder="活動の内容、気になったこと、印象に残ったことなど..."
                  rows={3} style={{ ...S.textarea, minHeight:60 }}/>
              </div>

              <button style={{ ...S.btnPrimary, display:"flex", alignItems:"center", gap:8 }} onClick={saveLog}><Save size={14}/> 記録する</button>
            </div>

            {/* ─── ログポップアップ ───────────────────────────────────── */}
            {logPopup && (
              <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.45)", backdropFilter:"blur(4px)", zIndex:1000, display:"flex", alignItems:"flex-end", justifyContent:"center", padding:"1rem" }}
                onClick={()=>setLogPopup(null)}>
                <div style={{ background:C.surface, borderRadius:"20px 20px 14px 14px", padding:"1.5rem", width:"100%", maxWidth:560, maxHeight:"80vh", overflowY:"auto", boxShadow:"0 20px 60px rgba(0,0,0,0.3)" }}
                  onClick={e=>e.stopPropagation()}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <span style={{ fontSize:22 }}>{EMOTIONS[logPopup.emotion-1] || "📝"}</span>
                      <div>
                        <p style={{ margin:0, fontSize:15, fontWeight:700, color:C.text }}>{logPopup.activityTitle || "活動記録"}</p>
                        <p style={{ margin:0, fontSize:11, color:C.textSub }}>
                          {fmt(logPopup.timestamp)}
                          {logPopup.activityType && <span style={{ marginLeft:6, padding:"1px 6px", borderRadius:8, background: logPopup.activityType==="official"?C.warn+"22":C.accent1+"22", color: logPopup.activityType==="official"?C.warn:C.accent1, fontSize:10, fontWeight:600 }}>{logPopup.activityType==="official"?"📋 公式":"🙋 自主"}</span>}
                        </p>
                      </div>
                    </div>
                    <div style={{ display:"flex", gap:8 }}>
                      <button onClick={()=>{ storage.del(`log:${currentUser.id}:${logPopup.timestamp}`); setLogPopup(null); tick(); }}
                        style={{ background:"none", border:"none", cursor:"pointer", color:C.accent2, padding:6 }}>
                        <Trash2 size={15}/>
                      </button>
                      <button onClick={()=>setLogPopup(null)} style={{ background:"none", border:`1px solid ${C.border}`, borderRadius:8, cursor:"pointer", color:C.textSub, padding:"4px 12px", fontSize:12 }}>閉じる</button>
                    </div>
                  </div>
                  {/* メンチメーター回答 */}
                  {logPopup.logAnswers && Object.keys(logPopup.logAnswers).length > 0 && (
                    <div style={{ marginBottom:14 }}>
                      <p style={{ fontSize:12, fontWeight:700, color:C.textSub, marginBottom:8 }}>📊 スコア</p>
                      {REFLECTION_QUESTIONS.map(q => {
                        const v = logPopup.logAnswers[q.id];
                        if (!v) return null;
                        return (
                          <div key={q.id} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
                            <span style={{ fontSize:12, color:C.textSub, flex:1, lineHeight:1.4 }}>{q.text}</span>
                            <span style={{ fontSize:14, fontWeight:700, color:C.primary, minWidth:36, textAlign:"right" }}>{v}<span style={{ fontSize:10, fontWeight:400, color:C.textMuted }}>/10</span></span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {/* 旧フォーマット後方互換 */}
                  {(logPopup.logQ1||logPopup.logQ2||logPopup.logQ3) && (
                    <div style={{ display:"flex", gap:6, marginBottom:10, flexWrap:"wrap" }}>
                      {[{l:"主体性",v:logPopup.logQ1},{l:"気づき",v:logPopup.logQ2},{l:"連携",v:logPopup.logQ3}].filter(f=>f.v).map(f=>(
                        <span key={f.l} style={{ fontSize:12, padding:"4px 10px", borderRadius:20, background:C.primary+"18", color:C.primary, fontWeight:700 }}>{f.l} {f.v}/10</span>
                      ))}
                    </div>
                  )}
                  {[{l:"Y やったこと",v:logPopup.yatta},{l:"W わかったこと",v:logPopup.wakatta},{l:"T 次にやること",v:logPopup.tsugi}].filter(f=>f.v).map(f => (
                    <div key={f.l} style={{ marginBottom:8, padding:"8px 12px", background:C.surface2, borderRadius:8 }}>
                      <span style={{ fontSize:11, color:C.primary, fontWeight:700 }}>{f.l}</span>
                      <p style={{ fontSize:13, color:C.text, margin:"4px 0 0", lineHeight:1.6 }}>{f.v}</p>
                    </div>
                  ))}
                  {logPopup.logMemo && (
                    <div style={{ marginTop:10, padding:"10px 12px", background:C.surface2, borderRadius:8, borderLeft:`3px solid ${C.accent1}` }}>
                      <p style={{ fontSize:11, fontWeight:700, color:C.accent1, margin:"0 0 4px" }}>📝 メモ</p>
                      <p style={{ fontSize:13, color:C.text, margin:0, lineHeight:1.6, whiteSpace:"pre-wrap" }}>{logPopup.logMemo}</p>
                    </div>
                  )}
                  {logPopup.photo && (
                    <img src={logPopup.photo} alt="log" style={{ marginTop:12, width:"100%", maxHeight:200, objectFit:"cover", borderRadius:10, border:`1px solid ${C.border}` }}/>
                  )}
                </div>
              </div>
            )}

            {myLogs.length>0 && (
              <div style={{ marginTop:"1rem" }}>
                <h3 style={{ fontSize:14, fontWeight:700, color:C.textSub, letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:12 }}>過去のログ</h3>
                {myLogs.map(lg => (
                  <div key={lg.timestamp} style={{ ...S.scard, cursor:"pointer", display:"flex", justifyContent:"space-between", alignItems:"center" }}
                    onClick={()=>setLogPopup(lg)}>
                    <div style={{ display:"flex", alignItems:"center", gap:10, flex:1, minWidth:0 }}>
                      <span style={{ fontSize:20, flexShrink:0 }}>{EMOTIONS[lg.emotion-1] || "📝"}</span>
                      <div style={{ minWidth:0 }}>
                        <p style={{ margin:0, fontSize:13, fontWeight:700, color:C.text, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                          {lg.activityTitle || "活動記録"}
                        </p>
                        <p style={{ margin:0, fontSize:11, color:C.textSub }}>
                          {fmt(lg.timestamp)}
                          {lg.activityType && <span style={{ marginLeft:6, padding:"1px 5px", borderRadius:8, background: lg.activityType==="official"?C.warn+"22":C.accent1+"22", color: lg.activityType==="official"?C.warn:C.accent1, fontSize:10, fontWeight:600 }}>{lg.activityType==="official"?"📋 公式":"🙋 自主"}</span>}
                        </p>
                      </div>
                    </div>
                    <ChevronRight size={15} color={C.textMuted} style={{ flexShrink:0 }}/>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── ポートフォリオ ──────────────────────────────────────── */}

        {screen==="reflection" && (
          <div>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:"1rem", padding:"8px 14px", background:`${C.warn}15`, borderRadius:12, border:`1px solid ${C.warn}33` }}>
              <TrendingUp size={16} color={C.warn}/>
              <div>
                <p style={{ margin:0, fontSize:13, fontWeight:700, color:C.warn }}>振り返りアンケート</p>
                <p style={{ margin:0, fontSize:11, color:C.textSub }}>7つの問いにそれぞれ1〜10で答えて提出しよう</p>
              </div>
            </div>

            {reflectionDone ? (
              <div style={{ ...S.cardGlow, textAlign:"center", padding:"2.5rem 1.5rem", borderColor:`${C.success}55` }}>
                <div style={{ fontSize:44, marginBottom:12 }}>🎉</div>
                <p style={{ fontSize:16, fontWeight:700, color:C.success, marginBottom:6 }}>振り返りを提出しました！</p>
                <p style={{ fontSize:13, color:C.textSub, marginBottom:20 }}>メンターが確認・採点します。<br/>結果はFBページで確認できます。</p>
                <div style={{ display:"flex", gap:10, justifyContent:"center", flexWrap:"wrap" }}>
                  <button style={S.btnPrimary} onClick={()=>setScreen("home")}>ホームへ戻る</button>
                  <button style={S.btn} onClick={()=>{ setReflectionDone(false); setReflectionAnswers({}); setReflectionTarget(""); setReflectionPhase("target"); setReflectionStep(0); setDrillAnswers({}); }}>続けて提出する</button>
                </div>
              </div>
            ) : surveyLoadErr ? (
              <div style={{ ...S.card, borderLeft:`3px solid ${C.accent2}`, marginBottom:12 }}>
                <p style={{ color:C.accent2, fontSize:13, margin:0 }}>⚠ アンケートの読み込みに失敗しました（{surveyLoadErr}）</p>
              </div>
            ) : !surveyDef ? (
              <div style={{ ...S.card, textAlign:"center", padding:"2rem" }}>
                <p style={{ color:C.textMuted, fontSize:13 }}>読み込み中...</p>
              </div>
            ) : (
              <>
                {myPending.length>0 && (
                  <div style={{ ...S.scard, borderLeft:`3px solid ${C.warn}`, marginBottom:"1rem", background:`${C.warn}08` }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <span style={{ fontSize:18 }}>⏳</span>
                      <div>
                        <p style={{ fontSize:13, color:C.warn, fontWeight:700, margin:0 }}>{myPending.length}件の振り返りが採点待ちです</p>
                        <p style={{ fontSize:11, color:C.textSub, margin:"2px 0 0" }}>メンターが採点後、FBページに反映されます</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* ─── フェーズ：振り返り対象入力 ─── */}
                {reflectionPhase === "target" && (
                  <div style={S.cardGlow}>
                    <p style={{ fontSize:14, fontWeight:700, color:C.text, marginBottom:4 }}>今日の振り返りを始めましょう</p>
                    <p style={{ fontSize:12, color:C.textSub, marginBottom:20 }}>15問の選択式アンケート＋深堀り2問に答えます（約5分）</p>
                    <label style={{ fontSize:12, fontWeight:700, color:C.textSub, display:"block", marginBottom:8 }}>
                      📝 何に対する振り返りですか？
                    </label>
                    <input
                      type="text"
                      value={reflectionTarget}
                      onChange={e => setReflectionTarget(e.target.value)}
                      placeholder="例：今日のグループワーク、プレゼン発表..."
                      style={{ ...S.input, marginBottom:16 }}
                    />
                    <label style={{ fontSize:12, fontWeight:700, color:C.textSub, display:"block", marginBottom:8 }}>
                      📅 振り返り日
                    </label>
                    <input
                      type="date"
                      value={reflectionDate}
                      onChange={e => setReflectionDate(e.target.value)}
                      style={{ ...S.input, marginBottom:20 }}
                    />
                    <button style={{ ...S.btnPrimary, width:"100%", display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}
                      onClick={()=>{ setReflectionPhase("survey"); setReflectionStep(0); }}>
                      開始する <ChevronRight size={15}/>
                    </button>
                  </div>
                )}

                {/* ─── フェーズ：アンケート 1問ずつ ＋ 深堀りインライン ─── */}
                {reflectionPhase === "survey" && (() => {
                  const allQs = surveyDef.sections.flatMap(s => s.questions);
                  const q = allQs[reflectionStep];
                  const secTitle = surveyDef.sections.find(s => s.questions.some(sq => sq.id === q.id))?.title || "";
                  const progress = ((reflectionStep) / allQs.length) * 100;
                  const mainSel = reflectionAnswers[q.id];
                  const dData   = drillAnswers[q.id] || {};
                  const skipDrill = mainSel === 0; // value:0 は「該当なし」→深堀り不要
                  const { d1q, d1opts, d2q, d2opts } = skipDrill ? { d1q:"", d1opts:[], d2q:"", d2opts:[] } : getDrillConfig(mainSel);
                  const isLast  = reflectionStep === allQs.length - 1;
                  const canNext = mainSel !== undefined && mainSel !== null && (skipDrill || (dData.d1 && dData.d2choice));

                  const setDrill = (field, val) => setDrillAnswers(prev => ({
                    ...prev, [q.id]: { ...(prev[q.id]||{}), [field]: val }
                  }));

                  const drillBtn = (label, field, val, current) => {
                    const isSel = current === val;
                    return (
                      <button key={val} onClick={()=>setDrill(field, val)}
                        style={{ textAlign:"left", padding:"10px 14px", borderRadius:9, fontSize:12,
                          fontWeight: isSel ? 700 : 400,
                          background: isSel ? `${C.primary}18` : C.surface2,
                          border: `1.5px solid ${isSel ? C.primary : C.border}`,
                          color: isSel ? C.primary : C.text, cursor:"pointer", transition:"all 0.15s",
                          boxShadow: isSel ? `0 0 0 2px ${C.primary}22` : "none" }}>
                        {label}
                      </button>
                    );
                  };

                  return (
                    <div>
                      {/* プログレスバー */}
                      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:6 }}>
                        <button style={{ background:"none", border:"none", cursor:"pointer", color:C.textSub, fontSize:12, padding:0, display:"flex", alignItems:"center", gap:4 }}
                          onClick={()=>{ if (reflectionStep===0) setReflectionPhase("target"); else setReflectionStep(s=>s-1); }}>
                          <ChevronLeft size={14}/> 戻る
                        </button>
                        <span style={{ fontSize:12, color:C.textMuted }}>Q{reflectionStep+1} / {allQs.length}</span>
                      </div>
                      <div style={{ height:5, background:C.surface2, borderRadius:99, marginBottom:18, overflow:"hidden" }}>
                        <div style={{ height:"100%", width:`${progress}%`, background:`linear-gradient(90deg,${C.primary},${C.accent1})`, borderRadius:99, transition:"width 0.4s" }}/>
                      </div>

                      <div style={S.cardGlow}>
                        {secTitle && (
                          <p style={{ fontSize:10, fontWeight:700, color:C.textSub, margin:"0 0 10px",
                            padding:"2px 8px", background:C.surface2, borderRadius:6, display:"inline-block", borderLeft:`3px solid ${C.primary}` }}>
                            {secTitle}
                          </p>
                        )}
                        <p style={{ fontSize:15, fontWeight:700, color:C.text, lineHeight:1.6, marginBottom:16 }}>
                          {q.text}
                        </p>

                        {/* ─ メイン選択肢 ─ */}
                        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                          {q.options.map((opt) => {
                            const isSel = mainSel === opt.value;
                            return (
                              <button key={opt.value}
                                onClick={()=>setReflectionAnswers(prev=>({...prev,[q.id]:opt.value}))}
                                style={{ textAlign:"left", padding:"12px 16px", borderRadius:10, fontSize:13,
                                  fontWeight: isSel ? 700 : 400,
                                  background: isSel ? `${C.primary}18` : C.surface2,
                                  border: `2px solid ${isSel ? C.primary : C.border}`,
                                  color: isSel ? C.primary : C.text,
                                  cursor:"pointer", transition:"all 0.15s",
                                  boxShadow: isSel ? `0 0 0 3px ${C.primary}22` : "none" }}>
                                {opt.label}
                              </button>
                            );
                          })}
                        </div>

                        {/* ─ 深堀り（メイン選択後に表示、value:0の「該当なし」は除く） ─ */}
                        {!!mainSel && !skipDrill && (
                          <>
                            <div style={{ borderTop:`1px dashed ${C.border}`, margin:"18px 0 14px" }}/>
                            <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:10 }}>
                              <span style={{ fontSize:16 }}>🔍</span>
                              <p style={{ fontSize:13, fontWeight:700, color:C.textSub, margin:0, lineHeight:1.4 }}>{d1q}</p>
                            </div>
                            <div style={{ display:"flex", flexDirection:"column", gap:7, marginBottom:16 }}>
                              {d1opts.map(opt => drillBtn(opt, "d1", opt, dData.d1))}
                            </div>

                            {/* ─ ネクストアクション（深堀り1選択後に表示） ─ */}
                            {dData.d1 && (
                              <>
                                <div style={{ borderTop:`1px dashed ${C.border}`, margin:"4px 0 14px" }}/>
                                <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:10 }}>
                                  <span style={{ fontSize:16 }}>⚡</span>
                                  <p style={{ fontSize:13, fontWeight:700, color:C.textSub, margin:0, lineHeight:1.4 }}>{d2q}</p>
                                </div>
                                <div style={{ display:"flex", flexDirection:"column", gap:7, marginBottom:14 }}>
                                  {d2opts.map(opt => drillBtn(opt, "d2choice", opt, dData.d2choice))}
                                </div>
                                {dData.d2choice && (
                                  <textarea
                                    value={dData.d2text||""}
                                    onChange={e=>setDrill("d2text", e.target.value)}
                                    placeholder="具体的には...（任意）"
                                    rows={2}
                                    style={{ ...S.textarea, minHeight:44, fontSize:12, marginBottom:4 }}
                                  />
                                )}
                              </>
                            )}
                          </>
                        )}
                      </div>

                      {/* ─ 次へ / 提出ボタン（全回答後に表示） ─ */}
                      {canNext && (
                        <button
                          style={{ ...S.btnPrimary, width:"100%", marginTop:14, display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}
                          onClick={()=>{
                            if (isLast) {
                              submitReflection(reflectionAnswers, "survey_json", "", "", allQs, { drillAnswers });
                            } else {
                              setReflectionStep(s => s + 1);
                            }
                          }}>
                          {isLast ? <><Save size={14}/> 振り返りを提出する</> : <>次の質問へ <ChevronRight size={15}/></>}
                        </button>
                      )}
                      {mainSel !== undefined && mainSel !== null && !canNext && !skipDrill && (
                        <p style={{ fontSize:11, color:C.textMuted, marginTop:10, textAlign:"center" }}>
                          🔍 と ⚡ にも答えると次へ進めます
                        </p>
                      )}
                    </div>
                  );
                })()}
              </>
            )}
          </div>
        )}

        {/* ─── FB（フィードバック） ──────────────────────────────────── */}
        {screen==="feedback" && (
          <div>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:"1rem", padding:"8px 14px", background:`${C.success}15`, borderRadius:12, border:`1px solid ${C.success}33` }}>
              <ThumbsUp size={16} color={C.success}/>
              <div>
                <p style={{ margin:0, fontSize:13, fontWeight:700, color:C.success }}>FB（フィードバック）</p>
                <p style={{ margin:0, fontSize:11, color:C.textSub }}>メンターからのフィードバック・問いを確認しよう</p>
              </div>
            </div>

            {/* メンターFB */}
            <div style={{ marginBottom:"1.25rem" }}>
              <p style={{ fontSize:12, fontWeight:700, color:C.textSub, marginBottom:10 }}>📩 メンターからのFB</p>
              {myFeedbacks.length===0 ? (
                <div style={{ ...S.card, textAlign:"center", padding:"2rem 1.5rem" }}>
                  <ThumbsUp size={36} color={C.success+"44"} style={{ marginBottom:12 }}/>
                  <p style={{ color:C.textSub, fontSize:13 }}>まだフィードバックはありません。</p>
                  <p style={{ color:C.textMuted, fontSize:12, marginTop:6 }}>振り返りを提出するとメンターからFBが届きます。</p>
                </div>
              ) : myFeedbacks.map((f, i) => (
                <div key={f.id} style={{ ...S.card, borderLeft:`3px solid ${C.success}`, marginBottom:"0.875rem" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <div style={{ width:28, height:28, borderRadius:"50%", background:`${C.success}22`, border:`1.5px solid ${C.success}55`, display:"flex", alignItems:"center", justifyContent:"center" }}>
                        <ThumbsUp size={12} color={C.success}/>
                      </div>
                      <span style={{ fontSize:12, color:C.textSub, fontWeight:500 }}>メンターより</span>
                    </div>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      {i===0 && <span style={{ fontSize:10, fontWeight:700, color:C.primary, background:`${C.primary}15`, border:`1px solid ${C.primary}33`, borderRadius:6, padding:"2px 7px" }}>NEW</span>}
                      <span style={{ fontSize:11, color:C.textMuted }}>{f.createdAt}</span>
                    </div>
                  </div>
                  <p style={{ fontSize:14, color:C.text, lineHeight:1.8, margin:0 }}>{f.text}</p>
                </div>
              ))}
            </div>

            {/* メンターからの問い */}
            {myQuestions.length>0 && (
              <div>
                <p style={{ fontSize:12, fontWeight:700, color:C.textSub, marginBottom:10 }}>💬 メンターからの問い</p>
                {(() => {
                  const unanswered = myQuestions.filter(q => !q.answer);
                  const answered   = myQuestions.filter(q =>  q.answer);
                  return (
                    <>
                      {unanswered.length > 0 && (
                        <div style={{ marginBottom:"1rem" }}>
                          <p style={{ fontSize:11, fontWeight:700, color:C.warn, marginBottom:8 }}>未回答 ({unanswered.length}件)</p>
                          {unanswered.map(q => (
                            <div key={q.id} style={{ ...S.card, borderLeft:`3px solid ${C.warn}`, marginBottom:"0.75rem" }}>
                              <span style={{ fontSize:11, color:C.textMuted }}>メンターより · {q.createdAt}</span>
                              <p style={{ fontSize:14, fontWeight:600, margin:"8px 0 12px", color:C.text, lineHeight:1.6 }}>{q.text}</p>
                              <div style={{ display:"flex", gap:8 }}>
                                <textarea value={answerMap[q.id]||""} onChange={e=>setAnswerMap(m=>({...m,[q.id]:e.target.value}))} placeholder="回答を入力..." style={{ ...S.textarea, flex:1, minHeight:60 }}/>
                                <button style={{ ...S.btnPrimary, alignSelf:"flex-end" }} onClick={()=>submitAnswer(q.id)}><Send size={14}/></button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      {answered.length > 0 && (
                        <div>
                          <p style={{ fontSize:11, fontWeight:700, color:C.success, marginBottom:8 }}>回答済み ({answered.length}件)</p>
                          {answered.map(q => (
                            <div key={q.id} style={{ ...S.card, opacity:0.8, marginBottom:"0.75rem" }}>
                              <span style={{ fontSize:11, color:C.textMuted }}>メンターより · {q.createdAt}</span>
                              <p style={{ fontSize:13, fontWeight:600, margin:"6px 0 8px", color:C.textSub, lineHeight:1.5 }}>{q.text}</p>
                              <div style={{ background:C.surface2, borderRadius:8, padding:"8px 12px", borderLeft:`2px solid ${C.success}` }}>
                                <span style={{ fontSize:11, color:C.success, fontWeight:600 }}>あなたの回答</span>
                                <p style={{ fontSize:13, margin:"4px 0 0", color:C.text, lineHeight:1.5 }}>{q.answer}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            )}
          </div>
        )}

        {/* ─── プロジェクト情報 ──────────────────────────────────────── */}
        {screen==="project" && (() => {
          const projKey = `project_info:${currentUser.id}`;
          const projInfo = storage.get(projKey) || {};
          const saveField = (field, value) => {
            storage.set(projKey, { ...storage.get(projKey)||{}, [field]: value });
            tick();
          };
          const fields = [
            { key:"name",    label:"プロジェクト名",  placeholder:"例：北海道農業スタートアップ支援PBL" },
            { key:"summary", label:"概要",           placeholder:"このプロジェクトについて説明してください" },
            { key:"goal",    label:"ゴール・目標",    placeholder:"最終的に達成したいこと" },
            { key:"period",  label:"期間",            placeholder:"例：2026年4月〜2027年3月" },
            { key:"issue",   label:"課題・テーマ",    placeholder:"取り組む課題や問い" },
            { key:"outcome", label:"期待される成果",  placeholder:"このプロジェクトを通じて期待される成果" },
          ];
          return (
            <div>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:"1rem", padding:"8px 14px", background:`${C.textSub}15`, borderRadius:12, border:`1px solid ${C.textSub}33` }}>
                <Info size={16} color={C.textSub}/>
                <div>
                  <p style={{ margin:0, fontSize:13, fontWeight:700, color:C.textSub }}>プロジェクト情報</p>
                  <p style={{ margin:0, fontSize:11, color:C.textSub }}>プロジェクトの概要・目標をメンバー全員で共有しよう</p>
                </div>
              </div>

              {currentUser.projectId && (
                <div style={{ ...S.scard, marginBottom:"1rem", background:`${C.primary}08`, borderLeft:`3px solid ${C.primary}` }}>
                  <p style={{ margin:0, fontSize:12, color:C.textSub }}>プロジェクトID</p>
                  <p style={{ margin:0, fontSize:16, fontWeight:700, color:C.primary }}>📁 {currentUser.projectId}</p>
                </div>
              )}

              <div style={S.cardGlow}>
                {fields.map(f => (
                  <div key={f.key} style={{ marginBottom:16 }}>
                    <label style={{ fontSize:12, fontWeight:700, color:C.textSub, display:"block", marginBottom:6 }}>{f.label}</label>
                    <textarea
                      defaultValue={projInfo[f.key] || ""}
                      placeholder={f.placeholder}
                      rows={f.key==="summary"||f.key==="goal"||f.key==="outcome" ? 3 : 2}
                      onBlur={e => saveField(f.key, e.target.value)}
                      style={{ ...S.textarea, minHeight: f.key==="summary"||f.key==="goal"||f.key==="outcome" ? 72 : 48 }}
                    />
                  </div>
                ))}
                <p style={{ fontSize:11, color:C.textMuted, marginTop:4 }}>※ 入力欄をタップして入力後、フォーカスを外すと自動保存されます</p>
              </div>
            </div>
          );
        })()}
      </div>

      {/* ─── ボトムナビゲーション ──────────────────────────────────── */}
      <div style={{ position:"fixed", bottom:0, left:0, right:0, background:C.surface, borderTop:`1px solid ${C.border}`, display:"flex", zIndex:30, overflowX:"hidden", paddingBottom:"env(safe-area-inset-bottom)" }}>
        {[
          { v:"home",      l:"ホーム",   icon:Home },
          { v:"log",       l:"ログ",     icon:BookOpen },
          { v:"reflection",l:"振り返り", icon:TrendingUp },
          { v:"feedback",  l:"FB",       icon:ThumbsUp },
        ].map(item => {
          const active = screen===item.v;
          return (
            <button key={item.v} style={{ flex:1, minWidth:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"10px 4px", background:"none", border:"none", borderTop:`2px solid ${active?C.primary:"transparent"}`, cursor:"pointer", color:active?C.primary:C.textMuted, gap:3, transition:"all 0.15s" }}
              onClick={() => setScreen(item.v)}>
              <item.icon size={20}/>
              <span style={{ fontSize:10, fontWeight:active?700:400, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", maxWidth:"100%" }}>{item.l}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
