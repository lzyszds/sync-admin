import { useCallback, useEffect, useRef, useState } from "react"
import { getCache, invalidateCache, setCache } from "@/lib/data-cache"

export interface CachedDataState<T> {
  /** 当前数据（可能为部分数据，流式加载时逐步填充） */
  data: T | undefined
  /** 是否正在加载 */
  loading: boolean
  /** 加载错误 */
  error: Error | null
  /** 已加载条数 / 总条数（用于进度显示） */
  loaded: number
  /** 总条数（未知时为 0） */
  total: number
  /** 强制重新请求 */
  refresh: () => Promise<void>
  /** 直接写入数据并同步缓存（增删改后使用，避免额外请求） */
  setData: (updater: T | ((prev: T | undefined) => T)) => void
}

/**
 * 带缓存的页面数据加载。
 *
 * - 首次进入：发起请求，边收边渲染（onChunk）
 * - 切换路由回来：命中缓存直接渲染，不发请求
 * - 增删改：调用 setData 更新缓存，或 invalidateCache 后 refresh
 * - 手动刷新：调用 refresh
 */
export function useCachedData<T>(
  key: string,
  loader: (onChunk?: (chunk: T) => void) => Promise<T>,
  options: { enabled?: boolean; deps?: unknown[]; cacheable?: boolean } = {}
): CachedDataState<T> {
  const enabled = options.enabled ?? true
  const deps = options.deps ?? []
  const cacheable = options.cacheable ?? true
  const [data, setDataState] = useState<T | undefined>(() => getCache<T>(key))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [loaded, setLoaded] = useState(0)
  const [total, setTotal] = useState(0)

  // 避免 loader 变化导致无限请求
  const loaderRef = useRef(loader)
  loaderRef.current = loader
  const mountedRef = useRef(true)
  const inflightRef = useRef<Promise<T> | null>(null)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  const run = useCallback(
    async (force: boolean) => {
      if (!enabled) return
      if (!force && getCache<T>(key) !== undefined) {
        setDataState(getCache<T>(key))
        return
      }
      // 同一 key 已有请求在进行中，复用之，避免并发重复请求
      if (!force && inflightRef.current) {
        try {
          const result = await inflightRef.current
          if (mountedRef.current) setDataState(result)
        } catch {
          /* 错误已在下方统一处理 */
        }
        return
      }

      setLoading(true)
      setError(null)

      const task = (async () => {
        const result = await loaderRef.current((chunk) => {
          if (!mountedRef.current) return
          // 流式：先渲染已到达的部分
          setDataState(chunk)
          setLoaded(Array.isArray(chunk) ? chunk.length : loaded + 1)
        })
        if (mountedRef.current) {
          setDataState(result)
          setLoaded(Array.isArray(result) ? result.length : loaded)
          setTotal(Array.isArray(result) ? result.length : total)
          // cacheable=false 时（如演示兜底数据）不写入缓存，避免污染真实数据缓存
          if (cacheable) setCache(key, result)
        }
        return result
      })()

      inflightRef.current = task
      try {
        await task
      } catch (err) {
        if (mountedRef.current) {
          setError(err instanceof Error ? err : new Error(String(err)))
        }
      } finally {
        if (inflightRef.current === task) inflightRef.current = null
        if (mountedRef.current) setLoading(false)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key, enabled, cacheable, ...deps]
  )

  // 首次进入 / key 变化时加载
  useEffect(() => {
    void run(false)
  }, [run])

  const refresh = useCallback(async () => {
    invalidateCache(key)
    setLoaded(0)
    setTotal(0)
    await run(true)
  }, [key, run])

  const setData = useCallback(
    (updater: T | ((prev: T | undefined) => T)) => {
      setDataState((prev) => {
        const next =
          typeof updater === "function" ? (updater as (p: T | undefined) => T)(prev) : updater
        setCache(key, next)
        return next
      })
    },
    [key]
  )

  return { data, loading, error, loaded, total, refresh, setData }
}
