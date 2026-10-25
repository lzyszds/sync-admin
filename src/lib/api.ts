import type {
  AiConfig,
  AiParseResult,
  AppStat,
  BulkImportResult,
  Overview,
  Recipe,
  RecipesResponse,
  Snapshot,
  SnapshotDetail,
  SnapshotsResponse,
} from "@/lib/types"

const API_BASE = (import.meta.env.VITE_API_BASE || "").replace(/\/+$/, "")
const TOKEN_KEY = "mengchu-admin-token"
const SESSION_TOKEN_KEY = "mengchu-admin-session-token"
const BASE_OVERRIDE_KEY = "mengchu-api-base"

/** 管理员令牌读取（优先本机持久化，其次为本次会话） */
export const getToken = () =>
  localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(SESSION_TOKEN_KEY) || ""

/** 写入管理员令牌；persistent=false 时仅保存在当前会话 */
export const setToken = (token: string, persistent = true) => {
  const value = token.trim()
  if (persistent) {
    localStorage.setItem(TOKEN_KEY, value)
    sessionStorage.removeItem(SESSION_TOKEN_KEY)
  } else {
    sessionStorage.setItem(SESSION_TOKEN_KEY, value)
    localStorage.removeItem(TOKEN_KEY)
  }
}

export const clearToken = () => {
  localStorage.removeItem(TOKEN_KEY)
  sessionStorage.removeItem(SESSION_TOKEN_KEY)
}

/** 当前生效的后端服务地址（可被登录页自定义覆盖） */
export const getApiBase = () => {
  const override = (localStorage.getItem(BASE_OVERRIDE_KEY) || "").trim()
  return (override || API_BASE).replace(/\/+$/, "")
}

export const setApiBase = (base: string) => {
  const value = base.trim().replace(/\/+$/, "")
  if (!value || value === API_BASE) {
    localStorage.removeItem(BASE_OVERRIDE_KEY)
    return
  }
  localStorage.setItem(BASE_OVERRIDE_KEY, value)
}

export const clearApiBase = () => localStorage.removeItem(BASE_OVERRIDE_KEY)

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

/** 鉴权失败（令牌无效/无权限）—— 与「网络不可达」区分开，便于给出准确提示 */
export function isAuthError(err: unknown): boolean {
  return err instanceof ApiError && (err.status === 401 || err.status === 403)
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken()
  const headers = new Headers(init.headers || {})
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json")
  }
  if (token) headers.set("Authorization", `Bearer ${token}`)

  const res = await fetch(`${getApiBase()}${path}`, { ...init, headers })

  const contentType = res.headers.get("content-type") || ""
  const payload = contentType.includes("application/json")
    ? await res.json().catch(() => null)
    : await res.text().catch(() => null)

  if (!res.ok) {
    const message =
      payload && typeof payload === "object" && "error" in payload
        ? String(payload.error)
        : `请求失败 (${res.status})`
    throw new ApiError(res.status, message)
  }
  return payload as T
}

function qs(params: Record<string, string | number | undefined>) {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") search.set(key, String(value))
  }
  const s = search.toString()
  return s ? `?${s}` : ""
}

/**
 * 分页拉取指定用户快照下的全部食谱。
 *
 * 服务端的 limit 可能存在上限（请求 200 只返回 100），
 * 因此这里按「实际返回条数」递增 offset 循环拉取，直到累计数量达到 total。
 * 同时按 id 去重，避免服务端忽略 offset 时产生重复记录。
 *
 * onChunk 每收到一页就回调一次（携带累计结果），调用方可边收边渲染，
 * 不必等待全部分页请求结束。
 */
async function fetchAllRecipes(
  app: string,
  tokenHash: string,
  params: { search?: string; category?: string; difficulty?: string } = {},
  pageSize = 200,
  onChunk?: (partial: RecipesResponse) => void
): Promise<RecipesResponse> {
  const path = `/admin/snapshots/${encodeURIComponent(app)}/${encodeURIComponent(tokenHash)}/recipes`
  const collected: Recipe[] = []
  const seen = new Set<string>()
  let offset = 0
  let total = Number.POSITIVE_INFINITY
  let facets = { categories: [] as string[], difficulties: [] as string[] }
  let stats = { totalRecipes: 0 }

  const snapshot = (): RecipesResponse => ({
    ok: true,
    total: typeof total === "number" ? total : collected.length,
    limit: collected.length,
    offset: 0,
    recipes: collected,
    facets,
    stats: { totalRecipes: stats.totalRecipes || collected.length },
  })

  // 上限保护：最多 50 页（约 10000 条），避免服务端异常时死循环
  for (let page = 0; page < 50; page++) {
    const res = await request<RecipesResponse>(`${path}${qs({ ...params, limit: pageSize, offset })}`)
    const items = Array.isArray(res.recipes) ? res.recipes : []
    for (const item of items) {
      if (item && item.id && !seen.has(item.id)) {
        seen.add(item.id)
        collected.push(item)
      }
    }
    if (res.facets) facets = res.facets
    if (res.stats) stats = res.stats
    if (typeof res.total === "number") total = res.total
    // 每页到达即回调，让界面边收边渲染
    onChunk?.(snapshot())
    if (!items.length) break
    offset += items.length
    if (collected.length >= total) break
  }

  return snapshot()
}

