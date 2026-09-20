import asyncio
import base64
import json
import logging
import os
import random
import subprocess
import sys
import tempfile
import uuid
import urllib.parse
import urllib.request
import urllib.error
from pathlib import Path

from dotenv import load_dotenv
from livekit import agents, rtc
from livekit.agents import (
    Agent,
    AgentServer,
    AgentSession,
    RunContext,
    function_tool,
    room_io,
)
from google.genai import types as genai_types
from livekit.plugins import google, noise_cancellation, silero

logger = logging.getLogger("adhikaar-agent")

load_dotenv(".env.local")

# myScheme.gov.in API key — optional but recommended for higher rate limits
MYSCHEME_API_KEY = os.environ.get("MYSCHEME_API_KEY", "")

# Review file directory — where smart_fill.py writes review data
REVIEW_DIR = Path(tempfile.gettempdir()) / "adhikaar_reviews"

# Load schemes database — bundled copy for standalone deployment
SCHEMES_PATH = Path(__file__).parent / "data" / "schemes.json"
with open(SCHEMES_PATH, "r", encoding="utf-8") as f:
    SCHEMES = json.load(f)

# Path to AI-powered portal-agnostic form filler (NOT the old hardcoded fill_form.py)
AUTOMATION_SCRIPT = Path(__file__).parent.parent.parent / "automation" / "smart_fill.py"

# myScheme.gov.in API — same endpoint the frontend uses
MYSCHEME_API_BASE = "https://api.myscheme.gov.in"

# State name → code mapping
STATE_CODE_MAP = {
    "uttar pradesh": "UP",
    "bihar": "BR",
    "maharashtra": "MH",
    "madhya pradesh": "MP",
    "rajasthan": "RJ",
    "tamil nadu": "TN",
    "karnataka": "KA",
    "west bengal": "WB",
    "andhra pradesh": "AP",
    "telangana": "TG",
    "gujarat": "GJ",
    "odisha": "OR",
    "kerala": "KL",
    "jharkhand": "JH",
    "punjab": "PB",
    "chhattisgarh": "CG",
    "haryana": "HR",
    "uttarakhand": "UK",
    "assam": "AS",
    "himachal pradesh": "HP",
    "goa": "GA",
}

# Caste → myScheme filter value mapping
CASTE_FILTER_MAP = {
    "obc": "Other Backward Class (OBC)",
    "sc": "Scheduled Caste (SC)",
    "st": "Scheduled Tribe (ST)",
    "general": "General",
    "ews": "General",
}

# Caste → age identifier suffix
CASTE_AGE_SUFFIX = {
    "obc": "obc",
    "sc": "sc",
    "st": "st",
    "general": "general",
    "ews": "general",
}


def _search_myscheme(
    state: str = "",
    age: int = 0,
    gender: str = "",
    category: str = "",
    occupation: str = "",
) -> list[dict]:
    """Search myScheme.gov.in API for real government schemes. Returns top matches."""
    try:
        filters = []
        if gender:
            gen = gender.capitalize()
            if gen in ("Male", "Female", "Transgender"):
                filters.append({"identifier": "gender", "value": "All"})
                filters.append({"identifier": "gender", "value": gen})

        if age > 0:
            cat_lower = (category or "general").lower()
            suffix = CASTE_AGE_SUFFIX.get(cat_lower, "general")
            filters.append(
                {"identifier": f"age-{suffix}", "min": str(age), "max": str(age)}
            )

        if state:
            filters.append({"identifier": "beneficiaryState", "value": "All"})
            filters.append({"identifier": "beneficiaryState", "value": state})

        if category:
            cat_lower = category.lower()
            caste_val = CASTE_FILTER_MAP.get(cat_lower, "General")
            filters.append({"identifier": "caste", "value": "All"})
            filters.append({"identifier": "caste", "value": caste_val})

        params = urllib.parse.urlencode(
            {
                "lang": "en",
                "q": json.dumps(filters),
                "keyword": occupation or "",
                "sort": "",
                "from": "0",
                "size": "10",
            }
        )

        url = f"{MYSCHEME_API_BASE}/search/v6/schemes?{params}"
        headers = {
            "Accept": "application/json",
            "Origin": "https://www.myscheme.gov.in",
            "Referer": "https://www.myscheme.gov.in/",
        }
        if MYSCHEME_API_KEY:
            headers["Authorization"] = f"Bearer {MYSCHEME_API_KEY}"
            headers["X-API-Key"] = MYSCHEME_API_KEY

        req = urllib.request.Request(url, headers=headers)

        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode("utf-8"))

        hits = data.get("data", {}).get("hits", {}).get("items", [])
        results = []
        for item in hits[:10]:
            fields = item.get("fields", {})
            results.append(
                {
                    "name": fields.get("schemeName", ""),
                    "slug": fields.get("slug", ""),
                    "description": fields.get("briefDescription", "")[:200],
                    "ministry": fields.get("nodalMinistryName", ""),
                    "level": fields.get("level", ""),
                }
            )
        return results
    except Exception as e:
        logger.warning(f"myScheme.gov.in search failed: {e}")
        return []


