"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AssessmentBuilder } from "@/components/dashboard/assessments/assessment-builder";

function BuilderContent() {
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode'); // 'ai' or undefined

  return <AssessmentBuilder initialMode={mode === 'ai' ? 'ai' : 'manual'} />;
}

export default function BuilderPage() {
  return (
    <div className="flex-1 p-8 pt-6">
       <Suspense fallback={<div>Loading builder...</div>}>
         <BuilderContent />
       </Suspense>
    </div>
  );
}
