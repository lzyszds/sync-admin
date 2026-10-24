import { useState } from "react"
import { toast } from "sonner"
import {
  ChefHat,
  Clock,
  Eye,
  Flame,
  HelpCircle,
  Loader2,
  Sparkles,
  Tag,
  Trash2,
  UploadCloud,
  Utensils,
  Wand2,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { api } from "@/lib/api"
import { loadAiConfig, saveAiConfig } from "@/lib/ai-config"
import { difficultyLabels } from "@/lib/format"
import type { AiConfig, Recipe } from "@/lib/types"

const SAMPLES = [
  {
    title: "番茄炒蛋 (家常菜)",
    text: "番茄炒蛋：准备番茄2个、鸡蛋3个、大葱1根。调料准备盐1小勺、生抽1勺、白糖半勺、食用油适量。\n步骤：\n1. 番茄洗净切滚刀块，大葱切碎，鸡蛋磕入碗中加少许盐打散至起泡。\n2. 热锅凉油，油热倒入蛋液滑散翻炒至凝固盛出备用。\n3. 锅中再倒少许油下葱花炒香，放入番茄块大火翻炒出浓郁汤汁。\n4. 倒入炒好的鸡蛋翻炒均匀，加入少许盐和半勺白糖提鲜，大火翻炒收汁即可出锅。",
  },
  {
    title: "简易可乐鸡翅 (快手菜)",
    text: "可乐鸡翅：准备鸡翅中8个、可乐1听(330ml)、姜片5片、生抽2勺、老抽半勺、料酒1勺。\n制作步骤：\n1. 鸡翅两面划两刀，冷水下锅加入料酒焯水捞出沥干水分。\n2. 热锅倒少许油，下鸡翅煎至两面金黄微焦。\n3. 放入姜片爆香，倒入生抽和老抽翻炒上色。\n4. 倒入可乐没过鸡翅，大火烧开转中火慢炖15分钟，最后大火收汁至酱汁浓稠包裹鸡翅。",
  },
]

export function AiImportDialog({
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
  const [config, setConfig] = useState<AiConfig>(() => loadAiConfig())
  const [parsed, setParsed] = useState<Recipe[] | null>(null)
  const [parsing, setParsing] = useState(false)
  const [importing, setImporting] = useState(false)

  async function parse() {
    if (!text.trim()) {
      toast.error("请输入需要解析的菜谱文本")
      return
    }
    if (!config.apiKey.trim()) {
      toast.error("请先填写 AI API Key 密钥")
      return
    }
    saveAiConfig(config)
    setParsing(true)
    setParsed(null)
    try {
      const result = await api.aiParse(text, config)
      setParsed(result.recipes)
      toast.success(`AI 解析成功，识别出 ${result.count} 道食谱`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "AI 解析失败，请检查模型配置或 API Key")
    } finally {
      setParsing(false)
    }
  }

  async function importRecipes() {
    if (!parsed || parsed.length === 0) return
    setImporting(true)
    try {
      const result = await api.bulkImport(app, tokenHash, { recipes: parsed, mode: "append", dedupe: true })
      toast.success(`导入成功：新增 ${result.imported} 道食谱，去重 ${result.duplicates} 条`)
      setText("")
      setParsed(null)
      onOpenChange(false)
      onSaved()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "导入数据库失败")
    } finally {
      setImporting(false)
    }
  }

  function removeParsedRecipe(index: number) {
    if (!parsed) return
    const next = parsed.filter((_, i) => i !== index)
    setParsed(next.length ? next : null)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] flex flex-col sm:max-w-3xl rounded-2xl p-6">
        <DialogHeader className="shrink-0">
          <div className="flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400">
              <Sparkles className="size-5" />
            </span>
            <div>
              <DialogTitle className="text-xl font-bold">AI 智能食谱解析导入</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                支持自由文本、小红书/美食博主菜谱文字，由大模型自动提取名称、分类、食材剂量与步骤。
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-1 space-y-4 my-2">
          {/* 原文输入区 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="ai-text" className="text-xs font-semibold">
                粘贴菜谱原文
              </Label>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-muted-foreground">填充示例:</span>
                {SAMPLES.map((sample, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setText(sample.text)}
                    className="rounded-md border border-border/60 bg-muted/40 px-2 py-0.5 text-[11px] font-medium text-foreground hover:bg-orange-500/10 hover:text-orange-600 transition-colors"
                  >
                    {sample.title}
                  </button>
                ))}
              </div>
            </div>

            <Textarea
              id="ai-text"
              className="min-h-36 text-xs leading-relaxed rounded-xl font-mono"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="直接粘贴含有菜名、食材配料和制作过程的文字即可..."
            />
          </div>

          {/* 解析模型快捷配置 */}
          <div className="rounded-xl border border-border/80 bg-muted/20 p-3 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
              <span>调用模型参数</span>
              <span className="font-mono text-[10px] text-muted-foreground/80">{config.baseUrl}</span>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <Input
                placeholder="模型名称 (如 Qwen/Qwen2.5-7B-Instruct)"
                className="h-8.5 text-xs rounded-lg font-mono bg-card"
                value={config.model}
                onChange={(e) => setConfig((prev) => ({ ...prev, model: e.target.value }))}
              />
              <Input
                type="password"
                placeholder="API Key (sk-...)"
                className="h-8.5 text-xs rounded-lg font-mono bg-card"
                value={config.apiKey}
                onChange={(e) => setConfig((prev) => ({ ...prev, apiKey: e.target.value }))}
              />
            </div>
          </div>

          {/* 解析结果确认区 */}
          {parsed && parsed.length > 0 && (
            <div className="space-y-3 pt-2 border-t border-border/60">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-foreground">AI 解析结果预览</span>
                  <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs">
                    识别出 {parsed.length} 道菜品
                  </Badge>
                </div>
                <span className="text-[11px] text-muted-foreground">核对无误后点击下方「导入数据库」</span>
              </div>

              <div className="space-y-3">
                {parsed.map((r, i) => (
                  <div
                    key={i}
                    className="rounded-xl border border-orange-500/25 bg-card p-4 shadow-2xs space-y-2.5"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <span className="flex size-6 items-center justify-center rounded-lg food-gradient text-white text-xs font-bold">
                          {i + 1}
                        </span>
                        <h4 className="font-bold text-sm text-foreground">{r.name}</h4>
                        <Badge variant="secondary" className="text-xs">
                          {r.category || "家常菜"}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          <Clock className="size-3 mr-1" /> {r.cookTime} 分钟
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          <Flame className="size-3 mr-1" /> {difficultyLabels[r.difficulty] || r.difficulty}
                        </Badge>
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-7 text-muted-foreground hover:text-destructive"
                        onClick={() => removeParsedRecipe(i)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>

                    {r.description && (
                      <p className="text-xs text-muted-foreground italic">“ {r.description} ”</p>
                    )}

                    {/* 食材小卡片 */}
                    <div className="rounded-lg bg-muted/40 p-2">
                      <div className="text-[11px] font-semibold text-muted-foreground mb-1">食材 ({r.ingredients.length}):</div>
                      <div className="flex flex-wrap gap-1.5">
                        {r.ingredients.map((ing, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 rounded bg-card px-2 py-0.5 text-xs border border-border/60"
                          >
                            <span className="font-medium">{ing.name}</span>
                            <span className="text-muted-foreground font-mono text-[10px]">{ing.amount}</span>
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* 步骤概览 */}
                    <div className="text-xs space-y-1">
                      <div className="text-[11px] font-semibold text-muted-foreground">步骤 ({r.steps.length}):</div>
                      {r.steps.slice(0, 3).map((s) => (
                        <div key={s.order} className="flex gap-2 text-muted-foreground">
                          <span className="font-mono text-foreground font-semibold">{s.order}.</span>
                          <span className="truncate">{s.description}</span>
                        </div>
                      ))}
                      {r.steps.length > 3 && (
                        <div className="text-[11px] text-muted-foreground pl-4">
                          ...还有 {r.steps.length - 3} 个步骤
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
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

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8.5 rounded-xl text-xs gap-1.5"
              disabled={parsing || !text.trim()}
              onClick={parse}
            >
              {parsing ? <Loader2 className="size-3.5 animate-spin" /> : <Wand2 className="size-3.5 text-orange-500" />}
              {parsing ? "AI 解析中..." : "开始 AI 结构化解析"}
            </Button>

            {parsed && parsed.length > 0 && (
              <Button
                type="button"
                size="sm"
                className="h-8.5 rounded-xl food-gradient text-white text-xs gap-1.5 shadow-sm font-medium"
                disabled={importing}
                onClick={importRecipes}
              >
                {importing ? <Loader2 className="size-3.5 animate-spin" /> : <UploadCloud className="size-3.5" />}
                {importing ? "正在写入..." : `确认导入 ${parsed.length} 道食谱`}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
