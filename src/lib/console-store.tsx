// 云控后台 · 平台级数据状态（真实后端优先，本地演示数据兜底）
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import type { ReactNode } from "react"
import { api, isAuthError } from "@/lib/api"
import { clearCache, dedupe } from "@/lib/data-cache"
import type { AppStat, Overview, Recipe, Snapshot } from "@/lib/types"
import { DEMO_APPS, DEMO_OVERVIEW, DEMO_SNAPSHOTS, demoRecipes } from "@/lib/console-data"

interface ConsoleContextValue {
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

const ConsoleContext = createContext<ConsoleContextValue | null>(null)

export function ConsoleProvider({ children }: { children: ReactNode }) {
  const [overview, setOverview] = useState<Overview>(DEMO_OVERVIEW)
  const [apps, setApps] = useState<AppStat[]>(DEMO_APPS)
  const [snapshots, setSnapshots] = useState<Snapshot[]>(DEMO_SNAPSHOTS)
  const [recipes, setRecipes] = useState<Recipe[]>(() => demoRecipes())
  const [online, setOnline] = useState(false)
  const [authFailed, setAuthFailed] = useState(false)
  const [loading, setLoading] = useState(true)
  const [syncCount, setSyncCount] = useState(142)
  const [lastSyncAt, setLastSyncAt] = useState(DEMO_OVERVIEW.lastUpdated || "")

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const [ov, ap] = await Promise.all([api.overview(), api.apps()])
      setOverview(ov)
      setApps(ap.apps)
      setLastSyncAt(ov.lastUpdated || "")
      setOnline(true)
      setAuthFailed(false)

      // 快照列表：分页拉取，每页到达即更新，界面边收边渲染
      const sn = await api.allSnapshots({}, 100, (partial) => {
        setSnapshots(partial.snapshots)
      })
      setSnapshots(sn.snapshots)

      // 食谱业务表记录（用于跨表引用）—— 拉取全量，保证关联食谱下拉完整
      const recipeSnapshot = sn.snapshots.find((s) => s.app === "recipe")
      if (recipeSnapshot) {
        // 与食谱页面共享同一份请求，避免重复拉取
        const res = await dedupe(`recipes:recipe:${recipeSnapshot.tokenHash}:live`, () =>
          api.allRecipes("recipe", recipeSnapshot.tokenHash, {}, (partial) => {
            setRecipes(partial.recipes)
          })
        )
        setRecipes(res.recipes)
      }
    } catch (err) {
      // 令牌被拒（401/403）：后端可达，仅鉴权失败 —— 不算「服务不可达」
      if (isAuthError(err)) {
        setOnline(false)
        setAuthFailed(true)
      } else {
        // 后端确实不可达时保持本地演示数据，控制台依旧可用
        setOnline(false)
        setAuthFailed(false)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  const triggerSync = useCallback(async () => {
    try {
      const sn = await api.allSnapshots({}, 100, (partial) => {
        setSnapshots(partial.snapshots)
      })
      setSnapshots(sn.snapshots)
      setOnline(true)
      setAuthFailed(false)
    } catch (err) {
      setOnline(false)
      setAuthFailed(isAuthError(err))
    }
    setSyncCount((count) => count + 1)
    setLastSyncAt(new Date().toLocaleString("zh-CN", { hour12: false }))
  }, [])

  /**
   * 全局刷新：清空所有页面缓存并重新拉取平台级数据。
   * 各页面通过 useCachedData 的 refresh 单独刷新自己的数据。
   */
  const refreshAll = useCallback(async () => {
    clearCache()
    await refresh()
  }, [refresh])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const value = useMemo<ConsoleContextValue>(
    () => ({ overview, apps, snapshots, recipes, online, authFailed, loading, syncCount, lastSyncAt, refresh, refreshAll, triggerSync }),
    [overview, apps, snapshots, recipes, online, authFailed, loading, syncCount, lastSyncAt, refresh, refreshAll, triggerSync],
  )

  return <ConsoleContext.Provider value={value}>{children}</ConsoleContext.Provider>
}

export function useConsole() {
  const ctx = useContext(ConsoleContext)
  if (!ctx) throw new Error("useConsole 必须在 ConsoleProvider 内部使用")
  return ctx
}
