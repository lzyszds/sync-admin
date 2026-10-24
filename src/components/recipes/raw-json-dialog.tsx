import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Check, Copy, Download, FileCode, Loader2, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { api } from "@/lib/api"

export function RawJsonDialog({
  app,
  tokenHash,
  open,
  onOpenChange,
  onSaved,
}: {
  app: string
  tokenHash: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved: () => void
}) {
  const [text, setText] = useState("")
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!open) return
    let alive = true
    setLoading(true)
    api
      .snapshot(app, tokenHash)
      .then((res) => {
        if (!alive) return
        setText(JSON.stringify(res.data, null, 2))
      })
      .catch((err) => toast.error(err instanceof Error ? err.message : "读取快照失败"))
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [open, app, tokenHash])

  async function save() {
    try {
      const data = JSON.parse(text)
      setSaving(true)
      await api.updateSnapshotData(app, tokenHash, data)
      toast.success("快照数据已更新写入")
      onOpenChange(false)
      onSaved()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "保存失败，请检查 JSON 语法")
    } finally {
      setSaving(false)
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(text)
    setCopied(true)
    toast.success("JSON 已复制到剪贴板")
    setTimeout(() => setCopied(false), 2000)
  }

  function handleDownload() {
    const blob = new Blob([text], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `snapshot_${app}_${tokenHash.slice(0, 8)}_${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.success("已导出快照文件")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] flex flex-col sm:max-w-3xl rounded-2xl p-6">
        <DialogHeader className="shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <FileCode className="size-4" />
              </span>
              <div>
                <DialogTitle className="text-lg font-bold">高级全量快照 JSON 编辑</DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  应用: {app} · 用户 Token: {tokenHash.slice(0, 10)}…（直接编辑底层 JSON）
                </DialogDescription>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                className="h-8 rounded-lg text-xs"
                onClick={handleCopy}
                disabled={loading || !text}
              >
                {copied ? <Check className="size-3.5 mr-1 text-emerald-500" /> : <Copy className="size-3.5 mr-1" />}
                {copied ? "已复制" : "复制"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 rounded-lg text-xs"
                onClick={handleDownload}
                disabled={loading || !text}
              >
                <Download className="size-3.5 mr-1" />
                导出
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="relative flex-1 min-h-0 my-3">
          {loading ? (
            <div className="flex h-96 items-center justify-center rounded-xl border border-border/80 bg-muted/20">
              <div className="flex flex-col items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="size-5 animate-spin text-primary" />
                <span>正在加载数据...</span>
              </div>
            </div>
          ) : (
            <Textarea
              className="h-96 w-full resize-none font-mono text-xs leading-relaxed rounded-xl bg-muted/30 border-border/80 focus-visible:ring-primary/20"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="{}"
            />
          )}
        </div>

        <DialogFooter className="shrink-0 flex items-center justify-between sm:justify-between pt-2 border-t border-border/60">
          <span className="text-[11px] text-muted-foreground">
            注意：直接修改将覆盖此用户端在云端的整份快照数据。
          </span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="rounded-xl text-xs" onClick={() => onOpenChange(false)}>
              取消
            </Button>
            <Button
              size="sm"
              className="rounded-xl food-gradient text-white text-xs shadow-sm font-medium"
              onClick={save}
              disabled={loading || saving || !text.trim()}
            >
              {saving ? <Loader2 className="size-4 animate-spin mr-1" /> : <Save className="size-4 mr-1" />}
              {saving ? "保存中..." : "保存更新"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
