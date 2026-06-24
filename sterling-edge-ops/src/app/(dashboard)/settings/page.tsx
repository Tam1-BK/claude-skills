import { Header } from "@/components/layout/header";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { formatLabel } from "@/lib/utils";

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;

  return (
    <div className="flex flex-col h-full">
      <Header title="Settings" subtitle="Account and system configuration" />
      <div className="p-6 max-w-2xl space-y-6">
        <div className="border rounded-lg p-5 bg-white">
          <h2 className="font-semibold text-sm mb-4">Your Account</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Name</span>
              <span className="font-medium">{user?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Email</span>
              <span className="font-medium">{user?.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Role</span>
              <span className="font-medium">{formatLabel(user?.role ?? "")}</span>
            </div>
          </div>
        </div>

        <div className="border rounded-lg p-5 bg-white">
          <h2 className="font-semibold text-sm mb-4">User Roles</h2>
          <div className="space-y-2 text-sm">
            {[
              { role: "Admin", desc: "Full access — all modules, user management, system settings. Only admins can create accounts." },
              { role: "Director", desc: "Full read/write access to all modules except user management" },
              { role: "Procurement Officer", desc: "Tenders, suppliers, contracts, tasks, and documents" },
              { role: "Finance Officer", desc: "Finance snapshot, contracts, payments, and documents" },
              { role: "Viewer", desc: "Read-only access to all modules" },
            ].map(({ role, desc }) => (
              <div key={role} className="flex gap-3">
                <span className="font-medium w-44 shrink-0">{role}</span>
                <span className="text-muted-foreground">{desc}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="border rounded-lg p-5 bg-white">
          <h2 className="font-semibold text-sm mb-4">System Information</h2>
          <div className="space-y-2 text-sm text-muted-foreground">
            <div>Sterling Edge Operations OS — RC1</div>
            <div>Company: Sterling Edge Ltd, Nairobi, Kenya</div>
            <div>Focus: Procurement, AGPO Tenders, Supply Contracts, Exim Trading</div>
          </div>
        </div>
      </div>
    </div>
  );
}
