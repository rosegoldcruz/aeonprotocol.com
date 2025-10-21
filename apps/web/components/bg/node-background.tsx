"use client"

import { useEffect, useRef } from "react"

// Lightweight animated background without three.js
export function NodeBackground() {
  const ref = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = ref.current!
    const ctx = canvas.getContext("2d")!
    let raf = 0
    const DPR = Math.min(2, window.devicePixelRatio || 1)

    function resize() {
      const { innerWidth: w, innerHeight: h } = window
      canvas.width = w * DPR
      canvas.height = h * DPR
      canvas.style.width = w + "px"
      canvas.style.height = h + "px"
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0)
    }

    resize()
    window.addEventListener("resize", resize)

    const nodes: { x: number; y: number; vx: number; vy: number }[] = Array.from({ length: 60 }).map(() => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.2,
      vy: (Math.random() - 0.5) * 0.2,
    }))

    function step() {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      // draw links
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i]!
          const b = nodes[j]!
          const dx = a.x - b.x, dy = a.y - b.y
          const dist2 = dx * dx + dy * dy
          if (dist2 < 200 * 200) {
            const alpha = 1 - Math.sqrt(dist2) / 200
            ctx.strokeStyle = `rgba(166, 107, 255, ${alpha * 0.2})`
            ctx.beginPath()
            ctx.moveTo(a.x, a.y)
            ctx.lineTo(b.x, b.y)
            ctx.stroke()
          }
        }
      }
      // draw nodes
      for (const n of nodes) {
        n.x += n.vx
        n.y += n.vy
        if (n.x < 0 || n.x > window.innerWidth) n.vx *= -1
        if (n.y < 0 || n.y > window.innerHeight) n.vy *= -1
        ctx.fillStyle = "rgba(0,229,255,0.8)"
        ctx.beginPath()
        ctx.arc(n.x, n.y, 1.8, 0, Math.PI * 2)
        ctx.fill()
      }
      raf = requestAnimationFrame(step)
    }

    raf = requestAnimationFrame(step)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener("resize", resize)
    }
  }, [])

  return <canvas ref={ref} className="fixed inset-0 -z-10" />
}

