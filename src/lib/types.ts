export type Difficulty = "easy" | "medium" | "hard"

/** 食材分组：主料 / 辅料 / 调味料（表级强校验结构） */
export type IngredientGroup = "主料" | "辅料" | "调味料"

export interface Ingredient {
  name: string
  amount: string
  /** 所属分组，缺省时按名称与顺序推断 */
  group?: IngredientGroup
}

export interface RecipeStep {
  order: number
  description: string
  /** 客户端勾选状态 */
  done?: boolean
}

export interface Recipe {
  id: string
  name: string
  category: string
  cookTime: number
  difficulty: Difficulty
  description: string
  coverImage: string
  tips: string
  ingredients: Ingredient[]
  steps: RecipeStep[]
  aiGenerated: boolean
  createdAt: string
  updatedAt: string
}

export interface Overview {
  ok: boolean
  service: string
  version: string
  totalSnapshots: number
  totalApps: number
  dataSize: string
  lastUpdated: string | null
}

export interface AppStat {
  app: string
  count: number
  lastUpdated: string | null
  dataSize: string
}

export interface Snapshot {
  app: string
  tokenHash: string
  tokenPrefix: string
  updatedAt: string
  dataBytes: number
  preview?: string
}

export interface SnapshotsResponse {
  ok: boolean
  total: number
  limit: number
  offset: number
  snapshots: Snapshot[]
}

export interface SnapshotDetail {
  ok: boolean
  app: string
  tokenHash: string
  tokenPrefix: string
  updatedAt: string
  dataBytes: number
  data: Record<string, unknown>
}

export interface RecipesResponse {
  ok: boolean
  total: number
  limit: number
  offset: number
  recipes: Recipe[]
  facets: { categories: string[]; difficulties: string[] }
  stats: { totalRecipes: number }
}

export interface BulkImportResult {
  ok: boolean
  mode: string
  imported: number
  skipped: number
  duplicates: number
  total: number
  updatedAt: string
}

export interface AiParseResult {
  ok: boolean
  count: number
  recipes: Recipe[]
}

export interface AiConfig {
  baseUrl: string
  model: string
  apiKey: string
}

/** 平台级字段校验规则 */
export interface ConsoleRule {
  id: string
  /** 归属业务域：食谱 / 笔记 */
  scope: "食谱" | "笔记"
  name: string
  field: string
  type: string
  expression: string
  desc: string
  enabled: boolean
  passedRate: string
}

/** 平台级表结构字段定义 */
export interface ConsoleColumn {
  field: string
  type: string
  constraint: string
  desc: string
}

/** 客户端接入端点 */
export interface ConsoleEndpoint {
  name: string
  method: string
  path: string
  desc: string
  kind: string
}

/** 同步事件日志 */
export interface SyncLog {
  time: string
  event: string
  target: string
  status: number
  latency: string
  size: string
}

/** 随手备忘文件夹（应用侧的分类维度） */
export interface ConsoleFolder {
  id: string
  name: string
  createdAt: string | number
  updatedAt: string | number
  deleted: boolean
}

/**
 * 随手备忘笔记（笔记业务应用）
 *
 * 字段与随手备忘应用（devNotes Desktop）上报的结构对齐：
 *   id / title / content / createdAt / updatedAt / folderId? / tags[]?
 * createdAt / updatedAt 可能是 epoch 毫秒数字，也可能是 ISO 字符串。
 */
export interface ConsoleNote {
  id: string
  title: string
  /** 主标签（tags 的第一项），应用本身没有标签时为空 */
  tag: string
  /** 全部标签 */
  tags: string[]
  /** 笔记类型：idea 灵感 / bug 问题（应用未使用） */
  kind: string
  pinned: boolean
  device: string
  linkedRecipe: string
  /** 所属文件夹 id（应用侧的分类维度） */
  folderId: string
  /** 来源文件路径（应用从本地文件导入的笔记会带这个字段） */
  sourcePath: string
  content: string
  /** 附件数量 */
  attachmentCount: number
  createdAt: string | number
  updatedAt: string | number
  /** 软删除标记 */
  deleted: boolean
}
