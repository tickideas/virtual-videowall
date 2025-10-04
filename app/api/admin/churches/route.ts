import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateSessionCode } from "@/lib/utils";

export async function GET() {
  try {
    const churches = await prisma.church.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { sessions: true },
        },
      },
    });

    return NextResponse.json({ churches });
  } catch (error) {
    console.error("Error fetching churches:", error);
    return NextResponse.json(
      { error: "Failed to fetch churches" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, location } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Church name is required" },
        { status: 400 }
      );
    }

    let code = generateSessionCode();
    let exists = await prisma.church.findUnique({ where: { code } });
    
    while (exists) {
      code = generateSessionCode();
      exists = await prisma.church.findUnique({ where: { code } });
    }

    const church = await prisma.church.create({
      data: {
        name,
        code,
        location,
      },
    });

    return NextResponse.json({ church });
  } catch (error) {
    console.error("Error creating church:", error);
    return NextResponse.json(
      { error: "Failed to create church" },
      { status: 500 }
    );
  }
}
