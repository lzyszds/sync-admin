import { cn } from "@/lib/utils"

/**
 * 云控后台品牌标识（与 public/favicon.svg 保持一致）
 * 暖杏底色圆角方块 + 波浪数据线 + 高光节点，象征多端数据同步链路。
 */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      role="img"
      aria-label="云控后台"
      className={cn("size-9 shrink-0", className)}
    >
      <rect width="32" height="32" rx="8" fill="#C98A4B" />
      <path
        d="M6 18c4-6 8-6 10 0s6 6 10 0"
        fill="none"
        stroke="#FFF7EE"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <circle cx="16" cy="13" r="2.4" fill="#FFF7EE" />
    </svg>
  )
}

/** 品牌文字组合（标识 + 名称 + 可选版本号） */
export function BrandLockup({
  name = "云控后台",
  version,
  className,
  compact = false,
}: {
  name?: string
  version?: string
  className?: string
  compact?: boolean
}) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <BrandMark className={compact ? "size-7" : "size-8"} />
      <span className="text-sm font-semibold tracking-tight text-activeblack">{name}</span>
      {version && (
        <span className="rounded-full border border-black/[0.04] bg-black/[0.04] px-2 py-0.5 text-[11px] text-textmuted">
          {version}
        </span>
      )}
    </div>
  )
}
