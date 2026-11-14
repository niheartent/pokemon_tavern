# JavaScript 模块化计划

> 开始时间: 2024-11-14  
> 任务: 模块化JavaScript代码，保持功能100%一致

---

## 📊 原版JavaScript分析

**代码量**: 679行  
**位置**: index.html 行1582-2261

### 全局变量（需要整合）

```javascript
// 数据常量
const MENU = [...];         // 主菜单项
const PARTY = [...];        // 队伍数据
const DEX = [...];          // 图鉴数据
const BAGS = [...];         // 背包数据
const BOXES = [...];        // 盒子数据
const TABS = [...];         // Tab标签
const STAT_NAMES = [...];   // 属性名
const TYPE_COLORS = {...};  // 属性颜色
const SETTINGS = [...];     // 设置项
const SETTING_DEFAULTS = [...]; // 设置默认值
const BOX_TEAM = {...};     // 盒子队伍

// 可变状态
let dexCatalog = null;
let dexRegionalCatalog = null;
let dexCatalogPromise = null;
let dexCategory = "all";
let dexCategoryMode = "region";
let dexCategoryOpen = false;

// 桥接对象
const swshBridge = {...};   // 数据桥接
```

### 函数分类

1. **工具函数**
   - `swshIcon()` - 生成SVG图标
   - `esc()` - 转义HTML
   - `parseHP()` - 解析HP值
   
2. **组件生成函数**
   - 队伍成员卡片
   - 图鉴列表行
   - 背包物品行
   - 等等

3. **渲染函数**
   - `renderMenu()` - 渲染主菜单
   - `renderParty()` - 渲染队伍
   - `renderDex()` - 渲染图鉴
   - `renderBag()` - 渲染背包
   - `renderBox()` - 渲染盒子
   - `renderSettings()` - 渲染设置
   
4. **交互函数**
   - 键盘事件处理
   - 点击事件处理
   - 选择箭头逻辑

---

## 🎯 模块化方案

### 文件结构

```
scripts/
├── data/
│   ├── mock-data.js        - 测试数据(PARTY/BAGS/BOXES等)
│   └── constants.js        - 常量(TABS/STAT_NAMES/TYPE_COLORS等)
├── state/
│   └── store.js            - 统一状态管理
├── utils/
│   ├── helpers.js          - 工具函数(esc/parseHP等)
│   └── icons.js            - SVG图标生成
├── components/
│   ├── party-member.js     - 队伍成员卡片
│   ├── dex-row.js          - 图鉴行
│   ├── item-row.js         - 物品行
│   └── selection-arrow.js  - 选择箭头
├── modules/
│   ├── menu.js             - 主菜单渲染
│   ├── party.js            - 队伍渲染
│   ├── party-detail.js     - 精灵详情渲染
│   ├── dex.js              - 图鉴渲染
│   ├── bag.js              - 背包渲染
│   ├── box.js              - 盒子渲染
│   └── settings.js         - 设置渲染
├── bridge/
│   └── swsh-bridge.js      - 数据桥接层
└── main.js                 - 入口+初始化
```

---

## 📋 执行步骤

### Step 1: 提取数据和常量 ⏳
- [ ] 创建 data/mock-data.js
- [ ] 创建 data/constants.js

### Step 2: 创建状态管理 ⏳
- [ ] 创建 state/store.js
- [ ] 迁移所有 let 变量

### Step 3: 提取工具函数 ⏳
- [ ] 创建 utils/helpers.js
- [ ] 创建 utils/icons.js

### Step 4: 抽取组件 ⏳
- [ ] 创建 components/*.js

### Step 5: 模块化渲染 ⏳
- [ ] 创建 modules/*.js

### Step 6: 创建入口 ⏳
- [ ] 创建 main.js
- [ ] 创建 index-final.html

### Step 7: 测试验证 ⏳
- [ ] 浏览器功能测试
- [ ] 确保100%一致

---

## ⚠️ 注意事项

1. **保持功能完全不变**
2. **使用ES6模块（type="module"）**
3. **保持原有的事件监听逻辑**
4. **不改变DOM结构**
5. **逐步验证，及时留痕**
