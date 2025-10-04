import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId } = body;

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 }
      );
    }

    const session = await prisma.session.update({
      where: { id: sessionId },
      data: {
        isActive: false,
        leftAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      session,
    });
  } catch (error) {
    console.error("Error leaving session:", error);
    return NextResponse.json(
      { error: "Failed to leave session" },
      { status: 500 }
    );
  }
}
