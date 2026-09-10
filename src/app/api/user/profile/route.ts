import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        businessProfile: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Fetch profile error:", error);
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      name,
      image,
      removeImage,
      currentPassword,
      newPassword,
      businessName,
      businessAddress,
      businessPhone,
      businessEmail,
      defaultCurrency,
      invoicePrefix,
    } = await req.json();

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { businessProfile: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const updateData: { name?: string; image?: string | null; password?: string } = {};

    if (name !== undefined) {
      updateData.name = name;
    }

    if (removeImage) {
      updateData.image = null;
    } else if (image) {
      const match = image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (match) {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (supabaseUrl && supabaseKey) {
          const supabase = createClient(supabaseUrl, supabaseKey, {
            auth: { persistSession: false },
          });

          const contentType = match[1];
          const buffer = Buffer.from(match[2], "base64");
          const extension = contentType.split("/")[1] || "png";
          const fileName = `${user.id}-${Date.now()}.${extension}`;

          const { error: uploadError } = await supabase.storage
            .from("avatars")
            .upload(fileName, buffer, {
              contentType,
              upsert: true,
            });

          if (uploadError) {
            console.error("Avatar upload failed:", uploadError);
            return NextResponse.json(
              { error: "Failed to upload profile picture" },
              { status: 500 }
            );
          }

          const { data: publicUrlData } = supabase.storage
            .from("avatars")
            .getPublicUrl(fileName);

          updateData.image = publicUrlData.publicUrl;
        } else {
          console.warn("Supabase credentials missing, falling back to base64");
          updateData.image = image;
        }
      } else {
        // Assume it's already a URL
        updateData.image = image;
      }
    }

    if (newPassword) {
      if (newPassword.length < 8) {
        return NextResponse.json(
          { error: "New password must be at least 8 characters long" },
          { status: 400 }
        );
      }

      if (user.password) {
        if (!currentPassword) {
          return NextResponse.json(
            { error: "Current password is required to set a new password" },
            { status: 400 }
          );
        }

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
          return NextResponse.json(
            { error: "Current password is incorrect" },
            { status: 400 }
          );
        }
      }

      updateData.password = await bcrypt.hash(newPassword, 10);
    }

    // Update User core details
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
      },
    });

    // Update or Create BusinessProfile
    if (
      businessName !== undefined ||
      businessAddress !== undefined ||
      businessPhone !== undefined ||
      businessEmail !== undefined ||
      defaultCurrency !== undefined ||
      invoicePrefix !== undefined
    ) {
      await prisma.businessProfile.upsert({
        where: { userId: user.id },
        update: {
          name: businessName || "My Business",
          address: businessAddress || null,
          phone: businessPhone || null,
          email: businessEmail || null,
          defaultCurrency: defaultCurrency || "USD",
          ...(invoicePrefix !== undefined ? { invoicePrefix } : {}),
        },
        create: {
          userId: user.id,
          name: businessName || "My Business",
          address: businessAddress || null,
          phone: businessPhone || null,
          email: businessEmail || null,
          defaultCurrency: defaultCurrency || "USD",
          invoicePrefix: invoicePrefix || "INV-",
        },
      });
    }

    const finalUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        businessProfile: true,
      },
    });

    return NextResponse.json({
      message: "Profile updated successfully",
      user: finalUser,
    });
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred while updating profile" },
      { status: 500 }
    );
  }
}
