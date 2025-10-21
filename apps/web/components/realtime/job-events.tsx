"use client"

import { useEffect, useRef } from "react"
import { API_BASE_URL } from "@/lib/utils"

export type JobEvent = { id: number; status: string; progress?: number }

function toWsUrl(httpUrl: string) {
  if (httpUrl.startsWith("https://")) return httpUrl.replace("https://", "wss://")
  if (httpUrl.startsWith("http://")) return httpUrl.replace("http://", "ws://")
  return `ws://${httpUrl}`
}

export function useJobEvents(onEvent: (evt: JobEvent) => void) {
  const onEventRef = useRef(onEvent)
  onEventRef.current = onEvent

  useEffect(() => {
    const wsUrl = toWsUrl(API_BASE_URL) + "/ws/jobs"
    let ws: WebSocket | null = null
    let retry = 0

    function connect() {
      ws = new WebSocket(wsUrl)
      ws.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data)
          if (data && data.id) onEventRef.current(data)
        } catch {}
      }
      ws.onclose = () => {
        const timeout = Math.min(1000 * Math.pow(2, retry++), 10000)
        setTimeout(connect, timeout)
      }
      ws.onerror = () => {
        try { ws?.close() } catch {}
      }
    }

    connect()
    return () => {
      try { ws?.close() } catch {}
    }
  }, [])
}

