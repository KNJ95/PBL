"""
既存 DynamoDB ユーザーに initialPasswordHash を追加するパッチスクリプト
- 既存の passwordHash・isFirstLogin は上書きしない
- initialPasswordHash が未設定のユーザーにのみ追加する

使い方:
  python tools/patch_add_initial_hash.py tools/users.csv
"""

import csv
import hashlib
import json
import sys
import time

try:
    import boto3
except ImportError:
    print("boto3 が必要です: pip install boto3")
    sys.exit(1)

TABLE_NAME = "BeReadyUsers"
REGION     = "ap-northeast-1"


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()


def patch_users(csv_path: str):
    dynamodb = boto3.client("dynamodb", region_name=REGION)

    print(f"\n📂 読み込み: {csv_path}")
    print("-" * 60)

    with open(csv_path, newline="", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        updated = skipped = errors = 0

        for row in reader:
            user_id      = row["userId"].strip()
            temp_password = row["tempPassword"].strip()

            # 既存レコードを取得
            try:
                resp = dynamodb.get_item(
                    TableName=TABLE_NAME,
                    Key={
                        "userId":  {"S": user_id},
                        "dataKey": {"S": "user_profile"},
                    }
                )
            except Exception as e:
                print(f"❌ {user_id}: 取得エラー - {e}")
                errors += 1
                continue

            item = resp.get("Item")
            if not item:
                print(f"⚠️  {user_id}: レコードが存在しません（スキップ）")
                skipped += 1
                continue

            # payload を解析
            try:
                profile = json.loads(item["payload"]["S"])
            except Exception:
                print(f"❌ {user_id}: payload のパースに失敗（スキップ）")
                errors += 1
                continue

            # initialPasswordHash が既にある場合はスキップ
            if "initialPasswordHash" in profile:
                print(f"✅ {user_id:12s} | 既に設定済み（スキップ）")
                skipped += 1
                continue

            # initialPasswordHash を追加（既存フィールドはそのまま）
            profile["initialPasswordHash"] = hash_password(temp_password)

            try:
                dynamodb.put_item(
                    TableName=TABLE_NAME,
                    Item={
                        "userId":    {"S": user_id},
                        "dataKey":   {"S": "user_profile"},
                        "payload":   {"S": json.dumps(profile, ensure_ascii=False)},
                        "updatedAt": {"N": str(int(time.time() * 1000))},
                    }
                )
                print(f"🔧 {user_id:12s} | {profile.get('name',''):10s} | initialPasswordHash を追加")
                updated += 1
            except Exception as e:
                print(f"❌ {user_id}: 更新エラー - {e}")
                errors += 1

    print("-" * 60)
    print(f"\n✨ 更新: {updated}件 | スキップ: {skipped}件 | エラー: {errors}件")


if __name__ == "__main__":
    csv_path = sys.argv[1] if len(sys.argv) > 1 else "tools/users.csv"
    patch_users(csv_path)
