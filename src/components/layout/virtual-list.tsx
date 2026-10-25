import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import type { ReactNode } from "react"

/**
 * 虚拟滚动列表
 *
 * 只渲染可视区域内的条目，避免上千条记录全部进入 DOM。
 *  - 固定行高场景传 estimateHeight（默认 68）
 *  - 变高条目可用 measureBy 返回每条实际高度，自动维护偏移表
 */
export function VirtualList<T>({
  items,
  renderItem,
  estimateHeight = 68,
  measureBy,
  overscan = 6,
  className = "",
  emptyState,
  loading = false,
  loadingText = "加载中...",
}: {
  items: T[]
  renderItem: (item: T, index: number) => ReactNode
  /** 估算行高（像素） */
  estimateHeight?: number
  /** 可选：返回条目实际高度，用于变高条目 */
  measureBy?: (item: T, index: number) => number
  /** 可视区外额外渲染的条目数 */
  overscan?: number
  className?: string
  emptyState?: ReactNode
  loading?: boolean
  loadingText?: string
}) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [scrollTop, setScrollTop] = useState(0)
  const [viewportHeight, setViewportHeight] = useState(0)

  // 高度缓存：measureBy 变化或条目数变化时重置
  const heightsRef = useRef<Map<number, number>>(new Map())
  const prevMeasureKey = useRef<unknown>(null)
  // 测量结果版本号：高度变化时自增，驱动偏移表重算
  const [measureVersion, setMeasureVersion] = useState(0)

  const getHeight = useCallback(
    (index: number) => {
      if (measureBy) {
        const cached = heightsRef.current.get(index)
        if (cached !== undefined) return cached
      }
      return estimateHeight
    },
    [measureBy, estimateHeight]
  )

  // 计算每个条目的起始偏移与总高度
  const { offsets, totalHeight } = useMemo(() => {
    const offs = new Array<number>(items.length)
    let y = 0
    for (let i = 0; i < items.length; i++) {
      offs[i] = y
      y += getHeight(i)
    }
    return { offsets: offs, totalHeight: y }
  }, [items.length, getHeight, measureVersion])

  // 测量容器尺寸
  useLayoutEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const update = () => setViewportHeight(el.clientHeight)
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // 测量函数变化时清空高度缓存
  useEffect(() => {
    if (prevMeasureKey.current !== measureBy) {
      heightsRef.current.clear()
      prevMeasureKey.current = measureBy
    }
  }, [measureBy])

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop)
  }, [])

  // 滚动位置同步：原生 scroll 监听（实时）+ 定时兜底。
  // 某些环境（无头浏览器 / 特定 WebView / 后台标签页）不会稳定派发 scroll 事件，
  // 兜底轮询保证虚拟窗口始终跟随滚动位置。
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const sync = () => {
      const top = el.scrollTop
      setScrollTop((prev) => (Math.abs(prev - top) > 0.5 ? top : prev))
    }
    const onScroll = () => sync()
    el.addEventListener("scroll", onScroll, { passive: true })
    const timer = window.setInterval(sync, 100)
    return () => {
      el.removeEventListener("scroll", onScroll)
      window.clearInterval(timer)
    }
  }, [])

  // 二分查找首个可见条目的下标
  const startIndex = useMemo(() => {
    if (!items.length) return 0
    let lo = 0
    let hi = items.length - 1
    let ans = 0
    while (lo <= hi) {
      const mid = (lo + hi) >> 1
      if (offsets[mid] <= scrollTop) {
        ans = mid
        lo = mid + 1
      } else {
        hi = mid - 1
      }
    }
    return ans
  }, [offsets, scrollTop, items.length])

  const endIndex = useMemo(() => {
    if (!items.length) return 0
    const limit = scrollTop + viewportHeight
    let lo = 0
    let hi = items.length - 1
    let ans = 0
    while (lo <= hi) {
      const mid = (lo + hi) >> 1
      if (offsets[mid] <= limit) {
        ans = mid
        lo = mid + 1
      } else {
        hi = mid - 1
      }
    }
    return ans
  }, [offsets, scrollTop, viewportHeight, items.length])

  const from = Math.max(0, startIndex - overscan)
  const to = Math.min(items.length - 1, endIndex + overscan)

  // 需要额外渲染一条，用于测量变高条目
  const visible = useMemo(() => {
    const out: { item: T; index: number }[] = []
    for (let i = from; i <= to; i++) out.push({ item: items[i], index: i })
    return out
  }, [items, from, to])

  // 记录实际高度（用于变高条目）
  const itemRefs = useRef<Map<number, HTMLElement>>(new Map())

  useLayoutEffect(() => {
    if (!measureBy) return
    let changed = false
    for (const [index, el] of itemRefs.current) {
      const h = el.getBoundingClientRect().height
      if (h > 0 && heightsRef.current.get(index) !== h) {
        heightsRef.current.set(index, h)
        changed = true
      }
    }
    if (changed) setMeasureVersion((v) => v + 1)
  }, [visible, measureBy])

  // 始终渲染同一个滚动容器（空态也在容器内），保证 ref 始终可用、
  // 滚动监听不会因为「首次挂载时列表为空」而丢失。
  return (
    <div
      ref={scrollRef}
      onScroll={handleScroll}
      className={`flex-1 min-h-0 overflow-y-auto overflow-x-hidden ${className}`}
    >
      {items.length === 0 ? (
        loading ? (
          <div className="py-12 text-center text-xs text-craft-muted">{loadingText}</div>
        ) : (
          (emptyState ?? <div className="py-12 text-center text-xs text-craft-muted">暂无数据</div>)
        )
      ) : (
        <div style={{ height: totalHeight, position: "relative", width: "100%" }}>
          {visible.map(({ item, index }) => (
            <div
              key={index}
              ref={(el) => {
                if (el) itemRefs.current.set(index, el)
                else itemRefs.current.delete(index)
              }}
              data-vlist-index={index}
              style={{
                position: "absolute",
                top: offsets[index],
                left: 0,
                right: 0,
              }}
            >
              {renderItem(item, index)}
            </div>
          ))}
        </div>
      )}
      {loading && items.length > 0 && (
        <div className="py-3 text-center text-xs text-craft-muted">{loadingText}</div>
      )}
    </div>
  )
}