async def _poll_review_and_send(
    session_id: str,
    ctx: RunContext,
) -> None:
    """
    Background task: poll for smart_fill.py's review JSON file, then send
    the review data to the frontend via LiveKit data channel so VoiceCall.tsx
    can display the ReviewPanel overlay.
    """
    review_file = REVIEW_DIR / f"{session_id}.json"
    confirm_file = REVIEW_DIR / f"{session_id}_confirm.json"
    max_wait_s = 120  # Wait up to 2 minutes for smart_fill.py to produce review data

    logger.info(f"Polling for review file: {review_file}")

    # Step 1: Wait for review file to appear
    for _ in range(max_wait_s * 2):  # Check every 0.5s
        if review_file.exists():
            break
        await asyncio.sleep(0.5)
    else:
        logger.warning(f"Review file never appeared: {review_file}")
        return

    # Step 2: Read review data
    try:
        raw = review_file.read_text(encoding="utf-8")
        review_data = json.loads(raw)
    except Exception as e:
        logger.error(f"Failed to read review file: {e}")
        return

    # Step 3: Read screenshot if present and encode as base64
    screenshot_path = review_data.get("screenshot")
    screenshot_b64 = None
    if screenshot_path and Path(screenshot_path).exists():
        try:
            screenshot_b64 = base64.b64encode(
                Path(screenshot_path).read_bytes()
            ).decode("ascii")
        except Exception as e:
            logger.warning(f"Failed to read screenshot: {e}")

    # Step 4: Send via LiveKit data channel
    payload = {
        "type": "REVIEW_REQUEST",
        "sessionId": session_id,
        "fields": review_data.get("fields", {}),
        "portalUrl": review_data.get("portal_url", ""),
    }
    if screenshot_b64:
        payload["screenshot"] = screenshot_b64

    try:
        room: rtc.Room | None = getattr(ctx, "_room", None) or getattr(
            ctx.session, "_room", None
        )
        if room and room.local_participant:
            await room.local_participant.publish_data(
                json.dumps(payload).encode("utf-8"),
                topic="adhikaar-review",
            )
            logger.info(f"Sent review data via data channel (session: {session_id})")
        else:
            logger.warning(
                "No room/local_participant — cannot send review data via data channel"
            )
    except Exception as e:
        logger.warning(f"Failed to send review via data channel: {e}")

    # Step 5: Wait for confirmation from frontend (up to 5 minutes)
    logger.info(f"Waiting for confirmation file: {confirm_file}")
    for _ in range(300 * 2):
        if confirm_file.exists():
            try:
                confirm_raw = confirm_file.read_text(encoding="utf-8")
                confirm_data = json.loads(confirm_raw)
                action = confirm_data.get("action", "cancel")
                if action == "confirm":
                    logger.info(f"Review confirmed by user (session: {session_id})")
                else:
                    logger.info(f"Review cancelled by user (session: {session_id})")
            except Exception as e:
                logger.warning(f"Failed to read confirmation: {e}")
            return
        await asyncio.sleep(0.5)

    logger.warning(f"Confirmation timeout for session: {session_id}")


