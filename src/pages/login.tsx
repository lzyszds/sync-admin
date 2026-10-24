import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import {
  ArrowRight,
  Database,
  Eye,
  EyeOff,
  FileJson,
  KeyRound,
  Loader2,
  Server,
  ShieldCheck,
  Sparkles,
} from "lucide-react"
import { AmbientBackground } from "@/components/layout/ambient-background"
import { BrandMark } from "@/components/layout/brand-mark"
import { GlassPanel } from "@/components/layout/glass-panel"
import { api, clearApiBase, getToken, setApiBase, setToken } from "@/lib/api"

type LoginMode = "token" | "remote"

export default function Login() {
  const navigate = useNavigate()

  const [mode, setMode] = useState<LoginMode>("token")
  const [token, setTokenInput] = useState("")
  const [base, setBase] = useState("")
  const [remember, setRemember] = useState(true)
  const [reveal, setReveal] = useState(false)
  const [loading, setLoading] = useState(false)

  // 已持有有效令牌时直接进入工作台
  useEffect(() => {
    if (getToken()) navigate("/overview", { replace: true })
  }, [navigate])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const value = token.trim()
    if (!value) {
      toast.error("请输入管理员令牌后再进入工作台")
      return
    }

    setLoading(true)
    if (mode === "remote" && base.trim()) setApiBase(base.trim())
    setToken(value, remember)

    try {
      await api.overview()
      toast.success("登录成功，欢迎回到云控后台")
      navigate("/overview")
    } catch {
      // 后端不可达时仍允许进入演示模式
      toast.info("后端暂不可达，已进入演示数据模式")
      navigate("/overview")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-svh w-full overflow-hidden">
      <AmbientBackground />

      {/* 顶部品牌状态浮标 */}
      <header className="fixed inset-x-6 top-6 z-20 flex items-center justify-between gap-4 sm:inset-x-8 sm:top-7">
        <div className="pointer-events-auto flex items-center gap-2.5">
          <BrandMark className="size-8" />
          <span className="text-sm font-semibold tracking-tight text-activeblack">云控后台</span>
          <span className="rounded-full border border-black/[0.04] bg-black/[0.04] px-2 py-0.5 text-[11px] text-textmuted">
            控制台 v2.4 多端同步版
          </span>
        </div>

        <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-white/90 bg-white/70 px-3 py-1.5 text-xs text-textmuted shadow-sm backdrop-blur-md">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          <span className="hidden sm:inline">食谱与笔记库 · 节点正常</span>
          <span className="sm:hidden">节点正常</span>
        </div>
      </header>

      {/* 核心 3D 磨砂玻璃流光登录卡片 */}
      <main className="relative z-10 flex min-h-svh w-full items-center justify-center px-4 py-24">
        <GlassPanel className="w-full max-w-[420px]" radius="rounded-[28px]" spotlight tilt>
          <div className="px-7 py-8 sm:px-9 sm:py-9">
            {/* 顶部徽章组 */}
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center -space-x-1.5">
                <span className="flex size-8 items-center justify-center rounded-full bg-activeblack text-xs font-bold text-white ring-2 ring-white shadow-sm">
                  食
                </span>
                <span className="flex size-8 items-center justify-center rounded-full bg-stone-800 text-xs font-bold text-white ring-2 ring-white shadow-sm">
                  笔
                </span>
                <span className="flex size-8 items-center justify-center rounded-full border border-borderlight bg-white text-xs font-bold text-activeblack ring-2 ring-white shadow-sm">
                  表
                </span>
              </div>
              <div className="flex items-center gap-1.5 rounded-full border border-white/80 bg-white/60 px-2.5 py-1">
                <span className="size-2 rounded-full bg-[#22C55E]" title="食谱表在线" />
                <span className="size-2 rounded-full bg-[#F97316]" title="笔记表在线" />
                <span className="size-2 rounded-full bg-[#EC4899]" title="规则引擎就绪" />
              </div>
            </div>

            {/* 标题与副标题 */}
            <div className="mb-6">
              <h1 className="text-2xl font-bold tracking-tight text-activeblack">欢迎回到工作台</h1>
              <p className="mt-1.5 text-xs leading-relaxed text-textmuted">
                登录以管理客户端
                <span className="font-medium text-activeblack">食谱 (recipes)</span> 与
                <span className="font-medium text-activeblack">云笔记 (notes)</span> 数据表。
              </p>
            </div>

            {/* 滑动胶囊切换器 */}
            <div className="relative mb-6 grid grid-cols-2 rounded-xl border border-black/[0.03] bg-black/[0.04] p-1">
              <div
                className="tab-pill absolute bottom-1 left-1 top-1 w-[calc(50%-4px)] rounded-lg border border-black/[0.04] bg-white shadow-sm"
                style={{ transform: mode === "token" ? "translateX(0%)" : "translateX(100%)" }}
              />
              <button
                type="button"
                onClick={() => setMode("token")}
                className={`relative z-10 py-1.5 text-xs font-medium transition ${
                  mode === "token" ? "text-activeblack" : "text-textmuted hover:text-activeblack"
                }`}
              >
                令牌直连
              </button>
              <button
                type="button"
                onClick={() => setMode("remote")}
                className={`relative z-10 py-1.5 text-xs font-medium transition ${
                  mode === "remote" ? "text-activeblack" : "text-textmuted hover:text-activeblack"
                }`}
              >
                服务地址直连
              </button>
            </div>

            {/* 登录表单 */}
            <form onSubmit={submit} className="space-y-4">
              {mode === "remote" && (
                <div>
                  <label
                    htmlFor="api-base"
                    className="mb-1.5 ml-0.5 block text-[11px] font-medium text-textmuted"
                  >
                    接入服务地址
                  </label>
                  <div className="relative">
                    <Server className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-textmuted" />
                    <input
                      id="api-base"
                      type="text"
                      value={base}
                      onChange={(e) => setBase(e.target.value)}
                      placeholder={typeof window !== "undefined" ? window.location.origin : "https://your-host"}
                      className="glass-input w-full rounded-xl py-2.5 pl-8 pr-3 text-xs text-activeblack placeholder-textmuted/60"
                    />
                    {base && (
                      <button
                        type="button"
                        onClick={() => {
                          clearApiBase()
                          setBase("")
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-textmuted transition hover:text-activeblack"
                      >
                        恢复默认
                      </button>
                    )}
                  </div>
                </div>
              )}

              <div>
                <label
                  htmlFor="admin-token"
                  className="mb-1.5 ml-0.5 block text-[11px] font-medium text-textmuted"
                >
                  管理员令牌 (Admin Token)
                </label>
                <div className="relative">
                  <KeyRound className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-textmuted" />
                  <input
                    id="admin-token"
                    type={reveal ? "text" : "password"}
                    required
                    autoFocus
                    value={token}
                    onChange={(e) => setTokenInput(e.target.value)}
                    placeholder="粘贴管理员访问令牌..."
                    className="glass-input w-full rounded-xl py-2.5 pl-8 pr-9 text-xs text-activeblack placeholder-textmuted/60"
                  />
                  <button
                    type="button"
                    onClick={() => setReveal((v) => !v)}
                    title={reveal ? "隐藏令牌" : "显示令牌"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-textmuted transition hover:text-activeblack"
                  >
                    {reveal ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="size-3.5 cursor-pointer rounded accent-neutral-900"
                  />
                  <span className="text-xs text-textmuted">在本机记住管理员令牌</span>
                </label>
                <button
                  type="button"
                  onClick={() => toast.info("请联系系统主管理员重置数据库访问令牌")}
                  className="text-[11px] text-textmuted transition hover:text-activeblack"
                >
                  忘记令牌？
                </button>
              </div>

              <button
                type="submit"
                disabled={loading || !token.trim()}
                className="shimmer-btn mt-2 flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-medium text-white disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    正在校验并同步数据表...
                  </>
                ) : (
                  <>
                    <span>进入云控后台</span>
                    <ArrowRight className="size-3.5" />
                  </>
                )}
              </button>
            </form>

            {/* 底部快捷认证分隔 */}
            <div className="mt-6 flex items-center justify-between border-t border-black/[0.06] pt-5 text-[11px] text-textmuted">
              <span>支持移动端扫码授权</span>
              <button
                type="button"
                onClick={() => toast.success("已发起局域网手机端扫码请求")}
                className="flex items-center gap-1 font-medium text-activeblack transition hover:underline"
              >
                <span>手机端快速确认</span>
                <span>→</span>
              </button>
            </div>
          </div>
        </GlassPanel>
      </main>

      {/* 底部极简版权与快捷键说明 */}
      <footer className="fixed inset-x-6 bottom-5 z-10 flex items-center justify-between text-[11px] text-textmuted sm:inset-x-8">
        <span>本地与云端双引擎存储 · 实时同步</span>
        <span className="hidden sm:inline">移动鼠标体验波点力场与玻璃折射</span>
      </footer>

      {/* 底部能力矩阵（仅小屏可见，避免遮挡主卡片） */}
      <div className="pointer-events-none fixed inset-x-0 bottom-16 z-0 flex justify-center opacity-0 sm:hidden">
        <div className="grid grid-cols-2 gap-2 text-[11px] text-textmuted">
          {[
            { icon: Database, label: "多端快照与同步" },
            { icon: Sparkles, label: "智能结构化解析" },
            { icon: FileJson, label: "全量数据透视" },
            { icon: ShieldCheck, label: "表级字段校验" },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-1.5 rounded-lg bg-white/50 p-2">
              <item.icon className="size-3.5" />
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
