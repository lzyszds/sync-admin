import { Link } from "react-router-dom"
import { Activity, Database, FileText, Flame, HardDrive, Layers3, Server, ShieldCheck } from "lucide-react"
import { ConsoleWorkspace } from "@/components/layout/console-workspace"
import { useConsole } from "@/lib/console-store"
import { SYNC_LOGS } from "@/lib/console-data"
import { formatBytes, formatDate, formatDateShort } from "@/lib/format"

const APP_LABEL: Record<string, string> = {
  recipe: "食谱业务中台（萌厨食光）",
  notes: "随手备忘（便签数据）",
  custom: "自定义业务租户",
}

export default function Overview() {
  const { overview, apps, snapshots, online, syncCount, lastSyncAt } = useConsole()

  const stats = [
    {
      label: "云端快照总数",
      value: String(overview.totalSnapshots ?? 0),
      unit: "份",
      sub: "包含多端同步的全部用户数据",
      icon: Database,
      color: "#B45309",
    },
    {
      label: "接入应用租户",
      value: String(overview.totalApps ?? apps.length),
      unit: "个",
      sub: "活跃的业务应用命名空间",
      icon: Layers3,
      color: "#6D28D9",
    },
    {
      label: "数据存储体积",
      value: overview.dataSize || "-",
      unit: "",
      sub: "云端数据库占用空间估算",
      icon: HardDrive,
      color: "#047857",
    },
    {
      label: "最近快照同步",
      value: lastSyncAt ? formatDateShort(lastSyncAt) : "-",
      unit: "",
      sub: `今日累计同步 ${syncCount} 次`,
      icon: Server,
      color: "#1D4ED8",
    },
  ]

  return (
    <ConsoleWorkspace
      breadcrumb="全局概览 / 多端应用数据与业务逻辑中枢"
      footerLeft={`共 ${overview.totalSnapshots ?? 0} 份快照 · ${apps.length} 个应用租户`}
      footerRight={online ? "后端链路正常 · 增量下发中" : "演示数据模式 · 后端未连接"}
    >
      <div className="w-full space-y-8 console-fade-up">
        {/* 核心指标 */}
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="border border-craft-line rounded-2xl p-4 bg-background flex items-start justify-between gap-3"
            >
              <div className="min-w-0">
                <div className="text-[11px] text-craft-muted">{stat.label}</div>
                <div className="text-2xl font-bold text-craft-ink mt-1 tracking-tight truncate">
                  {stat.value}
                  {stat.unit && <span className="text-xs font-normal text-craft-muted ml-1">{stat.unit}</span>}
                </div>
                <div className="text-[11px] text-craft-muted mt-1 truncate">{stat.sub}</div>
              </div>
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: `${stat.color}18`, color: stat.color }}
              >
                <stat.icon className="w-[18px] h-[18px]" />
              </div>
            </div>
          ))}
        </div>

        {/* 业务中台分流入口 —— 食谱只是其中一个业务应用 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          <Link
            to="/recipes/recipe"
            className="border border-craft-line rounded-2xl p-5 bg-background hover:bg-craft-list transition text-left"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-9 h-9 rounded-xl bg-craft-ink text-white flex items-center justify-center">
                    <Flame className="w-[18px] h-[18px]" />
                  </span>
                  <h3 className="font-bold text-craft-ink">食谱业务中台</h3>
                </div>
                <p className="text-xs text-craft-muted pt-1 leading-relaxed">
                  管理食谱应用的完整数据表。支持详情拆解 / 整表 / 源码 / 规则四视图，食材三分组强校验与步骤勾选。
                </p>
              </div>
              <span className="text-[11px] px-2 py-0.5 rounded bg-craft-sidebar border border-craft-line text-craft-muted shrink-0">
                业务应用
              </span>
            </div>
            <div className="text-[11px] text-craft-ink mt-4">进入食谱业务中台 →</div>
          </Link>

          <Link
            to="/notes/notes"
            className="border border-craft-line rounded-2xl p-5 bg-background hover:bg-craft-list transition text-left"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-9 h-9 rounded-xl bg-craft-ink text-white flex items-center justify-center">
                    <FileText className="w-[18px] h-[18px]" />
                  </span>
                  <h3 className="font-bold text-craft-ink">随手备忘工作台</h3>
                </div>
                <p className="text-xs text-craft-muted pt-1 leading-relaxed">
                  管理通用便签应用的多端云笔记。支持标签筛选、源码编辑与客户端实时渲染预览、跨表关联食谱。
                </p>
              </div>
              <span className="text-[11px] px-2 py-0.5 rounded bg-craft-sidebar border border-craft-line text-craft-muted shrink-0">
                业务应用
              </span>
            </div>
            <div className="text-[11px] text-craft-ink mt-4">进入随手备忘工作台 →</div>
          </Link>
        </div>

        {/* 应用租户统计 */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-craft-ink">应用租户统计</h3>
            <Link to="/snapshots" className="text-[11px] text-craft-muted hover:text-craft-ink transition">
              全部快照 →
            </Link>
          </div>
          <div className="border border-craft-line rounded-2xl overflow-hidden">
            <table className="dense-table">
              <colgroup>
                <col style={{ width: "132px" }} />
                <col />
                <col style={{ width: "104px" }} />
                <col style={{ width: "116px" }} />
                <col style={{ width: "168px" }} />
                <col style={{ width: "112px" }} />
              </colgroup>
              <thead>
                <tr>
                  <th>应用代号</th>
                  <th>业务类型</th>
                  <th>快照总数</th>
                  <th>存储体积</th>
                  <th>最近活跃时间</th>
                  <th className="text-right">快捷操作</th>
                </tr>
              </thead>
              <tbody>
                {apps.map((app) => (
                  <tr key={app.app}>
                    <td className="nowrap">
                      <span className="inline-flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full ${app.app === "recipe" ? "bg-amber-600" : "bg-blue-600"}`}
                        />
                        <span className="font-mono text-xs">{app.app}</span>
                      </span>
                    </td>
                    <td className="text-craft-muted">{APP_LABEL[app.app] || "自定义业务租户"}</td>
                    <td className="font-semibold text-craft-ink">{app.count} 份</td>
                    <td className="text-craft-muted">{app.dataSize || "-"}</td>
                    <td className="text-craft-muted text-[11px]">{formatDate(app.lastUpdated)}</td>
                    <td className="text-right">
                      <Link
                        to={`/snapshots/${app.app}`}
                        className="inline-block px-2 py-1 rounded border border-craft-line text-[11px] hover:bg-craft-ink hover:text-white transition"
                      >
                        管理快照
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 同步事件流 */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-craft-ink">多端接口与同步实时日志流</h3>
            <span className="text-[11px] text-emerald-700 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
              长连接保持中
            </span>
          </div>
          <div className="border border-craft-line rounded-2xl overflow-hidden">
            <table className="dense-table">
              <colgroup>
                <col style={{ width: "92px" }} />
                <col style={{ width: "76px" }} />
                <col style={{ width: "140px" }} />
                <col />
                <col style={{ width: "100px" }} />
                <col style={{ width: "92px" }} />
              </colgroup>
              <thead>
                <tr>
                  <th>时间</th>
                  <th>状态</th>
                  <th>事件</th>
                  <th>目标通道</th>
                  <th>耗时</th>
                  <th>数据量</th>
                </tr>
              </thead>
              <tbody>
                {SYNC_LOGS.map((log) => (
                  <tr key={`${log.time}-${log.event}`}>
                    <td className="nowrap text-craft-muted">{log.time}</td>
                    <td className="nowrap">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] ${
                          log.status === 200 ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                        }`}
                      >
                        {log.status}
                      </span>
                    </td>
                    <td className="font-medium text-craft-ink">{log.event}</td>
                    <td className="text-craft-muted">{log.target}</td>
                    <td className="nowrap text-craft-muted">{log.latency}</td>
                    <td className="nowrap text-craft-muted">{log.size}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 底部说明 */}
        <div className="flex items-center gap-2 text-[11px] text-craft-muted">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>当前快照总量 {snapshots.length} 份（本次会话已加载）</span>
          <Activity className="w-3.5 h-3.5 ml-3" />
          <span>所有写入均触发表级字段校验</span>
        </div>
      </div>
    </ConsoleWorkspace>
  )
}
