import { useEffect } from "react"
import { HashRouter, Navigate, Route, Routes, useLocation } from "react-router-dom"
import { AppShell } from "@/components/layout/app-shell"
import { getToken } from "@/lib/api"
import Endpoints from "@/pages/endpoints"
import Login from "@/pages/login"
import Notes from "@/pages/notes"
import Overview from "@/pages/overview"
import Recipes from "@/pages/recipes"
import Schema from "@/pages/schema"
import Snapshots from "@/pages/snapshots"

const SITE_NAME = "云控后台"

/** 各路由的 SEO 元信息（标题 / 描述） */
const PAGE_META: { match: string; title: string; description: string }[] = [
  {
    match: "/login",
    title: "管理员登录",
    description: "登录云控后台，管理食谱与随手备忘等多端业务应用的云端快照、数据表结构与增量同步通道。",
  },
  {
    match: "/overview",
    title: "全局概览",
    description: "查看多端应用数据库与业务逻辑中枢总览：快照总量、接入租户、存储体积与实时同步事件流。",
  },
  {
    match: "/snapshots",
    title: "快照库",
    description: "管理各业务应用租户的云端快照，检视用户全量同步负载与原始数据透视。",
  },
  {
    match: "/recipes",
    title: "食谱业务中台",
    description: "管理食谱应用的完整数据表：详情拆解、整表视图、源码导出与食材分组强校验规则。",
  },
  {
    match: "/notes",
    title: "随手备忘工作台",
    description: "管理通用便签应用的多端云笔记，支持标签筛选、源码编辑、客户端渲染预览与跨表关联食谱。",
  },
  {
    match: "/schema",
    title: "表结构与字段校验",
    description: "统一管理食谱表与笔记表的字段类型、约束范围及多端写入限制等业务校验逻辑。",
  },
  {
    match: "/endpoints",
    title: "客户端端点与同步通道",
    description: "查看各业务客户端的授权接入端点与近期增量同步事件，实时验证通道连通性。",
  },
]

function setMeta(name: string, content: string, attr: "name" | "property" = "name") {
  let tag = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${name}"]`)
  if (!tag) {
    tag = document.createElement("meta")
    tag.setAttribute(attr, name)
    document.head.appendChild(tag)
  }
  tag.setAttribute("content", content)
}

/** 路由级 SEO：动态更新标题与描述 */
function RouteMeta() {
  const { pathname } = useLocation()

  useEffect(() => {
    const hit = PAGE_META.find((item) => pathname.startsWith(item.match)) ?? PAGE_META[1]
    document.title = `${hit.title} · ${SITE_NAME}`
    setMeta("description", hit.description)
    setMeta("og:title", `${hit.title} · ${SITE_NAME}`, "property")
    setMeta("og:description", hit.description, "property")
    setMeta("og:url", `https://sync.lzyszds.cn/console/#${pathname}`, "property")
  }, [pathname])

  return null
}

function Protected() {
  const loggedIn = Boolean(getToken())
  return loggedIn ? <AppShell /> : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <HashRouter>
      <RouteMeta />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<Protected />}>
          <Route path="/" element={<Navigate to="/overview" replace />} />
          <Route path="/overview" element={<Overview />} />
          <Route path="/dashboard" element={<Navigate to="/overview" replace />} />
          <Route path="/snapshots" element={<Snapshots />} />
          <Route path="/snapshots/:app" element={<Snapshots />} />
          <Route path="/recipes" element={<Navigate to="/recipes/recipe" replace />} />
          <Route path="/recipes/:app" element={<Recipes />} />
          <Route path="/recipes/:app/:tokenHash" element={<Recipes />} />
          <Route path="/notes" element={<Navigate to="/notes/notes" replace />} />
          <Route path="/notes/:app" element={<Notes />} />
          <Route path="/notes/:app/:tokenHash" element={<Notes />} />
          <Route path="/schema" element={<Schema />} />
          <Route path="/endpoints" element={<Endpoints />} />
        </Route>
        <Route path="*" element={<Navigate to="/overview" replace />} />
      </Routes>
    </HashRouter>
  )
}
