# Pokemon Tavern HUD - 重构进度跟踪

> 开始日期: 2024-11-14  
> 分支: refactor/modularize-demo  
> 原则: **改底层逻辑，保持外观完全不变**

---

## ✅ 已完成

### Phase 1A: CSS 提取 ✅ (100%视觉一致)
- 原版 2262行 → 757行HTML + 12个CSS文件
- 文件：`index-modular-v2.html` + `styles-original/`
- 浏览器验证：视觉完全相同

### Phase 1B: CSS 优化 ✅ (去重+合并)
- 12个CSS文件 → 7个文件（减少42%）
- 1494行 → 1487行（去除7行重复）
- 183KB → 180KB（减少3KB）
- 文件：`index-optimized.html` + `styles-optimized/`

### Phase 2: JavaScript 模块化 ⏸️ (决定跳过)
- 原版JavaScript (678行) 结构已经清晰
- 评估后决定跳过重构，专注核心目标
- 已提取代码并创建目录结构备用

### Phase 3: 弦九API对接 ✅ (已完成)
- 创建 `swshBridge` 数据桥接层（370行）
- 完整API文档和测试页面
- 三级数据获取策略
- 支持队伍/背包/图鉴/训练家数据转换

#### swshBridge 文件结构

```
scripts/bridge/
├── swsh-bridge.js  ✅ 核心桥接层（370行）
├── README.md       ✅ 完整API文档
└── test.html       ✅ 功能测试页面
```

---

## 🚧 进行中

### Phase 1: CSS 拆分 (继续)

#### 待创建的 CSS 文件

```
styles/
├── layout.css          ⏳ Grid/Flex 布局骨架
├── selection-arrow.css ⏳ 选择箭头系统
├── modules/
│   ├── home.css        ⏳ 主菜单 (横屏)
│   ├── team.css        ⏳ 队伍主界面 (横屏)
│   ├── team-portrait.css ⏳ 队伍主界面 (竖屏) - 独立
│   ├── party-detail.css  ⏳ 精灵详情 (横竖屏)
│   ├── bag.css         ⏳ 背包 (横屏)
│   ├── bag-portrait.css ⏳ 背包 (竖屏) - 独立
│   ├── dex.css         ⏳ 图鉴 (横屏)
│   ├── dex-portrait.css ⏳ 图鉴 (竖屏) - 独立
│   ├── box.css         ⏳ 盒子 (横竖屏)
│   ├── settings.css    ⏳ 设置
│   ├── relations.css   ⏳ 人际关系
│   ├── map.css         ⏳ 地图
│   └── world.css       ⏳ 世界
└── responsive.css      ⏳ 响应式和容器查询
```

---

## 📋 待办事项

### Phase 2: JavaScript 模块化

```
scripts/
├── main.js             ⏳ 入口 + 初始化
├── state.js            ⏳ 统一状态管理 (替代全局变量)
├── bridge.js           ⏳ 数据适配层 (对接弦九)
├── render.js           ⏳ 渲染引擎
├── components/
│   ├── party-member.js ⏳ 队伍成员卡片组件
│   ├── hp-bar.js       ⏳ HP 条组件
│   ├── type-badge.js   ⏳ 属性徽章组件
│   └── selection-arrow.js ⏳ 选择箭头逻辑
├── modules/
│   ├── home.js         ⏳ 主菜单渲染
│   ├── team.js         ⏳ 队伍渲染
│   ├── party-detail.js ⏳ 精灵详情渲染
│   ├── bag.js          ⏳ 背包渲染
│   ├── dex.js          ⏳ 图鉴渲染
│   ├── box.js          ⏳ 盒子渲染
│   └── ...
└── utils/
    ├── dom.js          ⏳ DOM 操作工具
    └── helpers.js      ⏳ 工具函数 (esc, parseHP, etc.)
```

### Phase 3: 数据层

```
data/
├── mock-data.js        ⏳ 测试数据 (原 PARTY/BAGS 等)
└── constants.js        ⏳ 常量定义
```

### Phase 4: 重构 index.html

```
index.html              ⏳ 精简为骨架 + 引入外部文件
```

### Phase 5: 测试验证

- [ ] 视觉对比测试 (截图对比)
- [ ] 功能测试 (所有交互正常)
- [ ] 响应式测试 (横竖屏切换)
- [ ] 主题切换测试 (明暗模式)

---

## 🎯 设计原则确认

### 1. 横竖屏独立

- ✅ **不互通**: 横屏和竖屏是两套独立模板
- ✅ **分文件**: `team.css` (横屏) + `team-portrait.css` (竖屏)
- ✅ **不继承**: 竖屏样式不继承横屏规则

**示例**:
```css
/* styles/modules/team.css - 横屏专用 */
.app[data-view="team"][data-layout="landscape"] {
  /* 横屏布局 */
}

/* styles/modules/team-portrait.css - 竖屏专用 */
.demo[data-layout="portrait"] .app[data-view="team"] {
  /* 竖屏布局，完全独立 */
}
```

### 2. 背景分类

