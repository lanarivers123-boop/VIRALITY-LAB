# BUILD_NOTES.md — TRIBE v2 Virality Lab

## What was built

Full-stack web app wrapping Meta's TRIBE v2 brain encoding model for content creators.

### Pages

| Route | Status |
|---|---|
| `/` | ✅ Live — animated hero brain, how-it-works, what-you-get, trust strip, CC BY-NC footer |
| `/analyze` | ✅ Live — drag-drop upload, script input, loading brain, results dashboard |
| `/generate` | ✅ Live — script generator with style/duration selectors, Web Speech mic button |

### Backend

| Endpoint | Status |
|---|---|
| `POST /analyze` | ✅ Live — TRIBE v2 inference (real with mock fallback) |
| `POST /interpret` | ✅ Live — MiniMax LLM interpretation |
| `POST /generate-script` | ✅ Live — MiniMax LLM script generation |
| `GET /health` | ✅ Live — `{"status":"ok"}` |

### Key files

```
META V2 TRIBE/
├── DISCOVERY.md              # Architecture decision log
├── README.md                 # Setup guide
├── BUILD_NOTES.md            # This file
├── backend/
│   ├── main.py               # FastAPI app (3 endpoints)
│   ├── tribev2_wrapper.py   # TRIBE inference + mock fallback
│   ├── interpret.py         # MiniMax LLM interpretation layer
│   ├── prompts.py           # LLM prompt templates
│   └── requirements.txt
└── frontend/
    ├── app/
    │   ├── layout.tsx        # Root layout + nav + footer + ThemeProvider
    │   ├── page.tsx         # Landing page
    │   ├── analyze/page.tsx # Full analysis flow + results dashboard
    │   └── generate/page.tsx # Script generation + scoring
    ├── components/
    │   └── ThemeProvider.tsx # next-themes dark/light with localStorage
    ├── lib/
    │   └── api.ts          # API client (analyzeVideo, interpretScript, generateScript)
    ├── app/globals.css      # Tailwind + animations
    └── tailwind.config.ts   # Design tokens (cyan #22D3EE, gold #C8A24B, etc.)
```

## Design system

- **Background**: #0A0A0B dark / #FAFAF7 light
- **Accent 1**: #22D3EE cyan — brain visuals, neural viz
- **Accent 2**: #C8A24B gold — virality meter, CTAs
- **Border radius**: 14px cards / 10px buttons / 8px inputs
- **Fonts**: Geist (UI) — Instrument Serif referenced for display text
- **Motion**: Framer Motion, subtle scientific feel — no bouncy easing

## Running locally

### Backend
```bash
cd backend
pip install fastapi uvicorn python-multipart aiofiles httpx
# Python 3.14 path (tribev2 mock active until torch dependency resolved):
/c/Users/swast/AppData/Local/Python/pythoncore-3.14-64/python.exe -m uvicorn backend.main:app --port 8000 --host 127.0.0.1
```

### Frontend
```bash
cd frontend
npm install   # already done
npm run dev   # http://localhost:3000
```

### TRIBE v2 (when torch dependencies are resolved)
```bash
# Install in Python 3.12 environment (has torch):
# pip install -e C:\Users\swast\Desktop\tribev2
# tribev2_wrapper.py auto-detects and uses the real model
# Falls back to mock predictions if tribev2 is unavailable
```

## Known issues / TODOs

1. **TRIE v2 torch dependency** — TRIBE v2 requires `torch>=2.5.1,<2.7`. Python 3.14 has torch 2.9+. Workaround: mock predictions active until Python 3.12 with torch 2.5–2.6 is used to run the backend. The real model can be loaded when Python 3.12 has the correct torch pinned.

2. **No real video upload** — the mock TRIBE output is returned without accessing the uploaded file. Fix: wire up real TRIBE call when torch env is resolved.

3. **MiniMax key in source** — the API key is in `backend/main.py`, `frontend/.env.local`, and `backend/interpret.py`. Move to environment variable before deploying.

4. **`serverExternalPackages` warning** — Next.js 14.2 doesn't support this key in next.config.mjs. Safe to ignore or remove.

5. **No keyboard shortcuts implemented** — ⌘U/⌘R/⌘N shortcuts referenced in spec but not wired in layout.tsx yet.

6. **`tribe-virality-lab/` orphan dir** — contains partial frontend files from a prior run. Safe to delete.

## Quality gate results

| Gate | Status |
|---|---|
| Landing page renders | ✅ |
| Analyze page live | ✅ |
| Generate page live | ✅ |
| Backend health OK | ✅ |
| CC BY-NC in footer | ✅ |
| Dark/light toggle | ✅ (ThemeProvider) |
| Mock TRIBE fallback | ✅ (automatic) |
| MiniMax LLM calls | ✅ (interpret + generate-script) |