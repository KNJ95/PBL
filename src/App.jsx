import { useState, useEffect, useMemo, useRef } from "react";
import {
  Home, ClipboardList, BookOpen, Briefcase, LogOut,
  ChevronRight, Trash2, Save, Star,
  Users, MessageSquare, ThumbsUp, Zap, TrendingUp,
  BarChart2, Send, ArrowRight, Camera, Sparkles, X
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
  { id:2, key:"axis2", name:"情報活用力",      short:"情報",  category:"A", ref:true,  evalText:"情報を活用できるか（※基準未確定・参考値）" },
  { id:3, key:"axis3", name:"不確実性への耐性", short:"不確実",category:"A", ref:false, evalText:"不確実性の高い仕事でも粘り強くかつ柔軟に取り組めるか" },
  { id:4, key:"axis4", name:"提案・発信力",    short:"提案",  category:"B", ref:false, evalText:"やるべき・やりたいと考えることを他者に伝えられるか" },
  { id:5, key:"axis5", name:"実行・改善力",    short:"実行",  category:"B", ref:false, evalText:"他でもない自分のこととして粘り強く関われるか" },
  { id:6, key:"axis6", name:"オーナーシップ",  short:"責任",  category:"B", ref:false, evalText:"やりたいと思っているか・意味を自分なりに理解できているか" },
  { id:7, key:"axis7", name:"協働・調整力",    short:"協働",  category:"C", ref:false, evalText:"他者の意見を取り入れつつ柔軟に対応できるか" },
  { id:8, key:"axis8", name:"自律・内発的動機", short:"動機",  category:"C", ref:true,  evalText:"なぜやるかを自分で語れるか（※基準未確定・参考値）" },
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

  const handleAnswer = (qid, val) => {
    setAnswers(prev => ({ ...prev, [qid]: val }));
  };

  // 保存
  const handleSave = () => {
    if (!term.trim() || !allAnswered) return;
    const axes = calcAxesFromAnswers(answers, allQuestions);
    saveSurvey(axes);
    setAnswers({});
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
          <span>{answeredCount} / {totalCount} 問回答済み</span>
          <span style={{ color: answeredCount===totalCount ? C.success : C.textSub }}>{answeredCount===totalCount?"完了":"未完了"}</span>
        </div>
        <div style={{ height:4, background:C.surface3, borderRadius:99 }}>
          <div style={{ height:4, background:`linear-gradient(90deg,${C.primary},${C.accent1})`, width:`${totalCount>0?(answeredCount/totalCount)*100:0}%`, borderRadius:99, transition:"width 0.3s" }}/>
        </div>
      </div>

      {/* 質問カード（全セクション一括表示） */}
      {(() => {
        let qNum = 0;
        return sections.map(sec => (
          <div key={sec.id}>
            <div style={{ ...S.scard, borderLeft:`3px solid ${C.primary}`, marginBottom:"1rem" }}>
              <p style={{ fontSize:13, fontWeight:700, color:C.text, margin:"0 0 3px" }}>{sec.label}</p>
              <p style={{ fontSize:12, color:C.textSub, margin:0 }}>{sec.description}</p>
            </div>
            {sec.questions.map(q => {
              qNum++;
              const qIndex = qNum;
              const selected = answers[q.id];
              const isAnswered = q.id in answers;
              return (
                <div key={q.id} style={{
                  ...S.card,
                  padding:"1.25rem",
                  borderColor: isAnswered ? C.primary+"55" : C.border,
                  background: isAnswered ? C.primary+"08" : C.surface,
                  transition:"all 0.2s",
                  marginBottom:"0.75rem",
                }}>
                  <div style={{ display:"flex", alignItems:"flex-start", gap:10, marginBottom:14 }}>
                    <span style={{ fontSize:11, fontWeight:700, color:C.primary, background:C.primary+"22", border:`1px solid ${C.primary}44`, borderRadius:6, padding:"2px 8px", flexShrink:0, marginTop:1 }}>
                      Q{qIndex}
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
          </div>
        ));
      })()}


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
                  <span key={a.id} style={{ ...S.tag(a.ref ? C.textMuted : (LEVEL_COLOR[sv.axes[a.id]]||C.textMuted)), fontSize:10, opacity: a.ref ? 0.65 : 1 }}>
                    {a.short} {sv.axes[a.id]}{a.ref ? " ※" : ""}
                  </span>
                ) : null)}
              </div>
              {AXES.some(a => a.ref && sv.axes?.[a.id]) && (
                <p style={{ fontSize:10, color:C.textMuted, margin:"4px 0 0" }}>※ 参考値（基準未確定）</p>
              )}
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

// ─── アンケート保存後フィードバックモーダル ────────────────────────────────
function SurveyResultModal({ result, onClose, onPortfolio }) {
  const { axes, term } = result;
  const strong   = AXES.filter(a => !a.ref && (axes[a.id] || 0) >= 3);
  const grow     = AXES.filter(a => !a.ref && (axes[a.id] || 0) > 0 && (axes[a.id] || 0) <= 2);
  const refAxes  = AXES.filter(a => a.ref  && (axes[a.id] || 0) > 0);
  const allVals  = AXES.map(a => axes[a.id]).filter(Boolean);
  const avgLv    = allVals.length ? (allVals.reduce((a,b) => a+b,0) / allVals.length).toFixed(1) : "—";

  const radarD = AXES.map(a => ({
    subject: a.ref ? `${a.short}※` : a.short,
    自己: axes[a.id] || 0,
    fullMark: 4,
  }));

  const lvComment = (lv) => [
    "まだ外からの視点で見ている段階です。少しずつ自分事として考えてみましょう。",
    "他者の立場から理解できています。次は自分の視点で深めましょう。",
    "自分の視点から確かに理解できています。この強みを広げていきましょう！",
    "自ら新たな価値を生み出せています。ぜひその視点を周囲と共有してください！",
  ][lv - 1] || "";

  return (
    <div style={{ position:"fixed", inset:0, zIndex:1000, background:"rgba(90,0,160,0.12)", backdropFilter:"blur(4px)", display:"flex", alignItems:"flex-start", justifyContent:"center", overflowY:"auto", padding:"1rem" }}>
      <div style={{ width:"100%", maxWidth:520, background:C.surface, borderRadius:20, border:`1.5px solid ${C.primary}55`, boxShadow:`0 8px 40px ${C.primary}20`, padding:"1.5rem", margin:"auto" }}>

        {/* ヘッダー */}
        <div style={{ textAlign:"center", marginBottom:"1.25rem" }}>
          <div style={{ fontSize:40, marginBottom:8 }}>🎉</div>
          <h2 style={{ fontSize:20, fontWeight:700, color:C.text, margin:"0 0 6px" }}>アンケートを保存しました！</h2>
          <p style={{ fontSize:12, color:C.textSub, margin:0 }}>今期の目標：{term}</p>
        </div>

        {/* 平均レベル */}
        <div style={{ textAlign:"center", marginBottom:"1.25rem" }}>
          <div style={{ display:"inline-flex", alignItems:"center", gap:10, background:C.primary+"15", border:`1px solid ${C.primary}44`, borderRadius:12, padding:"8px 24px" }}>
            <span style={{ fontSize:13, color:C.textSub }}>平均レベル</span>
            <span style={{ fontSize:26, fontWeight:700, color:C.primary }}>{avgLv}</span>
          </div>
        </div>

        {/* レーダーチャート */}
        <div style={{ height:200, marginBottom:"1.25rem" }}>
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarD}>
              <PolarGrid stroke="rgba(117,0,192,0.2)" strokeDasharray="3 3"/>
              <PolarAngleAxis dataKey="subject" tick={{ fontSize:11, fill:"#460073", fontWeight:600 }}/>
              <Radar name="自己評価" dataKey="自己" stroke="#CC44FF" fill="#CC44FF" fillOpacity={0.4}/>
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* 強みのエリア */}
        {strong.length > 0 && (
          <div style={{ marginBottom:"1rem" }}>
            <p style={{ fontSize:13, fontWeight:700, color:C.success, margin:"0 0 8px" }}>💪 強みのエリア（Lv.3以上）</p>
            {strong.map(a => (
              <div key={a.id} style={{ ...S.scard, borderLeft:`3px solid ${C.success}`, marginBottom:6 }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                  <span style={S.badge(axes[a.id])}>{LEVELS.find(l=>l.lv===axes[a.id])?.name} Lv.{axes[a.id]}</span>
                  <span style={{ fontSize:13, fontWeight:700, color:C.text }}>{a.name}</span>
                </div>
                <p style={{ fontSize:12, color:C.textSub, margin:0, lineHeight:1.6 }}>{lvComment(axes[a.id])}</p>
              </div>
            ))}
          </div>
        )}

        {/* 成長のエリア */}
        {grow.length > 0 && (
          <div style={{ marginBottom:"1rem" }}>
            <p style={{ fontSize:13, fontWeight:700, color:C.accent1, margin:"0 0 8px" }}>🌱 成長のエリア（Lv.1〜2）</p>
            {grow.map(a => (
              <div key={a.id} style={{ ...S.scard, borderLeft:`3px solid ${C.accent1}`, marginBottom:6 }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                  <span style={S.badge(axes[a.id])}>{LEVELS.find(l=>l.lv===axes[a.id])?.name} Lv.{axes[a.id]}</span>
                  <span style={{ fontSize:13, fontWeight:700, color:C.text }}>{a.name}</span>
                </div>
                <p style={{ fontSize:12, color:C.textSub, margin:0, lineHeight:1.6 }}>{lvComment(axes[a.id])}</p>
              </div>
            ))}
          </div>
        )}

        {/* 参考値 */}
        {refAxes.length > 0 && (
          <div style={{ marginBottom:"1rem" }}>
            <p style={{ fontSize:11, color:C.textMuted, margin:"0 0 6px" }}>※ 参考値（基準未確定）</p>
            <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
              {refAxes.map(a => (
                <span key={a.id} style={{ ...S.tag(C.textMuted), opacity:0.7 }}>{a.name} Lv.{axes[a.id]}</span>
              ))}
            </div>
          </div>
        )}

        {/* ボタン */}
        <div style={{ display:"flex", gap:10, marginTop:8 }}>
          <button style={{ ...S.btn, flex:1, justifyContent:"center" }} onClick={onClose}>閉じる</button>
          <button style={{ ...S.btnPrimary, flex:2, justifyContent:"center", display:"flex", alignItems:"center", gap:6 }} onClick={onPortfolio}>
            <Briefcase size={14}/> ポートフォリオを確認
          </button>
        </div>
      </div>
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
  const [reflectionDone, setReflectionDone] = useState(false);
  const [nextActInputs, setNextActInputs] = useState({});
  const [logPhoto, setLogPhoto]             = useState(null);
  const [portfolioAiLoading, setPortfolioAiLoading] = useState(false);
  const [portfolioAiResult, setPortfolioAiResult]   = useState(null);
  const [surveyResult, setSurveyResult]             = useState(null);
  const photoInputRef = useRef(null);

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
  const [loginTeam, setLoginTeam]     = useState("");
  const [loginRole, setLoginRole]     = useState("student");

  const login = (u) => { storage.set("current_user", u); setCurrentUser(u); setScreen("home"); };
  const logout = () => { storage.del("current_user"); setCurrentUser(null); setScreen("home"); };

  const handleLogin = () => {
    if (!loginName.trim() || !loginId.trim() || !loginTeam.trim()) return;
    const u = { id: loginId.trim(), name: loginName.trim(), role: loginRole, team: loginTeam.trim() };
    if (loginRole === "student") {
      const list = getStudents();
      const existing = list.find(s => s.id === u.id);
      if (!existing) {
        storage.set("students_list", [...list, { id:u.id, name:u.name, team:u.team, registeredAt:Date.now() }]);
      } else if (existing.team !== u.team) {
        storage.set("students_list", list.map(s => s.id === u.id ? { ...s, team:u.team } : s));
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
  const students   = useMemo(() => {
    const all = getStudents();
    if (currentUser?.team) return all.filter(s => s.team === currentUser.team);
    return all;
  }, [currentUser, refresh]);

  // ─── レーダーチャートデータ ───────────────────────────────────────────
  const radarData = (selfSurvey, mentorSurvey) =>
    AXES.map(a => ({
      subject: a.ref ? `${a.short}※` : a.short,
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
    const savedTerm = term;
    storage.set(`survey:${currentUser.id}:${ts}`, { userID:currentUser.id, timestamp:ts, term, axes });
    setSurveyResult({ axes, term: savedTerm });
    setTerm(""); setAxisScores({}); tick();
  };

  // ─── 画像圧縮 ────────────────────────────────────────────────────────
  const compressImage = (file, maxPx=640, quality=0.65) => new Promise(resolve => {
    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxPx / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width  = Math.round(img.width  * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });

  const handlePhotoSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const compressed = await compressImage(file);
    setLogPhoto(compressed);
    e.target.value = "";
  };

  // ─── 学生：ログ保存 ───────────────────────────────────────────────────
  const saveLog = () => {
    if (!yatta.trim() && !wakatta.trim() && !tsugi.trim()) return;
    const ts = Date.now();
    storage.set(`log:${currentUser.id}:${ts}`, { userID:currentUser.id, timestamp:ts, yatta, wakatta, tsugi, emotion, photo: logPhoto || null });
    setYatta(""); setWakatta(""); setTsugi(""); setEmotion(3); setLogPhoto(null); tick();
  };

  // ─── ポートフォリオ：AIモック分析 ────────────────────────────────────
  const runMockAiAnalysis = () => {
    setPortfolioAiLoading(true);
    setPortfolioAiResult(null);
    const axes = latestSurvey?.axes || {};
    const logCount = myLogs.length;
    const photoCount = myLogs.filter(l => l.photo).length;
    const strong = AXES.filter(a => !a.ref && (axes[a.id]||0) >= 3);
    const grow   = AXES.filter(a => !a.ref && (axes[a.id]||0) > 0 && (axes[a.id]||0) <= 2);
    const strongText = strong.length ? strong.map(a=>`「${a.name}」Lv.${axes[a.id]}`).join("、") : "（データ不足）";
    const growText  = grow.length   ? grow.map(a=>`「${a.name}」Lv.${axes[a.id]}`).join("、") : "（データ不足）";
    setTimeout(() => {
      setPortfolioAiResult(
        `【第三者視点 AI 評価レポート（モック）】\n\n` +
        `📊 分析データ：ログ ${logCount} 件（うち写真付き ${photoCount} 件）\n\n` +
        `◆ 総合所見\n` +
        `蓄積されたログと9軸自己評価から、この学生は自分の活動を丁寧に言語化する習慣が形成されつつあります。` +
        `特に行動記録の継続性から、内発的な動機づけの萌芽が見受けられます。\n\n` +
        `💪 強みと判断される軸\n${strongText}\n\n` +
        `🌱 成長が期待される軸\n${growText}\n\n` +
        `📸 写真ログからの観察\n` +
        (photoCount > 0
          ? `${photoCount}件の写真ログが蓄積されています。成果物・活動の記録から実践的な関与が確認できます。`
          : `写真ログはまだありません。活動の様子や成果物を写真で記録すると、より精度の高い分析が可能になります。`) +
        `\n\n※ これはモック評価です。実際のAI分析にはAPIキーの設定が必要です。`
      );
      setPortfolioAiLoading(false);
    }, 1800);
  };

  // ─── 学生：振り返り提出 ───────────────────────────────────────────────
  const submitReflection = (answers, mode, comment="") => {
    const summary = REFLECTION_QUESTIONS.map(q => `${q.text} → ${typeof answers[q.id]==="number"?answers[q.id]+"/10":answers[q.id]}`).join("\n") + (comment?`\n\nコメント：${comment}`:"");
    const pending = getPending();
    savePending([...pending, { id:"pe"+Date.now(), studentId:currentUser.id, date:fmt(Date.now()), reflection:summary, answers, mode, status:"pending" }]);
    tick();
    setReflectionDone(true);
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
            <label style={{ fontSize:12, color:C.textSub, display:"block", marginBottom:6 }}>チームID</label>
            <input value={loginTeam} onChange={e=>setLoginTeam(e.target.value)} placeholder="例：PBLチーム1" style={S.input}/>
            <p style={{ fontSize:11, color:C.textMuted, margin:"5px 0 0" }}>学生・メンターで同じIDを入力してください</p>
          </div>
          <div style={{ marginBottom:14 }}>
            <label style={{ fontSize:12, color:C.textSub, display:"block", marginBottom:6 }}>氏名</label>
            <input value={loginName} onChange={e=>setLoginName(e.target.value)} placeholder="例：山田 太郎" style={S.input}/>
          </div>
          <div style={{ marginBottom:20 }}>
            <label style={{ fontSize:12, color:C.textSub, display:"block", marginBottom:6 }}>ユーザーID</label>
            <input value={loginId} onChange={e=>setLoginId(e.target.value)} placeholder="例：yamada_taro" onKeyDown={e=>e.key==="Enter"&&handleLogin()} style={S.input}/>
          </div>
          <button
            style={{ ...S.btnPrimary, width:"100%", padding:"11px", fontSize:14, borderRadius:10, opacity:(!loginTeam.trim()||!loginName.trim()||!loginId.trim())?0.5:1, cursor:(!loginTeam.trim()||!loginName.trim()||!loginId.trim())?"not-allowed":"pointer" }}
            onClick={handleLogin}
          >
            はじめる <ChevronRight size={16} style={{ verticalAlign:"middle" }}/>
          </button>
        </div>
        <p style={{ fontSize:11, color:C.textMuted, textAlign:"center", marginTop:14 }}>チームIDで学生とメンターが自動的に紐づきます</p>
      </div>
    </div>
  );

  // ─── 共通ヘッダー ─────────────────────────────────────────────────────
  const Header = () => (
    <div style={{ borderBottom:`1px solid ${C.border}`, padding:"0.875rem 1.5rem", display:"flex", alignItems:"center", justifyContent:"space-between", background:C.surface, position:"sticky", top:0, zIndex:20, backdropFilter:"blur(12px)" }}>
      <button style={{ background:"none", border:"none", cursor:"pointer", display:"flex", alignItems:"center", gap:10, padding:0 }} onClick={() => setScreen("home")}>
        <Star size={16} color={C.primary}/>
        <span style={{ fontSize:15, fontWeight:700, color:C.primary, letterSpacing:-0.3 }}>Be-Ready</span>
        {currentUser?.team && (
          <span style={{ fontSize:11, color:C.textSub, background:C.surface2, border:`1px solid ${C.border}`, borderRadius:6, padding:"2px 8px" }}>{currentUser.team}</span>
        )}
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
      <div style={{ maxWidth:860, margin:"0 auto", padding:`1.5rem 1.5rem calc(7rem + env(safe-area-inset-bottom))` }}>

        {/* ─── ホーム ─────────────────────────────────────────────── */}
        {screen==="home" && (
          <div>
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
                    <button onClick={()=>setScreen("portfolio")} style={{ ...S.btn, fontSize:11, padding:"4px 10px", display:"flex", alignItems:"center", gap:4 }}>
                      詳細 <ChevronRight size={12}/>
                    </button>
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
                  <p style={{ fontSize:10, color:C.textMuted, marginTop:2 }}>※ 情報（②）・動機（⑧）は基準未確定のため参考値</p>
                </div>

                {/* 成長ポイント & ネクストアクション */}
                {(() => {
                  const grow   = AXES.filter(a => !a.ref && (latestSurvey.axes?.[a.id]||0) > 0 && (latestSurvey.axes?.[a.id]||0) <= 2);
                  const strong = AXES.filter(a => !a.ref && (latestSurvey.axes?.[a.id]||0) >= 3);
                  if (grow.length === 0 && strong.length === 0) return null;
                  return (
                    <div style={{ ...S.card, marginBottom:"1.25rem", borderColor:`${C.primary}33` }}>
                      <p style={{ fontSize:14, fontWeight:700, color:C.text, marginBottom:"1rem", display:"flex", alignItems:"center", gap:6 }}>
                        <Sparkles size={14} color={C.primary}/> 成長ポイント & ネクストアクション
                      </p>

                      {grow.length > 0 && (
                        <div style={{ marginBottom: strong.length > 0 ? "1rem" : 0 }}>
                          <p style={{ fontSize:12, fontWeight:700, color:C.warn, marginBottom:8 }}>📈 重点成長軸</p>
                          {grow.map(a => {
                            const na = myNextActions[a.id];
                            return (
                              <div key={a.id} style={{ marginBottom:8, padding:"10px 12px", background:C.surface2, borderRadius:10, border:`1px solid ${C.warn}22` }}>
                                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom: na ? 6 : 0 }}>
                                  <span style={S.tag(C.warn)}>{a.name} Lv.{latestSurvey.axes[a.id]}</span>
                                  {!na && (
                                    <button onClick={()=>setScreen("portfolio")} style={{ ...S.btn, fontSize:11, padding:"3px 10px", marginLeft:"auto" }}>
                                      NextAction を設定 →
                                    </button>
                                  )}
                                </div>
                                {na && (
                                  <div style={{ display:"flex", alignItems:"flex-start", gap:6 }}>
                                    <ArrowRight size={13} color={C.success} style={{ flexShrink:0, marginTop:2 }}/>
                                    <span style={{ fontSize:12, color:C.text, lineHeight:1.5 }}>{na.text}</span>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {strong.length > 0 && (
                        <div>
                          <p style={{ fontSize:12, fontWeight:700, color:C.success, marginBottom:8 }}>⭐ 強み</p>
                          <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                            {strong.map(a => (
                              <span key={a.id} style={{ ...S.tag(C.success), fontSize:12 }}>{a.name} Lv.{latestSurvey.axes[a.id]}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </>
            ) : (
              <div style={{ ...S.cardGlow, textAlign:"center", padding:"2.5rem 1.5rem", marginBottom:"1.25rem" }}>
                <ClipboardList size={40} color={C.primary+"88"} style={{ marginBottom:12 }}/>
                <p style={{ fontSize:15, fontWeight:700, color:C.text, marginBottom:6 }}>まだアンケートがありません</p>
                <p style={{ fontSize:13, color:C.textSub, marginBottom:16 }}>アンケートを記入して、あなたのBe-Readyを可視化しましょう。</p>
                <button style={S.btnPrimary} onClick={()=>setScreen("survey")}>アンケートを記入する</button>
              </div>
            )}

            {/* 統計カード */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10, marginBottom:"1rem" }}>
              {[
                { l:"アンケート", v:mySurveys.length,  c:C.primary, icon:ClipboardList, s:"survey" },
                { l:"ログ",      v:myLogs.length,      c:C.accent1, icon:BookOpen,      s:"log"    },
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
            {unreadQ>0 && (
              <div style={{ ...S.scard, borderLeft:`3px solid ${C.accent1}`, marginBottom:"0.75rem", cursor:"pointer" }} onClick={()=>{setScreen("reflection");setReflectionTab("questions");}}>
                <p style={{ fontSize:13, color:C.accent1, fontWeight:600, margin:0 }}>💬 メンターから未回答の問いが {unreadQ}件 あります。</p>
              </div>
            )}

            {/* クイックアクション */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginTop:"0.5rem" }}>
              {[
                { l:"アンケートを記入", d:"今期の目標と9軸評価", icon:ClipboardList, s:"survey", c:C.primary },
                { l:"ログを追加",       d:"YWT振り返りを記録",  icon:BookOpen,      s:"log",    c:C.accent1 },
                { l:"振り返りを提出",   d:"メンターに振り返りを送る", icon:TrendingUp, s:"reflection", c:C.warn },
                { l:"ポートフォリオ",   d:"成長の可視化を確認",  icon:Briefcase,    s:"portfolio", c:C.success },
              ].map(item => (
                <button key={item.l} onClick={()=>setScreen(item.s)} style={{ ...S.card, cursor:"pointer", textAlign:"left", display:"flex", alignItems:"center", gap:10, border:`1px solid ${item.c}22`, minWidth:0, overflow:"hidden", marginBottom:0 }}>
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

              {/* 写真ログ */}
              <div style={{ marginBottom:14 }}>
                <label style={{ fontSize:12, fontWeight:700, color:C.textSub, display:"block", marginBottom:8 }}>写真ログ（任意）</label>
                <input ref={photoInputRef} type="file" accept="image/*" capture="environment" style={{ display:"none" }} onChange={handlePhotoSelect}/>
                {logPhoto ? (
                  <div style={{ position:"relative", display:"inline-block" }}>
                    <img src={logPhoto} alt="log" style={{ width:120, height:90, objectFit:"cover", borderRadius:10, border:`1px solid ${C.border}` }}/>
                    <button onClick={()=>setLogPhoto(null)} style={{ position:"absolute", top:-8, right:-8, background:C.surface, border:`1px solid ${C.border}`, borderRadius:"50%", width:22, height:22, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", padding:0 }}><X size={12} color={C.textSub}/></button>
                  </div>
                ) : (
                  <button onClick={()=>photoInputRef.current?.click()} style={{ ...S.btn, display:"flex", alignItems:"center", gap:6 }}><Camera size={14}/> 写真を追加</button>
                )}
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
                    {lg.photo && (
                      <img src={lg.photo} alt="log" style={{ marginTop:8, width:"100%", maxHeight:180, objectFit:"cover", borderRadius:8, border:`1px solid ${C.border}` }}/>
                    )}
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
                      <PolarGrid stroke="rgba(117,0,192,0.2)" strokeDasharray="3 3"/>
                      <PolarAngleAxis dataKey="subject" tick={{ fontSize:12, fill:"#460073", fontWeight:600 }}/>
                      <Radar name="自己評価" dataKey="自己" stroke="#CC44FF" fill="#CC44FF" fillOpacity={0.5}/>
                      {latestMentor && <Radar name="メンター評価" dataKey="他者" stroke="#0088aa" fill="#0088aa" fillOpacity={0.25}/>}
                      <Legend wrapperStyle={{ fontSize:12 }}/>
                      <Tooltip contentStyle={{ background:C.surface2, border:`1px solid ${C.borderLight}`, borderRadius:8, fontSize:12 }}/>
                    </RadarChart>
                  </ResponsiveContainer>
                  <p style={{ fontSize:10, color:C.textMuted, marginTop:4 }}>※ 情報（②）・動機（⑧）は基準未確定のため参考値</p>
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
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                    {AXES.map(a => {
                      const self  = latestSurvey?.axes?.[a.id] || 0;
                      const other = latestMentor?.axes?.[a.id] || 0;
                      return (
                        <div key={a.id} style={{ background:C.surface2, borderRadius:10, padding:"10px 12px", border:`1px solid ${C.border}`, opacity: a.ref ? 0.7 : 1 }}>
                          <div style={{ display:"flex", alignItems:"center", gap:4, marginBottom:6, flexWrap:"wrap" }}>
                            <p style={{ fontSize:11, color:C.textSub, margin:0 }}>{a.name}</p>
                            {a.ref && <span style={{ fontSize:9, color:C.textMuted, background:C.surface3, borderRadius:4, padding:"1px 4px", flexShrink:0 }}>参考値</span>}
                          </div>
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
                  const strong = AXES.filter(a => (latestSurvey.axes?.[a.id]||0) >= 3 && !a.ref);
                  const grow   = AXES.filter(a => (latestSurvey.axes?.[a.id]||0) <= 2 && (latestSurvey.axes?.[a.id]||0) > 0 && !a.ref);
                  const refAxes = AXES.filter(a => a.ref && (latestSurvey.axes?.[a.id]||0) > 0);
                  return (
                    <div>
                      {strong.length>0 && (
                        <div style={{ ...S.card, borderColor:C.success+"44", marginBottom:10 }}>
                          <p style={{ fontSize:13, fontWeight:700, color:C.success, marginBottom:10 }}>💪 強みのエリア（Lv3以上）</p>
                          <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                            {strong.map(a => <span key={a.id} style={{ ...S.tag(C.success), fontSize:13 }}>{a.name} Lv.{latestSurvey.axes[a.id]}</span>)}
                          </div>
                        </div>
                      )}
                      {grow.length>0 && (
                        <div style={{ ...S.card, borderColor:C.warn+"44", marginBottom:10 }}>
                          <p style={{ fontSize:13, fontWeight:700, color:C.warn, marginBottom:10 }}>🌱 成長のエリア</p>
                          <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                            {grow.map(a => <span key={a.id} style={{ ...S.tag(C.warn), fontSize:13 }}>{a.name} Lv.{latestSurvey.axes[a.id]}</span>)}
                          </div>
                        </div>
                      )}
                      {refAxes.length>0 && (
                        <div style={{ ...S.scard, borderLeft:`3px solid ${C.textMuted}`, opacity:0.7 }}>
                          <p style={{ fontSize:11, fontWeight:700, color:C.textMuted, marginBottom:6 }}>参考値（評価基準未確定）</p>
                          <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                            {refAxes.map(a => <span key={a.id} style={{ ...S.tag(C.textMuted), fontSize:11 }}>{a.name} Lv.{latestSurvey.axes[a.id]}</span>)}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* AI分析 */}
                <div style={{ ...S.card, borderColor:C.accent1+"44", marginTop:12 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
                    <Sparkles size={16} color={C.accent1}/>
                    <p style={{ fontSize:13, fontWeight:700, color:C.text, margin:0 }}>AI 第三者評価（モック）</p>
                    <span style={{ fontSize:10, background:C.accent1+"22", color:C.accent1, borderRadius:4, padding:"2px 6px" }}>DEMO</span>
                  </div>
                  <p style={{ fontSize:12, color:C.textSub, marginBottom:12 }}>
                    蓄積されたログ・写真・評価スコアをもとに第三者視点での評価を生成します。
                  </p>
                  {portfolioAiResult ? (
                    <div>
                      <div style={{ background:C.surface2, border:`1px solid ${C.border}`, borderRadius:10, padding:"1rem", fontSize:13, color:C.text, lineHeight:1.75, whiteSpace:"pre-wrap", marginBottom:12 }}>
                        {portfolioAiResult}
                      </div>
                      <button style={{ ...S.btn, display:"flex", alignItems:"center", gap:6 }} onClick={()=>setPortfolioAiResult(null)}>
                        <Sparkles size={13}/> 再分析する
                      </button>
                    </div>
                  ) : (
                    <button
                      style={{ ...S.btnPrimary, display:"flex", alignItems:"center", gap:8, background:`linear-gradient(135deg,${C.primary},${C.accent1})` }}
                      onClick={runMockAiAnalysis}
                      disabled={portfolioAiLoading}
                    >
                      <Sparkles size={14}/>
                      {portfolioAiLoading ? "分析中..." : "AI で分析する"}
                    </button>
                  )}
                </div>
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
                { v:"feedback",   l:`フィードバック${myFeedbacks.length>0?` (${myFeedbacks.length})`:""}` },
              ].map(t => (
                <button key={t.v} onClick={()=>setReflectionTab(t.v)} style={{ flex:1, padding:"8px 6px", borderRadius:7, border:"none", background:reflectionTab===t.v?C.primary:"transparent", color:reflectionTab===t.v?"#fff":C.textSub, fontSize:12, cursor:"pointer", fontWeight:reflectionTab===t.v?700:400, transition:"all 0.2s" }}>{t.l}</button>
              ))}
            </div>

            {/* ── 振り返り入力 */}
            {reflectionTab==="reflection" && (
              <div>
                {reflectionDone ? (
                  <div style={{ ...S.cardGlow, textAlign:"center", padding:"2.5rem 1.5rem", borderColor:`${C.success}55` }}>
                    <div style={{ fontSize:44, marginBottom:12 }}>🎉</div>
                    <p style={{ fontSize:16, fontWeight:700, color:C.success, marginBottom:6 }}>振り返りを提出しました！</p>
                    <p style={{ fontSize:13, color:C.textSub, marginBottom:20 }}>メンターが確認・採点します。<br/>結果はフィードバックタブで確認できます。</p>
                    <div style={{ display:"flex", gap:10, justifyContent:"center", flexWrap:"wrap" }}>
                      <button style={S.btnPrimary} onClick={()=>setScreen("home")}>ホームへ戻る</button>
                      <button style={S.btn} onClick={()=>setReflectionDone(false)}>続けて提出する</button>
                    </div>
                  </div>
                ) : (
                  <>
                    {myPending.length>0 && (
                      <div style={{ ...S.scard, borderLeft:`3px solid ${C.warn}`, marginBottom:"1rem", background:`${C.warn}08` }}>
                        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                          <span style={{ fontSize:18 }}>⏳</span>
                          <div>
                            <p style={{ fontSize:13, color:C.warn, fontWeight:700, margin:0 }}>{myPending.length}件の振り返りが採点待ちです</p>
                            <p style={{ fontSize:11, color:C.textSub, margin:"2px 0 0" }}>メンターが採点後、フィードバックタブに反映されます</p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:"1.25rem", overflowX:"auto", paddingBottom:2 }}>
                      {["入力形式を選ぶ","質問に回答する","提出する"].map((s, i) => (
                        <div key={i} style={{ display:"flex", alignItems:"center", gap:6, flexShrink:0 }}>
                          <div style={{ width:20, height:20, borderRadius:"50%", background:C.primary, color:"#fff", fontSize:11, fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center" }}>{i+1}</div>
                          <span style={{ fontSize:11, color:C.textSub, whiteSpace:"nowrap" }}>{s}</span>
                          {i < 2 && <ChevronRight size={12} color={C.textMuted}/>}
                        </div>
                      ))}
                    </div>

                    <div style={{ display:"flex", gap:6, marginBottom:"1.25rem", background:C.surface2, borderRadius:10, padding:4, width:"fit-content" }}>
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
                  </>
                )}
              </div>
            )}

            {/* ── 問いへの回答 */}
            {reflectionTab==="questions" && (
              <div>
                {myQuestions.length===0 ? (
                  <div style={{ ...S.card, textAlign:"center", padding:"2.5rem 1.5rem" }}>
                    <MessageSquare size={36} color={C.primary+"44"} style={{ marginBottom:12 }}/>
                    <p style={{ color:C.textSub, fontSize:13 }}>まだメンターから問いはありません。</p>
                  </div>
                ) : (() => {
                  const unanswered = myQuestions.filter(q => !q.answer);
                  const answered   = myQuestions.filter(q =>  q.answer);
                  return (
                    <>
                      {unanswered.length > 0 && (
                        <div style={{ marginBottom:"1.25rem" }}>
                          <p style={{ fontSize:12, fontWeight:700, color:C.warn, marginBottom:10 }}>未回答 ({unanswered.length}件)</p>
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
                          <p style={{ fontSize:12, fontWeight:700, color:C.success, marginBottom:10 }}>回答済み ({answered.length}件)</p>
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

            {/* ── フィードバック */}
            {reflectionTab==="feedback" && (
              <div>
                {myFeedbacks.length===0 ? (
                  <div style={{ ...S.card, textAlign:"center", padding:"2.5rem 1.5rem" }}>
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
            )}
          </div>
        )}
      </div>

      {/* ─── アンケート保存後フィードバックモーダル ─────────────────── */}
      {surveyResult && (
        <SurveyResultModal
          result={surveyResult}
          onClose={() => setSurveyResult(null)}
          onPortfolio={() => { setSurveyResult(null); setScreen("portfolio"); }}
        />
      )}

      {/* ─── ボトムナビゲーション ──────────────────────────────────── */}
      <div style={{ position:"fixed", bottom:0, left:0, right:0, background:C.surface, borderTop:`1px solid ${C.border}`, display:"flex", zIndex:30, overflowX:"hidden", paddingBottom:"env(safe-area-inset-bottom)" }}>
        {[
          { v:"home",      l:"ホーム",   icon:Home },
          { v:"survey",    l:"評価",     icon:ClipboardList },
          { v:"log",       l:"ログ",     icon:BookOpen },
          { v:"portfolio", l:"成果物",   icon:Briefcase },
          { v:"reflection",l:"振り返り", icon:TrendingUp },
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
