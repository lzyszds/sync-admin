import { useCallback, useEffect, useMemo, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { toast } from "sonner"
import { Link2, Trash2 } from "lucide-react"
import { ConsoleIconButton, ConsoleWorkspace } from "@/components/layout/console-workspace"
import { ConsoleList, ConsoleListCard, ConsoleNav, ConsoleNavItem } from "@/components/layout/console-columns"
import { RefreshButton } from "@/components/layout/load-progress"
import { api } from "@/lib/api"
import { useConsole } from "@/lib/console-store"
import { DEMO_NOTES, NOTE_KIND_LABEL, denormalizeNote, normalizeNote, renderNoteMarkdown } from "@/lib/console-data"
import { formatDate } from "@/lib/format"
import { useCachedData } from "@/lib/use-cached-data"
import type { ConsoleNote } from "@/lib/types"

export default function Notes() {
  const params = useParams()
  const app = params.app || "notes"
  const { snapshots, online, recipes } = useConsole()

  const [search, setSearch] = useState("")
  const [tag, setTag] = useState("全部")
  const [selectedId, setSelectedId] = useState<string>(DEMO_NOTES[0]?.id || "")

  const tokenHash = params.tokenHash || snapshots.find((s) => s.app === app)?.tokenHash || ""

  const load = useCallback(async () => {
    if (tokenHash && online) {
      const res = await api.snapshot(app, tokenHash)
      const raw = (res.data as Record<string, unknown>)?.notes
      if (!Array.isArray(raw) || raw.length === 0) throw new Error("无笔记数据")
      return raw.map((item, index) => normalizeNote(item, index))
    }
    // 演示模式：本地预置笔记
    return DEMO_NOTES
  }, [app, tokenHash, online])

  // 缓存：切换路由命中缓存不重新请求，增删改或手动刷新才重新拉取
  // 依赖 online：后端连接状态变化时（离线演示 → 在线真实数据）需要重新拉取
  const cacheKey = `notes:${app}:${tokenHash}:${online ? "live" : "demo"}`
  const {
    data: notes,
    loading,
    refresh,
    setData: setCachedNotes,
  } = useCachedData<ConsoleNote[]>(cacheKey, load, {
    enabled: !!tokenHash,
    deps: [online],
    // 演示兜底数据不写入缓存，避免污染真实数据缓存
    cacheable: online,
  })

  const allNotes = useMemo(() => notes ?? [], [notes])

  // 有效笔记（过滤手机端软删除），侧栏标签与计数全部由真实数据聚合
  const visibleNotes = useMemo(() => allNotes.filter((n) => !n.deleted), [allNotes])

  // 侧栏分类：取自真实笔记的标签并按出现频次排序，而不是写死的演示常量
  const tagOptions = useMemo(() => {
    const counter = new Map<string, number>()
    for (const n of visibleNotes) {
      for (const t of n.tags) counter.set(t, (counter.get(t) || 0) + 1)
    }
    return Array.from(counter.entries())
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([t]) => t)
  }, [visibleNotes])

  const filtered = useMemo(() => {
    let list = visibleNotes.filter((n) => (tag === "全部" ? true : n.tags.includes(tag)))
    if (search.trim()) {
      const key = search.trim().toLowerCase()
      list = list.filter((n) => `${n.title} ${n.content} ${n.tags.join(" ")}`.toLowerCase().includes(key))
    }
    return list
  }, [visibleNotes, tag, search])

  const active = visibleNotes.find((n) => n.id === selectedId) || filtered[0] || null

  function linkedRecipeName(id: string) {
    const hit = recipes.find((r) => r.id === id)
    return hit ? `${hit.name}（${hit.id}）` : id
  }

  function updateNote(patch: Partial<ConsoleNote>) {
    if (!active) return
    setCachedNotes((prev) => (prev ?? []).map((n) => (n.id === active.id ? { ...n, ...patch } : n)))
  }

  async function persist() {
    if (!online || !tokenHash) return
    try {
      const detail = await api.snapshot(app, tokenHash)
      const data = (detail.data || {}) as Record<string, unknown>
      const remote = Array.isArray(data.notes) ? (data.notes as unknown[]) : []
      const remoteById = new Map<string, unknown>()
      for (const item of remote) {
        const id = String((item as Record<string, unknown>)?.id || "")
        if (id) remoteById.set(id, item)
      }
      // 还原成手机端结构后再写回，避免丢失 attachments / kind / createdAt 等字段
      const payload = allNotes.map((n) => denormalizeNote(n, remoteById.get(n.id)))
      await api.updateSnapshotData(app, tokenHash, { ...data, notes: payload })
      toast.success("笔记已写入云端并同步至各端")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "写入失败")
    }
  }

  function removeNote() {
    if (!active) return
    setCachedNotes((prev) => (prev ?? []).filter((n) => n.id !== active.id))
    void persist()
    toast.success("笔记已删除")
  }

  return (
    <ConsoleWorkspace
      breadcrumb={`笔记表 / ${tag === "全部" ? "全部云笔记" : tag}${active ? ` / ${active.title}` : ""}`}
      headerRight={
        <>
          <RefreshButton onClick={() => void refresh()} loading={loading} />
          <ConsoleIconButton title="删除当前笔记" onClick={removeNote} disabled={!active}>
            <Trash2 className="w-3.5 h-3.5" />
          </ConsoleIconButton>
        </>
      }
      nav={
        <ConsoleNav title="云笔记" footerLabel="当前数据表" footerValue="笔记表">
          <ConsoleNavItem
            active={tag === "全部"}
            label="全部云笔记"
            count={visibleNotes.length}
            onClick={() => setTag("全部")}
          />
          {tagOptions.map((t) => (
            <ConsoleNavItem
              key={t}
              active={tag === t}
              label={t}
              count={visibleNotes.filter((n) => n.tags.includes(t)).length}
              onClick={() => setTag(t)}
            />
          ))}
        </ConsoleNav>
      }
      list={
        <ConsoleList
          search={search}
          onSearch={setSearch}
          placeholder="搜索标题、正文、标签..."
          countText={`共 ${filtered.length} 条笔记${filtered.length !== visibleNotes.length ? ` / 全量 ${visibleNotes.length} 条` : ""}`}
          items={filtered}
          loading={loading}
          loadingText="正在加载笔记..."
          emptyText="暂无匹配的笔记"
          estimateHeight={72}
          renderItem={(n: ConsoleNote) => (
            <ConsoleListCard
              active={n.id === active?.id}
              onClick={() => setSelectedId(n.id)}
              title={`${n.pinned ? "📌 " : ""}${n.title}`}
              description={n.content.replace(/[#*`>-]/g, "").trim()}
              trailing={n.device}
              dotColor={n.pinned ? "#FACC15" : "#C9C9C4"}
            />
          )}
        />
      }
      footerLeft={active ? `最后修改：${formatDate(active.updatedAt)} · 来源：${active.device}` : "暂无记录"}
      footerRight={active?.linkedRecipe ? `关联食谱：${active.linkedRecipe}` : "未关联食谱"}
    >
      {active ? (
        <div className="w-full space-y-4 console-fade-up">
          {/* 信息条 */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-craft-line/70 pb-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="font-mono text-[11px] text-craft-muted">{active.id}</span>
              <select
                value={active.tag}
                onChange={(e) => {
                  const next = e.target.value
                  updateNote({ tag: next, tags: [next, ...active.tags.filter((t) => t !== next)] })
                }}
                className="bg-craft-list border border-craft-line rounded-lg px-2 py-1 text-xs text-craft-ink focus:outline-none"
              >
                {/* 选项来自真实笔记的标签；当前标签若不在其中也补上，避免选中态丢失 */}
                {Array.from(new Set([active.tag, ...tagOptions])).map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <span className="text-[11px] text-craft-muted">
                {NOTE_KIND_LABEL[active.kind] ? `${NOTE_KIND_LABEL[active.kind]} · ` : ""}
                {active.attachmentCount > 0 ? `${active.attachmentCount} 附件 · ` : ""}
                {active.pinned ? "已置顶 · " : ""}
                {active.device}
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[11px] text-craft-muted">关联食谱</span>
              <select
                value={active.linkedRecipe}
                onChange={(e) => updateNote({ linkedRecipe: e.target.value })}
                className="bg-craft-list border border-craft-line rounded-lg px-2 py-1 text-xs text-craft-ink focus:outline-none"
              >
                <option value="">未关联</option>
                {recipes.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}（{r.id}）
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 标题 */}
          <input
            type="text"
            value={active.title}
            onChange={(e) => updateNote({ title: e.target.value })}
            placeholder="笔记标题"
            className="w-full bg-transparent border border-transparent hover:border-craft-line focus:border-craft-ink rounded-lg px-2 py-1.5 text-xl font-bold text-craft-ink focus:outline-none transition"
          />

          {/* 关联提示 */}
          {active.linkedRecipe && (
            <div className="border border-blue-200 bg-blue-50/60 dark:border-blue-900 dark:bg-blue-950/30 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <Link2 className="w-4 h-4 text-blue-600 shrink-0" />
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-craft-ink">
                    已跨表关联：{linkedRecipeName(active.linkedRecipe)}
                  </div>
                  <div className="text-[11px] text-craft-muted truncate">
                    该笔记与食谱表记录保持联动，可在食谱模块中反查。
                  </div>
                </div>
              </div>
              <Link
                to="/recipes/recipe"
                className="text-[11px] px-2.5 py-1 rounded-lg bg-blue-600/10 text-blue-700 hover:bg-blue-600/20 transition shrink-0"
              >
                跳转食谱表 →
              </Link>
            </div>
          )}

          {/* 编辑器 + 预览 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="flex flex-col">
              <span className="text-[11px] text-craft-muted mb-1.5">轻量标记源码编辑器</span>
              <textarea
                value={active.content}
                onChange={(e) => updateNote({ content: e.target.value })}
                onBlur={() => void persist()}
                className="w-full h-[420px] bg-craft-list border border-craft-line focus:border-craft-ink rounded-xl p-3.5 text-xs leading-relaxed text-craft-ink focus:outline-none resize-none"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] text-craft-muted mb-1.5">客户端实时渲染预览</span>
              <div className="selectable h-[420px] bg-craft-list border border-craft-line rounded-xl p-3.5 text-xs leading-relaxed text-craft-ink overflow-y-auto">
                <div dangerouslySetInnerHTML={{ __html: renderNoteMarkdown(active.content) }} />
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-xs text-craft-muted">请在左侧选择或新建一篇笔记</div>
      )}
    </ConsoleWorkspace>
  )
}
