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
npm run dev        # http://localhost:8989/console
npm run build      # 产物输出到 dist/
npm run preview
npm run typecheck  # tsc --noEmit
```

Node 版本要求 `^20.19.0 || >=22.12.0`（见 `package.json` 的 `engines` 与 `.nvmrc`，CI 与本地保持一致）。

Vite 已配置 `/admin` 与 `/uploads` 代理到 `https://sync.lzyszds.cn`，本地开发无需额外部署后端。

## 登录方式

1. **令牌直连**：粘贴管理员令牌（Admin Token）即可进入工作台。
2. **服务地址直连**：可自定义接入的后端地址，令牌校验通过后按该地址拉取数据。

勾选「在本机记住管理员令牌」时令牌写入 `localStorage`，否则仅保留在当前会话的 `sessionStorage`。

## 部署

本项目是**纯静态前端**（`npm run build` 产出 `dist/`，无 Node 运行时），采用「CI 构建 + rsync 发布到服务器静态目录」的方式部署，服务器由 Nginx 直接托管。

### 一次性配置

**1. GitHub 仓库变量**（Settings → Secrets and variables → Actions → Variables）

| 变量 | 示例 | 说明 |
| --- | --- | --- |
| `SERVER_HOST` | `101.201.171.168` | 服务器地址 |
| `SERVER_USER` | `root` | SSH 用户 |
| `SERVER_PORT` | `22` | SSH 端口 |
| `DEPLOY_PATH` | `/www/wwwroot/sync.lzyszds.cn/console` | 服务器上存放 `/console/` 静态文件的目录（需与 Nginx `location /console/` 的 `alias` 一致） |
| `DEPLOY_EXCLUDE` | `downloads` | 可选：额外排除的文件/目录（空格分隔），保护非构建产物 |
| `DEPLOY_CHOWN` | `www:www` | 可选：同步后把目标目录属主改为该用户（Nginx worker 通常非 root） |

**2. GitHub 仓库密钥**（Settings → Secrets and variables → Actions → Secrets）

| 密钥 | 说明 |
| --- | --- |
| `SERVER_SSH_KEY` | 服务器 SSH 私钥内容（整段 PEM 文本） |
| `SERVER_KNOWN_HOSTS` | 服务器 host 指纹行，`ssh-keyscan -H 服务器地址` 的输出（可选但推荐，避免中间人劫持） |
| `TG_BOT_TOKEN` / `TG_CHAT_ID` | Telegram 通知（沿用已有配置） |

**3. 服务器侧**

```bash
# 确认 rsync 已安装，且 Nginx 静态目录与 DEPLOY_PATH 一致
apt install rsync
mkdir -p /www/wwwroot/sync.lzyszds.cn/console
```

> `DEPLOY_PATH` 必须与 Nginx 中 `location /console/` 的 `alias` 指向同一目录。
> 可用 `nginx -T | grep -A 20 'server_name sync.lzyszds.cn'` 核对。

### 发布

```bash
# 打 tag 触发自动发布
git tag v2.4.0 && git push origin v2.4.0

# 或在 Actions 页面手动触发（可勾选 dry_run 仅预览）
```

发布流程：构建 → 类型检查 → 上传产物 → 配置 SSH → rsync 同步 → 健康检查 → Telegram 通知。

### 本地手动发布

```bash
npm run build
DEPLOY_HOST=root@101.201.171.168 \
DEPLOY_PATH=/www/wwwroot/sync.lzyszds.cn/console \
DEPLOY_EXCLUDE=downloads \
DEPLOY_CHOWN=www:www \
DEPLOY_HEALTH_URL=https://sync.lzyszds.cn/console/ \
npm run deploy

# 只预览差异，不真正上传
DRY_RUN=1 DEPLOY_HOST=... DEPLOY_PATH=... npm run deploy
```

### 发布要点

- `rsync --delete` 会删除目标目录中多余的旧文件（含旧 hash 的 JS/CSS），保证磁盘上不留残留。
- `DEPLOY_EXCLUDE` 排除的文件**不会**被删除，可保护目标目录里存放的非构建产物（如 `downloads/`）。
- `--delay-updates` 让所有文件传完后统一改名，避免更新过程中出现「HTML 已更新但资源还没到位」的半新半旧状态。
- 健康检查请求**新产物**的 hash 文件名，并校验 `Content-Type` 是 JS —— 只看状态码会被 Nginx 的 SPA 回退骗过（未命中的路径同样返回 200 + HTML）。
- 回滚：重新打一个旧版本 tag 再发布即可。

### 为什么不用 Docker

`dist/` 产物只有 6 个文件、约 640KB（HTML + JS + CSS + 静态资源），无服务端代码，容器化收益为零而成本明确。Docker 更适合有状态、需要持久化卷的后端服务。

## SEO

`index.html` 已配置完整的 SEO 元信息：title / description / keywords / robots / canonical、Open Graph、Twitter Card、JSON-LD（SoftwareApplication）结构化数据，并提供 `favicon.svg`、`manifest.webmanifest`、`robots.txt`。
`src/App.tsx` 中的 `RouteMeta` 会按路由动态更新 `document.title` 与描述。
