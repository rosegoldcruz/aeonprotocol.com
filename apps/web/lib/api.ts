const API_URL = process.env.NEXT_PUBLIC_API_URL;
if (!API_URL) throw new Error("NEXT_PUBLIC_API_URL missing");

export type Job = {
  id: string;
  status: "queued" | "processing" | "completed" | "failed" | "pending";
  result_url?: string | null;
  created_at?: string;
};

function normalize(job: Job): Job {
  return { ...job, status: job.status === "pending" ? "queued" : job.status };
}

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    credentials: "include",
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  const data = (await res.json()) as T;
  return data;
}

export const Api = {
  createJob: async (payload: Record<string, unknown>) => normalize(await req<Job>("/v1/jobs", { method: "POST", body: JSON.stringify(payload) })),
  getJob: async (id: string) => normalize(await req<Job>(`/v1/jobs/${id}`)),
  streamJobsUrl: () => `${API_URL}/v1/jobs/stream`,
};

