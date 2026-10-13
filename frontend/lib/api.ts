import type { ContractRecord } from "@/types/contracts";
import { contracts as fallbackContracts } from "./contracts";

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";

export function getAuthToken(): string | null {
  if (typeof window !== "undefined") {
    return localStorage.getItem("contractiq-token");
  }
  return null;
}

export function getAuthHeaders(headers: Record<string, string> = {}): Record<string, string> {
  const token = getAuthToken();
  if (token) {
    return { ...headers, Authorization: `Bearer ${token}` };
  }
  return headers;
}

export async function loginUser(email: string, password: string) {

  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || "Invalid email or password");
  }
  const data = await res.json();
  if (typeof window !== "undefined") {
    localStorage.setItem("contractiq-token", data.access_token);
    localStorage.setItem("contractiq-user", JSON.stringify(data.user));
  }
  return data;
}

export async function fetchContracts(params?: { status?: string; risk?: string; search?: string }): Promise<ContractRecord[]> {
  try {
    const url = new URL(`${API_BASE_URL}/contracts`);
    if (params?.status && params.status !== "All") url.searchParams.append("status", params.status);
    if (params?.risk && params.risk !== "All") url.searchParams.append("risk", params.risk);
    if (params?.search) url.searchParams.append("search", params.search);

    const res = await fetch(url.toString(), {
      headers: getAuthHeaders(),
      cache: "no-store",
    });
    if (!res.ok) throw new Error("Failed to fetch contracts");
    return await res.json();
  } catch (err) {
    console.warn("[API Client] Backend unreachable, using fallback dataset:", err);
    return fallbackContracts;
  }
}

export async function fetchContractById(id: string): Promise<ContractRecord | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/contracts/${id}`, {
      headers: getAuthHeaders(),
      cache: "no-store",
    });
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
    headers: getAuthHeaders(),
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

export interface SourceItem {
  contract_id: string;
  document_name: string;
  chunk_id: number;
  page_number?: number | null;
  section?: string | null;
  excerpt: string;
  file_url?: string | null;
}

export interface ChatMessageItem {
  id: string;
  role: "user" | "assistant";
  text: string;
  citations?: string[];
  sources?: SourceItem[];
  show_sources?: boolean;
  created_at?: string | null;
}

export async function fetchChatHistory(contractId: string): Promise<ChatMessageItem[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/contracts/${contractId}/chat`, {
      headers: getAuthHeaders(),
      cache: "no-store",
    });
    if (!res.ok) {
      return [];
    }
    return await res.json();
  } catch (err) {
    console.warn("[API Client] Chat history fetch failed:", err);
    return [];
  }
}

export async function clearChatHistory(contractId: string): Promise<void> {
  try {
    await fetch(`${API_BASE_URL}/contracts/${contractId}/chat`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
  } catch (err) {
    console.warn("[API Client] Clear chat history failed:", err);
  }
}

export async function sendChatMessage(
  contractId: string,
  message: string,
  clientMessageId?: string
): Promise<ChatMessageItem> {
  const res = await fetch(`${API_BASE_URL}/contracts/${contractId}/chat`, {
    method: "POST",
    headers: getAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ message, client_message_id: clientMessageId }),
  });
  if (!res.ok) {
    throw new Error("Chat service unavailable");
  }
  return await res.json();
}

export async function fetchDashboardSummary() {
  try {
    const res = await fetch(`${API_BASE_URL}/dashboard`, {
      headers: getAuthHeaders(),
      cache: "no-store",
    });
    if (!res.ok) throw new Error("Failed to fetch dashboard");
    return await res.json();
  } catch (err) {
    console.warn("[API Client] Dashboard fallback:", err);
    return null;
  }
}

export async function fetchNotifications() {
  try {
    const res = await fetch(`${API_BASE_URL}/notifications`, {
      headers: getAuthHeaders(),
      cache: "no-store",
    });
    if (!res.ok) throw new Error("Failed to fetch notifications");
    return await res.json();
  } catch (err) {
    console.warn("[API Client] Notifications fallback:", err);
    return [];
  }
}
