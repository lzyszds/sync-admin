import { useEffect, useRef } from "react"
import { cn } from "@/lib/utils"

interface Dot {
  ox: number
  oy: number
  x: number
  y: number
}

/**
 * 交互式波点矩阵画布
 * 鼠标经过时，附近的波点会被柔和地排斥位移、放大并加深为炭黑。
 */
function DotMatrix({ spacing = 26, mouseRadius = 150 }: { spacing?: number; mouseRadius?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mouse = useRef({ x: -1000, y: -1000 })
  const dots = useRef<Dot[]>([])
  const viewport = useRef({ w: 0, h: 0 })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches

    const build = () => {
      const w = window.innerWidth
      const h = window.innerHeight
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      viewport.current = { w, h }
      canvas.width = Math.floor(w * dpr)
      canvas.height = Math.floor(h * dpr)
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const list: Dot[] = []
      for (let x = spacing / 2; x < w; x += spacing) {
        for (let y = spacing / 2; y < h; y += spacing) {
          list.push({ ox: x, oy: y, x, y })
        }
      }
      dots.current = list
    }

    let frame = 0
    const render = () => {
      const { w, h } = viewport.current
      ctx.clearRect(0, 0, w, h)
      for (const d of dots.current) {
        const dx = mouse.current.x - d.ox
        const dy = mouse.current.y - d.oy
        const dist = Math.sqrt(dx * dx + dy * dy)

        let targetX = d.ox
        let targetY = d.oy
        let radius = 1.15
        let alpha = 0.16

        if (dist < mouseRadius) {
          const factor = 1 - dist / mouseRadius
          const angle = Math.atan2(dy, dx)
          const push = factor * 9
          targetX = d.ox - Math.cos(angle) * push
          targetY = d.oy - Math.sin(angle) * push
          radius = 1.15 + factor * 1.9
          alpha = 0.16 + factor * 0.48
        }

        d.x += (targetX - d.x) * 0.15
        d.y += (targetY - d.y) * 0.15

        ctx.beginPath()
        ctx.arc(d.x, d.y, radius, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(28, 28, 28, ${alpha})`
        ctx.fill()
      }
      frame = requestAnimationFrame(render)
    }

    const onMove = (e: MouseEvent) => {
      mouse.current.x = e.clientX
      mouse.current.y = e.clientY
    }
    const onLeave = () => {
      mouse.current.x = -1000
      mouse.current.y = -1000
    }

    build()
    render()

    window.addEventListener("resize", build)
    window.addEventListener("mousemove", onMove)
    window.addEventListener("mouseout", onLeave)
    document.addEventListener("mouseleave", onLeave)

    if (reduced) {
      // 降低动效偏好时停止动画，仅保留静态波点
      cancelAnimationFrame(frame)
      for (const d of dots.current) {
        ctx.beginPath()
        ctx.arc(d.ox, d.oy, 1.15, 0, Math.PI * 2)
        ctx.fillStyle = "rgba(28, 28, 28, 0.16)"
        ctx.fill()
      }
    }

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener("resize", build)
      window.removeEventListener("mousemove", onMove)
      window.removeEventListener("mouseout", onLeave)
      document.removeEventListener("mouseleave", onLeave)
    }
  }, [spacing, mouseRadius])

  return <canvas ref={canvasRef} className="fixed inset-0 z-0" aria-hidden="true" />
}

/**
 * 页面外部环境背景
 * 层级 1：流体渐变光晕（缓慢漂移）
 * 层级 2：交互式波点矩阵（随鼠标排斥）
 * 层级 3：胶片颗粒噪点（提升磨砂质感）
 */
export function AmbientBackground({ className }: { className?: string }) {
  return (
    <div className={cn("pointer-events-none fixed inset-0 z-0 overflow-hidden", className)} aria-hidden="true">
      <DotMatrix />

      {/* 暖杏香槟光晕 */}
      <div className="animate-blob-slow absolute -top-32 left-[12%] size-[560px] rounded-full bg-gradient-to-br from-orange-200/55 via-amber-100/40 to-transparent blur-3xl" />
      {/* 柔和雾玫瑰光晕 */}
      <div className="animate-blob-reverse absolute -bottom-40 right-[8%] size-[520px] rounded-full bg-gradient-to-tr from-rose-200/45 via-stone-200/50 to-transparent blur-3xl" />
      {/* 鼠尾草微光点缀 */}
      <div className="animate-blob-slow absolute top-1/3 right-[32%] size-[380px] rounded-full bg-gradient-to-r from-emerald-100/35 to-stone-200/30 blur-3xl" />
      {/* 品牌暖杏光晕 */}
      <div className="animate-blob-reverse absolute bottom-[12%] left-[6%] size-[340px] rounded-full bg-gradient-to-br from-[#E8C9A0]/45 to-transparent blur-3xl" />

      {/* 胶片颗粒质感层 */}
      <div className="noise-overlay absolute inset-0" />
    </div>
  )
}
