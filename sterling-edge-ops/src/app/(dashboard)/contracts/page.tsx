import { Header } from "@/components/layout/header";
import { ContractsContent } from "@/components/contracts/contracts-content";

export default function ContractsPage() {
  return (
    <div className="flex flex-col h-full">
      <Header title="Contracts & Orders" subtitle="Track active contracts, deliveries, and payments" />
      <ContractsContent />
    </div>
  );
}
