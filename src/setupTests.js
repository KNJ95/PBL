// src/setupTests.js  — CRA が自動で setupFilesAfterFramework として読み込む
import '@testing-library/jest-dom';

// ─── TextEncoder / TextDecoder ポリフィル（Node.js の jsdom 環境で不足する場合） ──
const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// ─── fetch モック（Lambda URL / Anthropic API） ──────────────────────────────
global.fetch = jest.fn();

// ─── Web Crypto モック（hashPassword が使用） ─────────────────────────────────
// jsdom は crypto.subtle を実装しないため 32 バイトの固定バッファを返す
const mockDigest = jest.fn().mockResolvedValue(new ArrayBuffer(32));
Object.defineProperty(global, 'crypto', {
  value: { subtle: { digest: mockDigest } },
  writable: true,
});

// ─── recharts / jsdom 非対応 API スタブ ──────────────────────────────────────
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// ─── テスト間リセット ─────────────────────────────────────────────────────────
beforeEach(() => {
  localStorage.clear();
  jest.clearAllMocks(); // calls/instances をリセット（実装は保持されるはずだが念のため再設定）

  // crypto mock を再設定（clearAllMocks が mockResolvedValue をクリアする場合の保険）
  global.crypto.subtle.digest.mockResolvedValue(new ArrayBuffer(32));

  // デフォルト: fetch は空の成功レスポンスを返す
  // テスト個別に mockResolvedValueOnce で上書き可能
  global.fetch.mockResolvedValue({
    ok: true,
    json: async () => ({ ok: true, data: [] }),
  });
});
