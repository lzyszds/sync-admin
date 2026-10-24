// 萌厨多端数据控制台 · 核心数据模型与预置真实业务数据 (全中文)

export interface IngredientItem {
  name: string
  amount: string
}

export interface StructuredIngredients {
  主料: IngredientItem[]
  辅料: IngredientItem[]
  调味料: IngredientItem[]
}

export interface CraftRecipe {
  id: string
  name: string
  category: string
  difficulty: "简单" | "中等" | "进阶"
  cookTime: number
  dotColor: string
  description: string
  ingredients: StructuredIngredients
  steps: { text: string; done: boolean }[]
  tips: string
  sync_status: string
  client_version: string
  updatedAt: string
}

export interface CraftNote {
  id: string
  name: string
  category: string
  updatedAt: string
  dotColor: string
  relatedRecipe: string
  description: string
  tasks: { item: string; owner: string; status: string }[]
  checklist: { text: string; done: boolean }[]
}

export interface CraftRule {
  id: string
  name: string
  field: string
  type: string
  expression: string
  desc: string
  enabled: boolean
  passedRate: string
}

// 预置 6 道煎炒类精品家常菜数据（严格遵循：主料、辅料、调味料三分组，精确中文单位）
export const initialRecipes: CraftRecipe[] = [
  {
    id: "rec_101",
    name: "生炒排骨",
    category: "粤式小炒",
    difficulty: "中等",
    cookTime: 22,
    dotColor: "#F97316", // 橙点
    description: "焦香四溢的生炒排骨，肉质紧实弹牙，酱汁浓郁裹满每一块骨肉。",
    ingredients: {
      主料: [{ name: "新鲜猪肋排", amount: "450克" }],
      辅料: [
        { name: "独头蒜", amount: "35克" },
        { name: "生姜片", amount: "15克" },
        { name: "青红美人椒", amount: "40克" },
        { name: "香葱段", amount: "20克" },
      ],
      调味料: [
        { name: "花生油", amount: "25毫升" },
        { name: "生抽", amount: "2勺" },
        { name: "老抽", amount: "0.5勺" },
        { name: "蚝油", amount: "1勺" },
        { name: "广东米酒", amount: "20毫升" },
        { name: "白砂糖", amount: "5克" },
      ],
    },
    steps: [
      { text: "猪肋排斩成2.5厘米均匀小段，冷水浸泡15分钟去除血水，用厨房纸彻底吸干表面水分。", done: true },
      { text: "热锅注入25毫升花生油，油温六成热下入排骨，保持中大火持续翻炒8分钟至表面金黄微焦。", done: true },
      { text: "拨开锅中排骨，下入拍扁的独头蒜和姜片爆出浓郁蒜香，沿锅边烹入20毫升广东米酒激香。", done: false },
      { text: "加入2勺生抽、0.5勺老抽、1勺蚝油与5克白砂糖翻炒上色，盖上锅盖小火焗焖6分钟。", done: false },
      { text: "开盖转大火下入青红美人椒片与香葱段，快速翻炒45秒至汤汁浓稠紧裹排骨即可出锅。", done: false },
    ],
    tips: "生炒排骨的核心在于“生炒不焯水”，排骨洗净后务必彻底吸干水分，直接下锅慢煸才能锁住骨肉原香。",
    sync_status: "已实时同步",
    client_version: "苹果端 v1.8.2",
    updatedAt: "2026年5月18日 14:22",
  },
  {
    id: "rec_102",
    name: "川味回锅肉",
    category: "川湘家常",
    difficulty: "中等",
    cookTime: 25,
    dotColor: "#EF4444", // 红点
    description: "肥而不腻的二刀肉煸出灯盏窝，郫县豆瓣与蒜苗交织出地道川香。",
    ingredients: {
      主料: [{ name: "猪后腿二刀肉", amount: "350克" }],
      辅料: [
        { name: "红根青蒜苗", amount: "120克" },
        { name: "生姜片", amount: "15克" },
        { name: "大蒜瓣", amount: "20克" },
      ],
      调味料: [
        { name: "菜籽油", amount: "15毫升" },
        { name: "郫县红油豆瓣酱", amount: "1.5勺" },
        { name: "永川豆豉", amount: "8克" },
        { name: "甜面酱", amount: "0.5勺" },
        { name: "酱油", amount: "1勺" },
        { name: "料酒", amount: "15毫升" },
      ],
    },
    steps: [
      { text: "整块猪二刀肉冷水下锅，加入姜片与15毫升料酒，中火煮15分钟至八成熟，捞出晾凉切2毫米薄片。", done: true },
      { text: "青蒜苗洗净，蒜白部分用刀轻轻拍裂后斜刀切成3厘米马耳朵段，蒜叶切段分开备用。", done: true },
      { text: "净锅烧热注入15毫升菜籽油，下入肉片中小火慢煸4分钟，直至肉片吐油卷曲呈标准“灯盏窝”状。", done: true },
      { text: "将肉片拨至锅边，利用底油下入1.5勺剁细的郫县豆瓣酱与8克豆豉，小火炒出红油与脂香。", done: false },
      { text: "调入0.5勺甜面酱与1勺酱油炒匀，先下蒜白大火翻炒30秒，再下蒜叶断生15秒即可起锅。", done: false },
    ],
    tips: "豆瓣酱一定要先用刀剁细，并在底油中小火慢炒出红油，切忌大火以免焦糊发苦。",
    sync_status: "已实时同步",
    client_version: "安卓端 v1.8.0",
    updatedAt: "2026年5月18日 13:50",
  },
  {
    id: "rec_103",
    name: "黄金番茄炒蛋",
    category: "国民快手菜",
    difficulty: "简单",
    cookTime: 10,
    dotColor: "#22C55E", // 绿点
    description: "蓬松柔嫩的鸡蛋吸满酸甜浓郁的沙瓤番茄汁，色泽金红超下饭。",
    ingredients: {
      主料: [
        { name: "土鸡蛋", amount: "4个" },
        { name: "沙瓤红番茄", amount: "320克" },
      ],
      辅料: [
        { name: "小葱花", amount: "15克" },
        { name: "蒜末", amount: "8克" },
      ],
      调味料: [
        { name: "玉米油", amount: "30毫升" },
        { name: "细盐", amount: "4克" },
        { name: "白砂糖", amount: "6克" },
        { name: "温水", amount: "15毫升" },
      ],
    },
    steps: [
      { text: "4个土鸡蛋打入碗中，加入1克细盐和15毫升温水，用筷子朝同一方向充分搅打至表面起丰富泡沫。", done: true },
      { text: "沙瓤番茄顶部划十字花刀，沸水烫20秒剥去外皮，一半切成滚刀块，另一半切碎丁以利出沙。", done: true },
      { text: "热锅倒入20毫升玉米油烧至七成热，淋入蛋液快速滑炒15秒至蓬松凝固成大块，立即盛出备用。", done: true },
      { text: "锅留10毫升底油爆香蒜末，先下番茄丁大火翻炒1分钟至软烂出红汁，再放入番茄块翻炒。", done: false },
      { text: "调入3克细盐与6克白砂糖中和酸度，倒回炒好的鸡蛋块翻炒20秒让蛋块吸饱汤汁，撒葱花出锅。", done: false },
    ],
    tips: "鸡蛋液里加一勺温水打发，炒出来的鸡蛋质地会格外蓬松柔嫩；番茄一半切丁出汁一半切块保证口感。",
    sync_status: "已实时同步",
    client_version: "桌面端 v2.0.1",
    updatedAt: "2026年5月17日 18:10",
  },
  {
    id: "rec_104",
    name: "小炒黄牛肉",
    category: "川湘家常",
    difficulty: "进阶",
    cookTime: 12,
    dotColor: "#F59E0B",
    description: "大火猛炒几十秒出锅，牛肉细嫩多汁，野山椒与蒜香辛辣开胃。",
    ingredients: {
      主料: [{ name: "牛吊龙肉", amount: "300克" }],
      辅料: [
        { name: "红泡椒与野山椒", amount: "40克" },
        { name: "香菜段", amount: "30克" },
        { name: "独蒜碎", amount: "20克" },
      ],
      调味料: [
        { name: "菜籽油", amount: "35毫升" },
        { name: "生抽", amount: "1.5勺" },
        { name: "蚝油", amount: "1勺" },
        { name: "玉米淀粉", amount: "5克" },
        { name: "白胡椒粉", amount: "2克" },
      ],
    },
    steps: [
      { text: "牛吊龙顶丝切薄片，加入生抽、白胡椒粉、玉米淀粉与少许清水抓匀上浆，最后封10毫升油锁水。", done: true },
      { text: "野山椒切碎，大蒜切碎，香菜切长段备用。", done: true },
      { text: "锅烧至九成热冒青烟，下25毫升菜籽油，滑入牛肉片猛火爆炒20秒至八成熟迅速盛出。", done: false },
      { text: "锅留底油爆香野山椒与蒜碎，调入1勺蚝油，倒回牛肉与香菜大火爆炒10秒翻匀出锅。", done: false },
    ],
    tips: "牛肉必须顶丝逆着纹理切，热锅宽油大火快炒，全程在锅里时间切勿超过35秒，以免牛肉脱水变柴。",
    sync_status: "已实时同步",
    client_version: "苹果端 v1.8.2",
    updatedAt: "2026年5月16日 20:05",
  },
  {
    id: "rec_105",
    name: "干煸四季豆",
    category: "川湘家常",
    difficulty: "中等",
    cookTime: 18,
    dotColor: "#10B981",
    description: "豆角起皱微焦，肉末酥香，碎米芽菜与干辣椒焦香扑鼻。",
    ingredients: {
      主料: [
        { name: "脆嫩四季豆", amount: "350克" },
        { name: "猪肉末", amount: "80克" },
      ],
      辅料: [
        { name: "宜宾碎米芽菜", amount: "30克" },
        { name: "干红辣椒段", amount: "10克" },
        { name: "大红袍花椒", amount: "3克" },
        { name: "蒜粒", amount: "15克" },
      ],
      调味料: [
        { name: "食用油", amount: "25毫升" },
        { name: "生抽", amount: "1勺" },
        { name: "细盐", amount: "2克" },
        { name: "料酒", amount: "10毫升" },
      ],
    },
    steps: [
      { text: "四季豆撕去老筋折成小段，洗净后彻底擦干表面水珠以防爆油。", done: true },
      { text: "热锅倒油下四季豆，中小火慢煸6分钟至表皮均匀起虎皮皱纹，熟透后捞出沥油。", done: true },
      { text: "锅内留少许底油下肉末煸干水分，加入蒜碎、干辣椒段、花椒粒炒出焦香。", done: false },
      { text: "下入宜宾碎米芽菜翻炒出酱香味，烹入10毫升料酒去腥。", done: false },
      { text: "倒回四季豆，调入生抽与盐，大火翻炒1分钟入味即可起锅装盘。", done: false },
    ],
    tips: "四季豆必须彻底煸熟至起皱变软，未熟的四季豆含有皂素可能引起不适；干煸时火候不宜太大。",
    sync_status: "已实时同步",
    client_version: "安卓端 v1.8.0",
    updatedAt: "2026年5月15日 17:30",
  },
  {
    id: "rec_106",
    name: "蒜香香煎带鱼",
    category: "江浙风味",
    difficulty: "中等",
    cookTime: 20,
    dotColor: "#EC4899",
    description: "金黄酥脆不破皮，蒜香与葱姜渗透每一丝鱼肉，鲜香不腥。",
    ingredients: {
      主料: [{ name: "鲜切带鱼段", amount: "400克" }],
      辅料: [
        { name: "大蒜瓣", amount: "30克" },
        { name: "生姜厚片", amount: "20克" },
        { name: "香葱节", amount: "25克" },
      ],
      调味料: [
        { name: "花生油", amount: "30毫升" },
        { name: "料酒", amount: "20毫升" },
        { name: "生抽", amount: "1.5勺" },
        { name: "细盐", amount: "4克" },
        { name: "白胡椒粉", amount: "2克" },
      ],
    },
    steps: [
      { text: "带鱼洗净内脏黑膜，表面划一字浅花刀，加姜片、料酒、盐、胡椒粉腌制15分钟，吸干水份。", done: true },
      { text: "平底锅烧热后用姜片擦拭锅底，倒入花生油下蒜瓣与葱节爆出底香后夹出。", done: false },
      { text: "平铺带鱼段，中火煎制3分钟至底面金黄硬挺后再小心翻面。", done: false },
      { text: "另一面继续煎制2.5分钟至双面金黄酥脆，沿锅边淋入半勺生抽激香即可出锅。", done: false },
    ],
    tips: "煎鱼不破皮的秘诀：带鱼表面水分必须吸干，锅热油热下鱼，煎至定型金黄前切忌频繁翻动。",
    sync_status: "已实时同步",
    client_version: "苹果端 v1.8.2",
    updatedAt: "2026年5月14日 12:15",
  },
]

