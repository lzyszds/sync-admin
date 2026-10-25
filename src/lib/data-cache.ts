/**
 * 页面数据缓存
 *
 * 目标：切换路由不重复请求，只有增删改或手动刷新才重新拉取。
 *
 * 使用方式：
 *   const { data, loading, error, refresh } = useCachedData("recipes:recipe", loader)
 *
 * loader 支持两种形态：
 *   1. () => Promise<T>                     —— 一次性返回
 *   2. (onChunk) => Promise<T>              —— 分页/流式返回，onChunk 每次有新数据时调用，
 *                                             调用方可以边收边渲染
 */

export interface CacheEntry<T> {
  data: T
  at: number
  /** 该条目是否仍在进行中（用于流式加载时复用同一个 Promise） */
  pending?: Promise<T>
}

const store = new Map<string, CacheEntry<unknown>>()

/** 进行中的请求（同一 key 的并发请求共享同一个 Promise，避免重复拉取） */
const inflight = new Map<string, Promise<unknown>>()

/**
 * 同一 key 的并发请求复用同一个 Promise。
 * 典型场景：全局 store 与某个页面都需要同一份数据，不应各发一次。
 */
export function dedupe<T>(key: string, factory: () => Promise<T>): Promise<T> {
  const existing = inflight.get(key)
  if (existing) return existing as Promise<T>
  const p = factory().finally(() => {
    if (inflight.get(key) === p) inflight.delete(key)
  })
  inflight.set(key, p)
  return p
}

/** 读取缓存 */
export function getCache<T>(key: string): T | undefined {
  return store.get(key)?.data as T | undefined
}

/** 写入缓存 */
export function setCache<T>(key: string, data: T) {
  store.set(key, { data, at: Date.now() })
}

/** 使缓存失效（下次读取时重新请求） */
export function invalidateCache(key: string) {
  store.delete(key)
}

/** 清空全部缓存 */
export function clearCache() {
  store.clear()
}

/** 缓存中是否存在该 key（用于判断路由切换是否需要重新请求） */
export function hasCache(key: string) {
  return store.has(key)
}
