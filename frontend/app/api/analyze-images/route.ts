import { NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const backendRes = await fetch(`${API_BASE}/analyze-images`, {
      method: "POST",
      body: formData,
    });
    const data = await backendRes.json();
    if (!backendRes.ok) return NextResponse.json(data, { status: backendRes.status });
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ detail: e.message || "Proxy error" }, { status: 502 });
  }
}