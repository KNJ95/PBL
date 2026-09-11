// src/__tests__/LoginScreen.test.jsx
//
// 【テスト対象】App コンポーネント – 未認証状態（ログイン画面）の統合テスト
//
// ■ ログイン画面表示（App が currentUser=null の状態でレンダリング）
//   目的: 未ログイン時に正しいログイン画面が表示されることを確認する。
//   主な観点:
//     - アプリタイトル "Be-Ready ポートフォリオ" が表示される
//     - サブタイトル "Project-Based Learning Portfolio" が表示される
//     - ユーザーID・パスワード・プロジェクトID の入力欄が存在する
//
// ■ ログインボタンの活性化制御
//   目的: バリデーション不足の状態ではログインできないことを確認する。
//   主な観点:
//     - 入力欄が空のとき disabled
//     - ID のみ入力でも disabled のまま
//     - ID とパスワードが揃ったとき enabled になる
//
// ■ ログインエラー
//   目的: 異常系（存在しないID・パスワード不一致・初回ログイン）の
//         フィードバックが正しく表示されることを確認する。
//   主な観点:
//     - fetchUserProfile が null（ok:false）→ "IDが存在しません" エラー文言
//     - パスワードハッシュが不一致 → "パスワードが違います" エラー文言
//     - isFirstLogin=true のユーザー → パスワード変更画面へ遷移する
//
//   モック設定: fetch を URL で分岐させ、
//     survey_questions.json は本物データを返し、
//     Lambda URL はテストシナリオごとに異なるプロファイルを返す。

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';
import surveyData from '../../public/survey_questions.json';

// App レンダリング時に survey_questions.json を fetch するため、
// テスト毎に URL で分岐するモックを設定するヘルパー
function setupFetchMocks({ profileResponse } = {}) {
  global.fetch.mockImplementation((url) => {
    if (typeof url === 'string' && url.includes('survey_questions.json')) {
      return Promise.resolve({
        ok: true,
        json: async () => surveyData,
      });
    }
    if (profileResponse !== undefined) {
      return Promise.resolve({
        ok: true,
        json: async () => profileResponse,
      });
    }
    return Promise.resolve({
      ok: true,
      json: async () => ({ ok: true, data: [] }),
    });
  });
}

describe('App - ログイン画面（未認証）', () => {
  beforeEach(() => {
    localStorage.clear();
    setupFetchMocks();
  });

  it('"Be-Ready ポートフォリオ" 見出しが表示される', async () => {
    render(<App />);
    expect(
      await screen.findByText('Be-Ready ポートフォリオ')
    ).toBeInTheDocument();
  });

  it('"Project-Based Learning Portfolio" サブタイトルが表示される', async () => {
    render(<App />);
    expect(
      await screen.findByText('Project-Based Learning Portfolio')
    ).toBeInTheDocument();
  });

  it('ユーザーID 入力欄が表示される', async () => {
    render(<App />);
    expect(
      await screen.findByPlaceholderText('配布されたIDを入力')
    ).toBeInTheDocument();
  });

  it('パスワード入力欄が表示される', async () => {
    render(<App />);
    expect(
      await screen.findByPlaceholderText('パスワードを入力')
    ).toBeInTheDocument();
  });

  it('プロジェクトID 入力欄が表示される', async () => {
    render(<App />);
    expect(
      await screen.findByPlaceholderText('例：PBL-2026-001')
    ).toBeInTheDocument();
  });

  it('入力欄が空のときログインボタンが disabled', async () => {
    render(<App />);
    const loginBtn = await screen.findByRole('button', { name: /ログイン/ });
    expect(loginBtn).toBeDisabled();
  });

  it('IDのみ入力してもログインボタンが disabled のまま', async () => {
    render(<App />);
    const idInput = await screen.findByPlaceholderText('配布されたIDを入力');
    await userEvent.type(idInput, 'user001');
    const loginBtn = screen.getByRole('button', { name: /ログイン/ });
    expect(loginBtn).toBeDisabled();
  });

  it('ID とパスワードを両方入力するとログインボタンが enabled になる', async () => {
    render(<App />);
    const idInput = await screen.findByPlaceholderText('配布されたIDを入力');
    const pwInput = screen.getByPlaceholderText('パスワードを入力');

    await userEvent.type(idInput, 'user001');
    await userEvent.type(pwInput, 'password123');

    const loginBtn = screen.getByRole('button', { name: /ログイン/ });
    expect(loginBtn).not.toBeDisabled();
  });
});

