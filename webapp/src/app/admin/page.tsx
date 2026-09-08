import { isAdminAuthed } from "@/lib/adminAuth";
import { prisma } from "@/lib/db";
import AdminLoginForm from "@/components/AdminLoginForm";
import ApplicationsTable from "@/components/ApplicationsTable";

export const metadata = {
  title: "Заявки — Алина Страховка",
};

export default async function AdminPage() {
  if (!(await isAdminAuthed())) {
    return <AdminLoginForm />;
  }

  const applications = await prisma.application.findMany({
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
  });

  return (
    <ApplicationsTable
      applications={applications.map((a) => ({ ...a, createdAt: a.createdAt.toISOString() }))}
    />
  );
}
