"use client"

import { useEffect, useMemo, useState } from "react"
import Editor from "@monaco-editor/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"

export default function CodegenPage() {
  const [prompt, setPrompt] = useState("")
  const [busy, setBusy] = useState(false)
  const [left, setLeft] = useState("// Describe an app on the left and press Generate")
  const [right, setRight] = useState("// Generated code will appear here…")
  const [dsKey, setDsKey] = useState("")

  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("aeon_ds_key") : ""
    if (saved) setDsKey(saved)
  }, [])

  const monacoTheme = useMemo(() => ({
    theme: "vs-dark",
    options: { fontSize: 13, minimap: { enabled: false }, smoothScrolling: true },
    height: "50vh",
  }), [])

  const onGenerate = async () => {
    if (!prompt.trim()) return
    setBusy(true)
    toast("Generating…", { description: "Asking the model to synthesize a scaffold" })
    try {
      // Placeholder: local transform for now (keeps backend untouched)
      const result = `/**\n * Spec: ${prompt}\n */\n\nexport function App(){\n  return (<div className=\"neon\">Where Instinct Meets Infrastructure.</div>)\n}`
      setRight(result)
    } catch (e: any) {
      toast.error("Generation failed", { description: e?.message || "Unknown error" })
    } finally {
      setBusy(false)
    }
  }

  const saveKey = () => {
    localStorage.setItem("aeon_ds_key", dsKey)
    toast.success("Saved", { description: "DeepSeek-Coder key stored locally" })
  }

  return (
    <main className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-white">CodeGen Studio</h1>
        <div className="flex items-center gap-2">
          <Input placeholder="DeepSeek-Coder API Key" value={dsKey} onChange={(e)=>setDsKey(e.target.value)} className="w-[320px] bg-gray-800 border-gray-700"/>
          <Button variant="outline" onClick={saveKey} className="border-gray-700">Save</Button>
        </div>
      </div>

      <Card className="bg-gray-900/60 backdrop-blur-md border-white/10">
        <CardHeader>
          <CardTitle className="text-white">Describe your app</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input placeholder="E.g., A notes app with tags, search, and offline mode" value={prompt} onChange={(e)=>setPrompt(e.target.value)} className="bg-gray-800 border-gray-700"/>
          <div className="flex gap-3">
            <Button disabled={busy || !prompt.trim()} onClick={onGenerate}>{busy ? "Generating…" : "Generate"}</Button>
            <Button variant="secondary" onClick={()=>{setLeft(""); setRight("")}}>Clear</Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-gray-900/60 backdrop-blur-md border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Prompt / Spec</CardTitle>
          </CardHeader>
          <CardContent>
            <Editor language="markdown" value={left} onChange={(v)=>setLeft(v || "")} {...monacoTheme} />
          </CardContent>
        </Card>
        <Card className="bg-gray-900/60 backdrop-blur-md border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Generated Code</CardTitle>
          </CardHeader>
          <CardContent>
            <Editor language="typescript" value={right} onChange={(v)=>setRight(v || "")} {...monacoTheme} />
          </CardContent>
        </Card>
      </div>

      <div className="h-px w-full bg-white/10" />
      <p className="text-xs text-gray-400">Tip: Neon glass styling is applied. Diff view and commit actions can be added next.</p>
    </main>
  )
}

