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

const SCRIPT_TEMPLATES: Record<string, string> = {
  "Real Estate": `[0:00-0:05]
PERSON SAYS: "This isn't just an apartment — it's a lifestyle upgrade."
SCENE: Wide shot of the property exterior at golden hour
CAMERA: Drone establishing shot, slow push-in
AUDIO: Uplifting ambient music with subtle piano
ON-SCREEN TEXT: "LIFESTYLE UPGRADE" (ALL CAPS)

---
[0:05-0:12]
PERSON SAYS: "Four bedrooms. ₹3Cr. Gurgaon sector 57."
SCENE: Living room with modern furniture, bright and airy
CAMERA: Smooth pan through space, natural light from windows
AUDIO: Music stays ambient, clean cuts
ON-SCREEN TEXT: "4 BED | ₹3CR | GURGAON"

---
[0:12-0:18]
PERSON SAYS: "The kitchen? Italian marble. The bathroom? Rainfall shower."
SCENE: Close-ups: kitchen counter, bathroom fixtures
CAMERA: Tight macro shots, elegant detail work
AUDIO: Crisp sound design on fixture details
ON-SCREEN TEXT: "ITALIAN MARBLE | RAINFALL SHOWER"

---
[0:18-0:25]
PERSON SAYS: "Book a private viewing — link in bio."
SCENE: Return to face, direct address with warm smile
CAMERA: Medium close-up, confident
AUDIO: Music swells slightly
ON-SCREEN TEXT: "BOOK NOW → LINK IN BIO"

---
[0:25-0:30]
PERSON SAYS: "This one won't last long."
SCENE: Final wide shot as sun sets on the property
CAMERA: Slow pull-back revealing full scope
AUDIO: Music fades with final chord
ON-SCREEN TEXT: "DM FOR PRICE"`,

  "Fashion & Apparel": `[0:00-0:05]
PERSON SAYS: "I finally found the jacket that fits like it was tailored for me."
SCENE: Model walking into frame, street setting, golden hour
CAMERA: Tracking shot from behind, slow motion
AUDIO: Lo-fi hip hop, chill beat
ON-SCREEN TEXT: "THE PERFECT JACKET"

---
[0:05-0:10]
PERSON SAYS: "It's not just the fit — it's the fabric. You feel it the second you put it on."
SCENE: Close-up on fabric texture, model running hand along sleeve
CAMERA: ECU on fabric, detail focus
AUDIO: Subtle fabric sound
ON-SCREEN TEXT: "PREMIUM COTTON BLEND"

---
[0:10-0:18]
PERSON SAYS: "Wear it with jeans. Wear it with joggers. This is versatility."
SCENE: Model styled two ways: casual denim, then dressed up
CAMERA: Split edit showing both looks
AUDIO: Beat drops slightly
ON-SCREEN TEXT: "TWO WAYS TO STYLE"

---
[0:18-0:24]
PERSON SAYS: "Link in bio. Limited stock — this color way sells out fast."
SCENE: Model turning to camera, direct gaze
CAMERA: Locked frame, medium shot
AUDIO: Music up
ON-SCREEN TEXT: "SHOP NOW"

---
[0:24-0:30]
PERSON SAYS: "Drop a ❤️ if you want more fit check content."
SCENE: Quick smile to camera, pull out wide
CAMERA: Slow zoom out
AUDIO: Music out
ON-SCREEN TEXT: "FOLLOW FOR MORE" `,

  "default": `[0:00-0:05]
PERSON SAYS: "Wait — before you post anything, you need to hear this."
SCENE: Close-up on face, direct eye contact
CAMERA: Fixed camera, locked frame
AUDIO: Subtle ambient music
ON-SCREEN TEXT: "BEFORE YOU POST"

---
[0:05-0:12]
PERSON SAYS: "Most creators are leaving 70% of their views on the table."
SCENE: Medium shot, slight lean in
CAMERA: Subtle push-in
AUDIO: Music holds
ON-SCREEN TEXT: "70% OF VIEWS"

---
[0:12-0:20]
PERSON SAYS: "There's a neuroscience trick that makes people stop scrolling. I'm going to show you exactly how it works."
SCENE: Close-up, confident delivery
CAMERA: Hold steady
AUDIO: Beat builds
ON-SCREEN TEXT: "THE NEUROSCIENCE TRICK"

---
[0:20-0:28]
PERSON SAYS: "Tap the link in bio. I'll analyze your last video for free and show you exactly where attention drops."
SCENE: Medium close-up
CAMERA: Slow push-in
AUDIO: Music swells
ON-SCREEN TEXT: "FREE ANALYSIS → LINK IN BIO"

---
[0:28-0:30]
PERSON SAYS: "Your competitors are already using this. Don't get left behind."
SCENE: Wide shot, confident exit
CAMERA: Pull back
AUDIO: Music out
ON-SCREEN TEXT: "DON'T GET LEFT BEHIND" `,
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { niche, duration, speech_style } = body;

    const template = NICHES.includes(niche) ? niche : "default";
    let script = SCRIPT_TEMPLATES[template] || SCRIPT_TEMPLATES["default"];

    // Adjust duration if needed
    if (duration && duration < 30) {
      script = script.split("---").slice(0, 3).join("---\n");
    }

    return NextResponse.json({ script });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}