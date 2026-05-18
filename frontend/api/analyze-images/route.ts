import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll("images") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "At least one image required" }, { status: 400 });
    }

    // Mock GPT-4o vision analysis result
    return NextResponse.json({
      description: `Product analysis based on ${files.length} image(s):\n\n1. **Subject**: Modern product shown in natural lighting with clean minimalist background. Professional studio setup with soft box lighting creating even illumination.\n\n2. **Visual Aesthetic**: Clean, professional, high-contrast — premium UGC style. Bright overall tone with warm highlights. Appears to be lifestyle product photography.\n\n3. **Key Visual Elements**: Product centered frame-left with breathing room on right. Subtle shadow for depth. No distracting background elements. Consistent color temperature throughout.\n\n4. **Text/Branding**: Minimal visible text — product logo visible bottom-right (subtle, non-intrusive). No other text overlays detected.\n\n5. **Shot Composition**: ECU product close-up with slight angle (30° from horizontal). Excellent for Reels/Shorts. Consider adding dynamic motion blur for transition shots.`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}