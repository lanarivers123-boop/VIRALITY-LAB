"""FastAPI application — TRIBE v2 Virality Lab backend."""

import os
import tempfile
from contextlib import asynccontextmanager
from pathlib import Path

import aiofiles
from fastapi import FastAPI, Form, HTTPException, UploadFile, Body
from fastapi.middleware.cors import CORSMiddleware

from backend.tribev2_wrapper import run_tribe_analysis
from backend.interpret import interpret as run_interpret
from backend.scrape import scrape_url


TMP_DIR = Path(tempfile.gettempdir()) / "tribe_uploads"
TMP_DIR.mkdir(exist_ok=True)


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield
    # Cleanup temp files on shutdown
    for f in TMP_DIR.glob("*"):
        try:
            f.unlink()
        except OSError:
            pass


app = FastAPI(
    title="TRIBE v2 Virality Lab",
    version="0.1.0",
    description="Brain-response prediction backend for TRIBE v2 + LLM interpretation",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/analyze")
async def analyze(
    input_type: str = Form(...),
    file: UploadFile | None = Form(default=None),
    reference_url: str | None = Form(default=None),
):
    """
    Run TRIBE v2 analysis on uploaded video, audio, or text.

    - input_type: "video" | "audio" | "text"
    - file: the actual file (video/audio) or a .txt file (text)
    - reference_url: optional context URL
    """
    if input_type not in ("video", "audio", "text"):
        raise HTTPException(400, f"input_type must be one of: video, audio, text. Got: {input_type}")

    file_path = ""

    try:
        if file:
            # Save to temp dir
            suffix = Path(file.filename or "upload").suffix or ""
            with tempfile.NamedTemporaryFile(suffix=suffix, dir=TMP_DIR, delete=False) as tf:
                async with aiofiles.open(tf.name, "wb") as out:
                    chunk = await file.read(8192)
                    while chunk:
                        await out.write(chunk)
                        chunk = await file.read(8192)
                file_path = tf.name
        else:
            raise HTTPException(400, "A file must be provided for analysis.")

        # Optional: enforce max file size (200MB)
        size_mb = os.path.getsize(file_path) / (1024 * 1024)
        if size_mb > 200:
            raise HTTPException(400, f"File too large: {size_mb:.1f}MB. Max 200MB.")

        metadata = {"reference_url": reference_url} if reference_url else {}

        result = run_tribe_analysis(file_path=file_path, input_type=input_type)
        result["_metadata"] = metadata
        return result

    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(500, f"TRIE v2 analysis failed: {exc}") from exc
    finally:
        # Clean up temp file after processing (non-blocking)
        if file_path and os.path.exists(file_path):
            try:
                os.unlink(file_path)
            except OSError:
                pass


@app.post("/interpret")
async def interpret_endpoint(body: dict = Body(...)):
    """
    Interpret TRIBE v2 raw output through MiniMax LLM.
    Returns virality score, peak/drop moments, suggestions, and rewritten script.
    """
    try:
        result = await run_interpret(
            tribe_output=body.get("tribe_output", {}),
            original_script=body.get("original_script", ""),
            video_metadata=body.get("video_metadata", {}),
        )
        return result
    except Exception as exc:
        raise HTTPException(500, f"Interpretation failed: {exc}") from exc


@app.post("/scrape")
async def scrape_endpoint(body: dict = Body(...)):
    """
    Fetch a URL and extract page content: title, description, text, image URLs.
    Use this to gather context for a video before generating a script.
    """
    url = body.get("url", "").strip()
    if not url:
        raise HTTPException(400, "url is required")
    try:
        result = await scrape_url(url)
        return result
    except Exception as exc:
        raise HTTPException(500, f"Scrape failed: {exc}") from exc


@app.post("/analyze-images")
async def analyze_images(files: list[UploadFile] = Form(...)):
    """
    Analyze uploaded images using GPT-4o vision.
    Returns a description of the products/visuals in the images.
    """
    if not files:
        raise HTTPException(400, "At least one image is required")

    import httpx

    api_key = os.getenv(
        "OPENAI_API_KEY",
        "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",
    )

    # Build base64 images for GPT-4o vision
    import base64, io

    image_parts = []
    for f in files[:5]:  # max 5 images
        contents = await f.read()
        b64 = base64.b64encode(contents).decode("utf-8")
        ext = f.filename or "jpg"
        mime = f"image/{ext.split('.')[-1].lower().replace('jpg', 'jpeg')}"
        if mime == "image/jpg":
            mime = "image/jpeg"
        image_parts.append({
            "type": "image_url",
            "image_url": {
                "url": f"data:{mime};base64,{b64}",
                "detail": "low"
            }
        })

    prompt = """You are a product and visual analyst. Look at these images and describe:
1. What product or subject is shown (specific details, brand if visible, color, material, style)
2. The visual aesthetic and mood (bright/dark, professional/UGC, luxury/affordable)
3. Key visual elements that should appear in the video
4. Any text or branding visible
5. Suggested shot composition ideas (close-ups, wide shots, angles)

Be specific and descriptive. This will be used to generate a video script."""

    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(
            "https://api.openai.com/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": "gpt-4o-mini",
                "messages": [
                    {"role": "user", "content": [{"type": "text", "text": prompt}] + image_parts}
                ],
                "max_tokens": 500,
            },
        )
        response.raise_for_status()
        data = response.json()
        description = data["choices"][0]["message"]["content"]

    return {"description": description}