**分割型** (左右栏):
- 队伍、图鉴、背包、盒子、人际关系
- 文件: `styles/backdrops/split.css` ✅

**呈现型** (中心展示):
- 主菜单、设置、地图、世界、联盟卡
- 文件: `styles/backdrops/center.css` ✅

### 3. 战场暂缓

- ❌ 战场模块最后处理
- ✅ 暂时复用弦九原版

---

## 📝 CSS 去重记录

### 问题 1: 背包背景重复定义 3 次

**原代码**:
```css
/* 第 1 次 - 行 442 */
.app[data-module="bag"] .backdrop { background: #f5b719; }

/* 第 2 次 - 行 669 */
.app[data-module="bag"] .backdrop { background: #f5b719; }

/* 第 3 次 - 可能在其他位置 */
```

**解决方案**:
```css
/* styles/tokens.css - 统一定义颜色变量 */
.app[data-module="bag"] {
  --canvas: #fbf0e4;
  --accent: #d99124;
  --ribbon-left: #d99124;
  --ribbon-center: #fbf0e4;
  --ribbon-right: #f5dfc6;
}

/* styles/backdrops/split.css - 使用变量，只定义一次 */
.app[data-module="bag"] .backdrop {
  background: var(--canvas);
}

.app[data-module="bag"] .backdrop::before {
  background: var(--ribbon-left);
  clip-path: polygon(44.2% 0, 55.6% 0, 30.5% 100%, 19.1% 100%);
}
```

### 问题 2: 横竖屏代码混杂

**原代码**:
```css
/* 横屏和竖屏规则混在一起 */
.app[data-view="team"] .backdrop::before { ... }
.demo[data-layout="portrait"] .app[data-view="team"] .backdrop::before { ... }
```

**解决方案**:
```css
/* styles/backdrops/split.css - 横屏 */
.app[data-view="team"] .backdrop::before {
  background: var(--swsh-red);
  clip-path: polygon(0 0, 61.5% 0, 36.7% 100%, 0 100%);
}

/* 竖屏规则单独一段，不继承横屏 */
.demo[data-layout="portrait"] .app[data-view="team"] .backdrop::before {
  content: "";
  background: var(--portrait-main-fill);
  clip-path: var(--portrait-main-shape);
}
```

---

## 🐛 已知问题跟踪

### CSS 相关

- [x] 背包背景重复定义 3 次 → 已解决
- [x] 横竖屏规则混杂 → 已分离
- [ ] 魔法数字缺少注释 → 待添加
- [ ] CSS 命名不一致 → 待规范化

### JavaScript 相关

- [ ] 全局状态散布 20+ 个变量 → 待统一
- [ ] 组件重复生成 (party-member 5 次) → 待抽取
- [ ] 选择箭头逻辑分散 7+ 个函数 → 待整合
- [ ] 数据层完全缺失 → 待实现

### 性能相关

- [ ] 全量重绘 → 待优化为局部更新
- [ ] 频繁 querySelectorAll → 待缓存
- [ ] 滚动条拖动未节流 → 待添加

---

## 📊 进度统计

- **CSS 拆分**: 30% (5/16 文件)
- **JS 模块化**: 0% (0/15 文件)
- **数据层**: 0% (0/2 文件)
- **index.html 重构**: 0%
- **测试验证**: 0%

**总体进度**: ~6%

---

## 🚀 下一步行动

### 立即执行

1. ✅ 完成剩余 CSS 文件拆分
   - layout.css (布局骨架)
   - selection-arrow.css (选择箭头)
   - modules/*.css (各模块样式)

2. ⏳ 创建 JavaScript 模块
   - state.js (统一状态管理)
   - components/*.js (抽取公共组件)
   - render.js (渲染引擎)

3. ⏳ 重构 index.html
   - 清空内联样式和脚本
   - 引入外部文件
   - 保留骨架结构

4. ⏳ 测试验证
   - 截图对比
   - 功能测试
   - 性能测试

### 预计时间

- CSS 拆分完成: 0.5 天
- JS 模块化: 1-2 天
- 数据层: 1 天
- 测试验证: 0.5 天

**总计**: 3-4 天

---

## 📝 备注

### 保持不变的内容

- ✅ **视觉表现**: 像素级一致
- ✅ **交互逻辑**: 功能完全相同
- ✅ **响应式**: 横竖屏/明暗主题不变

### 改变的内容

- ✅ **文件结构**: 单文件 → 模块化
- ✅ **CSS 组织**: 内联 → 外部文件
- ✅ **状态管理**: 全局变量 → 统一状态
- ✅ **组件复用**: 重复代码 → 抽取组件

---

## 🔗 相关文档

- [CODE_REVIEW.md](../../CODE_REVIEW.md) - 代码审查报告
- [XIANJIU_API_SPEC.md](../../XIANJIU_API_SPEC.md) - 弦九 API 规范
- [DESIGN.md](../../DESIGN.md) - 设计文档

---

> **最后更新**: 2024-11-14 16:45  
> **当前分支**: refactor/modularize-demo  
> **上次提交**: 825fe79 (docs: 添加代码审查报告和弦九API接口规范)
