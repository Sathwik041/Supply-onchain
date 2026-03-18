import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const jsonBody = await request.json();

    const pinataRes = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        pinata_api_key: process.env.NEXT_PUBLIC_PINATA_API_KEY || "",
        pinata_secret_api_key: process.env.NEXT_PUBLIC_PINATA_API_SECRET || "",
      },
      body: JSON.stringify(jsonBody),
    });

    const resData = await pinataRes.json();

    if (!pinataRes.ok) {
      return NextResponse.json({ error: resData.error || "Pinata API Error" }, { status: pinataRes.status });
    }

    return NextResponse.json(resData, { status: 200 });
  } catch (error: any) {
    console.error("Error in /api/pinata/json:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
