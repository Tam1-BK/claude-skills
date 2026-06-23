import { Header } from "@/components/layout/header";
import { SuppliersContent } from "@/components/suppliers/suppliers-content";

export default function SuppliersPage() {
  return (
    <div className="flex flex-col h-full">
      <Header title="Supplier Management" subtitle="Track suppliers, ratings, and price history" />
      <SuppliersContent />
    </div>
  );
}
