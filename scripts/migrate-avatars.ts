import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";
import { Buffer } from "buffer";

// Load .env variables
dotenv.config({ path: path.resolve(process.cwd(), ".env") });
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
});

const prisma = new PrismaClient();

async function migrateAvatars() {
  console.log("Starting avatar migration...");
  
  try {
    // Find users with base64 images
    const users = await prisma.user.findMany({
      where: {
        image: {
          startsWith: "data:image",
        },
      },
    });

    console.log(`Found ${users.length} users with Base64 avatars.`);

    for (const user of users) {
      if (!user.image) continue;

      console.log(`Processing user ${user.id}...`);

      const match = user.image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (!match) {
        console.warn(`Could not parse Base64 data for user ${user.id}`);
        continue;
      }

      const contentType = match[1];
      const buffer = Buffer.from(match[2], "base64");
      
      const extension = contentType.split("/")[1] || "png";
      const fileName = `${user.id}-${Date.now()}.${extension}`;

      console.log(`Uploading to Supabase Storage as ${fileName}...`);

      const { data, error } = await supabase.storage
        .from("avatars")
        .upload(fileName, buffer, {
          contentType: contentType,
          upsert: true,
        });

      if (error) {
        console.error(`Error uploading avatar for user ${user.id}:`, error.message);
        continue;
      }

      const { data: publicUrlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(fileName);

      const publicUrl = publicUrlData.publicUrl;
      console.log(`Uploaded successfully. New URL: ${publicUrl}`);

      await prisma.user.update({
        where: { id: user.id },
        data: { image: publicUrl },
      });

      console.log(`Updated database for user ${user.id}.`);
    }

    console.log("Migration complete!");
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    await prisma.$disconnect();
  }
}

migrateAvatars();
