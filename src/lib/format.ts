import type { Difficulty } from "@/lib/types"

export const difficultyLabels: Record<Difficulty, string> = {
  easy: "简单",
  medium: "中等",
  hard: "困难",
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

export function formatDate(iso: string | null | undefined) {
  if (!iso) return "-"
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleString("zh-CN", { hour12: false })
}

/** 紧凑日期：05-18 14:22 */
export function formatDateShort(iso: string | null | undefined) {
  if (!iso) return "-"
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) {
    const match = String(iso).match(/(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/)
    return match ? `${match[2]}-${match[3]} ${match[4]}:${match[5]}` : String(iso)
  }
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}
