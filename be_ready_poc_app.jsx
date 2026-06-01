import React, { useState, useEffect } from 'react';
import { Home, ClipboardCheck, PenLine, FolderOpen, LogOut, ChevronRight, Plus, Trash2, ExternalLink, Calendar, TrendingUp, Award, BookOpen, Target, MessageSquare } from 'lucide-react';

// ==========================================
// 評価軸データ（9軸×4レベル）
// ==========================================
const AXES = [
  { id: 1, num: '①', name: '課題設定力', group: 'A 思考・判断系', question: 'プロジェクト/業務において、解くべき問いを自分で立てられたか' },
  { id: 2, num: '②', name: '情報活用力', group: 'A 思考・判断系', question: '情報を収集・整理・活用して、意思決定に使えたか' },
  { id: 3, num: '③', name: '不確実性への耐性', group: 'A 思考・判断系', question: '答えのない状況でも動けたか' },
  { id: 4, num: '④', name: '提案・発信力', group: 'B 行動・実行系', question: '自分の意見を相手に伝わる形で発信できたか' },
  { id: 5, num: '⑤', name: '実行・改善力', group: 'B 行動・実行系', question: '計画を実行し、振り返って改善できたか' },
  { id: 6, num: '⑥', name: 'オーナーシップ', group: 'B 行動・実行系', question: '課題を自分ごととして責任を持って取り組めたか' },
  { id: 7, num: '⑦', name: '協働・調整力', group: 'C 関係・姿勢系', question: '異なる立場の人と建設的に動けたか' },
  { id: 8, num: '⑧', name: '自律・内発的動機', group: 'C 関係・姿勢系', question: 'なぜやるかを自分の言葉で語れたか' },
  { id: 9, num: '⑨', name: '行動変容力', group: 'C 関係・姿勢系', question: 'フィードバックを行動の変化につなげられたか' },
];

const LEVELS = [
  { lv: 1, name: '受動性', desc: '指示されて動く / 報酬で動く', color: '#9CA3AF' },
  { lv: 2, name: '能動性', desc: '意義を理解して自ら動く', color: '#A100FF' },
  { lv: 3, name: '自律性', desc: '振り返って自分事化できる', color: '#7500C0' },
  { lv: 4, name: '創造性', desc: 'オリジナルな成果を生み出す', color: '#460073' },
];

// ==========================================
// メインアプリ
// ==========================================
export default function BeReadyApp() {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState('home');
  const [loading, setLoading] = useState(true);

  // 起動時にログイン状態をチェック
  useEffect(() => {
    (async () => {
      try {
        const result = await window.storage.get('current_user');
        if (result && result.value) {
          setUser(JSON.parse(result.value));
        }
      } catch (e) {
        // 未ログイン
      }
      setLoading(false);
    })();
  }, []);

  const handleLogin = async (userData) => {
    try {
      await window.storage.set('current_user', JSON.stringify(userData));
      setUser(userData);
    } catch (e) {
      console.error('Login failed:', e);
    }
  };

  const handleLogout = async () => {
    try {
      await window.storage.delete('current_user');
    } catch (e) {}
    setUser(null);
    setPage('home');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-stone-400 text-sm tracking-widest">LOADING...</div>
      </div>
    );
  }

  if (!user) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-stone-50 font-sans">
      <div className="flex">
        <Sidebar
          user={user}
          page={page}
          setPage={setPage}
          onLogout={handleLogout}
        />
        <main className="flex-1 ml-64 min-h-screen">
          <div className="max-w-6xl mx-auto p-8">
            {page === 'home' && <HomeScreen user={user} setPage={setPage} />}
            {page === 'survey' && <SurveyScreen user={user} />}
            {page === 'log' && <LogScreen user={user} />}
            {page === 'portfolio' && <PortfolioScreen user={user} />}
          </div>
        </main>
      </div>
    </div>
  );
}

