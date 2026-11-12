# 宝可梦剑盾风格 SillyTavern HUD 设计文档

> 版本 0.1 · 2026-11-12

---

## 一、目标与范围

### 目标

在弦九原版 `宝可梦HUD状态栏` 插件（v6.0.12）的**数据接口和自动刷新机制**基础上，  
将渲染层完整替换为《宝可梦剑/盾》原版 UI 风格，实现一套可嵌入 SillyTavern 的 HTML 插件。

### 本期范围（v1.0）

| 界面模块 | 状态 |
|--------|------|
| 主菜单（X 菜单 10格宫格） | ✅ 实现 |
| 队伍主界面（6 个成员列表 + 精灵展示区） | ✅ 实现 |
| 队伍精灵详情（5 个 Tab：信息/特性/招式/笔记/缎带） | ✅ 实现 |
| 背包（8 类分类 + 道具列表 + 右侧说明区） | ✅ 实现 |
| 盒子（格子视图 + 精灵详情面板） | ✅ 实现 |
| 战场 | ❌ 暂缓 |
| 附近宝可梦 | ❌ 暂缓 |

---

## 二、数据层：弦九接口规范

### 2.1 数据来源（原样复用）

弦九插件的三条读取链路，本 HUD **全部保留**：

```
优先级1: WIN.Mvu.getMvuData({ type:'message', message_id })
         → d.stat_data 包含完整 DEFAULT_STAT 树

优先级2: localStorage 'pk_mvu_backup_<chatKey>'
         → 防止 MVU 未载入时的降级读取

优先级3: DOM querySelector('.statusbar-data-source')
         → 旧版文本格式降级（[训练家信息]...[/训练家信息]）
```

自动刷新链路也原样保留：
- `MutationObserver` 监听 `#chat .mes`（延迟 550ms debounce）
- `pkmHudRenderCurrent()` 是渲染入口，外部调用本 HUD 的 `swshHud.update(statData)` 即可

### 2.2 核心数据结构

```js
DEFAULT_STAT = {
  训练家: {
    名字, 活力, 活力上限, 金钱, 徽章,
    身份, 声望, 气场, 可命令等级
  },
  队伍: {
    "1"…"6": {
      名字, 英文名, 昵称, 等级, 性别, 是否闪光,
      图标,          // 自定义头像 URL，空则回退精灵图标库
      HP,            // "当前/最大" 格式，如 "245/320"
      经验,          // "当前/下一级" 格式
      属性1, 属性2,  // 属性名中文，属性2 可为 "无"
      技能,          // "招式1/招式2/招式3/招式4" 格式
      性格, 特性,
      携带道具, 携带道具英文,
      亲密度, 个体值, 精灵球, 精灵球英文, 孵化剩余
    }
  },
  附近宝可梦: { … },   // 暂缓
  背包: { [道具名]: { 类型, 数量, 图标 } },
  盒子: { … },
  人际关系: { [名字]: { 好感度 } },
  任务: { 主线, 支线, 传说 },
  劲敌: { … },
  繁育: { 蛋, 剩余步数, 存放 },
  世界事件: { 附近遭遇, 地区新闻, 区域动态 },
  战场: { … },         // 暂缓
  环境: { 当前地点, 日期, 时间, 赛程 }
}
```

### 2.3 适配层（新增）

弦九接口 → HUD 渲染层之间加一薄适配层 `swshBridge`：

```js
swshBridge.normalize(rawStat) → NormalizedStat
```

职责：
- HP 字符串 `"245/320"` → `{ current: 245, max: 320, pct: 76.6 }`
- 经验字符串 `"3200/8125"` → `{ current: 3200, next: 8125, pct: 39.4 }`
- 技能字符串 `"飞叶快刀/精神强念/耐热/电磁炮"` → 招式数组
- 属性名 → 属性颜色 token
- 精灵名称 → 精灵图标 URL（回退链：自定义图标 → 本地 poke_icon → 在线 PokeAPI）

---

