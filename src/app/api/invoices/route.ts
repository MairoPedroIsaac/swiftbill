import { NextRequest, NextResponse } from "next/server";
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

    if (!user || !user.businessProfile) {
      return NextResponse.json({
        stats: {
          totalInvoices: 0,
          paidAmount: 0,
          pendingDrafts: 0,
          totalDraftAmount: 0,
        },
        invoices: [],
      });
    }

    const invoices = user.businessProfile.invoices || [];

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

      if (inv.status === "PAID" || inv.status === "SENT") {
        paidAmount += invoiceTotal;
      }
      if (inv.status === "DRAFT") {
        pendingDrafts += 1;
        totalDraftAmount += invoiceTotal;
      }
    });

    return NextResponse.json({
      stats: {
        totalInvoices,
        paidAmount,
        pendingDrafts,
        totalDraftAmount,
      },
      invoices,
    });
  } catch (error) {
    console.error("Fetch invoices error:", error);
    return NextResponse.json(
      { error: "Failed to fetch invoices" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      senderName,
      senderAddress,
      clientName,
      clientAddress,
      date,
      dueDate,
      currency,
      taxRate,
      notes,
      terms,
      template,
      items,
    } = body;

    // Helper functions for bulletproof date parsing
    const safeDate = (d: any) => {
      if (!d) return new Date();
      let parsed = new Date(d);
      if (isNaN(parsed.getTime()) && typeof d === "string" && d.includes("/")) {
        const parts = d.split("/");
        if (parts.length === 3) {
          parsed = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
          if (isNaN(parsed.getTime())) {
            parsed = new Date(`${parts[2]}-${parts[0]}-${parts[1]}`);
          }
        }
      }
      return isNaN(parsed.getTime()) ? new Date() : parsed;
    };

    const safeDueDate = (d: any) => {
      if (!d) return null;
      let parsed = new Date(d);
      if (isNaN(parsed.getTime()) && typeof d === "string" && d.includes("/")) {
        const parts = d.split("/");
        if (parts.length === 3) {
          parsed = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
          if (isNaN(parsed.getTime())) {
            parsed = new Date(`${parts[2]}-${parts[0]}-${parts[1]}`);
          }
        }
      }
      return isNaN(parsed.getTime()) ? null : parsed;
    };

    // Retrieve or create business profile for current user
    let user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { businessProfile: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let businessProfile = user.businessProfile;
    if (!businessProfile) {
      businessProfile = await prisma.businessProfile.create({
        data: {
          userId: user.id,
          name: senderName || "My Business",
          address: senderAddress || null,
          defaultCurrency: currency || "USD",
        },
      });
    }

    // Use transaction to atomically increment lastInvoiceNumber and create invoice
    const invoice = await prisma.$transaction(async (tx) => {
      // 1. Atomically increment lastInvoiceNumber
      const updatedProfile = await tx.businessProfile.update({
        where: { id: businessProfile.id },
        data: {
          lastInvoiceNumber: { increment: 1 },
        },
        select: {
          lastInvoiceNumber: true,
          invoicePrefix: true,
        },
      });

      const prefix = updatedProfile.invoicePrefix || "INV-";
      const sequenceNum = String(updatedProfile.lastInvoiceNumber).padStart(3, "0");
      const generatedInvoiceNumber = `${prefix}${sequenceNum}`;

      // 2. Create or find customer inside transaction
      const customerNameInput = (clientName || "Valued Client").trim();
      let customer = await tx.customer.findFirst({
        where: {
          businessProfileId: businessProfile.id,
          name: {
            equals: customerNameInput,
            mode: 'insensitive',
          },
        },
      });

      if (!customer) {
        customer = await tx.customer.create({
          data: {
            businessProfileId: businessProfile.id,
            name: customerNameInput,
            address: clientAddress || null,
          },
        });
      } else if (clientAddress && customer.address !== clientAddress) {
        customer = await tx.customer.update({
          where: { id: customer.id },
          data: { address: clientAddress },
        });
      }

      // 2.5 Upsert items inside transaction for autocomplete catalog
      for (const itm of items || []) {
        const itemDesc = (itm.description || "").trim();
        if (itemDesc !== '') {
          const parsedRate = parseFloat(itm.rate) || 0;
          const existingItem = await tx.item.findFirst({
            where: { 
              businessProfileId: businessProfile.id, 
              name: {
                equals: itemDesc,
                mode: 'insensitive',
              },
            },
          });
          
          if (!existingItem) {
            await tx.item.create({
              data: {
                businessProfileId: businessProfile.id,
                name: itemDesc,
                defaultRate: parsedRate,
              },
            });
          } else if (existingItem.defaultRate !== parsedRate) {
            await tx.item.update({
              where: { id: existingItem.id },
              data: { defaultRate: parsedRate },
            });
          }
        }
      }

      // 3. Create invoice record with atomic invoice number
      return tx.invoice.create({
        data: {
          businessProfileId: businessProfile.id,
          customerId: customer.id,
          invoiceNumber: generatedInvoiceNumber,
          date: safeDate(date),
          dueDate: safeDueDate(dueDate),
          status: "DRAFT",
          template: template || "minimal",
          currency: currency || "USD",
          taxRate: parseFloat(taxRate) || 0,
          notes: notes || null,
          terms: terms || null,
          lineItems: {
            create: (items || []).map((item: any) => ({
              description: item.description || "Service / Product",
              quantity: parseInt(item.quantity) || 1,
              rate: parseFloat(item.rate) || 0,
            })),
          },
        },
        include: {
          lineItems: true,
          customer: true,
        },
      });
    });

    return NextResponse.json({
      message: "Invoice created and saved successfully!",
      invoice,
    });
  } catch (error) {
    console.error("Save invoice error:", error);
    return NextResponse.json(
      { error: "An error occurred while saving the invoice" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { invoiceId, status } = await req.json();

    if (!invoiceId || !status) {
      return NextResponse.json(
        { error: "Invoice ID and status are required" },
        { status: 400 }
      );
    }

    if (!["DRAFT", "SENT", "PAID"].includes(status)) {
      return NextResponse.json({ error: "Invalid status value" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { businessProfile: true },
    });

    if (!user || !user.businessProfile) {
      return NextResponse.json({ error: "Business profile not found" }, { status: 404 });
    }

    const updatedInvoice = await prisma.invoice.update({
      where: {
        id: invoiceId,
        businessProfileId: user.businessProfile.id,
      },
      data: {
        status: status as "DRAFT" | "SENT" | "PAID",
      },
      include: {
        lineItems: true,
        customer: true,
      },
    });

    return NextResponse.json({
      message: "Invoice status updated successfully",
      invoice: updatedInvoice,
    });
  } catch (error) {
    console.error("Update invoice status error:", error);
    return NextResponse.json(
      { error: "Failed to update invoice status" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      id,
      clientName,
      clientAddress,
      date,
      dueDate,
      currency,
      taxRate,
      notes,
      terms,
      template,
      items,
    } = body;

    if (!id) {
      return NextResponse.json({ error: "Invoice ID is required" }, { status: 400 });
    }

    const safeDate = (d: any) => {
      if (!d) return new Date();
      let parsed = new Date(d);
      if (isNaN(parsed.getTime()) && typeof d === "string" && d.includes("/")) {
        const parts = d.split("/");
        if (parts.length === 3) {
          parsed = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
          if (isNaN(parsed.getTime())) parsed = new Date(`${parts[2]}-${parts[0]}-${parts[1]}`);
        }
      }
      return isNaN(parsed.getTime()) ? new Date() : parsed;
    };

    const safeDueDate = (d: any) => {
      if (!d) return null;
      let parsed = new Date(d);
      if (isNaN(parsed.getTime()) && typeof d === "string" && d.includes("/")) {
        const parts = d.split("/");
        if (parts.length === 3) {
          parsed = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
          if (isNaN(parsed.getTime())) parsed = new Date(`${parts[2]}-${parts[0]}-${parts[1]}`);
        }
      }
      return isNaN(parsed.getTime()) ? null : parsed;
    };

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { businessProfile: true },
    });

    if (!user || !user.businessProfile) {
      return NextResponse.json({ error: "Business profile not found" }, { status: 404 });
    }

    const businessProfile = user.businessProfile;

    const invoice = await prisma.$transaction(async (tx) => {
      // 1. Verify invoice exists and belongs to user
      const existingInvoice = await tx.invoice.findFirst({
        where: { id, businessProfileId: businessProfile.id },
      });

      if (!existingInvoice) {
        throw new Error("Invoice not found");
      }

      // 2. Create or find customer
      const customerNameInput = (clientName || "Valued Client").trim();
      let customer = await tx.customer.findFirst({
        where: {
          businessProfileId: businessProfile.id,
          name: {
            equals: customerNameInput,
            mode: 'insensitive',
          },
        },
      });

      if (!customer) {
        customer = await tx.customer.create({
          data: {
            businessProfileId: businessProfile.id,
            name: customerNameInput,
            address: clientAddress || null,
          },
        });
      } else if (clientAddress && customer.address !== clientAddress) {
        customer = await tx.customer.update({
          where: { id: customer.id },
          data: { address: clientAddress },
        });
      }

      // 3. Upsert items for autocomplete catalog
      for (const itm of items || []) {
        const itemDesc = (itm.description || "").trim();
        if (itemDesc !== '') {
          const parsedRate = parseFloat(itm.rate) || 0;
          const existingItem = await tx.item.findFirst({
            where: { 
              businessProfileId: businessProfile.id, 
              name: {
                equals: itemDesc,
                mode: 'insensitive',
              },
            },
          });
          
          if (!existingItem) {
            await tx.item.create({
              data: {
                businessProfileId: businessProfile.id,
                name: itemDesc,
                defaultRate: parsedRate,
              },
            });
          } else if (existingItem.defaultRate !== parsedRate) {
            await tx.item.update({
              where: { id: existingItem.id },
              data: { defaultRate: parsedRate },
            });
          }
        }
      }

      // 4. Delete old line items
      await tx.invoiceLineItem.deleteMany({
        where: { invoiceId: id },
      });

      // 5. Update invoice
      return tx.invoice.update({
        where: { id },
        data: {
          customerId: customer.id,
          date: safeDate(date),
          dueDate: safeDueDate(dueDate),
          template: template || "minimal",
          currency: currency || "USD",
          taxRate: parseFloat(taxRate) || 0,
          notes: notes || null,
          terms: terms || null,
          lineItems: {
            create: (items || []).map((item: any) => ({
              description: item.description || "Service / Product",
              quantity: parseInt(item.quantity) || 1,
              rate: parseFloat(item.rate) || 0,
            })),
          },
        },
        include: {
          lineItems: true,
          customer: true,
        },
      });
    });

    return NextResponse.json({
      message: "Invoice updated successfully!",
      invoice,
    });
  } catch (error: any) {
    console.error("Update invoice error:", error);
    if (error.message === "Invoice not found") {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }
    return NextResponse.json(
      { error: "An error occurred while updating the invoice" },
      { status: 500 }
    );
  }
}
