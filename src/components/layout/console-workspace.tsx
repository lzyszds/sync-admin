import { useState } from "react"
import type { ReactNode } from "react"

/**
 * 第 4 栏主工作区（面包屑 + 视图切换 + 内容画布 + 状态底栏）
 * 与第 2、3 栏组合成 gemini 参考图的四栏工作台
 */
export function ConsoleWorkspace({
  breadcrumb,
  headerRight,
  nav,
  list,
  footerLeft,
  footerRight,
  children,
}: {
  breadcrumb: string
  headerRight?: ReactNode
  nav?: ReactNode
  list?: ReactNode
  footerLeft?: ReactNode
  footerRight?: ReactNode
  children: ReactNode
}) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="flex h-full w-full overflow-hidden text-sm">
      {nav && !collapsed && (
        <aside className="hidden w-[248px] shrink-0 overflow-y-auto border-r border-white/60 lg:flex">
          {nav}
        </aside>
      )}

      {list && !collapsed && (
        <section className="hidden w-[300px] shrink-0 overflow-hidden border-r border-white/60 xl:flex">
          {list}
        </section>
      )}

      <main className="flex h-full min-w-0 flex-1 flex-col overflow-hidden bg-white/40">
        <header className="flex h-12 shrink-0 items-center justify-between gap-4 border-b border-white/70 bg-white/55 px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              onClick={() => setCollapsed((v) => !v)}
              title="展开 / 收起列表栏"
              className="flex size-7 shrink-0 items-center justify-center rounded-md text-craft-muted transition hover:bg-black/5 hover:text-craft-ink"
            >
              <svg className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
              </svg>
            </button>
            <span className="truncate text-xs text-craft-muted">{breadcrumb}</span>
          </div>
          {headerRight && <div className="flex shrink-0 items-center gap-2">{headerRight}</div>}
        </header>

        <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-8 sm:py-7 lg:px-12 lg:py-8">{children}</div>

        <footer className="flex h-9 shrink-0 items-center justify-between border-t border-white/70 bg-white/55 px-8 text-[11px] text-craft-muted">
          <div className="truncate">{footerLeft}</div>
          <div className="truncate">{footerRight}</div>
        </footer>
      </main>
    </div>
  )
}

/** 视图切换分段控件（详情 / 表格 / 源码 / 规则） */
export function ConsoleViewTabs({
  value,
  options,
  onChange,
}: {
  value: string
  options: { value: string; label: string }[]
  onChange: (value: string) => void
}) {
  return (
    <div className="flex items-center bg-craft-list border border-craft-line rounded-lg p-0.5">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`px-2.5 py-1 rounded-md text-xs font-medium transition ${
            value === opt.value
              ? "bg-craft-ink text-white shadow-sm"
              : "text-craft-muted hover:text-craft-ink"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

/** 圆形图标按钮组 */
export function ConsoleIconButton({
  title,
  onClick,
  children,
  active,
  disabled,
}: {
  title: string
  onClick?: () => void
  children: ReactNode
  active?: boolean
  disabled?: boolean
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={`w-7 h-7 rounded-full flex items-center justify-center transition shrink-0 ${
        active
          ? "bg-craft-ink text-white"
          : "bg-craft-sidebar text-craft-muted hover:text-craft-ink disabled:opacity-40 disabled:cursor-not-allowed"
      }`}
    >
      {children}
    </button>
  )
}
