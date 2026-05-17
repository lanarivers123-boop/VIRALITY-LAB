"use client";

import { useState } from "react";
import Link from "next/link";

function BrainIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 3c.5-1.5 2-2 3.5-1.5S15 3 15.5 4.5c.5 1.5 0 3-1.5 4S12 9 11 8s-2-2.5-2-5z" />
      <path d="M15 6c2 0 4 1 4.5 3.5S18 15 16 16s-3.5 1-4-1-.5-4.5 1-6 2-2.5 2-2.5" />
      <path d="M9 3c-.5-1.5-2-2-3.5-1.5S3 3 2.5 4.5C2 6 2.5 7.5 4 8.5s2.5.5 3-.5 1-3 2-5z" />
      <path d="M4 9c-2 0-4 1-4.5 3.5S1 18 3 19s3.5 1 4-1 .5-4.5-1-6-2-2.5-2-2.5" />
      <path d="M12 8v8M8 12h8" />
    </svg>
  );
}

export function Nav() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 bg-bg-dark/90 backdrop-blur-md border-b border-white/5">
        <Link href="/" className="flex items-center gap-2">
          <BrainIcon className="w-5 h-5 text-cyan-accent" />
          <span className="text-sm font-semibold tracking-tight text-white">
            TRIBE<span className="text-cyan-accent">v2</span>
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-6 text-sm text-white/60">
          <Link href="/analyze" className="hover:text-cyan-accent transition-colors">Analyze</Link>
          <Link href="/generate" className="hover:text-cyan-accent transition-colors">Generate</Link>
          <a href="https://github.com/facebookresearch/tribev2" target="_blank" rel="noopener noreferrer" className="hover:text-cyan-accent transition-colors">GitHub</a>
          <span className="text-xs text-white/30">🌙 / ☀️</span>
        </div>

        <button
          className="md:hidden p-2 text-white/50"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Menu"
        >
          {menuOpen ? "✕" : "☰"}
        </button>
      </nav>

      {menuOpen && (
        <div className="fixed top-12 left-0 right-0 z-40 bg-bg-dark/98 backdrop-blur-md border-b border-white/10 px-5 py-6 space-y-4 md:hidden">
          <Link href="/analyze" className="block text-base text-white/70 hover:text-cyan-accent" onClick={() => setMenuOpen(false)}>Analyze</Link>
          <Link href="/generate" className="block text-base text-white/70 hover:text-cyan-accent" onClick={() => setMenuOpen(false)}>Generate</Link>
          <a href="https://github.com/facebookresearch/tribev2" target="_blank" rel="noopener noreferrer" className="block text-base text-white/70 hover:text-cyan-accent" onClick={() => setMenuOpen(false)}>GitHub</a>
          <span className="block text-xs text-white/30">🌙 / ☀️</span>
        </div>
      )}
    </>
  );
}