## 三、背景渲染系统（Background Compositing）

### 3.1 核心思想：三层叠片

SWSH 所有界面背景都遵循同一个构成规则：  
**主色面** + **斜带高光** + **副色斜带** = 完整背景

用 CSS 实现为：

```
.backdrop (基底色)
  ::before  clip-path 主斜条  ← 界面左侧颜色
  ::after   clip-path 副斜条  ← 界面右侧颜色
```

斜带角度约 115°（与画面形成约 25° 的倾斜线）。  
具体 clip-path 多边形坐标来自对原版截图 + bflyt 坐标的测量。

### 3.2 CSS 变量系统

每个模块通过 `[data-module]` 注入一套 CSS 变量，渲染层只消费变量，不需要写模块名：

```css
/* 通用 token（所有模块共享同名） */
--canvas        /* 主背景色 */
--ribbon-left   /* 左侧斜带色 */
--ribbon-center /* 中间主体色（通常 = canvas） */
--ribbon-right  /* 右侧斜带色 */
--accent        /* 强调色（按钮/高亮/进度条） */
--text          /* 主文字 */
--muted         /* 次要文字 */
--surface       /* 卡片/列表项背景 */
--surface-2     /* 次级卡片背景 */
--line          /* 分割线/边框 */
--selected      /* 选中项背景 */
--selected-text /* 选中项文字 */
```

每个模块 token 对照表：

| 模块 | canvas | ribbon-left | accent |
|------|--------|-------------|--------|
| home | #e33241 | #c32834 | #e33241 |
| team | #eaf8fb | #e33241 | #e33241 |
| bag  | #f5b719 | #e5a600 | #d99124 |
| box  | #edf3f8 | #3b648f | #5482b7 |
| dex  | #fff1f0 | #c32834 | #e33241 |
| settings | #b5a8ff | #a495ff | #6450df |

夜间模式用 `[data-theme="night"]` 覆盖同名变量。

### 3.3 背景实现规则（适用于每个新界面）

以下是编写任意新模块背景时的标准流程：

1. **测量**：在对应截图/bflyt 中找到斜带左边界 X% 和右边界 X%
2. **生成 clip-path**：`polygon(left-top, right-top, right-bottom, left-bottom)` 四点式
3. **写入变量组**：在模块 `[data-module="xxx"]` 选择器下声明 token
4. **写入 backdrop 规则**：`.app[data-module="xxx"] .backdrop` 的三条规则
5. **竖屏适配**：视图内如有斜带需重新测量竖屏比例下的坐标

### 3.4 view vs module 的区别

```
data-module  = 当前打开的 X 菜单项（bag/team/box/settings…）
data-view    = 当前子页面（home/team/party-detail/bag/box/settings…）
```

- 背景色（backdrop）由 `data-module` 控制
- 布局结构（grid 模板）由 `data-view` 控制
- 一个 module 下可以有多个 view（如 team module 有 team view + party-detail view）

---

## 四、响应式与容器查询

### 4.1 尺寸单位策略

HUD 嵌入 SillyTavern 时宽度由聊天侧栏决定，**不固定像素**。

所有尺寸用 `cqw`（容器宽度百分比）+ `clamp()` 双保险：

```css
font-size: clamp(12px, 1.4cqw, 18px);
width: clamp(60px, 8cqw, 96px);
```

### 4.2 断点

| 断点 | 触发 | 变化 |
|-----|-----|-----|
| `> 900px` | 宽屏 | 横版布局，团队列表+精灵展示区左右分割 |
| `600–900px` | 中宽 | 横版紧凑，列宽压缩 |
| `< 600px` | 窄屏 | 竖版布局，精灵展示区移到顶部 |

通过 `@container (max-width: Xpx)` 实现，不依赖 viewport。

### 4.3 横竖版布局切换

demo 现有 `data-layout="landscape|portrait"` 机制完整保留。

SillyTavern 插件版本根据 HUD 容器实际宽度自动判断：
```js
new ResizeObserver(entries => {
  const w = entries[0].contentRect.width;
  app.dataset.layout = w < 520 ? 'portrait' : 'landscape';
})
```

