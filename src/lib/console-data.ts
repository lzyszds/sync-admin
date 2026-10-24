// 云控后台 · 平台级配置与数据编解码（全部中文字段）
import type {
  AppStat,
  ConsoleColumn,
  ConsoleEndpoint,
  ConsoleNote,
  ConsoleRule,
  Difficulty,
  Ingredient,
  IngredientGroup,
  Overview,
  Recipe,
  RecipeStep,
  Snapshot,
  SyncLog,
} from "@/lib/types"
import { initialRecipes } from "@/lib/craft-data"

/** 演示用平台概览（后端不可用时的本地回退） */
export const DEMO_OVERVIEW: Overview = {
  ok: true,
  service: "云控后台",
  version: "2.4.0",
  totalSnapshots: 1286,
  totalApps: 3,
  dataSize: "48.6 MB",
  lastUpdated: "2026-05-18 14:22:10",
}

/** 演示用应用租户 */
export const DEMO_APPS: AppStat[] = [
  { app: "recipe", count: 842, lastUpdated: "2026-05-18 14:22:10", dataSize: "31.2 MB" },
  { app: "notes", count: 406, lastUpdated: "2026-05-18 10:20:00", dataSize: "14.8 MB" },
  { app: "custom", count: 38, lastUpdated: "2026-05-16 09:05:44", dataSize: "2.6 MB" },
]

/** 演示用快照列表 */
export const DEMO_SNAPSHOTS: Snapshot[] = [
  {
    app: "recipe",
    tokenHash: "a7f3c9e21b8d4056",
    tokenPrefix: "a7f3c9e2",
    updatedAt: "2026-05-18 14:22:10",
    dataBytes: 18642,
    preview: '{"recipes": [...]}',
  },
  {
    app: "recipe",
    tokenHash: "5d2e8b17c4a903f2",
    tokenPrefix: "5d2e8b17",
    updatedAt: "2026-05-18 13:50:42",
    dataBytes: 16310,
    preview: '{"recipes": [...]}',
  },
  {
    app: "recipe",
    tokenHash: "c9037f4a6e1b28d5",
    tokenPrefix: "c9037f4a",
    updatedAt: "2026-05-17 19:15:03",
    dataBytes: 14288,
    preview: '{"recipes": [...]}',
  },
  {
    app: "notes",
    tokenHash: "f18b62d05a7c3e94",
    tokenPrefix: "f18b62d0",
    updatedAt: "2026-05-18 10:20:00",
    dataBytes: 9318,
    preview: '{"notes": [...]}',
  },
  {
    app: "notes",
    tokenHash: "2b7e40c9a5d81f36",
    tokenPrefix: "2b7e40c9",
    updatedAt: "2026-05-17 16:45:28",
    dataBytes: 8102,
    preview: '{"notes": [...]}',
  },
  {
    app: "custom",
    tokenHash: "9e04d7b3c8a21f58",
    tokenPrefix: "9e04d7b3",
    updatedAt: "2026-05-16 09:05:44",
    dataBytes: 5412,
    preview: '{"custom": [...]}',
  },
]

/** 演示食谱（转换为统一 Recipe 结构） */
export function demoRecipes(): Recipe[] {
  return initialRecipes.map((r) => ({
    id: r.id,
    name: r.name,
    category: r.category,
    cookTime: r.cookTime,
    difficulty: (r.difficulty === "简单" ? "easy" : r.difficulty === "中等" ? "medium" : "hard") as Difficulty,
    description: r.description,
    coverImage: "",
    tips: r.tips,
    ingredients: [
      ...r.ingredients.主料.map((i) => ({ ...i, group: "主料" as IngredientGroup })),
      ...r.ingredients.辅料.map((i) => ({ ...i, group: "辅料" as IngredientGroup })),
      ...r.ingredients.调味料.map((i) => ({ ...i, group: "调味料" as IngredientGroup })),
    ],
    steps: r.steps.map((s, index) => ({ order: index + 1, description: s.text, done: s.done })),
    aiGenerated: false,
    createdAt: r.updatedAt,
    updatedAt: r.updatedAt,
  }))
}


