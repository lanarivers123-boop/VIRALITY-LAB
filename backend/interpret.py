"""LLM interpretation layer — calls MiniMax API to convert TRIBE output → virality insights."""

import json
import os
import re
import httpx
from typing import Any

from .prompts import INTERPRETATION_USER_PROMPT, SYSTEM_PROMPT

MINIMAX_API_KEY = os.getenv("MINIMAX_API_KEY", "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")
MINIMAX_ENDPOINT = "https://api.openai.com/v1/chat/completions"
MINIMAX_MODEL = "gpt-4o-mini"


def format_tribe_output_for_llm(tribe_output: dict[str, Any]) -> str:
    """Format raw TRIBE output into a compact text summary for the LLM prompt."""
    duration = tribe_output.get("duration_sec", 0)
    regions = tribe_output.get("cortical_regions", {})
    segments = tribe_output.get("segments", [])
    timestamps = tribe_output.get("timestamps", [])

    # Build activation bar per region
    region_lines = []
    for region, activation in sorted(regions.items(), key=lambda x: x[1], reverse=True):
        bar = "█" * int(activation * 10) + "░" * (10 - int(activation * 10))
        region_lines.append(f"  {region}: {bar} ({activation:.3f})")
    region_summary = "\n".join(region_lines) if region_lines else "No cortical data available."

    # Build segment activations
    n_steps = len(timestamps)
    seg_lines = []
    for seg in segments:
        start = seg.get("start", 0)
        end = seg.get("end", 0)
        label = seg.get("label", "unknown")

        # Find timesteps in this range
        in_range = [
            i for i, t in enumerate(timestamps)
            if start <= t <= end
        ]
        if in_range:
            raw_preds = tribe_output.get("raw_preds", [])
            vals = [raw_preds[i][0] for i in in_range if i < len(raw_preds)]
            avg_act = sum(vals) / len(vals) if vals else 0.0
        else:
            avg_act = 0.0

        seg_lines.append(f"  [{start:.1f}-{end:.1f}s] {label}: activation={avg_act:.3f}")

    return f"""Duration: {duration:.1f}s
Cortical region activations (0-1 scale):
{region_summary}

Segment activations:
{chr(10).join(seg_lines)}"""


def build_interpretation_prompt(tribe_output: dict[str, Any], script: str) -> list[dict[str, str]]:
    """Build the messages array for the MiniMax API call."""
    tribe_summary = format_tribe_output_for_llm(tribe_output)

    # Format timestamps and segments
    segments = tribe_output.get("segments", [])
    timestamps = tribe_output.get("timestamps", [])

    seg_summary = "\n".join(
        f"  [{s.get('start', 0):.1f}-{s.get('end', 0):.1f}s] {s.get('label', 'unknown')}"
        for s in segments
    ) or "  No segment data available."

    timestamps_and_segments = f"""Timestamps ({len(timestamps)} steps):
  {', '.join(f'{t:.2f}s' for t in timestamps[:20])}...
Segments:
{seg_summary}"""

    user_prompt = INTERPRETATION_USER_PROMPT.format(
        raw_activation_summary=tribe_summary,
        timestamps_and_segments=timestamps_and_segments,
        script_content=script or "(no script provided)",
    )

    return [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": user_prompt},
    ]


async def call_minimax_llm(messages: list[dict[str, str]]) -> str:
    """Call MiniMax API and return the raw response text."""
    async with httpx.AsyncClient(timeout=120.0) as client:
        response = await client.post(
            MINIMAX_ENDPOINT,
            headers={
                "Authorization": f"Bearer {MINIMAX_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": MINIMAX_MODEL,
                "messages": messages,
                "response_format": {"type": "json_object"},
                "temperature": 0.3,
            },
        )
        response.raise_for_status()
        data = response.json()
        # MiniMax ChatCompletion response shape
        return data["choices"][0]["message"]["content"]


def parse_interpretation_response(raw_text: str) -> dict[str, Any]:
    """Parse JSON from the LLM response, with fallback for malformed output."""
    # Try to extract JSON from code blocks or partial output
    text = raw_text.strip()

    # Remove markdown code fences
    text = re.sub(r"```json\s*", "", text)
    text = re.sub(r"```\s*", "", text)

    try:
        return json.loads(text)
    except json.JSONDecodeError:
        # Try to find JSON object in the text
        match = re.search(r"\{[\s\S]*\}", text)
        if match:
            try:
                return json.loads(match.group())
            except json.JSONDecodeError:
                pass

    # Fallback — return a safe default
    return {
        "virality_score": 50,
        "summary": "Unable to generate analysis. Please try again.",
        "peaks": [],
        "drops": [],
        "suggestions": ["Check the input file and try again."],
        "rewritten_script": "",
    }


async def interpret(
    tribe_output: dict[str, Any],
    original_script: str,
    video_metadata: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """
    Main entry point. Takes TRIBE v2 output + original script,
    calls MiniMax LLM, returns structured virality interpretation.
    """
    messages = build_interpretation_prompt(tribe_output, original_script)

    raw_response = await call_minimax_llm(messages)
    result = parse_interpretation_response(raw_response)

    # Ensure all required keys exist
    result.setdefault("virality_score", 50)
    result.setdefault("summary", "")
    result.setdefault("peaks", [])
    result.setdefault("drops", [])
    result.setdefault("suggestions", [])
    result.setdefault("rewritten_script", original_script)

    return result
