# Be-Ready 評価 POC アプリ

北海学園大学 佐藤教授との共同プロジェクト「Be-Ready人材育成プログラム」における評価軸の実証実験（POC）用 Web アプリ。

**コンセプト**: 振り返り（自己評価）＋ ログ（自主活動記録）の2要素で Be-Ready 人材の9つの力を記録・可視化し、メンターがフィードバック（FB）を通じて学生の成長を支援する。

---

## 目次

1. [プロダクト概要](#1-プロダクト概要)
2. [技術スタック・ファイル構成](#2-技術スタックファイル構成)
3. [データモデル](#3-データモデル)
4. [機能一覧](#4-機能一覧)
5. [デプロイ手順](#5-デプロイ手順)
6. [ユーザー管理手順](#6-ユーザー管理手順)
7. [設計上の判断](#7-設計上の判断)
8. [バージョン履歴・今後の課題](#8-バージョン履歴今後の課題)
9. [関連システム](#9-関連システム)
10. [テスト](#10-テスト)

---

## 1. プロダクト概要

**作成日**: 2026年5月26日  
**最終更新**: 2026年9月10日（v1.9 — 15問×9軸マッピング改善・axisWeights最適化）  
**バージョン**: v1.9（POC）  
**対象ユーザー**: 学生 / メンター  
**URL**: https://fawn-six.vercel.app

### 1.1 背景

座学教育との差別化を目的に、企業が「即戦力かどうか」を判断できる評価軸（9項目）を定義。その評価軸を実際に運用・検証するための POC ツールとして開発。

### 1.2 活動の2要素

| 要素 | タイミング | 目的 |
|---|---|---|
| **振り返り** | PBL公式活動の終了後 | 9軸の自己評価データを取得してメンターへ提出 → FBを受けてレーダーチャートに反映 |
| **ログ** | 自主活動時（随時） | 9軸に対応した9問のスライダー（1〜10）で活動を手軽に記録 |

### 1.3 評価軸9項目（0626ルーブリック準拠）

| 番号 | 軸名 | 評価すること | 分類 |
|---|---|---|---|
| ① | 課題設定力 | 仕事について自分の視点からその価値・意味を理解しているか | A：思考・判断系 |
| ② | 情報活用力 | 必要な情報を収集・整理し、意思決定や行動に活かせるか | A：思考・判断系 |
| ③ | 不確実性への耐性 | 不確実性の高い仕事でも粘り強くかつ柔軟に取り組めるか | A：思考・判断系 |
| ④ | 提案・発信力 | やるべき・やりたいと考えることを他者に伝えられるか | B：行動・実行系 |
| ⑤ | 実行・改善力 | 他でもない自分のこととして粘り強く関われるか | B：行動・実行系 |
| ⑥ | オーナーシップ | やりたいと思っているか、意味を自分なりに理解できているか | B：行動・実行系 |
| ⑦ | 協働・調整力 | 他者の意見を取り入れつつ柔軟に対応できるか | C：関係・姿勢系 |
| ⑧ | 自律・内発的動機 | 自分なりの理由・動機を持ってやりたいと語れるか | C：関係・姿勢系 |
| ⑨ | 行動変容力 | フィードバックを行動の変化につなげられるか | C：関係・姿勢系 |

### 1.4 評価レベル（4分類・0626ルーブリック準拠）

| Lv | 名称 | 定義 |
|---|---|---|
| Lv.1 | 受動性 | 傍観者的にただ知っているだけの状態 |
| Lv.2 | 能動性 | 他者の立場に立てば確かにそう思える状態 |
| Lv.3 | 自律性 | 自分の視点から見て確かにそう思える状態 |
| Lv.4 | 創造性 | 自らの行為・経験から新たにやりたい・やるべきことを見つけ出している状態 |

---

## 2. 技術スタック・ファイル構成

### 2.1 技術スタック

| カテゴリ | 採用技術 | 補足 |
|---|---|---|
| 言語 | JavaScript (ES2022) | TypeScript 不採用（POC の軽量さ重視） |
| UI | React 18（関数コンポーネント + Hooks） | useState / useEffect / useMemo |
| スタイリング | インラインスタイル | カラー定数 `C` オブジェクトで一元管理。ダーク／ライトテーマ対応 |
| グラフ | recharts | RadarChart（9軸レーダー）|
| アイコン | lucide-react | 軽量な SVG アイコンセット |
| データ永続化 | `localStorage` + DynamoDB 二重書き込み | localStorage をキャッシュとしつつ、バックグラウンドでクラウド同期 |
| バックエンド | AWS Lambda (Node.js 22) + Function URL | API Gateway 不要・サーバーレス |
| DB | Amazon DynamoDB | BeReadyUsers（認証）/ BeReadyData（アプリデータ）の2テーブル |
| 認証 | SHA-256 パスワードハッシュ（Web Crypto API） | 初回ログイン時にパスワード変更必須 |
| ホスティング | Vercel + GitHub | `react-scripts` ベース、自動デプロイ |

### 2.2 ファイル構成

```
PBL/
├── src/
│   ├── App.jsx                  ← メインアプリ（全 UI・ロジックを1ファイルに集約）
│   └── index.js
├── public/
│   ├── index.html
│   └── survey_questions.json    ← 振り返りアンケート設問定義（15問・軸ごとのaxisWeights）
├── lambda/
│   └── index.js                 ← Lambda 関数（DynamoDB GET/POST/DELETE + Gemini AI stub）
├── tools/
│   ├── import_users.py          ← CSV → BeReadyUsers 一括インポート
│   ├── generate_passwords.py    ← ランダムパスワード生成
│   ├── patch_add_initial_hash.py← 既存レコードに initialPasswordHash を追加
│   └── cleanup_user_profiles.py ← BeReadyData から user_profile を削除（移行用）
├── 議事録/
│   ├── TODO.md                  ← 機能開発TODO（議事録日付・カテゴリ・完了済みセクション付き）
│   └── *.md                     ← 打合せ議事録
├── AWS構築.md
├── package.json
└── README.md
```

> `tools/*.csv` および `*.zip` は `.gitignore` で除外（機密情報のため）。

### 2.3 主要定数（App.jsx 冒頭）

| 定数 | 内容 |
|---|---|
| `AXES` | 9評価軸の定義（id / name / short / evalText / ref フラグ） |
| `LEVELS` | 4評価レベル（lv / name / color / def） |
| `RUBRIC_DATA` | 9軸 × Lv1〜4 のルーブリックテキスト（②⑧は `levels: null` で「基準未確定」表示） |
| `REFLECTION_QUESTIONS` | ログ用9問（各軸に1問ずつ対応） |
| `STUDENT_TUTORIAL_STEPS` | 学生チュートリアル5ステップ定義 |
| `MENTOR_TUTORIAL_STEPS` | メンターチュートリアル3ステップ定義 |

---

## 3. データモデル

### 3.1 DynamoDB テーブル構成

| テーブル | 用途 | PK | SK |
|---|---|---|---|
| `BeReadyUsers` | ユーザー認証情報 | `userId` | `dataKey`（= `"user_profile"`） |
| `BeReadyData` | アプリデータ（評価・振り返り・ログなど） | `userId` | `dataKey` |

Lambda が `dataKey === "user_profile"` かどうかで自動的にテーブルを振り分ける。

### 3.2 ユーザープロファイル（BeReadyUsers）

```js
{
  name:                string,    // 氏名（初回ログイン時にユーザーが入力）
  role:                'student' | 'mentor',
  projectId:           string,    // 例: "PBL-2026-001"
  passwordHash:        string,    // SHA-256（現在のパスワード）
  initialPasswordHash: string,    // SHA-256（初期パスワード・自己リセット用）
  isFirstLogin:        boolean,   // true → 初回ログイン時にパスワード変更画面へ遷移
}
```

### 3.3 BeReadyData — ストレージキー一覧

| キー | 書き込み者 | 内容 |
|---|---|---|
| `students_list` | 学生（ログイン時自動） | 登録済み学生一覧 `[{ id, name, projectId, registeredAt }]` |
| `current_user` | ログイン処理 | セッション中のユーザー情報（localStorage のみ） |
| `pending_evals:{studentId}` | 学生（振り返り提出時） | 未FB振り返り一覧（配列） |
| `mentor_survey:{studentId}:{ts}` | メンター（FB確定時） | メンターFB評価データ |
| `mentor_done_ids` | メンター（FB確定時） | FB完了済みの pending ID 一覧（メンター localStorage） |
| `log:{userId}:{ts}` | 学生（ログ保存時） | 自主活動ログ |
| `survey:{userId}:{ts}` | （予約・現在未使用） | 将来の承認済み評価保存用 |
| `project_info:{userId}` | 学生（プロジェクト情報保存時） | プロジェクト名・概要 |
| `tutorial_seen` | ログイン後・チュートリアル完了時 | チュートリアル初回表示制御フラグ |
| `feedback_widget:{userId}:{ts}` | 学生（フィードバック送信時） | アプリへのフィードバックコメント |

### 3.4 振り返り提出データ（pending_evals の各エントリ）

```js
{
  id:          string,   // "pe" + タイムスタンプ
  studentId:   string,
  date:        string,   // "YYYY-MM-DD"（学生が入力した活動日）
  stage:       '初回' | '通常' | '中間' | '最終',  // v1.8追加
  reflection:  string,   // テキストサマリー（メンターが読む用）
  mode:        'survey_json',
  answers:     { [questionId]: number },  // 各問いへの回答値（1〜4）
  axes:        { [axisId]: number },      // calcAxesFromAnswers で算出（1〜4）
  drillAnswers:{ [questionId]: { d1, d2choice, d2text } },
  nextAction:  string,
  status:      'pending',
}
```

### 3.5 メンターFBデータ（mentor_survey）

```js
{
  studentId:   string,
  mentorId:    string,
  timestamp:   number,
  axes:        { [axisId]: number },  // メンターが付けた Lv1〜4
  note:        string,                // FBコメント（任意）
  reflection:  string,                // 提出時の振り返りテキスト（コピー）
  uncertain:   { [axisId]: boolean }, // 判定に迷った軸フラグ（#14）
  aiSuggested: object | null,
}
```

### 3.6 活動ログデータ（log）

```js
{
  userId:    string,
  timestamp: number,
  title:     string,   // 活動タイトル
  date:      string,   // "YYYY-MM-DD"
  answers:   { [questionId]: number },  // 9軸各1〜10のスライダー値
  memo:      string,   // 任意メモ
  photo:     string,   // Base64画像（任意）
}
```

---

## 4. 機能一覧

### 4.1 ロール別画面構成

#### 学生（role: 'student'）— 4タブ構成

| タブ | 画面名 | 用途 | 主な機能 |
|---|---|---|---|
| 🏠 ホーム | ホーム | 常時 | 成長比較レーダーチャート（初回 vs 最新）・プロジェクト情報・統計カード（ログ/振り返り/FB待ち）・クイックアクション |
| 📖 ログ | 活動ログ | 自主活動後随時 | 9問スライダー（1〜10）で活動を記録。メモ・写真添付可。提出先なし（自分の記録） |
| 📝 振り返り | 振り返り | PBL公式活動後 | 15問アンケート（Lv1〜4選択式 + 深堀り2問）を提出。ステージ（初回/通常/中間/最終）を選択してメンターへ送信 |
| 👍 FB | フィードバック | 随時確認 | メンターからのFBレーダーチャート・コメント・問いへの回答 |

> **ホーム画面の比較チャート**: `stage === "初回"` の提出（なければ最古の提出）を「初回」、最新の提出を「最新」として2チャートを横並び表示。提出が1件のみの場合は単一チャート表示。

#### メンター（role: 'mentor'）— 2タブ構成

| タブ | 画面名 | 主な機能 |
|---|---|---|
| 👥 学生 | 学生一覧 | 担当学生カード一覧（同一projectIdのみ）・学生選択でレーダーチャート/活動ログ/FB履歴を確認 |
| ✅ FB | FB（フィードバック） | 学生フィルタタブ（全員/学生個別）・振り返り内容確認・9軸Lv1〜4でFB・ルーブリックポップアップ参照 |

### 4.2 振り返りアンケートの流れ

```
振り返りタブ開く
  └─ [target フェーズ]
       振り返り対象（テキスト入力）
       振り返り日（日付入力）
       ステージ選択（初回 / 通常 / 中間 / 最終）
       「開始する」→
  └─ [survey フェーズ]
       設問1問ずつ表示（survey_questions.json 定義の15問）
       各問: 主回答（Lv1〜4）→ 深堀りQ1（状況選択）→ 深堀りQ2（ネクストアクション）
       最終問回答後 →「提出する」→
  └─ [done フェーズ]
       「提出しました！」完了画面
       → pending_evals:{studentId} に保存（axes計算済み・stage付き）
```

### 4.3 メンターFBの流れ

```
FBタブ → 学生フィルタタブで絞り込み（任意）
  → 「FBする」ボタン → 振り返り内容確認（全回答トグル表示）
  → 9軸 × Lv1〜4 でスコア入力（判定迷いフラグ付き）
  → コメント入力（任意）
  → 「他者評価を確定・承認する」
    → mentor_survey:{studentId}:{ts} 保存
    → mentor_done_ids に pending.id を追加
```

### 4.4 ログ画面の構成

```
ログタブ → 活動タイトル入力 → 活動日入力
  → 9問スライダー（各1〜10）回答
       ※ 軸ラベルなし・質問文のみ表示（シンプル化）
  → メモ入力（任意）→ 写真添付（任意）
  → 「記録を保存する」→ log:{userId}:{ts} に保存
```

9問の質問文（`REFLECTION_QUESTIONS`）は各評価軸に対応している（軸名は画面表示せず）。

### 4.5 ホーム画面の構成

1. **プロジェクト情報カード**: プロジェクト名・概要を入力・保存。「詳細」ボタン→プロジェクト詳細画面（戻るボタン付き）
2. **挨拶 + 日付**
3. **成長比較レーダーチャート**（または単一チャート・未提出時のCTA）
4. **統計カード 3点**: ログ記録件数 / 振り返り件数 / FB待ち件数
5. **FB待ち通知**: 未FB件数の案内（`mentor_done_ids` で承認済み分を除外した正確な件数）
6. **クイックアクション**: 活動を記録（ログ）/ 振り返り提出

### 4.6 軸スコアの算出ロジック（calcAxesFromAnswers）

```js
// survey_questions.json の axisWeights（各問いが複数軸に寄与）を使用
// 例: 問いQが axes 1 に weight 0.8, axes 3 に weight 0.2 で寄与する場合
axes[1] += answer[Q.id] * 0.8
axes[3] += answer[Q.id] * 0.2
// 各軸の累積重みで割って加重平均 → 四捨五入で Lv1〜4 に丸める
```

### 4.7 15問 × 9軸 マッピング（survey_questions.json v1.1.0）

各問いが寄与する軸と重みの一覧。太字は主担当（weight ≥ 0.6）。

| 問 | セクション | 質問の要旨 | 寄与する軸（weight） |
|---|---|---|---|
| Q01 | 取り組みのはじまり | 問題を自分なりに考えたか | **①課題設定力 0.9** |
| Q02 | 〃 | なぜやるか自分の言葉で言えたか | **⑧動機 0.9** / ⑥責任 0.4 / ①課題 0.4 |
| Q03 | 〃 | 不安な場面でどうしたか | **③不確実 0.9** / ⑥責任 0.3 |
| Q04 | 情報の集め方 | 情報をどう集めたか | **②情報 0.7 / ①課題 0.6** |
| Q05 | 〃 | 情報を相手向けにまとめたか | ②情報 0.6 / ④提案 0.6 |
| Q06 | 意見を出す | 意見・提案を出したか | **④提案 0.9** / ⑦協働 0.3 |
| Q07 | 〃 | 反対意見への対応 | ③不確実 0.5 / ④提案 0.4 / ⑦協働 0.4 |
| Q08 | 動く・やり遂げる | 最後までやり切ったか | **⑤実行 0.7** / ⑥責任 0.6 |
| Q09 | 〃 | やり方を変えて改善したか | **⑤実行 0.7** / ⑨変容 0.6 |
| Q10 | 〃 | 「自分がやらなければ」の感覚 | **⑥責任 0.9** / ⑧動機 0.3 |
| Q11 | チームの動き方 | 意見が分かれたときの動き | **⑦協働 0.9** / ④提案 0.3 |
| Q12 | 〃 | 困っているメンバーへの関わり | **⑦協働 0.8** / ⑥責任 0.3 |
| Q13 | 自分の変化 | FBで行動が変わったか | **⑨変容 0.9** / ⑤実行 0.3 |
| Q14 | 〃 | 成長したと感じる点があったか | **⑨変容 0.7** / ⑧動機 0.2 |
| Q15 | 〃 | もっとやりたいと思う瞬間 | **⑧動機 0.9** / ③不確実 0.2 |

**軸ごとの主担当問い**

| 軸 | 主担当（weight≥0.6） | 副担当 |
|---|---|---|
| ①課題設定力 | Q01(0.9), Q04(0.6) | Q02(0.4) |
| ②情報活用力 | Q04(0.7) | Q05(0.6) |
| ③不確実性への耐性 | Q03(0.9) | Q07(0.5), Q15(0.2) |
| ④提案・発信力 | Q06(0.9) | Q05(0.6), Q07(0.4), Q11(0.3) |
| ⑤実行・改善力 | Q08(0.7), Q09(0.7) | Q13(0.3) |
| ⑥オーナーシップ | Q10(0.9), Q08(0.6) | Q02(0.4), Q03(0.3), Q12(0.3) |
| ⑦協働・調整力 | Q11(0.9), Q12(0.8) | Q07(0.4), Q06(0.3) |
| ⑧自律・内発的動機 | Q02(0.9), Q15(0.9) | Q10(0.3), Q14(0.2) |
| ⑨行動変容力 | Q13(0.9), Q14(0.7) | Q09(0.6) |

> **v1.1.0 変更点（2026-09-10）**: ①課題設定力の設問カバレッジ強化（Q02に①0.4追加、Q04の①を0.3→0.6に増加）、⑧自律・内発的動機の分散を縮小（Q01・Q03から⑧を削除、Q14の⑧を0.5→0.2に縮小）

### 4.7 チュートリアル機能

初回ログイン時に自動表示。ヘッダーの「チュートリアル」ボタンで再表示可能。

| ロール | ステップ数 | 内容 |
|---|---|---|
| 学生 | 5ステップ | ウェルカム / ホーム / ログ / 振り返り / FB |
| メンター | 3ステップ | ウェルカム / 学生タブ / FBタブ |

`localStorage` の `tutorial_seen` フラグで初回表示を制御。

### 4.8 ルーブリックポップアップ

メンターFB画面で各評価軸名をタップすると表示。`RUBRIC_DATA[id].levels` に評価テキスト配列を定義。②⑧は `levels: null` のため「詳細な採点基準は未確定です」と表示。

### 4.9 AIサービス（スタブ）

振り返りFB画面に「AI提案」機能の UI のみ実装。現在 AI API は未接続のため、呼び出し時は「AIサービスは現在使用できません」のメッセージを表示。

---

## 5. デプロイ手順

### 前提

- Node.js 14 以上（`react-scripts 5` の要件）
- npm 6 以上

### Step 1: 依存関係のインストール

```bash
npm install
```

### Step 2: ローカル起動

```bash
npm start
```

ブラウザで `http://localhost:3000` を開く。

### Step 3: ビルド

```bash
npm run build
```

`build/` ディレクトリに静的ファイルが生成される。

### Step 4: Vercel へデプロイ

GitHub の `main` ブランチへ push すると Vercel が自動デプロイ。

手動デプロイの場合:
1. `build/` を GitHub にプッシュ
2. https://vercel.com/ でリポジトリをインポート
3. Build Command: `npm run build`、Output Directory: `build` を設定

### GitHub の注意事項（アカウント2つ運用）

リモートURLにユーザー名を埋め込んで push する。

```bash
git remote set-url origin https://KNJ95@github.com/KNJ95/PBL.git
git push origin main
# パスワードには KNJ95 の PAT（Personal Access Token）を入力
```

---

## 6. ユーザー管理手順

### 前提

- Python 3.x + boto3（`pip install boto3`）
- AWS CLI 設定済み（`aws configure`）

### Step 1: users.csv を用意する

```csv
userId,name,role,projectId,tempPassword
S001,氏名,student,PBL-2026-001,（自動生成）
M001,氏名,mentor,PBL-2026-001,（自動生成）
```

| 列 | 内容 |
|---|---|
| `userId` | ログインID（例: S001, M001） |
| `name` | 初期値 `氏名`（ユーザーが初回ログイン時に自己入力） |
| `role` | `student` / `mentor` |
| `projectId` | 所属プロジェクト（同じIDのユーザー同士が参照可能） |
| `tempPassword` | 初期パスワード（次のStepで自動生成） |

### Step 2: パスワードをランダム生成する

```bash
python tools/generate_passwords.py
```

紛らわしい文字（`0/O`, `1/l/I`）を除外した10文字のパスワードを生成。

### Step 3: DynamoDB へインポートする

```bash
python tools/import_users.py tools/users.csv
```

`passwordHash`・`initialPasswordHash` に同一ハッシュを設定し、`isFirstLogin: true` で登録。

### Step 4: 初期パスワードを配布する

生成した `users.csv` を開き、各ユーザーに `userId` と `tempPassword` を個別に通知。

---

## 7. 設計上の判断

### 7.1 単一ファイル構成（POC）

`src/App.jsx` 1ファイルに全コードを集約。POC 段階のため保守性より全体把握のしやすさを優先。AI（Claude Code）に全文渡してデバッグ・拡張しやすい構成。本番化時はコンポーネント分割を推奨。

### 7.2 localStorage + DynamoDB 二重書き込み

`storage.set(key, value)` でローカルとクラウドに同時書き込み。ログイン時に `syncFromCloud(uid)` でクラウドから全件取得してローカルを更新。

- **DynamoDB の partition key = `userId`**: メンターが書いた `mentor_survey:{studentId}:{ts}` は mentorId パーティションに保存される（POC前提：同一ブラウザで動作確認）
- **FB待ち件数の正確化**: `mentor_done_ids`（メンターのlocalStorage）を読んで学生の「FB待ち」カウントから除外。同一デバイスでのPOC運用を前提とした実装

### 7.3 アンケートを JSON 外部定義方式に

設問・選択肢・軸寄与度（`axisWeights`）を `public/survey_questions.json` で管理。アプリを再ビルドせずに設問を更新可能。

### 7.4 認証方式

ID + パスワード認証。パスワードは Web Crypto API の SHA-256 でハッシュ化。`initialPasswordHash` を別フィールドで保持することで、パスワード忘れ時に管理者不要で自己リセット可能。

### 7.5 FB という表現への統一

「採点」はメンターが評価を数値化するイメージが強く、PBLの文脈に合わないため「FB（フィードバック）」に統一（2026-09-03 打合せ決定）。

### 7.6 ステージ選択による成長可視化

学生が振り返り提出時に「初回/通常/中間/最終」を選択することで、ホーム画面でプロジェクト期間中の初回評価と最新評価を比較表示できる。学生が自身の成長を実感するための設計。

### 7.7 ログと振り返りの役割分担

| | ログ | 振り返り |
|---|---|---|
| 対象活動 | 自主活動（随時） | PBL公式活動後 |
| 入力方式 | 9問スライダー（1〜10）、手軽 | 15問選択式 + 深堀り（約5分） |
| 提出先 | なし（自分の記録） | メンター（FBを受ける） |
| データ活用 | 活動記録・自己把握 | レーダーチャート更新・FB |

### 7.8 モバイル対応

- `zoom: 1.2` メディアクエリを削除（全要素拡大による崩れを解消）
- `box-sizing: border-box` をグローバル適用
- `input[type="date"]` に `-webkit-appearance: none` + `width: 100%` を適用（iOS Safari での幅はみ出し解消）
- ヘッダーパディング・コンテンツパディングを縮小（1.5rem → 1rem）

---

## 8. バージョン履歴・今後の課題

### 8.1 バージョン履歴

| バージョン | 更新日 | 主な変更内容 |
|---|---|---|
| v1.0–1.3 | 2026-05〜06 | 基本画面構成（ホーム/アンケート/ログ/ポートフォリオ/振り返り）、メンター評価・採点 |
| v1.4 | 2026-06 | 0626ルーブリック実装、②⑧参考値表示、`AXES.evalText` / `LEVELS.def` 追加 |
| v1.5 | 2026-07 | チュートリアル（ロール別）、ルーブリックポップアップ、ホーム画面再設計、②⑧を本採点復帰 |
| v1.6 | 2026-07-24 | ID+パスワード認証（SHA-256）、初回ログイン時パスワード変更、projectIdアクセス制御、DynamoDB二テーブル構成、Lambda Function URL、CSVインポート |
| v1.7 | 2026-09-07 | プロジェクト情報カード（ホーム最上部）・詳細ページ・戻るボタン追加、ログ画面を9軸スライダー形式に変更、振り返り画面の説明文・フォント改善、「採点」→「FB」全面変更、メンター採点の自動展開、AIエラーメッセージ変更 |
| v1.8 | 2026-09-08〜09 | 振り返りステージ選択（初回/通常/中間/最終）追加、ホーム画面に初回 vs 最新の2チャート比較表示、メンターFB画面に学生フィルタタブ追加、FB待ち件数の正確化（mentor_done_ids 反映）、ログ画面の軸バッジ削除、チュートリアル内容更新、モバイル画面崩れ修正 |
| **v1.9** | **2026-09-10** | 15問×9軸マッピング改善（survey_questions.json v1.1.0）：①課題設定力の設問カバレッジ強化、⑧自律・内発的動機の分散縮小（Q01/Q03からweight削除、Q04の①weight増加、Q02に①追加、Q14の⑧を縮小） |

### 8.2 未対応機能（TODO）

優先度の高いものを抜粋。詳細は `議事録/TODO.md` を参照。

| # | 内容 | 備考 |
|---|---|---|
| #53 | メンター画面でレーダーチャートを表示する | 学生選択時に表示する設計 |
| ~~#55~~ | ~~15問 → 9軸の対応関係を整理する~~ | ✅ v1.9 完了（axisWeights 最適化済み） |
| #56 | 15問 → 9軸の反映ロジックを整理する | calcAxesFromAnswers の検証 |
| #57 | プロジェクト概要に何を記載するか定義する | 教授側で決定が必要 |
| #59 | 活動ログへ目的を含めるか検討する | 「なぜその活動をしたか」 |
| #60 | プロジェクトIDの役割と運用を整理する | 所属判定 / 権限制御 / データ集計 |
| #63 | 成長推移の可視化方法を検討する | 折れ線グラフ等 |
| #64 | メンター向け推移表示を検討する | 学生の成長推移をメンターが確認 |
| #32 | 運用フロー案の作成 | トライアル運用設計 |
| #69 | スマホでの画面崩れ（残課題対応） | v1.8で主要修正済み、残検証あり |

### 8.3 AI 評価ロードマップ

| ステージ | 内容 | 現在地 |
|---|---|---|
| STAGE 1 | メンターが振り返り内容を読んでFBを付ける | ← **現在** |
| STAGE 2 | AI が振り返りを分析してFB案を提案 → メンターが確認・修正 | 次フェーズ |
| STAGE 3 | AI が評価を自律判定 → メンターは監督のみ | 将来構想 |

---

## 9. 関連システム

### 9.1 求人分析システム（job-analyzer）

マイナビ求人票を Be-Ready 9軸でスコアリングするシステム。本POCアプリとは独立したリポジトリ。

| 項目 | 内容 |
|---|---|
| GitHub | `https://github.com/KNJ95/Analyze_Company.git` |
| Vercel | `https://analyze-company-ochre.vercel.app/` |

### 9.2 関連資料

| 資料 | 内容 |
|---|---|
| `議事録/TODO.md` | 機能開発TODO（議事録日付・完了済みセクション付き） |
| `議事録/20260903_PBL評価プラットフォーム打合せ.md` | 2026/09/03 打合せ議事録 |
| `AWS構築.md` | AWSバックエンド構築手順書 |
| `0626ルーブリック案.xlsx` | 佐藤教授入力の評価ルーブリック正本 |

---

## 10. テスト

### 10.1 テスト環境

`react-scripts 5.0.1` に同梱された **Jest 27 + jsdom** を使用。追加ライブラリとして `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event` をインストール済み。

> `jest.config.js` は不要（CRA が自動認識）。`src/setupTests.js` がセットアップファイル。

### 10.2 テストの実行方法

```bash
# 対話モード（ファイル変更を監視して自動再実行）
npm test

# 1 回だけ実行（CI 向け）
npm test -- --watchAll=false

# カバレッジレポート付き
npm test -- --watchAll=false --coverage

# 特定ファイルのみ実行
npm test -- --watchAll=false pureUtils
npm test -- --watchAll=false LoginScreen
```

### 10.3 テストファイル一覧

| ファイル | テスト種別 | テスト対象 |
|---|---|---|
| `src/__tests__/pureUtils.test.js` | ユニットテスト | ピュア関数 |
| `src/__tests__/hashPassword.test.js` | ユニットテスト | SHA-256 ハッシュ化 |
| `src/__tests__/storage.test.js` | ユニットテスト | ストレージ層 |
| `src/__tests__/Avatar.test.jsx` | コンポーネントテスト | Avatar UI |
| `src/__tests__/LoginScreen.test.jsx` | 統合テスト | ログイン画面 |
| `src/__tests__/StudentFlow.test.jsx` | 統合テスト | 学生フロー |
| `src/__tests__/MentorFlow.test.jsx` | 統合テスト | メンターフロー |

### 10.4 各テストファイルの要件

#### `pureUtils.test.js` — ピュア関数のユニットテスト

レンダリングなしで実行できる最速テスト群。

**`calcAxesFromAnswers(answers, allQuestions)`**
- 空の回答を渡すと空のオブジェクトが返る
- 全設問に回答値 1 を渡すと全軸が Lv 1 になる
- 全設問に回答値 4 を渡すと全軸が Lv 4 になる
- `axisWeights` による重み付き加重平均が正しく計算される（Q02・回答 3 のケースで検証）
- 回答値 0 の設問は計算から除外される
- 出力値は常に 1〜4 の範囲に収まる（クランプ処理）

**`getDrillConfig(mainValue)`**
- mainValue 1〜4 それぞれで `d1q` / `d1opts` / `d2q` / `d2opts` を持つオブジェクトを返す
- 各 opts の長さが正確に 4 個
- mainValue=1 の d1q が「状況」を含む文言（受動的状況の深堀り）
- mainValue=4 の d1q が「きっかけ」を含む文言（強みの自覚促進）
- 4 以外の範囲外値（例: 99）は Lv4 と同じ設定を返す

**`fmt(ts)` / `avg(arr)` / `axisAvg(scores)`**
- `fmt`: タイムスタンプを `YYYY/MM/DD` 形式に変換・月日のゼロパディング
- `avg`: 空配列は 0・単一要素・複数要素の平均
- `axisAvg`: null / undefined は 0・スコア 0 の軸を除外して平均計算

---

#### `hashPassword.test.js` — SHA-256 ハッシュ化のユニットテスト

> jsdom 環境では `crypto.subtle` が未実装のため、`setupTests.js` で 32 バイトの `ArrayBuffer` を返すモックに差し替えている。

- 非同期関数であり `Promise` を返す
- 戻り値が長さ 64 の小文字 16 進数文字列（SHA-256 の 32 バイト出力）
- 内部で `crypto.subtle.digest` を `"SHA-256"` アルゴリズムで 1 回だけ呼び出す
- `TextEncoder` で文字列をエンコードした `Uint8Array` を渡す
- バイト `0x0f` は `"0f"` にゼロパディングされる（パディング処理の検証）
- 空文字列でも例外を投げない

---

#### `storage.test.js` — ストレージ層のユニットテスト

> `_cloudUid` はモジュールレベルの状態のため、`afterEach` で `storage.clearUser()` を呼んでリセットする。

**`storage.get` / `storage.set`**
- JSON シリアライズ可能な値（オブジェクト・配列・数値）を localStorage に保存・取得できる
- 存在しないキーは `null` を返す
- `setUser` 呼び出し前は `fetch` を呼ばない（クラウド書き込みなし）
- `setUser` 後の `set` は Lambda URL に `POST` リクエストを送る
- POST ボディに `userId` と `dataKey` が含まれる

**`storage.del`**
- localStorage からキーを削除する
- `setUser` 後の `del` は Lambda URL に `DELETE` リクエストを送る

**`storage.keys`**
- 指定プレフィックスに一致するキーの一覧を返す
- 不一致のキーは含まれない

**`storage.syncFromCloud`**
- クラウドから取得したデータを localStorage に書き込む
- `skipKeys` に指定したキーは上書きしない
- `pending_evals:` キーはマージ方式（同一 `id` の重複を排除して結合）
- `ok: false` のレスポンスやネットワークエラーで例外を投げない

---

#### `Avatar.test.jsx` — Avatar コンポーネントのユニットテスト

- `name` が渡されたとき先頭の 1 文字が表示される（日本語名も対応）
- `name` が `undefined` または空文字列のとき `"?"` が表示される
- `size` prop がインラインスタイルの `width` / `height` に `px` 単位で反映される
- デフォルト `size` は `36px`
- `borderRadius` が `"50%"` で円形になる
- props なしでクラッシュしない

---

#### `LoginScreen.test.jsx` — ログイン画面の統合テスト

> `beforeEach` で localStorage をクリアし、`fetch` を URL で分岐するモックに設定する。

**ログイン画面の表示確認**
- `"Be-Ready ポートフォリオ"` 見出しと `"Project-Based Learning Portfolio"` サブタイトルが表示される
- ユーザーID・パスワード・プロジェクトID の入力欄が存在する

**ログインボタンの活性化制御**
- 入力欄が空のとき `disabled`
- ID のみ入力でも `disabled` のまま
- ID とパスワードが両方入力されたとき `enabled` になる

**ログインエラー表示**
- `fetchUserProfile` が `null`（`ok: false`）を返した場合 → `"IDが存在しません。管理者に確認してください。"` が表示される
- パスワードハッシュが不一致の場合 → `"パスワードが違います。"` が表示される
- `isFirstLogin: true` のユーザーの場合 → パスワード変更画面（"初回ログインのため…"）へ遷移する

---

#### `StudentFlow.test.jsx` — 学生フローの統合テスト

> `beforeEach` で localStorage に `role: "student"` の `current_user` をセット。`afterEach` で `storage.clearUser()` を呼んで `_cloudUid` 状態をリセット。

**ホーム画面**
- `"Be-Ready"` ブランドテキストがヘッダーに表示される
- プロジェクトID がヘッダーに表示される
- ボトムナビに「ホーム」「ログ」「振り返り」「FB」タブが存在する
- ログアウトボタンをクリックするとログイン画面に戻り、localStorage から `current_user` が削除される

**ボトムナビゲーション**
- 「ログ」タブをクリックすると `"活動ログ"` 見出しが表示される（ログ記録画面）
- 「振り返り」タブをクリックすると `"振り返りアンケート"` 見出しが表示される（振り返り画面）

**活動ログ入力**
- ログ画面に活動タイトルのラベル（"何の活動のログですか"）が表示される
- 活動タイトル入力欄に文字を入力できる

---

#### `MentorFlow.test.jsx` — メンターフローの統合テスト

> `beforeEach` で localStorage に `role: "mentor"` の `current_user`・`students_list`・`pending_evals:{studentId}` をセット。

**メンターホーム画面**
- `"Be-Ready"` ブランドテキストがヘッダーに表示される
- メンター専用ボトムナビに「学生」「FB」タブが表示される
- 採点待ち 1 件のとき FB タブにバッジ `"1"` が表示される
- ログアウトボタンクリックでログイン画面に戻る

**FB（採点）タブ**
- FB タブをクリックすると `"FB待ち"` 見出しが表示される
- `pending_evals` が空のとき FB タブにバッジ `"0"` が表示されない

**AI 採点**
- AI 採点ボタンをクリックすると `"api.anthropic.com"` への `fetch` が呼ばれる

### 10.5 モック設定（`src/setupTests.js`）

| モック対象 | 方針 |
|---|---|
| `fetch` | `jest.fn()` でグローバルを差し替え。`beforeEach` でデフォルト成功レスポンスを設定。テストごとに `mockResolvedValueOnce` で上書き可能 |
| `localStorage` | jsdom が提供する実装をそのまま使用。`beforeEach` で `localStorage.clear()` によりリセット |
| `crypto.subtle.digest` | jsdom 未実装のため 32 バイトの `ArrayBuffer` を返すモックに差し替え。`beforeEach` で `mockResolvedValue` を再設定 |
| `survey_questions.json` | `fetch.mockImplementation` で URL を判定し、本物の JSON データを返す |
| `matchMedia` | recharts の `ResponsiveContainer` が必要とするため jsdom スタブを設定 |
| `ResizeObserver` | recharts が必要とするため jsdom スタブを設定 |

---

## 11. 動作環境

| 項目 | 推奨 |
|---|---|
| ブラウザ | Chrome / Safari（iOS Safari 含む） |
| デバイス | PC / スマートフォン（iPhone 含む） |
| 画面サイズ | 360px〜 |
| Node.js | 14 以上（ビルド時） |
| ネット接続 | 初回ロード・クラウド同期時に必須 |

---

**最終更新日**: 2026年9月12日（テストスイート追加）  
**開発体制**: 谷川 賢嗣（Accenture）  
**対応プロジェクト**: Be-Ready人材育成プログラム 評価軸 POC（北海学園大学 佐藤教授 共同検討）
