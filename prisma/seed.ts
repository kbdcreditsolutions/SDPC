import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const FIRST_NAMES = ["Aarav", "Divya", "Kavya", "Nikhil", "Pooja", "Rohit", "Vikram", "Meera", "Ishita", "Sneha", "Rahul", "Ananya", "Aditya"];
const LAST_NAMES = ["Rao", "Kulkarni", "Krishnan", "Patel", "Verma", "Sharma", "Bose"];
const REASONS = ["Plantar fasciitis", "Frozen shoulder", "Sports injury", "Lower back pain", "Post-surgery rehab", "Neck stiffness", "Knee pain"];
const LEAD_SOURCES = ["DIRECT", "REFERRAL", "GOOGLE", "FACEBOOK", "WALK_IN", "WHATSAPP", "INSTAGRAM"] as const;

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}
function phone() {
  return `+91${randInt(9000000000, 9999999999)}`;
}

async function main() {
  console.log("Seeding Sridatri Physio Care admin portal…");

  await prisma.auditLog.deleteMany();
  await prisma.rating.deleteMany();
  await prisma.referral.deleteMany();
  await prisma.campaign.deleteMany();
  await prisma.attendanceRecord.deleteMany();
  await prisma.clinicalNote.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.invoiceLineItem.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.package.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.user.deleteMany();
  await prisma.branch.deleteMany();
  await prisma.tenant.deleteMany();

  const passwordHash = await bcrypt.hash("Admin@123", 10);

  const tenant = await prisma.tenant.create({
    data: {
      name: "Sridatri Physio Care",
      gstNumber: "29AABCS1234M1Z5",
      phone: "+91 80 1234 5678",
      email: "admin@sridatriphysio.in",
      address: "Sridatri Physio Care, Bengaluru, Karnataka",
    },
  });

  const [branch1] = await Promise.all([
    prisma.branch.create({ data: { tenantId: tenant.id, name: "Main Branch", city: "Bengaluru" } }),
  ]);

  const admin = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      name: "SDPC Admin",
      email: "admin@sridatriphysio.in",
      passwordHash,
      role: "CLINIC_ADMIN",
      title: "Clinic Head",
      branchId: branch1.id,
    },
  });

  const doctors = await Promise.all([
    prisma.user.create({
      data: {
        tenantId: tenant.id,
        name: "Dr. Arjun Nair",
        email: "dr.arjun@sridatriphysio.in",
        passwordHash,
        role: "DOCTOR",
        specialty: "Musculoskeletal",
        title: "Senior Physiotherapist",
        branchId: branch1.id,
      },
    }),
    prisma.user.create({
      data: {
        tenantId: tenant.id,
        name: "Dr. Priya Menon",
        email: "dr.priya@sridatriphysio.in",
        passwordHash,
        role: "DOCTOR",
        specialty: "Sports Physio",
        title: "Physiotherapist",
        branchId: branch1.id,
      },
    }),
  ]);

  await prisma.user.create({
    data: {
      tenantId: tenant.id,
      name: "Reception Staff",
      email: "reception@sridatriphysio.in",
      passwordHash,
      role: "STAFF",
      branchId: branch1.id,
    },
  });

  // Seed 20 patients with appointments and invoices
  for (let i = 0; i < 20; i++) {
    const name = `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;
    const patient = await prisma.patient.create({
      data: {
        tenantId: tenant.id,
        branchId: branch1.id,
        name,
        phone: phone(),
        reason: pick(REASONS),
        leadSource: pick(LEAD_SOURCES),
        createdAt: daysAgo(randInt(1, 90)),
      },
    });

    const doctor = pick(doctors);
    const apptDate = daysAgo(randInt(0, 14));

    await prisma.appointment.create({
      data: {
        tenantId: tenant.id,
        patientId: patient.id,
        doctorId: doctor.id,
        branchId: branch1.id,
        datetime: apptDate,
        durationMin: pick([30, 45, 60] as const),
        status: pick(["SCHEDULED", "COMPLETED", "CANCELLED"] as const),
      },
    });

    const subtotal = randInt(500, 3000);
    const gst = Math.round(subtotal * 0.18);
    const total = subtotal + gst;
    const paidAmount = pick([0, Math.round(total / 2), total] as const);

    const invoice = await prisma.invoice.create({
      data: {
        tenantId: tenant.id,
        patientId: patient.id,
        number: `SDPC-${String(i + 1).padStart(4, "0")}`,
        date: daysAgo(randInt(0, 30)),
        subtotal,
        gst,
        total,
        paidAmount,
        status: paidAmount === 0 ? "UNPAID" : paidAmount < total ? "PARTIAL" : "PAID",
      },
    });

    await prisma.invoiceLineItem.create({
      data: {
        invoiceId: invoice.id,
        description: pick(REASONS),
        qty: randInt(1, 5),
        unitPrice: Math.round(subtotal / randInt(1, 5)),
        gstPercent: 18,
        lineTotal: subtotal,
      },
    });

    if (paidAmount > 0) {
      await prisma.payment.create({
        data: {
          invoiceId: invoice.id,
          amount: paidAmount,
          date: daysAgo(randInt(0, 15)),
          method: pick(["CASH", "UPI", "CARD"] as const),
        },
      });
    }
  }

  console.log(`Seed complete. Tenant ID: ${tenant.id}`);
  console.log("Login: admin@sridatriphysio.in — use the password you set in SDPC_ADMIN_PASSWORD env var, or Admin@123 default (change before prod)");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