---

## 五、模块架构

```
swsh-hud/
├── index.js            插件入口（SillyTavern 格式）
├── bridge.js           数据适配层 swshBridge
├── render/
│   ├── app.js          根容器、主题/布局/视图切换
│   ├── backdrop.js     背景渲染（三层叠片系统）
│   ├── home.js         主菜单
│   ├── team.js         队伍界面
│   ├── detail.js       精灵详情（5 Tabs）
│   ├── bag.js          背包
│   ├── box.js          盒子
│   └── actionbar.js    底部按键说明条
├── components/
│   ├── party-member.js  队伍成员行（主菜单、队伍、背包共用）
│   ├── hp-bar.js        HP 条
│   ├── type-badge.js    属性徽章
│   ├── pokemon-icon.js  精灵图标（带闪光/性别/精灵球后备）
│   └── stat-radar.js    六维雷达图（详情-数值 Tab）
├── data/
│   ├── types.js         属性颜色表（18 属性）
│   ├── items.js         道具分类映射
│   └── moves.js         招式基础数据（PP/属性/分类）
├── assets/              （从 demo/swsh-hud-demo/assets/ 复制）
├── styles/
│   ├── tokens.css       CSS 变量 token 定义
│   ├── backdrop.css     背景叠片规则
│   ├── layout.css       grid/flex 骨架
│   ├── components.css   公共组件样式
│   └── modules/         各模块专属样式
└── plugin.json          SillyTavern 插件清单
```

### 5.1 文件职责说明

**bridge.js**（适配层）
```js
export const swshBridge = {
  normalize(raw)         // 完整 stat_data → NormalizedStat
  parseHP(str)           // "245/320" → {cur,max,pct}
  parseExp(str)          // "3200/8125" → {cur,next,pct}
  parseMoves(str)        // "招式1/招式2/…" → string[]
  resolveIcon(mon)       // 返回精灵图标 URL，三段回退链
  resolveItemIcon(item)  // 返回道具图标 URL
}
```

**app.js**（根控制器）
```js
class SwshApp {
  constructor(container)
  update(statData)       // 外部调用的唯一入口
  navigate(module, view) // 切换模块/子视图
  setTheme(night)
  setLayout(portrait)
}
```

**backdrop.js**（背景）
```js
// 通过 data-module 和 data-theme 自动匹配规则
// 由 app.js 在 navigate() 时调用，不暴露到外部
```

---

## 六、各界面详细规格

### 6.1 主菜单（home view）

**布局来源**：`screenshot/主菜单.png` + `ui_assets/ui/menu/`

```
背景：
  canvas = 鲜红 #e33241
  前景斜带（::before）= 深红 #c32834，左侧约 11% 宽
  右侧冰蓝斜带（::after）= #d4ffff，右侧约 11% 宽

菜单格：10 个图标（2×5 横向，5×2 竖向缩减）
  图标盘 disc：白色圆形，悬停时变黑色
  标签：白色文字，字号 clamp(12px, 1.65cqw, 19px)

按键说明条（actionbar）：
  黑色底 #101116，右侧三个按键图示
```

菜单项映射（按弦九数据决定可用性）：

| 位置 | 图标 | 目标 module |
|-----|-----|------------|
| 1 | 图鉴 | dex |
| 2 | 队伍 | team |
| 3 | 背包 | bag |
| 4 | 地图 | map（暂缺，显示空状态） |
| 5 | 徽章/证件 | badge（暂缺） |
| 6 | 通讯录 | relations |
| 7 | 记录 | records |
| 8 | 营地 | camp（暂缺） |
| 9 | 神秘礼物 | gift（暂缺） |
| 10 | 设置 | settings |

### 6.2 队伍界面（team view）

**布局来源**：`screenshot/队伍-主界面.png` + `ui_assets/ui/pokelist/`

