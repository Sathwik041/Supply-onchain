import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    // We already formed the exact formData on the frontend, we just need to forward it.
    // However, Node's fetch requires the body to be the FormData object directly when sending multipart.

    const pinataRes = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
      method: "POST",
      headers: {
        pinata_api_key: process.env.NEXT_PUBLIC_PINATA_API_KEY || "",
        pinata_secret_api_key: process.env.NEXT_PUBLIC_PINATA_API_SECRET || "",
      },
      body: formData,
    });

    const resData = await pinataRes.json();

    if (!pinataRes.ok) {
      return NextResponse.json({ error: resData.error || "Pinata API Error" }, { status: pinataRes.status });
    }

    return NextResponse.json(resData, { status: 200 });
  } catch (error: any) {
    console.error("Error in /api/pinata/file:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
