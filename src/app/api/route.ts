const groqModelName = process.env.GROQ_MODEL_NAME || "openai/gpt-oss-120b";
import { NextResponse } from "next/server";

export async function GET() {
    return NextResponse.json({
        message: "API 정상 작동",
    });
}