import { useCallback, useEffect, useMemo, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { toast } from "sonner"
import { Link2, Trash2 } from "lucide-react"
import { ConsoleIconButton, ConsoleWorkspace } from "@/components/layout/console-workspace"
import { ConsoleList, ConsoleListCard, ConsoleNav, ConsoleNavItem } from "@/components/layout/console-columns"
import { api } from "@/lib/api"
import { useConsole } from "@/lib/console-store"
import { DEMO_NOTES, NOTE_TAGS, renderNoteMarkdown } from "@/lib/console-data"
import { formatDate } from "@/lib/format"
import type { ConsoleNote } from "@/lib/types"

export default function Notes() {
  const params = useParams()
  const app = params.app || "notes"
  const { snapshots, online, recipes } = useConsole()

  const [notes, setNotes] = useState<ConsoleNote[]>(DEMO_NOTES)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [tag, setTag] = useState("全部")
  const [selectedId, setSelectedId] = useState<string>(DEMO_NOTES[0]?.id || "")

  const tokenHash = params.tokenHash || snapshots.find((s) => s.app === app)?.tokenHash || ""

  const load = useCallback(async () => {
    setLoading(true)
    try {
      if (!tokenHash || !online) throw new Error("演示模式")
      const res = await api.snapshot(app, tokenHash)
      const raw = (res.data as Record<string, unknown>)?.notes
      if (!Array.isArray(raw) || raw.length === 0) throw new Error("无笔记数据")
      setNotes(
        raw.map((item, index) => {
          const obj = (item || {}) as Record<string, unknown>
          return {
            id: String(obj.id || obj.编号 || `笔记-${201 + index}`),
            title: String(obj.title || obj.标题 || "未命名笔记"),
            tag: String(obj.tag || obj.标签 || NOTE_TAGS[0]),
            pinned: Boolean(obj.pinned || obj.置顶),
            device: String(obj.device || obj.来源设备 || "桌面网页"),
            linkedRecipe: String(obj.linkedRecipe || obj.关联食谱 || ""),
            content: String(obj.content || obj.内容 || ""),
            updatedAt: String(obj.updatedAt || obj.更新时间 || ""),
          } satisfies ConsoleNote
        }),
      )
    } catch {
      setNotes(DEMO_NOTES)
    } finally {
      setLoading(false)
    }
  }, [app, tokenHash, online])

  useEffect(() => {
    void load()
  }, [load])

  const filtered = useMemo(() => {
    let list = notes.filter((n) => (tag === "全部" ? true : n.tag === tag))
    if (search.trim()) {
      const key = search.trim().toLowerCase()
      list = list.filter((n) => `${n.title} ${n.content} ${n.tag}`.toLowerCase().includes(key))
    }
    return list
  }, [notes, tag, search])

  const active = notes.find((n) => n.id === selectedId) || filtered[0] || null

  function linkedRecipeName(id: string) {
    const hit = recipes.find((r) => r.id === id)
    return hit ? `${hit.name}（${hit.id}）` : id
  }

  function updateNote(patch: Partial<ConsoleNote>) {
    if (!active) return
    setNotes((prev) => prev.map((n) => (n.id === active.id ? { ...n, ...patch } : n)))
  }

  async function persist() {
    if (!online || !tokenHash) return
    try {
      const detail = await api.snapshot(app, tokenHash)
      const data = (detail.data || {}) as Record<string, unknown>
      await api.updateSnapshotData(app, tokenHash, { ...data, notes })
      toast.success("笔记已写入云端并同步至各端")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "写入失败")
    }
  }

  function removeNote() {
    if (!active) return
    setNotes((prev) => prev.filter((n) => n.id !== active.id))
    toast.success("笔记已删除")
  }

  return (
    <ConsoleWorkspace
      breadcrumb={`笔记表 / ${tag === "全部" ? "全部云笔记" : tag}${active ? ` / ${active.title}` : ""}`}
      headerRight={
        <ConsoleIconButton title="删除当前笔记" onClick={removeNote} disabled={!active}>
          <Trash2 className="w-3.5 h-3.5" />
        </ConsoleIconButton>
      }
      nav={
        <ConsoleNav title="云笔记" footerLabel="当前数据表" footerValue="笔记表">
          {["全部", ...NOTE_TAGS].map((t) => (
            <ConsoleNavItem
              key={t}
              active={tag === t}
              label={t === "全部" ? "全部云笔记" : t}
              count={t === "全部" ? notes.length : notes.filter((n) => n.tag === t).length}
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
          countText={`共 ${filtered.length} 条笔记`}
        >
          {loading ? (
            <div className="py-12 text-center text-xs text-craft-muted">加载中...</div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-xs text-craft-muted">暂无匹配的笔记</div>
          ) : (
            filtered.map((n) => (
              <ConsoleListCard
                key={n.id}
                active={n.id === active?.id}
                onClick={() => setSelectedId(n.id)}
                title={`${n.pinned ? "📌 " : ""}${n.title}`}
                description={n.content.replace(/[#*`>-]/g, "").trim()}
                trailing={n.device}
                dotColor={n.pinned ? "#FACC15" : "#C9C9C4"}
              />
            ))
          )}
        </ConsoleList>
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
                onChange={(e) => updateNote({ tag: e.target.value })}
                className="bg-craft-list border border-craft-line rounded-lg px-2 py-1 text-xs text-craft-ink focus:outline-none"
              >
                {NOTE_TAGS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <span className="text-[11px] text-craft-muted">
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
