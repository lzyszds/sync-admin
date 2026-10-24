import { useState, useMemo } from "react"
import { toast } from "sonner"
import { CheckCircle2, FileCode, HelpCircle, Loader2, UploadCloud, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { api } from "@/lib/api"
import type { Recipe } from "@/lib/types"

const SAMPLE_JSON = `[
  {
    "name": "可乐鸡翅",
    "category": "快手菜",
    "cookTime": 25,
    "difficulty": "easy",
    "description": "色泽红亮，咸甜可口，老少皆宜的经典下饭菜。",
    "ingredients": [
      { "name": "鸡翅中", "amount": "8个" },
      { "name": "可口可乐", "amount": "1罐" },
      { "name": "生姜", "amount": "4片" },
      { "name": "生抽", "amount": "2勺" },
      { "name": "老抽", "amount": "1勺" }
    ],
    "steps": [
      { "order": 1, "description": "鸡翅两面打花刀，冷水下锅加姜片料酒焯水捞出" },
      { "order": 2, "description": "热锅少油，下鸡翅煎至两面金黄微焦" },
      { "order": 3, "description": "倒入可乐、生抽、老抽大火煮沸，转中小火慢炖15分钟" },
      { "order": 4, "description": "大火收汁至汤汁浓稠发亮包裹鸡翅即可出锅" }
    ],
    "tips": "收汁时一定要人在旁边勤翻动，防止可乐糖分焦糊。"
  }
]`

export function BulkImportDialog({
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
  const [mode, setMode] = useState<"append" | "replace">("append")
  const [dedupe, setDedupe] = useState(true)
  const [loading, setLoading] = useState(false)

  // Real-time validation
  const validation = useMemo(() => {
    if (!text.trim()) return null
    try {
      const parsed = JSON.parse(text)
      if (!Array.isArray(parsed)) {
        return { valid: false, message: "必须是一个 JSON 数组 (以 [ 开头)" }
      }
      return { valid: true, count: parsed.length }
    } catch (e) {
      return { valid: false, message: "JSON 格式语法错误" }
    }
  }, [text])

  async function submit() {
    if (!validation?.valid) {
      toast.error(validation?.message || "请输入有效的 JSON 数组")
      return
    }

    setLoading(true)
    try {
      const parsed = JSON.parse(text) as Recipe[]
      const result = await api.bulkImport(app, tokenHash, { recipes: parsed, mode, dedupe })
      toast.success(`批量导入成功：新增 ${result.imported} 道，跳过 ${result.skipped} 道，去重 ${result.duplicates} 道`)
      setText("")
      onOpenChange(false)
      onSaved()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "批量导入失败")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] flex flex-col sm:max-w-2xl rounded-2xl p-6">
        <DialogHeader className="shrink-0">
          <div className="flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <UploadCloud className="size-5" />
            </span>
            <div>
              <DialogTitle className="text-xl font-bold">批量导入食谱数据</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                支持直接粘贴标准 JSON 食谱数组，快速批量录入或迁移食谱库。
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-1 space-y-4 my-2">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="json-input" className="text-xs font-semibold">
                食谱 JSON 数组内容
              </Label>
              <div className="flex items-center gap-2">
                {validation && (
                  <Badge
                    variant="outline"
                    className={`text-[10px] h-5 px-1.5 gap-1 ${
                      validation.valid
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : "border-destructive/30 bg-destructive/10 text-destructive"
                    }`}
                  >
                    {validation.valid ? (
                      <>
                        <CheckCircle2 className="size-3" />
                        有效格式 (包含 {validation.count} 道食谱)
                      </>
                    ) : (
                      <>
                        <XCircle className="size-3" />
                        {validation.message}
                      </>
                    )}
                  </Badge>
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-6 text-[11px] rounded-md px-2"
                  onClick={() => setText(SAMPLE_JSON)}
                >
                  填入示例数据
                </Button>
              </div>
            </div>

            <Textarea
              id="json-input"
              className="min-h-60 text-xs font-mono leading-relaxed rounded-xl resize-none"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="[{ name: '...', category: '...', ingredients: [...], steps: [...] }]"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2 rounded-xl border border-border/80 bg-muted/20 p-3">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">导入模式</Label>
              <Select value={mode} onValueChange={(value) => setMode(value as "append" | "replace")}>
                <SelectTrigger className="h-8.5 text-xs rounded-lg bg-card">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="append">追加导入（保留已有食谱）</SelectItem>
                  <SelectItem value="replace">全量替换（清空现有后导入）</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end pb-1.5">
              <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                <Checkbox checked={dedupe} onCheckedChange={(checked) => setDedupe(Boolean(checked))} />
                <span>自动按 id 及菜谱名称智能去重</span>
              </label>
            </div>
          </div>
        </div>

        <DialogFooter className="shrink-0 flex items-center justify-between sm:justify-between pt-3 border-t border-border/60">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8.5 rounded-xl text-xs"
            onClick={() => onOpenChange(false)}
          >
            取消
          </Button>

          <Button
            type="button"
            size="sm"
            className="h-8.5 rounded-xl food-gradient text-white text-xs gap-1.5 shadow-sm font-medium"
            disabled={loading || !validation?.valid}
            onClick={submit}
          >
            {loading ? <Loader2 className="size-3.5 animate-spin" /> : <UploadCloud className="size-3.5" />}
            {loading ? "正在写入数据库..." : `确认导入 ${validation?.count ?? 0} 道食谱`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
