import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const lineItemSchema = z.object({
  id: z.string().optional(),
  description: z.string().optional().default("Service / Product"),
  quantity: z.coerce.number({ message: "Quantity must be a number" }).int("Quantity must be an integer").positive("Quantity must be greater than 0"),
  rate: z.coerce.number({ message: "Rate must be a number" }).nonnegative("Rate cannot be negative"),
});

const invoiceSchema = z.object({
  id: z.string().optional(),
  customerId: z.string().optional(),
  senderName: z.string().optional(),
  senderAddress: z.string().optional(),
  clientName: z.string().optional(),
  clientAddress: z.string().optional(),
  date: z.any().optional(),
  dueDate: z.any().optional().nullable(),
  currency: z.string().optional().default("USD"),
  taxRate: z.union([z.string(), z.number()]).transform(v => parseFloat(String(v)) || 0).optional(),
  notes: z.string().optional().nullable(),
  terms: z.string().optional().nullable(),
  template: z.string().optional().default("minimal"),
  items: z.array(lineItemSchema).optional().default([]),
});

const patchSchema = z.object({
  invoiceId: z.string().min(1, "Invoice ID is required"),
  status: z.enum(["DRAFT", "SENT", "PAID"]),
});

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const skip = (page - 1) * limit;

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { businessProfile: { select: { id: true } } },
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
        pagination: { total: 0, page, limit, totalPages: 0 }
      });
    }

    const businessProfileId = user.businessProfile.id;

    // 1. Fetch Paginated Invoices
    const [invoices, totalCount] = await Promise.all([
      prisma.invoice.findMany({
        where: { businessProfileId },
        include: {
          lineItems: true,
          customer: true,
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.invoice.count({ where: { businessProfileId } })
    ]);

    // 2. Fetch Lightweight Data for Stats
    const allInvoicesForStats = await prisma.invoice.findMany({
      where: { businessProfileId },
      select: {
        status: true,
        taxRate: true,
        lineItems: { select: { quantity: true, rate: true } },
      },
    });

    let paidAmount = 0;
    let pendingDrafts = 0;
    let totalDraftAmount = 0;

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

    return NextResponse.json({
      stats: {
        totalInvoices: totalCount,
        paidAmount,
        pendingDrafts,
        totalDraftAmount,
      },
      invoices,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      }
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
    const parsed = invoiceSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid data", details: parsed.error.format() }, { status: 400 });
    }

    const {
      customerId,
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
    } = parsed.data;

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

    // Validate customerId if provided
    if (customerId) {
      const existingCustomer = await prisma.customer.findFirst({
        where: { id: customerId, businessProfileId: businessProfile.id },
      });
      if (!existingCustomer) {
        return NextResponse.json({ error: "Invalid customerId: Customer does not exist or does not belong to your business" }, { status: 400 });
      }
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

      // 2. Determine final Customer ID
      let finalCustomerId = customerId;

      if (!finalCustomerId) {
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
        finalCustomerId = customer.id;
      } else if (clientAddress) {
        // If customerId is provided but address is also sent, optionally update it
        await tx.customer.update({
          where: { id: finalCustomerId },
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
          customerId: finalCustomerId,
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

    const body = await req.json();
    const parsed = patchSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid status or invoice ID", details: parsed.error.format() },
        { status: 400 }
      );
    }
    
    const { invoiceId, status } = parsed.data;

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
    const parsed = invoiceSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid data", details: parsed.error.format() }, { status: 400 });
    }

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
    } = parsed.data;

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
