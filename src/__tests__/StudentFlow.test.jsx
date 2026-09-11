// src/__tests__/StudentFlow.test.jsx
//
// 【テスト対象】App コンポーネント – 学生ロールの統合テスト
//
// ■ ホーム画面
//   目的: 学生としてログイン済みの状態で、ホーム画面が正しく表示されることを確認する。
//   主な観点:
//     - ヘッダーに "Be-Ready" ブランドが表示される
//     - プロジェクトID がヘッダーに表示される
//     - ボトムナビに「ホーム」「ログ」「振り返り」「FB」タブが存在する
//     - ログアウトボタンクリックでログイン画面に戻り、localStorage から current_user が削除される
//
// ■ ボトムナビゲーション
//   目的: 各タブをクリックしたときに対応する画面へ遷移することを確認する。
//   主な観点:
//     - 「ログ」タブ → 活動ログ画面（"活動ログ" の見出しが表示）
//     - 「振り返り」タブ → 振り返り画面（"振り返りアンケート" の見出しが表示）
//
// ■ 活動ログ入力
//   目的: 活動ログ画面で入力フォームが正常に動作することを確認する。
//   主な観点:
//     - 活動タイトルの入力ラベルが表示される
//     - 活動タイトル入力欄（placeholder で特定）に文字を入力できる
//
//   前提: beforeEach で localStorage に student ロールの current_user をセットし、
//         survey_questions.json は本物データを fetch モックから返す。

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import App from '../App';
import { storage } from '../App';
import surveyData from '../../public/survey_questions.json';

const STUDENT_USER = {
  id: 'student-test-001',
  name: '田中テスト',
  role: 'student',
  projectId: 'PBL-2026-001',
};

function setupStudentSession() {
  localStorage.setItem('current_user', JSON.stringify(STUDENT_USER));
  global.fetch.mockImplementation((url) => {
    if (typeof url === 'string' && url.includes('survey_questions.json')) {
      return Promise.resolve({ ok: true, json: async () => surveyData });
    }
    return Promise.resolve({ ok: true, json: async () => ({ ok: true, data: [] }) });
  });
}

// App マウント時に storage.setUser が呼ばれ _cloudUid が設定されるため、
// テスト間で状態が漏れないよう afterEach でリセットする
afterEach(() => {
  storage.clearUser();
});

// ─────────────────────────────────────────────────────────────────────────────
// ホーム画面
// ─────────────────────────────────────────────────────────────────────────────
describe('App - 学生: ホーム画面', () => {
  beforeEach(() => {
    localStorage.clear();
    setupStudentSession();
  });

  it('ヘッダーに "Be-Ready" ブランドテキストが表示される', async () => {
    render(<App />);
    expect(await screen.findByText('Be-Ready')).toBeInTheDocument();
  });

  it('プロジェクトID がヘッダーに表示される', async () => {
    render(<App />);
    await screen.findByText('Be-Ready');
    // 複数箇所に表示される可能性があるため getAllByText を使用
    const matches = screen.getAllByText(/PBL-2026-001/);
    expect(matches.length).toBeGreaterThan(0);
  });

  it('ボトムナビに「ホーム」「ログ」「FB」タブが表示される', async () => {
    render(<App />);
    await screen.findByText('Be-Ready');
    expect(screen.getByText('ホーム')).toBeInTheDocument();
    expect(screen.getByText('ログ')).toBeInTheDocument();
    expect(screen.getByText('FB')).toBeInTheDocument();
  });

  it('ボトムナビに「振り返り」タブが存在する', async () => {
    render(<App />);
    await screen.findByText('Be-Ready');
    // ボトムナビの「振り返り」スパンテキストが存在することを確認
    // （ホーム画面上の複数の「振り返り」テキストを許容して getAllByText で確認）
    const items = screen.getAllByText('振り返り');
    expect(items.length).toBeGreaterThan(0);
  });

  it('ログアウトボタンをクリックするとログイン画面に戻る', async () => {
    render(<App />);
    const logoutBtn = await screen.findByText('ログアウト');

    // 状態更新を act でラップ
    await act(async () => {
      fireEvent.click(logoutBtn);
    });

    // ログイン画面の見出しが表示されること
    expect(screen.getByText('Be-Ready ポートフォリオ')).toBeInTheDocument();
    // current_user が localStorage から消えていること
    expect(localStorage.getItem('current_user')).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// ナビゲーション
// ─────────────────────────────────────────────────────────────────────────────
describe('App - 学生: ボトムナビゲーション', () => {
  beforeEach(() => {
    localStorage.clear();
    setupStudentSession();
  });

  it('「ログ」タブをクリックするとログ記録画面に遷移する', async () => {
    render(<App />);
    await screen.findByText('Be-Ready');
    fireEvent.click(screen.getByText('ログ'));
    await waitFor(() =>
      expect(screen.getByText('活動ログ')).toBeInTheDocument()
    );
  });

  it('「振り返り」タブをクリックすると振り返り画面に遷移する', async () => {
    render(<App />);
    await screen.findByText('Be-Ready');
    // ボトムナビの「振り返り」スパンを取得し、その親ボタンをクリック
    // getAllByText('振り返り') で見つかった最後の要素が nav span のはず
    const navSpans = screen.getAllByText('振り返り');
    const navSpan = navSpans[navSpans.length - 1]; // ボトムナビは末尾
    fireEvent.click(navSpan.closest('button') || navSpan);
    // 振り返り画面固有の見出しが表示されること
    await waitFor(() =>
      expect(screen.getByText('振り返りアンケート')).toBeInTheDocument()
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 活動ログ入力
// ─────────────────────────────────────────────────────────────────────────────
describe('App - 学生: 活動ログ入力', () => {
  beforeEach(() => {
    localStorage.clear();
    setupStudentSession();
  });

  it('ログ画面に「活動タイトル」ラベルが表示される', async () => {
    render(<App />);
    await screen.findByText('Be-Ready');
    fireEvent.click(screen.getByText('ログ'));
    await waitFor(() =>
      expect(screen.getByText(/何の活動のログですか/)).toBeInTheDocument()
    );
  });

  it('活動タイトル入力欄に文字を入力できる', async () => {
    render(<App />);
    await screen.findByText('Be-Ready');
    fireEvent.click(screen.getByText('ログ'));

    // 活動タイトル入力欄（placeholder で特定）
    const titleInput = await screen.findByPlaceholderText(
      /チームミーティング、現場視察/
    );
    fireEvent.change(titleInput, { target: { value: 'チームミーティング' } });
    expect(titleInput.value).toContain('チームミーティング');
  });
});
