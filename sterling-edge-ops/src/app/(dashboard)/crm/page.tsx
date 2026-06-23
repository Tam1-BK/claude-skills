import { Header } from "@/components/layout/header";
import { CRMContent } from "@/components/crm/crm-content";

export default function CRMPage() {
  return (
    <div className="flex flex-col h-full">
      <Header title="CRM" subtitle="Client & relationship management" />
      <CRMContent />
    </div>
  );
}
