import { useEffect, useState } from "react"
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom"
import { toast } from "sonner"
import {
  Activity,
  Database,
  NotebookPen,
  RefreshCw,
  RotateCw,
  Settings2,
  ShieldCheck,
  UtensilsCrossed,
  Webhook,
} from "lucide-react"
import { AmbientBackground } from "@/components/layout/ambient-background"
import { BrandMark } from "@/components/layout/brand-mark"
import { GlassPanel } from "@/components/layout/glass-panel"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { clearToken } from "@/lib/api"
import { loadAiConfig, saveAiConfig } from "@/lib/ai-config"
import { ConsoleProvider, useConsole } from "@/lib/console-store"

/** 图标导航栏模块定义（平台级 + 业务应用级） */
const RAIL_ITEMS = [
  { key: "overview", label: "概览", to: "/overview", icon: Activity, match: "/overview" },
  { key: "snapshots", label: "快照", to: "/snapshots", icon: Database, match: "/snapshots" },
  { key: "recipes", label: "食谱", to: "/recipes/recipe", icon: UtensilsCrossed, match: "/recipes" },
  { key: "notes", label: "笔记", to: "/notes/notes", icon: NotebookPen, match: "/notes" },
  { key: "schema", label: "规则", to: "/schema", icon: ShieldCheck, match: "/schema" },
  { key: "webhooks", label: "接口", to: "/endpoints", icon: Webhook, match: "/endpoints" },
]

function Rail() {
  const location = useLocation()
  const navigate = useNavigate()
  const { online, syncCount, triggerSync, refreshAll, loading } = useConsole()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  async function handleSync() {
    setSyncing(true)
    await triggerSync()
    setSyncing(false)
    toast.success("已完成多端增量数据同步", {
      description: `今日累计同步 ${syncCount + 1} 次`,
    })
  }

  /** 全局刷新：清空所有页面缓存并重新拉取数据 */
  async function handleRefreshAll() {
    setRefreshing(true)
    await refreshAll()
    setRefreshing(false)
    toast.success("数据已刷新")
  }

  return (
    <aside className="glass-surface-soft flex h-full w-16 shrink-0 flex-col items-center justify-between border-r border-white/60 py-4">
      <div className="flex w-full flex-col items-center gap-5">
        <Link to="/overview" className="group relative" title="云控后台">
          <BrandMark className="size-9 rounded-xl shadow-sm transition group-hover:scale-105" />
        </Link>

        <nav className="flex w-full flex-col items-center gap-3">
          {RAIL_ITEMS.map((item) => {
            const active = location.pathname.startsWith(item.match)
            const Icon = item.icon
            return (
              <Link
                key={item.key}
                to={item.to}
                title={item.label}
                className={`group relative flex w-full flex-col items-center gap-1 py-1.5 transition ${
                  active ? "font-medium text-craft-ink" : "text-craft-muted hover:text-craft-ink"
                }`}
              >
                <span
                  className={`absolute bottom-2 left-0 top-2 w-1 rounded-r-full bg-craft-ink transition-all ${
                    active ? "opacity-100" : "opacity-0"
                  }`}
                />
                <div className="flex size-8 items-center justify-center rounded-lg transition group-hover:bg-black/5">
                  <Icon className="size-4" />
                </div>
                <span className="text-[11px] leading-none">{item.label}</span>
              </Link>
            )
          })}
        </nav>
      </div>

      <div className="flex flex-col items-center gap-3.5 text-craft-muted">
        <ConnectionBadge />
        <button
          onClick={handleRefreshAll}
          title="刷新全部数据"
          className="flex size-8 items-center justify-center rounded-lg transition hover:bg-black/5 hover:text-craft-ink"
        >
          <RotateCw className={`size-4 ${refreshing || loading ? "animate-spin" : ""}`} />
        </button>
        <button
          onClick={handleSync}
          title="同步多端数据"
          className="flex size-8 items-center justify-center rounded-lg transition hover:bg-black/5 hover:text-craft-ink"
        >
          <RefreshCw className={`size-4 ${syncing ? "animate-spin" : ""}`} />
        </button>
        <button
          onClick={() => setSettingsOpen(true)}
          title="智能解析配置"
          className="flex size-8 items-center justify-center rounded-lg transition hover:bg-black/5 hover:text-craft-ink"
        >
          <Settings2 className="size-4" />
        </button>
        <button
          onClick={() => {
            clearToken()
            toast.success("已退出登录")
            navigate("/login")
          }}
          title="退出登录"
          className="mt-1 flex size-8 items-center justify-center rounded-full bg-craft-ink text-xs font-medium text-white transition hover:bg-neutral-800"
        >
          管
        </button>
      </div>

      <AiSettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </aside>
  )
}

function AiSettingsDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [config, setConfig] = useState(() => loadAiConfig())
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (open) setConfig(loadAiConfig())
  }, [open])

  function save() {
    saveAiConfig(config)
    setSaved(true)
    setTimeout(() => {
      setSaved(false)
      onOpenChange(false)
      toast.success("智能解析配置已保存")
    }, 600)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg">智能结构化解析配置</DialogTitle>
          <DialogDescription className="text-xs">
            将自然语言菜谱文本一键解析为高结构化的食谱数据，支持任意兼容开放接口规范的模型服务。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3.5 py-1">
          <div className="space-y-1.5">
            <Label htmlFor="ai-base-url" className="text-xs font-semibold">
              接口地址
            </Label>
            <Input
              id="ai-base-url"
              className="h-9.5 rounded-xl text-xs font-mono"
              value={config.baseUrl}
              onChange={(e) => setConfig((prev) => ({ ...prev, baseUrl: e.target.value }))}
              placeholder="https://api.example.com/v1"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ai-model" className="text-xs font-semibold">
              模型代号
            </Label>
            <Input
              id="ai-model"
              className="h-9.5 rounded-xl text-xs font-mono"
              value={config.model}
              onChange={(e) => setConfig((prev) => ({ ...prev, model: e.target.value }))}
              placeholder="模型名称"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ai-api-key" className="text-xs font-semibold">
              访问密钥
            </Label>
            <Input
              id="ai-api-key"
              type="password"
              className="h-9.5 rounded-xl text-xs font-mono"
              value={config.apiKey}
              onChange={(e) => setConfig((prev) => ({ ...prev, apiKey: e.target.value }))}
              placeholder="sk-..."
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" size="sm" className="rounded-xl" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button size="sm" className="rounded-xl bg-craft-ink text-white hover:bg-neutral-800" onClick={save}>
            {saved ? "已保存生效" : "保存配置"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function AppShell() {
  return (
    <ConsoleProvider>
      <div className="relative min-h-svh w-full overflow-hidden">
        <AmbientBackground />

        {/* 非全屏布局：外部环境背景 + 居中拟态磨砂大卡片 */}
        <div className="relative z-10 mx-auto flex h-svh w-full max-w-[1760px] flex-col p-3 sm:p-4 lg:p-5">
          <GlassPanel className="min-h-0 flex-1" radius="rounded-[26px]" spotlight={false}>
            <div className="flex h-full min-h-0 w-full">
              <Rail />
              <div className="h-full min-w-0 flex-1 overflow-hidden">
                <Outlet />
              </div>
            </div>
          </GlassPanel>
        </div>
      </div>
    </ConsoleProvider>
  )
}

/** 平台连接状态徽标（侧边栏窄栏位，使用状态点 + 悬停提示） */
export function ConnectionBadge() {
  const { online, authFailed } = useConsole()
  const state = online
    ? { dot: "bg-emerald-500", label: "后端已连接", title: "后端链路正常，读取的是真实数据" }
    : authFailed
      ? { dot: "bg-rose-500", label: "令牌无效 (401)", title: "后端可达，但管理员令牌被拒绝（401）—— 请重新登录" }
      : { dot: "bg-amber-500", label: "演示数据模式", title: "后端不可达，当前展示本地演示数据" }

  return (
    <span className="relative flex h-2 w-2" title={state.title} aria-label={state.label}>
      <span className={`absolute inline-flex h-full w-full rounded-full opacity-60 ${state.dot}`} />
      <span className={`relative inline-flex h-2 w-2 rounded-full ${state.dot}`} />
    </span>
  )
}
