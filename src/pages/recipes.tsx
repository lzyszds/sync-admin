import { useCallback, useEffect, useMemo, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { toast } from "sonner"
import { ChevronLeft, ChevronRight, Pencil, Plus, Sparkles, Trash2, UploadCloud, FileJson } from "lucide-react"
import { ConsoleIconButton, ConsoleViewTabs, ConsoleWorkspace } from "@/components/layout/console-workspace"
import { ConsoleList, ConsoleListCard, ConsoleNav, ConsoleNavItem } from "@/components/layout/console-columns"
import { RefreshButton } from "@/components/layout/load-progress"
import { RecipeFormDialog } from "@/components/recipes/recipe-form-dialog"
import { AiImportDialog } from "@/components/recipes/ai-import-dialog"
import { BulkImportDialog } from "@/components/recipes/bulk-import-dialog"
import { RawJsonDialog } from "@/components/recipes/raw-json-dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { api } from "@/lib/api"
import { useConsole } from "@/lib/console-store"
import {
  CONSOLE_RULES,
  CONSOLE_SCHEMAS,
  DIFFICULTY_LABEL,
  GROUP_STYLE,
  difficultyDot,
  demoRecipes,
  groupIngredients,
  toConsolePayload,
} from "@/lib/console-data"
import { formatDate } from "@/lib/format"
import { useCachedData } from "@/lib/use-cached-data"
import { dedupe } from "@/lib/data-cache"
import type { Difficulty, IngredientGroup, Recipe } from "@/lib/types"

const VIEW_OPTIONS = [
  { value: "detail", label: "详情" },
  { value: "grid", label: "表格" },
  { value: "source", label: "源码" },
  { value: "rules", label: "规则" },
]

export default function Recipes() {
  const params = useParams()
  const navigate = useNavigate()
  const app = params.app || "recipe"
  const { snapshots, online } = useConsole()

  const [totalState, setTotal] = useState(0)
  const [facets, setFacets] = useState<{ categories: string[]; difficulties: string[] }>({
    categories: [],
    difficulties: [],
  })
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("全部")
  const [difficulty, setDifficulty] = useState<"全部" | "简单" | "中等" | "进阶">("全部")
  const [view, setView] = useState("detail")
  const [selectedId, setSelectedId] = useState<string>("")
  const [recipeTab, setRecipeTab] = useState<"visual" | "raw">("visual")
  const [sortAsc, setSortAsc] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Recipe | null>(null)
  const [deleting, setDeleting] = useState<Recipe | null>(null)
  const [bulkOpen, setBulkOpen] = useState(false)
  const [aiOpen, setAiOpen] = useState(false)
  const [rawOpen, setRawOpen] = useState(false)

  // 未指定用户令牌时，自动选取该应用下的首个快照
  const tokenHash =
    params.tokenHash || snapshots.find((s) => s.app === app)?.tokenHash || ""

  // 该应用下的全部租户快照（用于切换查看不同用户的食谱）
  const tenants = useMemo(() => snapshots.filter((s) => s.app === app), [snapshots, app])

  const load = useCallback(
    async (onChunk?: (chunk: Recipe[]) => void) => {
      if (tokenHash && online) {
        // 全量食谱（服务端 limit 有上限，自动翻页）；每页到达即回调，边收边渲染
        // 与全局 store 共享同一份请求，避免重复拉取
        const res = await dedupe(`recipes:${app}:${tokenHash}:live`, () =>
          api.allRecipes(app, tokenHash, {}, (partial) => {
            onChunk?.(partial.recipes)
            setFacets(partial.facets)
            setTotal(partial.total)
          })
        )
        return res.recipes
      }
      // 演示模式：本地预置食谱（不写入缓存，避免污染真实数据缓存）
      const list = demoRecipes()
      onChunk?.(list)
      return list
    },
    [app, tokenHash, online]
  )

  // 缓存 + 边收边渲染：切换路由命中缓存不重新请求
  // 依赖 online：后端连接状态变化时（离线演示 → 在线真实数据）需要重新拉取
  const cacheKey = `recipes:${app}:${tokenHash}:${online ? "live" : "demo"}`
  const {
    data: recipes,
    loading,
    loaded,
    total: loadedTotal,
    refresh,
    setData: setCachedRecipes,
  } = useCachedData<Recipe[]>(cacheKey, async (onChunk) => load(onChunk), {
    enabled: !!tokenHash,
    deps: [online],
    // 演示兜底数据不写入缓存，避免污染真实数据缓存
    cacheable: online,
  })

  // 首次进入时 total 可能还是 0，用本地累加值兜底
  const total = useMemo(() => Math.max(totalState, loadedTotal, recipes?.length || 0), [totalState, loadedTotal, recipes])

  // 搜索 / 分类 / 难度均在已拉取的全量数据上本地过滤
  const allRecipes = useMemo(() => recipes ?? [], [recipes])
  const filtered = useMemo(() => {
    let list = allRecipes
    if (category !== "全部") list = list.filter((r) => r.category === category)
    if (difficulty !== "全部") list = list.filter((r) => DIFFICULTY_LABEL[r.difficulty] === difficulty)
    if (search.trim()) {
      const key = search.trim().toLowerCase()
      list = list.filter((r) =>
        `${r.name} ${r.description} ${r.category} ${JSON.stringify(r.ingredients)}`.toLowerCase().includes(key),
      )
    }
    return list
  }, [allRecipes, category, difficulty, search])

  // 默认选中第一条
  useEffect(() => {
    if (!filtered.length) return
    if (!filtered.some((r) => r.id === selectedId)) setSelectedId(filtered[0].id)
  }, [filtered, selectedId])

  // 分类列表：优先用服务端返回的全量分面，避免只统计到当前页
  const categories = useMemo(() => {
    const set = new Set<string>()
    if (online && facets.categories.length) facets.categories.forEach((c) => c && set.add(c))
    allRecipes.forEach((r) => r.category && set.add(r.category))
    return ["全部", ...Array.from(set)]
  }, [allRecipes, facets, online])

  const selected = filtered.find((r) => r.id === selectedId) || filtered[0] || null
  const sorted = useMemo(() => (sortAsc ? [...filtered].reverse() : filtered), [filtered, sortAsc])
  // 整表视图（表格 / 源码）始终展示全量数据，不受列表筛选影响
  const sortedAll = useMemo(() => (sortAsc ? [...allRecipes].reverse() : allRecipes), [allRecipes, sortAsc])

  async function confirmDelete() {
    if (!deleting) return
    try {
      if (online && tokenHash) await api.deleteRecipe(app, tokenHash, deleting.id)
      // 增删改后同步更新缓存，无需重新请求
      setCachedRecipes((prev) => (prev ?? []).filter((r) => r.id !== deleting.id))
      setTotal((v) => Math.max(0, v - 1))
      toast.success("食谱已删除并同步至各端")
      setDeleting(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "删除失败")
    }
  }

  function toggleStep(recipe: Recipe, index: number) {
    setCachedRecipes((prev) =>
      (prev ?? []).map((r) =>
        r.id === recipe.id
          ? { ...r, steps: r.steps.map((s, i) => (i === index ? { ...s, done: !s.done } : s)) }
          : r,
      ),
    )
  }

  const groups = selected ? groupIngredients(selected.ingredients) : null
  const ingCount = groups ? Object.values(groups).reduce((sum, list) => sum + list.length, 0) : 0

  return (
    <ConsoleWorkspace
      breadcrumb={`食谱表 / ${category === "全部" ? "全部食谱" : category}${view === "detail" && selected ? ` / ${selected.name}` : ""}`}
      headerRight={
        <>
          {tenants.length > 1 && (
            <Select value={tokenHash} onValueChange={(v) => navigate(`/recipes/${app}/${v}`)}>
              <SelectTrigger className="h-7 w-[190px] text-xs rounded-lg bg-craft-list border-craft-line">
                <SelectValue placeholder="选择租户" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {tenants.map((s) => (
                  <SelectItem key={s.tokenHash} value={s.tokenHash} className="text-xs">
                    {s.tokenPrefix} · {formatDate(s.updatedAt).slice(0, 10)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <ConsoleViewTabs value={view} options={VIEW_OPTIONS} onChange={setView} />
          <RefreshButton onClick={() => void refresh()} loading={loading} />
          <ConsoleIconButton title="录入新食谱" onClick={() => { setEditing(null); setFormOpen(true) }}>
            <Plus className="w-3.5 h-3.5" />
          </ConsoleIconButton>
        </>
      }
      nav={
        <ConsoleNav title="食谱库" onNew={() => { setEditing(null); setFormOpen(true) }} footerLabel="当前数据表" footerValue="食谱表">
          {categories.map((cat) => (
            <ConsoleNavItem
              key={cat}
              active={category === cat}
              label={cat === "全部" ? "全部食谱" : cat}
              count={cat === "全部" ? allRecipes.length : allRecipes.filter((r) => r.category === cat).length}
              onClick={() => setCategory(cat)}
            />
          ))}
        </ConsoleNav>
      }
      list={
        <ConsoleList
          search={search}
          onSearch={setSearch}
          placeholder="搜索菜名、配料、描述..."
          onNew={() => { setEditing(null); setFormOpen(true) }}
          countText={`共 ${filtered.length} 条食谱${total > filtered.length ? ` / 全量 ${total} 条` : ""}`}
          sortIndicator={sortAsc ? "↑↓" : "↓↑"}
          onSort={() => setSortAsc((v) => !v)}
          items={sorted}
          loading={loading}
          loadingText="正在加载食谱..."
          loaded={loaded}
          total={total}
          emptyText="暂无匹配的食谱"
          estimateHeight={72}
          renderItem={(r: Recipe) => (
            <ConsoleListCard
              active={r.id === selected?.id}
              onClick={() => { setSelectedId(r.id); setRecipeTab("visual"); setView("detail") }}
              title={r.name}
              description={r.description}
              trailing={`${r.cookTime}分钟`}
              dotColor={difficultyDot(r.difficulty)}
            />
          )}
          extra={
            <div className="flex items-center gap-1">
              <span className="text-[11px] text-craft-muted mr-1">难度</span>
              {(["全部", "简单", "中等", "进阶"] as const).map((d) => (
                <button
                  key={d}
                  onClick={() => setDifficulty(d)}
                  className={`px-2 py-0.5 rounded text-[11px] border transition ${
                    difficulty === d
                      ? "bg-craft-ink text-white border-craft-ink"
                      : "bg-white border-craft-line text-craft-muted hover:text-craft-ink"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          }
        />
      }
      footerLeft={selected ? `最后修改：${formatDate(selected.updatedAt)} · 同步状态：已同步` : "暂无记录"}
      footerRight={selected ? `共 ${ingCount} 项食材 · ${selected.steps.length} 道步骤 · 耗时 ${selected.cookTime} 分钟` : ""}
    >
      {view === "detail" &&
        (selected && groups ? (
          <div className="w-full space-y-8 console-fade-up">
            {/* 记录信息条 */}
            <div className="flex items-center justify-between gap-3 border-b border-craft-line/70 pb-3">
              <div className="flex items-center gap-2.5 text-[11px] text-craft-muted min-w-0">
                <span className="font-mono text-craft-ink">{selected.id}</span>
                <span>|</span>
                <span>{selected.coverImage ? "含封面图" : "无封面图"}</span>
                <span className="flex items-center gap-1 text-emerald-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />已同步
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <div className="bg-craft-list border border-craft-line rounded-lg p-0.5 flex text-[11px]">
                  <button
                    onClick={() => setRecipeTab("visual")}
                    className={`px-2 py-0.5 rounded ${recipeTab === "visual" ? "bg-craft-ink text-white" : "text-craft-muted"}`}
                  >
                    详情拆解
                  </button>
                  <button
                    onClick={() => setRecipeTab("raw")}
                    className={`px-2 py-0.5 rounded ${recipeTab === "raw" ? "bg-craft-ink text-white" : "text-craft-muted"}`}
                  >
                    单条数据
                  </button>
                </div>
                <ConsoleIconButton title="编辑该食谱" onClick={() => { setEditing(selected); setFormOpen(true) }}>
                  <Pencil className="w-3.5 h-3.5" />
                </ConsoleIconButton>
                <ConsoleIconButton title="删除该食谱" onClick={() => setDeleting(selected)}>
                  <Trash2 className="w-3.5 h-3.5" />
                </ConsoleIconButton>
              </div>
            </div>

            {recipeTab === "raw" ? (
              <div className="w-full">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-craft-muted">单条数据源码（{selected.id}）</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(JSON.stringify(toConsolePayload(selected), null, 2))
                      toast.success("已复制该食谱的标准结构")
                    }}
                    className="text-[11px] px-2.5 py-1 rounded-lg border border-craft-line hover:bg-craft-list transition"
                  >
                    复制数据
                  </button>
                </div>
                <pre className="selectable border border-craft-line rounded-2xl bg-craft-list p-4 text-xs leading-relaxed overflow-x-auto">
                  {JSON.stringify(toConsolePayload(selected), null, 2)}
                </pre>
              </div>
            ) : (
              <>
                {/* 标题区 */}
                <div>
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded bg-craft-sidebar text-craft-muted text-xs">{selected.category}</span>
                    <span
                      className="px-2 py-0.5 rounded text-xs border"
                      style={{
                        color: DIFFICULTY_LABEL[selected.difficulty] === "简单" ? "#047857" : DIFFICULTY_LABEL[selected.difficulty] === "中等" ? "#B45309" : "#BE123C",
                        background: DIFFICULTY_LABEL[selected.difficulty] === "简单" ? "#ECFDF5" : DIFFICULTY_LABEL[selected.difficulty] === "中等" ? "#FFFBEB" : "#FFF1F2",
                        borderColor: "transparent",
                      }}
                    >
                      难度：{DIFFICULTY_LABEL[selected.difficulty]}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-craft-sidebar text-craft-muted text-xs">{selected.cookTime} 分钟</span>
                  </div>
                  <h1 className="text-3xl font-bold tracking-tight text-craft-ink">{selected.name}</h1>
                  <p className="text-sm text-craft-muted mt-2.5 leading-relaxed">{selected.description}</p>
                </div>

                {/* 食材三分组 */}
                <div className="space-y-5">
                  <h2 className="text-xl font-bold text-craft-ink">食材清单</h2>
                  {(["主料", "辅料", "调味料"] as IngredientGroup[]).map((group) => (
                    <div key={group} className="border-l-2 pl-3.5" style={{ borderColor: GROUP_STYLE[group].color }}>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-bold" style={{ color: GROUP_STYLE[group].color }}>
                          {GROUP_STYLE[group].icon} {GROUP_STYLE[group].label}
                        </h3>
                        <span className="text-[11px] text-craft-muted">{groups[group].length} 项</span>
                      </div>
                      <table className="notion-table">
                        <thead>
                          <tr>
                            <th className="w-2/5">食材名称</th>
                            <th className="w-1/5">精确用量</th>
                            <th className="w-2/5">用途说明</th>
                          </tr>
                        </thead>
                        <tbody>
                          {groups[group].map((item, index) => (
                            <tr key={`${group}-${index}-${item.name}`}>
                              <td className="font-medium">{item.name}</td>
                              <td className="font-mono text-xs" style={{ color: GROUP_STYLE[group].color }}>
                                {item.amount}
                              </td>
                              <td className="text-craft-muted">{GROUP_STYLE[group].label.split("（")[1]?.replace("）", "") || "标准配比"}</td>
                            </tr>
                          ))}
                          {groups[group].length === 0 && (
                            <tr>
                              <td colSpan={3} className="text-craft-muted">该分组暂无食材</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  ))}
                </div>

                {/* 烹饪步骤 */}
                <div>
                  <h2 className="text-xl font-bold text-craft-ink mb-3">烹饪步骤</h2>
                  <div className="space-y-2.5">
                    {selected.steps.map((step, index) => (
                      <label
                        key={index}
                        onClick={() => toggleStep(selected, index)}
                        className="flex items-start gap-3 cursor-pointer group"
                      >
                        <input
                          type="checkbox"
                          checked={Boolean(step.done)}
                          readOnly
                          className="mt-0.5 w-4 h-4 accent-neutral-900 rounded cursor-pointer shrink-0"
                        />
                        <span className={`text-sm leading-relaxed ${step.done ? "line-through text-craft-muted" : "text-craft-ink"}`}>
                          <span className="font-mono text-[11px] text-craft-muted mr-1.5">
                            {String(index + 1).padStart(2, "0")}
                          </span>
                          {step.description}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* 小贴士 */}
                {selected.tips && (
                  <div className="border-l-2 border-craft-ink pl-3.5 py-0.5">
                    <div className="text-xs font-semibold text-craft-ink mb-1">烹饪小贴士</div>
                    <p className="text-xs text-craft-muted leading-relaxed">{selected.tips}</p>
                  </div>
                )}

                {/* 快捷操作 */}
                <div className="flex flex-wrap items-center gap-2 pt-2">
                  <button
                    onClick={() => setAiOpen(true)}
                    className="px-3 py-1.5 rounded-lg border border-craft-line text-xs hover:bg-craft-list transition flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5" /> 智能结构化导入
                  </button>
                  <button
                    onClick={() => setBulkOpen(true)}
                    className="px-3 py-1.5 rounded-lg border border-craft-line text-xs hover:bg-craft-list transition flex items-center gap-1.5"
                  >
                    <UploadCloud className="w-3.5 h-3.5" /> 批量导入
                  </button>
                  <button
                    onClick={() => setRawOpen(true)}
                    className="px-3 py-1.5 rounded-lg border border-craft-line text-xs hover:bg-craft-list transition flex items-center gap-1.5"
                  >
                    <FileJson className="w-3.5 h-3.5" /> 全量数据
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="text-xs text-craft-muted">请在左侧选择一条食谱</div>
        ))}

      {view === "grid" && (
        <div className="w-full console-fade-up">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-craft-ink">食谱表整表视图</h2>
              <p className="text-xs text-craft-muted mt-0.5">检视底层表中的全部食谱记录，点击任意行可进入详情</p>
            </div>
            <button
              onClick={() => { setEditing(null); setFormOpen(true) }}
              className="bg-craft-ink text-white text-xs px-3 py-1.5 rounded-lg hover:bg-neutral-800 transition"
            >
              + 新增食谱行
            </button>
          </div>
          <div className="border border-craft-line rounded-2xl overflow-x-auto">
            <table className="dense-table dense-table-fixed">
              <colgroup>
                <col style={{ width: "92px" }} />
                <col style={{ width: "112px" }} />
                <col style={{ width: "88px" }} />
                <col style={{ width: "70px" }} />
                <col style={{ width: "78px" }} />
                <col />
                <col style={{ width: "84px" }} />
                <col style={{ width: "104px" }} />
                <col style={{ width: "116px" }} />
              </colgroup>
              <thead>
                <tr>
                  <th>编号</th>
                  <th>名称</th>
                  <th>分类</th>
                  <th>难度</th>
                  <th>时长</th>
                  <th>主料</th>
                  <th>同步状态</th>
                  <th>更新时间</th>
                  <th className="text-right">操作</th>
                </tr>
              </thead>
              <tbody>
                {sortedAll.map((r) => (
                  <tr key={r.id} className="cursor-pointer" onClick={() => { setSelectedId(r.id); setView("detail") }}>
                    <td className="nowrap font-mono text-[11px] text-craft-muted">{r.id}</td>
                    <td className="nowrap font-semibold text-craft-ink">{r.name}</td>
                    <td className="nowrap">{r.category}</td>
                    <td className="nowrap">{DIFFICULTY_LABEL[r.difficulty]}</td>
                    <td className="nowrap text-amber-700">{r.cookTime} 分钟</td>
                    <td className="truncate-cell text-amber-800">
                      {groupIngredients(r.ingredients).主料.map((i) => `${i.name}${i.amount}`).join("、")}
                    </td>
                    <td className="nowrap">
                      <span className="inline-flex items-center gap-1.5 text-[11px] text-emerald-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />已同步
                      </span>
                    </td>
                    <td className="nowrap text-craft-muted text-[11px]">{formatDate(r.updatedAt).slice(0, 16)}</td>
                    <td className="nowrap text-right">
                      <button
                        onClick={(e) => { e.stopPropagation(); setEditing(r); setFormOpen(true) }}
                        className="px-2 py-1 rounded border border-craft-line hover:bg-craft-ink hover:text-white transition"
                      >
                        编辑
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setDeleting(r) }}
                        className="px-2 py-1 rounded border border-craft-line hover:bg-rose-700 hover:text-white transition"
                      >
                        删除
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {view === "source" && (
        <div className="w-full console-fade-up">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-craft-ink">食谱表数据源码</h2>
              <p className="text-xs text-craft-muted mt-0.5">标准结构化负载，可直接用于多端下发与备份</p>
            </div>
            <button
              onClick={() => {
                const payload = {
                  数据表: "食谱表",
                  结构版本: "2.4.0",
                  记录总数: allRecipes.length,
                  记录: allRecipes.map(toConsolePayload),
                }
                navigator.clipboard.writeText(JSON.stringify(payload, null, 2))
                toast.success("已复制全部食谱结构化源码")
              }}
              className="text-xs px-3 py-1.5 rounded-lg border border-craft-line hover:bg-craft-list transition"
            >
              复制完整源码
            </button>
          </div>
          <pre className="selectable border border-craft-line rounded-2xl bg-craft-list p-5 text-xs leading-relaxed overflow-x-auto max-h-[calc(100vh-300px)]">
            {JSON.stringify(
              {
                数据表: "食谱表",
                结构版本: "2.4.0",
                记录总数: allRecipes.length,
                记录: allRecipes.map(toConsolePayload),
              },
              null,
              2,
            )}
          </pre>
        </div>
      )}

      {view === "rules" && (
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-5 console-fade-up">
          <div className="lg:col-span-7 space-y-3.5">
            <div>
              <h2 className="text-xl font-bold text-craft-ink">食谱表字段约束与业务逻辑</h2>
              <p className="text-xs text-craft-muted mt-0.5">
                控制移动端与后台写入时的字段校验、食材分组规范与同步触发器
              </p>
            </div>
            {CONSOLE_RULES.filter((r) => r.scope === "食谱").map((rule) => (
              <RuleCard key={rule.id} rule={rule} />
            ))}
          </div>
          <div className="lg:col-span-5">
            <StructurePanel title="食谱表" />
          </div>
        </div>
      )}

      <RecipeFormDialog
        app={app}
        tokenHash={tokenHash}
        open={formOpen}
        onOpenChange={setFormOpen}
        recipe={editing}
        onSaved={() => {
          // 增删改后失效缓存并重新拉取
          void refresh()
          toast.success("食谱已保存并同步至各端")
        }}
      />
      <BulkImportDialog app={app} tokenHash={tokenHash} open={bulkOpen} onOpenChange={setBulkOpen} onSaved={() => void refresh()} />
      <AiImportDialog app={app} tokenHash={tokenHash} open={aiOpen} onOpenChange={setAiOpen} onSaved={() => void refresh()} />
      <RawJsonDialog app={app} tokenHash={tokenHash} open={rawOpen} onOpenChange={setRawOpen} onSaved={() => void refresh()} />

      <AlertDialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg">确认删除「{deleting?.name}」？</AlertDialogTitle>
            <AlertDialogDescription className="text-xs leading-relaxed">
              即将从当前用户租户的食谱数据表中永久移除该记录，删除后将同步移除至各端。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl text-xs">取消</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90 text-xs"
              onClick={confirmDelete}
            >
              确认删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ConsoleWorkspace>
  )
}

/** 规则卡片（可展开查看表达式） */
export function RuleCard({ rule }: { rule: (typeof CONSOLE_RULES)[number] }) {
  return (
    <div className="border border-craft-line rounded-2xl p-4 bg-background">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1.5 flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2 py-0.5 rounded text-[11px] bg-craft-sidebar text-craft-muted">{rule.type}</span>
            <span className="font-bold text-sm text-craft-ink">{rule.name}</span>
          </div>
          <p className="text-xs text-craft-muted">{rule.desc}</p>
          <div className="text-[11px] text-craft-muted">
            作用字段：<span className="text-craft-ink">{rule.field}</span>
          </div>
          <div className="selectable bg-craft-list border border-craft-line rounded-lg px-2.5 py-1.5 text-[11px] text-craft-ink break-all">
            {rule.expression}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          <span className="w-11 h-6 rounded-full bg-craft-ink p-0.5 flex justify-end">
            <span className="w-5 h-5 rounded-full bg-white" />
          </span>
          <span className="text-[11px] text-craft-muted">
            通过率 <span className="text-emerald-700 font-medium">{rule.passedRate}</span>
          </span>
        </div>
      </div>
    </div>
  )
}

/** 表结构定义面板 */
export function StructurePanel({ title }: { title: string }) {
  const cols = CONSOLE_SCHEMAS[title] || []
  return (
    <div className="border border-craft-line rounded-2xl overflow-hidden bg-background">
      <div className="px-4 py-3 border-b border-craft-line bg-craft-list flex items-center justify-between">
        <span className="text-xs font-bold text-craft-ink">表结构 · {title}</span>
        <span className="text-[11px] text-craft-muted">{cols.length} 个字段</span>
      </div>
      <table className="dense-table dense-table-fixed">
        <colgroup>
          <col style={{ width: "64px" }} />
          <col style={{ width: "80px" }} />
          <col />
        </colgroup>
        <thead>
          <tr>
            <th>字段</th>
            <th>类型</th>
            <th>约束与说明</th>
          </tr>
        </thead>
        <tbody>
          {cols.map((col) => (
            <tr key={col.field}>
              <td className="nowrap font-semibold text-craft-ink">{col.field}</td>
              <td className="nowrap text-craft-muted">{col.type}</td>
              <td className="text-craft-muted">
                {col.constraint}
                <div className="text-[11px] mt-0.5 opacity-70">{col.desc}</div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
