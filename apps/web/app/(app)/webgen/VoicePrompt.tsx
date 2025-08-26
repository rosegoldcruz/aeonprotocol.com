"use client";
import { useState, useRef } from "react";

export default function VoicePrompt() {
  const [text, setText] = useState("");
  const [enh, setEnh] = useState<any>(null);
  const [enhId, setEnhId] = useState<string | null>(null);
  const recRef = useRef<any>(null);

  function start() {
    const SR = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SR) {
      console.warn("Speech recognition not supported");
      return;
    }
    const r = new SR();
    r.continuous = true;
    r.interimResults = true;
    r.lang = "en-US";
    r.onresult = (e: any) => {
      let t = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        t += e.results[i][0].transcript;
      }
      setText(t);
    };
    r.start();
    recRef.current = r;
  }
  function stop(){ recRef.current?.stop(); }

  async function enhance() {
    const base = (process.env['NEXT_PUBLIC_API_URL'] as string) || "";
    const res = await fetch(`${base}/v1/enhance/webspec`, {
      method:"POST", headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({ raw: text })
    });
    const data = await res.json();
    setEnh(data.webspec); setEnhId(data.enhancement_id);
  }

  async function commit() {
    if (!enhId) return;
    const base = (process.env['NEXT_PUBLIC_API_URL'] as string) || "";
    const res = await fetch(`${base}/v1/webgen/commit?enhancement_id=${enhId}`, { method:"POST" });
    const data = await res.json();
    alert(`Queued project ${data.project_id}`);
  }

  return (
    <div className="grid gap-3">
      <div className="flex gap-2">
        <button onClick={start} className="px-3 py-2 rounded bg-white text-black">🎙️ Talk</button>
        <button onClick={stop} className="px-3 py-2 rounded bg-neutral-700">⏹ Stop</button>
        <button onClick={enhance} className="px-3 py-2 rounded bg-indigo-600">✨ Enhance</button>
        <button onClick={commit} disabled={!enhId} className="px-3 py-2 rounded bg-emerald-600">Commit & Launch</button>
      </div>
      <textarea className="w-full h-28 rounded border p-3 bg-neutral-900" value={text} onChange={e=>setText(e.target.value)} />
      {enh && <pre className="text-xs p-3 rounded border overflow-auto bg-neutral-900">{JSON.stringify(enh, null, 2)}</pre>}
    </div>
  );
}