```
横版：左侧 48.5% 列表区 + 右侧 51.5% 精灵展示区
竖版：13% 标题 + 32% 精灵展示区 + 55% 列表区

背景（横版）：
  全图：浅冰蓝渐变
  左侧红色三角斜带（::before）= #e33241
  左侧深红细条（::after）= #c32834，宽约 10%

队伍成员行（.party-member）：
  白色圆角胶囊，高 clamp(58px, 6.67cqw, 76px)
  网格 3 列：精灵图标 | 信息（名+HP条+等级+携带道具） | 等级数字
  选中时整行变黑

精灵展示区（.party-hero）：
  透明背景（右侧冰蓝来自 backdrop）
  旋转水印 pokelist-watermark-full.png，opacity 0.4
  精灵大图 width min(54%, 420px)
  名字 + 属性徽章行
  切换精灵前后翻页控件
```

### 6.3 精灵详情（party-detail view）

**布局来源**：`screenshot/队伍-精灵信息.png` 等 5 张

```
固定 2 列 grid：左侧 48.5% 信息面板 + 右侧 51.5% 精灵艺术区

顶部 Tab 条（5 个 Tab）：
  透明背景，图标取自 assets/status/tab-*.png
  当前 Tab 图标变黑（filter:brightness(0)）

左侧黑色状态条：
  clip-path 斜切（左边约 6% 内缩），背景 #000
  显示：精灵球图标 | 名字 | 等级 | 性别图标

五个 Tab 内容面板（左下区域）：

  Tab 0 信息（profile-overview）：
    表格行：No./属性/特性/性格/亲密度/精灵球/携带道具/孵化剩余
    经验进度条
    奖章/印章行

  Tab 1 特性（ability）：
    特性名 + 说明文字

  Tab 2 招式（moves）：
    4 个招式卡片，圆角胶囊
    格式：招式名 | 属性色块 | PP "剩余/最大"
    属性色块对应 ui_assets/icons/type/ 颜色

  Tab 3 笔记（tnote）：
    训练家笔记文本区（从 stat_data.队伍[i].笔记 读取，暂缺字段时显示空）

  Tab 4 缎带（ribbon）：
    图标网格 ui_assets/icons/ribbon/

右侧精灵艺术区：
  旋转水印（同队伍界面）
  精灵大图 width min(62%, 460px)
```

### 6.4 背包（bag view）

**布局来源**：`screenshot/背包-进入界面.png` + `ui_assets/ui/bag/`

```
背景：
  canvas = 金黄 #f5b719
  中间深黄斜带（::before） = #e5a600
  左侧白粉斜带（::after） = linear-gradient 白→粉

横版 2 列 grid：
  左列 35%：标题图 + 金钱 / 队伍成员列（6个）
  右列 65%：分类导航 + 色带 + 道具列表 + 道具说明区

分类导航（8类）：
  图标取自 assets/bag-categories/*.png，白色反色
  当前分类：图标变黑色 + 顶部白色 3px 线
  左右翻页三角按钮（白色）

道具说明区：
  橙色斜切 header（道具名白字）
  说明文字黑色

道具列表行：
  透明背景，选中时左 82% 变黑 + 右 18% 变橙色
  3 列：图标 | 道具名 | 数量

竖版：
  上方道具区 + 下方队伍列（2 列 grid 或单列）
```

### 6.5 盒子（box view）

**布局来源**：`screenshot/盒子界面.png` + `screenshot/盒子-详细信息.png`

```
背景：
  canvas = 浅蓝 #edf3f8
  左侧蓝色斜带 #3b648f

主体 grid 5×6 = 30 格（实际 SWSH 是 5 列 6 行/盒）
  每格正方形，显示精灵小图标
  空格 = 半透明虚线边框

右侧面板（选中精灵时）：
  精灵名 + 等级 + 属性
  HP 条
  精灵大图
  操作按钮（查看/放走/交换位置）

盒子切换：
  顶部 < 盒子名称 > 导航
  多个盒子对应 stat_data.盒子 下的分组
```

---

