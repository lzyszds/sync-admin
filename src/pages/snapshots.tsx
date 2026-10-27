import { useCallback, useEffect, useMemo, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { toast } from "sonner"
import { Copy, FileJson, Trash2 } from "lucide-react"
import { ConsoleIconButton, ConsoleWorkspace } from "@/components/layout/console-workspace"
import { ConsoleList, ConsoleListCard, ConsoleNav, ConsoleNavItem } from "@/components/layout/console-columns"
import { GenericSnapshotDialog } from "@/components/snapshots/generic-snapshot-dialog"
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
import { api } from "@/lib/api"
import { useConsole } from "@/lib/console-context"
import { formatBytes, formatDate } from "@/lib/format"
import type { Snapshot } from "@/lib/types"

const APP_LABEL: Record<string, string> = {
  recipe: "食谱业务中台（萌厨食光）",
  notes: "随手备忘（便签数据）",
  custom: "自定义业务租户",
}

export default function Snapshots() {
  const params = useParams()
  const { apps, snapshots, online, refresh } = useConsole()

  const [appFilter, setAppFilter] = useState<string>(params.app || "全部")
  const [search, setSearch] = useState("")
  const [selected, setSelected] = useState<Snapshot | null>(null)
  const [detail, setDetail] = useState<Record<string, unknown> | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [editing, setEditing] = useState(false)
  const [deleting, setDeleting] = useState<Snapshot | null>(null)

  const appOptions = useMemo(() => ["全部", ...apps.map((a) => a.app)], [apps])

  const filtered = useMemo(() => {
    let list = snapshots.filter((s) => (appFilter === "全部" ? true : s.app === appFilter))
    if (search.trim()) {
      const key = search.trim().toLowerCase()
      list = list.filter((s) => `${s.app} ${s.tokenPrefix} ${s.tokenHash}`.toLowerCase().includes(key))
    }
    return list
  }, [snapshots, appFilter, search])

  useEffect(() => {
    if (!filtered.length) {
      setSelected(null)
      return
    }
    if (!filtered.some((s) => s.tokenHash === selected?.tokenHash)) setSelected(filtered[0])
  }, [filtered, selected])

  const loadDetail = useCallback(async () => {
    if (!selected) return
    setLoadingDetail(true)
    try {
      if (!online) throw new Error("演示模式")
      const res = await api.snapshot(selected.app, selected.tokenHash)
      setDetail(res.data || {})
    } catch {
      // 演示模式：展示快照预览片段
      setDetail({ 快照摘要: selected.preview || "暂无预览", 用户令牌: selected.tokenHash, 所属应用: selected.app })
    } finally {
      setLoadingDetail(false)
    }
  }, [selected, online])

  useEffect(() => {
    void loadDetail()
  }, [loadDetail])

  async function confirmDelete() {
    if (!deleting) return
    try {
      if (online) await api.deleteSnapshot(deleting.app, deleting.tokenHash)
      toast.success("快照已删除")
      setDeleting(null)
      await refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "删除失败")
    }
  }

  function copyToken(prefix: string) {
    navigator.clipboard.writeText(prefix)
    toast.success("令牌前缀已复制")
  }

  return (
    <ConsoleWorkspace
      breadcrumb={`快照库 / ${appFilter === "全部" ? "全部应用租户" : APP_LABEL[appFilter] || appFilter}`}
      headerRight={
        selected && (
          <>
            <ConsoleIconButton title="编辑原始数据" onClick={() => setEditing(true)}>
              <FileJson className="w-3.5 h-3.5" />
            </ConsoleIconButton>
            <ConsoleIconButton title="删除该快照" onClick={() => setDeleting(selected)}>
              <Trash2 className="w-3.5 h-3.5" />
            </ConsoleIconButton>
          </>
        )
      }
      nav={
        <ConsoleNav title="应用租户" footerLabel="当前视图" footerValue={appFilter === "全部" ? "全部租户" : appFilter}>
          {appOptions.map((opt) => (
            <ConsoleNavItem
              key={opt}
              active={appFilter === opt}
              label={opt === "全部" ? "全部应用租户" : APP_LABEL[opt] || opt}
              count={
                opt === "全部"
                  ? snapshots.length
                  : snapshots.filter((s) => s.app === opt).length
              }
              onClick={() => setAppFilter(opt)}
            />
          ))}
        </ConsoleNav>
      }
      list={
        <ConsoleList
          search={search}
          onSearch={setSearch}
          placeholder="搜索应用代号或令牌..."
          countText={`共 ${filtered.length} 份快照`}
          items={filtered}
          emptyText="暂无匹配的快照"
          estimateHeight={72}
          renderItem={(s: Snapshot) => (
            <ConsoleListCard
              active={s.tokenHash === selected?.tokenHash && s.app === selected?.app}
              onClick={() => setSelected(s)}
              title={`${s.app} · ${s.tokenPrefix}`}
              description={formatDate(s.updatedAt)}
              trailing={formatBytes(s.dataBytes)}
              dotColor={s.app === "recipe" ? "#F97316" : s.app === "notes" ? "#8B5CF6" : "#10B981"}
            />
          )}
        />
      }
      footerLeft={selected ? `快照：${selected.app} / ${selected.tokenPrefix} · ${formatBytes(selected.dataBytes)}` : "暂无快照"}
      footerRight={selected ? `最近同步：${formatDate(selected.updatedAt)}` : ""}
    >
      {selected ? (
        <div className="w-full space-y-6 console-fade-up">
          {/* 快照元信息 */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            {[
              { label: "所属应用", value: selected.app, sub: APP_LABEL[selected.app] || "自定义业务租户" },
              { label: "用户令牌", value: selected.tokenPrefix, sub: selected.tokenHash },
              { label: "数据体积", value: formatBytes(selected.dataBytes), sub: "该用户全量云同步数据" },
              { label: "最近同步", value: formatDate(selected.updatedAt), sub: "客户端推送时间" },
            ].map((card) => (
              <div key={card.label} className="border border-craft-line rounded-2xl p-4 bg-background">
                <div className="text-[11px] text-craft-muted">{card.label}</div>
                <div className="text-lg font-bold text-craft-ink mt-1 truncate">{card.value}</div>
                <div className="text-[11px] text-craft-muted mt-1 truncate flex items-center gap-1">
                  {card.label === "用户令牌" && (
                    <button onClick={() => copyToken(selected.tokenPrefix)} className="hover:text-craft-ink transition">
                      <Copy className="w-3 h-3 inline" />
                    </button>
                  )}
                  {card.sub}
                </div>
              </div>
            ))}
          </div>

          {/* 业务入口 */}
          <div className="flex flex-wrap items-center gap-2">
            <Link
              to={`/recipes/${selected.app}`}
              className="px-3 py-1.5 rounded-lg bg-craft-ink text-white text-xs hover:bg-neutral-800 transition"
            >
              进入该租户的业务数据
            </Link>
            <button
              onClick={() => setEditing(true)}
              className="px-3 py-1.5 rounded-lg border border-craft-line text-xs hover:bg-craft-list transition"
            >
              编辑原始数据
            </button>
          </div>

          {/* 原始负载透视 */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold text-craft-ink">原始数据透视</h2>
              <span className="text-[11px] text-craft-muted">
                {loadingDetail ? "读取中..." : "客户端推送上来的全量负载"}
              </span>
            </div>
            <pre className="selectable border border-craft-line rounded-2xl bg-craft-list p-5 text-xs leading-relaxed overflow-x-auto max-h-[calc(100vh-420px)]">
              {detail ? JSON.stringify(detail, null, 2) : "暂无数据"}
            </pre>
          </div>
        </div>
      ) : (
        <div className="text-xs text-craft-muted">请在左侧选择一份快照</div>
      )}

      {selected && (
        <GenericSnapshotDialog
          snapshot={selected}
          open={editing}
          onOpenChange={setEditing}
          onSaved={() => {
            void loadDetail()
            void refresh()
          }}
        />
      )}

      <AlertDialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg">确认删除该份快照？</AlertDialogTitle>
            <AlertDialogDescription className="text-xs leading-relaxed">
              将永久移除 {deleting?.app} 应用下该用户的全量云同步数据，删除后不可恢复。
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