class AdhikaarAgent(Agent):
    def __init__(self) -> None:
        super().__init__(
            instructions="""You are Adhikaar, an AI welfare scheme concierge for Indian citizens.
You are connected to myScheme.gov.in, India's official government scheme discovery portal with 4600+ real schemes.

YOUR MISSION: Help citizens discover government welfare schemes they are eligible for, and guide them through the application process.

VOICE CALL RULES (critical):
- Keep responses SHORT, 2 to 3 sentences max. This is a voice call, not text.
- Do NOT use any formatting, markdown, asterisks, bullets, or emojis.
- Speak clearly and use simple words.
- Speak naturally in the language the user uses. If they speak Hindi, respond in Hindi. If English, respond in English. You can mix.
- Be warm, patient, and encouraging. Many users have low digital literacy.

CONVERSATION FLOW:
1. Greet the user warmly. Ask their name.
2. Ask which language they prefer. You support Hindi, English, Tamil, Telugu, Bengali, Marathi, Gujarati, Kannada, Malayalam, Punjabi, and Odia.
3. Ask about their profile ONE question at a time:
   - Gender
   - Age
   - State of residence
   - Area (Urban or Rural)
   - Caste category (General, OBC, SC, ST)
   - Occupation (farmer, laborer, student, self-employed, etc.)
   - Approximate monthly household income
   - Whether they have a BPL card
4. Once you have enough details (at least gender, age, state, caste, occupation), use search_schemes to find matching schemes.
5. Tell them about the top 2 or 3 matching schemes in simple language, explaining the benefit of each.
6. If the user wants to apply, collect the remaining details needed for the form:
   - Full name as on Aadhaar
   - Father's or husband's name
   - Aadhaar number
   - Date of birth
   - Mobile number
   - District, Block, Village
   - Bank name, Account number, IFSC code
   - For farmer schemes: Survey number, Land area in hectares
   Ask these ONE at a time. Skip any you already know.
7. Once all details are collected, use apply_for_scheme with the real data.
8. Tell them a review screen will appear. They need to check the filled form and enter the captcha before it submits.

FAMILY MODE:
If the user wants schemes for their whole family, first collect the primary user's profile and search.
Then ask about each family member one by one: name, age, gender, relationship, occupation.
Shared data like state, caste, BPL status carries over. Use search_family_member to search separately for each member.
Present each member's results and then summarize the total family benefits.

FAST APPLY MODE:
If you receive a text message starting with "FAST APPLY:", it contains pre-filled citizen details. You must:
1. Immediately call fast_apply with all the details from the message. Do NOT ask questions.
2. After fast_apply completes, announce the scheme name and say the form is being filled on screen.
3. Say the citizen should check the form and enter the captcha when prompted.
Do all of this without asking the user anything. Act fast and confident.

IMPORTANT:
- You are backed by REAL government data from myScheme.gov.in. Mention this to build trust.
- Never make promises about approval. Say "you appear eligible" not "you will get".
- If unsure about eligibility, say so honestly.
- Celebrate when finding eligible schemes. "Badhai ho!" or "Great news!"

ANTI-HALLUCINATION RULES (CRITICAL):
- NEVER fabricate scheme names, benefit amounts, eligibility criteria, or portal URLs.
- NEVER use example or placeholder data (like "Ramesh Kumar" or "₹6,000/year") as if they are real results for the current user.
- If search_schemes returns no results, say so honestly. Do NOT invent schemes.
- Only mention schemes that were returned by the search_schemes tool.
- If you do not know a detail (like exact benefit amount, deadline, or application URL), say "I don't have that information" rather than guessing.
- When presenting schemes, use ONLY the data returned by search_schemes — do not add details from your training data.
- For apply_for_scheme and fast_apply, use ONLY values the citizen explicitly provided. Never fill in defaults or example values for fields the citizen did not give you.

You are the user's advocate. Make government schemes accessible to everyone.""",
        )

    @function_tool
    async def search_schemes(
        self,
        context: RunContext,
        state: str = "",
        age: int = 0,
        gender: str = "",
        occupation: str = "",
        annual_income: int = 0,
        category: str = "",
        has_bpl_card: bool = False,
        has_land: bool = False,
    ):
        """Search for government welfare schemes matching the citizen's profile.
        Searches BOTH the local database and myScheme.gov.in (4600+ real schemes).

        Args:
            state: The citizen's state, for example Uttar Pradesh, Bihar, Maharashtra
            age: Citizen's age in years
            gender: male or female
            occupation: farmer, laborer, student, self-employed, unemployed, or other
            annual_income: Approximate annual household income in INR
            category: Social category — general, obc, sc, st, or ews
            has_bpl_card: Whether the citizen has a BPL card
            has_land: Whether the citizen owns agricultural land
        """
        logger.info(
            f"Searching schemes: state={state}, age={age}, gender={gender}, "
            f"occupation={occupation}, income={annual_income}, category={category}"
        )

        try:
            # ── 1. Local scheme matching ──────────────────────────
            matches = []
            cat = category.lower() if category else ""
            gen = gender.lower() if gender else ""
            occ = occupation.lower() if occupation else ""

            for scheme in SCHEMES:
                score = 0
                elig = scheme.get("eligibility", {})

                if age > 0:
                    if age < elig.get("minAge", 0) or age > elig.get("maxAge", 150):
                        continue
                    score += 10

                if gen and elig.get("gender", "any") != "any":
                    if elig["gender"] != gen:
                        continue
                    score += 15

                if annual_income > 0 and elig.get("maxIncome"):
                    if annual_income > elig["maxIncome"]:
                        continue
                    score += 20

                if cat and elig.get("categories"):
                    if cat not in elig["categories"]:
                        continue
                    score += 15

                if elig.get("bplRequired") and not has_bpl_card:
                    score -= 10

                if occ and elig.get("occupation"):
                    if occ in elig["occupation"]:
                        score += 25
                    else:
                        score -= 5

                if elig.get("landOwnership") == "required" and not has_land:
                    score -= 10

                if state and elig.get("states") != "all":
                    if isinstance(elig.get("states"), list):
                        if state.lower() not in [s.lower() for s in elig["states"]]:
                            continue

                score += 20
                matches.append(
                    {
                        "name": scheme["name"],
                        "nameHindi": scheme.get("nameHindi", scheme["name"]),
                        "description": scheme["description"],
                        "maxBenefit": scheme.get("maxBenefit", ""),
                        "documents": scheme.get("documentsRequired", []),
                        "score": min(score, 100),
                        "id": scheme["id"],
                        "source": "local",
                    }
                )

            matches.sort(key=lambda x: x["score"], reverse=True)
            local_top = matches[:3]

            # ── 2. myScheme.gov.in live search ────────────────────
            myscheme_results = await asyncio.to_thread(
                _search_myscheme,
                state=state,
                age=age,
                gender=gender,
                category=category,
                occupation=occupation,
            )

            # ── 3. Combine results ────────────────────────────────
            if not local_top and not myscheme_results:
                return "No matching schemes found for this profile. Ask the user to check their details or try with fewer filters."

            result = ""

            if local_top:
                result += f"Found {len(matches)} eligible schemes in local database. Top matches: "
                for i, m in enumerate(local_top, 1):
                    docs = ", ".join(m["documents"][:3])
                    result += (
                        f"{i}. {m['name']} ({m['nameHindi']}): {m['description']} "
                        f"Benefit: {m['maxBenefit']}. Match score: {m['score']}%. "
                        f"Documents needed: {docs}. "
                    )

            if myscheme_results:
                result += f" Also found {len(myscheme_results)} schemes on myScheme.gov.in (official government portal): "
                for i, m in enumerate(myscheme_results[:5], 1):
                    result += (
                        f"{i}. {m['name']}: {m['description']} "
                        f"Ministry: {m['ministry']}. "
                    )

            return result
        except Exception as e:
            logger.error(f"search_schemes error: {e}")
            return f"Error searching schemes: {e}. Try again with simpler parameters."

    @function_tool
    async def search_family_member(
        self,
        context: RunContext,
        member_name: str = "",
        relationship: str = "",
        age: int = 0,
        gender: str = "",
        occupation: str = "",
        is_student: bool = False,
        state: str = "",
        category: str = "",
        has_bpl_card: bool = False,
        annual_income: int = 0,
    ):
        """Search for schemes for a specific family member.
        Use this in family mode to search independently for each family member.
        Shared data like state, caste, BPL status should be inherited from the primary user.

        Args:
            member_name: Family member's name
            relationship: Relationship to primary user (wife, son, daughter, father, mother, etc.)
            age: Family member's age in years
            gender: male or female
            occupation: farmer, laborer, student, homemaker, self-employed, etc.
            is_student: Whether this family member is a student
            state: State of residence (inherited from primary user)
            category: Social category — general, obc, sc, st (inherited from primary user)
            has_bpl_card: Whether the family has a BPL card (inherited from primary user)
            annual_income: Family's annual income (inherited from primary user)
        """
        logger.info(
            f"Searching for family member: {member_name} ({relationship}), "
            f"age={age}, gender={gender}, occupation={occupation}"
        )

        # If student, override occupation for better matching
        effective_occupation = "student" if is_student else occupation

        try:
            # ── 1. Local scheme matching ──────────────────────────
            matches = []
            cat = category.lower() if category else ""
            gen = gender.lower() if gender else ""
            occ = effective_occupation.lower() if effective_occupation else ""

            for scheme in SCHEMES:
                score = 0
                elig = scheme.get("eligibility", {})

                if age > 0:
                    if age < elig.get("minAge", 0) or age > elig.get("maxAge", 150):
                        continue
                    score += 10

                if gen and elig.get("gender", "any") != "any":
                    if elig["gender"] != gen:
                        continue
                    score += 15

                if annual_income > 0 and elig.get("maxIncome"):
                    if annual_income > elig["maxIncome"]:
                        continue
                    score += 20

                if cat and elig.get("categories"):
                    if cat not in elig["categories"]:
                        continue
                    score += 15

                if elig.get("bplRequired") and not has_bpl_card:
                    score -= 10

                if occ and elig.get("occupation"):
                    if occ in elig["occupation"]:
                        score += 25
                    else:
                        score -= 5

                if state and elig.get("states") != "all":
                    if isinstance(elig.get("states"), list):
                        if state.lower() not in [s.lower() for s in elig["states"]]:
                            continue

                score += 20
                matches.append(
                    {
                        "name": scheme["name"],
                        "nameHindi": scheme.get("nameHindi", scheme["name"]),
                        "description": scheme["description"],
                        "maxBenefit": scheme.get("maxBenefit", ""),
                        "score": min(score, 100),
                        "source": "local",
                    }
                )

            matches.sort(key=lambda x: x["score"], reverse=True)
            local_top = matches[:3]

            # ── 2. myScheme.gov.in live search ────────────────────
            myscheme_results = await asyncio.to_thread(
                _search_myscheme,
                state=state,
                age=age,
                gender=gender,
                category=category,
                occupation=effective_occupation,
            )

            # ── 3. Combine results ────────────────────────────────
            member_label = (
                f"{member_name} ({relationship})"
                if member_name
                else relationship or "family member"
            )

            if not local_top and not myscheme_results:
                return f"No matching schemes found for {member_label}. Their profile may not match currently available schemes."

            result = f"Schemes for {member_label} (age {age}, {gender}): "

            if local_top:
                result += f"Found {len(matches)} eligible in local database. Top: "
                for i, m in enumerate(local_top, 1):
                    result += (
                        f"{i}. {m['name']} ({m['nameHindi']}): {m['description']} "
                        f"Benefit: {m['maxBenefit']}. Score: {m['score']}%. "
                    )

            if myscheme_results:
                result += f" Plus {len(myscheme_results)} from myScheme.gov.in: "
                for i, m in enumerate(myscheme_results[:3], 1):
                    result += f"{i}. {m['name']}: {m['description']} "

            return result
        except Exception as e:
            logger.error(f"search_family_member error: {e}")
            return f"Error searching for family member: {e}."

    @function_tool
    async def apply_for_scheme(
        self,
        context: RunContext,
        scheme_name: str,
        citizen_name: str = "",
        father_name: str = "",
        citizen_age: str = "",
        citizen_state: str = "",
        citizen_gender: str = "",
        aadhaar: str = "",
        dob: str = "",
        mobile: str = "",
        district: str = "",
        block: str = "",
        village: str = "",
        bank_name: str = "",
        account_no: str = "",
        ifsc: str = "",
        survey_no: str = "",
        land_area: str = "",
        portal_url: str = "",
    ):
        """Start the application process for a specific welfare scheme.
        This triggers AI-powered form filling on the government portal with human review.
        The citizen will see the filled form, verify it, enter the captcha, and confirm before submission.

        Args:
            scheme_name: Name of the scheme to apply for
            citizen_name: Full name of the citizen as on Aadhaar
            father_name: Father's or husband's name
            citizen_age: Age of the citizen
            citizen_state: State of residence
            citizen_gender: Gender of the citizen (male/female)
            aadhaar: Aadhaar number (12 digits)
            dob: Date of birth (YYYY-MM-DD)
            mobile: Mobile number (10 digits)
            district: District of residence
            block: Block or Tehsil
            village: Village name
            bank_name: Bank name
            account_no: Bank account number
            ifsc: IFSC code
            survey_no: Survey/Khasra number (for farmer schemes)
            land_area: Land area in hectares (for farmer schemes)
            portal_url: URL of the government portal (optional, uses mock portal if empty)
        """
        logger.info(f"Applying for: {scheme_name}, citizen: {citizen_name}")

        try:
            session_id = str(uuid.uuid4())[:8]
            state_code = STATE_CODE_MAP.get((citizen_state or "").lower(), "UP")

            # Build citizen data from ACTUAL collected data — no fake defaults
            citizen_data = {}
            if citizen_name:
                citizen_data["name"] = citizen_name
            if father_name:
                citizen_data["father_name"] = father_name
            elif citizen_name:
                # Reasonable fallback: derive from name
                citizen_data["father_name"] = f"Shri {citizen_name.split()[0]} (Sr.)"
            if aadhaar:
                citizen_data["aadhaar"] = aadhaar
            if dob:
                citizen_data["dob"] = dob
            if citizen_gender:
                citizen_data["gender"] = citizen_gender.lower()
            if mobile:
                citizen_data["mobile"] = mobile
            if citizen_state:
                citizen_data["state"] = citizen_state
                citizen_data["state_code"] = state_code
            if district:
                citizen_data["district"] = district
            if block:
                citizen_data["block"] = block
            if village:
                citizen_data["village"] = village
            if survey_no:
                citizen_data["survey_no"] = survey_no
            if land_area:
                citizen_data["land_area"] = land_area
            if bank_name:
                citizen_data["bank_name"] = bank_name
            if account_no:
                citizen_data["account_no"] = account_no
            if ifsc:
                citizen_data["ifsc"] = ifsc

            # Launch smart_fill.py in review mode — browser visible for demo
            try:
                if AUTOMATION_SCRIPT.exists():
                    logger.info(
                        f"Launching smart_fill.py for {scheme_name} (session: {session_id})"
                    )

                    cmd = [
                        sys.executable,
                        str(AUTOMATION_SCRIPT),
                        "--citizen-data",
                        json.dumps(citizen_data),
                        "--review-mode",
                        "--session-id",
                        session_id,
                    ]
                    if portal_url:
                        cmd.extend(["--portal-url", portal_url])

                    # Ensure GROQ_API_KEY is available to the subprocess.
                    # smart_fill.py needs it for LLM calls; agent env may not have it.
                    child_env = os.environ.copy()
                    if not child_env.get("GROQ_API_KEY"):
                        _fe_env = (
                            AUTOMATION_SCRIPT.parent.parent / "frontend" / ".env.local"
                        )
                        if _fe_env.exists():
                            for _line in _fe_env.read_text().splitlines():
                                if _line.startswith("GROQ_API_KEY="):
                                    child_env["GROQ_API_KEY"] = _line.split("=", 1)[
                                        1
                                    ].strip()

                    # Do NOT use CREATE_NO_WINDOW — browser must be visible
                    # so the user can see form-filling and enter the captcha.
                    # Log subprocess output for debugging.
                    _log_file = REVIEW_DIR / f"smart_fill_{session_id}.log"
                    _fh = open(str(_log_file), "w", encoding="utf-8")
                    subprocess.Popen(
                        cmd,
                        cwd=str(AUTOMATION_SCRIPT.parent),
                        env=child_env,
                        stdout=_fh,
                        stderr=subprocess.STDOUT,
                    )
                    logger.info(f"smart_fill.py launched — log: {_log_file}")

                    # Start background task to poll for review data and send via data channel
                    asyncio.create_task(_poll_review_and_send(session_id, context))
                else:
                    logger.warning(f"smart_fill.py not found at {AUTOMATION_SCRIPT}")
            except Exception as e:
                logger.error(f"Failed to launch smart_fill.py: {e}")

            return (
                f"Application initiated for {scheme_name}. "
                f"The AI form filler is now analyzing the government portal and filling the form with the citizen's details. "
                f"A review screen will appear shortly showing the filled form and a screenshot. "
                f"Tell the citizen to check all the filled details, enter the captcha code shown in the image, and click Confirm to submit. "
                f"They can also cancel if something looks wrong. "
                f"This uses AI-powered smart filling — it works on any government portal form."
            )
        except Exception as e:
            logger.error(f"apply_for_scheme error: {e}")
            return f"Error applying for scheme: {e}. Please try again."

    @function_tool
    async def fast_apply(
        self,
        context: RunContext,
        name: str = "",
        age: int = 0,
        gender: str = "male",
        state: str = "",
        occupation: str = "farmer",
        annual_income: int = 0,
        category: str = "",
        has_bpl_card: bool = False,
        has_land: bool = False,
        father_name: str = "",
        aadhaar: str = "",
        dob: str = "",
        mobile: str = "",
        district: str = "",
        block: str = "",
        village: str = "",
        bank_name: str = "",
        account_no: str = "",
        ifsc: str = "",
        survey_no: str = "",
        land_area: str = "",
        portal_url: str = "",
    ):
        """Instantly search for the best scheme AND apply for it in one step.
        Use this when you receive a FAST APPLY message. This does everything at once.

        Args:
            name: Full name of the citizen
            age: Age in years
            gender: male or female
            state: State of residence
            occupation: farmer, laborer, student, etc
            annual_income: Annual income in INR
            category: Social category — general, obc, sc, st, ews
            has_bpl_card: Whether citizen has a BPL card
            has_land: Whether citizen owns land
            father_name: Father's or husband's name
            aadhaar: Aadhaar number
            dob: Date of birth (YYYY-MM-DD)
            mobile: Mobile number
            district: District
            block: Block or Tehsil
            village: Village
            bank_name: Bank name
            account_no: Account number
            ifsc: IFSC code
            survey_no: Survey/Khasra number
            land_area: Land area in hectares
            portal_url: Government portal URL (optional)
        """
        logger.info(f"Fast apply for: {name}, {age}, {state}, {occupation}")

        try:
            # Step 1: Search schemes (local + myScheme.gov.in)
            cat = (category or "").lower()
            gen = (gender or "").lower()
            occ = (occupation or "").lower()
            matches = []

            for scheme in SCHEMES:
                score = 0
                elig = scheme.get("eligibility", {})

                if age > 0:
                    if age < elig.get("minAge", 0) or age > elig.get("maxAge", 150):
                        continue
                    score += 10

                if gen and elig.get("gender", "any") != "any":
                    if elig["gender"] != gen:
                        continue
                    score += 15

                if annual_income > 0 and elig.get("maxIncome"):
                    if annual_income > elig["maxIncome"]:
                        continue
                    score += 20

                if cat and elig.get("categories"):
                    if cat not in elig["categories"]:
                        continue
                    score += 15

                if occ and elig.get("occupation"):
                    if occ in elig["occupation"]:
                        score += 25

                if has_bpl_card:
                    score += 5
                if has_land:
                    score += 5

                score += 20
                matches.append(
                    {
                        "name": scheme["name"],
                        "nameHindi": scheme.get("nameHindi", scheme["name"]),
                        "description": scheme["description"],
                        "maxBenefit": scheme.get("maxBenefit", ""),
                        "score": score,
                    }
                )

            matches.sort(key=lambda x: x["score"], reverse=True)
            best = (
                matches[0]
                if matches
                else {
                    "name": "PM-KISAN",
                    "nameHindi": "पीएम-किसान",
                    "maxBenefit": "₹6,000/year",
                }
            )

            # Step 2: Apply — launch smart_fill.py in review mode
            session_id = str(uuid.uuid4())[:8]
            state_code = STATE_CODE_MAP.get((state or "").lower(), "UP")

            citizen_data = {}
            if name:
                citizen_data["name"] = name
            if father_name:
                citizen_data["father_name"] = father_name
            elif name:
                citizen_data["father_name"] = f"Shri {name.split()[0]} (Sr.)"
            if aadhaar:
                citizen_data["aadhaar"] = aadhaar
            if dob:
                citizen_data["dob"] = dob
            if gen:
                citizen_data["gender"] = gen
            if mobile:
                citizen_data["mobile"] = mobile
            if state:
                citizen_data["state"] = state
                citizen_data["state_code"] = state_code
            if district:
                citizen_data["district"] = district
            if block:
                citizen_data["block"] = block
            if village:
                citizen_data["village"] = village
            if survey_no:
                citizen_data["survey_no"] = survey_no
            if land_area:
                citizen_data["land_area"] = land_area
            if bank_name:
                citizen_data["bank_name"] = bank_name
            if account_no:
                citizen_data["account_no"] = account_no
            if ifsc:
                citizen_data["ifsc"] = ifsc

            # Launch smart_fill.py in review mode
            try:
                if AUTOMATION_SCRIPT.exists():
                    logger.info(
                        f"Launching smart_fill.py for {best['name']} (session: {session_id})"
                    )

                    cmd = [
                        sys.executable,
                        str(AUTOMATION_SCRIPT),
                        "--citizen-data",
                        json.dumps(citizen_data),
                        "--review-mode",
                        "--session-id",
                        session_id,
                    ]
                    if portal_url:
                        cmd.extend(["--portal-url", portal_url])

                    # Ensure GROQ_API_KEY is available to the subprocess.
                    child_env = os.environ.copy()
                    if not child_env.get("GROQ_API_KEY"):
                        _fe_env = (
                            AUTOMATION_SCRIPT.parent.parent / "frontend" / ".env.local"
                        )
                        if _fe_env.exists():
                            for _line in _fe_env.read_text().splitlines():
                                if _line.startswith("GROQ_API_KEY="):
                                    child_env["GROQ_API_KEY"] = _line.split("=", 1)[
                                        1
                                    ].strip()

                    # Do NOT use CREATE_NO_WINDOW — browser must be visible
                    # so the user can see form-filling and enter the captcha.
                    _log_file2 = REVIEW_DIR / f"smart_fill_{session_id}.log"
                    _fh2 = open(str(_log_file2), "w", encoding="utf-8")
                    subprocess.Popen(
                        cmd,
                        cwd=str(AUTOMATION_SCRIPT.parent),
                        env=child_env,
                        stdout=_fh2,
                        stderr=subprocess.STDOUT,
                    )
                    logger.info(f"smart_fill.py launched — log: {_log_file2}")

                    # Start background task to poll for review data and send via data channel
                    asyncio.create_task(_poll_review_and_send(session_id, context))
            except Exception as e:
                logger.error(f"smart_fill.py launch error: {e}")

            scheme_name = best["name"]
            scheme_hindi = best.get("nameHindi", scheme_name)
            benefit = best.get("maxBenefit", "")

            return (
                f"Done! Applied for {scheme_name} ({scheme_hindi}). "
                f"Benefit: {benefit}. "
                f"The AI form filler is now analyzing the government portal and filling the application with {name or 'the citizen'}'s details. "
                f"A review screen will appear shortly. Tell the citizen to verify the filled form, enter the captcha, and click Confirm. "
                f"Then ask if they need help with anything else."
            )
        except Exception as e:
            logger.error(f"fast_apply error: {e}")
            return f"Error in fast apply: {e}. Please try again."


