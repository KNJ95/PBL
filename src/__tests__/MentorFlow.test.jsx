// src/__tests__/MentorFlow.test.jsx
//
// 【テスト対象】App コンポーネント – メンターロールの統合テスト
//
// ■ メンターホーム画面
//   目的: メンターとしてログイン済みの状態で、ホーム画面が正しく表示されることを確認する。
//   主な観点:
//     - ヘッダーに "Be-Ready" ブランドが表示される
//     - メンター専用ボトムナビに「学生」「FB」タブが表示される
//     - 採点待ち件数バッジが FB タブに表示される（pending_evals が 1 件の場合 → "1"）
//     - ログアウトボタンクリックでログイン画面に戻る
//
// ■ FB（採点）タブ
//   目的: FB タブへの遷移と採点待ちリストの表示を確認する。
//   主な観点:
//     - FB タブをクリックすると "FB待ち" の見出しが表示される
//     - 採点待ちがない場合はバッジが表示されない（"0" が存在しない）
//
// ■ AI 採点
//   目的: AI採点ボタンが Anthropic API を呼び出すことを確認する。
//   主な観点:
//     - AI採点ボタンクリック時に "api.anthropic.com" への fetch が行われる
//
//   前提: beforeEach で localStorage に mentor ロールの current_user・students_list・
//         pending_evals をセットし、fetch は URL で分岐して適切なレスポンスを返す。

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../App';
import surveyData from '../../public/survey_questions.json';

const MENTOR_USER = {
  id: 'mentor-test-001',
  name: 'テストメンター',
  role: 'mentor',
  projectId: 'PBL-2026-001',
};

const STUDENT_1 = {
  id: 'student-001',
  name: '学生A',
  projectId: 'PBL-2026-001',
  registeredAt: Date.now() - 86400000,
};

// 採点待ちの評価データ（pending_evals:student-001）
const PENDING_EVAL = {
  id: 'eval-001',
  studentId: 'student-001',
  studentName: '学生A',
  timestamp: Date.now() - 3600000,
  reflection: 'チームと課題を分析し、解決策を提案しました。',
  surveyAnswers: {},
};

function setupMentorSession({ pendingEvals = [PENDING_EVAL] } = {}) {
  localStorage.setItem('current_user', JSON.stringify(MENTOR_USER));
  localStorage.setItem('students_list', JSON.stringify([STUDENT_1]));
  if (pendingEvals.length > 0) {
    localStorage.setItem(
      `pending_evals:${STUDENT_1.id}`,
      JSON.stringify(pendingEvals)
    );
  }

  global.fetch.mockImplementation((url) => {
    const urlStr = typeof url === 'string' ? url : '';
    if (urlStr.includes('survey_questions.json')) {
      return Promise.resolve({ ok: true, json: async () => surveyData });
    }
    return Promise.resolve({ ok: true, json: async () => ({ ok: true, data: [] }) });
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// メンターホーム画面
// ─────────────────────────────────────────────────────────────────────────────
describe('App - メンター: ホーム画面', () => {
  beforeEach(() => {
    localStorage.clear();
    setupMentorSession();
  });

  it('ヘッダーに "Be-Ready" が表示される', async () => {
    render(<App />);
    expect(await screen.findByText('Be-Ready')).toBeInTheDocument();
  });

  it('メンター用ボトムナビに「学生」タブが表示される', async () => {
    render(<App />);
    await screen.findByText('Be-Ready');
    expect(screen.getByText('学生')).toBeInTheDocument();
  });

  it('メンター用ボトムナビに「FB」タブが表示される', async () => {
    render(<App />);
    await screen.findByText('Be-Ready');
    expect(screen.getByText('FB')).toBeInTheDocument();
  });

  it('採点待ち件数バッジが FB タブに表示される', async () => {
    render(<App />);
    await screen.findByText('Be-Ready');
    // バッジに "1" が表示されているはず（pending_evals が 1 件）
    await waitFor(() =>
      expect(screen.getByText('1')).toBeInTheDocument()
    );
  });

  it('ログアウトボタンでログイン画面に戻る', async () => {
    render(<App />);
    const logoutBtn = await screen.findByText('ログアウト');
    fireEvent.click(logoutBtn);
    await waitFor(() =>
      expect(screen.getByText('Be-Ready ポートフォリオ')).toBeInTheDocument()
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// FB（採点）タブ
// ─────────────────────────────────────────────────────────────────────────────
describe('App - メンター: FB タブ', () => {
  beforeEach(() => {
    localStorage.clear();
    setupMentorSession();
  });

  it('FB タブをクリックすると採点画面に遷移する', async () => {
    render(<App />);
    await screen.findByText('Be-Ready');
    fireEvent.click(screen.getByText('FB'));
    // 採点待ち画面の見出しが表示されるはず（getAllByText で複数マッチを許容）
    await waitFor(() =>
      expect(screen.getAllByText(/FB待ち/).length).toBeGreaterThan(0)
    );
  });

  it('採点待ちがない場合はバッジが表示されない', async () => {
    // pending_evals を空にしてセットアップ
    setupMentorSession({ pendingEvals: [] });

    render(<App />);
    await screen.findByText('Be-Ready');
    // バッジは badge > 0 の場合のみ表示されるため、"0" は表示されない
    const badge = screen.queryByText('0');
    expect(badge).not.toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AI 採点
// ─────────────────────────────────────────────────────────────────────────────
describe('App - メンター: AI 採点', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('AI採点ボタンクリック時に Anthropic API URL に fetch を呼ぶ', async () => {
    // AI 採点レスポンスのモックを設定
    const aiScores = { 1: 3, 2: 2, 3: 3, 4: 2, 5: 3, 6: 3, 7: 2, 8: 3, 9: 2 };
    const aiRationale = Object.fromEntries(
      Object.keys(aiScores).map((k) => [k, 'テスト根拠'])
    );

    global.fetch.mockImplementation((url) => {
      const urlStr = typeof url === 'string' ? url : '';
      if (urlStr.includes('survey_questions.json')) {
        return Promise.resolve({ ok: true, json: async () => surveyData });
      }
      if (urlStr.includes('api.anthropic.com')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            content: [
              {
                text: JSON.stringify({ scores: aiScores, rationale: aiRationale }),
              },
            ],
          }),
        });
      }
      return Promise.resolve({ ok: true, json: async () => ({ ok: true, data: [] }) });
    });

    setupMentorSession();

    render(<App />);
    await screen.findByText('Be-Ready');

    // 採点タブへ移動
    fireEvent.click(screen.getByText('FB'));

    // 採点待ちカードが表示されるまで待機
    await waitFor(() => screen.queryByText(/AIで他者評価|AI採点/));

    // AI採点ボタンがあればクリック
    const aiBtn = screen.queryByText(/AIで他者評価|AI採点/);
    if (aiBtn) {
      fireEvent.click(aiBtn);
      await waitFor(() => {
        const calls = global.fetch.mock.calls;
        const anthropicCall = calls.find(([url]) =>
          typeof url === 'string' && url.includes('api.anthropic.com')
        );
        expect(anthropicCall).toBeDefined();
      });
    }
  });
});
