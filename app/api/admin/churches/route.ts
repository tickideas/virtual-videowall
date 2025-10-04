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

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: "Church ID is required" },
        { status: 400 }
      );
    }

    // Check if church has any sessions
    const churchWithSessions = await prisma.church.findFirst({
      where: { id },
      include: {
        _count: {
          select: { sessions: true }
        }
      }
    });

    if (!churchWithSessions) {
      return NextResponse.json(
        { error: "Church not found" },
        { status: 404 }
      );
    }

    if (churchWithSessions._count.sessions > 0) {
      return NextResponse.json(
        { error: "Cannot delete church with existing sessions. Please delete sessions first." },
        { status: 400 }
      );
    }

    await prisma.church.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting church:", error);
    return NextResponse.json(
      { error: "Failed to delete church" },
      { status: 500 }
    );
  }
}