/** 食材分组常量 */
export const INGREDIENT_GROUPS: IngredientGroup[] = ["主料", "辅料", "调味料"]

/** 分组配色（与工作台视觉一致） */
export const GROUP_STYLE: Record<IngredientGroup, { color: string; icon: string; label: string }> = {
  主料: { color: "#B45309", icon: "🥩", label: "主料（决定成菜主体）" },
  辅料: { color: "#6D28D9", icon: "🧄", label: "辅料（补充香气层次）" },
  调味料: { color: "#047857", icon: "🧂", label: "调味料（调味上色）" },
}

/** 难度中文标签 */
export const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  easy: "简单",
  medium: "中等",
  hard: "进阶",
}

/** 调味料特征词，用于缺失分组时的推断 */
const SEASONING_HINTS = [
  "盐",
  "油",
  "酱",
  "醋",
  "糖",
  "酒",
  "胡椒",
  "粉",
  "汁",
  "淀粉",
  "鸡精",
  "味精",
  "花椒",
  "孜然",
  "辣椒面",
  "十三香",
]

/** 推断食材所属分组 */
export function guessIngredientGroup(name: string, index: number, total: number): IngredientGroup {
  const n = name || ""
  if (SEASONING_HINTS.some((hint) => n.includes(hint))) return "调味料"
  if (index === 0) return "主料"
  if (total <= 2) return index === 1 ? "辅料" : "主料"
  if (index < Math.min(2, total - 1)) return "主料"
  return "辅料"
}

/** 将扁平食材列表归入三分组 */
export function groupIngredients(ingredients: Ingredient[]): Record<IngredientGroup, Ingredient[]> {
  const result: Record<IngredientGroup, Ingredient[]> = { 主料: [], 辅料: [], 调味料: [] }
  const list = ingredients || []
  list.forEach((item, index) => {
    const group = item.group && INGREDIENT_GROUPS.includes(item.group) ? item.group : guessIngredientGroup(item.name, index, list.length)
    result[group].push({ ...item, group })
  })
  return result
}

/** 将三分组拍平回列表（保持主料 → 辅料 → 调味料顺序） */
export function flattenIngredientGroups(groups: Record<IngredientGroup, Ingredient[]>): Ingredient[] {
  return [...groups.主料, ...groups.辅料, ...groups.调味料].map((item) => ({
    name: item.name.trim(),
    amount: item.amount.trim(),
    group: item.group,
  }))
}

/** 解析「名称:用量」多行文本 */
export function parseIngredientLines(text: string): Ingredient[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const parts = line.split(/[:：]/)
      return { name: (parts[0] || "").trim(), amount: (parts[1] || "").trim() }
    })
}

/** 三分组转为「名称:用量」多行文本 */
export function ingredientLines(items: Ingredient[] | undefined): string {
  return (items || []).map((item) => `${item.name}:${item.amount}`).join("\n")
}

/** 中文键位的结构化食谱负载（用于源码视图与源码编辑） */
export interface ConsoleRecipePayload {
  编号: string
  名称: string
  分类: string
  难度: string
  烹饪时长: number
  描述: string
  食材: Record<IngredientGroup, { 名称: string; 用量: string }[]>
  步骤: string[]
  小贴士: string
  同步状态: string
  客户端版本: string
  更新时间: string
}

/** Recipe → 中文结构化负载 */
export function toConsolePayload(recipe: Recipe): ConsoleRecipePayload {
  const groups = groupIngredients(recipe.ingredients)
  const toItems = (list: Ingredient[]) => list.map((i) => ({ 名称: i.name, 用量: i.amount }))
  return {
    编号: recipe.id,
    名称: recipe.name || "",
    分类: recipe.category || "家常菜",
    难度: DIFFICULTY_LABEL[recipe.difficulty] || "简单",
    烹饪时长: Number(recipe.cookTime) || 15,
    描述: recipe.description || "",
    食材: {
      主料: toItems(groups.主料),
      辅料: toItems(groups.辅料),
      调味料: toItems(groups.调味料),
    },
    步骤: (recipe.steps || []).map((s) => s.description),
    小贴士: recipe.tips || "",
    同步状态: "已同步",
    客户端版本: "桌面端 v2.4",
    更新时间: recipe.updatedAt || "",
  }
}

