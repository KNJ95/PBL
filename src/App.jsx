import { useState, useEffect, useMemo } from "react";
import {
  ClipboardList, BookOpen, Briefcase, LogOut,
  ChevronRight, Trash2, Save, Star,
  Users, MessageSquare, ThumbsUp, Zap, TrendingUp,
  BarChart2, Send, ArrowRight
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
  bg:           "#0A0A14",
  surface:      "#12111E",
  surface2:     "#1C1A2E",
  surface3:     "#252340",
  border:       "#2E2B4A",
  borderLight:  "#3D3A5C",
  text:         "#F0ECFF",
  textSub:      "#9B97BC",
  textMuted:    "#5E5A7A",
  accent1:      "#00C2FF",
  accent2:      "#FF6B6B",
  success:      "#00D48A",
  warn:         "#FFB800",
};

// ─── 評価定数 ──────────────────────────────────────────────────────────────
const AXES = [
  { id:1, key:"axis1", name:"課題設定力",      short:"課題",  category:"A" },
  { id:2, key:"axis2", name:"情報活用力",      short:"情報",  category:"A" },
  { id:3, key:"axis3", name:"不確実性への耐性", short:"不確実",category:"A" },
  { id:4, key:"axis4", name:"提案・発信力",    short:"提案",  category:"B" },
  { id:5, key:"axis5", name:"実行・改善力",    short:"実行",  category:"B" },
  { id:6, key:"axis6", name:"オーナーシップ",  short:"所有",  category:"B" },
  { id:7, key:"axis7", name:"協働・調整力",    short:"協働",  category:"C" },
  { id:8, key:"axis8", name:"自律・内発的動機", short:"動機",  category:"C" },
  { id:9, key:"axis9", name:"行動変容力",      short:"変容",  category:"C" },
];

const LEVELS = [
  { lv:1, name:"受動性", color:"#6B7280" },
  { lv:2, name:"能動性", color:C.accent1 },
  { lv:3, name:"自律性", color:C.primary },
  { lv:4, name:"創造性", color:C.warn },
];

const LEVEL_COLOR = { 1:"#6B7280", 2:C.accent1, 3:C.primary, 4:C.warn };

const REFLECTION_QUESTIONS = [
  { id:1, text:"以前に比べて積極的に発言できましたか？" },
  { id:2, text:"新たに学んだことはありましたか？" },
  { id:3, text:"思うように行かなかったことや困ったことはありましたか？" },
  { id:4, text:"失敗したなーと後悔したシーンはありましたか？" },
  { id:5, text:"チームと協力して動けましたか？" },
  { id:6, text:"自分から課題や問題を見つけようとしましたか？" },
  { id:7, text:"今日の活動への満足度はどのくらいですか？" },
];

const EMOTIONS = ["😢","😕","😐","🙂","😄"];

const DEMO_EXAMPLES = [
  { text:"チームの意見がバラバラで困ったが、先生に聞いて解決した。", scores:{1:1,2:1,3:1,4:1,5:1,6:1,7:1,8:2,9:1} },
  { text:"課題の原因を自分なりに分析し、インタビューを設計して実施した。", scores:{1:3,2:3,3:3,4:2,5:2,6:3,7:3,8:3,9:2} },
];

// ─── ストレージ ────────────────────────────────────────────────────────────
const storage = {
  get: (k) => { try { const v=localStorage.getItem(k); return v?JSON.parse(v):null; } catch { return null; } },
  set: (k,v) => { try { localStorage.setItem(k,JSON.stringify(v)); } catch {} },
  del: (k) => { try { localStorage.removeItem(k); } catch {} },
  keys: (prefix) => { try { return Object.keys(localStorage).filter(k=>k.startsWith(prefix)); } catch { return []; } },
};

const getStudents = () => storage.get("students_list") || [];
const getSurveys  = (uid) => storage.keys(`survey:${uid}:`).map(k=>storage.get(k)).filter(Boolean).sort((a,b)=>b.timestamp-a.timestamp);
const getLogs     = (uid) => storage.keys(`log:${uid}:`).map(k=>storage.get(k)).filter(Boolean).sort((a,b)=>b.timestamp-a.timestamp);
const getMentorSurveys = (sid) => storage.keys(`mentor_survey:${sid}:`).map(k=>storage.get(k)).filter(Boolean).sort((a,b)=>b.timestamp-a.timestamp);

// ─── インタラクション（問い/フィードバック）localStorage ──────────────────
const getQuestions  = () => storage.get("questions_store") || [];
const getFeedbacks  = () => storage.get("feedbacks_store") || [];
const getNextActions= (uid) => storage.get(`next_actions:${uid}`) || {};
const getPending    = () => storage.get("pending_evals") || [];

const saveQuestions  = (d) => storage.set("questions_store", d);
const saveFeedbacks  = (d) => storage.set("feedbacks_store", d);
const saveNextActions= (uid,d) => storage.set(`next_actions:${uid}`, d);
const savePending    = (d) => storage.set("pending_evals", d);

// ─── スタイル ──────────────────────────────────────────────────────────────
const S = {
  card:      { background:C.surface,  border:`1px solid ${C.border}`,  borderRadius:14, padding:"1.25rem", marginBottom:"0.875rem" },
  cardGlow:  { background:C.surface,  border:`1px solid ${C.primary}44`, borderRadius:14, padding:"1.25rem", marginBottom:"0.875rem", boxShadow:`0 0 24px ${C.primary}18` },
  scard:     { background:C.surface2, border:`1px solid ${C.border}`,  borderRadius:10, padding:"0.875rem 1rem", marginBottom:"0.5rem" },
  btn:       { cursor:"pointer", padding:"7px 18px", borderRadius:9, border:`1px solid ${C.border}`, background:"transparent", color:C.text, fontSize:13, fontFamily:"inherit", transition:"all 0.15s" },
  btnPrimary:{ cursor:"pointer", padding:"8px 20px", borderRadius:9, border:"none", background:`linear-gradient(135deg, ${C.primary}, ${C.primaryDark})`, color:"#fff", fontSize:13, fontFamily:"inherit", fontWeight:600, boxShadow:`0 4px 14px ${C.primary}44` },
  btnSuccess:{ cursor:"pointer", padding:"8px 20px", borderRadius:9, border:"none", background:C.success, color:"#000", fontSize:13, fontFamily:"inherit", fontWeight:600 },
  input:     { width:"100%", padding:"10px 13px", borderRadius:9, border:`1px solid ${C.border}`, background:C.surface2, color:C.text, fontSize:13, fontFamily:"inherit", outline:"none", boxSizing:"border-box", transition:"border-color 0.2s" },
  textarea:  { width:"100%", padding:"10px 13px", borderRadius:9, border:`1px solid ${C.border}`, background:C.surface2, color:C.text, fontSize:13, fontFamily:"inherit", resize:"vertical", minHeight:72, outline:"none", boxSizing:"border-box" },
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

function LvBar({ lv, maxLv=4, label="" }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
      {label && <span style={{ fontSize:11, color:C.textSub, minWidth:48 }}>{label}</span>}
      <div style={{ flex:1, height:6, background:C.surface3, borderRadius:99, overflow:"hidden" }}>
        <div style={{ height:"100%", width:`${(lv/maxLv)*100}%`, background:`linear-gradient(90deg,${C.primary},${C.accent1})`, borderRadius:99, transition:"width 0.4s" }}/>
      </div>
      <span style={{ fontSize:12, fontWeight:700, color:LEVEL_COLOR[lv]||C.textSub, minWidth:14 }}>{lv||"—"}</span>
    </div>
  );
}

// ─── 振り返り：メンチメーター形式 ─────────────────────────────────────────

// ─── スコア算出ロジック（JSON連携） ────────────────────────────────────────
function calcAxesFromAnswers(answers, questions) {
  // axisId → { raw, max }
  const accum = {};
  questions.forEach(q => {
    const val = answers[q.id];
    if (!val) return;
    Object.entries(q.axisWeights).forEach(([axisId, weight]) => {
      const id = parseInt(axisId);
      if (!accum[id]) accum[id] = { raw: 0, max: 0 };
      accum[id].raw += val * weight;
      accum[id].max += 4 * weight; // 最大値は4
    });
  });
  const axes = {};
  Object.entries(accum).forEach(([id, { raw, max }]) => {
    if (max === 0) return;
    const ratio = raw / max;
    axes[parseInt(id)] = Math.max(1, Math.min(4, Math.round(ratio * 4)));
  });
  return axes;
}

