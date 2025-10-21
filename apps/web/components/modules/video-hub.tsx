"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, Film, Play, Sparkles, Scissors, Camera, Mic, Wand2 } from "lucide-react"
import { useAuth } from "@clerk/nextjs"
import { apiRequest } from "@/lib/utils"

interface LibraryItem {
	id: number
	prompt: string
	createdAt: number
	url: string
	duration: number
	resolution: string
}

interface VideoHubProps {
	isGenerating: boolean
}

export function VideoHub({ isGenerating: _isGenerating }: VideoHubProps) {
	const [prompt, setPrompt] = useState("")
	const [provider, setProvider] = useState("runway")
	const [duration, setDuration] = useState([6])
	const [resolution, setResolution] = useState("1280x768")
	const [fps, setFps] = useState([24])
	const [seed] = useState("")

	const { getToken } = useAuth()
	const [jobId, setJobId] = useState<number | null>(null)
	const [videoUrl, setVideoUrl] = useState<string | null>(null)
	const [status, setStatus] = useState<string | null>(null)
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const playerRef = useRef<HTMLVideoElement | null>(null)

	const LIB_KEY = "aeon_video_library_v1"
	const library: LibraryItem[] = useMemo(() => {
		if (typeof window === "undefined") return []
		try { return JSON.parse(localStorage.getItem(LIB_KEY) || "[]") } catch { return [] }
	}, [])
	const [items, setItems] = useState<LibraryItem[]>(library)

	const saveToLibrary = (item: LibraryItem) => {
		const next = [item, ...items].slice(0, 100)
		setItems(next)
		if (typeof window !== "undefined") localStorage.setItem(LIB_KEY, JSON.stringify(next))
	}

	const handleGenerate = async () => {
		setError(null)
		setVideoUrl(null)
		setStatus("starting")
		setLoading(true)

		try {
			const payload = { prompt: prompt.trim(), duration: duration[0], resolution, fps: fps[0], seed: seed || undefined }
			const token = await getToken(); if (!token) throw new Error("Not authenticated")
			const res = await apiRequest("/v1/media/jobs", { method: "POST", body: JSON.stringify({ kind: "video", provider, payload }) }, token)
			const jobId = res?.job_id || res?.id
			setJobId(jobId)
		} catch (e: any) {
			setStatus("failed")
			setError(e?.message || "Failed to start job")
			setLoading(false)
		}
	}

	useEffect(() => {
		if (!jobId) return
		let mounted = true
		const interval = setInterval(async () => {
			try {
				const token = await getToken(); if (!token) return
				const data = await apiRequest(`/v1/media/jobs/${jobId}`, {}, token)
				if (!mounted) return
				setStatus(data.status)
				if (data.error_message) setError(data.error_message)
				if (data.status === "completed" && data.assets?.length) {
					const asset = data.assets.find(a => a.url)
					if (asset?.url) setVideoUrl(asset.url as string)
					setLoading(false)
					clearInterval(interval)
					if (asset?.url) {
						const item: LibraryItem = {
							id: jobId,
							prompt: prompt.trim(),
							createdAt: Date.now(),
							url: asset.url,
							duration: duration[0] ?? 6,
							resolution,
						}
						saveToLibrary(item)
					}
				}
				if (["failed", "canceled"].includes(data.status)) {
					setLoading(false)
					clearInterval(interval)
				}
			} catch (e) {
				setLoading(false)
				clearInterval(interval)
			}
		}, 2000)
		return () => { mounted = false; clearInterval(interval) }
	}, [jobId])

	const providers = [
		{ id: "runway", name: "Runway Gen-3", description: "High-quality cinematic videos" },
		{ id: "pika", name: "Pika Labs", description: "Creative and artistic videos" },
		{ id: "luma", name: "Luma Dream Machine", description: "Realistic motion and physics" },
		{ id: "hailuo", name: "Hailuo AI", description: "Fast generation with good quality" }
	]

	const resolutions = [
		{ value: "1280x768", label: "1280x768 (16:10)" },
		{ value: "1920x1080", label: "1920x1080 (16:9)" },
		{ value: "1024x1024", label: "1024x1024 (1:1)" },
		{ value: "768x1280", label: "768x1280 (9:16)" }
	]

	return (
		<div className="space-y-6">
			<div className="flex items-center gap-3">
				<div className="p-3 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500">
					<Film className="h-8 w-8 text-white" />
				</div>
				<div>
					<h2 className="text-2xl font-bold text-white">Video Hub</h2>
					<p className="text-gray-400">Professional video production and editing</p>
				</div>
			</div>

			<Tabs defaultValue="generate" className="w-full">
				<TabsList className="grid w-full grid-cols-5 bg-gray-800">
					<TabsTrigger value="generate" className="data-[state=active]:bg-gray-700">
						<Wand2 className="h-4 w-4 mr-2" />
						Generate
					</TabsTrigger>
					<TabsTrigger value="edit" className="data-[state=active]:bg-gray-700">
						<Scissors className="h-4 w-4 mr-2" />
						Edit
					</TabsTrigger>
					<TabsTrigger value="enhance" className="data-[state=active]:bg-gray-700">
						<Sparkles className="h-4 w-4 mr-2" />
						Enhance
					</TabsTrigger>
					<TabsTrigger value="convert" className="data-[state=active]:bg-gray-700">
						<Camera className="h-4 w-4 mr-2" />
						Convert
					</TabsTrigger>
					<TabsTrigger value="dub" className="data-[state=active]:bg-gray-700">
						<Mic className="h-4 w-4 mr-2" />
						Dub
					</TabsTrigger>
				</TabsList>

				<TabsContent value="generate" className="space-y-6">
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
						<Card className="bg-gray-800 border-gray-700">
							<CardHeader>
								<CardTitle className="text-white flex items-center gap-2">
									<Play className="h-5 w-5" />
									Video Generation
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="space-y-2">
									<Label className="text-white">Video Description</Label>
									<Input
										placeholder="A time-lapse of a flower blooming in spring, cinematic lighting, 4K quality..."
										value={prompt}
										onChange={(e) => setPrompt(e.target.value)}
										className="bg-gray-700 border-gray-600 text-white"
									/>
								</div>

								<div className="space-y-2">
									<Label className="text-white">AI Provider</Label>
									<Select value={provider} onValueChange={setProvider}>
										<SelectTrigger className="bg-gray-700 border-gray-600 text-white">
											<SelectValue />
										</SelectTrigger>
										<SelectContent className="bg-gray-800 border-gray-700">
											{providers.map((p) => (
												<SelectItem key={p.id} value={p.id} className="text-white">
													<div>
														<div className="font-medium">{p.name}</div>
														<div className="text-sm text-gray-400">{p.description}</div>
													</div>
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>

								<div className="space-y-2">
									<Label className="text-white">Resolution</Label>
									<Select value={resolution} onValueChange={setResolution}>
										<SelectTrigger className="bg-gray-700 border-gray-600 text-white">
											<SelectValue />
										</SelectTrigger>
										<SelectContent className="bg-gray-800 border-gray-700">
											{resolutions.map((res) => (
												<SelectItem key={res.value} value={res.value} className="text-white">
													{res.label}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>

								<div className="space-y-2">
									<Label className="text-white">Duration: {duration[0]} seconds</Label>
									<Slider value={duration} onValueChange={setDuration} max={10} min={2} step={1} className="w-full" />
								</div>

								<div className="space-y-2">
									<Label className="text-white">Frame Rate: {fps[0]} FPS</Label>
									<Slider value={fps} onValueChange={setFps} max={60} min={12} step={12} className="w-full" />
								</div>

								<div className="flex items-center gap-3 pt-2">
									<Button disabled={loading || !prompt.trim()} onClick={handleGenerate}>
										{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
										<span className="ml-2">Generate</span>
									</Button>
									{status && <span className="text-gray-400">Status: {status}</span>}
									{error && <span className="text-red-400">{error}</span>}
								</div>
							</CardContent>
						</Card>

						<Card className="bg-gray-800 border-gray-700">
							<CardHeader>
								<CardTitle className="text-white">Preview</CardTitle>
							</CardHeader>
							<CardContent>
								{videoUrl ? (
									<video ref={playerRef} src={videoUrl} controls className="w-full rounded" />
								) : (
									<div className="text-gray-400">No video yet</div>
								)}
							</CardContent>
						</Card>
					</div>
				</TabsContent>
			</Tabs>
		</div>
	)
}