@app.post("/generate-script")
async def generate_script(body: dict = Body(...)):
    """
    Generate a video script with TRIBE-optimized hook principles.
    Accepts niche, speech style, video details, and optional context from URL scrape.
    """
    import httpx

    MINIMAX_API_KEY = os.getenv(
        "MINIMAX_API_KEY",
        "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",
    )

    user_prompt = body.get("user_prompt", "")
    style = body.get("style", "UGC")
    duration = body.get("duration", 30)
    reference_text = body.get("reference_text")
    niche = body.get("niche", "")           # e.g. Real Estate, Fashion, Food
    video_details = body.get("video_details", "")  # e.g. "4BHK ₹3Cr Gurgaon"
    speech_style = body.get("speech_style", "balanced")  # speak_more | speak_less | no_voiceover
    bold_text = body.get("bold_text", True)   # on-screen text emphasis
    scrape_context = body.get("scrape_context", {})    # result from /scrape

    # Build context string from scrape result
    scrape_lines = []
    if scrape_context.get("title"):
        scrape_lines.append(f"Source page title: {scrape_context['title']}")
    if scrape_context.get("description"):
        scrape_lines.append(f"Source description: {scrape_context['description']}")
    if scrape_context.get("text"):
        scraped = scrape_context["text"][:1000]
        scrape_lines.append(f"Source content:\n{scraped}")
    scrape_text = "\n".join(scrape_lines) if scrape_lines else "No URL content provided."

    prompt = f"""You are an elite viral video scriptwriter. You write scripts that talent can shoot from — every line is clear, every scene is described, every camera angle is specified.

## INPUT
Niche: {niche or 'General'}
Style: {style}
Duration: {duration} seconds max
Speech style: {"Person speaks confidently, full sentences" if speech_style == "speak_more" else "Person speaks short punchy phrases" if speech_style == "speak_less" else "No voiceover — person lines are minimal text cues"}
Bold on-screen text: {'ALL CAPS for key callouts and CTAs' if bold_text else 'subtle placement'}
Video details: {video_details or user_prompt}
User's brief: {user_prompt}

URL context:
{scrape_text}

## SCRIPT FORMAT
Write each segment with the PERSON'S DIALOGUE FIRST — what they actually say on camera. Then describe the scene, camera, audio, and text.

Format each segment exactly like this:
[MM:SS-MM:SS]
PERSON SAYS: "actual dialogue the talent speaks on camera"
SCENE: what is happening visually — be specific about setting, action, mood, lighting
CAMERA: camera angle and movement (e.g. "ECU extreme close-up", "2S two-shot", "OTS over-the-shoulder", "slow push-in", "wide establishing shot", "low angle")
AUDIO: music, sound design, voiceover (what you hear)
ON-SCREEN TEXT: what appears on screen (use ALL CAPS if bold_text is enabled)
---

Rules:
- FIRST segment (0:00-0:03): strongest hook — bold dialogue, unexpected visual, direct question to viewer
- PERSON SAYS is the most important field — write actual lines the talent will memorize and say
- SCENE is second — describe exactly what should appear on screen (setting, lighting, expressions, action)
- Use specific camera angles — not just "shot", say "ECU", "2S", "OTS", "slow-mo", "crane up"
- End every script with a clear CTA (call to action)
- Match niche tone precisely. Here are the tone guides for all niches:
  * Real Estate: polished, confident, premium — highlight luxury, space, lifestyle. Speak like a property expert.
  * Fashion & Apparel: aesthetic-forward, visual storytelling — focus on style, fabric, fit, mood. Make it feel aspirational.
  * Food & Beverage: sensory, appetizing — describe taste, smell, texture visually. Make the viewer hungry.
  * Tech & Gadgets: clarity + excitement — explain what it does and why it's impressive. Think unboxing energy.
  * Health & Nutrition: trustworthy + energetic — balance science with motivation. Make healthy feel achievable.
  * Beauty & Skincare: glow, transformation, confidence — before/after energy, skin texture, radiance.
  * Travel & Tourism: wanderlust, escape — paint the destination. Use sensory language (sounds, views, air).
  * Automotive: power, precision, freedom — speed, design, driving experience. Make it feel cinematic.
  * E-commerce & Shopping: value + urgency — highlight deals, features, why this is the smart choice.
  * Finance & Investing: credible + growth-minded — use numbers, trends, confidence. Make money feel real.
  * Fitness & Workout: energy, determination, results — push through limits. Make viewer want to move.
  * Parenting & Family: warmth, relatability, real moments — authentic smiles, messy scenes, love.
  * Home & Interior: cozy, aspirational, design-forward — lighting, textures, how spaces feel.
  * Education & Learning: clear, engaging, aha-moment — make complex things feel simple.
  * Gaming & Esports: high energy, community, competitive — hype, drops, gameplay moments.
  * Pet Care: emotional, heartwarming, playful — pets as family, happy chaos, love.
  * DIY & Crafting: satisfying, hands-on, creative — show process, reveal, transformation.
  * Spirituality & Wellness: calm, mindful, transformative — inner peace, balance, slow moments.
  * Business & Startup: bold, ambitious, forward-moving — hustle, vision, growth.
  * Art & Design: creative, visually striking, expressive — showcase creativity, process, finished work.
- Do not exceed {duration} seconds total
- Output ONLY the script — no preamble, no commentary
- Each segment separated by "---"
- Keep dialogue in quotes
- Keep SCENE description to 1-2 clear sentences
- Keep CAMERA to 1 short phrase"""

    async with httpx.AsyncClient(timeout=120.0) as client:
        response = await client.post(
            "https://api.openai.com/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {MINIMAX_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": "gpt-4o",
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.8,
            },
        )
        response.raise_for_status()
        data = response.json()
        if "choices" not in data:
            raise HTTPException(502, f"OpenAI returned unexpected shape: {data}")
        script = data["choices"][0]["message"]["content"]

    return {"script": script}
