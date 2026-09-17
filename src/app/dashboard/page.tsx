import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import DashboardClient from "./DashboardClient";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.email) {
    redirect("/auth/signin");
  }

  const dbUser = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      id: true, name: true, email: true, image: true,
      businessProfile: { select: { id: true } }
    }
  });

  const businessProfileId = dbUser?.businessProfile?.id;
  const limit = 10;

  let invoices: any[] = [];
  let totalCount = 0;
  let paidAmount = 0;
  let pendingDrafts = 0;
  let totalDraftAmount = 0;

  if (businessProfileId) {
    [invoices, totalCount] = await Promise.all([
      prisma.invoice.findMany({
        where: { businessProfileId },
        include: { lineItems: true, customer: true },
        orderBy: { createdAt: "desc" },
        skip: 0,
        take: limit,
      }),
      prisma.invoice.count({ where: { businessProfileId } })
    ]);

    const allInvoicesForStats = await prisma.invoice.findMany({
      where: { businessProfileId },
      select: {
        status: true,
        taxRate: true,
        lineItems: { select: { quantity: true, rate: true } },
      },
    });

    allInvoicesForStats.forEach((inv) => {
      const itemsTotal = inv.lineItems.reduce(
        (sum, item) => sum + item.quantity * item.rate,
        0
      );
      const invoiceTotal = itemsTotal * (1 + (inv.taxRate || 0) / 100);

      if (inv.status === "PAID" || inv.status === "SENT") {
        paidAmount += invoiceTotal;
      }
      if (inv.status === "DRAFT") {
        pendingDrafts += 1;
        totalDraftAmount += invoiceTotal;
      }
    });
  }

  const user = {
    id: dbUser?.id || session.user.id,
    name: dbUser?.name || session.user.name,
    email: dbUser?.email || session.user.email,
    image: dbUser?.image || session.user.image,
    businessProfile: dbUser?.businessProfile || null,
  };

  const initialStats = {
    totalInvoices: totalCount,
    paidAmount,
    pendingDrafts,
    totalDraftAmount,
  };

  const initialPagination = {
    total: totalCount,
    page: 1,
    limit,
    totalPages: Math.ceil(totalCount / limit) || 1,
  };

  const initialInvoices = invoices.map((inv) => ({
    id: inv.id,
    invoiceNumber: inv.invoiceNumber,
    clientName: inv.customer?.name || "Client",
    date: inv.date.toISOString().split("T")[0],
    status: inv.status,
    currency: inv.currency,
    amount: inv.lineItems.reduce((sum: number, item: any) => sum + item.quantity * item.rate, 0) * (1 + (inv.taxRate || 0) / 100),
  }));

  return (
    <DashboardClient
      user={user}
      initialStats={initialStats}
      initialInvoices={initialInvoices}
      initialPagination={initialPagination}
    />
  );
}
