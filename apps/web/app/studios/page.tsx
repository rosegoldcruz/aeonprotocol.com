"use client"

import { useState } from "react"
import { useAuth } from "@clerk/nextjs"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { ImageStudio } from "@/components/modules/image-studio"
import { AudioSuite } from "@/components/modules/audio-suite"
import { apiRequest } from "@/lib/utils"
import { useJobEvents } from "@/components/realtime/job-events"
import { toast } from "sonner"

interface QueueItem { id: number; type: "image"|"video"|"audio"; status: string; prompt?: string; url?: string | null }

export default function StudiosPage() {
  const { getToken } = useAuth()
  const [isGenerating, setGenerating] = useState(false)
  const [queue, setQueue] = useState<QueueItem[]>([])

  // Realtime queue updates
  useJobEvents((evt) => {
    setQueue((prev) => prev.map(q => q.id === evt.id ? { ...q, status: evt.status } : q))
    if (evt.status === "completed") {
      fetchAssets(evt.id).then((assets) => {
        const url = assets.find((a: any) => a.presigned_url || a.url)?.presigned_url || assets[0]?.url || null
        setQueue((prev) => prev.map(q => q.id === evt.id ? { ...q, url } : q))
        toast.success("Job completed", { description: `#${evt.id} is ready` })
      }).catch(() => {})
    }
  })

  async function fetchAssets(jobId: number) {
    const token = await getToken(); if (!token) return []
    return apiRequest(`/v1/jobs/${jobId}/assets`, {}, token)
  }

  async function createJobShim(endpoint: string, payload: any, type: QueueItem["type"], prompt?: string) {
    const token = await getToken(); if (!token) return
    setGenerating(true)
    try {
      const res = await apiRequest(endpoint, { method: "POST", body: JSON.stringify(payload) }, token)
      const jobId = res?.id || res?.job_id
      if (jobId) {
        setQueue((prev) => [{ id: jobId, type, status: "queued", prompt: (prompt || ""), url: null } as QueueItem, ...prev].slice(0, 20))
      }
    } catch (e: any) {
      toast.error("Failed to start job", { description: e?.message || "Unknown error" })
    } finally {
      setGenerating(false)
    }
  }

  // Video lightweight controls (local inline)
  const [vPrompt, setVPrompt] = useState("")
  const [vProvider, setVProvider] = useState("runway")
  const [vDuration, setVDuration] = useState([6])
  const [vRes, setVRes] = useState("1280x768")

  return (
    <main className="container mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold text-white">Studios</h1>
      <Tabs defaultValue="image">
        <TabsList className="bg-gray-800">
          <TabsTrigger value="image" className="data-[state=active]:bg-gray-700">Image</TabsTrigger>
          <TabsTrigger value="video" className="data-[state=active]:bg-gray-700">Video</TabsTrigger>
          <TabsTrigger value="audio" className="data-[state=active]:bg-gray-700">Audio</TabsTrigger>
        </TabsList>

        <TabsContent value="image">
          <ImageStudio
            onGenerate={(data) => createJobShim("/v1/jobs/image-generate", data, "image", data.prompt)}
            isGenerating={isGenerating}
          />
        </TabsContent>

        <TabsContent value="video">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Video Generation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-white">Prompt</Label>
                  <Input value={vPrompt} onChange={(e)=>setVPrompt(e.target.value)} className="bg-gray-700 border-gray-600 text-white" />
                </div>
                <div className="space-y-2">
                  <Label className="text-white">Provider</Label>
                  <Input value={vProvider} onChange={(e)=>setVProvider(e.target.value)} className="bg-gray-700 border-gray-600 text-white" />
                </div>
                <div className="space-y-2">
                  <Label className="text-white">Duration: {vDuration[0]}s</Label>
                  <Slider value={vDuration} onValueChange={setVDuration} max={10} min={2} step={1} />
                </div>
                <div className="space-y-2">
                  <Label className="text-white">Resolution</Label>
                  <Input value={vRes} onChange={(e)=>setVRes(e.target.value)} className="bg-gray-700 border-gray-600 text-white" />
                </div>
                <Button disabled={isGenerating || !vPrompt.trim()} onClick={() =>
                  createJobShim("/v1/jobs/video-generate", { prompt: vPrompt.trim(), provider: vProvider, duration: vDuration[0], resolution: vRes }, "video", vPrompt.trim())
                }>Generate</Button>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Preview</CardTitle>
              </CardHeader>
              <CardContent>
                {queue.find(q => q.type === "video" && q.url) ? (
                  <video src={queue.find(q => q.type === "video" && q.url)?.url || undefined} controls className="w-full rounded" />
                ) : (
                  <div className="h-48 rounded bg-gray-700/50 animate-pulse" />
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="audio">
          <AudioSuite
            onGenerate={(data) => createJobShim("/v1/jobs/audio-generate", data, "audio", data.text)}
            isGenerating={isGenerating}
          />
        </TabsContent>
      </Tabs>

      {/* Mini Queue */}
      {queue.length > 0 && (
        <Card className="bg-gray-900/70 border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Queue</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {queue.slice(0, 6).map((q) => (
              <div key={q.id} className="p-3 rounded bg-gray-800/70 border border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-white truncate pr-4">#{q.id} · {q.type} · {q.prompt || ""}</div>
                  <div className="text-xs text-gray-400">{q.status}</div>
                </div>
                <div className="mt-2 h-1.5 w-full bg-gray-700 rounded">
                  <div className={`h-1.5 rounded ${q.status === 'completed' ? 'bg-green-500 w-full' : q.status === 'processing' ? 'bg-blue-500 w-2/3 animate-pulse' : 'bg-yellow-500 w-1/3'}`}></div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </main>
  )
}