// 随手笔记预置数据
export const initialNotes: CraftNote[] = [
  {
    id: "note_201",
    name: "蒜末冷冻保鲜技巧",
    category: "备菜心得",
    updatedAt: "2026年5月18日 10:20",
    dotColor: "#22C55E",
    relatedRecipe: "生炒排骨",
    description: "一次剥好两头大蒜打成粗粒，平铺在保鲜袋里压出网格冷冻，随取随用不串味。",
    tasks: [
      { item: "采购紫皮独头蒜 500克", owner: "手机端同步", status: "已完成" },
      { item: "料理机点动搅打 3 秒成粗颗粒", owner: "厨房记录", status: "已完成" },
      { item: "装入密封袋用刀背压出小方块冷冻", owner: "厨房记录", status: "进行中" },
    ],
    checklist: [
      { text: "控干大蒜表面水分防止结冰坨", done: true },
      { text: "滴入几滴熟菜籽油锁住蒜香", done: true },
      { text: "炒菜时无需解冻直接下锅爆香", done: false },
    ],
  },
  {
    id: "note_202",
    name: "牛肉上浆与滑油温度实测",
    category: "火候测试",
    updatedAt: "2026年5月17日 16:45",
    dotColor: "#F59E0B",
    relatedRecipe: "小炒黄牛肉",
    description: "牛肉加少许蛋清与水淀粉抓匀，封油静置后下入七成热油锅滑散，肉质最嫩。",
    tasks: [
      { item: "油温 160°C 测试（滑炒 20 秒）", owner: "实测记录", status: "肉嫩多汁" },
      { item: "油温 200°C 测试（滑炒 15 秒）", owner: "实测记录", status: "焦香但略紧" },
    ],
    checklist: [
      { text: "抓水时务必朝同一方向搅打至起胶", done: true },
      { text: "入锅后先不要动，待底部定型再划散", done: true },
    ],
  },
  {
    id: "note_203",
    name: "冬瓜焖煮时间与厚度记录",
    category: "火候测试",
    updatedAt: "2026年5月16日 17:45",
    dotColor: "#F97316",
    relatedRecipe: "黄金番茄炒蛋",
    description: "切厚片冬瓜先煎后焖，控制在 8 分钟左右口感最佳，软烂入味又不散形。",
    tasks: [
      { item: "薄片清炒（约 1.5 厘米）", owner: "实测记录", status: "4 分钟断生" },
      { item: "厚块红烧（约 3 厘米）", owner: "实测记录", status: "8 分钟软透" },
    ],
    checklist: [
      { text: "削皮时多去一层青皮更容易煮透", done: true },
      { text: "出锅前撒白胡椒粉提鲜", done: false },
    ],
  },
]