// ==========================================
// ログイン画面
// ==========================================
function LoginScreen({ onLogin }) {
  const [name, setName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [role, setRole] = useState('student');

  const handleSubmit = () => {
    if (!name.trim() || !studentId.trim()) return;
    onLogin({
      name: name.trim(),
      studentId: studentId.trim(),
      role,
      loginAt: new Date().toISOString(),
    });
  };

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
      <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#460073] via-[#7500C0] to-[#A100FF]" />

      <div className="w-full max-w-md">
        {/* ロゴ・タイトル */}
        <div className="mb-12">
          <div className="text-[10px] tracking-[0.3em] text-stone-500 mb-2 font-mono">PROOF OF CONCEPT v0.1</div>
          <h1 className="text-4xl font-bold text-[#460073] mb-1 tracking-tight">Be-Ready</h1>
          <div className="text-xs text-stone-600">人材育成プログラム 自己評価アプリ</div>
          <div className="mt-3 h-px bg-stone-200" />
        </div>

        {/* フォーム */}
        <div className="bg-white border border-stone-200 p-8">
          <div className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-2 tracking-wide">
                氏名 <span className="text-stone-400">/ NAME</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2.5 border border-stone-300 focus:border-[#7500C0] focus:outline-none focus:ring-1 focus:ring-[#7500C0] text-sm transition-colors"
                placeholder="例：佐藤 太郎"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-2 tracking-wide">
                ID <span className="text-stone-400">/ STUDENT ID</span>
              </label>
              <input
                type="text"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                className="w-full px-3 py-2.5 border border-stone-300 focus:border-[#7500C0] focus:outline-none focus:ring-1 focus:ring-[#7500C0] text-sm transition-colors"
                placeholder="例：S202601"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-2 tracking-wide">
                区分 <span className="text-stone-400">/ ROLE</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'student', label: '学生' },
                  { value: 'mentor', label: 'メンター' },
                ].map((r) => (
                  <button
                    key={r.value}
                    onClick={() => setRole(r.value)}
                    className={`py-2.5 text-sm border transition-all ${
                      role === r.value
                        ? 'border-[#7500C0] bg-[#F3E8FF] text-[#460073] font-bold'
                        : 'border-stone-300 text-stone-600 hover:border-stone-400'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={!name.trim() || !studentId.trim()}
              className="w-full bg-[#460073] text-white py-3 text-sm font-bold tracking-wider hover:bg-[#7500C0] transition-colors disabled:bg-stone-300 disabled:cursor-not-allowed"
            >
              ログイン →
            </button>
          </div>
        </div>

        <div className="mt-6 text-[10px] text-stone-400 text-center tracking-wider">
          POC版 / 認証は省略しています
        </div>
      </div>
    </div>
  );
}

// ==========================================
// サイドバー
// ==========================================
function Sidebar({ user, page, setPage, onLogout }) {
  const navItems = [
    { key: 'home', label: 'ホーム', sub: 'HOME', icon: Home },
    { key: 'survey', label: 'アンケート入力', sub: 'SURVEY', icon: ClipboardCheck },
    { key: 'log', label: 'ログ入力', sub: 'LOG', icon: PenLine },
    { key: 'portfolio', label: 'ポートフォリオ', sub: 'PORTFOLIO', icon: FolderOpen },
  ];

  return (
    <aside className="w-64 bg-white border-r border-stone-200 fixed h-screen flex flex-col">
      {/* ロゴ */}
      <div className="p-6 border-b border-stone-200">
        <div className="text-[9px] tracking-[0.25em] text-stone-500 mb-1 font-mono">POC v0.1</div>
        <div className="text-xl font-bold text-[#460073] tracking-tight">Be-Ready</div>
        <div className="text-[10px] text-stone-500 mt-0.5">自己評価アプリ</div>
      </div>

      {/* ユーザー情報 */}
      <div className="p-4 border-b border-stone-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#460073] text-white flex items-center justify-center font-bold text-sm">
            {user.name[0]}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold text-stone-800 truncate">{user.name}</div>
            <div className="text-[10px] text-stone-500 tracking-wider">
              {user.role === 'student' ? 'STUDENT' : 'MENTOR'} / {user.studentId}
            </div>
          </div>
        </div>
      </div>

      {/* ナビゲーション */}
      <nav className="flex-1 p-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = page === item.key;
          return (
            <button
              key={item.key}
              onClick={() => setPage(item.key)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 mb-1 text-left transition-all ${
                active
                  ? 'bg-[#F3E8FF] text-[#460073] border-l-2 border-[#7500C0]'
                  : 'text-stone-600 hover:bg-stone-50 border-l-2 border-transparent'
              }`}
            >
              <Icon size={16} strokeWidth={active ? 2.5 : 2} />
              <div className="flex-1">
                <div className={`text-sm ${active ? 'font-bold' : 'font-medium'}`}>{item.label}</div>
                <div className="text-[9px] tracking-widest opacity-60">{item.sub}</div>
              </div>
            </button>
          );
        })}
      </nav>

      {/* ログアウト */}
      <div className="p-3 border-t border-stone-200">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2 text-stone-500 hover:bg-stone-50 transition-colors text-sm"
        >
          <LogOut size={14} />
          <span>ログアウト</span>
        </button>
      </div>
    </aside>
  );
}