/** 中文结构化负载 → Recipe 补丁 */
export function fromConsolePayload(payload: Partial<ConsoleRecipePayload>): Partial<Recipe> {
  const difficultyMap: Record<string, Difficulty> = { 简单: "easy", 中等: "medium", 进阶: "hard", 困难: "hard" }
  const ing = payload.食材 || ({} as ConsoleRecipePayload["食材"])
  const toItems = (list: { 名称: string; 用量: string }[] | undefined, group: IngredientGroup): Ingredient[] =>
    (list || []).map((i) => ({ name: i.名称, amount: i.用量, group }))
  const ingredients: Ingredient[] = [
    ...toItems(ing.主料, "主料"),
    ...toItems(ing.辅料, "辅料"),
    ...toItems(ing.调味料, "调味料"),
  ]
  const steps: RecipeStep[] = (payload.步骤 || []).map((text, index) => ({ order: index + 1, description: text }))
  return {
    name: payload.名称,
    category: payload.分类,
    difficulty: difficultyMap[payload.难度 || ""] || "easy",
    cookTime: Number(payload.烹饪时长) || 15,
    description: payload.描述,
    ingredients,
    steps,
    tips: payload.小贴士,
  }
}

/** 平台级字段校验规则 */
export const CONSOLE_RULES: ConsoleRule[] = [
  {
    id: "规则-01",
    scope: "食谱",
    name: "难度枚举强约束",
    field: "难度",
    type: "枚举约束",
    expression: "难度 ∈ { 简单, 中等, 进阶 }",
    desc: "强制限制烹饪难度仅允许三个标准枚举值，拒绝任意字符串写入。",
    enabled: true,
    passedRate: "100%",
  },
  {
    id: "规则-02",
    scope: "食谱",
    name: "食材三分组与精确单位校验",
    field: "食材（结构化数据）",
    type: "结构校验",
    expression: "必须包含【主料 / 辅料 / 调味料】，且用量需匹配 数字+(克|毫升|勺|个|根|瓣|片)",
    desc: "校验食材必须拆分为三组，每项用量必须带精确中文度量单位，禁止“少许、适量”这类模糊描述。",
    enabled: true,
    passedRate: "100%",
  },
  {
    id: "规则-03",
    scope: "食谱",
    name: "描述字数风味摘要触发器",
    field: "描述",
    type: "写入前后触发器",
    expression: "描述字数介于 15 ~ 38 字之间",
    desc: "确保移动端食谱卡片瀑布流排版整齐，描述控制在 25 字黄金阅读长度左右。",
    enabled: true,
    passedRate: "98.4%",
  },
  {
    id: "规则-04",
    scope: "食谱",
    name: "品类过滤规则（煎炒特化与食材黑名单）",
    field: "名称, 食材",
    type: "领域规则",
    expression: "不含「豆腐」，且烹饪技法 ∈ { 煎, 炒, 焖烧 }",
    desc: "当前客户端专题食谱库聚焦煎炒风味菜肴，自动拦截黑名单食材并校验烹饪技法。",
    enabled: true,
    passedRate: "100%",
  },
  {
    id: "规则-05",
    scope: "食谱",
    name: "移动端增量同步推送钩子",
    field: "更新时间, 同步状态",
    type: "提交后钩子",
    expression: "增量补丁推送至 食谱应用接口 /v2/增量同步",
    desc: "当后台修改或新增食谱后，毫秒级推送增量数据至苹果端与安卓端客户端。",
    enabled: true,
    passedRate: "99.9%",
  },
  {
    id: "规则-06",
    scope: "笔记",
    name: "全文检索索引",
    field: "标题, 内容",
    type: "中文分词索引",
    expression: "对「标题 + 内容」建立中文全文检索索引",
    desc: "支持桌面端与移动端毫秒级全文检索与标签高亮过滤。",
    enabled: true,
    passedRate: "100%",
  },
  {
    id: "规则-07",
    scope: "笔记",
    name: "多端离线冲突合并策略",
    field: "版本向量, 更新时间",
    type: "冲突解决",
    expression: "基于字符级冲突合并算法自动无损合并",
    desc: "当手机端与电脑端同时编辑同一篇云笔记时，基于字符级合并策略自动处理冲突。",
    enabled: true,
    passedRate: "100%",
  },
  {
    id: "规则-08",
    scope: "笔记",
    name: "跨表软关联（关联食谱）",
    field: "关联食谱",
    type: "外键软关联",
    expression: "关联至 食谱表.编号，更新时级联刷新",
    desc: "允许在云笔记中直接挂载绑定食谱表记录，实现研发试菜笔记与正式食谱联动。",
    enabled: true,
    passedRate: "100%",
  },
]

