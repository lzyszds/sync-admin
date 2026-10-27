import { useCallback, useEffect, useMemo, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { toast } from "sonner"
import { Link2, Trash2 } from "lucide-react"
import { ConsoleIconButton, ConsoleWorkspace } from "@/components/layout/console-workspace"
import { ConsoleList, ConsoleListCard, ConsoleNav, ConsoleNavItem } from "@/components/layout/console-columns"
import { RefreshButton } from "@/components/layout/load-progress"
import { api } from "@/lib/api"
import { useConsole } from "@/lib/console-context"
import { DEMO_NOTES, denormalizeNote, extractNotesPayload, normalizeFolder, normalizeNote, renderNoteMarkdown } from "@/lib/console-data"
import { formatDate } from "@/lib/format"
import { useCachedData } from "@/lib/use-cached-data"
import type { ConsoleFolder, ConsoleNote } from "@/lib/types"

/** 预览区最多渲染的正文长度（应用里存在几十万字的长笔记，全量渲染会卡死页面） */
const PREVIEW_LIMIT = 20000

export default function Notes() {
  const params = useParams()
  const app = params.app || "notes"
  const { snapshots, online, recipes } = useConsole()

  const [search, setSearch] = useState("")
  const [folderId, setFolderId] = useState("全部")
  const [selectedId, setSelectedId] = useState<string>("")

  // 仅在连上后端后才从快照列表解析令牌：
  // 快照列表加载完成前用的是演示数据里的假令牌，会白发一次 404
  const tokenHash =
    params.tokenHash || (online ? snapshots.find((s) => s.app === app)?.tokenHash || "" : "")

  const load = useCallback(async () => {
    if (tokenHash && online) {
      const res = await api.snapshot(app, tokenHash)
      // 真实负载在 data.data.notes（应用上报结构），不能读顶层 data.notes
      const payload = extractNotesPayload(res.data)
      if (!payload || !payload.notes.length) throw new Error("无笔记数据")
      return {
        notes: payload.notes.map((item, index) => normalizeNote(item, index)),
        folders: payload.folders.map((item, index) => normalizeFolder(item, index)),
        activeId: payload.activeId,
        deviceInfo: payload.deviceInfo,
      }
    }
    // 演示模式：本地预置笔记
    return {
      notes: DEMO_NOTES,
      folders: [] as ConsoleFolder[],
      activeId: "",
      deviceInfo: "",
    }
  }, [app, tokenHash, online])

  // 缓存：切换路由命中缓存不重新请求，增删改或手动刷新才重新拉取
  // 依赖 online：后端连接状态变化时（离线演示 → 在线真实数据）需要重新拉取
  const cacheKey = `notes:${app}:${tokenHash}:${online ? "live" : "demo"}`
  const {
    data,
    loading,
    refresh,
    setData: setCachedNotes,
  } = useCachedData<{ notes: ConsoleNote[]; folders: ConsoleFolder[]; activeId: string; deviceInfo: string }>(
    cacheKey,
    load,
    {
      enabled: !!tokenHash,
      deps: [online],
      // 演示兜底数据不写入缓存，避免污染真实数据缓存
      cacheable: online,
    }
  )

  const allNotes = useMemo(() => {
    if (data) return data.notes
    // 后端不可达时回落到演示数据
    return online ? [] : DEMO_NOTES
  }, [data, online])
  const allFolders = useMemo(() => data?.folders ?? [], [data])
  const deviceInfo = data?.deviceInfo ?? ""

  // 有效笔记（过滤软删除）
  const visibleNotes = useMemo(() => allNotes.filter((n) => !n.deleted), [allNotes])

  // 侧栏分类：应用侧的「文件夹」，取自真实快照数据
  const folderOptions = useMemo(
    () => allFolders.filter((f) => !f.deleted),
    [allFolders]
  )

  const filtered = useMemo(() => {
    let list = visibleNotes
    if (folderId !== "全部") list = list.filter((n) => n.folderId === folderId)
    if (search.trim()) {
      const key = search.trim().toLowerCase()
      list = list.filter((n) => `${n.title} ${n.content}`.toLowerCase().includes(key))
    }
    return list
  }, [visibleNotes, folderId, search])

  const active = visibleNotes.find((n) => n.id === selectedId) || filtered[0] || null

  function linkedRecipeName(id: string) {
    const hit = recipes.find((r) => r.id === id)
    return hit ? `${hit.name}（${hit.id}）` : id
  }

  function updateNote(patch: Partial<ConsoleNote>) {
    if (!active) return
    setCachedNotes((prev) =>
      prev
        ? { ...prev, notes: prev.notes.map((n) => (n.id === active.id ? { ...n, ...patch } : n)) }
        : prev
    )
  }

  async function persist() {
    // 只有真实数据才写回，绝不把演示兜底数据写到服务器
    if (!online || !tokenHash || !data) return
    try {
      const detail = await api.snapshot(app, tokenHash)
      const root = (detail.data || {}) as Record<string, unknown>

      // 定位应用负载所在位置：data.data（嵌套）或 data（扁平）
      let appPayload = root.data
      let nested = false
      if (typeof appPayload === "string") {
        try {
          appPayload = JSON.parse(appPayload)
        } catch {
          appPayload = null
        }
      }
      if (!appPayload || typeof appPayload !== "object" || !Array.isArray((appPayload as Record<string, unknown>).notes)) {
        appPayload = root
        nested = false
      } else {
        nested = true
      }
      const payload = appPayload as Record<string, unknown>

      const remote = Array.isArray(payload.notes) ? (payload.notes as unknown[]) : []
      const remoteById = new Map<string, unknown>()
      for (const item of remote) {
        const id = String((item as Record<string, unknown>)?.id || "")
        if (id) remoteById.set(id, item)
      }

      // 还原成应用结构后再写回，避免丢失 sourceMtime / attachments 等字段
      const nextNotes = allNotes.map((n) => denormalizeNote(n, remoteById.get(n.id)))
      const nextPayload = { ...payload, notes: nextNotes }
      const nextRoot = nested ? { ...root, data: nextPayload } : nextPayload

      await api.updateSnapshotData(app, tokenHash, nextRoot)
      toast.success("笔记已写入云端并同步至各端")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "写入失败")
    }
  }

  function removeNote() {
    if (!active) return
    setCachedNotes((prev) =>
      prev ? { ...prev, notes: prev.notes.filter((n) => n.id !== active.id) } : prev
    )
    void persist()
    toast.success("笔记已删除")
  }

  return (
    <ConsoleWorkspace
      breadcrumb={`笔记表 / ${folderId === "全部" ? "全部云笔记" : (folderOptions.find((f) => f.id === folderId)?.name ?? "文件夹")}${active ? ` / ${active.title}` : ""}`}
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
            active={folderId === "全部"}
            label="全部云笔记"
            count={visibleNotes.length}
            onClick={() => setFolderId("全部")}
          />
          {folderOptions.map((f) => (
            <ConsoleNavItem
              key={f.id}
              active={folderId === f.id}
              label={f.name}
              count={visibleNotes.filter((n) => n.folderId === f.id).length}
              onClick={() => setFolderId(f.id)}
            />
          ))}
        </ConsoleNav>
      }
      list={
        <ConsoleList
          search={search}
          onSearch={setSearch}
          placeholder="搜索标题、正文..."
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
      footerLeft={
        active
          ? `最后修改：${formatDate(active.updatedAt)}${active.device || deviceInfo ? ` · 来源：${active.device || deviceInfo}` : ""}`
          : "暂无记录"
      }
      footerRight={active?.linkedRecipe ? `关联食谱：${active.linkedRecipe}` : "未关联食谱"}
    >
      {active ? (
        <div className="w-full space-y-4 console-fade-up">
          {/* 信息条 */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-craft-line/70 pb-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="font-mono text-[11px] text-craft-muted">{active.id}</span>
              <select
                value={active.folderId}
                onChange={(e) => updateNote({ folderId: e.target.value })}
                onBlur={() => void persist()}
                className="bg-craft-list border border-craft-line rounded-lg px-2 py-1 text-xs text-craft-ink focus:outline-none"
              >
                <option value="">未归档</option>
                {folderOptions.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
              <span className="text-[11px] text-craft-muted">
                {active.attachmentCount > 0 ? `${active.attachmentCount} 附件 · ` : ""}
                {active.device || deviceInfo}
                {active.sourcePath ? ` · ${active.sourcePath}` : ""}
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
            onBlur={() => void persist()}
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
                {/* 超长笔记（应用里存在几十万字的长文）全量渲染会卡死页面，这里截断预览 */}
                <div dangerouslySetInnerHTML={{ __html: renderNoteMarkdown(active.content.slice(0, PREVIEW_LIMIT)) }} />
                {active.content.length > PREVIEW_LIMIT && (
                  <div className="mt-3 rounded-lg border border-dashed border-craft-line px-3 py-2 text-[11px] text-craft-muted">
                    正文共 {active.content.length.toLocaleString("zh-CN")} 字，预览仅展示前 {PREVIEW_LIMIT.toLocaleString("zh-CN")} 字，
                    完整内容请在左侧源码编辑器中查看。
                  </div>
                )}
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
