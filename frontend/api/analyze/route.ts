import { NextRequest, NextResponse } from "next/server";
import { writeFile, unlink } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";

export const runtime = "nodejs";

function generateMockTribeOutput(filename: string, durationSec: number = 30) {
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

  return {
    raw_preds: timestamps.map(() => [0.2 + Math.random() * 0.6]),
    segments,
    cortical_regions: corticalRegions,
    timestamps,
    duration_sec: durationSec,
  };
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const inputType = formData.get("input_type") as string;
    const file = formData.get("file") as File | null;

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

      // Estimate 1MB ≈ 10sec for video
      durationSec = Math.max(5, Math.min(180, Math.round(buffer.length / 1024 / 1024 * 10)));
    }

    const result = generateMockTribeOutput(file?.name || "script.txt", durationSec);

    if (filePath) {
      await unlink(filePath).catch(() => {});
    }

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}