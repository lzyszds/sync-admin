// 浜戞帶鍚庡彴 路 骞冲彴绾ф暟鎹姸鎬侊紙鐪熷疄鍚庣浼樺厛锛屾湰鍦版紨绀烘暟鎹厹搴曪級
//
// 娉ㄦ剰锛氭湰妯″潡鍙鍑虹粍浠?ConsoleProvider銆?
// Context 涓?useConsole 鏀惧湪 console-context.ts锛?
// 閬垮厤 Fast Refresh 鍥犮€岀粍浠朵笌 hook 娣峰悎瀵煎嚭銆嶈€屾暣鍧楀け鏁堬紝瀵艰嚧鐧藉睆銆?
import { useCallback, useEffect, useMemo, useState } from "react"
import type { ReactNode } from "react"
import { api, isAuthError } from "@/lib/api"
import { clearCache, dedupe } from "@/lib/data-cache"
import { ConsoleContext } from "@/lib/console-context"
import type { ConsoleContextValue } from "@/lib/console-context"
import type { AppStat, Overview, Recipe, Snapshot } from "@/lib/types"
import { DEMO_APPS, DEMO_OVERVIEW, DEMO_SNAPSHOTS, demoRecipes } from "@/lib/console-data"

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

      // 蹇収鍒楄〃锛氬垎椤垫媺鍙栵紝姣忛〉鍒拌揪鍗虫洿鏂帮紝鐣岄潰杈规敹杈规覆鏌?
      const sn = await api.allSnapshots({}, 100, (partial) => {
        setSnapshots(partial.snapshots)
      })
      setSnapshots(sn.snapshots)

      // 椋熻氨涓氬姟琛ㄨ褰曪紙鐢ㄤ簬璺ㄨ〃寮曠敤锛夆€斺€?鎷夊彇鍏ㄩ噺锛屼繚璇佸叧鑱旈璋变笅鎷夊畬鏁?
      const recipeSnapshot = sn.snapshots.find((s) => s.app === "recipe")
      if (recipeSnapshot) {
        // 涓庨璋遍〉闈㈠叡浜悓涓€浠借姹傦紝閬垮厤閲嶅鎷夊彇
        const res = await dedupe(`recipes:recipe:${recipeSnapshot.tokenHash}:live`, () =>
          api.allRecipes("recipe", recipeSnapshot.tokenHash, {}, (partial) => {
            setRecipes(partial.recipes)
          })
        )
        setRecipes(res.recipes)
      }
    } catch (err) {
      // 浠ょ墝琚嫆锛?01/403锛夛細鍚庣鍙揪锛屼粎閴存潈澶辫触 鈥斺€?涓嶇畻銆屾湇鍔′笉鍙揪銆?
      if (isAuthError(err)) {
        setOnline(false)
        setAuthFailed(true)
      } else {
        // 鍚庣纭疄涓嶅彲杈炬椂淇濇寔鏈湴婕旂ず鏁版嵁锛屾帶鍒跺彴渚濇棫鍙敤
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
   * 鍏ㄥ眬鍒锋柊锛氭竻绌烘墍鏈夐〉闈㈢紦瀛樺苟閲嶆柊鎷夊彇骞冲彴绾ф暟鎹€?
   * 鍚勯〉闈㈤€氳繃 useCachedData 鐨?refresh 鍗曠嫭鍒锋柊鑷繁鐨勬暟鎹€?
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
