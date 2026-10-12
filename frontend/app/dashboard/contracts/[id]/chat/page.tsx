"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ContractAssistantChatRedirectPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  useEffect(() => {
    if (params?.id) {
      router.replace(`/dashboard/assistant?contractId=${params.id}`);
    } else {
      router.replace("/dashboard/assistant");
    }
  }, [params, router]);

  return (
    <div className="flex h-64 items-center justify-center text-xs text-[var(--text-muted)] font-medium">
      Redirecting to Contract Assistant...
    </div>
  );
}
