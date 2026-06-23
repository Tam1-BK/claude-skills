import { Header } from "@/components/layout/header";
import { FinanceContent } from "@/components/finance/finance-content";

export default function FinancePage() {
  return (
    <div className="flex flex-col h-full">
      <Header title="Finance Snapshot" subtitle="Cash exposure, margins, and payment tracking" />
      <FinanceContent />
    </div>
  );
}
