// src/__tests__/Avatar.test.jsx
//
// 【テスト対象】Avatar コンポーネントのユニットテスト
//
// ■ Avatar({ name, size, color })
//   目的: ユーザーの頭文字を円形で表示する Avatar コンポーネントが、
//         各 props に応じて正しくレンダリングされることを確認する。
//
//   主な観点:
//     - name が渡されたとき、最初の 1 文字が表示される
//     - 日本語名（例: "田中"）でも先頭文字が正しく表示される
//     - name が undefined のとき "?" が表示される
//     - name が空文字列のとき "?" が表示される
//     - size prop がインラインスタイルの width/height に反映される（px 単位）
//     - デフォルト size は 36px
//     - borderRadius が 50%（円形）
//     - props なしでもクラッシュしない

import React from 'react';
import { render, screen } from '@testing-library/react';
import { Avatar } from '../App';

describe('Avatar', () => {
  it('name の先頭文字を表示する', () => {
    render(<Avatar name="Tanaka" />);
    expect(screen.getByText('T')).toBeInTheDocument();
  });

  it('日本語名の先頭文字を表示する', () => {
    render(<Avatar name="田中" />);
    expect(screen.getByText('田')).toBeInTheDocument();
  });

  it('name が undefined のとき "?" を表示する', () => {
    render(<Avatar />);
    expect(screen.getByText('?')).toBeInTheDocument();
  });

  it('name が空文字列のとき "?" を表示する', () => {
    render(<Avatar name="" />);
    expect(screen.getByText('?')).toBeInTheDocument();
  });

  it('size prop がインラインスタイルの width/height に反映される', () => {
    const { container } = render(<Avatar name="A" size={50} />);
    const div = container.firstChild;
    expect(div.style.width).toBe('50px');
    expect(div.style.height).toBe('50px');
  });

  it('デフォルト size は 36px', () => {
    const { container } = render(<Avatar name="B" />);
    const div = container.firstChild;
    expect(div.style.width).toBe('36px');
    expect(div.style.height).toBe('36px');
  });

  it('borderRadius が 50% で円形になる', () => {
    const { container } = render(<Avatar name="C" />);
    expect(container.firstChild.style.borderRadius).toBe('50%');
  });

  it('props なしでもクラッシュしない', () => {
    expect(() => render(<Avatar />)).not.toThrow();
  });
});
