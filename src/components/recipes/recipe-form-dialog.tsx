import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { Loader2, Wand2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { api } from "@/lib/api"
import { useConsole } from "@/lib/console-store"
import {
  CONSOLE_RULES,
  DIFFICULTY_LABEL,
  GROUP_STYLE,
  fromConsolePayload,
  ingredientLines,
  parseIngredientLines,
  toConsolePayload,
} from "@/lib/console-data"
import type { ConsoleRecipePayload } from "@/lib/console-data"
import type { Difficulty, IngredientGroup, Recipe } from "@/lib/types"

interface Props {
  app: string
  tokenHash: string
  open: boolean
  onOpenChange: (open: boolean) => void
  recipe: Recipe | null
  onSaved: () => void
}

type Mode = "form" | "json"

interface FormState {
  name: string
  category: string
  difficulty: Difficulty
  cookTime: number
  description: string
  main: string
  sub: string
  seasoning: string
  steps: string
  tips: string
}

const emptyForm: FormState = {
  name: "",
  category: "国民快手菜",
  difficulty: "easy",
  cookTime: 18,
  description: "",
  main: "",
  sub: "",
  seasoning: "",
  steps: "",
  tips: "",
}

const CATEGORY_PRESETS = ["粤式小炒", "川湘家常", "国民快手菜", "江浙风味"]
const UNIT_REGEX = /^[0-9.]+(克|毫升|勺|个|根|瓣|片)$/

export function RecipeFormDialog({ app, tokenHash, open, onOpenChange, recipe, onSaved }: Props) {
  const { online } = useConsole()
  const [mode, setMode] = useState<Mode>("form")
  const [form, setForm] = useState<FormState>(emptyForm)
  const [rawJson, setRawJson] = useState("")
  const [saving, setSaving] = useState(false)
  const [checks, setChecks] = useState<{ ok: boolean; label: string }[] | null>(null)

  useEffect(() => {
    if (!open) return
    setMode("form")
    setChecks(null)
    if (recipe) {
      const payload = toConsolePayload(recipe)
      setForm({
        name: payload.名称,
        category: payload.分类,
        difficulty: (Object.keys(DIFFICULTY_LABEL) as Difficulty[]).find(
          (d) => DIFFICULTY_LABEL[d] === payload.难度,
        ) || "easy",
        cookTime: payload.烹饪时长,
        description: payload.描述,
        main: ingredientLines(payload.食材.主料.map((i) => ({ name: i.名称, amount: i.用量 }))),
        sub: ingredientLines(payload.食材.辅料.map((i) => ({ name: i.名称, amount: i.用量 }))),
        seasoning: ingredientLines(payload.食材.调味料.map((i) => ({ name: i.名称, amount: i.用量 }))),
        steps: payload.步骤.join("\n"),
        tips: payload.小贴士,
      })
      setRawJson(JSON.stringify(payload, null, 2))
    } else {
      setForm(emptyForm)
      setRawJson(
        JSON.stringify(
          {
            编号: "",
            名称: "香煎孜然寸骨",
            分类: "川湘家常",
            难度: "简单",
            烹饪时长: 20,
            描述: "外焦里嫩的香煎寸骨，孜然与辣椒面香气扑鼻，越嚼越香。",
            食材: {
              主料: [{ 名称: "猪寸骨", 用量: "400克" }],
              辅料: [{ 名称: "洋葱丝", 用量: "40克" }],
              调味料: [{ 名称: "花生油", 用量: "25毫升" }],
            },
            步骤: ["猪寸骨洗净吸干水分，加生抽腌制15分钟。", "平底锅下花生油，放入寸骨中小火慢煎至金黄焦香。"],
            小贴士: "中小火耐心煎透，逼出多余油脂后再撒孜然粒。",
            同步状态: "已同步",
            客户端版本: "桌面端 v2.4",
            更新时间: "",
          },
          null,
          2,
        ),
      )
    }
  }, [open, recipe])

  const payload = useMemo<ConsoleRecipePayload>(() => {
    return {
      编号: recipe?.id || "",
      名称: form.name.trim(),
      分类: form.category,
      难度: DIFFICULTY_LABEL[form.difficulty],
      烹饪时长: Number(form.cookTime) || 0,
      描述: form.description.trim(),
      食材: {
        主料: parseIngredientLines(form.main).map((i) => ({ 名称: i.name, 用量: i.amount })),
        辅料: parseIngredientLines(form.sub).map((i) => ({ 名称: i.name, 用量: i.amount })),
        调味料: parseIngredientLines(form.seasoning).map((i) => ({ 名称: i.name, 用量: i.amount })),
      },
      步骤: form.steps.split("\n").map((s) => s.trim()).filter(Boolean),
      小贴士: form.tips.trim(),
      同步状态: "已同步",
      客户端版本: "桌面端 v2.4",
      更新时间: recipe?.updatedAt || "",
    }
  }, [form, recipe])

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function validate(): { ok: boolean; label: string }[] {
    const p = payload
    const list: { ok: boolean; label: string }[] = []
    list.push({ ok: Boolean(p.名称), label: "名称必填校验" })
    list.push({ ok: CATEGORY_PRESETS.includes(p.分类), label: `分类枚举约束（${p.分类 || "未填写"}）` })
    list.push({ ok: ["简单", "中等", "进阶"].includes(p.难度), label: `难度枚举约束（${p.难度 || "未填写"}）` })
    list.push({ ok: p.烹饪时长 >= 1 && p.烹饪时长 <= 240, label: `烹饪时长范围校验（${p.烹饪时长} 分钟）` })
    list.push({ ok: p.描述.length >= 12 && p.描述.length <= 38, label: `描述摘要长度校验（${p.描述.length} 字）` })
    const groupsOk = p.食材.主料.length > 0 && p.食材.辅料.length > 0 && p.食材.调味料.length > 0
    list.push({ ok: groupsOk, label: "食材三分组完整性校验" })
    const all = [...p.食材.主料, ...p.食材.辅料, ...p.食材.调味料]
    list.push({
      ok: groupsOk && all.every((i) => i.名称 && UNIT_REGEX.test(i.用量)),
      label: "食材精确中文单位校验",
    })
    list.push({ ok: p.步骤.length >= 3, label: `烹饪步骤数量校验（${p.步骤.length} 步）` })
    list.push({ ok: !JSON.stringify(p).includes("豆腐"), label: "品类过滤规则（无黑名单食材）" })
    return list
  }

  function runValidation() {
    const result = validate()
    setChecks(result)
    return result.every((c) => c.ok)
  }

  function switchMode(next: Mode) {
    if (next === "json") {
      setRawJson(JSON.stringify(payload, null, 2))
    } else {
      try {
        const parsed = JSON.parse(rawJson) as ConsoleRecipePayload
        const patch = fromConsolePayload(parsed)
        setForm((prev) => ({
          ...prev,
          name: patch.name ?? prev.name,
          category: patch.category ?? prev.category,
          difficulty: patch.difficulty ?? prev.difficulty,
          cookTime: patch.cookTime ?? prev.cookTime,
          description: patch.description ?? prev.description,
          main: ingredientLines(patch.ingredients?.filter((i) => i.group === "主料")),
          sub: ingredientLines(patch.ingredients?.filter((i) => i.group === "辅料")),
          seasoning: ingredientLines(patch.ingredients?.filter((i) => i.group === "调味料")),
          steps: (patch.steps || []).map((s) => s.description).join("\n"),
          tips: patch.tips ?? prev.tips,
        }))
      } catch {
        toast.error("源码语法解析失败，请检查括号或引号")
        return
      }
    }
    setMode(next)
  }

  function formatJson() {
    try {
      setRawJson(JSON.stringify(JSON.parse(rawJson), null, 2))
      toast.success("源码格式已整理")
    } catch {
      toast.error("源码语法有误，无法整理")
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (mode === "json") {
      try {
        switchMode("form")
      } catch {
        return
      }
    }
    const result = validate()
    const allOk = result.every((c) => c.ok)
    if (!allOk) {
      toast.error("部分字段未通过表级校验，请检查下方高亮项")
      return
    }
    const patch = fromConsolePayload(payload)
    setSaving(true)
    try {
      if (online && tokenHash) {
        if (recipe) {
          await api.updateRecipe(app, tokenHash, recipe.id, patch)
        } else {
          await api.createRecipe(app, tokenHash, patch)
        }
      }
      onOpenChange(false)
      onSaved()
      toast.success(recipe ? "食谱已更新并同步至各端" : "新食谱已录入并同步至各端")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "保存食谱失败")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] flex flex-col sm:max-w-4xl rounded-2xl p-0 overflow-hidden">
        <DialogHeader className="shrink-0 px-6 py-4 border-b border-craft-line">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-2 h-2 rounded-full bg-craft-ink shrink-0" />
              <div className="min-w-0">
                <DialogTitle className="text-base font-bold truncate">
                  {recipe ? "编辑食谱记录" : "新增食谱记录"}
                </DialogTitle>
                <DialogDescription className="text-[11px] mt-0.5">
                  写入前执行表级字段校验，通过后自动推送至各端客户端
                </DialogDescription>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <div className="bg-craft-list border border-craft-line rounded-lg p-0.5 flex text-xs">
                <button
                  type="button"
                  onClick={() => switchMode("form")}
                  className={`px-2.5 py-1 rounded transition ${
                    mode === "form" ? "bg-craft-ink text-white" : "text-craft-muted hover:text-craft-ink"
                  }`}
                >
                  表单编辑
                </button>
                <button
                  type="button"
                  onClick={() => switchMode("json")}
                  className={`px-2.5 py-1 rounded transition ${
                    mode === "json" ? "bg-craft-ink text-white" : "text-craft-muted hover:text-craft-ink"
                  }`}
                >
                  源码编辑
                </button>
              </div>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={submit} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-4">
            {mode === "form" ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div>
                    <Label className="block text-[11px] text-craft-muted mb-1">名称 *</Label>
                    <Input
                      value={form.name}
                      onChange={(e) => setField("name", e.target.value)}
                      placeholder="如：生炒排骨"
                      className="h-9 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <Label className="block text-[11px] text-craft-muted mb-1">分类 *</Label>
                    <Select value={form.category} onValueChange={(v) => setField("category", v)}>
                      <SelectTrigger className="h-9 rounded-lg text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-lg">
                        {CATEGORY_PRESETS.map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="block text-[11px] text-craft-muted mb-1">难度 *</Label>
                    <Select value={form.difficulty} onValueChange={(v) => setField("difficulty", v as Difficulty)}>
                      <SelectTrigger className="h-9 rounded-lg text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-lg">
                        <SelectItem value="easy">简单</SelectItem>
                        <SelectItem value="medium">中等</SelectItem>
                        <SelectItem value="hard">进阶</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="block text-[11px] text-craft-muted mb-1">时长(分钟) *</Label>
                    <Input
                      type="number"
                      min={1}
                      max={240}
                      value={form.cookTime}
                      onChange={(e) => setField("cookTime", Number(e.target.value))}
                      className="h-9 rounded-lg text-xs"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <Label className="block text-[11px] text-craft-muted">风味描述（约 25 字）*</Label>
                    <span className="text-[11px] text-craft-muted">
                      {form.description.trim().length} / 38 字
                    </span>
                  </div>
                  <Input
                    value={form.description}
                    onChange={(e) => setField("description", e.target.value)}
                    placeholder="简述菜品风味与口感特点..."
                    className="h-9 rounded-lg text-xs"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {(["主料", "辅料", "调味料"] as IngredientGroup[]).map((group) => {
                    const key = group === "主料" ? "main" : group === "辅料" ? "sub" : "seasoning"
                    const style = GROUP_STYLE[group]
                    return (
                      <div key={group} className="bg-craft-list rounded-xl border border-craft-line p-3">
                        <div className="text-[11px] font-semibold mb-1.5" style={{ color: style.color }}>
                          {style.icon} {group}
                        </div>
                        <Textarea
                          rows={4}
                          value={form[key]}
                          onChange={(e) => setField(key, e.target.value)}
                          placeholder={`每行一条：名称:用量\n例如：新鲜猪肋排:450克`}
                          className="text-xs rounded-lg bg-background"
                        />
                      </div>
                    )
                  })}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label className="block text-[11px] text-craft-muted mb-1">烹饪步骤（每行一步）*</Label>
                    <Textarea
                      rows={5}
                      value={form.steps}
                      onChange={(e) => setField("steps", e.target.value)}
                      placeholder="排骨斩小段，冷水浸泡去血水后吸干。&#10;热锅下油，中大火翻炒至表面金黄。"
                      className="text-xs rounded-lg leading-relaxed"
                    />
                  </div>
                  <div>
                    <Label className="block text-[11px] text-craft-muted mb-1">烹饪小贴士</Label>
                    <Textarea
                      rows={5}
                      value={form.tips}
                      onChange={(e) => setField("tips", e.target.value)}
                      placeholder="记录关键火候与调味要点..."
                      className="text-xs rounded-lg leading-relaxed"
                    />
                  </div>
                </div>
              </>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-craft-muted">直接编辑标准数据负载（与表单实时互通）</span>
                  <button
                    type="button"
                    onClick={formatJson}
                    className="text-[11px] text-blue-600 hover:underline"
                  >
                    格式化源码
                  </button>
                </div>
                <Textarea
                  rows={16}
                  value={rawJson}
                  onChange={(e) => setRawJson(e.target.value)}
                  className="text-xs font-mono rounded-lg leading-relaxed"
                />
              </div>
            )}

            {/* 实时规则校验器 */}
            <div className="bg-craft-list border border-craft-line rounded-xl p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-craft-ink">食谱表级结构实时校验器</span>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={runValidation}
                  className="h-7 rounded-lg text-xs bg-craft-ink text-white hover:bg-neutral-800"
                >
                  <Wand2 className="w-3.5 h-3.5 mr-1" /> 运行规则校验
                </Button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                {checks ? (
                  checks.map((c) => (
                    <div key={c.label} className={`flex items-start gap-1.5 ${c.ok ? "text-emerald-700" : "text-rose-700"}`}>
                      <span className="shrink-0">{c.ok ? "✔" : "✖"}</span>
                      <span>{c.label}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-craft-muted">点击右上角「运行规则校验」检测字段约束与食材分组规范...</div>
                )}
              </div>
            </div>
          </div>
        </form>

        <DialogFooter className="shrink-0 px-6 py-3.5 bg-craft-list border-t border-craft-line flex items-center justify-between">
          <div className="text-[11px] text-craft-muted truncate">
            当前启用 {CONSOLE_RULES.filter((r) => r.scope === "食谱" && r.enabled).length} 条食谱表级校验规则
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button type="button" variant="ghost" size="sm" className="rounded-lg text-xs" onClick={() => onOpenChange(false)}>
              取消
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={saving}
              onClick={(e) => {
                e.preventDefault()
                void submit(e as unknown as React.FormEvent)
              }}
              className="rounded-lg text-xs bg-craft-ink text-white hover:bg-neutral-800"
            >
              {saving && <Loader2 className="size-3.5 animate-spin mr-1" />}
              {saving ? "正在保存..." : "校验并保存"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
