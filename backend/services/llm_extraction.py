import os
import json
import re
from typing import Optional

MOCK_MODE = os.getenv("MOCK_MODE", "true").lower() == "true"
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")


def _mock_extract(transcript: str) -> dict:
    """Heuristic extraction from transcript text for mock mode."""
    result = {
        "coach_name": None,
        "verified_email": None,
        "team_style": None,
        "ideal_player_profile": None,
        "city_notes": None,
        "recruiting_notes": None,
        "confidence_score": 0.88,
    }

    lines = transcript.lower()

    email_match = re.search(r"[\w.+-]+@[\w-]+\.[a-z]{2,}", transcript)
    if email_match:
        result["verified_email"] = email_match.group(0)
        result["confidence_score"] = min(result["confidence_score"] + 0.04, 0.99)

    if "transition" in lines:
        result["team_style"] = "Fast-paced transition offense"
    elif "half-court" in lines or "pick and roll" in lines:
        result["team_style"] = "Half-court structured offense with pick and roll"
    elif "rebounding" in lines:
        result["team_style"] = "Physical, rebounding-focused play"

    if "stretch forward" in lines or "stretch forwards" in lines:
        result["ideal_player_profile"] = "Athletic defensive guards, stretch forwards"
    elif "big men" in lines:
        result["ideal_player_profile"] = "Young European big men (19-22), high upside"
    elif "shooter" in lines or "shooters" in lines:
        result["ideal_player_profile"] = "Three-point shooters"
    elif "guard" in lines:
        result["ideal_player_profile"] = "Athletic defensive guards"

    if "english-speaking" in lines or "strong local" in lines:
        result["city_notes"] = "English-speaking environment, strong local community support"

    if "stretch forward" in lines and "three" in lines:
        result["recruiting_notes"] = "Seeking stretch forwards with three-point shooting (age 20-26)"
    elif "european big" in lines:
        result["recruiting_notes"] = "Looking for young European big men (19-22), high upside"
    elif "shooter" in lines:
        result["recruiting_notes"] = "Premium on three-point shooters"

    return result


async def extract_from_transcript(transcript: str, coach_name: Optional[str] = None) -> dict:
    if MOCK_MODE:
        result = _mock_extract(transcript)
        if coach_name and not result["coach_name"]:
            result["coach_name"] = coach_name
        return result

    try:
        import httpx

        prompt = f"""You are analyzing a basketball scouting call transcript. Extract structured information.

Transcript:
{transcript}

Return JSON with these fields (null if not mentioned):
- coach_name: string
- verified_email: string
- team_style: string (describe play style)
- ideal_player_profile: string (player types they want)
- city_notes: string (city/lifestyle info for players)
- recruiting_notes: string (specific recruiting needs)
- confidence_score: float 0-1 (how confident you are in extraction quality)

Return only valid JSON, no markdown."""

        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={"Authorization": f"Bearer {OPENAI_API_KEY}"},
                json={
                    "model": "gpt-4o-mini",
                    "messages": [{"role": "user", "content": prompt}],
                    "temperature": 0.1,
                },
                timeout=30,
            )
            response.raise_for_status()
            content = response.json()["choices"][0]["message"]["content"]
            return json.loads(content)
    except Exception as e:
        result = _mock_extract(transcript)
        result["extraction_error"] = str(e)
        return result