export const api = {
  overview: () => request<Overview>("/admin/overview"),
  apps: () => request<{ ok: boolean; apps: AppStat[] }>("/admin/apps"),

  snapshots: (params: { app?: string; limit?: number; offset?: number }) =>
    request<SnapshotsResponse>(`/admin/snapshots${qs(params)}`),

  /** 拉取全部快照（自动翻页，onChunk 每页到达即回调） */
  allSnapshots: async (
    params: { app?: string } = {},
    pageSize = 100,
    onChunk?: (partial: SnapshotsResponse) => void
  ): Promise<SnapshotsResponse> => {
    const collected: Snapshot[] = []
    const seen = new Set<string>()
    let offset = 0
    let total = Number.POSITIVE_INFINITY

    const snapshot = (): SnapshotsResponse => ({
      ok: true,
      total: typeof total === "number" ? total : collected.length,
      limit: collected.length,
      offset: 0,
      snapshots: collected,
    })

    for (let page = 0; page < 50; page++) {
      const res = await request<SnapshotsResponse>(`/admin/snapshots${qs({ ...params, limit: pageSize, offset })}`)
      const items = Array.isArray(res.snapshots) ? res.snapshots : []
      for (const item of items) {
        const key = `${item.app}:${item.tokenHash}`
        if (!seen.has(key)) {
          seen.add(key)
          collected.push(item)
        }
      }
      if (typeof res.total === "number") total = res.total
      onChunk?.(snapshot())
      if (!items.length) break
      offset += items.length
      if (collected.length >= total) break
    }
    return snapshot()
  },

  snapshot: (app: string, tokenHash: string) =>
    request<SnapshotDetail>(`/admin/snapshots/${encodeURIComponent(app)}/${encodeURIComponent(tokenHash)}`),

  recipes: (
    app: string,
    tokenHash: string,
    params: { search?: string; category?: string; difficulty?: string; limit?: number; offset?: number }
  ) =>
    request<RecipesResponse>(
      `/admin/snapshots/${encodeURIComponent(app)}/${encodeURIComponent(tokenHash)}/recipes${qs(params)}`
    ),

  /** 拉取某用户快照下的全部食谱（自动翻页，onChunk 每页到达即回调） */
  allRecipes: (
    app: string,
    tokenHash: string,
    params: { search?: string; category?: string; difficulty?: string } = {},
    onChunk?: (partial: RecipesResponse) => void
  ) => fetchAllRecipes(app, tokenHash, params, 200, onChunk),

  createRecipe: (app: string, tokenHash: string, recipe: Partial<Recipe>) =>
    request<{ ok: boolean; recipe: Recipe; updatedAt: string }>(
      `/admin/snapshots/${encodeURIComponent(app)}/${encodeURIComponent(tokenHash)}/recipes`,
      { method: "POST", body: JSON.stringify({ recipe }) }
    ),

  updateRecipe: (app: string, tokenHash: string, recipeId: string, patch: Partial<Recipe>) =>
    request<{ ok: boolean; recipe: Recipe; updatedAt: string }>(
      `/admin/snapshots/${encodeURIComponent(app)}/${encodeURIComponent(tokenHash)}/recipes/${encodeURIComponent(recipeId)}`,
      { method: "PUT", body: JSON.stringify(patch) }
    ),

  deleteRecipe: (app: string, tokenHash: string, recipeId: string) =>
    request<{ ok: boolean; removed: number; updatedAt: string }>(
      `/admin/snapshots/${encodeURIComponent(app)}/${encodeURIComponent(tokenHash)}/recipes/${encodeURIComponent(recipeId)}`,
      { method: "DELETE" }
    ),

  bulkImport: (
    app: string,
    tokenHash: string,
    body: { recipes: Partial<Recipe>[]; mode: "append" | "replace"; dedupe: boolean }
  ) =>
    request<BulkImportResult>(
      `/admin/snapshots/${encodeURIComponent(app)}/${encodeURIComponent(tokenHash)}/recipes/bulk`,
      { method: "POST", body: JSON.stringify(body) }
    ),

  aiParse: (text: string, config: AiConfig) =>
    request<AiParseResult>("/admin/ai/parse", {
      method: "POST",
      body: JSON.stringify({ text, config }),
    }),

  updateSnapshotData: (app: string, tokenHash: string, data: Record<string, unknown>) =>
    request<{ ok: boolean; updatedAt: string }>(
      `/admin/snapshots/${encodeURIComponent(app)}/${encodeURIComponent(tokenHash)}`,
      { method: "PUT", body: JSON.stringify({ data }) }
    ),

  deleteSnapshot: (app: string, tokenHash: string) =>
    request<{ ok: boolean; deleted: number }>(
      `/admin/snapshots/${encodeURIComponent(app)}/${encodeURIComponent(tokenHash)}`,
      { method: "DELETE" }
    ),
}
