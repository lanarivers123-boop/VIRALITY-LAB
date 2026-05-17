const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// ─── Types ───────────────────────────────────────────────────────────────────────

export interface TribeOutput {
  raw_preds: number[][];
  segments: { start: number; end: number; label: string }[];
  cortical_regions: Record<string, number>;
  timestamps: number[];
  duration_sec: number;
  _metadata?: Record<string, unknown>;
}

export interface Interpretation {
  virality_score: number;
  summary: string;
  peaks: { time: number; reason: string }[];
  drops: { time: number; reason: string }[];
  suggestions: string[];
  rewritten_script: string;
}

// ─── API client ───────────────────────────────────────────────────────────────

export async function analyzeVideo(
  file: File | null
): Promise<TribeOutput> {
  const formData = new FormData();
  formData.append("input_type", "video");
  if (file) formData.append("file", file);

  const res = await fetch(`${API_URL}/analyze`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Upload failed" }));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }

  return res.json();
}

export async function interpretScript(
  tribe_output: TribeOutput,
  original_script: string,
  video_metadata?: Record<string, unknown>
): Promise<Interpretation> {
  const res = await fetch(`${API_URL}/interpret`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      tribe_output,
      original_script,
      video_metadata: video_metadata ?? {},
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Interpretation failed" }));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }

  return res.json();
}

export async function generateScript(
  user_prompt: string,
  style: string,
  duration: number,
  reference_text?: string,
  niche?: string,
  video_details?: string,
  speech_style?: string,
  bold_text?: boolean,
  scrape_context?: Record<string, any>
): Promise<{ script: string }> {
  const res = await fetch(`${API_URL}/generate-script`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      user_prompt,
      style,
      duration,
      reference_text,
      niche: niche || "",
      video_details: video_details || "",
      speech_style: speech_style || "balanced",
      bold_text: bold_text ?? true,
      scrape_context: scrape_context || {},
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Generation failed" }));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }

  return res.json();
}

export async function scrapeURL(url: string): Promise<{
  url: string;
  title: string;
  description: string;
  text: string;
  image_urls: string[];
}> {
  const res = await fetch(`${API_URL}/scrape`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Scrape failed" }));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }

  return res.json();
}

export async function analyzeImages(images: File[]): Promise<string> {
  const formData = new FormData();
  for (const img of images) {
    formData.append("images", img);
  }

  const res = await fetch(`${API_URL}/analyze-images`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Image analysis failed" }));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }

  return res.json().then(d => d.description);
}
