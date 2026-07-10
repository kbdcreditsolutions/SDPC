import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/guard";
import { z } from "zod";

const schema = z.object({ 
  note: z.string().min(1),
  attachments: z.array(
    z.object({
      name: z.string(),
      type: z.string(),
      data: z.string()
    })
  ).optional()
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, response } = await requireSession(["CLINIC_ADMIN", "DOCTOR", "STAFF"]);
  if (!session) return response!;
  const { id } = await params;

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 });

  const note = await prisma.clinicalNote.create({
    data: { patientId: id, authorId: session.userId, note: parsed.data.note, attachments: parsed.data.attachments || [] },
    include: { author: true },
  });

  return NextResponse.json({ note });
}
