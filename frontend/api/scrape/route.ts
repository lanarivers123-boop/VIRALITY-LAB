import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: "URL required" }, { status: 400 });
    }

    // Return mock scrape data based on URL
    return NextResponse.json({
      url,
      title: "Product Landing Page — Premium Collection",
      description: "Discover our latest collection. Built for creators who demand quality and style.",
      text: "Welcome to our premium collection. We believe in quality over quantity. Every piece is crafted with attention to detail. Our customers are creators, athletes, and professionals who value both form and function. Shop now for exclusive launch pricing.",
      image_urls: [],
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}