"""
Adhikaar — Autonomous Form Filling Agent
Uses Playwright to fill government portal forms automatically.
"""

import asyncio
import json
import os
import sys
import io
from pathlib import Path

# Fix Windows console encoding for Unicode
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

# Try to import playwright
try:
    from playwright.async_api import async_playwright
except ImportError:
    print("Installing playwright...")
    os.system(f"{sys.executable} -m pip install playwright")
    os.system(f"{sys.executable} -m playwright install chromium")
    from playwright.async_api import async_playwright


async def fill_pm_kisan_form(citizen_data: dict, portal_url: str = None):
    """
    Autonomously fills the PM-KISAN application form using Playwright.

    Args:
        citizen_data: Dict with citizen profile and documents
        portal_url: URL of the government portal (defaults to mock portal)
    """

    # Default to mock portal
    if portal_url is None:
        mock_portal_path = Path(__file__).parent / "mock-portal" / "index.html"
        portal_url = f"file:///{mock_portal_path.as_posix()}"

    print(f"\n{'='*60}")
    print("  ADHIKAAR — Autonomous Form Filling Agent")
    print(f"{'='*60}")
    print(f"\n🌐 Opening portal: {portal_url[:60]}...")

    async with async_playwright() as p:
        # Launch browser (visible for demo)
        browser = await p.chromium.launch(
            headless=False,
            slow_mo=150,  # Slow down for demo visibility
            args=["--start-maximized"]
        )

        context = await browser.new_context(
            viewport={"width": 1280, "height": 800},
            no_viewport=False
        )

        page = await context.new_page()
        await page.goto(portal_url)
        await page.wait_for_load_state("networkidle")

        print("✅ Portal loaded successfully\n")
        await asyncio.sleep(1)

        # ── Personal Details ──
        print("📋 STEP 1: Filling Personal Details...")

        await slow_fill(page, "#fullName", citizen_data.get("name", "Ramesh Kumar"))
        print(f"   ✓ Name: {citizen_data.get('name', 'Ramesh Kumar')}")

        await slow_fill(page, "#fatherName", citizen_data.get("father_name", "Shri Suresh Kumar"))
        print(f"   ✓ Father's Name: {citizen_data.get('father_name', 'Shri Suresh Kumar')}")

        aadhaar = citizen_data.get("aadhaar", "9876 5432 1098")
        await slow_fill(page, "#aadhaarNumber", aadhaar)
        print(f"   ✓ Aadhaar: {aadhaar}")

        await page.fill("#dob", citizen_data.get("dob", "1985-06-15"))
        await page.wait_for_timeout(300)
        print(f"   ✓ DOB: {citizen_data.get('dob', '1985-06-15')}")

        await page.select_option("#gender", citizen_data.get("gender", "male"))
        await page.wait_for_timeout(300)
        print(f"   ✓ Gender: {citizen_data.get('gender', 'male')}")

        await slow_fill(page, "#mobile", citizen_data.get("mobile", "9876543210"))
        print(f"   ✓ Mobile: {citizen_data.get('mobile', '9876543210')}")

        await asyncio.sleep(0.5)

        # ── Address Details ──
        print("\n🏠 STEP 2: Filling Address Details...")

        await page.select_option("#state", citizen_data.get("state_code", "UP"))
        await page.wait_for_timeout(300)
        print(f"   ✓ State: {citizen_data.get('state', 'Uttar Pradesh')}")

        await slow_fill(page, "#district", citizen_data.get("district", "Lucknow"))
        print(f"   ✓ District: {citizen_data.get('district', 'Lucknow')}")

        await slow_fill(page, "#block", citizen_data.get("block", "Mohanlalganj"))
        print(f"   ✓ Block: {citizen_data.get('block', 'Mohanlalganj')}")

        await slow_fill(page, "#village", citizen_data.get("village", "Rampur"))
        print(f"   ✓ Village: {citizen_data.get('village', 'Rampur')}")

        await asyncio.sleep(0.5)

        # ── Land Details ──
        print("\n🌾 STEP 3: Filling Land Details...")

        await slow_fill(page, "#surveyNo", citizen_data.get("survey_no", "142/A"))
        print(f"   ✓ Survey No: {citizen_data.get('survey_no', '142/A')}")

        await slow_fill(page, "#landArea", citizen_data.get("land_area", "2.5"))
        print(f"   ✓ Land Area: {citizen_data.get('land_area', '2.5')} hectares")

        await asyncio.sleep(0.5)

        # ── Bank Details ──
        print("\n🏦 STEP 4: Filling Bank Details...")

        await slow_fill(page, "#bankName", citizen_data.get("bank_name", "State Bank of India"))
        print(f"   ✓ Bank: {citizen_data.get('bank_name', 'State Bank of India')}")

        await slow_fill(page, "#accountNumber", citizen_data.get("account_no", "32145678901"))
        print(f"   ✓ Account: {citizen_data.get('account_no', '32145678901')}")

        await slow_fill(page, "#ifscCode", citizen_data.get("ifsc", "SBIN0001234"))
        print(f"   ✓ IFSC: {citizen_data.get('ifsc', 'SBIN0001234')}")

        await slow_fill(page, "#accountHolder", citizen_data.get("name", "Ramesh Kumar"))
        print(f"   ✓ Account Holder: {citizen_data.get('name', 'Ramesh Kumar')}")

        await asyncio.sleep(0.5)

        # ── Document Upload (simulate) ──
        print("\n📄 STEP 5: Uploading Documents...")

        # Simulate document upload by marking upload areas
        await page.evaluate("""() => {
            const aadhaarUpload = document.getElementById('aadhaarUpload');
            aadhaarUpload.classList.add('uploaded');
            aadhaarUpload.innerHTML = '<div class="upload-icon">✅</div><div class="upload-text upload-success">aadhaar_card.pdf uploaded</div>';
        }""")
        await page.wait_for_timeout(500)
        print("   ✓ Aadhaar Card uploaded")

        await page.evaluate("""() => {
            const landUpload = document.getElementById('landUpload');
            landUpload.classList.add('uploaded');
            landUpload.innerHTML = '<div class="upload-icon">✅</div><div class="upload-text upload-success">land_record.pdf uploaded</div>';
        }""")
        await page.wait_for_timeout(500)
        print("   ✓ Land Record uploaded")

        await asyncio.sleep(0.5)

        # ── Captcha ──
        print("\n🔒 STEP 6: Solving Captcha...")

        # Read captcha text and fill it (since we control the mock portal)
        captcha_text = await page.text_content("#captchaText")
        await slow_fill(page, "#captchaInput", captcha_text or "A7x2K9")
        print(f"   ✓ Captcha solved: {captcha_text}")

        await asyncio.sleep(0.5)

        # ── Declaration ──
        print("\n☑️  STEP 7: Accepting Declaration...")
        await page.check("#declaration")
        await page.wait_for_timeout(500)
        print("   ✓ Declaration accepted")

        await asyncio.sleep(1)

        # ── Submit ──
        print("\n🚀 STEP 8: Submitting Application...")
        await page.click("#submitBtn")
        await page.wait_for_timeout(1000)

        # Wait for success modal
        ref_number = await page.text_content("#refNumber")

        print(f"\n{'='*60}")
        print(f"  ✅ APPLICATION SUBMITTED SUCCESSFULLY!")
        print(f"  📄 Reference Number: {ref_number}")
        print(f"  🕐 Submitted at: {asyncio.get_event_loop().time():.0f}")
        print(f"{'='*60}\n")

        # Keep browser open for demo
        print("Browser will remain open for 10 seconds for demo viewing...")
        await asyncio.sleep(10)

        await browser.close()

        return {
            "status": "success",
            "reference_number": ref_number,
            "scheme": "PM-KISAN",
        }


async def slow_fill(page, selector, value):
    """Type text with visible effect for demo."""
    await page.click(selector)
    await page.wait_for_timeout(80)
    await page.fill(selector, str(value))
    await page.wait_for_timeout(150)


# Default citizen data for demo
DEMO_CITIZEN = {
    "name": "Ramesh Kumar",
    "father_name": "Shri Suresh Kumar",
    "aadhaar": "9876 5432 1098",
    "dob": "1985-06-15",
    "gender": "male",
    "mobile": "9876543210",
    "state": "Uttar Pradesh",
    "state_code": "UP",
    "district": "Lucknow",
    "block": "Mohanlalganj",
    "village": "Rampur Kalan",
    "survey_no": "142/A",
    "land_area": "2.5",
    "bank_name": "State Bank of India",
    "account_no": "32145678901",
    "ifsc": "SBIN0001234",
}


if __name__ == "__main__":
    # Accept optional JSON citizen data from command line
    if len(sys.argv) > 1:
        try:
            citizen_data = json.loads(sys.argv[1])
        except json.JSONDecodeError:
            citizen_data = DEMO_CITIZEN
    else:
        citizen_data = DEMO_CITIZEN

    asyncio.run(fill_pm_kisan_form(citizen_data))