// ==========================================
// ホーム画面（ダッシュボード）
// ==========================================
function HomeScreen({ user, setPage }) {
  const [stats, setStats] = useState({ surveys: 0, logs: 0, portfolios: 0, avgLevel: 0 });

  useEffect(() => {
    (async () => {
      try {
        const surveysRes = await window.storage.list(`survey:${user.studentId}:`);
        const logsRes = await window.storage.list(`log:${user.studentId}:`);
        const portfoliosRes = await window.storage.list(`portfolio:${user.studentId}:`);

        let avgLevel = 0;
        if (surveysRes && surveysRes.keys && surveysRes.keys.length > 0) {
          const latestKey = surveysRes.keys.sort().reverse()[0];
          const latestRes = await window.storage.get(latestKey);
          if (latestRes && latestRes.value) {
            const data = JSON.parse(latestRes.value);
            const levels = Object.values(data.scores || {});
            if (levels.length > 0) {
              avgLevel = levels.reduce((a, b) => a + b, 0) / levels.length;
            }
          }
        }

        setStats({
          surveys: surveysRes?.keys?.length || 0,
          logs: logsRes?.keys?.length || 0,
          portfolios: portfoliosRes?.keys?.length || 0,
          avgLevel: avgLevel.toFixed(1),
        });
      } catch (e) {
        console.log('Stats load:', e);
      }
    })();
  }, [user.studentId]);

  return (
    <div>
      {/* ヘッダー */}
      <div className="mb-10">
        <div className="text-[10px] tracking-[0.3em] text-stone-500 mb-2 font-mono">HOME / DASHBOARD</div>
        <h1 className="text-3xl font-bold text-stone-800 mb-1">
          ようこそ、<span className="text-[#460073]">{user.name}</span> さん
        </h1>
        <div className="text-sm text-stone-500">本日も自己評価とリフレクションを進めましょう。</div>
        <div className="mt-4 h-px bg-gradient-to-r from-[#460073] via-[#7500C0] to-transparent" />
      </div>

      {/* 評価基準の3要素 */}
      <div className="mb-10">
        <div className="text-xs font-bold text-stone-700 tracking-wider mb-4">▼ 評価基準は3要素で構成</div>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white border border-stone-200 p-5">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 bg-[#A100FF] text-white flex items-center justify-center text-xs font-bold">1</div>
              <div className="text-xs tracking-wider text-stone-500 font-mono">ANKETO</div>
            </div>
            <div className="text-base font-bold text-stone-800 mb-1">アンケート</div>
            <div className="text-xs text-stone-500">9評価軸×4レベルで自己評価</div>
          </div>
          <div className="bg-white border border-stone-200 p-5">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 bg-[#7500C0] text-white flex items-center justify-center text-xs font-bold">2</div>
              <div className="text-xs tracking-wider text-stone-500 font-mono">LOG</div>
            </div>
            <div className="text-base font-bold text-stone-800 mb-1">ログ</div>
            <div className="text-xs text-stone-500">日々の振り返りを文章で記録</div>
          </div>
          <div className="bg-white border border-stone-200 p-5">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 bg-[#460073] text-white flex items-center justify-center text-xs font-bold">3</div>
              <div className="text-xs tracking-wider text-stone-500 font-mono">PORTFOLIO</div>
            </div>
            <div className="text-base font-bold text-stone-800 mb-1">成果物</div>
            <div className="text-xs text-stone-500">プロジェクトの成果を蓄積</div>
          </div>
        </div>
      </div>

      {/* 統計 */}
      <div className="mb-10">
        <div className="text-xs font-bold text-stone-700 tracking-wider mb-4">▼ あなたの蓄積データ</div>
        <div className="grid grid-cols-4 gap-4">
          <StatCard label="平均レベル" sub="AVG LEVEL" value={stats.avgLevel} unit="/ 4.0" icon={TrendingUp} color="#460073" />
          <StatCard label="アンケート" sub="SURVEYS" value={stats.surveys} unit="件" icon={ClipboardCheck} color="#A100FF" />
          <StatCard label="ログ" sub="LOGS" value={stats.logs} unit="件" icon={PenLine} color="#7500C0" />
          <StatCard label="成果物" sub="PORTFOLIOS" value={stats.portfolios} unit="件" icon={FolderOpen} color="#460073" />
        </div>
      </div>

      {/* クイックアクション */}
      <div>
        <div className="text-xs font-bold text-stone-700 tracking-wider mb-4">▼ クイックアクション</div>
        <div className="grid grid-cols-3 gap-4">
          <ActionCard
            title="自己評価する"
            sub="今週の自分を9軸で振り返る"
            onClick={() => setPage('survey')}
            color="#A100FF"
            icon={ClipboardCheck}
          />
          <ActionCard
            title="ログを書く"
            sub="今日の気づきを記録する"
            onClick={() => setPage('log')}
            color="#7500C0"
            icon={PenLine}
          />
          <ActionCard
            title="成果物を追加"
            sub="作った資料・コードを蓄積"
            onClick={() => setPage('portfolio')}
            color="#460073"
            icon={FolderOpen}
          />
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, sub, value, unit, icon: Icon, color }) {
  return (
    <div className="bg-white border border-stone-200 p-4">
      <div className="flex items-center justify-between mb-2">
        <Icon size={14} style={{ color }} strokeWidth={2.5} />
        <div className="text-[9px] tracking-[0.2em] text-stone-400 font-mono">{sub}</div>
      </div>
      <div className="text-xs text-stone-600 mb-1">{label}</div>
      <div className="flex items-baseline gap-1">
        <div className="text-2xl font-bold" style={{ color }}>
          {value}
        </div>
        <div className="text-xs text-stone-400">{unit}</div>
      </div>
    </div>
  );
}

function ActionCard({ title, sub, onClick, color, icon: Icon }) {
  return (
    <button
      onClick={onClick}
      className="bg-white border border-stone-200 p-5 text-left hover:border-stone-300 transition-all group"
    >
      <div className="flex items-center justify-between mb-3">
        <Icon size={18} style={{ color }} strokeWidth={2.5} />
        <ChevronRight size={14} className="text-stone-300 group-hover:text-stone-600 transition-colors" />
      </div>
      <div className="text-sm font-bold text-stone-800 mb-1">{title}</div>
      <div className="text-xs text-stone-500">{sub}</div>
    </button>
  );
}

// ==========================================
// アンケート入力画面
// ==========================================
function SurveyScreen({ user }) {
  const [scores, setScores] = useState({});
  const [comments, setComments] = useState({});
  const [goal, setGoal] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState('');

  const handleScore = (axisId, level) => {
    setScores({ ...scores, [axisId]: level });
  };

  const handleComment = (axisId, value) => {
    setComments({ ...comments, [axisId]: value });
  };

  const handleSave = async () => {
    setSaving(true);
    const key = `survey:${user.studentId}:${Date.now()}`;
    const data = {
      userId: user.studentId,
      userName: user.name,
      timestamp: new Date().toISOString(),
      goal,
      scores,
      comments,
    };
    try {
      await window.storage.set(key, JSON.stringify(data));
      setSavedMessage('保存しました');
      setTimeout(() => setSavedMessage(''), 2500);
    } catch (e) {
      setSavedMessage('保存に失敗しました');
    }
    setSaving(false);
  };

  const completedCount = Object.keys(scores).length;
  const avgScore = completedCount > 0
    ? (Object.values(scores).reduce((a, b) => a + b, 0) / completedCount).toFixed(1)
    : 0;

  return (
    <div>
      <div className="mb-8">
        <div className="text-[10px] tracking-[0.3em] text-stone-500 mb-2 font-mono">SURVEY / SELF-ASSESSMENT</div>
        <h1 className="text-3xl font-bold text-stone-800 mb-1">アンケート入力</h1>
        <div className="text-sm text-stone-500">9つの評価軸について、自分の現状レベルを判定してください。</div>
        <div className="mt-4 h-px bg-gradient-to-r from-[#A100FF] via-[#7500C0] to-transparent" />
      </div>

      {/* 進捗インジケーター */}
      <div className="bg-white border border-stone-200 p-4 mb-6 flex items-center gap-6">
        <div>
          <div className="text-[10px] text-stone-500 tracking-wider mb-1">PROGRESS</div>
          <div className="text-2xl font-bold text-[#460073]">{completedCount} <span className="text-sm text-stone-400 font-normal">/ 9</span></div>
        </div>
        <div className="flex-1">
          <div className="h-1.5 bg-stone-100 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#A100FF] to-[#460073] transition-all"
              style={{ width: `${(completedCount / 9) * 100}%` }}
            />
          </div>
        </div>
        <div>
          <div className="text-[10px] text-stone-500 tracking-wider mb-1">AVG LV</div>
          <div className="text-2xl font-bold text-[#7500C0]">{avgScore}</div>
        </div>
      </div>

      {/* 今期の目標（目標設定起点） */}
      <div className="bg-white border border-stone-200 p-6 mb-8">
        <div className="flex items-center gap-2 mb-3">
          <Target size={16} className="text-[#460073]" strokeWidth={2.5} />
          <div className="text-sm font-bold text-stone-800">今期の目標</div>
          <div className="text-[10px] text-stone-400 tracking-wider font-mono">/ MY GOAL</div>
        </div>
        <div className="text-xs text-stone-500 mb-3">「私はこうなりたい」を自分の言葉で記述してください。</div>
        <textarea
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-stone-300 focus:border-[#7500C0] focus:outline-none focus:ring-1 focus:ring-[#7500C0] text-sm resize-none"
          placeholder="例：プロジェクトで自分から論点を提示できるようになりたい / 課題に対して受け身でなく主体的に動けるようになりたい..."
        />
      </div>

      {/* 評価軸ごとのアンケート */}
      <div className="space-y-5 mb-8">
        {['A 思考・判断系', 'B 行動・実行系', 'C 関係・姿勢系'].map((group) => (
          <div key={group}>
            <div className="text-xs font-bold text-stone-700 tracking-wider mb-3">▼ {group}</div>
            <div className="space-y-3">
              {AXES.filter((a) => a.group === group).map((axis) => (
                <AxisCard
                  key={axis.id}
                  axis={axis}
                  selectedLevel={scores[axis.id]}
                  comment={comments[axis.id] || ''}
                  onScore={(lv) => handleScore(axis.id, lv)}
                  onComment={(v) => handleComment(axis.id, v)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* 保存ボタン */}
      <div className="sticky bottom-4 bg-white border border-stone-300 p-4 flex items-center justify-between shadow-sm">
        <div className="text-xs text-stone-500">
          {completedCount === 9 ? '全項目入力完了' : `あと ${9 - completedCount} 項目`}
        </div>
        <div className="flex items-center gap-3">
          {savedMessage && (
            <span className="text-xs text-[#7500C0] font-bold">{savedMessage}</span>
          )}
          <button
            onClick={handleSave}
            disabled={saving || completedCount === 0}
            className="bg-[#460073] text-white px-6 py-2.5 text-sm font-bold tracking-wider hover:bg-[#7500C0] transition-colors disabled:bg-stone-300 disabled:cursor-not-allowed"
          >
            {saving ? '保存中...' : '保存する'}
          </button>
        </div>
      </div>
    </div>
  );
}

function AxisCard({ axis, selectedLevel, comment, onScore, onComment }) {
  return (
    <div className="bg-white border border-stone-200 p-5">
      <div className="flex items-start gap-3 mb-4">
        <div className="text-2xl font-bold text-[#460073] leading-none">{axis.num}</div>
        <div className="flex-1">
          <div className="text-sm font-bold text-stone-800">{axis.name}</div>
          <div className="text-xs text-stone-500 mt-1">{axis.question}</div>
        </div>
      </div>

      {/* レベル選択 */}
      <div className="grid grid-cols-4 gap-2 mb-3">
        {LEVELS.map((lv) => {
          const active = selectedLevel === lv.lv;
          return (
            <button
              key={lv.lv}
              onClick={() => onScore(lv.lv)}
              className={`p-3 border text-left transition-all ${
                active
                  ? 'border-[#7500C0] bg-[#F3E8FF]'
                  : 'border-stone-200 hover:border-stone-300'
              }`}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <div
                  className="w-5 h-5 flex items-center justify-center text-[10px] font-bold text-white"
                  style={{ backgroundColor: lv.color }}
                >
                  {lv.lv}
                </div>
                <div className={`text-xs font-bold ${active ? 'text-[#460073]' : 'text-stone-700'}`}>
                  {lv.name}
                </div>
              </div>
              <div className="text-[10px] text-stone-500 leading-tight">{lv.desc}</div>
            </button>
          );
        })}
      </div>

      {/* 補足コメント */}
      <textarea
        value={comment}
        onChange={(e) => onComment(e.target.value)}
        rows={2}
        className="w-full px-3 py-2 border border-stone-200 focus:border-[#7500C0] focus:outline-none focus:ring-1 focus:ring-[#7500C0] text-xs resize-none"
        placeholder="判定の理由・具体的なエピソードがあれば記入（任意）"
      />
    </div>
  );
}

// ==========================================
// ログ入力画面
// ==========================================
function LogScreen({ user }) {
  const [logs, setLogs] = useState([]);
  const [y, setY] = useState(''); // やったこと
  const [w, setW] = useState(''); // わかったこと
  const [t, setT] = useState(''); // 次にやること
  const [emotion, setEmotion] = useState(3);
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState('');

  const loadLogs = async () => {
    try {
      const res = await window.storage.list(`log:${user.studentId}:`);
      if (res && res.keys) {
        const sorted = res.keys.sort().reverse();
        const items = [];
        for (const k of sorted) {
          try {
            const r = await window.storage.get(k);
            if (r && r.value) {
              items.push({ key: k, ...JSON.parse(r.value) });
            }
          } catch {}
        }
        setLogs(items);
      }
    } catch (e) {
      console.log('Logs load:', e);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [user.studentId]);

  const handleSave = async () => {
    if (!y.trim() && !w.trim() && !t.trim()) return;
    setSaving(true);
    const key = `log:${user.studentId}:${Date.now()}`;
    const data = {
      userId: user.studentId,
      userName: user.name,
      timestamp: new Date().toISOString(),
      y, w, t, emotion,
    };
    try {
      await window.storage.set(key, JSON.stringify(data));
      setY(''); setW(''); setT(''); setEmotion(3);
      setSavedMessage('保存しました');
      setTimeout(() => setSavedMessage(''), 2500);
      await loadLogs();
    } catch (e) {
      setSavedMessage('保存に失敗しました');
    }
    setSaving(false);
  };

  const handleDelete = async (key) => {
    if (!confirm('このログを削除しますか？')) return;
    try {
      await window.storage.delete(key);
      await loadLogs();
    } catch (e) {
      console.error(e);
    }
  };

  const emotionLabels = ['😞 厳しい', '😕 やや困難', '😐 ふつう', '🙂 順調', '😄 とても良い'];

  return (
    <div>
      <div className="mb-8">
        <div className="text-[10px] tracking-[0.3em] text-stone-500 mb-2 font-mono">LOG / REFLECTION JOURNAL</div>
        <h1 className="text-3xl font-bold text-stone-800 mb-1">ログ入力</h1>
        <div className="text-sm text-stone-500">YWT法（やったこと / わかったこと / 次にやること）で振り返りを書きます。</div>
        <div className="mt-4 h-px bg-gradient-to-r from-[#7500C0] via-[#A100FF] to-transparent" />
      </div>

      {/* 入力フォーム */}
      <div className="bg-white border border-stone-200 p-6 mb-8">
        <div className="flex items-center gap-2 mb-5">
          <Calendar size={16} className="text-[#7500C0]" />
          <div className="text-sm font-bold text-stone-800">
            {new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' })}
          </div>
          <div className="text-[10px] text-stone-400 tracking-wider font-mono">/ TODAY</div>
        </div>

        <div className="space-y-4">
          <YWTField
            letter="Y"
            label="やったこと"
            sub="DID"
            value={y}
            onChange={setY}
            placeholder="今日/今週、取り組んだ具体的な活動..."
            color="#A100FF"
          />
          <YWTField
            letter="W"
            label="わかったこと"
            sub="LEARNED"
            value={w}
            onChange={setW}
            placeholder="気づき・学び・発見..."
            color="#7500C0"
          />
          <YWTField
            letter="T"
            label="次にやること"
            sub="TODO"
            value={t}
            onChange={setT}
            placeholder="次のアクション・改善点..."
            color="#460073"
          />

          {/* 感情記録 */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="text-xs font-bold text-stone-700">今日の手応え</div>
              <div className="text-[10px] text-stone-400 tracking-wider font-mono">/ MOOD</div>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {emotionLabels.map((label, idx) => (
                <button
                  key={idx}
                  onClick={() => setEmotion(idx + 1)}
                  className={`py-2 text-xs border transition-all ${
                    emotion === idx + 1
                      ? 'border-[#7500C0] bg-[#F3E8FF] text-[#460073] font-bold'
                      : 'border-stone-200 text-stone-500 hover:border-stone-300'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 保存ボタン */}
        <div className="mt-6 flex items-center justify-end gap-3">
          {savedMessage && (
            <span className="text-xs text-[#7500C0] font-bold">{savedMessage}</span>
          )}
          <button
            onClick={handleSave}
            disabled={saving || (!y.trim() && !w.trim() && !t.trim())}
            className="bg-[#460073] text-white px-6 py-2.5 text-sm font-bold tracking-wider hover:bg-[#7500C0] transition-colors disabled:bg-stone-300 disabled:cursor-not-allowed"
          >
            {saving ? '保存中...' : 'ログを記録'}
          </button>
        </div>
      </div>

      {/* 過去のログ一覧 */}
      <div>
        <div className="text-xs font-bold text-stone-700 tracking-wider mb-4">▼ 過去のログ ({logs.length}件)</div>
        {logs.length === 0 ? (
          <div className="bg-white border border-dashed border-stone-300 p-10 text-center text-sm text-stone-400">
            まだログがありません。最初のリフレクションを書いてみましょう。
          </div>
        ) : (
          <div className="space-y-3">
            {logs.map((log) => (
              <LogItem key={log.key} log={log} onDelete={() => handleDelete(log.key)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function YWTField({ letter, label, sub, value, onChange, placeholder, color }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <div
          className="w-6 h-6 flex items-center justify-center text-white text-xs font-bold"
          style={{ backgroundColor: color }}
        >
          {letter}
        </div>
        <div className="text-xs font-bold text-stone-800">{label}</div>
        <div className="text-[10px] text-stone-400 tracking-wider font-mono">/ {sub}</div>
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        className="w-full px-3 py-2 border border-stone-300 focus:border-[#7500C0] focus:outline-none focus:ring-1 focus:ring-[#7500C0] text-sm resize-none"
        placeholder={placeholder}
      />
    </div>
  );
}

function LogItem({ log, onDelete }) {
  const date = new Date(log.timestamp);
  const emotionEmoji = ['😞', '😕', '😐', '🙂', '😄'][log.emotion - 1] || '😐';
  return (
    <div className="bg-white border border-stone-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">{emotionEmoji}</span>
          <div>
            <div className="text-xs font-bold text-stone-800">
              {date.toLocaleDateString('ja-JP', { year: 'numeric', month: 'short', day: 'numeric' })}
            </div>
            <div className="text-[10px] text-stone-400 tracking-wider">
              {date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </div>
        <button onClick={onDelete} className="text-stone-300 hover:text-red-500 transition-colors">
          <Trash2 size={14} />
        </button>
      </div>

      <div className="space-y-2 text-xs">
        {log.y && (
          <div className="flex gap-2">
            <div className="w-5 h-5 bg-[#A100FF] text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0">Y</div>
            <div className="text-stone-700 whitespace-pre-wrap leading-relaxed">{log.y}</div>
          </div>
        )}
        {log.w && (
          <div className="flex gap-2">
            <div className="w-5 h-5 bg-[#7500C0] text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0">W</div>
            <div className="text-stone-700 whitespace-pre-wrap leading-relaxed">{log.w}</div>
          </div>
        )}
        {log.t && (
          <div className="flex gap-2">
            <div className="w-5 h-5 bg-[#460073] text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0">T</div>
            <div className="text-stone-700 whitespace-pre-wrap leading-relaxed">{log.t}</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ==========================================
// ポートフォリオ画面
// ==========================================
function PortfolioScreen({ user }) {
  const [items, setItems] = useState([]);
  const [title, setTitle] = useState('');
  const [type, setType] = useState('document');
  const [link, setLink] = useState('');
  const [memo, setMemo] = useState('');
  const [relatedAxis, setRelatedAxis] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState('');

  const loadItems = async () => {
    try {
      const res = await window.storage.list(`portfolio:${user.studentId}:`);
      if (res && res.keys) {
        const sorted = res.keys.sort().reverse();
        const loaded = [];
        for (const k of sorted) {
          try {
            const r = await window.storage.get(k);
            if (r && r.value) {
              loaded.push({ key: k, ...JSON.parse(r.value) });
            }
          } catch {}
        }
        setItems(loaded);
      }
    } catch (e) {
      console.log('Portfolio load:', e);
    }
  };

  useEffect(() => {
    loadItems();
  }, [user.studentId]);

  const handleSave = async () => {
    if (!title.trim()) return;
    setSaving(true);
    const key = `portfolio:${user.studentId}:${Date.now()}`;
    const data = {
      userId: user.studentId,
      userName: user.name,
      timestamp: new Date().toISOString(),
      title, type, link, memo, relatedAxis,
    };
    try {
      await window.storage.set(key, JSON.stringify(data));
      setTitle(''); setType('document'); setLink(''); setMemo(''); setRelatedAxis('');
      setShowForm(false);
      setSavedMessage('保存しました');
      setTimeout(() => setSavedMessage(''), 2500);
      await loadItems();
    } catch (e) {
      setSavedMessage('保存に失敗しました');
    }
    setSaving(false);
  };

  const handleDelete = async (key) => {
    if (!confirm('この成果物を削除しますか？')) return;
    try {
      await window.storage.delete(key);
      await loadItems();
    } catch (e) {
      console.error(e);
    }
  };

  const typeOptions = [
    { value: 'document', label: '資料・レポート', icon: BookOpen },
    { value: 'code', label: 'コード', icon: PenLine },
    { value: 'presentation', label: 'プレゼン', icon: MessageSquare },
    { value: 'other', label: 'その他', icon: Award },
  ];

  return (
    <div>
      <div className="mb-8 flex items-end justify-between">
        <div>
          <div className="text-[10px] tracking-[0.3em] text-stone-500 mb-2 font-mono">PORTFOLIO / WORKS</div>
          <h1 className="text-3xl font-bold text-stone-800 mb-1">ポートフォリオ</h1>
          <div className="text-sm text-stone-500">プロジェクトで作った成果物を蓄積します。</div>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="bg-[#460073] text-white px-5 py-2.5 text-sm font-bold tracking-wider hover:bg-[#7500C0] transition-colors flex items-center gap-2"
          >
            <Plus size={14} strokeWidth={2.5} />
            成果物を追加
          </button>
        )}
      </div>
      <div className="h-px bg-gradient-to-r from-[#460073] via-[#A100FF] to-transparent mb-8" />

      {/* 入力フォーム */}
      {showForm && (
        <div className="bg-white border-2 border-[#7500C0] p-6 mb-8">
          <div className="flex items-center justify-between mb-5">
            <div className="text-sm font-bold text-stone-800">新しい成果物を追加</div>
            <button
              onClick={() => setShowForm(false)}
              className="text-xs text-stone-400 hover:text-stone-600"
            >
              キャンセル
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-2">タイトル *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-stone-300 focus:border-[#7500C0] focus:outline-none focus:ring-1 focus:ring-[#7500C0] text-sm"
                placeholder="例：DX推進プロジェクト 中間提案資料"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-2">種類</label>
              <div className="grid grid-cols-4 gap-2">
                {typeOptions.map((opt) => {
                  const Icon = opt.icon;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => setType(opt.value)}
                      className={`py-2 px-2 text-xs border flex items-center justify-center gap-1.5 transition-all ${
                        type === opt.value
                          ? 'border-[#7500C0] bg-[#F3E8FF] text-[#460073] font-bold'
                          : 'border-stone-200 text-stone-500 hover:border-stone-300'
                      }`}
                    >
                      <Icon size={12} />
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-2">リンク（任意）</label>
              <input
                type="text"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                className="w-full px-3 py-2 border border-stone-300 focus:border-[#7500C0] focus:outline-none focus:ring-1 focus:ring-[#7500C0] text-sm"
                placeholder="https://..."
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-2">関連する評価軸（任意）</label>
              <select
                value={relatedAxis}
                onChange={(e) => setRelatedAxis(e.target.value)}
                className="w-full px-3 py-2 border border-stone-300 focus:border-[#7500C0] focus:outline-none focus:ring-1 focus:ring-[#7500C0] text-sm"
              >
                <option value="">選択しない</option>
                {AXES.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.num} {a.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-2">
                振り返りメモ <span className="text-stone-400 font-normal">なぜそうしたか / 何を学んだか</span>
              </label>
              <textarea
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-stone-300 focus:border-[#7500C0] focus:outline-none focus:ring-1 focus:ring-[#7500C0] text-sm resize-none"
                placeholder="この成果物を作る過程で考えたこと、工夫したこと、学んだこと..."
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              {savedMessage && (
                <span className="text-xs text-[#7500C0] font-bold">{savedMessage}</span>
              )}
              <button
                onClick={handleSave}
                disabled={saving || !title.trim()}
                className="bg-[#460073] text-white px-6 py-2.5 text-sm font-bold tracking-wider hover:bg-[#7500C0] transition-colors disabled:bg-stone-300 disabled:cursor-not-allowed"
              >
                {saving ? '保存中...' : '保存する'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 成果物一覧 */}
      {items.length === 0 ? (
        <div className="bg-white border border-dashed border-stone-300 p-10 text-center">
          <FolderOpen size={32} className="text-stone-300 mx-auto mb-3" strokeWidth={1.5} />
          <div className="text-sm text-stone-400 mb-1">まだ成果物がありません</div>
          <div className="text-xs text-stone-400">プロジェクトで作ったものを蓄積していきましょう</div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {items.map((item) => (
            <PortfolioItem key={item.key} item={item} onDelete={() => handleDelete(item.key)} />
          ))}
        </div>
      )}
    </div>
  );
}

function PortfolioItem({ item, onDelete }) {
  const date = new Date(item.timestamp);
  const axis = AXES.find((a) => a.id == item.relatedAxis);
  const typeLabel = {
    document: '資料・レポート',
    code: 'コード',
    presentation: 'プレゼン',
    other: 'その他',
  }[item.type] || 'その他';

  return (
    <div className="bg-white border border-stone-200 p-5 group">
      <div className="flex items-start justify-between mb-3">
        <div className="text-[10px] tracking-wider text-stone-400 font-mono">{typeLabel.toUpperCase()}</div>
        <button
          onClick={onDelete}
          className="text-stone-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
        >
          <Trash2 size={12} />
        </button>
      </div>

      <div className="text-base font-bold text-stone-800 mb-2 leading-tight">{item.title}</div>

      {item.link && (
        <a
          href={item.link}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-[#7500C0] hover:underline flex items-center gap-1 mb-3"
        >
          リンクを開く <ExternalLink size={10} />
        </a>
      )}

      {axis && (
        <div className="inline-block bg-[#F3E8FF] text-[#460073] text-[10px] font-bold px-2 py-1 mb-3">
          {axis.num} {axis.name}
        </div>
      )}

      {item.memo && (
        <div className="text-xs text-stone-600 leading-relaxed border-t border-stone-100 pt-3 mt-2 whitespace-pre-wrap">
          {item.memo}
        </div>
      )}

      <div className="mt-3 pt-3 border-t border-stone-100 text-[10px] text-stone-400 tracking-wider">
        {date.toLocaleDateString('ja-JP', { year: 'numeric', month: 'short', day: 'numeric' })}
      </div>
    </div>
  );
}
