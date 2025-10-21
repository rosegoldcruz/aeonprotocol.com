"use client"

/// <reference types="@react-three/fiber" />

import { Canvas, useFrame, type RootState } from "@react-three/fiber"
import { Stars } from "@react-three/drei"
import { Suspense } from "react"

function MotionStars() {
  useFrame(({ clock, camera }: RootState) => {
    const t = clock.getElapsedTime()
    camera.position.x = Math.sin(t * 0.05) * 0.6
    camera.position.y = Math.cos(t * 0.03) * 0.3
    camera.lookAt(0, 0, 0)
  })
  return <Stars radius={50} depth={20} count={2000} factor={4} saturation={0} fade speed={0.5} />
}

export function ThreeNodeNetwork() {
  return (
    <div className="fixed inset-0 -z-10">
      <Canvas dpr={[1, 2]} camera={{ position: [0, 0, 8], fov: 65 }}>
        <Suspense fallback={null}>
          <MotionStars />
        </Suspense>
      </Canvas>
    </div>
  )
}

