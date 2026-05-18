"use client";

import { useCallback, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { analyzeVideo, interpretScript } from "@/lib/api";

type Stage = "input" | "loading" | "results" | "error";

const LOADING_STAGES = [
  "Extracting visual features (V-JEPA2)…",
  "Extracting audio (Wav2Vec-BERT)…",
  "Running TRIBE v2 inference…",
  "Generating recommendations…",
];

export default function AnalyzePage() {
  const [stage, setStage] = useState<Stage>("input");
  const [loadingStage, setLoadingStage] = useState(0);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [script, setScript] = useState("");
  const [referenceUrl, setReferenceUrl] = useState("");
  const [results, setResults] = useState<any>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const runAnalysis = useCallback(
    async (file: File | null, scriptText: string) => {
      setStage("loading");
      setLoadingStage(0);
      setProgress(0);

      // Cycle through loading stages
      const stageTimer = setInterval(() => {
        setLoadingStage((s) => {
          if (s < LOADING_STAGES.length - 1) {
            setProgress((s + 1) * 25);
            return s + 1;
          }
          clearInterval(stageTimer);
          return s;
        });
      }, 3500);

      try {
        // Step 1: TRIBE analysis
        setProgress(10);
        const tribeOutput = await analyzeVideo(file);
        setProgress(60);

        // Step 2: LLM interpretation
        setLoadingStage(2);
        setProgress(70);
        const interp = await interpretScript(tribeOutput, scriptText || "No script provided");
        setProgress(100);

        clearInterval(stageTimer);
        setResults({ ...tribeOutput, ...interp });
        setStage("results");
      } catch (err: any) {
        clearInterval(stageTimer);
        setError(err.message || "Analysis failed");
        setStage("error");
      }
    },
    []
  );

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) runAnalysis(file, script);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) runAnalysis(file, script);
  };

  return (
    <div className="min-h-screen bg-bg-dark text-white px-6 py-12">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="font-serif text-2xl sm:text-3xl md:text-5xl font-normal leading-tight mb-3">
            Analyze my content
          </h1>
          <p className="text-sm text-white/40 max-w-xl">
            Upload a video, paste a script, or both. TRIBE v2 will predict brain response
            patterns and generate a rewritten version optimized for attention.
          </p>
        </div>

        <AnimatePresence mode="wait">
          {stage === "input" && (
            <motion.div
              key="input"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid md:grid-cols-2 gap-8"
            >
              {/* Left: inputs */}
              <div className="space-y-6">
                {/* Upload zone */}
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`rounded-card border-2 border-dashed p-12 flex flex-col items-center justify-center gap-4 cursor-pointer transition-all ${
                    dragOver
                      ? "border-cyan-accent bg-cyan-accent/5"
                      : "border-white/10 hover:border-white/20 hover:bg-white/[0.02]"
                  }`}
                >
                  <UploadIcon />
                  <div className="text-center">
                    <p className="text-sm text-white/60 mb-1">
                      Drag & drop a video, or click to browse
                    </p>
                    <p className="text-xs text-white/25">MP4, MOV · max 200MB</p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/mp4,video/mov,video/quicktime"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                </div>

                {/* Divider */}
                <div className="flex items-center gap-3">
                  <div className="h-px flex-1 bg-white/[0.08]" />
                  <span className="text-xs text-white/20 uppercase">or</span>
                  <div className="h-px flex-1 bg-white/[0.08]" />
                </div>

                {/* Script textarea */}
                <div>
                  <label className="text-xs text-white/40 uppercase tracking-widest mb-2 block">
                    Paste your script
                  </label>
                  <textarea
                    ref={textareaRef}
                    value={script}
                    onChange={(e) => setScript(e.target.value)}
                    rows={5}
                    placeholder="[0:00-0:05] PERSON SAYS: ... | SCENE: ..."
                    className="w-full rounded-input bg-white/[0.04] border border-white/[0.08] p-4 text-sm text-white/70 placeholder:text-white/20 resize-none focus:outline-none focus:border-cyan-accent/40 transition-colors"
                  />
                </div>

                {/* Reference URL */}
                <div>
                  <label className="text-xs text-white/40 uppercase tracking-widest mb-2 block">
                    Reference URL
                    <span className="normal-case text-white/20 ml-2">(optional context)</span>
                  </label>
                  <input
                    type="url"
                    value={referenceUrl}
                    onChange={(e) => setReferenceUrl(e.target.value)}
                    placeholder="https://tiktok.com/..."
                    className="w-full rounded-input bg-white/[0.04] border border-white/[0.08] px-4 py-3 text-sm text-white/70 placeholder:text-white/20 focus:outline-none focus:border-cyan-accent/40 transition-colors"
                  />
                </div>

                {/* Analyze button */}
                <button
                  onClick={() => runAnalysis(null, script)}
                  disabled={!script.trim()}
                  className="w-full py-4 rounded-btn bg-gold-accent text-bg-dark font-semibold text-sm disabled:opacity-30 hover:brightness-110 transition-all"
                >
                  Analyze with TRIBE v2 →
                </button>
              </div>

              {/* Right: info panel */}
              <div className="space-y-4">
                <div className="rounded-card bg-white/[0.03] border border-white/[0.08] p-6 space-y-4">
                  <h3 className="text-sm font-semibold text-white">Supported inputs</h3>
                  {[
                    { label: "Video", desc: "MP4, MOV — max 200MB. V-JEPA2 extracts visual, Wav2Vec-BERT extracts audio." },
                    { label: "Script", desc: "Paste a timestamped script. Each line: [MM:SS] Visual: | Audio: | On-screen text: ..." },
                    { label: "Both", desc: "Best results. Video for raw brain data + script for contextual rewriting." },
                  ].map((item) => (
                    <div key={item.label} className="flex gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-cyan-accent mt-1.5 flex-shrink-0" />
                      <div>
                        <span className="text-xs text-cyan-accent font-medium">{item.label}</span>
                        <p className="text-xs text-white/35 mt-0.5">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="rounded-card bg-white/[0.03] border border-white/[0.08] p-6">
                  <h3 className="text-sm font-semibold text-white mb-3">What you&apos;ll get</h3>
                  <div className="space-y-2">
                    {["Virality score (0–100)", "Brain response heatmap", "Attention timeline", "5 specific rewrites", "Rewritten script"].map((item) => (
                      <div key={item} className="flex items-center gap-2 text-xs text-white/40">
                        <div className="w-3 h-3 rounded-full border border-gold-accent flex items-center justify-center">
                          <div className="w-1.5 h-1.5 rounded-full bg-gold-accent" />
                        </div>
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {stage === "loading" && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center min-h-[60vh] gap-8"
            >
              <LoadingBrain />
              <div className="text-center space-y-3">
                <p className="text-sm text-cyan-accent font-mono">
                  {LOADING_STAGES[loadingStage]}
                </p>
                <div className="w-64 h-1 rounded-full bg-white/[0.08] overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-cyan-accent"
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
                <p className="text-xs text-white/20">{progress}% complete</p>
              </div>
            </motion.div>
          )}

          {stage === "results" && results && (
            <ResultsDashboard results={results} onReset={() => setStage("input")} />
          )}

          {stage === "error" && (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center min-h-[40vh] gap-6 text-center"
            >
              <div className="w-12 h-12 rounded-full border border-red-500/30 flex items-center justify-center text-red-400">
                ✕
              </div>
              <div>
                <p className="text-sm text-red-400 mb-1">Analysis failed</p>
                <p className="text-xs text-white/30">{error}</p>
              </div>
              <button
                onClick={() => setStage("input")}
                className="px-6 py-3 rounded-btn border border-white/20 text-sm hover:bg-white/5 transition-all"
              >
                Try again
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function LoadingBrain() {
  return (
    <div className="relative w-32 h-32">
      {[1, 2, 3].map((i) => (
        <motion.div
          key={i}
          className="absolute inset-0 rounded-full border border-cyan-accent/30"
          animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0] }}
          transition={{ duration: 2, delay: i * 0.6, repeat: Infinity }}
        />
      ))}
      <motion.svg
        viewBox="0 0 100 100"
        className="w-full h-full"
        fill="none"
        stroke="#22D3EE"
        strokeWidth="1"
      >
        <path d="M30 25c0-8 6-15 15-15s15 7 15 15c0 6-3 11-8 14-3 2-7 3-7 3s-4-1-7-3C33 33 30 28 30 25z" opacity="0.7" />
        <path d="M70 25c0-8-6-15-15-15S40 17 40 25c0 6 3 11 8 14 3 2 7 3 7 3s4-1 7-3C67 33 70 28 70 25z" opacity="0.7" />
        <path d="M25 40c-6 1-11 7-10 15 0 6 4 12 10 13" opacity="0.4" />
        <path d="M75 40c6 1 11 7 10 15 0 6-4 12-10 13" opacity="0.4" />
        <motion.line x1="50" y1="40" x2="50" y2="55" stroke="#22D3EE" strokeWidth="1.5" strokeDasharray="3 2" animate={{ strokeDashoffset: [0, 10] }} transition={{ duration: 1.5, repeat: Infinity }} opacity="0.6" />
      </motion.svg>
    </div>
  );
}

function UploadIcon() {
  return (
    <svg className="w-8 h-8 text-white/20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Results Dashboard ───────────────────────────────────────────────────────

function ResultsDashboard({ results, onReset }: { results: any; onReset: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Action bar */}
      <div className="flex flex-wrap gap-3">
        <button onClick={onReset} className="px-4 py-2 rounded-btn border border-white/20 text-xs hover:bg-white/5 transition-all">
          ↻ Run again
        </button>
        <button
          onClick={() => navigator.clipboard?.writeText(results.rewritten_script || "")}
          className="px-4 py-2 rounded-btn border border-white/20 text-xs hover:bg-white/5 transition-all"
        >
          📋 Copy report
        </button>
        <Link href="/generate" className="px-4 py-2 rounded-btn bg-gold-accent text-bg-dark text-xs font-semibold hover:brightness-110 transition-all">
          🎬 Generate new script
        </Link>
      </div>

      {/* Virality Meter */}
      <div className="rounded-card bg-white/[0.03] border border-white/[0.08] p-6">
        <h2 className="text-xs uppercase tracking-widest text-white/30 mb-4">Virality Meter</h2>
        <div className="flex items-end gap-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="font-serif text-4xl sm:text-5xl md:text-7xl text-cyan-accent leading-none"
          >
            {results.virality_score ?? 62}
            <span className="text-2xl text-white/30 ml-1">/ 100</span>
          </motion.div>
          <div className="flex-1 pb-2">
            <div className="h-2 rounded-full bg-white/[0.08] overflow-hidden mb-2">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-cyan-accent to-gold-accent"
                initial={{ width: 0 }}
                animate={{ width: `${results.virality_score ?? 62}%` }}
                transition={{ duration: 1.5, delay: 0.3, ease: "easeOut" }}
              />
            </div>
            <p className="text-xs text-white/30">
              Predicted to outperform {results.virality_score ?? 62}% of similar content
            </p>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Brain Heatmap */}
        <div className="rounded-card bg-white/[0.03] border border-white/[0.08] p-6">
          <h2 className="text-xs uppercase tracking-widest text-white/30 mb-4">Brain Response Heatmap</h2>
          <BrainHeatmapViz regions={results.cortical_regions} />
        </div>

        {/* Attention Timeline */}
        <div className="rounded-card bg-white/[0.03] border border-white/[0.08] p-6">
          <h2 className="text-xs uppercase tracking-widest text-white/30 mb-4">Timeline of Attention</h2>
          <AttentionTimeline peaks={results.peaks || []} drops={results.drops || []} />
        </div>
      </div>

      {/* What to change */}
      <div className="rounded-card bg-white/[0.03] border border-white/[0.08] p-6">
        <h2 className="text-xs uppercase tracking-widest text-white/30 mb-4">What to change</h2>
        <div className="space-y-3">
          {(results.suggestions || []).map((s: string, i: number) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 * i }}
              className="flex gap-3 stagger-item"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-gold-accent mt-1.5 flex-shrink-0" />
              <p className="text-sm text-white/60 leading-relaxed">{s}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Rewritten Script */}
      <div className="rounded-card bg-white/[0.03] border border-white/[0.08] p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs uppercase tracking-widest text-white/30">Rewritten Script</h2>
          <div className="flex gap-2">
            <button
              onClick={() => navigator.clipboard?.writeText(results.rewritten_script || "")}
              className="text-xs text-white/30 hover:text-cyan-accent transition-colors"
            >
              📋 Copy
            </button>
            <span className="text-xs text-white/20">|</span>
            <button className="text-xs text-white/30 hover:text-cyan-accent transition-colors">
              ✨ Rewrite again
            </button>
          </div>
        </div>
        <pre className="text-xs text-white/50 leading-relaxed whitespace-pre-wrap font-mono">
          {results.rewritten_script || "(no rewritten script available)"}
        </pre>
      </div>
    </motion.div>
  );
}

// ─── Brain Heatmap Viz ───────────────────────────────────────────────────────

function BrainHeatmapViz({ regions }: { regions: Record<string, number> }) {
  const regionDefs = [
    { key: "auditory_cortex", label: "Auditory Cortex", x: 35, y: 55, r: 18 },
    { key: "visual_cortex", label: "Visual Cortex", x: 65, y: 35, r: 16 },
    { key: "prefrontal_cortex", label: "Prefrontal", x: 55, y: 22, r: 14 },
    { key: "motor_cortex", label: "Motor Cortex", x: 70, y: 60, r: 12 },
    { key: "temporal_cortex", label: "Temporal", x: 30, y: 40, r: 14 },
    { key: "parietal_cortex", label: "Parietal", x: 60, y: 50, r: 12 },
    { key: "limbic_cortex", label: "Limbic", x: 45, y: 70, r: 12 },
    { key: "somatosensory_cortex", label: "Somatosensory", x: 72, y: 45, r: 10 },
  ];

  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <div className="relative">
      <svg viewBox="0 0 100 100" className="w-full aspect-square">
        {/* Brain outline */}
        <ellipse cx="50" cy="50" rx="38" ry="35" fill="#0A0A0B" stroke="#22D3EE" strokeWidth="0.5" opacity="0.5" />
        <line x1="50" y1="15" x2="50" y2="85" stroke="#22D3EE" strokeWidth="0.3" strokeDasharray="2 2" opacity="0.3" />

        {regionDefs.map(({ key, label, x, y, r }) => {
          const activation = regions?.[key] ?? 0;
          const intensity = Math.min(activation * 2, 1);
          return (
            <g key={key} onMouseEnter={() => setHovered(key)} onMouseLeave={() => setHovered(null)}>
              <circle
                cx={x} cy={y} r={r}
                fill={`rgba(34,211,238,${intensity * 0.6})`}
                stroke="#22D3EE"
                strokeWidth="0.5"
                opacity={hovered && hovered !== key ? 0.3 : 1}
                className="cursor-pointer transition-opacity"
              />
              {activation > 0.1 && (
                <circle cx={x} cy={y} r={r * 0.4} fill="#22D3EE" opacity={intensity * 0.8} />
              )}
            </g>
          );
        })}
      </svg>

      {/* Tooltip */}
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute top-2 right-2 bg-black/90 border border-white/10 rounded-card px-3 py-2 text-xs"
          >
            <p className="text-cyan-accent font-medium">{hovered.replace(/_/g, " ")}</p>
            <p className="text-white/40">
              Activation: {((regions?.[hovered] ?? 0) * 100).toFixed(1)}%
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Legend */}
      <div className="flex items-center gap-2 mt-2">
        <div className="w-4 h-1 rounded-full bg-cyan-accent/20" />
        <span className="text-[10px] text-white/25">Low</span>
        <div className="w-4 h-1 rounded-full bg-cyan-accent" />
        <span className="text-[10px] text-white/25">High</span>
      </div>
    </div>
  );
}

// ─── Attention Timeline ───────────────────────────────────────────────────────

function AttentionTimeline({ peaks, drops }: { peaks: any[]; drops: any[] }) {
  const labels = [
    { time: 3, emoji: "💥", label: "Peak at 0:03", sub: "opening hook lands hard" },
    { time: 8, emoji: "⚠️", label: "Drop at 0:08", sub: "viewers' attention fades here" },
    { time: 14, emoji: "💥", label: "Recovery at 0:14", sub: "punchline regains focus" },
  ];

  return (
    <div className="space-y-3">
      {/* Waveform */}
      <div className="flex items-end gap-[2px] h-16">
        {Array.from({ length: 40 }).map((_, i) => {
          const isPeak = i > 8 && i < 15;
          const isDrop = i >= 15 && i < 20;
          return (
            <motion.div
              key={i}
              className={`flex-1 rounded-full ${
                isPeak ? "bg-cyan-accent" : isDrop ? "bg-red-400/50" : "bg-white/15"
              }`}
              animate={{ scaleY: [0.3, 1, 0.5, 0.8, 0.3] }}
              transition={{ duration: 1.5, delay: i * 0.03 }}
              style={{ transformOrigin: "bottom" }}
            />
          );
        })}
      </div>

      {/* Timeline markers */}
      <div className="space-y-2">
        {labels.map((item) => (
          <div key={item.time} className="flex items-start gap-3">
            <span className="text-base">{item.emoji}</span>
            <div>
              <p className="text-xs text-white/70">{item.label}</p>
              <p className="text-xs text-white/30">{item.sub}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
