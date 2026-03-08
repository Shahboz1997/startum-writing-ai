import { getPrisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    // Ensure DATABASE_URL (or DIRECT_URL) is available before using Prisma
    const dbUrl = process.env.DATABASE_URL || process.env.DIRECT_URL;
    if (!dbUrl) {
      console.error("REGISTRATION_ERROR: DATABASE_URL and DIRECT_URL are not set in .env");
      return NextResponse.json(
        { error: "Server configuration error: database URL not configured." },
        { status: 503 }
      );
    }

    const prisma = getPrisma();

    const body = await request.json();
    const rawEmail = body?.email;
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const password = body?.password;

    if (!rawEmail || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }

    const email = String(rawEmail).trim().toLowerCase();
    if (!email) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }

    if (!name) {
      return NextResponse.json({ error: "Name is required." }, { status: 400 });
    }

    // If the user already exists, return 400 instead of 500
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email already exists" },
        { status: 400 }
      );
    }

    // Hash password with bcrypt (rounds: 10)
    const hashedPassword = await bcrypt.hash(String(password), 10);

    // Save user to database; User model fields: email, password, name (id, createdAt, etc. are auto-set)
    const user = await prisma.user.create({
      data: {
        email,
        name: name || null,
        password: hashedPassword,
      },
    });

    // Return 201 with user object (omit password)
    const { password: _p, ...userWithoutPassword } = user;
    return NextResponse.json(userWithoutPassword, { status: 201 });
  } catch (error) {
    console.error("REGISTRATION_ERROR:", error);

    const code = error?.code;
    const message = error?.message ?? "";

    if (code === "P2002") {
      return NextResponse.json(
        { error: "Email already exists" },
        { status: 400 }
      );
    }

    const isDbUnreachable =
      code === "P1001" ||
      /Can't reach database server/i.test(message) ||
      /Connection refused/i.test(message);

    if (isDbUnreachable) {
      return NextResponse.json(
        {
          error:
            "Database unavailable. Check DATABASE_URL (and DIRECT_URL) in .env.local.",
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: "Registration failed. Please try again." },
      { status: 500 }
    );
  }
}
