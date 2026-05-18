import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tribe_output, original_script } = body;

    // Simulate TRIBE v2 interpretation with mock data
    const viralityScore = Math.round(40 + Math.random() * 40);
    const peaks = [
      { time: 2, reason: "Strong visual contrast + unexpected text", region: "visual_cortex", activation_level: 0.82, description: "Opening hook with bold text creates immediate attention spike" },
      { time: 8, reason: "Audio emphasis + face close-up", region: "auditory_cortex", activation_level: 0.75, description: "Speaker tone peaks here — viewers lean in" },
      { time: 15, reason: "Product reveal moment", region: "visual_cortex", activation_level: 0.88, description: "Visual cortex lights up on product close-up" },
    ];
    const drops = [
      { time: 5, reason: "Silent gap between shots", region: "auditory_cortex", activation_level: 0.31, description: "Attention dips during transition" },
      { time: 20, reason: "Text overload", region: "parietal_cortex", activation_level: 0.35, description: "Too many on-screen elements compete for focus" },
    ];
    const suggestions = [
      "Cut the dead air at 0:05 — add a quick cut or text overlay to maintain momentum",
      "The product reveal at 0:15 is your strongest moment — move it to 0:03 for maximum hook",
      "Reduce on-screen text in the middle section — it fragments attention",
      "Add an audio stinger under the CTA to drive action",
      "The face close-up at 0:08 is underutilized — hold it 2 seconds longer",
    ];
    const rewrittenScript = `[0:00-0:03]
PERSON SAYS: "Wait — you NEED to see this before you post anything."
SCENE: Extreme close-up on face, direct eye contact, dim room with single light source
CAMERA: Fixed camera, locked frame, subject fills 80% of frame
AUDIO: Soft ambient music fades in under breathing
ON-SCREEN TEXT: "BEFORE YOU POST" (ALL CAPS, large font, center screen)

---
[0:03-0:08]
PERSON SAYS: "Most creators are leaving views on the table — without even knowing it."
SCENE: Wide establishing shot revealing setup — clean desk, ring light, camera
CAMERA: Slow push from wide to medium, subtle
AUDIO: Music swells slightly
ON-SCREEN TEXT: "72% of views lost in first 3 seconds"

---
[0:08-0:15]
PERSON SAYS: "There's a neuroscience trick that makes people stop scrolling."
SCENE: Close-up on face, confident expression, nod for emphasis
CAMERA: 2-second hold then slow push to ECU
AUDIO: Music drops to near-silence
ON-SCREEN TEXT: "The HOOK Pattern"

---
[0:15-0:22]
PERSON SAYS: "Here's exactly how it works..."
SCENE: Over-the-shoulder view of hands setting up product in frame
CAMERA: OTS, stable, clean
AUDIO: Sound design — product handling sounds crisp
ON-SCREEN TEXT: "Show the transformation"

---
[0:22-0:30]
PERSON SAYS: "Tap the link. I'll show you exactly what your content is missing."
SCENE: Return to face — direct address, friendly confidence
CAMERA: Medium close-up, slight smile
AUDIO: Music fades back in, CTA emphasis
ON-SCREEN TEXT: "FREE ANALYSIS → LINK IN BIO"`;

    return NextResponse.json({
      virality_score: viralityScore,
      summary: "Strong hook potential. Peak attention at 0:03 and 0:15. Main risk is attention drop at 0:05 and text overload at 0:20.",
      peaks,
      drops,
      suggestions,
      rewritten_script: rewrittenScript,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}