## 七、公共组件规格

### 7.1 party-member 卡片（三处共用）

```
主菜单背包左侧 / 队伍主界面列表 / 背包左侧

差异通过 CSS context selector 控制：
  .app[data-module="team"] .party-member → 较大尺寸
  .app[data-module="bag"] .party-member  → 紧凑尺寸
```

### 7.2 HP 条颜色语义

| HP% | 颜色 |
|-----|-----|
| > 50% | #00d515 绿色 |
| 20–50% | #e8c300 黄色 |
| < 20% | #e34b4b 红色 |
| 0 | 灰色（已倒下） |

### 7.3 属性徽章颜色

取自 SWSH bflyt 颜色值（18 属性均有对应色）：

| 属性 | 背景色 | 文字 |
|-----|-------|-----|
| 一般 | #9BA0A4 | #fff |
| 火 | #F9742B | #fff |
| 水 | #6690F0 | #fff |
| 草 | #58AA50 | #fff |
| 电 | #F4D23C | #fff |
| 冰 | #98D8D8 | #fff |
| 格斗 | #CF4069 | #fff |
| 毒 | #A95FC5 | #fff |
| 地面 | #D97845 | #fff |
| 飞行 | #9BA0DC | #fff |
| 超能力 | #FA7179 | #fff |
| 虫 | #97B734 | #fff |
| 岩石 | #C5B88D | #fff |
| 幽灵 | #6260B3 | #fff |
| 龙 | #0C69C4 | #fff |
| 恶 | #57616A | #fff |
| 钢 | #5595A3 | #fff |
| 妖精 | #EF8FD0 | #fff |

---

## 八、SillyTavern 插件接入规范

### 8.1 插件格式

```json
{
  "type": "script",
  "enabled": true,
  "name": "宝可梦剑盾HUD",
  "id": "swsh-hud-v1",
  "content": "/* 编译后的完整 JS */"
}
```

### 8.2 渲染入口替换

弦九的 `pkmHudRenderCurrent()` 调用点替换为：

```js
// 弦九 render() 末尾钩入
(function patchRender(){
  var _orig = pkmHudRenderCurrent;
  window._swshHudUpdate = function(stat){
    if(window.__swshHudApp) window.__swshHudApp.update(stat);
    else _orig(); // 降级：初始化未完成时用原版渲染
  };
})();
```

HUD 挂载点选择：
- **内联模式**（winMode='0'）：替换 `#pkm-hud-inline` 的 innerHTML
- **窗口模式**（winMode='1'）：替换 `#pkm-hud-slot` 的 innerHTML

### 8.3 自动刷新保持

弦九的 `MutationObserver` + `pkmAutoSchedule()` 链路**不动**，  
只在 `pkmHudRenderCurrent` 被调用时触发新 HUD 的 `update(stat_data)`。

---

## 九、demo → 插件迁移计划

### 阶段 0：规整 demo（基础工程化）

现状问题：
- `index.html` 单文件超 1500 行，CSS/HTML/JS 混合
- 多处重复 CSS 规则（bag backdrop 至少定义了 3 次）
- 无 JS 模块化，所有逻辑内联在 `<script>`

**目标**：  
拆分为 `styles/*.css` + `modules/*.js` + `main.js`，  
demo 的 `index.html` 变成纯骨架 + 数据 mock。

### 阶段 1：健壮性建设

- [ ] CSS 变量系统统一整理，消除重复定义
- [ ] backdrop 规则抽取为模板函数
- [ ] 组件（party-member、hp-bar、type-badge）抽取为独立函数
- [ ] 状态机：`{ module, view, selectedSlot, selectedTab, layout, theme }`
- [ ] 路由：`navigate(module, view)` 负责 dataset 切换 + 组件渲染
- [ ] 错误边界：每个渲染函数 try/catch，失败时显示 fallback 而非崩溃

### 阶段 2：数据接入

- [ ] 实现 `swshBridge.normalize()`
- [ ] 在 demo 中用 mock stat_data 驱动所有界面（脱离硬编码 HTML）
- [ ] HP 条、经验条、属性徽章、精灵图标全部动态生成

