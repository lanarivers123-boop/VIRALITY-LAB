// Local Next.js API routes (serverless on Vercel)
// OR external backend (Railway) — controlled by NEXT_PUBLIC_API_URL env var

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "").trim();

// ─── Types ─────────────────────────────────────────────────────────────────────

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

async function apiFetch(path: string, opts: RequestInit = {}) {
  const base = API_BASE || "";
  const url = base + path;

  const res = await fetch(url, {
    ...opts,
    headers: {
      ...(opts.headers as Record<string, string>),
      // fallback content-type for Railway FastAPI
      ...(opts.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: `HTTP ${res.status}` }));
    throw new Error(err.detail || `Request failed: ${res.status}`);
  }

  return res.json();
}

export async function analyzeVideo(file: File | null): Promise<TribeOutput> {
  const formData = new FormData();
  formData.append("input_type", "video");
  if (file) formData.append("file", file);

  return apiFetch("/api/analyze", { method: "POST", body: formData });
}

export async function interpretScript(
  tribe_output: TribeOutput,
  original_script: string,
  video_metadata?: Record<string, unknown>
): Promise<Interpretation> {
  return apiFetch("/api/interpret", {
    method: "POST",
    body: JSON.stringify({ tribe_output, original_script, video_metadata: video_metadata ?? {} }),
  });
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
  return apiFetch("/api/generate-script", {
    method: "POST",
    body: JSON.stringify({
      user_prompt, style, duration, reference_text,
      niche: niche || "",
      video_details: video_details || "",
      speech_style: speech_style || "balanced",
      bold_text: bold_text ?? true,
      scrape_context: scrape_context || {},
    }),
  });
}

export async function scrapeURL(url: string): Promise<{
  url: string; title: string; description: string; text: string; image_urls: string[];
}> {
  return apiFetch("/api/scrape", { method: "POST", body: JSON.stringify({ url }) });
}

export async function analyzeImages(images: File[]): Promise<string> {
  const formData = new FormData();
  for (const img of images) formData.append("images", img);
  const data = await apiFetch("/api/analyze-images", { method: "POST", body: formData });
  return data.description;
}