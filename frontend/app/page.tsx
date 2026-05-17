"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import Link from "next/link";

export default function HomePage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 400], [0, 80]);
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);

  return (
    <div className="min-h-screen bg-bg-dark text-white">
      {/* Hero */}
      <section
        ref={heroRef}
        className="relative flex flex-col items-center justify-center min-h-[90vh] px-6 overflow-hidden"
      >
        {/* Background grid */}
        <div className="absolute inset-0 bg-[linear-gradient(#22D3EE08_1px,transparent_1px),linear-gradient(90deg,#22D3EE08_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_0%,black,transparent)]" />

        <motion.div style={{ y, opacity }} className="relative z-10 text-center max-w-4xl mx-auto">
          {/* Brain animation */}
          <div className="flex justify-center mb-12">
            <HeroBrain />
          </div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="font-serif text-2xl sm:text-3xl md:text-6xl lg:text-7xl font-normal leading-[1.1] tracking-tight mb-6"
          >
            Predict how the human brain responds to your video —{" "}
            <span className="text-cyan-accent">before you post it.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15, ease: "easeOut" }}
            className="text-base md:text-lg text-white/50 max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Powered by Meta&apos;s TRIBE v2, trained on 720+ subjects and 1,000+ hours of fMRI
            data. The first virality meter built on neuroscience, not vibes.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link
              href="/analyze"
              className="px-8 py-4 rounded-btn bg-gold-accent text-bg-dark font-semibold text-sm hover:brightness-110 transition-all"
            >
              Analyze my content →
            </Link>
            <Link
              href="/generate"
              className="px-8 py-4 rounded-btn border border-white/20 text-sm hover:bg-white/5 transition-all"
            >
              Generate a script from scratch →
            </Link>
          </motion.div>
        </motion.div>

        {/* Subtext */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 1 }}
          className="relative z-10 mt-8 text-xs text-white/25 max-w-xl text-center"
        >
          Trained on 720+ subjects, 1,000+ hours of fMRI data, three foundation models
          (LLaMA 3.2 + V-JEPA2 + Wav2Vec-BERT). Open-source neuroscience, packaged for creators.
        </motion.p>
      </section>

      {/* How it works */}
      <section className="px-6 py-24 max-w-5xl mx-auto">
        <SectionLabel>How it works</SectionLabel>
        <div className="grid md:grid-cols-3 gap-6 mt-8">
          {[
            {
              step: "01",
              title: "Upload your content",
              desc: "Drop a video (MP4/MOV), paste a script, or describe your concept. Max 200MB.",
              icon: "↑",
            },
            {
              step: "02",
              title: "TRIE v2 predicts",
              desc: "V-JEPA2 extracts visual features, Wav2Vec-BERT handles audio, TRIBE v2 maps it all to brain cortex.",
              icon: "◉",
            },
            {
              step: "03",
              title: "Get your rewrite",
              desc: "See exactly where attention peaks and drops. Get a line-by-line rewritten script.",
              icon: "✓",
            },
          ].map((card, i) => (
            <motion.div
              key={card.step}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="rounded-card bg-white/[0.03] border border-white/[0.08] p-6"
            >
              <div className="text-cyan-accent text-xs font-mono mb-4">{card.step}</div>
              <div className="text-2xl mb-3">{card.icon}</div>
              <h3 className="text-sm font-semibold mb-2 text-white">{card.title}</h3>
              <p className="text-xs text-white/40 leading-relaxed">{card.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* What you get */}
      <section className="px-6 py-24 max-w-5xl mx-auto border-t border-white/[0.05]">
        <SectionLabel>What you get</SectionLabel>
        <div className="grid md:grid-cols-2 gap-6 mt-8">
          {[
            {
              title: "Virality Score",
              desc: "A calibrated 0–100 score. Not a guess — a percentile relative to average brain activation across 720+ subjects.",
              badge: "62 / 100",
              badgeColor: "text-cyan-accent",
            },
            {
              title: "Brain Heatmap",
              desc: "Interactive cortex map. Cyan hotspots = high activation zones. Hover any region for a plain-English explanation.",
              badge: null,
            },
            {
              title: "Attention Timeline",
              desc: "Every peak and drop, timestamped to your video. Know exactly what landed and what lost them.",
              badge: null,
            },
            {
              title: "Suggested Rewrites",
              desc: "Five specific, actionable changes. Not vague advice — a rewritten script with change-tracking highlights.",
              badge: null,
            },
          ].map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.4 }}
              className="rounded-card bg-white/[0.03] border border-white/[0.08] p-6 flex flex-col gap-3"
            >
              <div className="flex items-start justify-between">
                <h3 className="text-sm font-semibold text-white">{item.title}</h3>
                {item.badge && (
                  <span className={`text-lg font-serif font-normal ${item.badgeColor}`}>
                    {item.badge}
                  </span>
                )}
              </div>
              <p className="text-xs text-white/40 leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Trust strip */}
      <section className="px-6 py-16 border-t border-white/[0.05]">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-xs text-white/25 uppercase tracking-widest mb-6">
            Built on open-source Meta research
          </p>
          <div className="flex flex-wrap justify-center gap-8 md:gap-16">
            {["LLaMA 3.2", "V-JEPA2", "Wav2Vec-BERT"].map((label) => (
              <div key={label} className="text-white/20 text-sm font-mono">
                {label}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-px flex-1 bg-white/[0.08]" />
      <span className="text-xs text-white/30 uppercase tracking-widest">{children}</span>
      <div className="h-px flex-1 bg-white/[0.08]" />
    </div>
  );
}

// Hero brain SVG with cyan pulse animation
function HeroBrain() {
  return (
    <div className="relative w-40 h-40">
      {/* Pulse rings */}
      {[1, 2, 3].map((i) => (
        <motion.div
          key={i}
          className="absolute inset-0 rounded-full border border-cyan-accent/20"
          animate={{ scale: [1, 1.5], opacity: [0.4, 0] }}
          transition={{
            duration: 2.5,
            delay: i * 0.8,
            repeat: Infinity,
            ease: "easeOut",
          }}
        />
      ))}

      {/* Brain SVG */}
      <motion.svg
        viewBox="0 0 100 100"
        className="w-full h-full brain-pulse"
        fill="none"
        stroke="#22D3EE"
        strokeWidth="1"
      >
        {/* Left hemisphere */}
        <path d="M30 25c0-8 6-15 15-15s15 7 15 15c0 6-3 11-8 14-3 2-7 3-7 3s-4-1-7-3C33 33 30 28 30 25z" opacity="0.7" />
        <path d="M25 40c-6 1-11 7-10 15 0 6 4 12 10 13" opacity="0.4" />
        <path d="M38 35c2 4 2 9-1 13" opacity="0.4" />
        {/* Right hemisphere */}
        <path d="M70 25c0-8-6-15-15-15S40 17 40 25c0 6 3 11 8 14 3 2 7 3 7 3s4-1 7-3C67 33 70 28 70 25z" opacity="0.7" />
        <path d="M75 40c6 1 11 7 10 15 0 6-4 12-10 13" opacity="0.4" />
        <path d="M62 35c-2 4-2 9 1 13" opacity="0.4" />
        {/* Corpus callosum */}
        <motion.line
          x1="50" y1="40" x2="50" y2="55"
          stroke="#22D3EE"
          strokeWidth="1.5"
          strokeDasharray="3 2"
          animate={{ strokeDashoffset: [0, 10] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          opacity="0.6"
        />
        {/* Pulse dots */}
        {[30, 50, 70].map((x, i) => (
          <motion.circle
            key={x}
            cx={x}
            cy="50"
            r="2"
            fill="#22D3EE"
            animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
            transition={{ duration: 1.5, delay: i * 0.4, repeat: Infinity }}
          />
        ))}
      </motion.svg>

      {/* Waveform bars (fake audio) */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-[2px] items-end h-4">
        {[0.4, 0.7, 1, 0.6, 0.8, 0.5, 0.9, 0.3].map((h, i) => (
          <motion.div
            key={i}
            className="w-[2px] bg-cyan-accent/50 rounded-full"
            style={{ height: `${h * 16}px` }}
            animate={{ scaleY: [1, 0.4, 1] }}
            transition={{ duration: 1.2, delay: i * 0.1, repeat: Infinity }}
          />
        ))}
      </div>
    </div>
  );
}
