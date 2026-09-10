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

  // Fetch full user and business profile from database
  const dbUser = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      businessProfile: {
        include: {
          invoices: {
            include: {
              lineItems: true,
              customer: true,
            },
            orderBy: { createdAt: "desc" },
          },
        },
      },
    },
  });

  const invoices = dbUser?.businessProfile?.invoices || [];

  let totalInvoices = invoices.length;
  let paidAmount = 0;
  let pendingDrafts = 0;
  let totalDraftAmount = 0;

  invoices.forEach((inv) => {
    const itemsTotal = inv.lineItems.reduce(
      (sum, item) => sum + item.quantity * item.rate,
      0
    );
    const invoiceTotal = itemsTotal * (1 + (inv.taxRate || 0) / 100);

    if (inv.status === "SENT") {
      paidAmount += invoiceTotal;
    } else {
      pendingDrafts += 1;
      totalDraftAmount += invoiceTotal;
    }
  });

  const user = {
    id: dbUser?.id || session.user.id,
    name: dbUser?.name || session.user.name,
    email: dbUser?.email || session.user.email,
    image: dbUser?.image || session.user.image,
    businessProfile: dbUser?.businessProfile || null,
  };

  const initialStats = {
    totalInvoices,
    paidAmount,
    pendingDrafts,
    totalDraftAmount,
  };

  const initialInvoices = invoices.map((inv) => ({
    id: inv.id,
    invoiceNumber: inv.invoiceNumber,
    clientName: inv.customer?.name || "Client",
    date: inv.date.toISOString().split("T")[0],
    status: inv.status,
    currency: inv.currency,
    amount: inv.lineItems.reduce((sum, item) => sum + item.quantity * item.rate, 0) * (1 + (inv.taxRate || 0) / 100),
  }));

  return (
    <DashboardClient
      user={user}
      initialStats={initialStats}
      initialInvoices={initialInvoices}
    />
  );
}