// 表级字段规则与校验规则列表 (来自 datahub.html)
export const recipeRules: CraftRule[] = [
  {
    id: "rule_enum_diff",
    name: "烹饪难度枚举强约束",
    field: "difficulty",
    type: "枚举强约束 (ENUM)",
    expression: "约束检查 (difficulty 必须属于 ['简单', '中等', '进阶'])",
    desc: "强制限制食谱烹饪难度仅允许合法枚举值，拒绝非法字符串写入。",
    enabled: true,
    passedRate: "100%",
  },
  {
    id: "rule_json_ing",
    name: "食材三分组与精确单位结构规范",
    field: "ingredients (结构化数据)",
    type: "结构规范校验 (SCHEMA)",
    expression: "必须包含 ['主料', '辅料', '调味料'] 且数量单位符合正规格式 (/^[0-9.]+(克|毫升|勺|个|根|瓣)$/)",
    desc: "校验食材必须划分为主料、辅料、调味料三个数组，且每项食材用量必须带精确中文度量单位（克/毫升/勺等），拒绝“少许/适量”。",
    enabled: true,
    passedRate: "100%",
  },
  {
    id: "rule_desc_len",
    name: "25字风味描述黄金长度约束",
    field: "description",
    type: "写入前触发器 (BEFORE TRIGGER)",
    expression: "字符长度 (description) 介于 15 与 38 字之间",
    desc: "确保移动端食谱瀑布流排版整齐美观，风味描述控制在 25 字左右的黄金阅读长度。",
    enabled: true,
    passedRate: "98.4%",
  },
  {
    id: "rule_ban_ingredient",
    name: "品类过滤规则（煎炒特化与黑名单）",
    field: "name, ingredients",
    type: "业务领域规则 (DOMAIN RULE)",
    expression: "名称与配料不包含豆腐类食材，烹饪方式聚焦煎、炒、煸、焖",
    desc: "当前客户端专题食谱库聚焦煎炒家常菜肴，自动过滤黑名单食材并校验烹饪技法。",
    enabled: true,
    passedRate: "100%",
  },
  {
    id: "rule_mobile_webhook",
    name: "移动客户端增量同步推送触发器",
    field: "updatedAt, sync_status",
    type: "提交后钩子 (AFTER COMMIT HOOK)",
    expression: "推送增量数据包至云同步分发通道 (WebSocket / REST API)",
    desc: "当后台修改或新增食谱后，毫秒级推送增量补丁至苹果端与安卓端应用。",
    enabled: true,
    passedRate: "99.9%",
  },
]
