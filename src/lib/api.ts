import type {
  AiConfig,
  AiParseResult,
  AppStat,
  BulkImportResult,
  Overview,
  Recipe,
  RecipesResponse,
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

export const api = {
  overview: () => request<Overview>("/admin/overview"),
  apps: () => request<{ ok: boolean; apps: AppStat[] }>("/admin/apps"),

  snapshots: (params: { app?: string; limit?: number; offset?: number }) =>
    request<SnapshotsResponse>(`/admin/snapshots${qs(params)}`),

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
