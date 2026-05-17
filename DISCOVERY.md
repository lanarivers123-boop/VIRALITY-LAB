# DISCOVERY.md — TRIBE v2 Virality Lab

## Project Status
**Fresh start.** Empty project dir. TRIBE v2 repo cloned to `C:\Users\swast\Desktop\tribev2\`.

## Stack

| Layer | Choice |
|---|---|
| Frontend | Next.js 14 (App Router) + TypeScript + TailwindCSS + shadcn/ui + Framer Motion |
| Fonts | Geist (UI) + Instrument Serif (display) |
| Backend | Python FastAPI — wraps local TRIBE v2 |
| LLM (interpretation) | MiniMax API (`sk-cp-...`) — or fallback to Claude if key unavailable |
| Storage | local `/tmp` for uploads |

## TRIBE v2 Location
```
C:\Users\swast\Desktop\tribev2\
├── tribev2/          # Python package
├── tribe_demo.ipynb  # Colab demo
└── pyproject.toml
```

Key import: `from tribev2 import TribeModel`
Usage:
```python
model = TribeModel.from_pretrained("facebook/tribev2", cache_folder="./cache")
df = model.get_events_dataframe(video_path="path/to/video.mp4")
preds, segments = model.predict(events=df)  # preds: (n_timesteps, n_vertices)
```

## API Design

### POST /analyze
- Input: `{ input_type: "video"|"audio"|"text", file_path: str, metadata: {...} }`
- Output: `{ raw_preds: [...], segments: [...], cortical_regions: {...}, timestamps: [...], duration_sec: float }`
- Calls TRIBE v2 locally

### POST /interpret
- Input: `{ tribe_output: {...}, original_script: str, video_metadata: {...} }`
- Output: `{ virality_score: int, summary: str, peaks: [...], drops: [...], suggestions: [...], rewritten_script: str }`
- Calls LLM with structured prompt

## Pages

| Route | Purpose |
|---|---|
| `/` | Landing page |
| `/analyze` | Upload → score → results |
| `/generate` | Script generation + scoring |

## Design Tokens

| Token | Dark | Light |
|---|---|---|
| Background | #0A0A0B | #FAFAF7 |
| Accent 1 (cyan) | #22D3EE | #22D3EE |
| Accent 2 (gold) | #C8A24B | #C8A24B |
| Border radius | 14px cards / 10px buttons / 8px inputs | same |
| Motion | Framer Motion useScroll/useTransform, subtle | same |

## Skills Used
- `frontend-design` — for UI tokens, layout
- `design` — for design system
- `nextjs-turbopack` or `nextjs` — for Next.js App Router
- `tailwind-design-system` — for Tailwind tokens
- `art` — for hero brain SVG/visual
- Agent team (A–E) for parallel build

## File Structure (planned)
```
tribe-virality-lab/
├── frontend/            # Next.js app
│   ├── app/
│   │   ├── page.tsx     # Landing
│   │   ├── analyze/
│   │   └── generate/
│   ├── components/
│   ├── lib/
│   └── ...
├── backend/
│   ├── main.py          # FastAPI
│   ├── tribev2_wrapper.py
│   └── interpret.py     # LLM interpretation
├── tribev2/             # symlink to Desktop/tribev2
├── DISCOVERY.md
└── BUILD_NOTES.md
```
