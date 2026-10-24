# 云控后台 · sync-admin

多端应用数据库与业务逻辑管理中枢 —— 统一管理食谱、随手备忘等业务应用的**云端快照**、**数据表结构**、**字段校验规则**与**增量同步通道**。

> 线上地址：https://sync.lzyszds.cn/console/

## 技术栈

- React 19 + TypeScript + Vite 8
- Tailwind CSS v4（`@theme` 令牌体系）
- Radix UI（Dialog / AlertDialog / Select / Checkbox 等）
- react-router-dom 7（HashRouter）
- sonner（轻提示）

## 界面设计

参考 [21st.dev](https://21st.dev) 的玻璃拟态 / Spotlight Card 模式重做视觉层：

| 层级 | 说明 |
| --- | --- |
| 层级 1 | 流体渐变光晕（`ambient-blob` 关键帧缓慢漂移） |
| 层级 2 | 交互式波点矩阵画布（鼠标经过时波点柔和排斥 + 放大加深） |
| 层级 3 | 胶片颗粒噪点（`.noise-overlay`，提升磨砂质感） |
| 层级 4 | 拟态磨砂大卡片（`backdrop-filter` + 内高光 + 鼠标聚光灯 + 边缘流光） |

- **登录页**：3D 微倾斜玻璃卡片、滑动胶囊切换器（令牌直连 / 服务地址直连）、流光提交按钮。
- **控制台**：不再全屏铺满，外层为环境背景 + 居中圆角磨砂大卡片（`AppShell` → `GlassPanel`）。
- **二/三级栏目**：强制单行不换行（`.nowrap-item`），超长标题以省略号收尾并保留 `title` 提示。

## 目录结构

```
src/
├── components/
│   ├── layout/
│   │   ├── ambient-background.tsx   # 环境背景：光晕 + 波点矩阵 + 噪点
│   │   ├── app-shell.tsx             # 控制台外壳（图标导航栏 + 内容区）
│   │   ├── brand-mark.tsx            # 品牌标识（与 favicon.svg 一致）
│   │   ├── console-columns.tsx       # 二/三级栏目：导航栏 / 列表栏 / 列表卡片
│   │   ├── console-workspace.tsx     # 四栏工作区骨架
│   │   └── glass-panel.tsx           # 拟态磨砂玻璃卡片 + 聚光灯交互
│   ├── recipes/                     # 食谱表单 / 批量导入 / AI 导入 / 源码弹窗
│   ├── snapshots/                   # 通用快照编辑弹窗
│   └── ui/                          # shadcn 风格基础组件
├── lib/
│   ├── api.ts                       # 后端接口封装 + 令牌 / 服务地址管理
│   ├── console-store.tsx            # 平台级数据状态（真实后端优先，演示数据兜底）
│   ├── console-data.ts              # 演示数据与规则常量
│   └── types.ts / format.ts / utils.ts
└── pages/
    ├── login.tsx                    # 登录页
    ├── overview.tsx                 # 全局概览
    ├── snapshots.tsx                # 快照库
    ├── recipes.tsx                  # 食谱业务中台
    ├── notes.tsx                    # 随手备忘工作台
    ├── schema.tsx                   # 表结构与字段校验
    └── endpoints.tsx                # 客户端端点与同步通道
```

## 环境变量

复制 `.env.example` 为 `.env`：

```bash
# 本地开发时指向远程后端（留空则使用同源 /admin 接口）
VITE_API_BASE=https://sync.lzyszds.cn
```

## 本地开发

```bash
npm install
npm run dev      # http://localhost:8989/console
npm run build    # 产物输出到 dist/
npm run preview
```

Vite 已配置 `/admin` 与 `/uploads` 代理到 `https://sync.lzyszds.cn`，本地开发无需额外部署后端。

## 登录方式

1. **令牌直连**：粘贴管理员令牌（Admin Token）即可进入工作台。
2. **服务地址直连**：可自定义接入的后端地址，令牌校验通过后按该地址拉取数据。

勾选「在本机记住管理员令牌」时令牌写入 `localStorage`，否则仅保留在当前会话的 `sessionStorage`。

## 部署

构建后 `dist/` 目录部署到站点 `/console/` 路径下（`vite.config.ts` 中 `base: "/console"`）。

## SEO

`index.html` 已配置完整的 SEO 元信息：title / description / keywords / robots / canonical、Open Graph、Twitter Card、JSON-LD（SoftwareApplication）结构化数据，并提供 `favicon.svg`、`manifest.webmanifest`、`robots.txt`。
`src/App.tsx` 中的 `RouteMeta` 会按路由动态更新 `document.title` 与描述。
