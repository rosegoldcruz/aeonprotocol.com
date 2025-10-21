"use client"

import { useEffect, useState } from "react"
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from "recharts"
import { apiRequest } from "@/lib/utils"
import { useAuth } from "@clerk/nextjs"

export function MetricsChart() {
  const { getToken } = useAuth()
  const [data, setData] = useState<{ name: string; created: number; completed: number }[]>([])

  useEffect(() => {
    let mounted = true
    async function tick() {
      try {
        const token = await getToken()
        if (!token) return
        const res = await apiRequest("/v1/metrics/dashboard", {}, token)
        if (!mounted) return
        const now = new Date().toLocaleTimeString()
        setData((d) => [...d.slice(-29), { name: now, created: res.last_24h.created, completed: res.last_24h.completed }])
      } catch {}
    }
    tick()
    const id = setInterval(tick, 3000)
    return () => { mounted = false; clearInterval(id) }
  }, [getToken])

  return (
    <div className="h-36 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ left: 0, right: 0, top: 10, bottom: 0 }}>
          <defs>
            <linearGradient id="created" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#00E5FF" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#00E5FF" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="completed" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#A66BFF" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#A66BFF" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="name" hide tick={false} axisLine={false} />
          <YAxis hide domain={[0, 'dataMax + 5']} />
          <Tooltip contentStyle={{ background: 'rgba(17,24,39,0.9)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff' }} />
          <Area type="monotone" dataKey="created" stroke="#00E5FF" fillOpacity={1} fill="url(#created)" strokeWidth={2} />
          <Area type="monotone" dataKey="completed" stroke="#A66BFF" fillOpacity={1} fill="url(#completed)" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