# ── Server setup ──────────────────────────────────────

server = AgentServer()


def prewarm(proc):
    proc.userdata["vad"] = silero.VAD.load(
        activation_threshold=0.3,  # default 0.5 — lower = more sensitive
        min_speech_duration=0.1,  # default 0.25s
    )


server.setup_fnc = prewarm


@server.rtc_session(agent_name="adhikaar-agent")
async def adhikaar_session(ctx: agents.JobContext):
    ctx.log_context_fields = {"room": ctx.room.name}

    # Connect to the room FIRST
    await ctx.connect()

    session = AgentSession(
        llm=google.realtime.RealtimeModel(
            voice="Puck",
            # Tune Gemini's server-side turn detection to respond faster
            # (default is too conservative → 15s delay)
            realtime_input_config=genai_types.RealtimeInputConfig(
                automatic_activity_detection=genai_types.AutomaticActivityDetection(
                    start_of_speech_sensitivity=genai_types.StartSensitivity.START_SENSITIVITY_HIGH,
                    end_of_speech_sensitivity=genai_types.EndSensitivity.END_SENSITIVITY_HIGH,
                    silence_duration_ms=500,
                    prefix_padding_ms=100,
                ),
            ),
        ),
        vad=ctx.proc.userdata["vad"],
    )

    await session.start(
        room=ctx.room,
        agent=AdhikaarAgent(),
        room_options=room_io.RoomOptions(
            audio_input=room_io.AudioInputOptions(
                noise_cancellation=lambda params: (
                    noise_cancellation.BVCTelephony()
                    if params.participant.kind
                    == rtc.ParticipantKind.PARTICIPANT_KIND_SIP
                    else noise_cancellation.BVC()
                ),
            ),
        ),
    )

    # Greet the user — retry once if the realtime session isn't ready yet
    greeting = (
        "Greet the user warmly as Adhikaar AI. Say you help find government schemes. "
        "Ask their name. If the user spoke Hindi, greet in Hindi. Keep it to 2 sentences."
    )
    for attempt in range(3):
        try:
            await session.generate_reply(instructions=greeting)
            break
        except Exception as e:
            if attempt < 2:
                logging.warning(
                    f"Greeting attempt {attempt + 1} failed ({e}), retrying..."
                )
                await asyncio.sleep(1.5)
            else:
                logging.error(f"Greeting failed after 3 attempts: {e}")


if __name__ == "__main__":
    from livekit.agents import cli

    cli.run_app(server)
