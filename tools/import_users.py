"""
Be-Ready ユーザー一括登録スクリプト
使い方:
  python tools/import_users.py                    # users.csv を読み込む
  python tools/import_users.py tools/users.csv   # ファイルを指定
"""

import csv
import hashlib
import json
import sys
import time

try:
    import boto3
except ImportError:
    print("boto3 が必要です。以下を実行してください:")
    print("  pip install boto3")
    sys.exit(1)

TABLE_NAME = "BeReadyData"
REGION     = "ap-northeast-1"

REQUIRED_COLUMNS = {"userId", "name", "role", "projectId", "tempPassword"}
VALID_ROLES      = {"student", "mentor", "admin"}


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()


def import_users(csv_path: str):
    dynamodb = boto3.client("dynamodb", region_name=REGION)

    print(f"\n📂 読み込み: {csv_path}")
    print("-" * 50)

    with open(csv_path, newline="", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)

        # ヘッダー検証
        if not REQUIRED_COLUMNS.issubset(set(reader.fieldnames or [])):
            missing = REQUIRED_COLUMNS - set(reader.fieldnames or [])
            print(f"❌ CSVに必要な列が不足しています: {missing}")
            sys.exit(1)

        count = 0
        errors = []

        for i, row in enumerate(reader, start=2):  # 2行目から（1行目はヘッダー）
            user_id      = row["userId"].strip()
            name         = row["name"].strip()
            role         = row["role"].strip()
            project_id   = row["projectId"].strip()
            temp_password = row["tempPassword"].strip()

            # バリデーション
            if not user_id or not name or not temp_password:
                errors.append(f"行{i}: 必須項目が空です ({row})")
                continue
            if role not in VALID_ROLES:
                errors.append(f"行{i}: role は student/mentor/admin のいずれかにしてください ({role})")
                continue
            if len(temp_password) < 8:
                errors.append(f"行{i}: tempPassword は8文字以上にしてください ({user_id})")
                continue

            profile = {
                "name":         name,
                "role":         role,
                "projectId":    project_id,
                "passwordHash": hash_password(temp_password),
                "isFirstLogin": True,
            }

            try:
                dynamodb.put_item(
                    TableName=TABLE_NAME,
                    Item={
                        "userId":    {"S": user_id},
                        "dataKey":   {"S": "user_profile"},
                        "payload":   {"S": json.dumps(profile, ensure_ascii=False)},
                        "updatedAt": {"N": str(int(time.time() * 1000))},
                    },
                )
                print(f"✅ {user_id:12s} | {name:10s} | {role:8s} | {project_id}")
                count += 1
            except Exception as e:
                errors.append(f"行{i} ({user_id}): DynamoDB エラー - {e}")

    print("-" * 50)
    print(f"\n✨ {count} 件を登録しました")

    if errors:
        print(f"\n⚠️  {len(errors)} 件のエラーがありました:")
        for err in errors:
            print(f"   {err}")


if __name__ == "__main__":
    csv_path = sys.argv[1] if len(sys.argv) > 1 else "tools/users.csv"
    import_users(csv_path)
