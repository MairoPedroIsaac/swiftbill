import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        businessProfile: {
          include: {
            customers: true,
            items: true,
          },
        },
      },
    });

    if (!user || !user.businessProfile) {
      return NextResponse.json({ customers: [], items: [], nextInvoiceNumber: "INV-001" });
    }

    const nextNum = (user.businessProfile.lastInvoiceNumber || 0) + 1;
    const prefix = user.businessProfile.invoicePrefix || "INV-";
    const nextInvoiceNumber = `${prefix}${String(nextNum).padStart(3, "0")}`;

    return NextResponse.json({
      customers: user.businessProfile.customers,
      items: user.businessProfile.items,
      nextInvoiceNumber,
    });
  } catch (error) {
    console.error("Fetch business data error:", error);
    return NextResponse.json(
      { error: "Failed to fetch business data" },
      { status: 500 }
    );
  }
}