### 阶段 3：各模块实现

**优先级**（由高到低）：

1. 主菜单（最简单，已有 90% CSS）
2. 队伍主界面（成员行复用价值最高）
3. 精灵详情（Tab 切换 + 数据最多）
4. 背包（分类导航 + 道具列表）
5. 盒子（格子视图 + 精灵选择）

### 阶段 4：插件化打包

- [ ] 迁移到 SillyTavern 插件格式（单 JS 文件）
- [ ] 兼容弦九 `pkmHudRenderCurrent` 钩子
- [ ] 单文件构建（inline CSS + 内嵌资源路径）

---

## 十、已知约束与决策

| 问题 | 决策 |
|-----|-----|
| 精灵大图（非 icon）来源 | 优先 stat_data.队伍[i].图标（自定义URL），回退 PokeAPI sprites，再回退大号 poke_icon |
| 属性颜色数据 | 硬编码 18 属性颜色表（来自 bflyt 解析），不依赖外部 API |
| 招式 PP/属性数据 | 从弦九原版 `ensureMoveAlias()` 借用数据，插件内嵌精简版 |
| 中文属性名识别 | 复用弦九的属性别名映射表 |
| 字体 | 系统字体回退栈（不内嵌 bffnt），`"Segoe UI","Microsoft YaHei"` |
| 插件单文件大小 | 目标 < 300KB（不含图片资源），图片通过相对路径引用 |
| bflyt 坐标 | 以 1920×1080 为基准，转百分比后用于 clip-path |

---

## 十一、开发规范

### CSS 命名规范

- 新增选择器统一用 `.swsh-` 前缀，不与弦九原 `.hud` 体系混用
- 每个模块专属样式放 `styles/modules/<name>.css`
- CSS 变量用 `--swsh-` 前缀标记新增的，区别于 demo 中的旧有变量

### JS 规范

- 不引入任何框架/构建工具，原生 ES2020
- 所有模块函数以 `swsh` 前缀开头（`swshRenderHome`, `swshRenderTeam`…）
- 状态只通过 `SwshApp.state` 对象读写，不用全局变量

### 资源引用规范

- 插件内图片路径：相对于 `plugin.json` 所在目录的 `assets/` 子目录
- 精灵 icon 命名格式：`poke_icon_{dexId:04d}_00s_n.png`（来自 `ui_assets/icons/pokemon/`）
- 道具 icon 命名格式：`item_{itemId:04d}.png`（来自 `ui_assets/icons/item/`）

---

## 附录 A：截图与 bflyt 参考索引

| 截图文件 | 对应模块 | bflyt 参考 |
|---------|---------|-----------|
| `screenshot/主菜单.png` | home | `ui/menu/` |
| `screenshot/队伍-主界面.png` | team | `ui/pokelist/pokelist_top_00_lyt.bin` |
| `screenshot/队伍-精灵详情.png` | party-detail | `ui/status/` |
| `screenshot/背包-进入界面.png` | bag | `ui/bag/bag_top_00_lyt.bin` |
| `screenshot/盒子界面.png` | box | `ui/pokebox/` |

## 附录 B：弦九原版 HUD → 新 HUD 功能对照

| 弦九功能 | 新 HUD 对应 |
|--------|------------|
| 训练家面板（活力/金钱/徽章） | 主菜单右上方训练家信息条 |
| 队伍 6 格 | 队伍主界面 / 精灵详情 |
| 任务面板 | 主菜单 → 记录 module |
| 背包 | 背包 module（完整实现） |
| 盒子 | 盒子 module |
| 人际关系 | 主菜单 → 通讯录 module（简版列表） |
| 劲敌 | 主菜单 → 通讯录（作为特殊成员） |
| 战场 | ❌ 暂缓 |
| 附近宝可梦 | ❌ 暂缓 |
| 世界事件/环境 | 主菜单底部环境信息条 |
