import type { ReactNode } from "react"

/** 第 3 栏：记录列表栏（白底搜索 + 计数排序 + 滚动列表） */
export function ConsoleList({
  search,
  onSearch,
  placeholder = "搜索名称或内容...",
  onNew,
  newLabel = "新增",
  countText,
  sortLabel = "排序",
  sortIndicator = "↓↑",
  onSort,
  extra,
  children,
}: {
  search: string
  onSearch: (value: string) => void
  placeholder?: string
  onNew?: () => void
  newLabel?: string
  countText: string
  sortLabel?: string
  sortIndicator?: string
  onSort?: () => void
  extra?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="flex h-full flex-col bg-white/40">
      <div className="p-3.5 pb-2">
        <div className="flex items-center gap-2">
          <div className="relative min-w-0 flex-1">
            <svg
              className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-craft-muted"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
              />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => onSearch(e.target.value)}
              placeholder={placeholder}
              className="w-full rounded-lg border border-craft-line bg-white/80 py-1.5 pl-8 pr-3 text-xs text-craft-ink placeholder-craft-muted focus:border-neutral-400 focus:outline-none transition"
            />
          </div>
          {onNew && (
            <button
              onClick={onNew}
              className="shrink-0 rounded-lg bg-craft-ink px-2.5 py-1.5 text-xs font-medium text-white transition hover:bg-neutral-800"
            >
              + {newLabel}
            </button>
          )}
        </div>

        {extra && <div className="mt-3 px-0.5">{extra}</div>}

        <div className="mt-3 flex items-center justify-between px-1 text-[11px] text-craft-muted">
          <span className="truncate">{countText}</span>
          {onSort && (
            <button onClick={onSort} className="flex items-center gap-1 font-medium transition hover:text-craft-ink">
              <span>{sortLabel}</span>
              <span>{sortIndicator}</span>
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 space-y-1 overflow-y-auto px-2.5 py-1">{children}</div>
    </div>
  )
}

/** 列表项卡片：选中态为炭黑块 */
export function ConsoleListCard({
  active,
  title,
  description,
  trailing,
  dotColor,
  onClick,
}: {
  active: boolean
  title: ReactNode
  description?: ReactNode
  trailing?: ReactNode
  dotColor?: string
  onClick: () => void
}) {
  return (
    <div
      onClick={onClick}
      title={typeof title === "string" ? title : undefined}
      className={`cursor-pointer rounded-xl border px-3.5 py-3 transition ${
        active
          ? "border-craft-ink bg-craft-ink text-white shadow-sm"
          : "border-transparent bg-transparent text-craft-ink hover:bg-black/[0.03]"
      }`}
    >
      <div className="mb-1 flex items-center justify-between gap-2">
        <h4 className="min-w-0 flex-1 truncate text-xs font-semibold">{title}</h4>
        {dotColor && <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: dotColor }} />}
      </div>
      {(description || trailing) && (
        <div className="flex items-center justify-between gap-2">
          {description && (
            <p className={`min-w-0 flex-1 truncate text-[11px] ${active ? "text-neutral-300" : "text-craft-muted"}`}>
              {description}
            </p>
          )}
          {trailing && (
            <span className={`shrink-0 text-[10px] ${active ? "text-neutral-400" : "text-craft-muted"}`}>
              {trailing}
            </span>
          )}
        </div>
      )}
    </div>
  )
}

/** 第 2 栏：分类 / 标签筛选栏 */
export function ConsoleNav({
  title,
  onNew,
  newLabel = "新建",
  footerLabel,
  footerValue,
  children,
}: {
  title: string
  onNew?: () => void
  newLabel?: string
  footerLabel?: string
  footerValue?: string
  children: ReactNode
}) {
  return (
    <div className="flex h-full flex-col justify-between bg-white/55 p-3.5">
      <div className="min-w-0">
        <div className="mb-5 flex items-center justify-between gap-2 px-1.5">
          <span className="truncate text-[15px] font-bold tracking-tight text-craft-ink" title={title}>
            {title}
          </span>
          {onNew && (
            <button
              onClick={onNew}
              className="flex shrink-0 items-center gap-1 rounded-lg bg-craft-ink px-2.5 py-1.5 text-xs font-medium text-white transition hover:bg-neutral-800"
            >
              <span>+</span>
              <span>{newLabel}</span>
            </button>
          )}
        </div>
        <div className="space-y-1">{children}</div>
      </div>
      {footerLabel && (
        <div className="flex items-center justify-between gap-2 border-t border-craft-line/80 px-2 py-2.5 text-xs text-craft-muted">
          <span className="truncate">{footerLabel}</span>
          <span className="shrink-0 rounded bg-black/5 px-2 py-0.5 font-mono text-[11px] text-craft-ink dark:bg-white/10">
            {footerValue}
          </span>
        </div>
      )}
    </div>
  )
}

/** 分类项：圆形首字徽章 + 炭黑选中胶囊（单行不换行） */
export function ConsoleNavItem({
  active,
  label,
  count,
  badge,
  onClick,
}: {
  active: boolean
  label: string
  count: number
  badge?: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={`flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 transition ${
        active ? "bg-craft-ink text-white shadow-sm" : "text-craft-ink hover:bg-black/5"
      }`}
    >
      <span
        className={`flex size-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
          active ? "bg-white text-craft-ink" : "bg-craft-ink text-white"
        }`}
      >
        {badge ?? label.charAt(0)}
      </span>
      <span className="nowrap-item flex-1 text-left text-xs font-medium">{label}</span>
      <span className={`shrink-0 tabular-nums text-[11px] ${active ? "text-neutral-400" : "text-craft-muted"}`}>
        {count}
      </span>
    </button>
  )
}