/** 平台级表结构定义 */
export const CONSOLE_SCHEMAS: Record<string, ConsoleColumn[]> = {
  食谱表: [
    { field: "编号", type: "文本（主键）", constraint: "唯一，长度不超过 32 位", desc: "食谱记录唯一标识" },
    { field: "名称", type: "短文本", constraint: "必填，长度不超过 64 位", desc: "规范中文菜名" },
    { field: "分类", type: "短文本", constraint: "必填，限定菜系枚举", desc: "菜系分类" },
    { field: "难度", type: "枚举", constraint: "必填，限定简单/中等/进阶", desc: "烹饪难度" },
    { field: "烹饪时长", type: "整数", constraint: "必填，取值 1 ~ 240 分钟", desc: "实际操作耗时" },
    { field: "描述", type: "短文本", constraint: "必填，长度 15 ~ 38 字", desc: "风味口感摘要" },
    { field: "食材", type: "结构化数据", constraint: "必填，必须包含主料/辅料/调味料", desc: "精确用量食材明细" },
    { field: "步骤", type: "文本列表", constraint: "必填，至少 3 条", desc: "标准烹饪步骤" },
    { field: "小贴士", type: "长文本", constraint: "选填", desc: "关键火候与调味要点" },
    { field: "同步状态", type: "短文本", constraint: "默认已同步", desc: "移动端下发状态" },
    { field: "更新时间", type: "时间戳", constraint: "默认当前时间", desc: "最后修改时间" },
  ],
  笔记表: [
    { field: "编号", type: "文本（主键）", constraint: "唯一", desc: "笔记记录唯一标识" },
    { field: "标题", type: "短文本", constraint: "必填", desc: "笔记标题" },
    { field: "标签", type: "短文本", constraint: "限定四个标签枚举", desc: "笔记分类标签" },
    { field: "置顶", type: "布尔", constraint: "默认否", desc: "是否置顶显示" },
    { field: "来源设备", type: "短文本", constraint: "苹果端/安卓端/桌面网页", desc: "最后一次编辑来源" },
    { field: "关联食谱", type: "文本（软关联）", constraint: "可为空，关联食谱表编号", desc: "跨表挂载的食谱" },
    { field: "内容", type: "长文本", constraint: "必填，支持轻量标记语法", desc: "笔记正文" },
    { field: "更新时间", type: "时间戳", constraint: "默认当前时间", desc: "最后修改时间" },
  ],
}

