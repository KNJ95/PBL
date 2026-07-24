"""
BeReadyData テーブルから user_profile レコードを削除するスクリプト
（BeReadyUsers への移行後のクリーンアップ用）

使い方:
  python tools/cleanup_user_profiles.py
"""

import json
import sys
import time

try:
    import boto3
except ImportError:
    print("boto3 が必要です: pip install boto3")
    sys.exit(1)

DATA_TABLE = "BeReadyData"
REGION     = "ap-northeast-1"


def cleanup():
    dynamodb = boto3.client("dynamodb", region_name=REGION)

    print(f"\n🔍 {DATA_TABLE} から user_profile を検索中...")
    print("-" * 50)

    items = []
    kwargs = {
        "TableName": DATA_TABLE,
        "FilterExpression": "dataKey = :dk",
        "ExpressionAttributeValues": {":dk": {"S": "user_profile"}},
    }

    while True:
        resp = dynamodb.scan(**kwargs)
        items.extend(resp.get("Items", []))
        if "LastEvaluatedKey" not in resp:
            break
        kwargs["ExclusiveStartKey"] = resp["LastEvaluatedKey"]

    if not items:
        print("✅ user_profile レコードは見つかりませんでした。クリーンアップ不要です。")
        return

    print(f"⚠️  {len(items)} 件の user_profile が BeReadyData に存在します")
    print("\n削除対象:")
    for item in items:
        print(f"  userId={item['userId']['S']}")

    print(f"\n{len(items)} 件を BeReadyData から削除します。よろしいですか？ (yes/no): ", end="")
    answer = input().strip().lower()
    if answer != "yes":
        print("キャンセルしました。")
        return

    deleted = errors = 0
    for item in items:
        try:
            dynamodb.delete_item(
                TableName=DATA_TABLE,
                Key={
                    "userId":  item["userId"],
                    "dataKey": item["dataKey"],
                }
            )
            print(f"🗑️  削除: {item['userId']['S']}")
            deleted += 1
        except Exception as e:
            print(f"❌ エラー: {item['userId']['S']} - {e}")
            errors += 1

    print("-" * 50)
    print(f"\n✨ 削除: {deleted}件 | エラー: {errors}件")
    print("BeReadyData はアプリデータのみになりました。")


if __name__ == "__main__":
    cleanup()
