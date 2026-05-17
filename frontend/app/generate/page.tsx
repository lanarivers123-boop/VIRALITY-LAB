"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { generateScript, analyzeVideo, interpretScript, scrapeURL, analyzeImages } from "@/lib/api";

const STYLES = ["UGC", "Cinematic", "Educational", "Promo", "Story-driven"] as const;
const DURATIONS = [15, 30, 60, 90] as const;
const NICHES = [
  "Real Estate",
  "Fashion & Apparel",
  "Food & Beverage",
  "Tech & Gadgets",
  "Health & Nutrition",
  "Beauty & Skincare",
  "Travel & Tourism",
  "Automotive",
  "E-commerce & Shopping",
  "Finance & Investing",
  "Fitness & Workout",
  "Parenting & Family",
  "Home & Interior",
  "Education & Learning",
  "Gaming & Esports",
  "Pet Care",
  "DIY & Crafting",
  "Spirituality & Wellness",
  "Business & Startup",
  "Art & Design",
] as const;
const SPEECH_STYLES = [
  { value: "speak_more", label: "Speak More" },
  { value: "speak_less", label: "Speak Less" },
  { value: "no_voiceover", label: "No Voiceover" },
] as const;

export default function GeneratePage() {
  const [prompt, setPrompt] = useState("");
  const [url, setUrl] = useState("");
  const [style, setStyle] = useState<typeof STYLES[number]>("UGC");
  const [niche, setNiche] = useState<typeof NICHES[number] | "">("");
  const [duration, setDuration] = useState<typeof DURATIONS[number]>(30);
  const [speechStyle, setSpeechStyle] = useState<typeof SPEECH_STYLES[number]["value"]>("speak_more");
  const [boldText, setBoldText] = useState(true);
  const [videoDetails, setVideoDetails] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isScraping, setIsScraping] = useState(false);
  const [generatedScript, setGeneratedScript] = useState("");
  const [results, setResults] = useState<any>(null);
  const [stage, setStage] = useState<"input" | "scoring" | "results">("input");
  const [error, setError] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [scrapeStatus, setScrapeStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [scrapeData, setScrapeData] = useState<any>(null);
  const [editPrompt, setEditPrompt] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [imageDescription, setImageDescription] = useState("");
  const [isAnalyzingImages, setIsAnalyzingImages] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const recognition = useRef<any>(null);
  const editPromptRef = useRef<HTMLTextAreaElement>(null);

  const startRecording = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    recognition.current = new SpeechRecognition();
    recognition.current.continuous = true;
    recognition.current.interimResults = false;
    recognition.current.onresult = (e: any) => {
      const transcript = Array.from(e.results).map((r: any) => r[0].transcript).join("");
      setPrompt(transcript);
    };
    recognition.current.onend = () => setIsRecording(false);
    recognition.current.onerror = () => setIsRecording(false);
    recognition.current.start();
    setIsRecording(true);
  }, []);

  const stopRecording = () => {
    recognition.current?.stop();
    setIsRecording(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const newImages = [...images, ...files].slice(0, 5);
    setImages(newImages);
    const previews = newImages.map(f => URL.createObjectURL(f));
    setImagePreviews(previews);

    // Analyze images via GPT-4o vision
    if (newImages.length > 0) {
      setIsAnalyzingImages(true);
      try {
        const desc = await analyzeImages(newImages);
        setImageDescription(desc);
      } catch {
        // ignore analysis failure
      } finally {
        setIsAnalyzingImages(false);
      }
    }
  };

  const removeImage = (idx: number) => {
    const newImages = images.filter((_, i) => i !== idx);
    setImages(newImages);
    setImagePreviews(newImages.map(f => URL.createObjectURL(f)));
  };

  const handleScrape = async () => {
    if (!url.trim()) return;
    setIsScraping(true);
    setScrapeStatus("loading");
    setError("");
    try {
      const data = await scrapeURL(url.trim());
      setScrapeData(data);
      setScrapeStatus("done");
      if (data.title) setPrompt(prev => prev ? prev : data.title);
    } catch {
      setScrapeStatus("error");
      setError("Scrape failed. Check URL and try again.");
    } finally {
      setIsScraping(false);
    }
  };

  const runGenerate = async () => {
    setIsGenerating(true);
    setError("");
    setIsEditing(false);
    setEditPrompt("");

    try {
      setStage("scoring");
      // Combine image description with video details
      const combinedVideoDetails = [videoDetails, imageDescription].filter(Boolean).join("\n");

      const { script } = await generateScript(
        prompt, style, duration, undefined,
        niche, combinedVideoDetails, speechStyle, boldText, scrapeData || {}
      );
      setGeneratedScript(script);

      const fakeFile = new File([script], "script.txt", { type: "text/plain" });
      const formData = new FormData();
      formData.append("input_type", "text");
      formData.append("file", fakeFile);

      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const tribeRes = await fetch(`${API_URL}/analyze`, { method: "POST", body: formData });
      if (!tribeRes.ok) throw new Error("TRIE analysis failed");
      const tribeOutput = await tribeRes.json();

      const interp = await interpretScript(tribeOutput, script);
      setResults({ ...tribeOutput, ...interp, script });
      setStage("results");
    } catch (err: any) {
      setError(err.message || "Generation failed");
      setStage("input");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleEdit = () => {
    if (!editPrompt.trim()) return;
    setIsGenerating(true);
    setError("");

    // Append edit instruction to existing script and re-generate
    const combinedPrompt = `Original script:\n${generatedScript}\n\nEdit instruction: ${editPrompt}\n\nKeep the same format but apply the changes requested.`;
    const tempPrompt = combinedPrompt;

    setPrompt(tempPrompt);
    runGenerate().then(() => {
      setEditPrompt("");
    });
  };

  const handleReScore = () => {
    setPrompt(generatedScript);
    runGenerate();
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    await runGenerate();
  };

  return (
    <div className="min-h-screen bg-bg-dark text-white px-6 py-12">
      <div className="max-w-5xl mx-auto">
        <div className="mb-12">
          <h1 className="font-serif text-2xl sm:text-3xl md:text-5xl font-normal leading-[1.1] tracking-tight mb-3">
            Generate a script from scratch
          </h1>
          <p className="text-sm text-white/40 max-w-xl">
            Describe what you want. AI writes it. TRIBE v2 scores it. Edit and re-score in real time.
          </p>
        </div>

        {stage === "input" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">

            {/* URL Scrape */}
            <div>
              <label className="text-xs text-white/40 uppercase tracking-widest mb-2 block">
                Reference URL <span className="text-white/20 normal-case">(optional)</span>
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com/product-page"
                  className="flex-1 rounded-input bg-white/[0.04] border border-white/[0.08] px-4 py-3 text-sm text-white/70 placeholder:text-white/20 focus:outline-none focus:border-cyan-accent/40 transition-colors"
                />
                <button
                  onClick={handleScrape}
                  disabled={!url.trim() || isScraping}
                  className="px-4 py-3 rounded-btn border border-white/20 text-xs text-white/60 hover:border-cyan-accent/50 hover:text-cyan-accent disabled:opacity-30 transition-all"
                >
                  {isScraping ? "Reading…" : "Read URL"}
                </button>
              </div>
              {scrapeStatus === "done" && scrapeData && (
                <div className="mt-2 flex items-center gap-2 text-xs text-cyan-accent">
                  <span>✓</span>
                  <span className="text-white/40">Loaded:</span>
                  <span className="text-white/70 truncate">{scrapeData.title || scrapeData.url}</span>
                </div>
              )}
              {scrapeStatus === "error" && <p className="mt-2 text-xs text-red-400">{error}</p>}
            </div>

            {/* Images */}
            <div>
              <label className="text-xs text-white/40 uppercase tracking-widest mb-2 block">
                Reference images <span className="text-white/20 normal-case">(optional — helps AI understand your product/subject)</span>
              </label>
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
              />
              <div
                onClick={() => imageInputRef.current?.click()}
                className="border-2 border-dashed border-white/[0.15] rounded-xl p-6 text-center cursor-pointer hover:border-cyan-accent/40 transition-colors"
              >
                <div className="text-2xl mb-1">🖼️</div>
                <div className="text-sm text-white/40">Click to upload images (up to 5)</div>
                <div className="text-xs text-white/20 mt-1">JPG, PNG, WEBP — AI reads these to understand your product</div>
              </div>
              {imagePreviews.length > 0 && (
                <div className="flex gap-3 mt-3 flex-wrap">
                  {imagePreviews.map((src, i) => (
                    <div key={i} className="relative">
                      <img src={src} alt={`Ref ${i + 1}`} className="w-20 h-20 object-cover rounded-lg border border-white/10" />
                      <button
                        onClick={() => removeImage(i)}
                        className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {isAnalyzingImages && (
                <div className="mt-2 text-xs text-cyan-accent flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full border border-cyan-accent border-t-transparent animate-spin" />
                  AI analyzing images…
                </div>
              )}
              {imageDescription && !isAnalyzingImages && (
                <div className="mt-2 rounded-lg bg-cyan-accent/5 border border-cyan-accent/20 px-4 py-3">
                  <div className="text-[10px] text-cyan-accent/60 uppercase tracking-widest mb-1">AI Image Analysis</div>
                  <div className="text-xs text-white/60 leading-relaxed">{imageDescription}</div>
                </div>
              )}
            </div>

            {/* Prompt + Mic */}
            <div>
              <label className="text-xs text-white/40 uppercase tracking-widest mb-2 block">
                What kind of video are you making?
              </label>
              <div className="relative">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={4}
                  placeholder="e.g., A 30-second UGC product demo. Clean setup, fast hook, clear CTA..."
                  className="w-full rounded-input bg-white/[0.04] border border-white/[0.08] p-4 pr-12 text-sm text-white/70 placeholder:text-white/20 resize-none focus:outline-none focus:border-cyan-accent/40 transition-colors"
                />
                <button
                  onMouseDown={startRecording}
                  onMouseUp={stopRecording}
                  onMouseLeave={stopRecording}
                  className={`absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                    isRecording ? "bg-red-500/20 text-red-400 animate-pulse" : "text-white/30 hover:text-white/60"
                  }`}
                >
                  🎤
                </button>
              </div>
            </div>

            {/* Video Details */}
            <div>
              <label className="text-xs text-white/40 uppercase tracking-widest mb-2 block">
                Video details <span className="text-white/20 normal-case">(specifics about your subject)</span>
              </label>
              <textarea
                value={videoDetails}
                onChange={(e) => setVideoDetails(e.target.value)}
                rows={2}
                placeholder="e.g., 4 BHK ₹3Cr Gurgaon flat / Chicken curry dress launch / New fitness tracker under ₹2000"
                className="w-full rounded-input bg-white/[0.04] border border-white/[0.08] p-4 text-sm text-white/70 placeholder:text-white/20 resize-none focus:outline-none focus:border-cyan-accent/40 transition-colors"
              />
            </div>

            {/* Niche + Style + Duration */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div>
                <label className="text-xs text-white/40 uppercase tracking-widest mb-3 block">Niche</label>
                <select
                  value={niche}
                  onChange={(e) => setNiche(e.target.value as any)}
                  className="w-full rounded-input bg-white/[0.04] border border-white/[0.08] px-4 py-2.5 text-sm text-white/70 focus:outline-none focus:border-cyan-accent/40 transition-colors appearance-none cursor-pointer"
                >
                  <option value="">Select niche…</option>
                  {NICHES.map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-white/40 uppercase tracking-widest mb-3 block">Style</label>
                <div className="flex flex-wrap gap-2">
                  {STYLES.map((s) => (
                    <button key={s} onClick={() => setStyle(s)} className={`px-3 py-1.5 rounded-full text-xs border transition-all ${style === s ? "border-cyan-accent bg-cyan-accent/10 text-cyan-accent" : "border-white/10 text-white/40 hover:border-white/30"}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-white/40 uppercase tracking-widest mb-3 block">Duration</label>
                <div className="flex flex-col sm:flex-row gap-2">
                  {DURATIONS.map((d) => (
                    <button key={d} onClick={() => setDuration(d)} className={`px-4 py-1.5 rounded-full text-xs border transition-all ${duration === d ? "border-gold-accent bg-gold-accent/10 text-gold-accent" : "border-white/10 text-white/40 hover:border-white/30"}`}>
                      {d}s
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Speech + Bold toggles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="text-xs text-white/40 uppercase tracking-widest mb-3 block">Voiceover</label>
                <div className="flex flex-col sm:flex-row gap-2">
                  {SPEECH_STYLES.map((s) => (
                    <button key={s.value} onClick={() => setSpeechStyle(s.value)} className={`px-4 py-2 rounded-full text-xs border transition-all ${speechStyle === s.value ? "border-cyan-accent bg-cyan-accent/10 text-cyan-accent" : "border-white/10 text-white/40 hover:border-white/30"}`}>
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-white/40 uppercase tracking-widest mb-3 block">On-screen text</label>
                <button onClick={() => setBoldText(!boldText)} className={`px-4 py-2 rounded-full text-xs border transition-all ${boldText ? "border-gold-accent bg-gold-accent/10 text-gold-accent" : "border-white/10 text-white/40 hover:border-white/30"}`}>
                  {boldText ? "Bold CAPS ON" : "Bold CAPS OFF"}
                </button>
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={!prompt.trim() || isGenerating}
              className="w-full py-4 rounded-btn bg-gold-accent text-bg-dark font-semibold text-sm disabled:opacity-30 hover:brightness-110 transition-all"
            >
              {isGenerating ? "Generating script…" : "Generate & Score →"}
            </button>

            {error && <p className="text-xs text-red-400">{error}</p>}
          </motion.div>
        )}

        {stage === "scoring" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-6 py-16">
            <div className="w-10 h-10 rounded-full border-2 border-cyan-accent border-t-transparent animate-spin" />
            <p className="text-sm text-cyan-accent">Running TRIBE v2 inference…</p>
          </motion.div>
        )}

        {stage === "results" && results && (
          <div className="space-y-6">
            <div className="flex gap-3">
              <button onClick={() => { setStage("input"); setResults(null); setGeneratedScript(""); }} className="px-4 py-2 rounded-btn border border-white/20 text-xs hover:bg-white/5 transition-all">
                ← New generation
              </button>
              <button onClick={handleReScore} className="px-4 py-2 rounded-btn border border-gold-accent text-gold-accent text-xs hover:bg-gold-accent/5 transition-all">
                ↻ Re-score
              </button>
            </div>

            {/* Virality Meter */}
            <div className="rounded-card bg-white/[0.03] border border-white/[0.08] p-6">
              <div className="flex items-end gap-6">
                <div className="font-serif text-4xl sm:text-5xl md:text-7xl text-cyan-accent leading-none">
                  {results.virality_score ?? 62}
                  <span className="text-2xl text-white/30 ml-1">/ 100</span>
                </div>
                <div className="flex-1 pb-2">
                  <div className="h-3 rounded-full bg-white/[0.08] overflow-hidden mb-3">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${results.virality_score ?? 62}%` }}
                      transition={{ duration: 1.2, ease: "easeOut" }}
                      className="h-full rounded-full bg-gradient-to-r from-cyan-accent to-gold-accent"
                    />
                  </div>
                  <p className="text-xs text-white/40">
                    Predicted to outperform {results.virality_score ?? 62}% of similar content
                  </p>
                </div>
              </div>
            </div>

            {/* Brain + Timeline row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="rounded-card bg-white/[0.03] border border-white/[0.08] p-6">
                <h2 className="text-xs uppercase tracking-widest text-white/30 mb-4">Brain Activity Map</h2>
                <AnimatedBrain rawPreds={results.raw_preds || []} corticalRegions={results.cortical_regions || {}} />
              </div>
              <div className="rounded-card bg-white/[0.03] border border-white/[0.08] p-6">
                <h2 className="text-xs uppercase tracking-widest text-white/30 mb-4">Attention Timeline</h2>
                <AnimatedTimeline rawPreds={results.raw_preds || []} segments={results.segments || []} />
              </div>
            </div>

            {/* Peaks */}
            {results.peaks && results.peaks.length > 0 && (
              <div className="rounded-card bg-white/[0.03] border border-white/[0.08] p-6">
                <h2 className="text-xs uppercase tracking-widest text-white/30 mb-4">Peak Brain Moments</h2>
                <div className="space-y-3">
                  {results.peaks.map((p: any, i: number) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-14 text-xs text-cyan-accent font-mono shrink-0 pt-0.5">
                        {p.timestamp_start?.toFixed(1)}s
                      </div>
                      <div className="flex-1">
                        <div className="text-xs text-white/50 mb-1">{p.region?.replace("_", " ")} — activation {((p.activation_level ?? 0) * 100).toFixed(0)}%</div>
                        <div className="text-sm text-white/70">{p.description}</div>
                      </div>
                      <div className="w-2 h-2 rounded-full mt-2 shrink-0" style={{ background: `rgba(34,211,238,${p.activation_level ?? 0.5})` }} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Script card */}
            <div className="rounded-card bg-white/[0.03] border border-white/[0.08] p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xs uppercase tracking-widest text-white/30">Generated Script</h2>
                <button onClick={() => navigator.clipboard?.writeText(generatedScript)} className="text-xs text-white/30 hover:text-cyan-accent transition-colors">
                  📋 Copy
                </button>
              </div>
              <ScriptDisplay script={generatedScript} />
            </div>

            {/* Edit prompt bar */}
            <div className="rounded-card bg-white/[0.04] border border-cyan-accent/30 p-5">
              <label className="text-xs text-cyan-accent uppercase tracking-widest mb-3 block">
                ✏️ Edit or refine the script
              </label>
              <div className="relative">
                <textarea
                  ref={editPromptRef}
                  value={editPrompt}
                  onChange={(e) => setEditPrompt(e.target.value)}
                  rows={2}
                  placeholder="e.g., Make the hook punchier, add more urgency to the CTA, reduce voiceover..."
                  className="w-full rounded-input bg-white/[0.06] border border-white/[0.12] p-4 pr-12 text-sm text-white/70 placeholder:text-white/20 resize-none focus:outline-none focus:border-cyan-accent/50 transition-colors"
                />
                <button
                  onMouseDown={startRecording}
                  onMouseUp={stopRecording}
                  onMouseLeave={stopRecording}
                  className={`absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                    isRecording ? "bg-red-500/20 text-red-400 animate-pulse" : "text-white/30 hover:text-cyan-accent"
                  }`}
                >
                  🎤
                </button>
              </div>
              <div className="flex gap-3 mt-3">
                <button
                  onClick={handleEdit}
                  disabled={!editPrompt.trim() || isGenerating}
                  className="px-5 py-2.5 rounded-btn bg-cyan-accent text-bg-dark font-semibold text-xs disabled:opacity-30 hover:brightness-110 transition-all"
                >
                  {isGenerating ? "Editing…" : "Apply Edit →"}
                </button>
                <button
                  onClick={() => setEditPrompt("")}
                  className="px-4 py-2.5 rounded-btn border border-white/20 text-xs text-white/40 hover:text-white/60 transition-all"
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Suggestions */}
            <div className="rounded-card bg-white/[0.03] border border-white/[0.08] p-6">
              <h2 className="text-xs uppercase tracking-widest text-white/30 mb-4">What to change</h2>
              <div className="space-y-2">
                {(results.suggestions || []).map((s: string, i: number) => (
                  <div key={i} className="flex gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-gold-accent mt-1.5 flex-shrink-0" />
                    <p className="text-sm text-white/60">{s}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Parsed script line ───────────────────────────────────────────────────────

interface ParsedSegment {
  time: string;
  personSays: string;
  scene: string;
  camera: string;
  audio: string;
  onScreenText: string;
}

function parseSegment(text: string): ParsedSegment | null {
  const timeMatch = text.match(/\[(\d+:\d+-\d+:\d+)\]/);
  const personMatch = text.match(/PERSON SAYS:\s*"?([^"\n]+)"?/i);
  const sceneMatch = text.match(/SCENE:\s*(.+?)(?=\n\s*(?:CAMERA|AUDIO|ON-SCREEN|$))/is);
  const cameraMatch = text.match(/CAMERA:\s*(.+?)(?=\n\s*(?:AUDIO|ON-SCREEN|$))/i);
  const audioMatch = text.match(/AUDIO:\s*(.+?)(?=\n\s*(?:ON-SCREEN|$))/i);
  const onScreenMatch = text.match(/ON-SCREEN TEXT:\s*(.+?)(?=\n\s*(?:---|$))/i);

  if (timeMatch) {
    return {
      time: timeMatch[1],
      personSays: personMatch ? personMatch[1].trim() : "",
      scene: sceneMatch ? sceneMatch[1].trim() : "",
      camera: cameraMatch ? cameraMatch[1].trim() : "",
      audio: audioMatch ? audioMatch[1].trim() : "",
      onScreenText: onScreenMatch ? onScreenMatch[1].trim() : "",
    };
  }
  return null;
}

function ScriptDisplay({ script }: { script: string }) {
  // Split by "---" separator to get segments
  const rawSegments = script.split(/---+/).filter(s => s.trim());

  return (
    <div className="space-y-4">
      {rawSegments.map((block, i) => {
        const parsed = parseSegment(block);
        if (parsed) {
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="rounded-xl bg-white/[0.04] border border-white/[0.08] overflow-hidden"
            >
              {/* Timestamp header */}
              <div className="flex items-center gap-3 px-5 py-3 border-b border-white/[0.06] bg-cyan-accent/5">
                <div className="w-20 text-sm font-mono font-bold text-cyan-accent bg-cyan-accent/10 px-3 py-1.5 rounded-lg text-center">
                  {parsed.time}
                </div>
                <div className="text-xs text-white/30 uppercase tracking-widest">Segment {i + 1}</div>
                {parsed.camera && (
                  <div className="ml-auto text-xs text-white/30 bg-white/5 px-2 py-1 rounded">
                    📷 {parsed.camera}
                  </div>
                )}
              </div>

              {/* Person Says — most prominent */}
              {parsed.personSays && (
                <div className="px-5 py-4 bg-cyan-accent/8 border-l-4 border-cyan-accent">
                  <div className="text-[10px] text-cyan-accent/60 uppercase tracking-widest mb-1">🎙 PERSON SAYS</div>
                  <div className="text-white font-medium text-base leading-snug">"{parsed.personSays}"</div>
                </div>
              )}

              {/* Scene */}
              {parsed.scene && (
                <div className="px-5 py-3 border-b border-white/[0.05]">
                  <div className="text-[10px] text-white/30 uppercase tracking-widest mb-1">🎬 SCENE</div>
                  <div className="text-sm text-white/70 leading-relaxed">{parsed.scene}</div>
                </div>
              )}

              {/* Audio + On-screen text row */}
              {(parsed.audio || parsed.onScreenText) && (
                <div className="px-5 py-3 border-b border-white/[0.05]">
                  <div className="grid md:grid-cols-2 gap-4">
                    {parsed.audio && (
                      <div>
                        <div className="text-[10px] text-white/30 uppercase tracking-widest mb-1">🔊 AUDIO</div>
                        <div className="text-sm text-white/60">{parsed.audio}</div>
                      </div>
                    )}
                    {parsed.onScreenText && (
                      <div>
                        <div className="text-[10px] text-white/30 uppercase tracking-widest mb-1">📝 ON-SCREEN TEXT</div>
                        <div className="text-sm text-gold-accent font-bold tracking-wide">{parsed.onScreenText}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          );
        }
        // Fallback for unparseable block
        return (
          <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-2">
            <pre className="text-xs text-white/40 font-mono whitespace-pre-wrap">{block.trim()}</pre>
          </motion.div>
        );
      })}
    </div>
  );
}

// ─── Animated Brain SVG ─────────────────────────────────────────────────────

const BRAIN_REGIONS: { key: string; cx: number; cy: number; rx: number; ry: number; label: string }[] = [
  { key: "visual_cortex",   cx: 68, cy: 38, rx: 20, ry: 16, label: "Visual" },
  { key: "prefrontal_cortex", cx: 54, cy: 22, rx: 18, ry: 14, label: "Prefrontal" },
  { key: "auditory_cortex",   cx: 32, cy: 52, rx: 18, ry: 16, label: "Auditory" },
  { key: "temporal_cortex",  cx: 28, cy: 38, rx: 16, ry: 14, label: "Temporal" },
  { key: "motor_cortex",      cx: 72, cy: 58, rx: 16, ry: 14, label: "Motor" },
  { key: "somatosensory_cortex", cx: 68, cy: 68, rx: 14, ry: 12, label: "Somato" },
  { key: "parietal_cortex",   cx: 52, cy: 32, rx: 14, ry: 12, label: "Parietal" },
  { key: "limbic_cortex",     cx: 44, cy: 52, rx: 14, ry: 12, label: "Limbic" },
];

function AnimatedBrain({ rawPreds, corticalRegions }: { rawPreds: number[][]; corticalRegions: Record<string, number> }) {
  const r = corticalRegions || {};
  const entries = Object.entries(r).sort((a, b) => b[1] - a[1]);

  return (
    <div className="flex flex-col items-center gap-4">
      <svg viewBox="0 0 100 90" className="w-full max-w-[280px]">
        {/* Brain outline */}
        <ellipse cx="50" cy="45" rx="42" ry="38" fill="rgba(34,211,238,0.04)" stroke="#22D3EE" strokeWidth="0.5" strokeDasharray="2 2" />
        {/* Corpus callosum */}
        <line x1="50" y1="28" x2="50" y2="62" stroke="#22D3EE" strokeWidth="0.3" strokeDasharray="1 1" opacity="0.4" />
        {/* Regions */}
        {BRAIN_REGIONS.map(({ key, cx, cy, rx, ry }) => {
          const activation = r[key] ?? 0;
          const colorIntensity = activation;
          return (
            <g key={key}>
              <ellipse
                cx={cx} cy={cy} rx={rx} ry={ry}
                fill={`rgba(34,211,238,${colorIntensity * 0.7})`}
                stroke="#22D3EE"
                strokeWidth="0.6"
                opacity={0.6 + activation * 0.4}
              />
              <text
                x={cx} y={cy + 1}
                textAnchor="middle"
                fontSize="4"
                fill={`rgba(255,255,255,${0.3 + activation * 0.7})`}
                fontFamily="monospace"
              >
                {key.replace("_", " ").slice(0, 6)}
              </text>
            </g>
          );
        })}
      </svg>
      {/* Bar chart below */}
      <div className="w-full space-y-1.5">
        {entries.slice(0, 6).map(([key, val]) => (
          <div key={key} className="flex items-center gap-2">
            <div className="w-20 text-xs text-white/30 truncate text-right">{key.replace("_", " ")}</div>
            <div className="flex-1 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(val * 100).toFixed(0)}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="h-full rounded-full bg-gradient-to-r from-cyan-accent to-gold-accent"
              />
            </div>
            <div className="w-8 text-xs text-cyan-accent text-right">{((val ?? 0) * 100).toFixed(0)}%</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Animated Timeline ─────────────────────────────────────────────────────

function AnimatedTimeline({ rawPreds, segments }: { rawPreds: number[][]; segments: any[] }) {
  const bars = rawPreds.slice(0, 30).map((p: number[], i: number) => ({
    height: Math.max(8, (p[0] ?? 0) * 100),
    peak: (p[0] ?? 0) > 0.7,
    drop: (p[0] ?? 0) < 0.25,
    neutral: (p[0] ?? 0) >= 0.25 && (p[0] ?? 0) <= 0.7,
    t: i,
  }));

  const getSegmentLabel = (t: number): string => {
    for (const seg of segments) {
      if (t >= seg.start && t < seg.end) return seg.label;
    }
    return "";
  };

  return (
    <div>
      <div className="flex items-end gap-[3px] h-24 mb-3">
        {bars.map((b, i) => (
          <motion.div
            key={i}
            initial={{ height: 8 }}
            animate={{ height: `${b.height}%` }}
            transition={{ duration: 0.8, delay: i * 0.04, ease: "easeOut" }}
            className={`flex-1 rounded-full ${
              b.peak ? "bg-gold-accent shadow-[0_0_8px_rgba(200,162,75,0.6)]" :
              b.drop ? "bg-white/10" :
              "bg-cyan-accent/50"
            }`}
          />
        ))}
      </div>
      {/* Segment labels */}
      <div className="flex justify-between text-[9px] text-white/25 font-mono">
        {segments.slice(0, 4).map((seg: any, i: number) => (
          <div key={i} className="flex flex-col items-center gap-0.5">
            <div>{seg.start.toFixed(0)}s</div>
            <div className="uppercase tracking-widest text-cyan-accent/60">{seg.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}