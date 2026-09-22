"""Checkpoint atômico para a revisão das questões sem imagem.

Uso interno:
  python scripts/no-image-review-checkpoint.py init
  python scripts/no-image-review-checkpoint.py status
  python scripts/no-image-review-checkpoint.py complete --id ID --decision approved|pending|visual_review [--answer-corrected]
"""

from __future__ import annotations

import argparse
import json
import os
from datetime import datetime, timezone
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
BANK_PATH = ROOT / "content" / "bank.json"
PILOT_REPORT = ROOT / "reports" / "no-image-pilot-20-review.json"
CHECKPOINT = ROOT / "reports" / "no-image-review-progress.json"


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")


def load_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def scope_ids() -> list[str]:
    bank = load_json(BANK_PATH)
    return [
        question["id"]
        for question in bank["questions"]
        if question.get("imageClassification") == "no_image_required"
    ]


def save_atomic(payload: dict) -> None:
    temp = CHECKPOINT.with_suffix(".json.tmp")
    temp.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    os.replace(temp, CHECKPOINT)


def refresh(payload: dict, ids: list[str]) -> dict:
    processed = set(payload["processedIds"])
    remaining = [question_id for question_id in ids if question_id not in processed]
    payload["totalQuestions"] = len(ids)
    payload["processedCount"] = len(processed)
    payload["lastCompletedQuestionId"] = payload["processedIds"][-1] if payload["processedIds"] else None
    payload["nextQuestionId"] = remaining[0] if remaining else None
    payload["approvedCount"] = len(payload["approvedIds"])
    payload["pendingCount"] = len(payload["pendingIds"])
    payload["visualReviewCount"] = len(payload["visualReviewIds"])
    payload["correctedAnswerCount"] = len(payload["correctedAnswerIds"])
    payload["lastUpdatedAt"] = now_iso()
    payload["status"] = "completed" if not remaining else "in_progress"
    return payload


def initialize() -> dict:
    ids = scope_ids()
    if CHECKPOINT.exists():
        payload = load_json(CHECKPOINT)
        if payload.get("scope") != "imageClassification=no_image_required":
            raise SystemExit("Checkpoint existente pertence a outro escopo.")
        return refresh(payload, ids)

    pilot = load_json(PILOT_REPORT)
    processed = [record["id"] for record in pilot["records"]]
    approved = [record["id"] for record in pilot["records"] if record["action"] == "Aprovada"]
    pending = [record["id"] for record in pilot["records"] if record["action"] == "Pendente"]
    visual = [record["id"] for record in pilot["records"] if record["action"] == "Revisão visual"]
    corrected = [
        record["id"]
        for record in pilot["records"]
        if record["answerBefore"] != record["answerInOfficialPdf"]
    ]
    payload = {
        "schemaVersion": 1,
        "scope": "imageClassification=no_image_required",
        "scopeCapturedAt": "2026-09-22",
        "totalQuestions": len(ids),
        "processedCount": 0,
        "processedIds": processed,
        "lastCompletedQuestionId": None,
        "nextQuestionId": None,
        "approvedCount": 0,
        "approvedIds": approved,
        "pendingCount": 0,
        "pendingIds": pending,
        "visualReviewCount": 0,
        "visualReviewIds": visual,
        "correctedAnswerCount": 0,
        "correctedAnswerIds": corrected,
        "lastUpdatedAt": now_iso(),
        "status": "in_progress",
    }
    return refresh(payload, ids)


def complete(question_id: str, decision: str, answer_corrected: bool) -> dict:
    ids = scope_ids()
    payload = initialize()
    if question_id not in ids:
        raise SystemExit(f"Questão fora do escopo: {question_id}")
    if question_id in payload["processedIds"]:
        return payload

    expected = payload.get("nextQuestionId")
    if question_id != expected:
        raise SystemExit(f"Ordem inválida: próxima questão é {expected}, não {question_id}.")

    payload["processedIds"].append(question_id)
    bucket = {
        "approved": "approvedIds",
        "pending": "pendingIds",
        "visual_review": "visualReviewIds",
    }[decision]
    payload[bucket].append(question_id)
    if answer_corrected:
        payload["correctedAnswerIds"].append(question_id)
    refresh(payload, ids)
    save_atomic(payload)
    return payload


def main() -> None:
    parser = argparse.ArgumentParser()
    sub = parser.add_subparsers(dest="command", required=True)
    sub.add_parser("init")
    sub.add_parser("status")
    done = sub.add_parser("complete")
    done.add_argument("--id", required=True)
    done.add_argument("--decision", required=True, choices=["approved", "pending", "visual_review"])
    done.add_argument("--answer-corrected", action="store_true")
    args = parser.parse_args()

    if args.command == "complete":
        payload = complete(args.id, args.decision, args.answer_corrected)
    else:
        payload = initialize()
        if args.command == "init":
            save_atomic(payload)
    print(json.dumps({
        "total": payload["totalQuestions"],
        "processed": payload["processedCount"],
        "last": payload["lastCompletedQuestionId"],
        "next": payload["nextQuestionId"],
        "status": payload["status"],
    }, ensure_ascii=False))


if __name__ == "__main__":
    main()
