# TRIBE v2 Virality Lab

Predict how the human brain responds to your video — before you post it.

Powered by Meta's open-source [TRIBE v2](https://github.com/facebookresearch/tribev2) brain encoding model. Trained on 720+ subjects, 1,000+ hours of fMRI data, three foundation models (LLaMA 3.2 + V-JEPA2 + Wav2Vec-BERT).

> **CC BY-NC 4.0 — Research and non-commercial use only.**

---

## Setup

### 1. Install TRIBE v2

```bash
pip install -e C:\Users\swast\Desktop\tribev2
```

Or from within `tribev2/`:
```bash
pip install -e .
```

### 2. Backend

```bash
cd backend
pip install -r requirements.txt

# Set your MiniMax API key (already in .env.local, or export here)
export MINIMAX_API_KEY="sk-cp-..."

uvicorn main:app --reload --port 8000
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Pages

| Route | Description |
|---|---|
| `/` | Landing page |
| `/analyze` | Upload video/image/script → get virality score + rewritten script |
| `/generate` | LLM generates a script from scratch → TRIBE scores it |

---

## Stack

- **Frontend**: Next.js 14 + TypeScript + TailwindCSS + Framer Motion
- **Backend**: FastAPI + Python + `tribev2` package
- **LLM**: MiniMax API (script generation + interpretation)
- **TRIE v2**: Local inference — brain response predictions

---

## API Endpoints

`POST /analyze` — Run TRIBE v2 on video/audio/text
`POST /interpret` — Convert TRIBE output → virality insights via LLM
`POST /generate-script` — Generate a video script from scratch

---

## Legal

TRIBE v2 is released under CC BY-NC 4.0. This tool is not affiliated with or endorsed by Meta. Brain activation predictions are a proxy for attention/engagement — not a guaranteed virality predictor.
