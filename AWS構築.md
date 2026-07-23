# Be-Ready POC — AWS バックエンド構築手順書

> 作成日：2026年7月10日  
> 担当：谷川 賢嗣（Accenture）  
> 対象：個人AWSアカウント × DynamoDB × Lambda Function URL

---

## ⚠️ 方針変更メモ（2026-07-10）

当初 AWS Amplify Gen 1 を使用する予定だったが、**Gen 1 が新規プロジェクトを受け付けなくなった**ため、より直接的な構成に変更。

| 当初案 | 変更後 |
|---|---|
| Amplify CLI → amplify init/push | AWS Console GUI + AWS CLI |
| API Gateway（Amplify管理） | **Lambda Function URL**（API Gateway不要） |
| aws-amplify SDK | **ネイティブ fetch API**（追加ライブラリ不要） |

---

## 目次

1. [全体アーキテクチャと費用](#1-全体アーキテクチャと費用)
2. [Phase A：ローカル環境準備](#2-phase-aローカル環境準備-完了) ✅
3. [Phase B：AWSアカウント作成](#3-phase-bawsアカウント作成-完了) ✅
4. [Phase C：IAMユーザー・AWS CLI設定](#4-phase-ciamユーザーaws-cli設定-完了) ✅
5. [Phase E：DynamoDB テーブル作成](#5-phase-odynamodb-テーブル作成)
6. [Phase F：Lambda用 IAMロール作成](#6-phase-flambda用-iamロール作成)
7. [Phase G：Lambda関数の作成とコード実装](#7-phase-glambda関数の作成とコード実装)
8. [Phase H：Function URL の有効化](#8-phase-hfunction-url-の有効化)
9. [Phase I：フロントエンド書き換え](#9-phase-iフロントエンド書き換え)
10. [Phase J：動作確認](#10-phase-j動作確認)
11. [Phase K：コスト管理（予算アラート）](#11-phase-kコスト管理)
12. [将来の拡張：Gemini AI連携](#12-将来の拡張gemini-ai連携)
13. [トラブルシューティング](#13-トラブルシューティング)

---

## 1. 全体アーキテクチャと費用

### 1.1 アーキテクチャ図

```
[ブラウザ / スマホ]
       │
       │ HTTPS（fetch API）
       ▼
[Lambda Function URL]          ← 直接HTTPSエンドポイント（API Gateway不要）
       │
       ▼
[AWS Lambda: beReadyFunction]  ← サーバーレス処理（Node.js 20）
       │
       ▼
[Amazon DynamoDB: BeReadyData] ← データベース（NoSQL）
       PK: userId  /  SK: dataKey
```

### 1.2 DynamoDB テーブル設計

既存の `localStorage` のキー構造をそのまま DynamoDB に移行します。

| DynamoDB PK | DynamoDB SK | 対応する localStorage キー | 内容 |
|---|---|---|---|
| `{userId}` | `survey:{timestamp}` | `survey:{userId}:{timestamp}` | アンケート回答 |
| `{userId}` | `log:{timestamp}` | `log:{userId}:{timestamp}` | YWT日次ログ |
| `{userId}` | `mentor_survey:{timestamp}` | `mentor_survey:{studentId}:{timestamp}` | メンター評価 |
| `{userId}` | `questions:{timestamp}` | `questions:{studentId}:{timestamp}` | 問い |
| `{userId}` | `reflections:{timestamp}` | `reflections:{userId}:{timestamp}` | 振り返り |
| `__system__` | `students_list` | `students_list` | 学生一覧（共有） |

### 1.3 費用概算（POC期間）

| サービス | 無料枠 | POC想定 | 月額費用 |
|---|---|---|---|
| DynamoDB | 25GB・読み書き無制限（**永続無料**） | 数MB | **$0** |
| Lambda | 100万リクエスト/月（**永続無料**） | 数千回/月 | **$0** |
| Lambda Function URL | Lambda料金に含まれる | — | **$0** |
| **合計** | | | **$0〜数ドル/月** |

> Amplify や API Gateway を使わないため、コスト面でも有利な構成です。

---

## 2. Phase A：ローカル環境準備 ✅ 完了

### 実施済み内容

```powershell
# Node.js v20 インストール
winget install OpenJS.NodeJS.LTS
node --version    # → v20.13.1 ✅

# AWS CLI インストール
winget install Amazon.AWSCLI
aws --version     # → aws-cli/2.36.5 ✅
```

---

## 3. Phase B：AWSアカウント作成 ✅ 完了

### 実施済み内容

- 個人AWSアカウント新規作成（クレジットカード登録済み）
- コンソールログイン確認済み
- リージョン：**アジアパシフィック（東京）ap-northeast-1** に設定

---

## 4. Phase C：IAMユーザー・AWS CLI設定 ✅ 完了

### 実施済み内容

**IAMユーザー：`be-ready-dev`**
- ポリシー：`AdministratorAccess` 付与
- アクセスキー発行・保存済み

**AWS CLI 設定：**

```powershell
aws configure
# Access Key ID:     ← 発行済み
# Secret Access Key: ← 発行済み
# Region:            ap-northeast-1
# Output format:     json
```

**接続確認済み：**

```json
{
    "UserId": "AIDAQCPE5JR4SUWZTFEXM",
    "Account": "005311908985",
    "Arn": "arn:aws:iam::005311908985:user/be-ready-dev"
}
```

---

## 5. Phase E：DynamoDB テーブル作成

### 5.1 DynamoDB コンソールを開く

AWSコンソール上部の検索バーに `DynamoDB` と入力 → **DynamoDB** を開く

リージョンが **「東京 ap-northeast-1」** になっていることを確認（右上）。

### 5.2 テーブルを作成

1. 左メニュー「**テーブル**」→ 右上「**テーブルの作成**」ボタン

2. 以下を入力：

| 項目 | 値 |
|---|---|
| テーブル名 | `BeReadyData` |
| パーティションキー（名前） | `userId` |
| パーティションキー（タイプ） | **文字列** |
| ソートキーを追加 | チェックを入れる |
| ソートキー（名前） | `dataKey` |
| ソートキー（タイプ） | **文字列** |

3. 「**テーブルの設定**」セクション
   - 「**デフォルト設定**」を選択（オンデマンドキャパシティ・自動スケーリング）

4. 画面下部「**テーブルの作成**」をクリック

### 5.3 作成完了の確認

テーブル一覧に `BeReadyData` が表示され、ステータスが **「アクティブ」** になるまで待つ（1〜2分）。

---

## 6. Phase F：Lambda用 IAMロール作成

Lambda 関数が DynamoDB を読み書きするために必要なロールです。

### 6.1 IAMコンソールを開く

検索バーで `IAM` → 左メニュー「**ロール**」→「**ロールを作成**」

### 6.2 ロールの設定

**ステップ1：信頼されたエンティティを選択**

| 項目 | 値 |
|---|---|
| 信頼されたエンティティタイプ | **AWS のサービス** |
| ユースケース | **Lambda** |

「次へ」

**ステップ2：許可ポリシーを追加**

以下の2つを検索してチェック ✓ ：

| ポリシー名 | 用途 |
|---|---|
| `AWSLambdaBasicExecutionRole` | CloudWatch Logs への書き込み（ログ出力） |
| `AmazonDynamoDBFullAccess` | DynamoDB の読み書き |

「次へ」

**ステップ3：ロール名の設定**

| 項目 | 値 |
|---|---|
| ロール名 | `BeReadyLambdaRole` |
| 説明（任意） | `Be-Ready POC Lambda execution role` |

「**ロールを作成**」

---

## 7. Phase G：Lambda関数の作成とコード実装

### 7.1 Lambda コンソールを開く

検索バーで `Lambda` → 右上「**関数の作成**」

### 7.2 関数の基本設定

| 項目 | 値 |
|---|---|
| 一から作成 | 選択 |
| 関数名 | `beReadyFunction` |
| ランタイム | **Node.js 20.x** |
| アーキテクチャ | x86_64 |

**「実行ロールの変更」セクション**
- 「**既存のロールを使用する**」を選択
- 既存のロール：`BeReadyLambdaRole`

「**関数の作成**」

### 7.3 環境変数を設定

関数が作成されたら：

1. 「**設定**」タブ → 左メニュー「**環境変数**」
2. 「**編集**」→「**環境変数を追加**」
3. 以下を入力：

| キー | 値 |
|---|---|
| `TABLE_NAME` | `BeReadyData` |

「**保存**」

### 7.4 コードを実装

1. 「**コード**」タブをクリック
2. 左のファイルツリーで `index.mjs` をダブルクリック（または `index.js`）
3. エディタの内容を**全て削除**して、以下のコードを**貼り付け**：

```javascript
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
  DeleteCommand,
} from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({ region: "ap-northeast-1" });
const dynamo = DynamoDBDocumentClient.from(client);
const TABLE  = process.env.TABLE_NAME;

const HEADERS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const res = (code, body) => ({
  statusCode: code,
  headers: HEADERS,
  body: JSON.stringify(body),
});

export const handler = async (event) => {
  const method = event.requestContext?.http?.method ?? "GET";
  const params = event.queryStringParameters ?? {};

  // CORS preflight
  if (method === "OPTIONS") return res(200, {});

  try {
    // ── GET ──────────────────────────────────────────
    // ?userId=xxx              → 全アイテム取得
    // ?userId=xxx&dataKey=yyy  → 特定アイテム取得
    if (method === "GET") {
      const { userId, dataKey } = params;
      if (!userId) return res(400, { ok: false, error: "userId required" });

      if (dataKey) {
        const r = await dynamo.send(
          new GetCommand({ TableName: TABLE, Key: { userId, dataKey } })
        );
        return res(200, { ok: true, data: r.Item ?? null });
      }

      const r = await dynamo.send(
        new QueryCommand({
          TableName: TABLE,
          KeyConditionExpression: "userId = :uid",
          ExpressionAttributeValues: { ":uid": userId },
        })
      );
      return res(200, { ok: true, data: r.Items });
    }

    // ── POST ─────────────────────────────────────────
    // body: { userId, dataKey, payload }
    if (method === "POST") {
      const body = event.body ? JSON.parse(event.body) : {};
      const { userId, dataKey, payload } = body;
      if (!userId || !dataKey)
        return res(400, { ok: false, error: "userId and dataKey required" });

      await dynamo.send(
        new PutCommand({
          TableName: TABLE,
          Item: { userId, dataKey, payload, updatedAt: Date.now() },
        })
      );
      return res(200, { ok: true });
    }

    // ── DELETE ───────────────────────────────────────
    // ?userId=xxx&dataKey=yyy
    if (method === "DELETE") {
      const { userId, dataKey } = params;
      if (!userId || !dataKey)
        return res(400, { ok: false, error: "userId and dataKey required" });

      await dynamo.send(
        new DeleteCommand({ TableName: TABLE, Key: { userId, dataKey } })
      );
      return res(200, { ok: true });
    }

    return res(405, { ok: false, error: "Method not allowed" });
  } catch (e) {
    console.error(e);
    return res(500, { ok: false, error: e.message });
  }
};
```

4. 右上「**Deploy**」ボタンをクリック

**「Changes deployed」と表示されれば成功。**

### 7.5 動作テスト（コンソール上）

1. 「**テスト**」タブ → 「**新しいテストイベントを作成**」
2. イベント名：`TestGet`
3. イベント JSON を以下に置き換え：

```json
{
  "requestContext": {
    "http": { "method": "GET" }
  },
  "queryStringParameters": {
    "userId": "test_user"
  }
}
```

4. 「**テスト**」をクリック
5. 結果に `"ok": true` が表示されれば正常動作。

---

## 8. Phase H：Function URL の有効化

Function URL を使うと、API Gateway なしで Lambda に直接 HTTPS でアクセスできます。

### 8.1 Function URL を作成

Lambda コンソールの `beReadyFunction` 関数ページで：

1. 「**設定**」タブ → 左メニュー「**Function URL**」
2. 「**Function URL を作成**」ボタン

### 8.2 設定

| 項目 | 値 |
|---|---|
| 認証タイプ | **NONE**（認証なし・POC用） |
| オリジン間リソース共有 (CORS) を設定する | **チェックを入れる** |

**CORS 設定（チェック後に展開する）：**

| 項目 | 値 |
|---|---|
| 許可されるオリジン | `*` |
| 許可されるヘッダー | `Content-Type` |
| 許可されるメソッド | `GET` `POST` `DELETE` |

「**保存**」

### 8.3 Function URL をコピー

設定完了後、「**Function URL**」として以下のような URL が表示されます：

```
https://xxxxxxxxxxxxxxxxxx.lambda-url.ap-northeast-1.on.aws/
```

**⚠️ このURLを必ずメモしてください。** フロントエンドで使います。

---

## 9. Phase I：フロントエンド書き換え

`src/App.jsx` の `storage` オブジェクトを書き換え、クラウドと同期するようにします。

### 9.1 API エンドポイントを設定

`src/App.jsx` の先頭付近にある `storage` 定義の直前に以下を追加：

```javascript
// ─── クラウド同期設定 ──────────────────────────────────────────────────────
// Phase H で取得した Function URL をここに貼り付ける
const CLOUD_API = "https://xxxxxxxxxxxxxxxxxx.lambda-url.ap-northeast-1.on.aws";
```

### 9.2 `storage` ヘルパーを書き換え

`src/App.jsx` の `storage` オブジェクトを以下にまるごと置き換えてください：

```javascript
// ─── storage ヘルパー（localStorage + DynamoDB 二重書き込み）──────────────
// localStorage をキャッシュとして使い、バックグラウンドで DynamoDB に同期。
// UIの応答性を維持しつつ、クラウドへのデータ永続化を実現する。
const storage = {

  set: (key, val) => {
    // 1. localStorage に即時保存（画面がすぐ反映される）
    try { localStorage.setItem(key, JSON.stringify(val)); } catch {}

    // 2. バックグラウンドで DynamoDB に同期
    const userId = (() => {
      try {
        const u = localStorage.getItem("current_user");
        return u ? JSON.parse(u).id : "__anon__";
      } catch { return "__anon__"; }
    })();
    fetch(CLOUD_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, dataKey: key, payload: JSON.stringify(val) }),
    }).catch(e => console.warn("[storage.set] cloud sync failed:", e));
  },

  get: (key) => {
    try {
      const v = localStorage.getItem(key);
      return v ? JSON.parse(v) : null;
    } catch { return null; }
  },

  del: (key) => {
    // 1. localStorage から削除
    try { localStorage.removeItem(key); } catch {}

    // 2. バックグラウンドで DynamoDB から削除
    const userId = (() => {
      try {
        const u = localStorage.getItem("current_user");
        return u ? JSON.parse(u).id : "__anon__";
      } catch { return "__anon__"; }
    })();
    fetch(`${CLOUD_API}?userId=${encodeURIComponent(userId)}&dataKey=${encodeURIComponent(key)}`, {
      method: "DELETE",
    }).catch(e => console.warn("[storage.del] cloud delete failed:", e));
  },

  keys: (prefix) => {
    const result = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(prefix)) result.push(k);
    }
    return result;
  },

  // ログイン時にクラウドからデータを復元する
  syncFromCloud: async (userId) => {
    try {
      const res = await fetch(`${CLOUD_API}?userId=${encodeURIComponent(userId)}`);
      const json = await res.json();
      if (json.ok && Array.isArray(json.data)) {
        json.data.forEach(item => {
          try { localStorage.setItem(item.dataKey, item.payload); } catch {}
        });
        console.log(`[syncFromCloud] ${json.data.length} items restored for ${userId}`);
      }
    } catch (e) {
      console.warn("[syncFromCloud] failed:", e);
    }
  },
};
```

### 9.3 ログイン時にクラウドデータを復元

`login` 関数（App.jsx 内）に `syncFromCloud` を追加します。

現在の `login` 関数を以下に置き換えてください：

```javascript
const login = (u) => {
  storage.set("current_user", u);
  setCurrentUser(u);
  setScreen("home");
  // クラウドからデータを復元してから画面を再描画
  storage.syncFromCloud(u.id).then(() => tick());
  if (!storage.get("tutorial_seen")) { setShowTutorial(true); setTutorialStep(0); }
};
```

---

## 10. Phase J：動作確認

### 10.1 ローカルで起動

```powershell
cd "C:\Users\kenji.tanikawa\OneDrive - Accenture\デスクトップ\Claude\PBL\code"
npm start
```

ブラウザで `http://localhost:3000` を開く。

### 10.2 クラウド同期の確認（ブラウザ DevTools）

1. F12 → 「**Network**」タブ → フィルターに `lambda-url` と入力
2. アプリでログイン・アンケート入力してみる
3. Network タブに **POST** リクエストが表示され、**Status: 200** になれば成功

### 10.3 DynamoDB コンソールでデータを確認

1. AWSコンソール → DynamoDB → 「テーブル」→ `BeReadyData`
2. 「**テーブルアイテムを探索**」タブ
3. アイテムが追加されているか確認

**期待されるアイテム例：**

```
userId:    "yamada_taro"
dataKey:   "survey:1720000000000"
payload:   "{\"userID\":\"yamada_taro\",\"timestamp\":1720000000000,...}"
updatedAt: 1720000000123
```

### 10.4 別端末からのデータ引き継ぎ確認

スマホや別のブラウザから **同じユーザーID** でログインし、データが引き継がれることを確認。

**これがクラウド化の最大のメリットです。**

---

## 11. Phase K：コスト管理

### 11.1 予算アラートの設定

**AWSコンソール → 検索バーで `Billing and Cost Management` を開く**

1. 左メニュー「**予算**」→「**予算を作成**」
2. 「**テンプレートを使用する（簡易）**」を選択
3. テンプレート：「**月次コスト予算**」
4. 入力：

| 項目 | 値 |
|---|---|
| 予算名 | `be-ready-poc-budget` |
| 予算額 | `5`（$5 = 約750円） |
| メールアドレス | アラート受信先のメール |

5. 「**予算を作成**」

### 11.2 無料利用枠のモニタリング

**AWSコンソール → Billing → 「無料利用枠」**

各サービスの使用率をリアルタイムで確認できます。

### 11.3 POCでの想定使用量

| サービス | 無料枠 | POC想定 | 結果 |
|---|---|---|---|
| DynamoDB | 25GB・読み書き無制限（永続無料） | 数MB・数千回 | ✅ 無料 |
| Lambda | 100万リクエスト/月（永続無料） | 数千回 | ✅ 無料 |
| Lambda Function URL | Lambda料金に含まれる | — | ✅ 無料 |

---

## 12. 将来の拡張：Gemini AI連携

### 12.1 アーキテクチャ（追加後）

```
[フロントエンド]
       │ POST /ai-analyze（振り返りテキスト送信）
       ▼
[Lambda Function URL]
       │ Gemini APIキーを環境変数で管理（セキュア）
       ▼
[Google Gemini 1.5 Flash API]
       │ 分析結果（JSON）
       ▼
[フロントエンドに表示]
```

### 12.2 実装手順（将来）

1. AWSコンソール → Lambda → `beReadyFunction`
2. 「設定」→「環境変数」→ `GEMINI_API_KEY` を追加
3. `index.mjs` に `/ai-analyze` ルートを追加
4. `fetch("https://generativelanguage.googleapis.com/...")` で Gemini API を呼び出す

### 12.3 Gemini API の無料枠

| モデル | 無料枠 | 想定使用量 |
|---|---|---|
| Gemini 1.5 Flash | 60リクエスト/分・1,500回/日 | 数十回/日 → $0 |

---

## 13. トラブルシューティング

### 13.1 Lambda テストで `TABLE_NAME is not set` エラー

環境変数が設定されていない。Phase G 7.3 を再確認。

```
設定 → 環境変数 → TABLE_NAME = BeReadyData
```

### 13.2 フロントエンドから API が繋がらない（CORS エラー）

ブラウザの DevTools コンソールに `Access-Control-Allow-Origin` エラーが出る場合：

1. Lambda の Function URL 設定で CORS が有効か確認
2. 「許可されるオリジン」が `*` になっているか確認
3. `index.mjs` の `HEADERS` に `Access-Control-Allow-Origin: *` が含まれているか確認

### 13.3 DynamoDB にデータが保存されない

1. ブラウザ DevTools → Network タブ → POST リクエストのレスポンスを確認
2. 500 エラーの場合 → Lambda の CloudWatch Logs を確認
   - AWSコンソール → CloudWatch → ロググループ → `/aws/lambda/beReadyFunction`

### 13.4 `aws sts get-caller-identity` でエラーが出る

```powershell
aws configure    # アクセスキーを再設定
```

設定ファイルの確認：
```powershell
cat "$HOME\.aws\credentials"
```

### 13.5 Node.js のバージョンが古い（v11 のまま）

```powershell
node --version    # v11 のままなら PowerShell を完全に再起動
where.exe node    # PATH の確認
```

解決しない場合はPCを再起動してください。

---

## 進捗チェックリスト

```
Phase A：ローカル環境準備
  ✅ Node.js v20.13.1 インストール完了
  ✅ AWS CLI 2.36.5 インストール完了

Phase B：AWSアカウント作成
  ✅ AWSアカウント作成完了（コンソールログイン確認済み）
  ✅ リージョン「東京 (ap-northeast-1)」に設定

Phase C：IAMユーザー・AWS CLI設定
  ✅ IAMユーザー be-ready-dev 作成完了
  ✅ AdministratorAccess 付与完了
  ✅ アクセスキーID・シークレット保存完了
  ✅ aws configure 完了
  ✅ aws sts get-caller-identity でアカウントID確認済み
     Account: 005311908985

Phase E：DynamoDB テーブル作成
  ✅ テーブル BeReadyData 作成完了（ステータス：アクティブ）

Phase F：Lambda用 IAMロール作成
  ✅ ロール BeReadyLambdaRole 作成完了
  ✅ AWSLambdaBasicExecutionRole アタッチ済み
  ✅ AmazonDynamoDBFullAccess アタッチ済み

Phase G：Lambda関数の作成とコード実装
  ✅ 関数 beReadyFunction 作成完了（Node.js 22.x）
  ✅ 実行ロール BeReadyLambdaRole 設定済み
  ✅ 環境変数 TABLE_NAME = BeReadyData 設定済み
  ✅ index.js にコード貼り付け・Deploy 完了
  ✅ テスト実行で { "ok": true } 確認

Phase H：Function URL の有効化
  ✅ Function URL 作成完了（認証タイプ: NONE）
  ✅ CORS 設定済み（オリジン: *）
  ✅ Function URL をメモ済み
     URL: https://lov5ejwmxbqzci5gagmcrzr3ia0qphjl.lambda-url.ap-northeast-1.on.aws/

Phase I：フロントエンド書き換え
  ✅ CLOUD_API 定数に Function URL を設定
  ✅ storage ヘルパーを書き換え完了（localStorage + DynamoDB 二重書き）
  ✅ login 関数に syncFromCloud() 追加（リロード時の自動復元も対応）

Phase J：動作確認
  ✅ npm start で起動確認
  ✅ Network タブで POST 200 確認
  ✅ DynamoDBコンソールでデータ確認
  □ 別端末でのデータ引き継ぎ確認（任意）

Phase K：コスト管理
  ✅ $5 予算アラート設定完了
```

---

**作成日**：2026年7月10日  
**現在の状態**：Phase E（DynamoDB テーブル作成）から再開  
**参考**：`BE_READY_PLAN.md`（費用概算・スケジュール詳細）
