import type { ReactNode } from "react"

/**
 * 加载进度条
 *
 * 分页 / 流式加载时显示「已加载 N / 总数 M」，并用进度条表达完成度。
 * 数据已经渲染出来时进度条仍然可见，让用户知道还有多少在路上。
 */
export function LoadProgress({
  loaded,
  total,
  visible,
  className = "",
}: {
  loaded: number
  total: number
  /** 是否显示 */
  visible: boolean
  className?: string
}) {
  if (!visible) return null
  const percent = total > 0 ? Math.min(100, Math.round((loaded / total) * 100)) : 0
  return (
    <div className={`flex items-center gap-2 px-3.5 py-1.5 text-[11px] text-craft-muted ${className}`}>
      <div className="h-1 flex-1 overflow-hidden rounded-full bg-craft-line">
        <div
          className="h-full rounded-full bg-craft-ink transition-[width] duration-200"
          style={{ width: `${percent}%` }}
        />
      </div>
      <span className="shrink-0 tabular-nums">
        {total > 0 ? `${loaded} / ${total}` : `已加载 ${loaded}`}
      </span>
    </div>
  )
}

/** 顶栏刷新按钮（带旋转态） */
export function RefreshButton({
  onClick,
  loading,
  title = "刷新数据",
}: {
  onClick: () => void
  loading?: boolean
  title?: string
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      aria-label={title}
      className="flex size-7 items-center justify-center rounded-full bg-craft-sidebar text-craft-muted transition hover:bg-black/5 hover:text-craft-ink disabled:opacity-50"
    >
      <svg
        className={`size-3.5 ${loading ? "animate-spin" : ""}`}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3.75 12a8.25 8.25 0 0 1 13.4-6.2L19.5 8.25M19.5 4.5v3.75h-3.75M20.25 12a8.25 8.25 0 0 1-13.4 6.2L4.5 15.75M4.5 19.5v-3.75h3.75"
        />
      </svg>
    </button>
  )
}

/** 顶部全局刷新栏 */
export function GlobalRefreshBar({
  loading,
  onRefresh,
  extra,
}: {
  loading: boolean
  onRefresh: () => void
  extra?: ReactNode
}) {
  return (
    <div className="flex items-center justify-end gap-2">
      {extra}
      <RefreshButton onClick={onRefresh} loading={loading} />
    </div>
  )
}
