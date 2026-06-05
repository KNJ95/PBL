import React, { useState, useEffect, useMemo } from 'react';
import {
  Home, ClipboardList, BookOpen, Briefcase,
  LogOut, ChevronRight, Plus, Trash2,
  CheckCircle, Circle, Save, X, Star,
  Users, ArrowLeft
} from 'lucide-react';

// ─── 定数 ────────────────────────────────────────────────────────────────────

const AXES = [
  { key: 'axis1', num: '①', name: '課題設定力',      category: 'A', desc: '解くべき問いを自分で立てられるか' },
  { key: 'axis2', num: '②', name: '情報活用力',      category: 'A', desc: '情報を収集・整理・活用できるか' },
  { key: 'axis3', num: '③', name: '不確実性への耐性', category: 'A', desc: '答えのない状況で動けるか' },
  { key: 'axis4', num: '④', name: '提案・発信力',    category: 'B', desc: '自分の意見を伝えられるか' },
  { key: 'axis5', num: '⑤', name: '実行・改善力',    category: 'B', desc: 'やり切って改善できるか' },
  { key: 'axis6', num: '⑥', name: 'オーナーシップ',  category: 'B', desc: '自分事として責任を持てるか' },
  { key: 'axis7', num: '⑦', name: '協働・調整力',    category: 'C', desc: '他者と建設的に動けるか' },
  { key: 'axis8', num: '⑧', name: '自律・内発的動機', category: 'C', desc: 'なぜやるかを自分で語れるか' },
  { key: 'axis9', num: '⑨', name: '行動変容力',      category: 'C', desc: 'FBを行動の変化につなげられるか' },
];

const LEVELS = [
  { lv: 1, name: '受動性', color: '#94a3b8', desc: '外発的動機・指示待ち' },
  { lv: 2, name: '能動性', color: '#A100FF', desc: '自ら動くが一時的' },
  { lv: 3, name: '自律性', color: '#7500C0', desc: '自分事化・継続' },
  { lv: 4, name: '創造性', color: '#460073', desc: '本質理解・新しさを生む' },
];

const LEVEL_COLORS = { 1: '#94a3b8', 2: '#c084fc', 3: '#a855f7', 4: '#7c3aed' };
const LEVEL_BG    = { 1: 'rgba(148,163,184,0.12)', 2: 'rgba(192,132,252,0.12)', 3: 'rgba(168,85,247,0.12)', 4: 'rgba(124,58,237,0.12)' };

const EMOTIONS = ['😢', '😕', '😐', '🙂', '😄'];

const CATEGORY_COLORS = {
  A: { bg: 'rgba(161,0,255,0.06)', border: 'rgba(161,0,255,0.2)', badge: '#9b30e8', label: '思考・判断系' },
  B: { bg: 'rgba(117,0,192,0.06)', border: 'rgba(117,0,192,0.2)', badge: '#7500C0', label: '行動・実行系' },
  C: { bg: 'rgba(70,0,115,0.08)',  border: 'rgba(70,0,115,0.25)', badge: '#460073', label: '関係・姿勢系' },
};

// ─── ストレージヘルパー ───────────────────────────────────────────────────────

const storage = {
  get: (key) => {
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : null; }
    catch { return null; }
  },
  set: (key, value) => {
    try { localStorage.setItem(key, JSON.stringify(value)); return true; }
    catch { return false; }
  },
  keys: (prefix) => {
    try {
      return Object.keys(localStorage).filter(k => k.startsWith(prefix));
    } catch { return []; }
  },
  delete: (key) => {
    try { localStorage.removeItem(key); return true; }
    catch { return false; }
  },
};

// ─── スタイル定数 ─────────────────────────────────────────────────────────────

const S = {
  page: {
    minHeight: '100vh',
    background: 'var(--bg)',
    paddingBottom: 'calc(80px + env(safe-area-inset-bottom))',
  },
  header: {
    background: '#ffffff',
    borderBottom: '1px solid rgba(117,0,192,0.15)',
    padding: '16px 20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'sticky',
    top: 0,
    zIndex: 100,
    boxShadow: '0 1px 8px rgba(117,0,192,0.06)',
  },
  card: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 16,
    padding: '20px',
    marginBottom: 12,
  },
  btn: {
    background: 'linear-gradient(135deg, #7500C0, #460073)',
    color: '#fff',
    border: 'none',
    borderRadius: 12,
    padding: '12px 24px',
    fontSize: 15,
    fontWeight: 700,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    transition: 'opacity 0.2s',
  },
  btnGhost: {
    background: 'transparent',
    color: 'var(--text-muted)',
    border: '1px solid var(--border)',
    borderRadius: 12,
    padding: '10px 20px',
    fontSize: 14,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    transition: 'border-color 0.2s',
  },
  input: {
    background: '#f5f3ff',
    border: '1px solid rgba(117,0,192,0.25)',
    borderRadius: 10,
    padding: '12px 14px',
    color: 'var(--text)',
    fontSize: 14,
    width: '100%',
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  label: {
    fontSize: 12,
    fontWeight: 700,
    color: 'var(--text-muted)',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    marginBottom: 6,
    display: 'block',
  },
  bottomNav: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    background: 'rgba(255,255,255,0.97)',
    backdropFilter: 'blur(20px)',
    borderTop: '1px solid rgba(117,0,192,0.15)',
    display: 'flex',
    zIndex: 200,
    paddingBottom: 'env(safe-area-inset-bottom)',
  },
};

// ─── ユーティリティ ───────────────────────────────────────────────────────────

function formatDate(ts) {
  const d = new Date(ts);
  return `${d.getFullYear()}/${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getDate()).padStart(2,'0')}`;
}

