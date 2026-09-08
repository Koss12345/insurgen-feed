import { isAdminAuthed } from "@/lib/adminAuth";
import { prisma } from "@/lib/db";
import AdminBootstrapForm from "@/components/AdminBootstrapForm";
import AdminLoginForm from "@/components/AdminLoginForm";
import AdminDashboard from "@/components/AdminDashboard";

export const metadata = {
  title: "Заявки",
};

// Reads the session cookie and live DB state (admin count, applications) —
// during the build the bootstrap-account branch never touches cookies(),
// so Next would otherwise prerender this as a static page frozen at
// build-time DB state (e.g. permanently showing the bootstrap form).
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const adminCount = await prisma.adminUser.count();
  if (adminCount === 0) {
    return <AdminBootstrapForm />;
  }

  if (!(await isAdminAuthed())) {
    return <AdminLoginForm />;
  }

  const [applications, partialLeads, callbacks] = await Promise.all([
    prisma.application.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        type: true,
        insurerName: true,
        premium: true,
        contactName: true,
        contactPhone: true,
        contactEmail: true,
        status: true,
        createdAt: true,
      },
    }),
    prisma.partialLead.findMany({
      orderBy: { updatedAt: "desc" },
      take: 50,
      select: {
        id: true,
        type: true,
        insurerName: true,
        premium: true,
        contactName: true,
        contactPhone: true,
        contactEmail: true,
        updatedAt: true,
      },
    }),
    prisma.callbackRequest.findMany({
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, phone: true, comment: true, status: true, createdAt: true },
    }),
  ]);

  return (
    <AdminDashboard
      applications={applications.map((a) => ({ ...a, createdAt: a.createdAt.toISOString() }))}
      partialLeads={partialLeads.map((l) => ({ ...l, updatedAt: l.updatedAt.toISOString() }))}
      callbacks={callbacks.map((c) => ({ ...c, createdAt: c.createdAt.toISOString() }))}
    />
  );
}
