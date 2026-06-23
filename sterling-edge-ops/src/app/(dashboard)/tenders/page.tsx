import { Header } from "@/components/layout/header";
import { TendersContent } from "@/components/tenders/tenders-content";

export default function TendersPage() {
  return (
    <div className="flex flex-col h-full">
      <Header title="Tender Management" subtitle="Track, score and manage procurement opportunities" />
      <TendersContent />
    </div>
  );
}
