import { auth } from '@clerk/nextjs/server'

const BASE_URL = process.env['NEXT_PUBLIC_API_URL'] as string
if (!BASE_URL) {
	throw new Error('NEXT_PUBLIC_API_URL is required')
}

async function withAuthHeaders(init?: RequestInit): Promise<RequestInit> {
	const { getToken } = auth()
	const token = await getToken()
	const headers = new Headers(init?.headers || {})
	if (token) headers.set('Authorization', `Bearer ${token}`)
	headers.set('Content-Type', 'application/json')
	return { ...init, headers }
}

export async function createJob(params: { kind: 'image' | 'video' | 'audio'; provider: string; payload: any }) {
	const res = await fetch(`${BASE_URL}/v1/media/jobs`, await withAuthHeaders({
		method: 'POST',
		body: JSON.stringify(params),
	}))
	if (!res.ok) throw new Error(`createJob failed: ${res.status}`)
	return res.json() as Promise<{ job_id: number }>
}

export async function getJob(jobId: number) {
	const res = await fetch(`${BASE_URL}/v1/media/jobs/${jobId}`, await withAuthHeaders({
		cache: 'no-store',
	}))
	if (!res.ok) throw new Error(`getJob failed: ${res.status}`)
	return res.json() as Promise<{ status: string; error_message?: string; assets: Array<{ id: number; url: string | null; mime_type?: string; width?: number; height?: number; duration?: number }> }>
}

