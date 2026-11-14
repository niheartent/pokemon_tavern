# SWSH Bridge 使用说明

> 版本：v1.0.0  
> 日期：2024-11-14  
> 功能：弦九插件数据桥接层

---

## 📦 功能概述

`swsh-bridge.js` 负责从弦九插件获取宝可梦数据，并转换为SWSH HUD所需的格式。

---

## 🚀 快速开始

### 1. 引入桥接层

```html
<script src="scripts/bridge/swsh-bridge.js"></script>
```

### 2. 获取数据

```javascript
// 加载数据（自动选择最佳来源）
const data = swshBridge.loadData();

// 转换为SWSH格式
const party = swshBridge.convertParty(data);
const bag = swshBridge.convertBag(data);
const dex = swshBridge.convertDex(data);
const trainer = swshBridge.convertTrainer(data);

console.log('队伍:', party);
console.log('背包:', bag);
console.log('图鉴:', dex);
console.log('训练家:', trainer);
```

---

## 📖 API文档

### 数据获取

#### `swshBridge.loadData()`

主入口函数，按优先级获取数据：

1. **Mvu插件** - `window.Mvu.getMvuData()`
2. **localStorage备份** - `pk_mvu_backup_${chatKey}`
3. **DOM文本** - `.statusbar-data-source`
4. **默认数据** - 兜底

**返回**: 弦九格式的数据对象

```javascript
{
  训练家: { 名字: "小智", 金钱: 31400, ... },
  队伍: { "1": { 名字: "皮卡丘", ... }, ... },
  背包: { "伤药": 5, ... },
  图鉴: { "0025": { 捕获: true, ... }, ... }
}
```

#### `swshBridge.loadDataLight()`

降级读取函数，跳过Mvu插件，直接从备份或DOM读取。

---

### 数据转换

#### `swshBridge.convertParty(xianjiu)`

将弦九队伍数据转换为SWSH格式。

**输入**（弦九格式）:
```javascript
{
  队伍: {
    "1": {
      名字: "皮卡丘",
      ID: "0025",
      等级: "45",
      HP体力: "120/120",
      性别: "雄",
      属性: "电",
      特性: "静电",
      性格: "顽皮",
      招式1: "十万伏特",
      招式1PP: "15/15",
      // ...
    }
  }
}
```

**输出**（SWSH格式）:
```javascript
[
  {
    id: "0025",
    name: "皮卡丘",
    nickname: "",
    level: 45,
    hp: "120/120",
    gender: "雄",
    types: ["电"],
    ability: "静电",
    nature: "顽皮",
    moves: [
      { name: "十万伏特", pp: "15/15", type: "电" }
    ],
    stats: { hp: 120, attack: 55, ... },
    friendship: 220,
    ball: "精灵球"
  }
]
```

#### `swshBridge.convertBag(xianjiu)`

转换背包数据。

**输入**:
```javascript
{
  背包: {
    "伤药": 5,
    "精灵球": 10,
    "全满药": 2
  }
}
```

**输出**:
```javascript
[
  {
    name: "伤药",
    count: 5,
    description: "",
    category: "药品",
    icon: "0025"
  },
  // ...
]
```

#### `swshBridge.convertDex(xianjiu)`

转换图鉴数据。

**输入**:
```javascript
{
  图鉴: {
    "0025": {
      捕获: true,
      名字: "皮卡丘"
    },
    "0001": {
      捕获: false,
      名字: "妙蛙种子"
    }
  }
}
```

**输出**:
```javascript
[
  {
    id: "0025",
    name: "皮卡丘",
    caught: true,
    seen: true
  },
  {
    id: "0001",
    name: "妙蛙种子",
    caught: false,
    seen: true
  }
]
```

#### `swshBridge.convertTrainer(xianjiu)`

转换训练家数据。

**输入**:
```javascript
{
  训练家: {
    名字: "小智",
    金钱: 31400,
    徽章数: 8,
    游戏时长: "125:30",
    当前位置: "真新镇"
  }
}
```

**输出**:
```javascript
{
  name: "小智",
  money: 31400,
  badges: 8,
  playtime: "125:30",
  location: "真新镇"
}
```

---

## 🔧 工具函数

#### `swshBridge.getCurrentChatKey()`

获取当前聊天的唯一标识（用于localStorage）。

**返回**: `string`

---

## 🎯 集成到原版demo

### 方案1: 替换mock数据

修改原版 `index.html` 中的数据定义：

```javascript
// 原版：硬编码数据
const PARTY = [
  {id:"0810",name:"啃果虫",nickname:"",level:5,...},
  // ...
];

// 改为：从弦九加载
const xianjiunData = swshBridge.loadData();
const PARTY = swshBridge.convertParty(xianjiunData);
const BAGS = swshBridge.convertBag(xianjiunData);
// ...
```

### 方案2: 动态刷新

添加刷新按钮，允许用户重新加载数据：

```javascript
function refreshData() {
  const data = swshBridge.loadData();
  
  // 更新全局数据
  window.PARTY = swshBridge.convertParty(data);
  window.BAGS = swshBridge.convertBag(data);
  window.DEX = swshBridge.convertDex(data);
  
  // 重新渲染当前页面
  renderCurrentView();
}

// 添加刷新按钮
document.querySelector('.refresh-button').addEventListener('click', refreshData);
```

---

## 🧪 测试

### 测试Mvu插件连接

在浏览器控制台运行：

```javascript
// 检查Mvu插件
console.log('Mvu插件:', window.Mvu);

// 测试数据获取
const data = swshBridge.loadData();
console.log('获取的数据:', data);

// 测试转换
const party = swshBridge.convertParty(data);
console.log('转换后的队伍:', party);
```

### 测试localStorage备份

```javascript
// 手动保存测试数据
const testData = {
  训练家: { 名字: "测试训练家" },
  队伍: { "1": { 名字: "皮卡丘" } }
};
localStorage.setItem('pk_mvu_backup_default', JSON.stringify(testData));

// 读取测试
const loaded = swshBridge.loadDataLight();
console.log('从备份加载:', loaded);
```

---

## 📝 注意事项

1. **数据格式差异**
   - 弦九：中文字段名（`名字`, `等级`, `HP体力`）
   - SWSH：英文字段名（`name`, `level`, `hp`）
   - 桥接层负责转换

2. **数据完整性**
   - 弦九数据可能不完整（缺少描述、图标等）
   - 桥接层提供猜测逻辑和默认值

3. **性能考虑**
   - 数据转换发生在每次 `convert*()` 调用时
   - 建议缓存转换结果，避免重复计算

4. **错误处理**
   - 所有函数都有 try-catch 包裹
   - 失败时返回默认值或空数组
   - 错误信息输出到控制台

---

## 🚧 待完成功能

- [ ] `loadFromText()` - DOM文本解析（旧版格式）
- [ ] 完善物品分类和图标映射
- [ ] 支持指定消息ID加载
- [ ] 数据验证和错误提示
- [ ] 自动刷新机制

---

## 📚 相关文档

- [XIANJIU_API_SPEC.md](../../../XIANJIU_API_SPEC.md) - 弦九API规范
- [CODE_REVIEW.md](../../../CODE_REVIEW.md) - 代码审查报告