// ─── SurveyScreen：JSON連携アンケート画面 ──────────────────────────────────
function SurveyScreen({ currentUser, mySurveys, term, setTerm, axisScores, setAxisScores, saveSurvey }) {
  // survey_questions.json を public/ から fetch
  const [surveyDef, setSurveyDef]     = useState(null);
  const [loadErr, setLoadErr]         = useState(null);
  const [answers, setAnswers]         = useState({});
  const [curSection, setCurSection]   = useState(0);
  const [previewAxes, setPreviewAxes] = useState(null);

  useEffect(() => {
    fetch("/survey_questions.json")
      .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(d => setSurveyDef(d))
      .catch(e => setLoadErr(e.message));
  }, []);

  // 全質問をフラットに取得
  const allQuestions = surveyDef
    ? surveyDef.sections.flatMap(s => s.questions)
    : [];

  const answeredCount = Object.keys(answers).length;
  const totalCount    = allQuestions.length;
  const allAnswered   = answeredCount === totalCount;

  // セクション内の回答完了率
  const sectionProgress = (sec) =>
    sec.questions.filter(q => answers[q.id] !== undefined).length;

  // 回答するたびにプレビュースコアを更新
  const handleAnswer = (qid, val) => {
    const next = { ...answers, [qid]: val };
    setAnswers(next);
    setPreviewAxes(calcAxesFromAnswers(next, allQuestions));
  };

  // 保存
  const handleSave = () => {
    if (!term.trim() || !allAnswered) return;
    const axes = calcAxesFromAnswers(answers, allQuestions);
    saveSurvey(axes);
    setAnswers({});
    setCurSection(0);
    setPreviewAxes(null);
  };

  if (loadErr) return (
    <div style={{ ...S.card, borderColor: C.accent2 + "66", textAlign:"center", padding:"2rem" }}>
      <p style={{ color:C.accent2, fontWeight:700, marginBottom:8 }}>⚠ アンケートデータの読み込みに失敗しました</p>
      <p style={{ fontSize:12, color:C.textSub, marginBottom:16 }}>
        <code>public/survey_questions.json</code> を配置してください。<br/>エラー: {loadErr}
      </p>
      <p style={{ fontSize:12, color:C.textMuted }}>※ 開発時は <code>npm start</code> で自動検出されます。</p>
    </div>
  );

  if (!surveyDef) return (
    <div style={{ textAlign:"center", padding:"3rem", color:C.textSub }}>
      <div style={{ fontSize:24, marginBottom:8 }}>⏳</div>
      <p style={{ fontSize:13 }}>アンケートを読み込み中...</p>
    </div>
  );

  const sections = surveyDef.sections;
  const section  = sections[curSection];

  return (
    <div>
      {/* 今期の目標 */}
      <div style={{ ...S.cardGlow, marginBottom:"1.25rem" }}>
        <p style={{ fontSize:14, fontWeight:700, marginBottom:4, color:C.text }}>今期の目標</p>
        <p style={{ fontSize:12, color:C.textSub, marginBottom:10 }}>自分で立てた目標を記述してください。</p>
        <textarea value={term} onChange={e=>setTerm(e.target.value)} placeholder="今期取り組みたいテーマ・目標..." style={{ ...S.textarea, marginBottom:0 }}/>
      </div>

      {/* 全体プログレス */}
      <div style={{ marginBottom:"1.25rem" }}>
        <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, color:C.textSub, marginBottom:6 }}>
          <span>{surveyDef.description?.slice(0,30)}...</span>
          <span>{answeredCount} / {totalCount} 回答済み</span>
        </div>
        <div style={{ height:4, background:C.surface3, borderRadius:99 }}>
          <div style={{ height:4, background:`linear-gradient(90deg,${C.primary},${C.accent1})`, width:`${totalCount>0?(answeredCount/totalCount)*100:0}%`, borderRadius:99, transition:"width 0.3s" }}/>
        </div>
      </div>

      {/* セクションタブ */}
      <div style={{ display:"flex", gap:5, flexWrap:"wrap", marginBottom:"1.25rem" }}>
        {sections.map((sec, i) => {
          const done = sectionProgress(sec);
          const total = sec.questions.length;
          const complete = done === total;
          return (
            <button key={sec.id} onClick={()=>setCurSection(i)} style={{
              ...S.navBtn(curSection===i),
              position:"relative",
              paddingRight: complete ? 28 : undefined,
            }}>
              {sec.label}
              {complete && <span style={{ marginLeft:5, color:C.success, fontSize:11 }}>✓</span>}
              {!complete && done>0 && <span style={{ marginLeft:5, color:C.warn, fontSize:10 }}>{done}/{total}</span>}
            </button>
          );
        })}
      </div>

      {/* セクション説明 */}
      <div style={{ ...S.scard, borderLeft:`3px solid ${C.primary}`, marginBottom:"1.25rem" }}>
        <p style={{ fontSize:13, fontWeight:700, color:C.text, margin:"0 0 3px" }}>{section.label}</p>
        <p style={{ fontSize:12, color:C.textSub, margin:0 }}>{section.description}</p>
      </div>

      {/* 質問カード */}
      {section.questions.map((q, qi) => {
        const selected = answers[q.id];
        return (
          <div key={q.id} style={{
            ...S.card,
            padding:"1.25rem",
            borderColor: selected ? C.primary+"55" : C.border,
            background: selected ? C.primary+"08" : C.surface,
            transition:"all 0.2s",
            marginBottom:"0.75rem",
          }}>
            <div style={{ display:"flex", alignItems:"flex-start", gap:10, marginBottom:14 }}>
              <span style={{ fontSize:11, fontWeight:700, color:C.primary, background:C.primary+"22", border:`1px solid ${C.primary}44`, borderRadius:6, padding:"2px 8px", flexShrink:0, marginTop:1 }}>
                Q{(sections.slice(0,curSection).reduce((acc,s)=>acc+s.questions.length,0)) + qi + 1}
              </span>
              <p style={{ fontSize:14, color:C.text, margin:0, lineHeight:1.7, fontWeight:500 }}>{q.text}</p>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
              {q.options.map(opt => (
                <button key={opt.value} onClick={()=>handleAnswer(q.id, opt.value)} style={{
                  display:"flex", alignItems:"center", gap:12,
                  padding:"10px 14px", borderRadius:10, cursor:"pointer",
                  border:`1.5px solid ${selected===opt.value ? C.primary : C.border}`,
                  background: selected===opt.value ? C.primary+"18" : C.surface2,
                  color: selected===opt.value ? C.text : C.textSub,
                  fontSize:13, fontFamily:"inherit", textAlign:"left",
                  transition:"all 0.15s",
                }}>
                  <span style={{
                    width:20, height:20, borderRadius:"50%", flexShrink:0,
                    border:`2px solid ${selected===opt.value ? C.primary : C.borderLight}`,
                    background: selected===opt.value ? C.primary : "transparent",
                    display:"flex", alignItems:"center", justifyContent:"center",
                  }}>
                    {selected===opt.value && <span style={{ width:8, height:8, borderRadius:"50%", background:"#fff", display:"block" }}/>}
                  </span>
                  <span style={{ lineHeight:1.5 }}>{opt.label}</span>
                </button>
              ))}
            </div>
          </div>
        );
      })}

      {/* セクションナビ */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:"1rem", marginBottom:"1.5rem" }}>
        <button style={{ ...S.btn, opacity:curSection===0?0.3:1 }} disabled={curSection===0} onClick={()=>setCurSection(s=>s-1)}>← 前のセクション</button>
        {curSection < sections.length-1
          ? <button style={S.btnPrimary} onClick={()=>setCurSection(s=>s+1)}>次のセクション →</button>
          : null
        }
      </div>

      {/* プレビュースコア */}
      {previewAxes && answeredCount >= 5 && (
        <div style={{ ...S.card, borderColor:C.primary+"33", marginBottom:"1rem" }}>
          <p style={{ fontSize:13, fontWeight:700, color:C.text, marginBottom:4 }}>
            📊 現時点のスコアプレビュー
            <span style={{ fontSize:11, color:C.textSub, fontWeight:400, marginLeft:8 }}>（回答が増えるほど精度が上がります）</span>
          </p>
          <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginTop:8 }}>
            {AXES.map(a => {
              const lv = previewAxes[a.id];
              if (!lv) return null;
              return (
                <span key={a.id} style={{ ...S.badge(lv), fontSize:11 }}>
                  {a.short} Lv.{lv}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* 保存ボタン */}
      {allAnswered && (
        <button style={{ ...S.btnPrimary, width:"100%", padding:"13px", fontSize:14, display:"flex", alignItems:"center", justifyContent:"center", gap:8, marginBottom:"1.5rem" }} onClick={handleSave}>
          <Save size={16}/> 回答を保存する
        </button>
      )}
      {!allAnswered && (
        <p style={{ fontSize:12, color:C.textMuted, textAlign:"center", marginBottom:"1.5rem" }}>
          全 {totalCount} 問に回答するとスコアを計算して保存できます（残り {totalCount - answeredCount} 問）
        </p>
      )}

      {/* 過去の回答履歴 */}
      {mySurveys.length > 0 && (
        <div style={{ marginTop:"0.5rem" }}>
          <h3 style={{ fontSize:13, fontWeight:700, color:C.textSub, letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:12 }}>過去の回答</h3>
          {mySurveys.map(sv => (
            <div key={sv.timestamp} style={S.scard}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
                <span style={{ fontSize:12, color:C.textSub }}>{fmt(sv.timestamp)}</span>
                <span style={S.tag(C.primary)}>平均 Lv {axisAvg(sv.axes).toFixed(1)}</span>
              </div>
              <p style={{ fontSize:13, color:C.text, marginBottom:8 }}>{sv.term}</p>
              <div style={{ display:"flex", gap:3, flexWrap:"wrap" }}>
                {AXES.map(a => sv.axes?.[a.id] ? (
                  <span key={a.id} style={{ ...S.tag(LEVEL_COLOR[sv.axes[a.id]]||C.textMuted), fontSize:10 }}>{a.short} {sv.axes[a.id]}</span>
                ) : null)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MentimeterReflection({ onSubmit }) {
  const [step, setStep]       = useState(0);
  const [answers, setAnswers] = useState({});
  const [comment, setComment] = useState("");
  const total = REFLECTION_QUESTIONS.length;
  const done  = Object.keys(answers).length === total;
  const q     = REFLECTION_QUESTIONS[step];

  const select = (n) => {
    const next = { ...answers, [q.id]: n };
    setAnswers(next);
    if (step < total - 1) setTimeout(() => setStep(s => s + 1), 280);
  };

  return (
    <div style={{ maxWidth:520, margin:"0 auto" }}>
      {/* プログレス */}
      <div style={{ marginBottom:"1.5rem" }}>
        <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, color:C.textSub, marginBottom:6 }}>
          <span>質問 {step+1} / {total}</span>
          <span>{Math.round((step/total)*100)}%</span>
        </div>
        <div style={{ height:3, background:C.surface3, borderRadius:99 }}>
          <div style={{ height:3, background:`linear-gradient(90deg,${C.primary},${C.accent1})`, width:`${(step/total)*100}%`, borderRadius:99, transition:"width 0.3s" }}/>
        </div>
      </div>

      {!done ? (
        <div>
          <div style={{ background:C.surface2, border:`1px solid ${C.border}`, borderRadius:14, padding:"2rem 1.5rem", marginBottom:"1.25rem", textAlign:"center" }}>
            <p style={{ fontSize:15, lineHeight:1.8, margin:0, color:C.text }}>{q.text}</p>
          </div>
          <div style={{ display:"flex", gap:4, marginBottom:6 }}>
            {[1,2,3,4,5,6,7,8,9,10].map(n => (
              <button key={n} onClick={()=>select(n)} style={{ flex:1, padding:"10px 0", borderRadius:8, border:`1px solid ${answers[q.id]===n?C.primary:C.border}`, background:answers[q.id]===n?C.primary:"transparent", color:answers[q.id]===n?"#fff":C.textSub, fontSize:13, fontWeight:600, cursor:"pointer", transition:"all 0.15s" }}>{n}</button>
            ))}
          </div>
          <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, color:C.textMuted, marginBottom:"1.5rem" }}>
            <span>全くそう思わない</span><span>非常にそう思う</span>
          </div>
          <div style={{ display:"flex", gap:8 }}>
            {step>0 && <button style={S.btn} onClick={()=>setStep(s=>s-1)}>← 前へ</button>}
            {answers[q.id] && step<total-1 && <button style={S.btn} onClick={()=>setStep(s=>s+1)}>次へ →</button>}
          </div>
        </div>
      ) : (
        <div>
          <p style={{ fontSize:14, fontWeight:700, marginBottom:"1rem", color:C.text }}>回答まとめ</p>
          {REFLECTION_QUESTIONS.map(q => (
            <div key={q.id} style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
              <span style={{ fontSize:12, flex:1, color:C.textSub, lineHeight:1.5 }}>{q.text}</span>
              <div style={{ height:5, width:`${(answers[q.id]||0)*9}px`, background:`linear-gradient(90deg,${C.primary},${C.accent1})`, borderRadius:99, minWidth:2, transition:"width 0.3s" }}/>
              <span style={{ fontSize:13, fontWeight:700, minWidth:20, color:C.text }}>{answers[q.id]}</span>
            </div>
          ))}
          <div style={{ marginTop:"1.25rem" }}>
            <p style={{ fontSize:13, fontWeight:600, marginBottom:4, color:C.text }}>振り返りコメント（任意）</p>
            <p style={{ fontSize:12, color:C.textSub, marginBottom:8 }}>数値では表しきれなかったことを自由に書いてください。</p>
            <textarea value={comment} onChange={e=>setComment(e.target.value)} placeholder="例：チームの雰囲気が良く自分から発言しやすかった。次回はもっと提案を具体化したい。" style={{ ...S.textarea, marginBottom:12 }}/>
          </div>
          <div style={{ display:"flex", gap:8 }}>
            <button style={S.btnPrimary} onClick={()=>onSubmit(answers,"mentimeter",comment)}>提出する</button>
            <button style={S.btn} onClick={()=>{setStep(0);setAnswers({});setComment("");}}>やり直す</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── 振り返り：アンケート形式 ─────────────────────────────────────────────
function SurveyReflection({ onSubmit }) {
  const [answers, setAnswers] = useState({});
  const done = REFLECTION_QUESTIONS.every(q => answers[q.id]?.trim());
  return (
    <div>
      <p style={{ fontSize:12, color:C.textSub, marginBottom:"1rem" }}>各質問に自由に回答してください。</p>
      {REFLECTION_QUESTIONS.map(q => (
        <div key={q.id} style={{ marginBottom:"1.25rem" }}>
          <p style={{ fontSize:13, marginBottom:6, color:C.text, fontWeight:500 }}>{q.id}. {q.text}</p>
          <textarea value={answers[q.id]||""} onChange={e=>setAnswers(a=>({...a,[q.id]:e.target.value}))} placeholder="自由に記入してください..." style={{ ...S.textarea, minHeight:60 }}/>
        </div>
      ))}
      <button style={{ ...S.btnPrimary, opacity:done?1:0.4, cursor:done?"pointer":"default", marginTop:4 }} onClick={()=>done&&onSubmit(answers,"survey")} disabled={!done}>提出する</button>
    </div>
  );
}

// ─── メインアプリ ──────────────────────────────────────────────────────────
export default function App() {
  const [currentUser, setCurrentUser] = useState(() => storage.get("current_user"));
  const [screen, setScreen]           = useState("home");
  const [refresh, setRefresh]         = useState(0);
  const tick = () => setRefresh(r => r + 1);

  // 学生用 state
  const [term, setTerm]               = useState("");
  const [axisScores, setAxisScores]   = useState({});
  const [yatta, setYatta]             = useState("");
  const [wakatta, setWakatta]         = useState("");
  const [tsugi, setTsugi]             = useState("");
  const [emotion, setEmotion]         = useState(3);
  const [reflectMode, setReflectMode]       = useState("mentimeter");
  const [reflectionTab, setReflectionTab]   = useState("reflection");
  const [nextActInputs, setNextActInputs] = useState({});

  // メンター用 state
  const [selStudent, setSelStudent]   = useState(null);
  const [mentorScores, setMentorScores] = useState({});
  const [mentorNote, setMentorNote]   = useState("");
  const [newQuestion, setNewQuestion] = useState("");
  const [fbText, setFbText]           = useState("");
  const [scoringTarget, setScoringTarget] = useState(null);
  const [aiLoading, setAiLoading]     = useState(false);
  const [aiResult, setAiResult]       = useState(null);
  const [answerMap, setAnswerMap]     = useState({});
  const [mentorAxisScores, setMentorAxisScores] = useState({});
  const [mentorHistView, setMentorHistView] = useState("survey");

  // ログイン
  const [loginName, setLoginName]     = useState("");
  const [loginId, setLoginId]         = useState("");
  const [loginRole, setLoginRole]     = useState("student");

  const login = (u) => { storage.set("current_user", u); setCurrentUser(u); setScreen("home"); };
  const logout = () => { storage.del("current_user"); setCurrentUser(null); setScreen("home"); };

  const handleLogin = () => {
    if (!loginName.trim() || !loginId.trim()) return;
    const u = { id: loginId.trim(), name: loginName.trim(), role: loginRole };
    if (loginRole === "student") {
      const list = getStudents();
      if (!list.find(s => s.id === u.id)) {
        storage.set("students_list", [...list, { id:u.id, name:u.name, registeredAt:Date.now() }]);
      }
    }
    login(u);
  };

  // ─── データ取得 ──────────────────────────────────────────────────────────
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const mySurveys  = useMemo(() => currentUser ? getSurveys(currentUser.id)  : [], [currentUser, refresh]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const myLogs     = useMemo(() => currentUser ? getLogs(currentUser.id)     : [], [currentUser, refresh]);
  const latestSurvey = mySurveys[0] || null;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const students   = useMemo(() => getStudents(), [refresh]);

  // ─── レーダーチャートデータ ───────────────────────────────────────────
  const radarData = (selfSurvey, mentorSurvey) =>
    AXES.map(a => ({
      subject: a.short,
      自己: selfSurvey?.axes?.[a.id] || 0,
      他者: mentorSurvey?.axes?.[a.id] || 0,
      fullMark: 4,
    }));

  // ─── 学生：アンケート保存 ─────────────────────────────────────────────
  // JSON由来のcomputedAxesを受け取る形に変更
  const saveSurvey = (computedAxes) => {
    const axes = computedAxes || axisScores;
    const hasAny = AXES.some(a => axes[a.id]);
    if (!term.trim() || !hasAny) { alert("今期の目標とすべての質問への回答が必要です。"); return; }
    const ts = Date.now();
    storage.set(`survey:${currentUser.id}:${ts}`, { userID:currentUser.id, timestamp:ts, term, axes });
    setTerm(""); setAxisScores({}); tick();
    alert("アンケートを保存しました。");
  };

  // ─── 学生：ログ保存 ───────────────────────────────────────────────────
  const saveLog = () => {
    if (!yatta.trim() && !wakatta.trim() && !tsugi.trim()) return;
    const ts = Date.now();
    storage.set(`log:${currentUser.id}:${ts}`, { userID:currentUser.id, timestamp:ts, yatta, wakatta, tsugi, emotion });
    setYatta(""); setWakatta(""); setTsugi(""); setEmotion(3); tick();
  };

  // ─── 学生：振り返り提出 ───────────────────────────────────────────────
  const submitReflection = (answers, mode, comment="") => {
    const summary = REFLECTION_QUESTIONS.map(q => `${q.text} → ${typeof answers[q.id]==="number"?answers[q.id]+"/10":answers[q.id]}`).join("\n") + (comment?`\n\nコメント：${comment}`:"");
    const pending = getPending();
    savePending([...pending, { id:"pe"+Date.now(), studentId:currentUser.id, date:fmt(Date.now()), reflection:summary, answers, mode, status:"pending" }]);
    tick();
    alert("振り返りを提出しました。メンターが採点します。");
    setScreen("home");
  };

  // ─── 学生：NextAction ────────────────────────────────────────────────
  const saveNextAction = (axisId) => {
    const text = nextActInputs[axisId];
    if (!text?.trim()) return;
    const cur = getNextActions(currentUser.id);
    saveNextActions(currentUser.id, { ...cur, [axisId]:{ text, createdAt:fmt(Date.now()) } });
    setNextActInputs(m => ({ ...m, [axisId]:"" })); tick();
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
    });
    const newPending = getPending().filter(p => p.id !== pending.id);
    savePending(newPending);
    setAiResult(null); setMentorScores({}); setMentorNote(""); setScoringTarget(null); tick();
    alert("他者評価を確定しました。");
  };

  // ─── メンター：問い送信 ──────────────────────────────────────────────
  const postQuestion = () => {
    if (!newQuestion.trim() || !selStudent) return;
    const qs = getQuestions();
    saveQuestions([...qs, { id:"q"+Date.now(), mentorId:currentUser.id, studentId:selStudent.id, text:newQuestion, createdAt:fmt(Date.now()), answer:"" }]);
    setNewQuestion(""); tick();
  };

  // ─── メンター：フィードバック送信 ───────────────────────────────────
  const postFeedback = () => {
    if (!fbText.trim() || !selStudent) return;
    const fs = getFeedbacks();
    saveFeedbacks([...fs, { id:"f"+Date.now(), mentorId:currentUser.id, studentId:selStudent.id, text:fbText, createdAt:fmt(Date.now()) }]);
    setFbText(""); tick();
  };

  // ─── 学生：問い回答 ──────────────────────────────────────────────────
  const submitAnswer = (qid) => {
    const ans = answerMap[qid] || "";
    if (!ans.trim()) return;
    const qs = getQuestions().map(q => q.id===qid ? {...q, answer:ans} : q);
    saveQuestions(qs); setAnswerMap(m => ({...m,[qid]:""})); tick();
  };

  // ─── メンター：学生評価入力 ──────────────────────────────────────────
  const saveMentorEval = () => {
    if (!selStudent) return;
    const hasAny = AXES.some(a => mentorAxisScores[a.id]);
    if (!hasAny) return;
    const ts = Date.now();
    storage.set(`mentor_survey:${selStudent.id}:${ts}`, {
      studentId:selStudent.id, mentorId:currentUser.id,
      timestamp:ts, axes:{ ...mentorAxisScores }, note:mentorNote,
    });
    setMentorAxisScores({}); setMentorNote(""); tick();
    alert("評価を保存しました。");
  };

  // ─────────────────────────────────────────────────────────────────────
  // ログイン画面
  // ─────────────────────────────────────────────────────────────────────
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
          {/* ロール切替 */}
          <div style={{ display:"flex", gap:6, marginBottom:"1.5rem", background:C.surface2, borderRadius:10, padding:4 }}>
            {[{v:"student",l:"学生"},{v:"mentor",l:"メンター / 教員"}].map(r => (
              <button key={r.v} onClick={()=>setLoginRole(r.v)} style={{ flex:1, padding:"8px", borderRadius:7, border:"none", background:loginRole===r.v?C.primary:"transparent", color:loginRole===r.v?"#fff":C.textSub, fontSize:13, cursor:"pointer", fontWeight:loginRole===r.v?700:400, transition:"all 0.2s" }}>{r.l}</button>
            ))}
          </div>
          <div style={{ marginBottom:14 }}>
            <label style={{ fontSize:12, color:C.textSub, display:"block", marginBottom:6 }}>氏名</label>
            <input value={loginName} onChange={e=>setLoginName(e.target.value)} placeholder="例：山田 太郎" style={S.input}/>
          </div>
          <div style={{ marginBottom:20 }}>
            <label style={{ fontSize:12, color:C.textSub, display:"block", marginBottom:6 }}>ユーザーID</label>
            <input value={loginId} onChange={e=>setLoginId(e.target.value)} placeholder="例：yamada_taro" onKeyDown={e=>e.key==="Enter"&&handleLogin()} style={S.input}/>
          </div>
          <button style={{ ...S.btnPrimary, width:"100%", padding:"11px", fontSize:14, borderRadius:10 }} onClick={handleLogin}>
            はじめる <ChevronRight size={16} style={{ verticalAlign:"middle" }}/>
          </button>
        </div>
        <p style={{ fontSize:11, color:C.textMuted, textAlign:"center", marginTop:14 }}>デモ用：任意の氏名とIDで入れます</p>
      </div>
    </div>
  );

  // ─── 共通ヘッダー ─────────────────────────────────────────────────────
  const Header = () => (
    <div style={{ borderBottom:`1px solid ${C.border}`, padding:"0.875rem 1.5rem", display:"flex", alignItems:"center", justifyContent:"space-between", background:C.surface, position:"sticky", top:0, zIndex:20, backdropFilter:"blur(12px)" }}>
      <button style={{ background:"none", border:"none", cursor:"pointer", display:"flex", alignItems:"center", gap:10, padding:0 }} onClick={() => setScreen("home")}>
        <Star size={16} color={C.primary}/>
        <span style={{ fontSize:15, fontWeight:700, color:C.primary, letterSpacing:-0.3 }}>Be-Ready</span>
      </button>
      <button style={{ ...S.btn, padding:"5px 12px", fontSize:12 }} onClick={logout}><LogOut size={13} style={{ verticalAlign:"middle" }}/> ログアウト</button>
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
        <div style={{ maxWidth:780, margin:"0 auto", padding:"1.5rem" }}>
          <button style={{ ...S.btn, marginBottom:"1rem" }} onClick={()=>{setScoringTarget(null);setAiResult(null);setMentorScores({});}}>← 戻る</button>
          <div style={S.cardGlow}>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
              <Avatar name={p.studentId} size={34}/>
              <div>
                <p style={{ margin:0, fontWeight:700, fontSize:14 }}>{students.find(s=>s.id===p.studentId)?.name || p.studentId}</p>
                <p style={{ margin:0, fontSize:12, color:C.textSub }}>{p.date} · {p.mode==="mentimeter"?"メンチメーター形式":"アンケート形式"}</p>
              </div>
            </div>

            {/* 振り返り内容 */}
            <div style={{ background:C.surface2, borderRadius:10, padding:"1rem", marginBottom:"1rem" }}>
              {p.answers ? REFLECTION_QUESTIONS.map(q => (
                <div key={q.id} style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
                  <span style={{ fontSize:12, flex:1, color:C.textSub }}>{q.text}</span>
                  <div style={{ height:5, width:`${(p.answers[q.id]||0)*9}px`, background:`linear-gradient(90deg,${C.primary},${C.accent1})`, borderRadius:99, minWidth:2 }}/>
                  <span style={{ fontSize:13, fontWeight:600, minWidth:20, color:C.text }}>{p.answers[q.id]}</span>
                </div>
              )) : <p style={{ fontSize:13, color:C.textSub, whiteSpace:"pre-line", margin:0, lineHeight:1.7 }}>{p.reflection}</p>}
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
            <p style={{ fontSize:12, color:C.textSub, marginBottom:"1rem" }}>1=受動性　2=能動性　3=自律性　4=創造性</p>
            {AXES.map(a => {
              const aiScore = aiResult?.scores[a.id];
              const cur = mentorScores[a.id] || aiScore || 1;
              return (
                <div key={a.id} style={{ display:"flex", alignItems:"flex-start", gap:12, marginBottom:12, paddingBottom:12, borderBottom:`1px solid ${C.border}` }}>
                  <div style={{ minWidth:120 }}>
                    <p style={{ margin:0, fontSize:13, color:C.text, fontWeight:500 }}>{a.name}</p>
                    {aiScore && <p style={{ margin:0, fontSize:11, color:C.primary }}>AI提案: {aiScore}</p>}
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ display:"flex", gap:6, marginBottom:4 }}>
                      {[1,2,3,4].map(s => (
                        <button key={s} onClick={()=>setMentorScores(sc=>({...sc,[a.id]:s}))} style={{ padding:"5px 16px", borderRadius:7, border:`1px solid ${cur===s?C.primary:C.border}`, background:cur===s?C.primary+"22":"transparent", color:cur===s?C.primary:C.textSub, fontSize:13, cursor:"pointer", fontWeight:cur===s?700:400, transition:"all 0.15s" }}>{s}</button>
                      ))}
                      {mentorScores[a.id]!==undefined && aiScore && mentorScores[a.id]!==aiScore && <span style={S.tag(C.warn)}>修正済</span>}
                    </div>
                    {aiResult?.rationale?.[a.id] && <p style={{ fontSize:11, color:C.textMuted, margin:0, lineHeight:1.5 }}>{aiResult.rationale[a.id]}</p>}
                  </div>
                </div>
              );
            })}
            <textarea value={mentorNote} onChange={e=>setMentorNote(e.target.value)} placeholder="メンターコメント（任意）" style={{ ...S.textarea, marginBottom:12 }}/>
            <button style={S.btnSuccess} onClick={()=>approveEval(p)}>他者評価を確定・承認する</button>
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────
  // メンター画面
  // ─────────────────────────────────────────────────────────────────────
  if (currentUser.role === "mentor") {
    const pending   = getPending();
    const selQs     = selStudent ? getQuestions().filter(q=>q.studentId===selStudent.id) : [];
    const selFbs    = selStudent ? getFeedbacks().filter(f=>f.studentId===selStudent.id) : [];
    const selSurveys= selStudent ? getSurveys(selStudent.id) : [];
    const selLogs   = selStudent ? getLogs(selStudent.id) : [];
    const selMentorSvs = selStudent ? getMentorSurveys(selStudent.id) : [];
    const latestSelf  = selSurveys[0];
    const latestOther = selMentorSvs[0];

    return (
      <div style={{ minHeight:"100vh", background:C.bg, color:C.text, fontFamily:"system-ui,sans-serif" }}>
        <Header/>
        <div style={{ maxWidth:820, margin:"0 auto", padding:"1.5rem" }}>
          {/* ナビ */}
          <div style={{ display:"flex", gap:6, marginBottom:"1.5rem", flexWrap:"wrap" }}>
            {[
              { v:"home",      l:"学生一覧",    icon:Users },
              { v:"scoring",   l:`採点待ち${pending.length>0?" ("+pending.length+")":""}`, icon:ClipboardList },
              { v:"eval",      l:"評価入力",    icon:Star },
              { v:"questions", l:"問いを送る",  icon:MessageSquare },
              { v:"feedback",  l:"フィードバック", icon:ThumbsUp },
            ].map(item => (
              <button key={item.v} style={S.navBtn(screen===item.v)} onClick={()=>setScreen(item.v)}>
                <item.icon size={13} style={{ verticalAlign:"middle", marginRight:5 }}/>{item.l}
              </button>
            ))}
          </div>

          {/* 学生一覧 */}
          {screen==="home" && (
            <div>
              <h3 style={{ fontSize:16, fontWeight:700, marginBottom:"1rem", color:C.text }}>担当学生の進捗</h3>
              {students.length===0 && <p style={{ color:C.textSub, fontSize:13 }}>登録済み学生がいません。</p>}
              {students.map(st => {
                const svs  = getSurveys(st.id);
                const latest = svs[0];
                const pend = pending.filter(p=>p.studentId===st.id).length;
                const avg1 = latest ? axisAvg(latest.axes).toFixed(1) : "—";
                return (
                  <div key={st.id} style={{ ...S.card, cursor:"pointer" }} onClick={()=>{setSelStudent(st);setScreen("eval");}}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                        <Avatar name={st.name} size={38}/>
                        <div>
                          <p style={{ margin:0, fontWeight:700, fontSize:14, color:C.text }}>{st.name}</p>
                          <p style={{ margin:0, fontSize:12, color:C.textSub }}>ID: {st.id} · アンケート {svs.length}件</p>
                        </div>
                      </div>
                      <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                        {pend>0 && <span style={S.tag(C.accent2)}>採点待ち {pend}件</span>}
                        <div style={{ textAlign:"center" }}>
                          <p style={{ fontSize:22, fontWeight:700, color:C.primary, margin:0 }}>{avg1}</p>
                          <p style={{ fontSize:10, color:C.textMuted, margin:0 }}>平均Lv</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* 採点待ち */}
          {screen==="scoring" && (
            <div>
              <h3 style={{ fontSize:16, fontWeight:700, marginBottom:"1rem" }}>採点待ちの振り返り</h3>
              {pending.length===0 && <p style={{ color:C.textSub, fontSize:13 }}>採点待ちはありません。</p>}
              {pending.map(p => (
                <div key={p.id} style={S.card}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <Avatar name={p.studentId} size={30}/>
                      <div>
                        <p style={{ margin:0, fontSize:13, fontWeight:700 }}>{students.find(s=>s.id===p.studentId)?.name || p.studentId}</p>
                        <p style={{ margin:0, fontSize:11, color:C.textSub }}>{p.date} · {p.mode==="mentimeter"?"メンチメーター":"アンケート"}</p>
                      </div>
                    </div>
                    <button style={S.btnPrimary} onClick={()=>{setScoringTarget(p);setMentorScores({});setAiResult(null);}}>採点する</button>
                  </div>
                  <p style={{ fontSize:13, color:C.textSub, whiteSpace:"pre-line", lineHeight:1.7, margin:0 }}>{p.reflection.slice(0,200)}{p.reflection.length>200?"…":""}</p>
                </div>
              ))}
            </div>
          )}

          {/* 評価入力 */}
          {screen==="eval" && (
            <div>
              {/* 学生選択 */}
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:"1.25rem" }}>
                <label style={{ fontSize:13, color:C.textSub }}>対象学生：</label>
                <select value={selStudent?.id||""} onChange={e=>{ const s=students.find(x=>x.id===e.target.value); setSelStudent(s||null); }} style={{ ...S.input, width:"auto", padding:"7px 12px" }}>
                  <option value="">選択してください</option>
                  {students.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              {selStudent && (
                <>
                  {/* レーダーチャート（自己vs他者） */}
                  {latestSelf && (
                    <div style={S.card}>
                      <p style={{ fontSize:13, fontWeight:700, marginBottom:12, color:C.text }}>自己評価 vs 他者評価（最新）</p>
                      <ResponsiveContainer width="100%" height={240}>
                        <RadarChart data={radarData(latestSelf, latestOther)}>
                          <PolarGrid stroke="#5A5880" strokeDasharray="3 3"/>
                          <PolarAngleAxis dataKey="subject" tick={{ fontSize:12, fill:"#D0CCEE", fontWeight:600 }}/>
                          <Radar name="自己評価" dataKey="自己" stroke="#CC44FF" fill="#CC44FF" fillOpacity={0.5}/>
                          <Radar name="メンター評価" dataKey="他者" stroke="#00E5FF" fill="#00E5FF" fillOpacity={0.35}/>
                          <Legend wrapperStyle={{ fontSize:12 }}/>
                          <Tooltip contentStyle={{ background:C.surface2, border:`1px solid ${C.borderLight}`, borderRadius:8, fontSize:12 }}/>
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {/* 閲覧タブ */}
                  <div style={{ display:"flex", gap:6, marginBottom:"1rem" }}>
                    {[{v:"survey",l:"アンケート"},{v:"logs",l:"ログ"},{v:"mentor_hist",l:"評価履歴"}].map(t => (
                      <button key={t.v} style={S.navBtn(mentorHistView===t.v)} onClick={()=>setMentorHistView(t.v)}>{t.l}</button>
                    ))}
                  </div>

                  {mentorHistView==="survey" && selSurveys.map(sv => (
                    <div key={sv.timestamp} style={{ ...S.scard, marginBottom:10 }}>
                      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
                        <span style={{ fontSize:12, color:C.textSub }}>{fmt(sv.timestamp)}</span>
                        <span style={S.tag(C.primary)}>平均 Lv {axisAvg(sv.axes).toFixed(1)}</span>
                      </div>
                      <p style={{ fontSize:13, color:C.text, marginBottom:8 }}>{sv.term}</p>
                      <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
                        {AXES.map(a => <span key={a.id} style={{ ...S.tag(LEVEL_COLOR[sv.axes?.[a.id]]||C.textMuted), fontSize:10 }}>{a.short} {sv.axes?.[a.id]||"—"}</span>)}
                      </div>
                    </div>
                  ))}
                  {mentorHistView==="logs" && selLogs.map(lg => (
                    <div key={lg.timestamp} style={{ ...S.scard, marginBottom:10 }}>
                      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                        <span style={{ fontSize:20 }}>{EMOTIONS[lg.emotion-1]}</span>
                        <span style={{ fontSize:12, color:C.textSub }}>{fmt(lg.timestamp)}</span>
                      </div>
                      {[{l:"Y やったこと",v:lg.yatta},{l:"W わかったこと",v:lg.wakatta},{l:"T 次にやること",v:lg.tsugi}].filter(f=>f.v).map(f => (
                        <div key={f.l} style={{ marginBottom:6 }}>
                          <span style={{ fontSize:11, color:C.primary, fontWeight:700 }}>{f.l}</span>
                          <p style={{ fontSize:13, color:C.text, margin:"2px 0 0", lineHeight:1.5 }}>{f.v}</p>
                        </div>
                      ))}
                    </div>
                  ))}
                  {mentorHistView==="mentor_hist" && selMentorSvs.map(ms => (
                    <div key={ms.timestamp} style={{ ...S.scard, borderLeft:`3px solid ${C.success}`, marginBottom:10 }}>
                      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
                        <span style={{ fontSize:12, color:C.textSub }}>{fmt(ms.timestamp)}</span>
                        {ms.aiSuggested && <span style={S.tag(C.primary)}>AI採点あり</span>}
                      </div>
                      <div style={{ display:"flex", flexWrap:"wrap", gap:4, marginBottom:6 }}>
                        {AXES.map(a => <span key={a.id} style={{ ...S.tag(LEVEL_COLOR[ms.axes?.[a.id]]||C.textMuted), fontSize:10 }}>{a.short} {ms.axes?.[a.id]||"—"}</span>)}
                      </div>
                      {ms.note && <p style={{ fontSize:13, color:C.textSub, margin:0 }}>コメント: {ms.note}</p>}
                    </div>
                  ))}

                  {/* 評価入力フォーム */}
                  <div style={{ ...S.card, marginTop:16 }}>
                    <p style={{ fontSize:14, fontWeight:700, marginBottom:4, color:C.text }}>評価を入力（他者評価）</p>
                    <p style={{ fontSize:12, color:C.textSub, marginBottom:"1rem" }}>1=受動性　2=能動性　3=自律性　4=創造性</p>
                    {AXES.map(a => {
                      const cur = mentorAxisScores[a.id] || 0;
                      return (
                        <div key={a.id} style={{ display:"flex", alignItems:"center", gap:12, marginBottom:12, paddingBottom:12, borderBottom:`1px solid ${C.border}` }}>
                          <span style={{ fontSize:13, minWidth:120, color:C.text, fontWeight:500 }}>{a.name}</span>
                          <div style={{ display:"flex", gap:6 }}>
                            {[1,2,3,4].map(s => (
                              <button key={s} onClick={()=>setMentorAxisScores(sc=>({...sc,[a.id]:s}))} style={{ padding:"6px 16px", borderRadius:7, border:`1px solid ${cur===s?C.primary:C.border}`, background:cur===s?C.primary+"22":"transparent", color:cur===s?C.primary:C.textSub, fontSize:13, cursor:"pointer", fontWeight:cur===s?700:400 }}>{s}</button>
                            ))}
                          </div>
                          {cur>0 && <span style={S.badge(cur)}>{LEVELS[cur-1].name}</span>}
                        </div>
                      );
                    })}
                    <textarea value={mentorNote} onChange={e=>setMentorNote(e.target.value)} placeholder="コメント（任意）" style={{ ...S.textarea, marginBottom:12 }}/>
                    <button style={S.btnPrimary} onClick={saveMentorEval}>評価を保存</button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* 問いを送る */}
          {screen==="questions" && (
            <div>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:"1rem" }}>
                <label style={{ fontSize:13, color:C.textSub }}>対象学生：</label>
                <select value={selStudent?.id||""} onChange={e=>{ const s=students.find(x=>x.id===e.target.value); setSelStudent(s||null); }} style={{ ...S.input, width:"auto", padding:"7px 12px" }}>
                  <option value="">選択してください</option>
                  {students.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              {selStudent && (
                <>
                  <div style={S.card}>
                    <p style={{ fontSize:13, fontWeight:700, marginBottom:10, color:C.text }}>新しい問いを送る</p>
                    <textarea value={newQuestion} onChange={e=>setNewQuestion(e.target.value)} placeholder="問いを入力..." style={{ ...S.textarea, marginBottom:10 }}/>
                    <button style={S.btnPrimary} onClick={postQuestion}><Send size={13} style={{ verticalAlign:"middle", marginRight:5 }}/>送信</button>
                  </div>
                  {selQs.map(q => (
                    <div key={q.id} style={S.scard}>
                      <p style={{ fontSize:13, margin:"0 0 4px", color:C.text }}>{q.text}</p>
                      <span style={{ fontSize:11, color:C.textMuted }}>{q.createdAt}</span>
                      {q.answer && <div style={{ marginTop:8, background:C.surface3, borderRadius:8, padding:"8px 12px", fontSize:13, color:C.textSub }}><span style={{ fontSize:11, color:C.textMuted }}>回答：</span>{q.answer}</div>}
                    </div>
                  ))}
                </>
              )}
            </div>
          )}

          {/* フィードバック */}
          {screen==="feedback" && (
            <div>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:"1rem" }}>
                <label style={{ fontSize:13, color:C.textSub }}>対象学生：</label>
                <select value={selStudent?.id||""} onChange={e=>{ const s=students.find(x=>x.id===e.target.value); setSelStudent(s||null); }} style={{ ...S.input, width:"auto", padding:"7px 12px" }}>
                  <option value="">選択してください</option>
                  {students.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              {selStudent && (
                <>
                  <div style={S.card}>
                    <p style={{ fontSize:13, fontWeight:700, marginBottom:10, color:C.text }}>フィードバックを送る</p>
                    <textarea value={fbText} onChange={e=>setFbText(e.target.value)} placeholder="フィードバックを入力..." style={{ ...S.textarea, marginBottom:10 }}/>
                    <button style={S.btnPrimary} onClick={postFeedback}><Send size={13} style={{ verticalAlign:"middle", marginRight:5 }}/>送信</button>
                  </div>
                  {selFbs.map(f => (
                    <div key={f.id} style={{ ...S.scard, borderLeft:`3px solid ${C.success}` }}>
                      <span style={{ fontSize:11, color:C.textMuted }}>{f.createdAt}</span>
                      <p style={{ fontSize:13, margin:"6px 0 0", color:C.text }}>{f.text}</p>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────
  // 学生画面
  // ─────────────────────────────────────────────────────────────────────
  const myNextActions = getNextActions(currentUser.id);
  const myPending     = getPending().filter(p=>p.studentId===currentUser.id);
  const myQuestions   = getQuestions().filter(q=>q.studentId===currentUser.id);
  const myFeedbacks   = getFeedbacks().filter(f=>f.studentId===currentUser.id);
  const latestMentor  = getMentorSurveys(currentUser.id)[0];

  const unreadQ = myQuestions.filter(q=>!q.answer).length;

  return (
    <div style={{ minHeight:"100vh", background:C.bg, color:C.text, fontFamily:"system-ui,sans-serif" }}>
      <Header/>
      <div style={{ maxWidth:860, margin:"0 auto", padding:"1.5rem 1.5rem 5rem" }}>

        {/* ─── ホーム ─────────────────────────────────────────────── */}
        {screen==="home" && (
          <div>
            {/* 統計カード */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12, marginBottom:"1.25rem" }}>
              {[
                { l:"アンケート", v:mySurveys.length,  c:C.primary, icon:ClipboardList, s:"survey" },
                { l:"ログ",      v:myLogs.length,      c:C.accent1, icon:BookOpen,      s:"log"    },
                { l:"採点待ち",  v:myPending.length,   c:C.warn,    icon:Star,          s:"reflection" },
              ].map(item => (
                <button key={item.l} onClick={()=>setScreen(item.s)} style={{ ...S.card, cursor:"pointer", textAlign:"center", padding:"1.25rem 0.75rem", border:`1px solid ${item.c}33` }}>
                  <item.icon size={20} color={item.c} style={{ marginBottom:6 }}/>
                  <p style={{ fontSize:28, fontWeight:700, color:item.c, margin:"0 0 4px" }}>{item.v}</p>
                  <p style={{ fontSize:11, color:C.textSub, margin:0 }}>{item.l}</p>
                </button>
              ))}
            </div>

            {/* 通知 */}
            {myPending.length>0 && (
              <div style={{ ...S.scard, borderLeft:`3px solid ${C.warn}`, marginBottom:"1rem" }}>
                <p style={{ fontSize:13, color:C.warn, fontWeight:600, margin:0 }}>⏳ {myPending.length}件の振り返りがメンターの採点を待っています。</p>
              </div>
            )}
            {unreadQ>0 && (
              <div style={{ ...S.scard, borderLeft:`3px solid ${C.accent1}`, marginBottom:"1rem", cursor:"pointer" }} onClick={()=>{setScreen("reflection");setReflectionTab("questions");}}>
                <p style={{ fontSize:13, color:C.accent1, fontWeight:600, margin:0 }}>💬 メンターから未回答の問いが {unreadQ}件 あります。</p>
              </div>
            )}

            {/* レーダーチャート */}
            {latestSurvey && (
              <div style={{ ...S.card, marginBottom:"1.25rem" }}>
                <p style={{ fontSize:13, fontWeight:700, marginBottom:4, color:C.text }}>Be-Ready 評価レーダー</p>
                <p style={{ fontSize:12, color:C.textSub, marginBottom:12 }}>
                  自己評価{latestMentor ? " / メンター評価" : ""}（最新）
                </p>
                <ResponsiveContainer width="100%" height={260}>
                  <RadarChart data={radarData(latestSurvey, latestMentor)}>
                    <PolarGrid stroke="#5A5880" strokeDasharray="3 3"/>
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize:12, fill:"#D0CCEE", fontWeight:600 }}/>
                    <Radar name="自己評価" dataKey="自己" stroke="#CC44FF" fill="#CC44FF" fillOpacity={0.5}/>
                    {latestMentor && <Radar name="メンター評価" dataKey="他者" stroke="#00E5FF" fill="#00E5FF" fillOpacity={0.35}/>}
                    <Legend wrapperStyle={{ fontSize:12, color:C.textSub }}/>
                    <Tooltip contentStyle={{ background:C.surface2, border:`1px solid ${C.borderLight}`, borderRadius:8, fontSize:12 }}/>
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* クイックアクション */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
              {[
                { l:"アンケートを記入", d:"今期の目標と9軸評価", icon:ClipboardList, s:"survey", c:C.primary },
                { l:"ログを追加",       d:"YWT振り返りを記録",  icon:BookOpen,      s:"log",    c:C.accent1 },
                { l:"振り返りを提出",   d:"メンターに振り返りを送る", icon:TrendingUp, s:"reflection", c:C.warn },
                { l:"ポートフォリオ",   d:"成長の可視化を確認",  icon:Briefcase,    s:"portfolio", c:C.success },
              ].map(item => (
                <button key={item.l} onClick={()=>setScreen(item.s)} style={{ ...S.card, cursor:"pointer", textAlign:"left", display:"flex", alignItems:"center", gap:12, border:`1px solid ${item.c}22` }}>
                  <div style={{ width:38, height:38, borderRadius:10, background:item.c+"22", border:`1px solid ${item.c}44`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                    <item.icon size={18} color={item.c}/>
                  </div>
                  <div>
                    <p style={{ fontSize:13, fontWeight:700, color:C.text, margin:"0 0 2px" }}>{item.l}</p>
                    <p style={{ fontSize:11, color:C.textSub, margin:0 }}>{item.d}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ─── アンケート（間接評価・JSON連携） ──────────────────── */}
        {screen==="survey" && (
          <SurveyScreen
            currentUser={currentUser}
            mySurveys={mySurveys}
            term={term} setTerm={setTerm}
            axisScores={axisScores} setAxisScores={setAxisScores}
            saveSurvey={saveSurvey}
          />
        )}

        {/* ─── ログ（YWT） ─────────────────────────────────────────── */}
        {screen==="log" && (
          <div>
            <div style={S.cardGlow}>
              {[
                { l:"Y やったこと", v:yatta, set:setYatta, ph:"今日・今期に取り組んだこと" },
                { l:"W わかったこと", v:wakatta, set:setWakatta, ph:"気づき・学んだこと" },
                { l:"T 次にやること", v:tsugi, set:setTsugi, ph:"次のアクション" },
              ].map(f => (
                <div key={f.l} style={{ marginBottom:14 }}>
                  <label style={{ fontSize:12, fontWeight:700, color:C.primary, display:"block", marginBottom:6 }}>{f.l}</label>
                  <textarea value={f.v} onChange={e=>f.set(e.target.value)} placeholder={f.ph} style={{ ...S.textarea, minHeight:60 }}/>
                </div>
              ))}
              <div style={{ marginBottom:14 }}>
                <label style={{ fontSize:12, fontWeight:700, color:C.textSub, display:"block", marginBottom:8 }}>感情記録</label>
                <div style={{ display:"flex", gap:10, justifyContent:"center" }}>
                  {EMOTIONS.map((em,i) => (
                    <button key={i} onClick={()=>setEmotion(i+1)} style={{ fontSize:26, background:emotion===i+1?C.primary+"22":"transparent", border:`2px solid ${emotion===i+1?C.primary:"transparent"}`, borderRadius:12, width:48, height:48, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", transition:"all 0.15s" }}>{em}</button>
                  ))}
                </div>
              </div>
              <button style={{ ...S.btnPrimary, display:"flex", alignItems:"center", gap:8 }} onClick={saveLog}><Save size={14}/> 保存する</button>
            </div>

            {myLogs.length>0 && (
              <div style={{ marginTop:"1rem" }}>
                <h3 style={{ fontSize:14, fontWeight:700, color:C.textSub, letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:12 }}>過去のログ</h3>
                {myLogs.map(lg => (
                  <div key={lg.timestamp} style={S.scard}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                        <span style={{ fontSize:20 }}>{EMOTIONS[lg.emotion-1]}</span>
                        <span style={{ fontSize:12, color:C.textSub }}>{fmt(lg.timestamp)}</span>
                      </div>
                      <button onClick={()=>{ storage.del(`log:${currentUser.id}:${lg.timestamp}`); tick(); }} style={{ background:"none", border:"none", cursor:"pointer", color:C.textMuted, padding:4 }}><Trash2 size={13}/></button>
                    </div>
                    {[{l:"Y やったこと",v:lg.yatta},{l:"W わかったこと",v:lg.wakatta},{l:"T 次にやること",v:lg.tsugi}].filter(f=>f.v).map(f => (
                      <div key={f.l} style={{ marginBottom:6 }}>
                        <span style={{ fontSize:11, color:C.primary, fontWeight:700 }}>{f.l}</span>
                        <p style={{ fontSize:13, color:C.text, margin:"2px 0 0", lineHeight:1.5 }}>{f.v}</p>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── ポートフォリオ ──────────────────────────────────────── */}
        {screen==="portfolio" && (
          <div>
            {!latestSurvey ? (
              <div style={{ ...S.card, textAlign:"center", padding:"3rem" }}>
                <BarChart2 size={40} color={C.primary+"44"} style={{ marginBottom:12 }}/>
                <p style={{ color:C.textSub, marginBottom:16 }}>まだアンケートが記録されていません。</p>
                <button style={S.btnPrimary} onClick={()=>setScreen("survey")}>アンケートを入力する</button>
              </div>
            ) : (
              <>
                {/* レーダーチャート */}
                <div style={S.card}>
                  <p style={{ fontSize:13, fontWeight:700, marginBottom:4, color:C.text }}>自己評価 vs 他者評価</p>
                  <p style={{ fontSize:12, color:C.textSub, marginBottom:12 }}>最新のアンケートとメンター評価を重ねて表示します。</p>
                  <ResponsiveContainer width="100%" height={260}>
                    <RadarChart data={radarData(latestSurvey, latestMentor)}>
                      <PolarGrid stroke="#5A5880" strokeDasharray="3 3"/>
                      <PolarAngleAxis dataKey="subject" tick={{ fontSize:12, fill:"#D0CCEE", fontWeight:600 }}/>
                      <Radar name="自己評価" dataKey="自己" stroke="#CC44FF" fill="#CC44FF" fillOpacity={0.5}/>
                      {latestMentor && <Radar name="メンター評価" dataKey="他者" stroke="#00E5FF" fill="#00E5FF" fillOpacity={0.35}/>}
                      <Legend wrapperStyle={{ fontSize:12 }}/>
                      <Tooltip contentStyle={{ background:C.surface2, border:`1px solid ${C.borderLight}`, borderRadius:8, fontSize:12 }}/>
                    </RadarChart>
                  </ResponsiveContainer>
                </div>

                {/* 今期目標 */}
                <div style={{ ...S.card, borderColor:C.primary+"44" }}>
                  <p style={{ fontSize:12, fontWeight:700, color:C.primary, marginBottom:6 }}>今期の目標</p>
                  <p style={{ fontSize:14, color:C.text, margin:0, lineHeight:1.7 }}>{latestSurvey.term}</p>
                </div>

                {/* GAPとNextAction */}
                <div style={S.card}>
                  <p style={{ fontSize:14, fontWeight:700, marginBottom:4, color:C.text }}>GAP と NextAction</p>
                  <p style={{ fontSize:12, color:C.textSub, marginBottom:"1rem" }}>
                    <span style={{ color:C.primary }}>■ 自己</span>　<span style={{ color:C.accent1 }}>■ 他者</span>　GAPを確認して次の行動を設定してください。
                  </p>
                  {AXES.map(a => {
                    const self  = latestSurvey?.axes?.[a.id] || 0;
                    const other = latestMentor?.axes?.[a.id] || 0;
                    const gap   = self - other;
                    const existing = myNextActions[a.id];
                    return (
                      <div key={a.id} style={{ marginBottom:"1rem", paddingBottom:"1rem", borderBottom:`1px solid ${C.border}` }}>
                        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8, flexWrap:"wrap" }}>
                          <span style={{ fontSize:13, fontWeight:700, minWidth:110, color:C.text }}>{a.name}</span>
                          {self>0 && <span style={S.tag(C.primary)}>自己 {self}</span>}
                          {other>0 && <span style={S.tag(C.accent1)}>他者 {other}</span>}
                          {self>0 && other>0 && (
                            <span style={S.tag(gap>0?C.warn:gap<0?C.accent1:C.success)}>
                              {gap>0?`自己+${gap}`:gap<0?`他者+${Math.abs(gap)}`:"一致"}
                            </span>
                          )}
                        </div>
                        {existing ? (
                          <div style={{ background:C.surface2, border:`1px solid ${C.border}`, borderRadius:8, padding:"8px 12px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                            <span style={{ fontSize:13, color:C.text }}><ArrowRight size={12} style={{ verticalAlign:"middle", marginRight:4, color:C.success }}/>{existing.text}</span>
                            <button style={{ ...S.btn, fontSize:11, padding:"3px 10px" }} onClick={()=>{ const na=getNextActions(currentUser.id); delete na[a.id]; saveNextActions(currentUser.id,na); tick(); }}>変更</button>
                          </div>
                        ) : (
                          <div style={{ display:"flex", gap:8 }}>
                            <input value={nextActInputs[a.id]||""} onChange={e=>setNextActInputs(m=>({...m,[a.id]:e.target.value}))} placeholder="NextActionを入力..." style={{ ...S.input, flex:1 }}/>
                            <button style={S.btnPrimary} onClick={()=>saveNextAction(a.id)}>保存</button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* 9軸レベルバー */}
                <div style={S.card}>
                  <p style={{ fontSize:13, fontWeight:700, marginBottom:12, color:C.text }}>9軸スコア（最新）</p>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:14 }}>
                    {AXES.map(a => {
                      const self  = latestSurvey?.axes?.[a.id] || 0;
                      const other = latestMentor?.axes?.[a.id] || 0;
                      return (
                        <div key={a.id} style={{ background:C.surface2, borderRadius:10, padding:"10px 12px", border:`1px solid ${C.border}` }}>
                          <p style={{ fontSize:11, color:C.textSub, margin:"0 0 6px" }}>{a.name}</p>
                          <LvBar lv={self} label="自己" maxLv={4}/>
                          <div style={{ marginTop:4 }}>
                            <LvBar lv={other} label="他者" maxLv={4}/>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 強み・成長エリア */}
                {(() => {
                  const strong = AXES.filter(a => (latestSurvey.axes?.[a.id]||0) >= 3);
                  const grow   = AXES.filter(a => (latestSurvey.axes?.[a.id]||0) <= 2 && (latestSurvey.axes?.[a.id]||0) > 0);
                  return strong.length>0 || grow.length>0 ? (
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                      {strong.length>0 && (
                        <div style={{ ...S.card, borderColor:C.success+"44" }}>
                          <p style={{ fontSize:12, fontWeight:700, color:C.success, marginBottom:8 }}>💪 強みのエリア（Lv3以上）</p>
                          {strong.map(a => <div key={a.id} style={{ ...S.tag(C.success), display:"block", marginBottom:4, fontSize:12 }}>{a.name} Lv.{latestSurvey.axes[a.id]}</div>)}
                        </div>
                      )}
                      {grow.length>0 && (
                        <div style={{ ...S.card, borderColor:C.warn+"44" }}>
                          <p style={{ fontSize:12, fontWeight:700, color:C.warn, marginBottom:8 }}>🌱 成長のエリア</p>
                          {grow.map(a => <div key={a.id} style={{ ...S.tag(C.warn), display:"block", marginBottom:4, fontSize:12 }}>{a.name} Lv.{latestSurvey.axes[a.id]}</div>)}
                        </div>
                      )}
                    </div>
                  ) : null;
                })()}
              </>
            )}
          </div>
        )}

        {/* ─── 振り返り（問いへの回答・フィードバック含む） ──────── */}
        {screen==="reflection" && (
          <div>
            {/* サブタブ */}
            <div style={{ display:"flex", gap:4, marginBottom:"1.25rem", background:C.surface2, borderRadius:10, padding:4 }}>
              {[
                { v:"reflection", l:"振り返り" },
                { v:"questions",  l:`問いへの回答${unreadQ>0?` (${unreadQ})`:""}` },
                { v:"feedback",   l:"フィードバック" },
              ].map(t => (
                <button key={t.v} onClick={()=>setReflectionTab(t.v)} style={{ flex:1, padding:"8px 12px", borderRadius:7, border:"none", background:reflectionTab===t.v?C.primary:"transparent", color:reflectionTab===t.v?"#fff":C.textSub, fontSize:13, cursor:"pointer", fontWeight:reflectionTab===t.v?700:400, transition:"all 0.2s" }}>{t.l}</button>
              ))}
            </div>

            {/* 振り返り入力 */}
            {reflectionTab==="reflection" && (
              <div>
                {myPending.length>0 && (
                  <div style={{ ...S.scard, borderLeft:`3px solid ${C.warn}`, marginBottom:"1rem" }}>
                    <p style={{ fontSize:13, color:C.warn, margin:0 }}>⏳ {myPending.length}件の振り返りがメンターの採点を待っています。</p>
                  </div>
                )}
                <div style={{ display:"flex", gap:6, marginBottom:"1.5rem", background:C.surface2, borderRadius:10, padding:4, width:"fit-content" }}>
                  {[{v:"mentimeter",l:"⚡ メンチメーター形式"},{v:"survey",l:"📋 アンケート形式"}].map(m => (
                    <button key={m.v} onClick={()=>setReflectMode(m.v)} style={{ padding:"8px 16px", borderRadius:7, border:"none", background:reflectMode===m.v?C.primary:"transparent", color:reflectMode===m.v?"#fff":C.textSub, fontSize:13, cursor:"pointer", fontWeight:reflectMode===m.v?700:400, transition:"all 0.2s" }}>{m.l}</button>
                  ))}
                </div>
                <div style={S.card}>
                  <p style={{ fontSize:14, fontWeight:700, marginBottom:4, color:C.text }}>
                    {reflectMode==="mentimeter"?"1問ずつ回答する":"全問まとめて回答する"}
                  </p>
                  <p style={{ fontSize:12, color:C.textSub, marginBottom:"1.25rem" }}>
                    {reflectMode==="mentimeter"?"質問が1問ずつ表示されます。直感で回答してください。":"全ての質問が表示されます。自分のペースで回答してください。"}
                  </p>
                  {reflectMode==="mentimeter"
                    ? <MentimeterReflection onSubmit={submitReflection}/>
                    : <SurveyReflection onSubmit={submitReflection}/>
                  }
                </div>
              </div>
            )}

            {/* 問いへの回答 */}
            {reflectionTab==="questions" && (
              <div>
                {myQuestions.length===0 && <p style={{ color:C.textSub, fontSize:13 }}>まだメンターから問いはありません。</p>}
                {myQuestions.map(q => (
                  <div key={q.id} style={S.card}>
                    <span style={{ fontSize:11, color:C.textMuted }}>メンターより · {q.createdAt}</span>
                    <p style={{ fontSize:14, fontWeight:600, margin:"8px 0 10px", color:C.text }}>{q.text}</p>
                    {q.answer ? (
                      <div style={{ background:C.surface2, borderRadius:8, padding:"8px 12px" }}>
                        <span style={{ fontSize:11, color:C.textMuted }}>あなたの回答：</span>
                        <p style={{ fontSize:13, margin:"4px 0 0", color:C.text }}>{q.answer}</p>
                      </div>
                    ) : (
                      <div style={{ display:"flex", gap:8 }}>
                        <textarea value={answerMap[q.id]||""} onChange={e=>setAnswerMap(m=>({...m,[q.id]:e.target.value}))} placeholder="回答を入力..." style={{ ...S.textarea, flex:1, minHeight:50 }}/>
                        <button style={S.btnPrimary} onClick={()=>submitAnswer(q.id)}><Send size={14}/></button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* フィードバック */}
            {reflectionTab==="feedback" && (
              <div>
                {myFeedbacks.length===0 && <p style={{ color:C.textSub, fontSize:13 }}>まだフィードバックはありません。</p>}
                {myFeedbacks.map(f => (
                  <div key={f.id} style={{ ...S.card, borderLeft:`3px solid ${C.success}` }}>
                    <span style={{ fontSize:11, color:C.textMuted }}>{f.createdAt} · メンターより</span>
                    <p style={{ fontSize:14, marginTop:8, color:C.text, lineHeight:1.7 }}>{f.text}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ─── ボトムナビゲーション ──────────────────────────────────── */}
      <div style={{ position:"fixed", bottom:0, left:0, right:0, background:C.surface, borderTop:`1px solid ${C.border}`, display:"flex", zIndex:30 }}>
        {[
          { v:"survey",    l:"アンケート",    icon:ClipboardList },
          { v:"log",       l:"ログ",          icon:BookOpen },
          { v:"portfolio", l:"ポートフォリオ", icon:Briefcase },
          { v:"reflection",l:"振り返り",      icon:TrendingUp },
        ].map(item => {
          const active = screen===item.v;
          return (
            <button key={item.v} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"10px 0 calc(10px + env(safe-area-inset-bottom))", background:"none", border:"none", borderTop:`2px solid ${active?C.primary:"transparent"}`, cursor:"pointer", color:active?C.primary:C.textMuted, gap:3, transition:"all 0.15s" }}
              onClick={() => setScreen(item.v)}>
              <item.icon size={20}/>
              <span style={{ fontSize:10, fontWeight:active?700:400 }}>{item.l}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
