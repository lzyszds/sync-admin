// 云控后台 · 平台级数据 Context
//
// 单独拆成独立模块的原因：
// React Fast Refresh 要求一个模块的导出要么全是组件、要么全不是组件。
// 若 console-store.tsx 同时导出组件 ConsoleProvider 和 hook useConsole，
// Vite 会判定该模块 "incompatible" 并整块失效重载，
// 导致 Context 对象被重新创建，而未失效的消费者组件仍在渲染 ——
// 抛出「useConsole 必须在 ConsoleProvider 内部使用」，整个页面白屏。
// 把 Context 与 hook 拆出来后，console-store.tsx 只导出组件，
// Fast Refresh 可正常热更新，Context 引用保持稳定。
import { createContext, useContext } from "react"
import type { AppStat, Overview, Recipe, Snapshot } from "@/lib/types"

export interface ConsoleContextValue {
  overview: Overview
  apps: AppStat[]
  snapshots: Snapshot[]
  /** 食谱业务表的记录（供跨表引用与统计） */
  recipes: Recipe[]
  /** 是否已连上真实后端 */
  online: boolean
  /** 已连上后端但令牌被拒（401/403）—— 与「后端不可达」区分 */
  authFailed: boolean
  loading: boolean
  syncCount: number
  lastSyncAt: string
  refresh: () => Promise<void>
  /** 全局刷新：清空所有页面缓存并重新拉取 */
  refreshAll: () => Promise<void>
  triggerSync: () => Promise<void>
}

export const ConsoleContext = createContext<ConsoleContextValue | null>(null)

/** 读取平台级数据（必须在 ConsoleProvider 内使用） */
export function useConsole() {
  const ctx = useContext(ConsoleContext)
  if (!ctx) throw new Error("useConsole 必须在 ConsoleProvider 内部使用")
  return ctx
}