/** 客户端接入端点 */
export const CONSOLE_ENDPOINTS: ConsoleEndpoint[] = [
  {
    name: "多端数据快照读写",
    method: "读取 / 写入",
    path: "/后台接口/快照",
    desc: "集中式管理各客户端推送上来的全量云备份数据，支持按应用租户检索与原始负载维护。",
    kind: "常规接口",
  },
  {
    name: "食谱业务逻辑读写",
    method: "读取 / 写入",
    path: "/后台接口/快照/{应用}/{用户令牌}/食谱",
    desc: "食谱中台的增删改查通道，内置食材三分组与精确用量的写入校验中间件。",
    kind: "常规接口",
  },
  {
    name: "随手记长连接通道",
    method: "长连接",
    path: "/实时/笔记同步",
    desc: "多端随手记双向长连接，支持离线编辑冲突合并与跨表引用解析。",
    kind: "长连接通道",
  },
  {
    name: "智能结构化解析",
    method: "写入",
    path: "/后台接口/智能解析",
    desc: "将自然语言菜谱文本解析为高结构化的食谱数据，支持任意兼容开放接口规范的模型服务。",
    kind: "智能服务",
  },
]

/** 同步事件日志 */
export const SYNC_LOGS: SyncLog[] = [
  { time: "14:22:11", event: "食谱更新", target: "苹果端推送网关", status: 200, latency: "18 毫秒", size: "1.4 KB" },
  { time: "14:19:04", event: "笔记冲突合并", target: "多端同步任务", status: 200, latency: "11 毫秒", size: "2.1 KB" },
  { time: "13:50:43", event: "食谱新增", target: "安卓端推送主题", status: 200, latency: "24 毫秒", size: "1.6 KB" },
  { time: "12:15:10", event: "结构校验", target: "写入前触发器", status: 200, latency: "4 毫秒", size: "0.8 KB" },
  { time: "11:02:55", event: "写入拦截", target: "写入前触发器", status: 422, latency: "3 毫秒", size: "0.5 KB" },
]

/** 演示用随手备忘记载（后端不可用时的本地回退） */
export const DEMO_NOTES: ConsoleNote[] = [
  {
    id: "笔记-201",
    title: "生炒排骨研发试菜参数调整记录",
    tag: "#食谱研发",
    pinned: true,
    device: "苹果端",
    linkedRecipe: "rec_101",
    updatedAt: "2026-05-14 14:25:00",
    content: `### 研发测试目标
验证 **生炒排骨** 在不焯水前提下的最佳火候曲线与调味比例，确保移动端用户在家用燃气灶上完整复刻。

### 关键实验结论
1. **排骨预处理**：猪肋排斩成 \`2.5厘米\` 小段最佳，冷水浸泡 15 分钟后必须用厨房纸彻底吸干水分。
2. **油脂与酒类搭配**：
   - 使用 **花生油 25毫升** 增香明显优于玉米油；
   - 锅边烹入 **广东米酒 20毫升** 能够瞬间带走腥气并赋予淡淡米甜味。
3. **结构校验通过**：主料、辅料、调味料已全部切换为精确克数与毫升单位，已同步推送至客户端生产库。`,
  },
  {
    id: "笔记-202",
    title: "客户端离线同步协议与结构规范",
    tag: "#开发笔记",
    pinned: true,
    device: "桌面网页",
    linkedRecipe: "",
    updatedAt: "2026-05-14 11:12:40",
    content: `### 多端同步架构说明
当前后台管理系统同时接管 \`食谱表\` 与 \`笔记表\` 两张核心业务表。

- **食谱表**：采用严格的 **结构强校验**，任何不包含 \`主料\`、\`辅料\`、\`调味料\` 三个标准分组的写入请求都会被触发器拦截。
- **云笔记表**：采用 \`冲突合并 + 最后写入优先\` 混合策略，支持在笔记中直接关联具体食谱记录。`,
  },
  {
    id: "笔记-203",
    title: "川味回锅肉二刀肉选材与刀工备忘",
    tag: "#食谱研发",
    pinned: false,
    device: "苹果端",
    linkedRecipe: "rec_102",
    updatedAt: "2026-05-13 20:15:11",
    content: `### 选材要点
正宗回锅肉首选猪后臀尖上方的 **坐臀肉（二刀肉）**，肥瘦比例约 4:6。

### 烹饪细节
- 煮肉时只需八成熟（筷子刚能扎透无血水渗出即可）；
- 肉片厚度控制在 \`2毫米\`，太薄容易煸成油渣，太厚不易卷曲成“灯盏窝”；
- 红根青蒜苗的蒜白一定要用刀拍裂再斜切，香气释放速度提升一倍。`,
  },
  {
    id: "笔记-204",
    title: "本周家庭采购清单与周末家常菜单规划",
    tag: "#生活备忘",
    pinned: false,
    device: "安卓端",
    linkedRecipe: "rec_103",
    updatedAt: "2026-05-13 16:40:05",
    content: `### 生鲜采购清单
- [x] 新鲜猪肋排 450克（生炒排骨用）
- [x] 沙瓤红番茄 600克 + 土鸡蛋 1盒（黄金番茄炒蛋）
- [x] 二荆条青椒 200克 + 猪里脊 300克
- [ ] 宜宾碎米芽菜 2包、郫县红油豆瓣酱 1罐

> 备注：周末家宴全部采用煎炒快手菜系，控制在 60 分钟内出齐四菜。`,
  },
  {
    id: "笔记-205",
    title: "移动端食谱卡片摘要字数规范",
    tag: "#随手记",
    pinned: false,
    device: "桌面网页",
    linkedRecipe: "rec_104",
    updatedAt: "2026-05-12 09:50:22",
    content: `### 客户端双列瀑布流排版约束
为了保证主流手机屏幕下食谱卡片高度一致：
1. \`描述\` 字段统一触发长度校验，推荐 **22 ~ 30 个汉字**；
2. \`难度\` 徽章配色：
   - \`简单\`: 翠绿
   - \`中等\`: 青色
   - \`进阶\`: 珊瑚红`,
  },
]

