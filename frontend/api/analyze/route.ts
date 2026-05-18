import { NextRequest, NextResponse } from "next/server";
import { writeFile, unlink } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const inputType = formData.get("input_type") as string;
    const file = formData.get("file") as File | null;

    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: "OPENAI_API_KEY not configured" }, { status: 500 });
    }

    if (!file && inputType !== "text") {
      return NextResponse.json({ error: "File required" }, { status: 400 });
    }

    let durationSec = 30;
    let filePath = "";

    if (file) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const tmpPath = join(tmpdir(), `tribe_${Date.now()}_${file.name}`);
      await writeFile(tmpPath, buffer);
      filePath = tmpPath;
      durationSec = Math.max(5, Math.min(180, Math.round(buffer.length / 1024 / 1024 * 10)));
    }

    // Call Railway backend if URL is configured, otherwise mock
    const backendUrl = process.env.NEXT_PUBLIC_API_URL;

    if (backendUrl) {
      try {
        const form = new FormData();
        form.append("input_type", inputType);
        if (file) form.append("file", file);

        const res = await fetch(`${backendUrl}/analyze`, {
          method: "POST",
          body: form,
        });
        if (res.ok) {
          const result = await res.json();
          if (filePath) await unlink(filePath).catch(() => {});
          return NextResponse.json(result);
        }
      } catch {
        // fall through to mock
      }
    }

    // Mock TRIBE output
    const timestamps = Array.from({ length: 30 }, (_, i) => i);
    const segments = [
      { start: 0, end: 5, label: "Hook" },
      { start: 5, end: 15, label: "Content" },
      { start: 15, end: 25, label: "Value" },
      { start: 25, end: 30, label: "CTA" },
    ];
    const corticalRegions = {
      visual_cortex: 0.3 + Math.random() * 0.5,
      auditory_cortex: 0.4 + Math.random() * 0.4,
      prefrontal_cortex: 0.2 + Math.random() * 0.6,
      motor_cortex: 0.1 + Math.random() * 0.3,
      temporal_cortex: 0.3 + Math.random() * 0.4,
      parietal_cortex: 0.2 + Math.random() * 0.4,
      limbic_cortex: 0.4 + Math.random() * 0.4,
      somatosensory_cortex: 0.1 + Math.random() * 0.2,
    };

    const result = {
      raw_preds: timestamps.map(() => [0.2 + Math.random() * 0.6]),
      segments,
      cortical_regions: corticalRegions,
      timestamps,
      duration_sec: durationSec,
    };

    if (filePath) await unlink(filePath).catch(() => {});
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}