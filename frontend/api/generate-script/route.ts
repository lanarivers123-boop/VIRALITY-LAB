import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

const NICHES = [
  "Real Estate", "Fashion & Apparel", "Food & Beverage", "Tech & Gadgets",
  "Health & Nutrition", "Beauty & Skincare", "Travel & Tourism", "Automotive",
  "E-commerce & Shopping", "Finance & Investing", "Fitness & Workout",
  "Parenting & Family", "Home & Interior", "Education & Learning",
  "Gaming & Esports", "Pet Care", "DIY & Crafting", "Spirituality & Wellness",
  "Business & Startup", "Art & Design",
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      user_prompt,
      style,
      duration,
      reference_text,
      niche,
      video_details,
      speech_style,
      bold_text,
      scrape_context,
    } = body;

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "OPENAI_API_KEY not configured" }, { status: 500 });
    }

    // Build context from scrape
    let scrapeText = "No URL content provided.";
    if (scrape_context) {
      const lines = [];
      if (scrape_context.title) lines.push(`Source page title: ${scrape_context.title}`);
      if (scrape_context.description) lines.push(`Source description: ${scrape_context.description}`);
      if (scrape_context.text) lines.push(`Source content:\n${scrape_context.text.slice(0, 1000)}`);
      if (lines.length) scrapeText = lines.join("\n");
    }

    const prompt = `You are an elite viral video scriptwriter. Write scripts talent can shoot from — every line clear, every scene described, every camera angle specified.

## INPUT
Niche: ${niche || "General"}
Style: ${style || "UGC"}
Duration: ${duration || 30} seconds max
Speech style: ${
  speech_style === "speak_more"
    ? "Person speaks confidently, full sentences"
    : speech_style === "speak_less"
    ? "Person speaks short punchy phrases"
    : "No voiceover — person lines are minimal text cues"
}
Bold on-screen text: ${bold_text !== false ? "ALL CAPS for key callouts and CTAs" : "subtle placement"}
Video details: ${video_details || user_prompt || "(not provided)"}
User's brief: ${user_prompt || "(not provided)"}

URL context:
${scrapeText}

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
- SCENE is second — describe exactly what should appear on screen
- Use specific camera angles — not just "shot", say "ECU", "2S", "OTS", "slow-mo", "crane up"
- End every script with a clear CTA (call to action)
- Match niche tone precisely. Real Estate: polished, confident, premium. Fashion & Apparel: aesthetic-forward, visual storytelling. Food & Beverage: sensory, appetizing. Tech & Gadgets: clarity + excitement. Health & Nutrition: trustworthy + energetic. Beauty & Skincare: glow, transformation, confidence. Travel & Tourism: wanderlust, escape. Automotive: power, precision, freedom. E-commerce & Shopping: value + urgency. Finance & Investing: credible + growth-minded. Fitness & Workout: energy, determination, results. Parenting & Family: warmth, relatability, real moments. Home & Interior: cozy, aspirational, design-forward. Education & Learning: clear, engaging, aha-moment. Gaming & Esports: high energy, community, competitive. Pet Care: emotional, heartwarming, playful. DIY & Crafting: satisfying, hands-on, creative. Spirituality & Wellness: calm, mindful, transformative. Business & Startup: bold, ambitious, forward-moving. Art & Design: creative, visually striking, expressive.
- Do not exceed ${duration || 30} seconds total
- Output ONLY the script — no preamble, no commentary
- Each segment separated by "---"
- Keep dialogue in quotes
- Keep SCENE description to 1-2 clear sentences
- Keep CAMERA to 1 short phrase`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.8,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return NextResponse.json({ error: `OpenAI API error: ${response.status} - ${errText}` }, { status: 502 });
    }

    const data = await response.json();
    const script = data?.choices?.[0]?.message?.content;

    if (!script) {
      return NextResponse.json({ error: "Empty response from OpenAI" }, { status: 502 });
    }

    return NextResponse.json({ script });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}