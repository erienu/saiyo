import csv
import re

# このスクリプトはHRMOSエクスポートから採用ダッシュボード用CSVへの変換を行う。
# セキュリティ上の理由から、氏名・生年月日・性別・郵便番号・住所・レジュメ本文・
# 学校名・会社名などの個人情報列は意図的に一切読み取らない(get()で明示的に
# 指定した列名のみアクセスする)。新しい列をマッピングに追加する際は、
# 個人を特定できる情報を含めないこと。

SRC = "/Users/user/Downloads/応募者情報_選考フロー設定あり_260201-260625.csv"
DST = "/Users/user/Downloads/採用ダッシュボード/converted-applicants.csv"

DATE_RE = re.compile(r"(\d{4})年(\d{1,2})月(\d{1,2})日")


def to_iso(s: str) -> str:
    if not s:
        return ""
    m = DATE_RE.match(s.strip())
    if not m:
        return s
    y, mo, d = m.groups()
    return f"{y}-{int(mo):02d}-{int(d):02d}"

OUT_HEADER = [
    "応募者ID", "ポジション", "応募日", "チャネル", "コスト",
    "現在ステージ", "ステータス", "離脱日", "離脱理由",
    "書類選考_日付", "書類選考_結果",
    "カジュアル面談_日付", "カジュアル面談_面接官", "カジュアル面談_評価", "カジュアル面談_結果",
    "1次面接_日付", "1次面接_面接官", "1次面接_評価", "1次面接_結果",
    "最終面接_日付", "最終面接_面接官", "最終面接_評価", "最終面接_結果",
    "内定_日付", "内定承諾_日付",
]

STATUS_MAP = {
    "入社": "内定承諾",
    "内定": "進行中",
    "選考中": "進行中",
    "新着応募": "進行中",
    "不合格": "離脱",
    "辞退": "離脱",
    "重複応募": "離脱",
}


def get(row, key):
    return (row.get(key) or "").strip()


with open(SRC, "r", encoding="utf-16") as f:
    reader = csv.DictReader(f, delimiter="\t")
    rows = list(reader)

out_rows = []
for r in rows:
    aid = get(r, "応募ID")
    if not aid:
        continue

    position = get(r, "選考ポジション名")
    applied = to_iso(get(r, "応募日"))
    channel = get(r, "応募経路")
    senko_status = get(r, "選考ステータス")
    status = STATUS_MAP.get(senko_status, "進行中")

    out = {h: "" for h in OUT_HEADER}
    out["応募者ID"] = aid
    out["ポジション"] = position
    out["応募日"] = applied
    out["チャネル"] = channel
    out["コスト"] = "0"
    out["ステータス"] = status

    # step1 is always 書類選考
    out["書類選考_日付"] = to_iso(get(r, "1次ステップ実施日"))
    out["書類選考_結果"] = get(r, "1次ステップステータス")

    # steps 2-4 map by stage name, not position
    for n in (2, 3, 4):
        name = get(r, f"{n}次ステップ")
        date = to_iso(get(r, f"{n}次ステップ実施日"))
        result = get(r, f"{n}次ステップステータス")
        if name == "カジュアル面談":
            out["カジュアル面談_日付"] = date
            out["カジュアル面談_結果"] = result
        elif name == "1次面接":
            out["1次面接_日付"] = date
            out["1次面接_結果"] = result
        elif name == "最終面接":
            out["最終面接_日付"] = date
            out["最終面接_結果"] = result

    out["内定_日付"] = to_iso(get(r, "内定日"))
    out["内定承諾_日付"] = to_iso(get(r, "内定承諾日"))

    dropout_date = to_iso(get(r, "辞退日") or get(r, "不合格・重複終了日"))
    out["離脱日"] = dropout_date if status == "離脱" else ""
    reason_cat = get(r, "辞退理由（分類）")
    reason_detail = get(r, "辞退理由（詳細）")
    out["離脱理由"] = (reason_cat + ("：" + reason_detail if reason_detail else "")) if status == "離脱" else ""

    # current stage = furthest stage reached
    stage_order = ["応募", "書類選考", "カジュアル面談", "1次面接", "最終面接", "内定", "内定承諾"]
    current = "応募"
    if senko_status == "入社":
        current = "内定承諾"
    elif senko_status == "内定":
        current = "内定"
    else:
        for s in stage_order:
            col = f"{s}_日付" if s not in ("応募",) else "応募日"
            if out.get(col):
                current = s
    out["現在ステージ"] = current

    out_rows.append(out)

with open(DST, "w", newline="", encoding="utf-8") as f:
    w = csv.DictWriter(f, fieldnames=OUT_HEADER)
    w.writeheader()
    w.writerows(out_rows)

print("converted rows:", len(out_rows))
print("positions:", sorted(set(o["ポジション"] for o in out_rows)))
print("statuses:", sorted(set(o["ステータス"] for o in out_rows)))
