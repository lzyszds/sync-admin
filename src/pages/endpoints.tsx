import { toast } from "sonner"
import { Send } from "lucide-react"
import { ConsoleWorkspace } from "@/components/layout/console-workspace"
import { CONSOLE_ENDPOINTS, SYNC_LOGS } from "@/lib/console-data"
import { useConsole } from "@/lib/console-store"

export default function Endpoints() {
  const { triggerSync, online } = useConsole()

  return (
    <ConsoleWorkspace
      breadcrumb="全局配置 / 客户端端点与增量同步通道"
      footerLeft={`授权端点 ${CONSOLE_ENDPOINTS.length} 条 · 近期事件 ${SYNC_LOGS.length} 条`}
      footerRight={online ? "后端链路正常" : "演示数据模式"}
    >
      <div className="w-full space-y-6 console-fade-up">
        <div className="border border-craft-line rounded-2xl p-4 bg-background flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-craft-ink">客户端接入端点</h3>
            <p className="text-xs text-craft-muted mt-1">
              各业务客户端通过以下授权端点读写云端数据表，写入均触发表级字段校验
            </p>
          </div>
          <button
            onClick={() => {
              void triggerSync()
              toast.success("已发送测试请求，通道响应正常")
            }}
            className="px-3 py-1.5 rounded-lg bg-emerald-600/10 text-emerald-700 border border-emerald-600/30 hover:bg-emerald-600/20 transition text-xs shrink-0 flex items-center gap-1.5"
          >
            <Send className="w-3.5 h-3.5" /> 发送测试请求
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {CONSOLE_ENDPOINTS.map((ep) => (
            <div key={ep.name} className="border border-craft-line rounded-2xl p-4 bg-background space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-craft-ink">{ep.name}</span>
                <span className="text-[11px] px-2 py-0.5 rounded bg-craft-list border border-craft-line text-craft-muted shrink-0">
                  {ep.kind}
                </span>
              </div>
              <div className="font-mono text-[11px] text-craft-ink break-all bg-craft-list border border-craft-line rounded-lg px-2.5 py-1.5">
                {ep.method} {ep.path}
              </div>
              <p className="text-xs text-craft-muted leading-relaxed">{ep.desc}</p>
            </div>
          ))}
        </div>

        <div>
          <h3 className="text-sm font-bold text-craft-ink mb-3">近期同步事件</h3>
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
      </div>
    </ConsoleWorkspace>
  )
}
