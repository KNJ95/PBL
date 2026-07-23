const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, GetCommand, PutCommand, QueryCommand, DeleteCommand } = require("@aws-sdk/lib-dynamodb");
const client = new DynamoDBClient({ region: "ap-northeast-1" });
const dynamo = DynamoDBDocumentClient.from(client);
const TABLE      = process.env.TABLE_NAME;
const GEMINI_KEY = process.env.GEMINI_API_KEY;
const HEADERS = { "Content-Type": "application/json" };
const res = (code, body) => ({ statusCode: code, headers: HEADERS, body: JSON.stringify(body) });

exports.handler = async (event) => {
  const method = event.requestContext?.http?.method ?? "GET";
  const path   = event.rawPath ?? "/";
  const params = event.queryStringParameters ?? {};
  if (method === "OPTIONS") return res(200, {});
  try {
    // ── Gemini AI ────────────────────────────────────────────────────
    if (method === "POST" && path === "/ai") {
      const body = event.body ? JSON.parse(event.body) : {};
      const { prompt } = body;
      if (!prompt) return res(400, { ok: false, error: "prompt required" });
      const r = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`,
        { method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }) }
      );
      const d = await r.json();
      const text = d.candidates?.[0]?.content?.parts?.[0]?.text ?? "分析結果を取得できませんでした。";
      return res(200, { ok: true, text });
    }
    // ── DynamoDB GET ─────────────────────────────────────────────────
    if (method === "GET") {
      const { userId, dataKey } = params;
      if (!userId) return res(400, { ok: false, error: "userId required" });
      if (dataKey) {
        const r = await dynamo.send(new GetCommand({ TableName: TABLE, Key: { userId, dataKey } }));
        return res(200, { ok: true, data: r.Item ?? null });
      }
      const r = await dynamo.send(new QueryCommand({
        TableName: TABLE,
        KeyConditionExpression: "userId = :uid",
        ExpressionAttributeValues: { ":uid": userId },
      }));
      return res(200, { ok: true, data: r.Items });
    }
    // ── DynamoDB POST ────────────────────────────────────────────────
    if (method === "POST") {
      const body = event.body ? JSON.parse(event.body) : {};
      const { userId, dataKey, payload } = body;
      if (!userId || !dataKey) return res(400, { ok: false, error: "userId and dataKey required" });
      await dynamo.send(new PutCommand({ TableName: TABLE, Item: { userId, dataKey, payload, updatedAt: Date.now() } }));
      return res(200, { ok: true });
    }
    // ── DynamoDB DELETE ──────────────────────────────────────────────
    if (method === "DELETE") {
      const { userId, dataKey } = params;
      if (!userId || !dataKey) return res(400, { ok: false, error: "userId and dataKey required" });
      await dynamo.send(new DeleteCommand({ TableName: TABLE, Key: { userId, dataKey } }));
      return res(200, { ok: true });
    }
    return res(405, { ok: false, error: "Method not allowed" });
  } catch (e) {
    console.error(e);
    return res(500, { ok: false, error: e.message });
  }
};