describe('App - ログインエラー', () => {
  it('存在しないユーザーIDの場合 "IDが存在しません" エラーを表示する', async () => {
    // fetchUserProfile が null（ok: false）を返すよう設定
    global.fetch.mockImplementation((url) => {
      if (typeof url === 'string' && url.includes('survey_questions.json')) {
        return Promise.resolve({ ok: true, json: async () => surveyData });
      }
      // Lambda: user_profile → ok:false
      return Promise.resolve({
        ok: true,
        json: async () => ({ ok: false }),
      });
    });

    render(<App />);
    const idInput = await screen.findByPlaceholderText('配布されたIDを入力');
    const pwInput = screen.getByPlaceholderText('パスワードを入力');

    await userEvent.type(idInput, 'nonexistent-user');
    await userEvent.type(pwInput, 'anypassword');
    fireEvent.click(screen.getByRole('button', { name: /ログイン/ }));

    await waitFor(() =>
      expect(
        screen.getByText('IDが存在しません。管理者に確認してください。')
      ).toBeInTheDocument()
    );
  });

  it('パスワードが一致しない場合 "パスワードが違います" エラーを表示する', async () => {
    // passwordHash が "wronghash" のプロファイルを返す
    // hashPassword モックは 64 文字のゼロ文字列を返すので不一致になる
    global.fetch.mockImplementation((url) => {
      if (typeof url === 'string' && url.includes('survey_questions.json')) {
        return Promise.resolve({ ok: true, json: async () => surveyData });
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({
          ok: true,
          data: {
            payload: JSON.stringify({
              name: 'テストユーザー',
              role: 'student',
              projectId: 'PBL-001',
              passwordHash: 'wrong_hash_that_wont_match',
              isFirstLogin: false,
            }),
          },
        }),
      });
    });

    render(<App />);
    const idInput = await screen.findByPlaceholderText('配布されたIDを入力');
    const pwInput = screen.getByPlaceholderText('パスワードを入力');

    await userEvent.type(idInput, 'existing-user');
    await userEvent.type(pwInput, 'wrongpassword');
    fireEvent.click(screen.getByRole('button', { name: /ログイン/ }));

    await waitFor(() =>
      expect(screen.getByText('パスワードが違います。')).toBeInTheDocument()
    );
  });

  it('isFirstLogin=true の場合はパスワード変更画面に遷移する', async () => {
    // passwordHash がモックの hash（64 個の '0'）と一致する initialPasswordHash を使用
    const mockHash = '0'.repeat(64);
    global.fetch.mockImplementation((url) => {
      if (typeof url === 'string' && url.includes('survey_questions.json')) {
        return Promise.resolve({ ok: true, json: async () => surveyData });
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({
          ok: true,
          data: {
            payload: JSON.stringify({
              name: '新規ユーザー',
              role: 'student',
              projectId: 'PBL-001',
              passwordHash: mockHash,
              isFirstLogin: true,
            }),
          },
        }),
      });
    });

    render(<App />);
    const idInput = await screen.findByPlaceholderText('配布されたIDを入力');
    const pwInput = screen.getByPlaceholderText('パスワードを入力');

    await userEvent.type(idInput, 'first-login-user');
    await userEvent.type(pwInput, 'initialpassword');
    fireEvent.click(screen.getByRole('button', { name: /ログイン/ }));

    // changePassword 画面に「新しいパスワードを設定してください」が表示されるはず
    await waitFor(() =>
      expect(
        screen.getByText('初回ログインのため、新しいパスワードを設定してください')
      ).toBeInTheDocument()
    );
  });
});
