import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { getSeoUsage } from "@/lib/seoRateLimit";

export async function GET() {
    const h = headers();

    const ip =
        (await h).get("x-forwarded-for")?.split(",")[0]?.trim() ||
        (await h).get("x-real-ip") ||
        (await h).get("cf-connecting-ip") ||
        "unknown";
    console.log(ip)

    const usage = await getSeoUsage(ip);

    return NextResponse.json(usage);
}
