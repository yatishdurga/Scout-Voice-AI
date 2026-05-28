import os
import uuid
import asyncio
import httpx
from datetime import datetime

MOCK_MODE = os.getenv("MOCK_MODE", "true").lower() == "true"
ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY", "")
ELEVENLABS_AGENT_ID = os.getenv("ELEVENLABS_AGENT_ID", "")
ELEVENLABS_PHONE_NUMBER_ID = os.getenv("ELEVENLABS_PHONE_NUMBER_ID", "")

MOCK_TRANSCRIPTS = [
    """Scout AI: Hi, this is Scout AI. We help maintain accurate basketball scouting and recruiting information. I'm calling to quickly verify some team details. Do you have two minutes?
Contact: Sure, go ahead.
Scout AI: Great. Can you confirm your current coaching role and email?
Contact: Yes, I'm still the head coach. Best email is coach@team.com now — the old one is outdated.
Scout AI: Thanks. How would you describe your team's style of play this season?
Contact: We're very fast-paced transition offense, love to push in transition. Defensively we press a lot.
Scout AI: What kind of players do you typically look for?
Contact: Athletic defensive guards who can shoot. We're specifically looking for stretch forwards right now.
Scout AI: Any city or travel considerations players should know?
Contact: We're English-speaking here, strong local community support. Very easy city for foreign players.
Scout AI: Perfect. One last question — any current recruiting priorities or open positions?
Contact: Yes, we need a stretch forward who can knock down threes. Age 20-26 preferred.
Scout AI: That's all I needed. Thank you so much for your time.
Contact: No problem, good luck.""",

    """Scout AI: Hi, this is Scout AI calling to verify your team's current information. Do you have a couple of minutes?
Contact: Yes, who is this again?
Scout AI: Scout AI — we maintain global basketball scouting data. I just need to confirm a few details about your staff.
Contact: OK sure.
Scout AI: Is your contact email still the same?
Contact: Actually no, it changed. The new one is gm@leagueoffice.org.
Scout AI: And is the current coaching staff still in place?
Contact: Head coach is the same. We did bring in a new assistant coach last month though — Marcus Hill.
Scout AI: What are your recruiting priorities for next season?
Contact: We're rebuilding a bit. Looking for young European big men, 19-22 years old, high upside.
Scout AI: Thanks for the update. Have a great day.
Contact: You too.""",

    """Scout AI: Hello, this is Scout AI. We help basketball organizations with data verification. Quick call to check some details — is now okay?
Contact: Make it fast, I'm in practice.
Scout AI: Of course. Still best to reach you at this number?
Contact: Text is better actually. But email me at director@clubbball.eu for official stuff.
Scout AI: Got it. What's the team's current play style focus?
Contact: Half-court offense, very structured. European approach — lots of pick and roll.
Scout AI: Looking for any specific player types?
Contact: Shooters. We always need shooters. Three-point shooting is premium for us.
Scout AI: Perfect. Thanks for your time.
Contact: Sure."""
]


async def trigger_outbound_call(coach_id: int, phone: str, coach_name: str) -> dict:
    conversation_id = f"conv_{uuid.uuid4().hex[:12]}"

    if MOCK_MODE:
        return {
            "conversation_id": conversation_id,
            "status": "queued",
            "mock": True,
        }

    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://api.elevenlabs.io/v1/convai/twilio/outbound-call",
            headers={"xi-api-key": ELEVENLABS_API_KEY},
            json={
                "agent_id": ELEVENLABS_AGENT_ID,
                "agent_phone_number_id": ELEVENLABS_PHONE_NUMBER_ID,
                "to_number": phone,
                "conversation_initiation_client_data": {
                    "dynamic_variables": {
                        "contact_name": coach_name,
                        "coach_id": str(coach_id),
                    }
                },
            },
        )
        response.raise_for_status()
        data = response.json()
        return {
            "conversation_id": data.get("conversation_id", conversation_id),
            "status": "queued",
            "mock": False,
        }


def get_mock_transcript(index: int = 0) -> str:
    return MOCK_TRANSCRIPTS[index % len(MOCK_TRANSCRIPTS)]
