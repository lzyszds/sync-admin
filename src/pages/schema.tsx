import { ConsoleWorkspace } from "@/components/layout/console-workspace"
import { CONSOLE_RULES, CONSOLE_SCHEMAS } from "@/lib/console-data"
import { RuleCard, StructurePanel } from "@/pages/recipes"

export default function Schema() {
  const enabled = CONSOLE_RULES.filter((r) => r.enabled).length

  return (
    <ConsoleWorkspace
      breadcrumb="全局配置 / 表结构与字段校验逻辑"
      footerLeft={`当前启用 ${enabled} 条字段校验规则`}
      footerRight="多端写入时自动触发校验"
    >
      <div className="w-full space-y-8 console-fade-up">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-craft-ink">表结构与字段校验逻辑</h1>
          <p className="text-xs text-craft-muted mt-1">
            统一管理食谱表与笔记表的字段类型、约束范围及多端写入限制。
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-7 space-y-3.5">
            <h3 className="text-sm font-bold text-craft-ink">食谱表 · 业务规则与触发器</h3>
            {CONSOLE_RULES.filter((r) => r.scope === "食谱").map((rule) => (
              <RuleCard key={rule.id} rule={rule} />
            ))}
          </div>
          <div className="lg:col-span-5 space-y-3.5">
            <h3 className="text-sm font-bold text-craft-ink">食谱表 · 结构定义</h3>
            <StructurePanel title="食谱表" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-7 space-y-3.5">
            <h3 className="text-sm font-bold text-craft-ink">笔记表 · 业务规则</h3>
            {CONSOLE_RULES.filter((r) => r.scope === "笔记").map((rule) => (
              <RuleCard key={rule.id} rule={rule} />
            ))}
          </div>
          <div className="lg:col-span-5 space-y-3.5">
            <h3 className="text-sm font-bold text-craft-ink">笔记表 · 结构定义</h3>
            <StructurePanel title="笔记表" />
          </div>
        </div>

        <div className="text-[11px] text-craft-muted">
          共 {CONSOLE_RULES.length} 条规则 · 覆盖 {Object.keys(CONSOLE_SCHEMAS).length} 张业务数据表
        </div>
      </div>
    </ConsoleWorkspace>
  )
}