function avg(arr) {
  if (!arr.length) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

// ─── ログイン画面 ─────────────────────────────────────────────────────────────

function LoginView({ onLogin }) {
  const [name, setName] = useState('');
  const [id, setId] = useState('');
  const [role, setRole] = useState('student');

  const handleSubmit = () => {
    if (!name.trim() || !id.trim()) return;
    onLogin({ name: name.trim(), id: id.trim(), role });
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 'max(32px, env(safe-area-inset-top)) 24px max(32px, env(safe-area-inset-bottom))',
      background: 'radial-gradient(ellipse at 50% 0%, rgba(117,0,192,0.1) 0%, var(--bg) 70%)',
    }}>
      {/* ロゴ */}
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 72,
          height: 72,
          borderRadius: 20,
          background: 'linear-gradient(135deg, #7500C0, #460073)',
          marginBottom: 16,
          boxShadow: '0 8px 32px rgba(117,0,192,0.3)',
        }}>
          <Star size={32} color="#fff" />
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em' }}>
          Be-Ready 評価
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 6 }}>
          人材育成プログラム POC
        </p>
      </div>

      {/* フォーム */}
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ marginBottom: 20 }}>
          <label style={S.label}>氏名</label>
          <input
            style={S.input}
            placeholder="例：山田 太郎"
            value={name}
            onChange={e => setName(e.target.value)}
          />
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={S.label}>ユーザーID</label>
          <input
            style={S.input}
            placeholder="例：yamada_taro"
            value={id}
            onChange={e => setId(e.target.value)}
          />
        </div>
        <div style={{ marginBottom: 32 }}>
          <label style={S.label}>区分</label>
          <div style={{ display: 'flex', gap: 10 }}>
            {['student', 'mentor'].map(r => (
              <button
                key={r}
                onClick={() => setRole(r)}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: 12,
                  border: `2px solid ${role === r ? '#7500C0' : 'rgba(117,0,192,0.2)'}`,
                  background: role === r ? 'rgba(117,0,192,0.1)' : '#ffffff',
                  color: role === r ? '#7500C0' : 'var(--text-muted)',
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                {r === 'student' ? '学生' : 'メンター'}
              </button>
            ))}
          </div>
        </div>
        <button
          style={{ ...S.btn, width: '100%', justifyContent: 'center', fontSize: 16, padding: '14px' }}
          onClick={handleSubmit}
          disabled={!name.trim() || !id.trim()}
        >
          はじめる
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}

// ─── ホーム（ダッシュボード）─────────────────────────────────────────────────

