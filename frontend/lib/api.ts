import type { ContractRecord } from "@/types/contracts";
import { contracts as fallbackContracts } from "./contracts";

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";

export async function fetchContracts(params?: { status?: string; risk?: string; search?: string }): Promise<ContractRecord[]> {
  try {
    const url = new URL(`${API_BASE_URL}/contracts`);
    if (params?.status && params.status !== "All") url.searchParams.append("status", params.status);
    if (params?.risk && params.risk !== "All") url.searchParams.append("risk", params.risk);
    if (params?.search) url.searchParams.append("search", params.search);

    const res = await fetch(url.toString(), { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to fetch contracts");
    return await res.json();
  } catch (err) {
    console.warn("[API Client] Backend unreachable, using fallback dataset:", err);
    return fallbackContracts;
  }
}

export async function fetchContractById(id: string): Promise<ContractRecord | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/contracts/${id}`, { cache: "no-store" });
    if (!res.ok) throw new Error("Contract not found");
    return await res.json();
  } catch (err) {
    console.warn(`[API Client] Falling back for contract ${id}:`, err);
    return fallbackContracts.find((c) => c.id === id) ?? null;
  }
}

export interface UploadErrorDetail {
  is_contract?: boolean;
  detected_type?: string;
  reason?: string;
  missing_elements?: string[];
  present_elements?: string[];
  message?: string;
}

export class ContractUploadError extends Error {
  detail?: UploadErrorDetail;
  constructor(message: string, detail?: UploadErrorDetail) {
    super(message);
    this.name = "ContractUploadError";
    this.detail = detail;
  }
}

export async function uploadContractFile(formData: FormData): Promise<ContractRecord> {
  const res = await fetch(`${API_BASE_URL}/contracts/upload`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const detail: UploadErrorDetail | undefined = typeof errorData.detail === "object" ? errorData.detail : undefined;
    let errorMessage = "Upload and extraction failed";
    if (typeof errorData.detail === "string") {
      errorMessage = errorData.detail;
    } else if (detail?.reason) {
      errorMessage = detail.reason;
    } else if (detail?.message) {
      errorMessage = detail.message;
    }
    throw new ContractUploadError(errorMessage, detail);
  }
  return await res.json();
}

export async function sendChatMessage(contractId: string, message: string): Promise<{ id: string; role: "assistant"; text: string; citations?: string[] }> {
  const res = await fetch(`${API_BASE_URL}/contracts/${contractId}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message }),
  });
  if (!res.ok) {
    throw new Error("Chat service unavailable");
  }
  return await res.json();
}

export async function fetchDashboardSummary() {
  try {
    const res = await fetch(`${API_BASE_URL}/dashboard`, { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to fetch dashboard");
    return await res.json();
  } catch (err) {
    console.warn("[API Client] Dashboard fallback:", err);
    return null;
  }
}

export async function fetchNotifications() {
  try {
    const res = await fetch(`${API_BASE_URL}/notifications`, { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to fetch notifications");
    return await res.json();
  } catch (err) {
    console.warn("[API Client] Notifications fallback:", err);
    return [];
  }
}
