import type { Difficulty } from "@/lib/types"

export const difficultyLabels: Record<Difficulty, string> = {
  easy: "简单",
  medium: "中等",
  hard: "困难",
}

/**
 * 解析时间：兼容 ISO 字符串、epoch 毫秒数字、"YYYY-MM-DD HH:mm:ss"
 * 随手备忘应用上报的是 epoch 毫秒数字，直接 new Date(数字) 会被当成年份。
 */
export function parseDate(value: string | number | null | undefined): Date | null {
  if (value === null || value === undefined || value === "") return null
  if (typeof value === "number" || /^\d{10,}$/.test(String(value))) {
    const n = Number(value)
    if (Number.isFinite(n)) {
      // 小于 1e11 视为秒级时间戳
      const d = new Date(n < 1e11 ? n * 1000 : n)
      return Number.isNaN(d.getTime()) ? null : d
    }
  }
  const d = new Date(String(value).replace(" ", "T"))
  return Number.isNaN(d.getTime()) ? null : d
}

export function formatBytes(bytes: number) {
  if (!bytes) return "0 B"
  const units = ["B", "KB", "MB", "GB"]
  let value = bytes
  let unit = 0
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024
    unit += 1
  }
  return `${value.toFixed(unit === 0 ? 0 : 1)} ${units[unit]}`
}

export function formatDate(iso: string | number | null | undefined) {
  if (!iso) return "-"
  const date = parseDate(iso)
  if (!date) return String(iso)
  return date.toLocaleString("zh-CN", { hour12: false })
}

/** 紧凑日期：05-18 14:22 */
export function formatDateShort(iso: string | number | null | undefined) {
  if (!iso) return "-"
  const date = parseDate(iso)
  if (!date) {
    const match = String(iso).match(/(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/)
    return match ? `${match[2]}-${match[3]} ${match[4]}:${match[5]}` : String(iso)
  }
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}
