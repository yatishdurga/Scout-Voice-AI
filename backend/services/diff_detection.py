from typing import Any


COACH_FIELD_MAP = {
    "verified_email": "email",
    "coach_name": "name",
}

TEAM_FIELD_MAP = {
    "team_style": "play_style",
}

DISPLAY_NAMES = {
    "verified_email": "Email Address",
    "coach_name": "Coach Name",
    "team_style": "Team Play Style",
    "ideal_player_profile": "Ideal Player Profile",
    "city_notes": "City / Lifestyle Notes",
    "recruiting_notes": "Recruiting Priorities",
}


def detect_changes(extracted: dict, coach: Any, team: Any) -> list[dict]:
    """Compare extracted fields against current DB values and return list of diffs."""
    changes = []

    coach_checks = {
        "verified_email": getattr(coach, "email", None),
        "coach_name": getattr(coach, "name", None),
    }

    team_checks = {
        "team_style": getattr(team, "play_style", None) if team else None,
    }

    freeform_fields = ["ideal_player_profile", "city_notes", "recruiting_notes"]

    for key, current_val in coach_checks.items():
        new_val = extracted.get(key)
        if new_val and new_val != current_val:
            changes.append({
                "field": key,
                "display_name": DISPLAY_NAMES.get(key, key),
                "old_value": current_val or "(empty)",
                "new_value": new_val,
                "entity": "coach",
                "confidence": _field_confidence(key, extracted),
            })

    for key, current_val in team_checks.items():
        new_val = extracted.get(key)
        if new_val and new_val != current_val:
            changes.append({
                "field": key,
                "display_name": DISPLAY_NAMES.get(key, key),
                "old_value": current_val or "(empty)",
                "new_value": new_val,
                "entity": "team",
                "confidence": _field_confidence(key, extracted),
            })

    for key in freeform_fields:
        new_val = extracted.get(key)
        if new_val:
            changes.append({
                "field": key,
                "display_name": DISPLAY_NAMES.get(key, key),
                "old_value": "(no prior data)",
                "new_value": new_val,
                "entity": "notes",
                "confidence": _field_confidence(key, extracted),
            })

    return changes


def _field_confidence(field: str, extracted: dict) -> str:
    score = extracted.get("confidence_score", 0.8)
    email_exact = field == "verified_email" and "@" in (extracted.get(field) or "")
    if email_exact or score >= 0.9:
        return "high"
    if score >= 0.75:
        return "medium"
    return "low"
