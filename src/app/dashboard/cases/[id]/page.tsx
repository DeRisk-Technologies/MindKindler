import { notFound } from "next/navigation";
import { CaseDetails } from "@/components/dashboard/case/case-details";
import { getCase } from "@/hooks/use-firestore";

interface CasePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function CasePage({ params }: CasePageProps) {
  const { id } = await params;
  
  // In a real server component, we would fetch data here or pass the ID to a client component
  // Since we're using client-side Firestore hooks mainly, we'll pass the ID to a client wrapper
  
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <CaseDetails caseId={id} />
    </div>
  );
}