function HomeView({ user, setScreen }) {
  const surveys   = storage.keys(`survey:${user.id}:`).map(k => storage.get(k)).filter(Boolean);
  const logs      = storage.keys(`log:${user.id}:`).map(k => storage.get(k)).filter(Boolean);
  const portfolio = storage.keys(`portfolio:${user.id}:`).map(k => storage.get(k)).filter(Boolean);

  const avgLevel = useMemo(() => {
    if (!surveys.length) return null;
    const last = surveys.sort((a, b) => b.timestamp - a.timestamp)[0];
    const vals = AXES.map(a => last.axes?.[a.key]?.level).filter(Boolean);
    return vals.length ? avg(vals).toFixed(1) : null;
  }, [surveys]);

  const stats = [
    { label: 'アンケート', value: surveys.length,   icon: ClipboardList, screen: 'survey' },
    { label: 'ログ',      value: logs.length,       icon: BookOpen,      screen: 'log' },
    { label: '成果物',    value: portfolio.length,  icon: Briefcase,     screen: 'portfolio' },
  ];

  const elements = [
    {
      icon: ClipboardList, title: 'アンケート',
      desc: '9評価軸 × 4レベルで自己判定。今期の目標と達成度を記録する。',
      screen: 'survey', color: '#7500C0',
    },
    {
      icon: BookOpen, title: 'ログ（YWT）',
      desc: 'やったこと・わかったこと・次にやることを振り返る。',
      screen: 'log', color: '#460073',
    },
    {
      icon: Briefcase, title: 'ポートフォリオ',
      desc: '成果物・レポート・提案資料を蓄積して学習の軌跡を残す。',
      screen: 'portfolio', color: '#2d0057',
    },
  ];

  return (
    <div style={S.page}>
      <div style={S.header}>
        <div>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            {user.role === 'mentor' ? 'MENTOR' : 'STUDENT'}
          </p>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>{user.name}</h2>
        </div>
        <div style={{
          background: 'rgba(117,0,192,0.08)',
          border: '1px solid rgba(117,0,192,0.2)',
          borderRadius: 12,
          padding: '8px 16px',
          textAlign: 'center',
        }}>
          <p style={{ fontSize: 10, color: '#7500C0', fontWeight: 700 }}>平均Lv</p>
          <p style={{ fontSize: 22, fontWeight: 700, color: '#460073', lineHeight: 1.1 }}>
            {avgLevel ?? '—'}
          </p>
        </div>
      </div>

      <div style={{ padding: '24px 20px 0' }}>
        {/* 統計 */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 28 }}>
          {stats.map(s => (
            <button
              key={s.label}
              onClick={() => setScreen(s.screen)}
              style={{
                flex: 1,
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 14,
                padding: '16px 10px',
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'border-color 0.2s',
                boxShadow: '0 1px 4px rgba(117,0,192,0.06)',
              }}
            >
              <s.icon size={18} color="#7500C0" style={{ marginBottom: 6 }} />
              <p style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', lineHeight: 1 }}>{s.value}</p>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{s.label}</p>
            </button>
          ))}
        </div>

        {/* 評価の3要素 */}
        <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 14 }}>
          評価の3要素
        </h3>
        {elements.map(el => (
          <button
            key={el.screen}
            onClick={() => setScreen(el.screen)}
            style={{
              ...S.card,
              width: '100%',
              textAlign: 'left',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              transition: 'border-color 0.2s, box-shadow 0.2s',
              borderColor: `${el.color}30`,
              boxShadow: '0 1px 4px rgba(117,0,192,0.06)',
            }}
          >
            <div style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: `${el.color}12`,
              border: `1px solid ${el.color}30`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              <el.icon size={20} color={el.color} />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 3 }}>{el.title}</p>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>{el.desc}</p>
            </div>
            <ChevronRight size={16} color="var(--text-muted)" />
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── アンケート入力 ───────────────────────────────────────────────────────────

function SurveyView({ user }) {
  const blankAxes = Object.fromEntries(AXES.map(a => [a.key, { level: 0, comment: '' }]));
  const [term, setTerm]   = useState('');
  const [axes, setAxes]   = useState(blankAxes);
  const [saved, setSaved] = useState(false);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const keys = storage.keys(`survey:${user.id}:`).sort().reverse();
    setHistory(keys.map(k => storage.get(k)).filter(Boolean));
  }, [user.id, saved]);

  const completed = AXES.filter(a => axes[a.key]?.level > 0).length;
  const avgLv = completed > 0
    ? avg(AXES.filter(a => axes[a.key]?.level > 0).map(a => axes[a.key].level)).toFixed(1)
    : '—';

  const handleSave = () => {
    if (!term.trim() || completed === 0) return;
    const ts = Date.now();
    storage.set(`survey:${user.id}:${ts}`, { userID: user.id, timestamp: ts, term, axes });
    setTerm('');
    setAxes(blankAxes);
    setSaved(s => !s);
  };

  const setLevel = (axisKey, lv) => setAxes(prev => ({ ...prev, [axisKey]: { ...prev[axisKey], level: lv } }));
  const setComment = (axisKey, comment) => setAxes(prev => ({ ...prev, [axisKey]: { ...prev[axisKey], comment } }));

  const categories = ['A', 'B', 'C'];

  return (
    <div style={S.page}>
      <div style={S.header}>
        <div>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.1em' }}>SURVEY</p>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>アンケート入力</h2>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 13, color: '#7500C0', fontWeight: 700 }}>{completed}/9</span>
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>平均 {avgLv}</span>
        </div>
      </div>

      <div style={{ padding: '20px 20px 0' }}>
        {/* 今期の目標 */}
        <div style={{ ...S.card, borderColor: 'rgba(117,0,192,0.25)', marginBottom: 20 }}>
          <label style={S.label}>今期の目標</label>
          <textarea
            style={{ ...S.input, minHeight: 80, resize: 'vertical', lineHeight: 1.6 }}
            placeholder="自分で立てた今期の目標を記述してください"
            value={term}
            onChange={e => setTerm(e.target.value)}
          />
        </div>

        {/* 評価軸 カテゴリ別 */}
        {categories.map(cat => {
          const catAxes = AXES.filter(a => a.category === cat);
          const c = CATEGORY_COLORS[cat];
          return (
            <div key={cat} style={{ marginBottom: 20 }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 10,
              }}>
                <span style={{
                  background: c.badge,
                  color: '#fff',
                  fontSize: 11,
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: 6,
                  letterSpacing: '0.05em',
                }}>{cat}</span>
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{c.label}</span>
              </div>
              {catAxes.map(axis => {
                const current = axes[axis.key];
                return (
                  <div key={axis.key} style={{
                    ...S.card,
                    background: current.level > 0 ? LEVEL_BG[current.level] : 'var(--bg-card)',
                    borderColor: current.level > 0 ? `${LEVEL_COLORS[current.level]}50` : 'var(--border)',
                    marginBottom: 10,
                    transition: 'all 0.2s',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                      <div>
                        <span style={{ fontSize: 13, color: '#7500C0', fontWeight: 700, marginRight: 6 }}>{axis.num}</span>
                        <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>{axis.name}</span>
                        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{axis.desc}</p>
                      </div>
                      {current.level > 0 && (
                        <span style={{
                          background: LEVEL_COLORS[current.level],
                          color: '#fff',
                          fontSize: 11,
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: 6,
                          whiteSpace: 'nowrap',
                          marginLeft: 8,
                        }}>
                          Lv.{current.level}
                        </span>
                      )}
                    </div>

                    {/* レベルボタン */}
                    <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                      {LEVELS.map(lv => (
                        <button
                          key={lv.lv}
                          onClick={() => setLevel(axis.key, lv.lv)}
                          style={{
                            flex: 1,
                            padding: '8px 4px',
                            borderRadius: 8,
                            border: `2px solid ${current.level === lv.lv ? LEVEL_COLORS[lv.lv] : 'rgba(117,0,192,0.15)'}`,
                            background: current.level === lv.lv ? `${LEVEL_COLORS[lv.lv]}25` : '#ffffff',
                            color: current.level === lv.lv ? LEVEL_COLORS[lv.lv] : 'var(--text-muted)',
                            fontSize: 11,
                            fontWeight: 700,
                            cursor: 'pointer',
                            textAlign: 'center',
                            transition: 'all 0.15s',
                          }}
                        >
                          <div style={{ fontSize: 10, marginBottom: 1, opacity: 0.7 }}>Lv.{lv.lv}</div>
                          {lv.name}
                        </button>
                      ))}
                    </div>

                    {/* コメント */}
                    <input
                      style={{ ...S.input, fontSize: 13, padding: '9px 12px' }}
                      placeholder="補足コメント（任意）"
                      value={current.comment}
                      onChange={e => setComment(axis.key, e.target.value)}
                    />
                  </div>
                );
              })}
            </div>
          );
        })}

        {/* 保存ボタン */}
        <button
          style={{
            ...S.btn,
            width: '100%',
            justifyContent: 'center',
            fontSize: 16,
            padding: '14px',
            marginBottom: 24,
            opacity: (!term.trim() || completed === 0) ? 0.4 : 1,
          }}
          onClick={handleSave}
          disabled={!term.trim() || completed === 0}
        >
          <Save size={18} />
          保存する
        </button>

        {/* 履歴 */}
        {history.length > 0 && (
          <div>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>
              過去の回答
            </h3>
            {history.map(s => {
              const vals = AXES.map(a => s.axes?.[a.key]?.level).filter(Boolean);
              const a = vals.length ? avg(vals).toFixed(1) : '—';
              return (
                <div key={s.timestamp} style={{ ...S.card, padding: '14px 16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{formatDate(s.timestamp)}</span>
                    <span style={{
                      background: 'rgba(117,0,192,0.1)',
                      color: '#7500C0',
                      fontSize: 12,
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: 6,
                    }}>平均 Lv.{a}</span>
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.5 }}>{s.term}</p>
                  {/* ミニレベルバー */}
                  <div style={{ display: 'flex', gap: 3, marginTop: 10 }}>
                    {AXES.map(ax => {
                      const lv = s.axes?.[ax.key]?.level || 0;
                      return (
                        <div key={ax.key} style={{ flex: 1, textAlign: 'center' }}>
                          <div style={{ fontSize: 9, color: 'var(--text-muted)', marginBottom: 2 }}>{ax.num}</div>
                          <div style={{
                            height: 20,
                            borderRadius: 4,
                            background: lv > 0 ? LEVEL_COLORS[lv] : 'rgba(117,0,192,0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}>
                            {lv > 0 && <span style={{ fontSize: 9, color: '#fff', fontWeight: 700 }}>{lv}</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── ログ（YWT）入力 ──────────────────────────────────────────────────────────

function LogView({ user }) {
  const [yatta, setYatta]   = useState('');
  const [wakatta, setWakatta] = useState('');
  const [tsugi, setTsugi]   = useState('');
  const [emotion, setEmotion] = useState(3);
  const [logs, setLogs]     = useState([]);
  const [saved, setSaved]   = useState(false);

  useEffect(() => {
    const keys = storage.keys(`log:${user.id}:`).sort().reverse();
    setLogs(keys.map(k => storage.get(k)).filter(Boolean));
  }, [user.id, saved]);

  const handleSave = () => {
    if (!yatta.trim() && !wakatta.trim() && !tsugi.trim()) return;
    const ts = Date.now();
    storage.set(`log:${user.id}:${ts}`, { userID: user.id, timestamp: ts, yatta, wakatta, tsugi, emotion });
    setYatta(''); setWakatta(''); setTsugi(''); setEmotion(3);
    setSaved(s => !s);
  };

  const handleDelete = (ts) => {
    storage.delete(`log:${user.id}:${ts}`);
    setSaved(s => !s);
  };

  const fields = [
    { key: 'yatta',   label: 'Y やったこと',    val: yatta,   set: setYatta,   placeholder: '今日・今期に取り組んだこと' },
    { key: 'wakatta', label: 'W わかったこと',   val: wakatta, set: setWakatta, placeholder: '気づき・学んだこと' },
    { key: 'tsugi',   label: 'T 次にやること',   val: tsugi,   set: setTsugi,   placeholder: '次のアクション' },
  ];

  return (
    <div style={S.page}>
      <div style={S.header}>
        <div>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.1em' }}>LOG</p>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>ログ（YWT）</h2>
        </div>
        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{logs.length} 件</span>
      </div>

      <div style={{ padding: '20px 20px 0' }}>
        <div style={{ ...S.card, borderColor: 'rgba(117,0,192,0.25)' }}>
          {fields.map(f => (
            <div key={f.key} style={{ marginBottom: 16 }}>
              <label style={{ ...S.label, color: '#7500C0' }}>{f.label}</label>
              <textarea
                style={{ ...S.input, minHeight: 72, resize: 'vertical', lineHeight: 1.6 }}
                placeholder={f.placeholder}
                value={f.val}
                onChange={e => f.set(e.target.value)}
              />
            </div>
          ))}

          {/* 感情記録 */}
          <div style={{ marginBottom: 16 }}>
            <label style={S.label}>感情記録</label>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              {EMOTIONS.map((em, i) => (
                <button
                  key={i}
                  onClick={() => setEmotion(i + 1)}
                  style={{
                    fontSize: 28,
                    background: emotion === i + 1 ? 'rgba(117,0,192,0.1)' : 'transparent',
                    border: `2px solid ${emotion === i + 1 ? '#7500C0' : 'transparent'}`,
                    borderRadius: 12,
                    width: 52,
                    height: 52,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.15s',
                  }}
                >
                  {em}
                </button>
              ))}
            </div>
          </div>

          <button
            style={{
              ...S.btn,
              width: '100%',
              justifyContent: 'center',
              opacity: (!yatta.trim() && !wakatta.trim() && !tsugi.trim()) ? 0.4 : 1,
            }}
            onClick={handleSave}
          >
            <Save size={16} /> 保存する
          </button>
        </div>

        {/* ログ一覧 */}
        {logs.length > 0 && (
          <div style={{ marginTop: 8 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>
              過去のログ
            </h3>
            {logs.map(log => (
              <div key={log.timestamp} style={{ ...S.card, padding: '14px 16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 20 }}>{EMOTIONS[log.emotion - 1]}</span>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{formatDate(log.timestamp)}</span>
                  </div>
                  <button
                    onClick={() => handleDelete(log.timestamp)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                {[
                  { label: 'Y やったこと', val: log.yatta },
                  { label: 'W わかったこと', val: log.wakatta },
                  { label: 'T 次にやること', val: log.tsugi },
                ].filter(f => f.val).map(f => (
                  <div key={f.label} style={{ marginBottom: 8 }}>
                    <span style={{ fontSize: 11, color: '#7500C0', fontWeight: 700 }}>{f.label}</span>
                    <p style={{ fontSize: 13, color: 'var(--text)', marginTop: 3, lineHeight: 1.6 }}>{f.val}</p>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── ポートフォリオ ───────────────────────────────────────────────────────────

const PORTFOLIO_TYPES = ['レポート', '提案資料', 'コード', 'プレゼン', 'その他'];

function PortfolioView({ user }) {
  const [items, setItems]   = useState([]);
  const [saved, setSaved]   = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle]   = useState('');
  const [type, setType]     = useState(PORTFOLIO_TYPES[0]);
  const [url, setUrl]       = useState('');
  const [relatedAxes, setRelatedAxes] = useState([]);
  const [reflection, setReflection] = useState('');

  useEffect(() => {
    const keys = storage.keys(`portfolio:${user.id}:`).sort().reverse();
    setItems(keys.map(k => storage.get(k)).filter(Boolean));
  }, [user.id, saved]);

  const handleSave = () => {
    if (!title.trim()) return;
    const ts = Date.now();
    storage.set(`portfolio:${user.id}:${ts}`, { userID: user.id, timestamp: ts, title, type, url, relatedAxes, reflection });
    setTitle(''); setType(PORTFOLIO_TYPES[0]); setUrl(''); setRelatedAxes([]); setReflection('');
    setShowForm(false);
    setSaved(s => !s);
  };

  const toggleAxis = (key) => {
    setRelatedAxes(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  };

  const handleDelete = (ts) => {
    storage.delete(`portfolio:${user.id}:${ts}`);
    setSaved(s => !s);
  };

  return (
    <div style={S.page}>
      <div style={S.header}>
        <div>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.1em' }}>PORTFOLIO</p>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>ポートフォリオ</h2>
        </div>
        <button
          onClick={() => setShowForm(s => !s)}
          style={{
            ...S.btn,
            padding: '8px 16px',
            fontSize: 13,
            background: showForm
              ? 'rgba(117,0,192,0.1)'
              : 'linear-gradient(135deg, #7500C0, #460073)',
            color: showForm ? '#7500C0' : '#fff',
            border: showForm ? '1px solid rgba(117,0,192,0.3)' : 'none',
          }}
        >
          {showForm ? <><X size={14} /> 閉じる</> : <><Plus size={14} /> 追加</>}
        </button>
      </div>

      <div style={{ padding: '20px 20px 0' }}>
        {/* 入力フォーム */}
        {showForm && (
          <div style={{ ...S.card, borderColor: 'rgba(117,0,192,0.25)', marginBottom: 20 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, color: '#7500C0' }}>成果物を追加</h3>

            <div style={{ marginBottom: 14 }}>
              <label style={S.label}>タイトル *</label>
              <input style={S.input} placeholder="例：〇〇社 課題提案資料" value={title} onChange={e => setTitle(e.target.value)} />
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={S.label}>種類</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {PORTFOLIO_TYPES.map(t => (
                  <button key={t} onClick={() => setType(t)} style={{
                    padding: '6px 14px',
                    borderRadius: 8,
                    border: `1.5px solid ${type === t ? '#7500C0' : 'rgba(117,0,192,0.2)'}`,
                    background: type === t ? 'rgba(117,0,192,0.1)' : '#ffffff',
                    color: type === t ? '#7500C0' : 'var(--text-muted)',
                    fontSize: 13,
                    fontWeight: type === t ? 700 : 400,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}>{t}</button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={S.label}>リンク（任意）</label>
              <input style={S.input} placeholder="https://..." value={url} onChange={e => setUrl(e.target.value)} />
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={S.label}>関連する評価軸</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {AXES.map(ax => (
                  <button key={ax.key} onClick={() => toggleAxis(ax.key)} style={{
                    padding: '5px 10px',
                    borderRadius: 8,
                    border: `1.5px solid ${relatedAxes.includes(ax.key) ? '#7500C0' : 'rgba(117,0,192,0.2)'}`,
                    background: relatedAxes.includes(ax.key) ? 'rgba(117,0,192,0.1)' : '#ffffff',
                    color: relatedAxes.includes(ax.key) ? '#7500C0' : 'var(--text-muted)',
                    fontSize: 12,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}>
                    {relatedAxes.includes(ax.key)
                      ? <CheckCircle size={11} />
                      : <Circle size={11} />
                    }
                    {ax.num}{ax.name}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 18 }}>
              <label style={S.label}>振り返りメモ</label>
              <textarea
                style={{ ...S.input, minHeight: 80, resize: 'vertical', lineHeight: 1.6 }}
                placeholder="この成果物から何を学びましたか？"
                value={reflection}
                onChange={e => setReflection(e.target.value)}
              />
            </div>

            <button
              style={{
                ...S.btn,
                width: '100%',
                justifyContent: 'center',
                opacity: !title.trim() ? 0.4 : 1,
              }}
              onClick={handleSave}
              disabled={!title.trim()}
            >
              <Save size={16} /> 保存する
            </button>
          </div>
        )}

        {/* 一覧 */}
        {items.length === 0 && !showForm && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
            <Briefcase size={40} color="rgba(117,0,192,0.3)" style={{ marginBottom: 12 }} />
            <p style={{ fontSize: 14 }}>成果物がまだありません</p>
            <p style={{ fontSize: 12, marginTop: 6 }}>「追加」から成果物を登録してください</p>
          </div>
        )}
        {items.map(item => (
          <div key={item.timestamp} style={{ ...S.card }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{
                    background: 'rgba(117,0,192,0.1)',
                    color: '#7500C0',
                    fontSize: 11,
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: 6,
                  }}>{item.type}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{formatDate(item.timestamp)}</span>
                </div>
                <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>{item.title}</p>
              </div>
              <button
                onClick={() => handleDelete(item.timestamp)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4, marginLeft: 8 }}
              >
                <Trash2 size={14} />
              </button>
            </div>
            {item.url && (
              <a href={item.url} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: '#7500C0', wordBreak: 'break-all', display: 'block', marginBottom: 8 }}>
                {item.url}
              </a>
            )}
            {item.relatedAxes?.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
                {item.relatedAxes.map(key => {
                  const ax = AXES.find(a => a.key === key);
                  return ax ? (
                    <span key={key} style={{
                      background: 'rgba(117,0,192,0.1)',
                      color: '#7500C0',
                      fontSize: 11,
                      padding: '2px 8px',
                      borderRadius: 6,
                    }}>{ax.num}{ax.name}</span>
                  ) : null;
                })}
              </div>
            )}
            {item.reflection && (
              <p style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.6, marginTop: 6, paddingTop: 10, borderTop: '1px solid rgba(117,0,192,0.12)' }}>
                {item.reflection}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── ボトムナビ ───────────────────────────────────────────────────────────────

function BottomNav({ screen, setScreen }) {
  const items = [
    { key: 'home',      icon: Home,          label: 'ホーム' },
    { key: 'survey',    icon: ClipboardList, label: 'アンケート' },
    { key: 'log',       icon: BookOpen,      label: 'ログ' },
    { key: 'portfolio', icon: Briefcase,     label: '成果物' },
  ];

  return (
    <nav style={S.bottomNav}>
      {items.map(item => {
        const active = screen === item.key;
        return (
          <button
            key={item.key}
            onClick={() => setScreen(item.key)}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '10px 0 8px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: active ? '#7500C0' : 'var(--text-muted)',
              gap: 4,
              position: 'relative',
              transition: 'color 0.2s',
            }}
          >
            {active && (
              <span style={{
                position: 'absolute',
                top: 0,
                left: '50%',
                transform: 'translateX(-50%)',
                width: 32,
                height: 2,
                background: 'linear-gradient(90deg, #A100FF, #7500C0)',
                borderRadius: '0 0 2px 2px',
              }} />
            )}
            <item.icon size={20} />
            <span style={{ fontSize: 10, fontWeight: active ? 700 : 400 }}>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

// ─── メンター：学生一覧ホーム ─────────────────────────────────────────────────

function MentorHomeView({ user, onSelectStudent }) {
  const [students, setStudents] = useState([]);

  useEffect(() => {
    setStudents(storage.get('students_list') || []);
  }, []);

  return (
    <div style={S.page}>
      <div style={S.header}>
        <div>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>MENTOR</p>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>{user.name}</h2>
        </div>
        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{students.length} 名</span>
      </div>

      <div style={{ padding: '20px 20px 0' }}>
        <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 14 }}>
          担当学生
        </h3>
        {students.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
            <Users size={40} color="rgba(117,0,192,0.3)" style={{ marginBottom: 12 }} />
            <p style={{ fontSize: 14 }}>学生がまだいません</p>
            <p style={{ fontSize: 12, marginTop: 6 }}>学生がアプリにログインすると表示されます</p>
          </div>
        ) : students.map(student => {
          const surveys      = storage.keys(`survey:${student.id}:`).map(k => storage.get(k)).filter(Boolean);
          const mentorSurveys = storage.keys(`mentor_survey:${student.id}:`).map(k => storage.get(k)).filter(Boolean);
          const logs         = storage.keys(`log:${student.id}:`).map(k => storage.get(k)).filter(Boolean);
          const latest       = [...surveys].sort((a, b) => b.timestamp - a.timestamp)[0];
          const avgLv        = latest
            ? avg(AXES.map(a => latest.axes?.[a.key]?.level).filter(Boolean))
            : null;

          return (
            <button
              key={student.id}
              onClick={() => onSelectStudent(student)}
              style={{
                ...S.card, width: '100%', textAlign: 'left', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 16,
                boxShadow: '0 1px 4px rgba(117,0,192,0.06)', transition: 'border-color 0.2s',
              }}
            >
              <div style={{
                width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                background: 'linear-gradient(135deg, rgba(117,0,192,0.15), rgba(70,0,115,0.15))',
                border: '1px solid rgba(117,0,192,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18, fontWeight: 700, color: '#7500C0',
              }}>
                {student.name.charAt(0)}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 3 }}>{student.name}</p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  アンケート {surveys.length}件 · ログ {logs.length}件
                  {mentorSurveys.length > 0 && ` · メンター評価 ${mentorSurveys.length}件`}
                </p>
              </div>
              {avgLv !== null ? (
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: 10, color: '#7500C0', fontWeight: 700 }}>平均Lv</p>
                  <p style={{ fontSize: 20, fontWeight: 700, color: '#460073', lineHeight: 1.1 }}>{avgLv.toFixed(1)}</p>
                </div>
              ) : (
                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>—</p>
              )}
              <ChevronRight size={16} color="var(--text-muted)" />
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── メンター：学生詳細 ───────────────────────────────────────────────────────

function MentorStudentDetailView({ user, student, onBack, onAssess }) {
  const [tab, setTab] = useState('survey');

  const selfSurveys   = storage.keys(`survey:${student.id}:`).map(k => storage.get(k)).filter(Boolean);
  const mentorSurveys = storage.keys(`mentor_survey:${student.id}:`).map(k => storage.get(k)).filter(Boolean);
  const logs          = storage.keys(`log:${student.id}:`).map(k => storage.get(k)).filter(Boolean);

  const allSurveys = [
    ...selfSurveys.map(s => ({ ...s, source: 'self' })),
    ...mentorSurveys.map(s => ({ ...s, source: 'mentor' })),
  ].sort((a, b) => b.timestamp - a.timestamp);

  const sortedLogs = [...logs].sort((a, b) => b.timestamp - a.timestamp);

  const tabs = [
    { key: 'survey', label: 'アンケート', count: allSurveys.length },
    { key: 'log',    label: 'ログ',       count: sortedLogs.length },
  ];

  return (
    <div style={S.page}>
      <div style={S.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: 4 }}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>STUDENT</p>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>{student.name}</h2>
          </div>
        </div>
        <button onClick={onAssess} style={{ ...S.btn, padding: '8px 16px', fontSize: 13 }}>
          <Plus size={14} /> 評価入力
        </button>
      </div>

      {/* タブ */}
      <div style={{ display: 'flex', borderBottom: '1px solid rgba(117,0,192,0.15)', background: '#ffffff', position: 'sticky', top: 65, zIndex: 90 }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            flex: 1, padding: '12px', background: 'none', border: 'none', cursor: 'pointer',
            borderBottom: `2px solid ${tab === t.key ? '#7500C0' : 'transparent'}`,
            color: tab === t.key ? '#7500C0' : 'var(--text-muted)',
            fontWeight: tab === t.key ? 700 : 400, fontSize: 14, transition: 'all 0.2s',
          }}>
            {t.label} ({t.count})
          </button>
        ))}
      </div>

      <div style={{ padding: '20px 20px 0' }}>
        {tab === 'survey' && (
          allSurveys.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
              <ClipboardList size={40} color="rgba(117,0,192,0.3)" style={{ marginBottom: 12 }} />
              <p>アンケートデータがありません</p>
            </div>
          ) : allSurveys.map(s => {
            const vals  = AXES.map(a => s.axes?.[a.key]?.level).filter(Boolean);
            const avgLv = vals.length ? avg(vals).toFixed(1) : '—';
            return (
              <div key={s.timestamp} style={{ ...S.card, padding: '14px 16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{formatDate(s.timestamp)}</span>
                    {s.source === 'mentor' && (
                      <span style={{ background: '#460073', color: '#fff', fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 4 }}>
                        メンター
                      </span>
                    )}
                  </div>
                  <span style={{ background: 'rgba(117,0,192,0.1)', color: '#7500C0', fontSize: 12, fontWeight: 700, padding: '2px 8px', borderRadius: 6 }}>
                    平均 Lv.{avgLv}
                  </span>
                </div>
                {s.term && <p style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.5, marginBottom: 8 }}>{s.term}</p>}
                {s.note && <p style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.5, marginBottom: 8 }}>{s.note}</p>}
                {s.source === 'mentor' && s.mentorName && (
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>評価者: {s.mentorName}</p>
                )}
                <div style={{ display: 'flex', gap: 3, marginTop: 6 }}>
                  {AXES.map(ax => {
                    const lv = s.axes?.[ax.key]?.level || 0;
                    return (
                      <div key={ax.key} style={{ flex: 1, textAlign: 'center' }}>
                        <div style={{ fontSize: 9, color: 'var(--text-muted)', marginBottom: 2 }}>{ax.num}</div>
                        <div style={{ height: 20, borderRadius: 4, background: lv > 0 ? LEVEL_COLORS[lv] : 'rgba(117,0,192,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {lv > 0 && <span style={{ fontSize: 9, color: '#fff', fontWeight: 700 }}>{lv}</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}

        {tab === 'log' && (
          sortedLogs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
              <BookOpen size={40} color="rgba(117,0,192,0.3)" style={{ marginBottom: 12 }} />
              <p>ログデータがありません</p>
            </div>
          ) : sortedLogs.map(log => (
            <div key={log.timestamp} style={{ ...S.card, padding: '14px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <span style={{ fontSize: 20 }}>{EMOTIONS[log.emotion - 1]}</span>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{formatDate(log.timestamp)}</span>
              </div>
              {[
                { label: 'Y やったこと',  val: log.yatta },
                { label: 'W わかったこと', val: log.wakatta },
                { label: 'T 次にやること', val: log.tsugi },
              ].filter(f => f.val).map(f => (
                <div key={f.label} style={{ marginBottom: 8 }}>
                  <span style={{ fontSize: 11, color: '#7500C0', fontWeight: 700 }}>{f.label}</span>
                  <p style={{ fontSize: 13, color: 'var(--text)', marginTop: 3, lineHeight: 1.6 }}>{f.val}</p>
                </div>
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ─── メンター：評価入力 ───────────────────────────────────────────────────────

function MentorSurveyView({ user, initialStudent }) {
  const students = storage.get('students_list') || [];
  const [selectedId, setSelectedId] = useState(initialStudent?.id || '');
  const blankAxes = Object.fromEntries(AXES.map(a => [a.key, { level: 0, comment: '' }]));
  const [note, setNote]   = useState('');
  const [axes, setAxes]   = useState(blankAxes);
  const [saved, setSaved] = useState(false);
  const [history, setHistory] = useState([]);

  const selectedStudent = students.find(s => s.id === selectedId) || null;

  useEffect(() => {
    if (!selectedId) { setHistory([]); return; }
    const keys = storage.keys(`mentor_survey:${selectedId}:`).sort().reverse();
    setHistory(keys.map(k => storage.get(k)).filter(Boolean));
  }, [selectedId, saved]);

  const completed = AXES.filter(a => axes[a.key]?.level > 0).length;
  const avgLv = completed > 0
    ? avg(AXES.filter(a => axes[a.key]?.level > 0).map(a => axes[a.key].level)).toFixed(1)
    : '—';

  const handleSave = () => {
    if (!selectedId || completed === 0) return;
    const ts = Date.now();
    storage.set(`mentor_survey:${selectedId}:${ts}`, {
      mentorID: user.id, mentorName: user.name,
      studentID: selectedId, studentName: selectedStudent?.name || selectedId,
      timestamp: ts, note, axes,
    });
    setNote(''); setAxes(blankAxes); setSaved(s => !s);
  };

  const setLevel   = (k, lv)  => setAxes(prev => ({ ...prev, [k]: { ...prev[k], level: lv } }));
  const setComment = (k, val) => setAxes(prev => ({ ...prev, [k]: { ...prev[k], comment: val } }));

  return (
    <div style={S.page}>
      <div style={S.header}>
        <div>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.1em' }}>ASSESSMENT</p>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>メンター評価</h2>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 13, color: '#7500C0', fontWeight: 700 }}>{completed}/9</span>
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>平均 {avgLv}</span>
        </div>
      </div>

      <div style={{ padding: '20px 20px 0' }}>
        {/* 学生選択 */}
        <div style={{ ...S.card, borderColor: 'rgba(117,0,192,0.25)', marginBottom: 20 }}>
          <label style={S.label}>対象学生 *</label>
          {students.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>
              学生がいません（学生がログインすると表示されます）
            </p>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
              {students.map(s => (
                <button key={s.id} onClick={() => setSelectedId(s.id)} style={{
                  padding: '8px 16px', borderRadius: 10, fontSize: 14, cursor: 'pointer', transition: 'all 0.2s',
                  border: `2px solid ${selectedId === s.id ? '#7500C0' : 'rgba(117,0,192,0.2)'}`,
                  background: selectedId === s.id ? 'rgba(117,0,192,0.1)' : '#ffffff',
                  color: selectedId === s.id ? '#7500C0' : 'var(--text-muted)',
                  fontWeight: selectedId === s.id ? 700 : 400,
                }}>
                  {s.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 評価メモ */}
        <div style={{ ...S.card, borderColor: 'rgba(117,0,192,0.25)', marginBottom: 20 }}>
          <label style={S.label}>評価メモ（任意）</label>
          <textarea
            style={{ ...S.input, minHeight: 72, resize: 'vertical', lineHeight: 1.6 }}
            placeholder="この評価セッションのメモ・コメント"
            value={note}
            onChange={e => setNote(e.target.value)}
          />
        </div>

        {/* 評価軸 */}
        {['A', 'B', 'C'].map(cat => {
          const catAxes = AXES.filter(a => a.category === cat);
          const c = CATEGORY_COLORS[cat];
          return (
            <div key={cat} style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <span style={{ background: c.badge, color: '#fff', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 6 }}>{cat}</span>
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{c.label}</span>
              </div>
              {catAxes.map(axis => {
                const cur = axes[axis.key];
                return (
                  <div key={axis.key} style={{
                    ...S.card, marginBottom: 10, transition: 'all 0.2s',
                    background: cur.level > 0 ? LEVEL_BG[cur.level] : 'var(--bg-card)',
                    borderColor: cur.level > 0 ? `${LEVEL_COLORS[cur.level]}50` : 'var(--border)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                      <div>
                        <span style={{ fontSize: 13, color: '#7500C0', fontWeight: 700, marginRight: 6 }}>{axis.num}</span>
                        <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>{axis.name}</span>
                        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{axis.desc}</p>
                      </div>
                      {cur.level > 0 && (
                        <span style={{ background: LEVEL_COLORS[cur.level], color: '#fff', fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6, whiteSpace: 'nowrap', marginLeft: 8 }}>
                          Lv.{cur.level}
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                      {LEVELS.map(lv => (
                        <button key={lv.lv} onClick={() => setLevel(axis.key, lv.lv)} style={{
                          flex: 1, padding: '8px 4px', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                          textAlign: 'center', transition: 'all 0.15s',
                          border: `2px solid ${cur.level === lv.lv ? LEVEL_COLORS[lv.lv] : 'rgba(117,0,192,0.15)'}`,
                          background: cur.level === lv.lv ? `${LEVEL_COLORS[lv.lv]}25` : '#ffffff',
                          color: cur.level === lv.lv ? LEVEL_COLORS[lv.lv] : 'var(--text-muted)',
                        }}>
                          <div style={{ fontSize: 10, marginBottom: 1, opacity: 0.7 }}>Lv.{lv.lv}</div>
                          {lv.name}
                        </button>
                      ))}
                    </div>
                    <input
                      style={{ ...S.input, fontSize: 13, padding: '9px 12px' }}
                      placeholder="補足コメント（任意）"
                      value={cur.comment}
                      onChange={e => setComment(axis.key, e.target.value)}
                    />
                  </div>
                );
              })}
            </div>
          );
        })}

        {/* 保存ボタン */}
        <button
          style={{
            ...S.btn, width: '100%', justifyContent: 'center', fontSize: 16, padding: '14px', marginBottom: 24,
            opacity: (!selectedId || completed === 0) ? 0.4 : 1,
          }}
          onClick={handleSave}
          disabled={!selectedId || completed === 0}
        >
          <Save size={18} /> 保存する
        </button>

        {/* 評価履歴 */}
        {history.length > 0 && selectedStudent && (
          <div style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>
              {selectedStudent.name} の評価履歴
            </h3>
            {history.map(s => {
              const vals = AXES.map(a => s.axes?.[a.key]?.level).filter(Boolean);
              const a   = vals.length ? avg(vals).toFixed(1) : '—';
              return (
                <div key={s.timestamp} style={{ ...S.card, padding: '14px 16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{formatDate(s.timestamp)}</span>
                    <span style={{ background: 'rgba(117,0,192,0.1)', color: '#7500C0', fontSize: 12, fontWeight: 700, padding: '2px 8px', borderRadius: 6 }}>
                      平均 Lv.{a}
                    </span>
                  </div>
                  {s.note && <p style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.5, marginBottom: 8 }}>{s.note}</p>}
                  <div style={{ display: 'flex', gap: 3 }}>
                    {AXES.map(ax => {
                      const lv = s.axes?.[ax.key]?.level || 0;
                      return (
                        <div key={ax.key} style={{ flex: 1, textAlign: 'center' }}>
                          <div style={{ fontSize: 9, color: 'var(--text-muted)', marginBottom: 2 }}>{ax.num}</div>
                          <div style={{ height: 20, borderRadius: 4, background: lv > 0 ? LEVEL_COLORS[lv] : 'rgba(117,0,192,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {lv > 0 && <span style={{ fontSize: 9, color: '#fff', fontWeight: 700 }}>{lv}</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── メンター ボトムナビ ──────────────────────────────────────────────────────

function MentorBottomNav({ screen, setScreen }) {
  const items = [
    { key: 'home',          icon: Users,         label: '学生一覧' },
    { key: 'mentor_survey', icon: ClipboardList, label: '評価入力' },
  ];

  return (
    <nav style={S.bottomNav}>
      {items.map(item => {
        const active = screen === item.key || (item.key === 'home' && screen === 'student_detail');
        return (
          <button key={item.key} onClick={() => setScreen(item.key)} style={{
            flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            padding: '10px 0 8px', background: 'none', border: 'none', cursor: 'pointer', gap: 4,
            color: active ? '#7500C0' : 'var(--text-muted)', position: 'relative', transition: 'color 0.2s',
          }}>
            {active && (
              <span style={{
                position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
                width: 32, height: 2, background: 'linear-gradient(90deg, #A100FF, #7500C0)',
                borderRadius: '0 0 2px 2px',
              }} />
            )}
            <item.icon size={20} />
            <span style={{ fontSize: 10, fontWeight: active ? 700 : 400 }}>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

// ─── アプリルート ─────────────────────────────────────────────────────────────

export default function App() {
  const [user, setUser]                     = useState(null);
  const [screen, setScreen]                 = useState('home');
  const [selectedStudent, setSelectedStudent] = useState(null);

  useEffect(() => {
    const saved = storage.get('current_user');
    if (saved) setUser(saved);
  }, []);

  const handleLogin = (u) => {
    storage.set('current_user', u);
    if (u.role === 'student') {
      const list = storage.get('students_list') || [];
      const exists = list.find(s => s.id === u.id);
      if (!exists) {
        storage.set('students_list', [...list, { id: u.id, name: u.name, registeredAt: Date.now() }]);
      } else if (exists.name !== u.name) {
        storage.set('students_list', list.map(s => s.id === u.id ? { ...s, name: u.name } : s));
      }
    }
    setUser(u);
  };

  const handleLogout = () => {
    storage.delete('current_user');
    setUser(null);
    setScreen('home');
    setSelectedStudent(null);
  };

  const logoutBtn = (
    <button
      onClick={handleLogout}
      style={{
        position: 'fixed', bottom: 84, right: 20,
        background: 'rgba(117,0,192,0.08)', border: '1px solid rgba(117,0,192,0.2)',
        borderRadius: 10, padding: '8px 12px', color: 'var(--text-muted)',
        fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, zIndex: 150,
      }}
    >
      <LogOut size={13} /> ログアウト
    </button>
  );

  if (!user) return <LoginView onLogin={handleLogin} />;

  // ─── メンターUI ────────────────────────────────────────────────────────────
  if (user.role === 'mentor') {
    const goToStudent = (student) => { setSelectedStudent(student); setScreen('student_detail'); };
    const goToAssess  = (student) => { setSelectedStudent(student); setScreen('mentor_survey'); };
    const mentorNav   = (s) => { setScreen(s); if (s === 'home') setSelectedStudent(null); };

    return (
      <div style={{ position: 'relative' }}>
        {screen === 'home' && (
          <MentorHomeView user={user} onSelectStudent={goToStudent} />
        )}
        {screen === 'student_detail' && selectedStudent && (
          <MentorStudentDetailView
            user={user}
            student={selectedStudent}
            onBack={() => mentorNav('home')}
            onAssess={() => goToAssess(selectedStudent)}
          />
        )}
        {screen === 'mentor_survey' && (
          <MentorSurveyView user={user} initialStudent={selectedStudent} />
        )}
        <MentorBottomNav screen={screen} setScreen={mentorNav} />
        {screen === 'home' && logoutBtn}
      </div>
    );
  }

  // ─── 学生UI ────────────────────────────────────────────────────────────────
  return (
    <div style={{ position: 'relative' }}>
      {screen === 'home'      && <HomeView user={user} setScreen={setScreen} />}
      {screen === 'survey'    && <SurveyView user={user} />}
      {screen === 'log'       && <LogView user={user} />}
      {screen === 'portfolio' && <PortfolioView user={user} />}

      <BottomNav screen={screen} setScreen={setScreen} />

      {screen === 'home' && logoutBtn}
    </div>
  );
}
