import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Check, Copy, Download, FileCode, Loader2, Save, Terminal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { api } from "@/lib/api"
import { formatBytes, formatDate } from "@/lib/format"
import type { Snapshot } from "@/lib/types"

interface Props {
  snapshot: Snapshot | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved?: () => void
}

export function GenericSnapshotDialog({ snapshot, open, onOpenChange, onSaved }: Props) {
  const [jsonText, setJsonText] = useState("")
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!open || !snapshot) return
    let alive = true
    setLoading(true)
    api
      .snapshot(snapshot.app, snapshot.tokenHash)
      .then((res) => {
        if (!alive) return
        setJsonText(JSON.stringify(res.data, null, 2))
      })
      .catch((err) => {
        toast.error(err instanceof Error ? err.message : "获取快照数据失败")
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [open, snapshot])

  async function handleSave() {
    if (!snapshot) return
    let parsed: Record<string, unknown>
    try {
      parsed = JSON.parse(jsonText)
    } catch {
      toast.error("JSON 格式错误，请检查语法")
      return
    }

    setSaving(true)
    try {
      await api.updateSnapshotData(snapshot.app, snapshot.tokenHash, parsed)
      toast.success("快照数据已成功保存更新")
      onOpenChange(false)
      onSaved?.()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "保存快照数据失败")
    } finally {
      setSaving(false)
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(jsonText)
    setCopied(true)
    toast.success("JSON 已复制到剪贴板")
    setTimeout(() => setCopied(false), 2000)
  }

  function handleDownload() {
    if (!snapshot) return
    const blob = new Blob([jsonText], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `snapshot_${snapshot.app}_${snapshot.tokenPrefix}_${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.success("已导出 JSON 文件")
  }

  if (!snapshot) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] flex flex-col sm:max-w-4xl rounded-2xl p-6">
        <DialogHeader className="shrink-0">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <FileCode className="size-4" />
              </span>
              <div>
                <DialogTitle className="text-lg font-bold">全量快照数据透视与编辑</DialogTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="font-mono text-xs">
                    app: {snapshot.app}
                  </Badge>
                  <span className="text-xs font-mono text-muted-foreground">
                    token: {snapshot.tokenPrefix}…
                  </span>
                  <span className="text-xs text-muted-foreground">
                    体积: {formatBytes(snapshot.dataBytes)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                className="h-8 rounded-lg text-xs"
                onClick={handleCopy}
                disabled={loading || !jsonText}
              >
                {copied ? <Check className="size-3.5 mr-1 text-emerald-500" /> : <Copy className="size-3.5 mr-1" />}
                {copied ? "已复制" : "复制"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 rounded-lg text-xs"
                onClick={handleDownload}
                disabled={loading || !jsonText}
              >
                <Download className="size-3.5 mr-1" />
                导出
              </Button>
            </div>
          </div>
          <DialogDescription className="text-xs text-muted-foreground pt-1">
            此快照包含此端用户的完整同步 payload。在此直接修改将实时同步覆盖云端数据库。
          </DialogDescription>
        </DialogHeader>

        <div className="relative flex-1 min-h-0 my-3">
          {loading ? (
            <div className="flex h-96 items-center justify-center rounded-xl border border-border/80 bg-muted/20">
              <div className="flex flex-col items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-6 animate-spin text-primary" />
                <span>正在加载整份快照数据...</span>
              </div>
            </div>
          ) : (
            <Textarea
              className="h-96 w-full resize-none font-mono text-xs leading-relaxed rounded-xl bg-muted/30 border-border/80 focus-visible:ring-primary/20"
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              placeholder="{}"
            />
          )}
        </div>

        <DialogFooter className="shrink-0 flex items-center justify-between sm:justify-between pt-2 border-t border-border/60">
          <div className="text-[11px] text-muted-foreground">
            最后更新于 {formatDate(snapshot.updatedAt)}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl"
              onClick={() => onOpenChange(false)}
            >
              取消
            </Button>
            <Button
              size="sm"
              className="rounded-xl food-gradient text-white shadow-sm"
              disabled={loading || saving}
              onClick={handleSave}
            >
              {saving ? <Loader2 className="size-4 animate-spin mr-1" /> : <Save className="size-4 mr-1" />}
              {saving ? "保存中..." : "保存数据更新"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
