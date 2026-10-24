// 云控后台 · 平台级数据状态（真实后端优先，本地演示数据兜底）
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import type { ReactNode } from "react"
import { api } from "@/lib/api"
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
  loading: boolean
  syncCount: number
  lastSyncAt: string
  refresh: () => Promise<void>
  triggerSync: () => Promise<void>
}

const ConsoleContext = createContext<ConsoleContextValue | null>(null)

export function ConsoleProvider({ children }: { children: ReactNode }) {
  const [overview, setOverview] = useState<Overview>(DEMO_OVERVIEW)
  const [apps, setApps] = useState<AppStat[]>(DEMO_APPS)
  const [snapshots, setSnapshots] = useState<Snapshot[]>(DEMO_SNAPSHOTS)
  const [recipes, setRecipes] = useState<Recipe[]>(() => demoRecipes())
  const [online, setOnline] = useState(false)
  const [loading, setLoading] = useState(true)
  const [syncCount, setSyncCount] = useState(142)
  const [lastSyncAt, setLastSyncAt] = useState(DEMO_OVERVIEW.lastUpdated || "")

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const [ov, ap, sn] = await Promise.all([
        api.overview(),
        api.apps(),
        api.snapshots({ limit: 60 }),
      ])
      setOverview(ov)
      setApps(ap.apps)
      setSnapshots(sn.snapshots)
      setLastSyncAt(ov.lastUpdated || "")
      setOnline(true)

      // 食谱业务表记录（用于跨表引用）
      const recipeSnapshot = sn.snapshots.find((s) => s.app === "recipe")
      if (recipeSnapshot) {
        const res = await api.recipes("recipe", recipeSnapshot.tokenHash, { limit: 100 })
        setRecipes(res.recipes)
      }
    } catch {
      // 后端不可达时保持本地演示数据，控制台依旧可用
      setOnline(false)
    } finally {
      setLoading(false)
    }
  }, [])

  const triggerSync = useCallback(async () => {
    try {
      const sn = await api.snapshots({ limit: 60 })
      setSnapshots(sn.snapshots)
      setOnline(true)
    } catch {
      setOnline(false)
    }
    setSyncCount((count) => count + 1)
    setLastSyncAt(new Date().toLocaleString("zh-CN", { hour12: false }))
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const value = useMemo<ConsoleContextValue>(
    () => ({ overview, apps, snapshots, recipes, online, loading, syncCount, lastSyncAt, refresh, triggerSync }),
    [overview, apps, snapshots, recipes, online, loading, syncCount, lastSyncAt, refresh, triggerSync],
  )

  return <ConsoleContext.Provider value={value}>{children}</ConsoleContext.Provider>
}

export function useConsole() {
  const ctx = useContext(ConsoleContext)
  if (!ctx) throw new Error("useConsole 必须在 ConsoleProvider 内部使用")
  return ctx
}
