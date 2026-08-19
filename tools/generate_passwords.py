"""
users.csv のパスワードをランダム生成するスクリプト
- 既存の userId / name / role / projectId はそのまま保持
- tempPassword のみランダム10文字に置き換え
- 生成したパスワードは users.csv に上書き保存

使い方:
  python tools/generate_passwords.py
"""

import csv
import random
import string
import os

CSV_PATH = os.path.join(os.path.dirname(__file__), "users.csv")

# 紛らわしい文字（0/O, 1/l/I）を除いた文字セット
UPPER  = "ABCDEFGHJKLMNPQRSTUVWXYZ"
LOWER  = "abcdefghjkmnpqrstuvwxyz"
DIGITS = "23456789"

def generate_password(length=10):
    """大文字2・小文字4・数字4 の10文字パスワードを生成"""
    pw = (
        random.choices(UPPER,  k=2) +
        random.choices(LOWER,  k=4) +
        random.choices(DIGITS, k=4)
    )
    random.shuffle(pw)
    return "".join(pw)

def main():
    with open(CSV_PATH, newline="", encoding="utf-8-sig") as f:
        rows = list(csv.DictReader(f))

    print(f"\n🔑 {len(rows)} 件のパスワードを生成します...\n")
    print(f"{'userId':12s} {'role':8s} {'projectId':15s} {'tempPassword'}")
    print("-" * 55)

    for row in rows:
        row["tempPassword"] = generate_password()
        print(f"{row['userId']:12s} {row['role']:8s} {row['projectId']:15s} {row['tempPassword']}")

    # CSV 上書き保存
    fieldnames = ["userId", "name", "role", "projectId", "tempPassword"]
    with open(CSV_PATH, "w", newline="", encoding="utf-8-sig") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

    print(f"\n✅ {CSV_PATH} を更新しました。")
    print("次に以下を実行してDynamoDBへ反映してください:")
    print("  python tools/import_users.py tools/users.csv\n")

if __name__ == "__main__":
    main()