/** 笔记标签 */
export const NOTE_TAGS = ["#食谱研发", "#开发笔记", "#生活备忘", "#随手记"]

/** 轻量标记渲染（与预览区一致） */
export function renderNoteMarkdown(md: string): string {
  if (!md) return ""
  const escape = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
  return escape(md)
    .replace(/^### (.*$)/gim, '<div class="font-bold text-craft-ink text-xs mt-1.5 mb-1">$1</div>')
    .replace(/^## (.*$)/gim, '<div class="font-bold text-craft-ink text-sm mt-2 mb-1.5">$1</div>')
    .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-craft-ink underline decoration-craft-ink/25 underline-offset-2">$1</strong>')
    .replace(/`(.*?)`/g, '<code class="px-1.5 py-0.5 rounded bg-white border border-craft-line text-[11px]">$1</code>')
    .replace(/^- \[x\] (.*$)/gim, '<div class="flex items-center gap-1.5 text-emerald-700"><span>☑</span><span class="line-through opacity-70">$1</span></div>')
    .replace(/^- \[ \] (.*$)/gim, '<div class="flex items-center gap-1.5 text-foreground"><span>☐</span><span>$1</span></div>')
    .replace(/^- (.*$)/gim, '<div class="pl-2 border-l border-craft-line text-foreground">· $1</div>')
    .replace(/^&gt; (.*$)/gim, '<div class="pl-2 border-l-2 border-craft-ink text-craft-muted">$1</div>')
    .replace(/\n/g, "<br>")
}

/** 难度徽章配色（行内样式，避免额外依赖） */
export function difficultyBadgeStyle(difficulty: Difficulty): { color: string; background: string; border: string } {
  if (difficulty === "easy") return { color: "#047857", background: "#ECFDF5", border: "#A7F3D0" }
  if (difficulty === "medium") return { color: "#B45309", background: "#FFFBEB", border: "#FDE68A" }
  return { color: "#BE123C", background: "#FFF1F2", border: "#FECDD3" }
}

/** 难度对应的小圆点颜色 */
export function difficultyDot(difficulty: Difficulty): string {
  if (difficulty === "easy") return "#22C55E"
  if (difficulty === "medium") return "#F59E0B"
  return "#EC4899"
}
