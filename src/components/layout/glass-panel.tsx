import { useCallback, useRef } from "react"
import type { MouseEvent, ReactNode } from "react"
import { cn } from "@/lib/utils"

/**
 * 鼠标跟随的聚光灯 / 边缘流光交互
 * 通过 CSS 变量 --mouse-x / --mouse-y / --spotlight-opacity 驱动伪元素。
 */
export function useSpotlight<T extends HTMLElement>(maxTilt = 0) {
  const ref = useRef<T | null>(null)

  const handleMove = useCallback(
    (e: MouseEvent<T>) => {
      const el = ref.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      el.style.setProperty("--mouse-x", `${x}px`)
      el.style.setProperty("--mouse-y", `${y}px`)
      el.style.setProperty("--spotlight-opacity", "1")

      if (maxTilt > 0) {
        const cx = rect.width / 2 || 1
        const cy = rect.height / 2 || 1
        const rotateX = ((y - cy) / cy) * -maxTilt
        const rotateY = ((x - cx) / cx) * maxTilt
        el.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`
      }
    },
    [maxTilt],
  )

  const handleLeave = useCallback(() => {
    const el = ref.current
    if (!el) return
    el.style.setProperty("--spotlight-opacity", "0")
    if (maxTilt > 0) el.style.transform = "rotateX(0deg) rotateY(0deg)"
  }, [maxTilt])

  return { ref, handleMove, handleLeave }
}

export interface GlassPanelProps {
  children: ReactNode
  className?: string
  /** 卡片圆角尺寸 */
  radius?: string
  /** 鼠标跟随的聚光灯强度（0 关闭） */
  spotlight?: boolean
  /** 3D 倾斜角度（0 关闭，true 使用默认 3.5 度） */
  tilt?: number | boolean
  /** 内容层是否包裹在相对定位层内（保证聚光灯位于内容之下） */
  layered?: boolean
}

/**
 * 拟态磨砂玻璃大卡片
 * 半透明磨砂底 + 高光内边 + 鼠标聚光灯 + 边缘流光。
 */
export function GlassPanel({
  children,
  className,
  radius = "rounded-[28px]",
  spotlight = true,
  tilt = 0,
  layered = true,
}: GlassPanelProps) {
  const tiltAngle = typeof tilt === "number" ? tilt : tilt ? 3.5 : 0
  const { ref, handleMove, handleLeave } = useSpotlight<HTMLDivElement>(tiltAngle)

  return (
    <div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      className={cn(
        "glass-surface relative isolate overflow-hidden",
        radius,
        tiltAngle > 0 && "glass-spotlight-tilt",
        className,
      )}
    >
      {spotlight && (
        <>
          {/* 表面聚光灯反射 */}
          <span className="glass-spotlight-layer" aria-hidden="true" />
          {/* 边缘流光束 */}
          <span className="glass-beam-layer" aria-hidden="true" />
        </>
      )}
      {layered ? <div className="relative z-10 flex h-full min-h-0 flex-col">{children}</div> : children}
    </div>
  )
}
