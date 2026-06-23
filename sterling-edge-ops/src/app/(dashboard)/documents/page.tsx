import { Header } from "@/components/layout/header";
import { DocumentsContent } from "@/components/documents/documents-content";

export default function DocumentsPage() {
  return (
    <div className="flex flex-col h-full">
      <Header title="Document Vault" subtitle="Certificates, contracts, tenders, and compliance documents" />
      <DocumentsContent />
    </div>
  );
}
