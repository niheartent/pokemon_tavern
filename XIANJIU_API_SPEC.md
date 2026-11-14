# 弦九宝可梦 HUD 插件 API 接口规范

> 版本：v6.0.12  
> 分析日期：2024-11-14  
> 目标：为 SWSH HUD 提供数据对接方案

---

## 一、数据获取接口（三条链路）

### 1.1 优先级链路

```javascript
// 主入口函数
function loadStatData() {
  // 优先级 1: 从 Mvu 插件读取
  var d = loadFromMvu();
  if (d) {
    // 成功时备份到 localStorage
    localStorage.setItem('pk_mvu_backup_' + chatKey(), JSON.stringify(d));
    return d;
  }
  
  // 优先级 2/3: 降级读取
  return loadStatDataLight();
}

// 降级读取函数
function loadStatDataLight() {
  // 优先级 2: 从 localStorage 备份读取
  var backup = JSON.parse(localStorage.getItem('pk_mvu_backup_' + chatKey()) || 'null');
  if (backup && backup.训练家) return backup;
  
  // 优先级 3: 从 DOM 元素读取旧版文本格式
  var el = document.querySelector('.statusbar-data-source');
  if (el) {
    var text = el.value || el.textContent || '';
    var parsed = loadFromText(text); // 解析 [训练家信息]...[/训练家信息] 格式
    if (parsed) return parsed;
  }
  
  // 兜底: 返回空数据模板
  return DEFAULT_STAT;
}
```

### 1.2 Mvu 插件调用方式

```javascript
// 弦九从 Mvu 插件获取数据的方式
function loadFromMvu() {
  try {
    if (!WIN.Mvu || !WIN.Mvu.getMvuData) return null;
    
    var d = null;
    
    // 尝试1：从指定消息ID读取
    if (某个消息ID) {
      d = WIN.Mvu.getMvuData({
        type: 'message',
        message_id: 消息ID
      });
    }
    
    // 尝试2：从最新消息读取
    if (!d || !d.stat_data || !d.stat_data.训练家) {
      d = WIN.Mvu.getMvuData({
        type: 'message',
        message_id: 'latest'
      });
    }
    
    // 验证并返回
    return (d && d.stat_data && d.stat_data.训练家) 
      ? mergeStat(d.stat_data) 
      : null;
      
  } catch(e) {
    return null;
  }
}
```

**关键点**：
- Mvu 插件返回 `{ stat_data: {...} }` 格式
- 必须检查 `stat_data.训练家` 确保数据有效
- `message_id: 'latest'` 获取最新消息的数据

---

## 二、完整数据结构（DEFAULT_STAT）

### 2.1 顶层结构

```javascript
var DEFAULT_STAT = {
  "训练家": { /* 见 2.2 */ },
  "队伍": {
    "1": { /* 见 2.3 */ },
    "2": { "名字": "空" },
    "3": { "名字": "空" },
    "4": { "名字": "空" },
    "5": { "名字": "空" },
    "6": { "名字": "空" }
  },
  "附近宝可梦": {},
  "背包": { /* 见 2.4 */ },
  "盒子": { /* 见 2.5 */ },
  "人际关系": { /* 见 2.6 */ },
  "任务": {
    "主线": "",
    "支线": "",
    "传说": ""
  },
  "劲敌": {},
  "通讯录": {},
  "繁育": {
    "蛋": "",
    "剩余步数": 0,
    "存放": ""
  },
  "世界事件": {
    "附近遭遇": "",
    "地区新闻": "",
    "区域动态": ""
  },
  "战场": {
    "场景": "",
    "规则": "",
    "场上": {},
    "各方": {}
  },
  "环境": {
    "当前地点": "",
    "日期": "",
    "时间": "",
    "赛程": ""
  }
};
```

### 2.2 训练家字段

```javascript
"训练家": {
  "名字": "",           // 训练家名字
  "活力": 3,            // 当前活力值
  "活力上限": 3,        // 最大活力值
  "金钱": 0,            // 持有金额
  "徽章": "",           // 徽章列表（文本）
  "身份": "",           // 训练家身份
  "声望": "0 无名",     // 声望等级
  "气场": "无",         // 气场状态
  "可命令等级": 10      // 可指挥的宝可梦等级上限
}
```

### 2.3 队伍成员字段（完整）

```javascript
out.队伍[String(i)] = {
  "名字": "",              // 宝可梦名字（中文）
  "英文名": "",            // 英文名（保留字段）
  "昵称": "",              // 训练家给的昵称
  "等级": 1,               // 等级（整数）
  "性别": "",              // "♂" 或 "♀" 或 ""
  "是否闪光": false,       // 布尔值
  "图标": "",              // 自定义头像URL（优先级最高）
  
  // === 战斗属性 ===
  "HP": "0/0",             // ⚠️ 字符串格式 "当前/最大"
  "经验": "0/0",           // ⚠️ 字符串格式 "当前/下一级"
  "属性1": "",             // 主属性（中文，如"火"）
  "属性2": "无",           // 副属性（中文，无副属性时为"无"）
  "技能": "",              // ⚠️ 字符串格式 "招式1/招式2/招式3/招式4"
  "性格": "",              // 性格名称（中文）
  "特性": "",              // 特性名称（中文）
  
  // === 道具与亲密度 ===
  "携带道具": "无",        // 道具名称（中文），无则"无"
  "携带道具英文": "",      // 英文名（保留）
  "亲密度": 0,             // 整数 0-255
  
  // === 个体与精灵球 ===
  "个体值": "",            // 个体值描述（文本）
  "精灵球": "",            // 精灵球类型（中文）
  "精灵球英文": "",        // 英文名
  "孵化剩余": ""           // 蛋孵化剩余步数（文本）
};
```

**⚠️ 关键数据格式**：
- `HP`: `"245/320"` → 需解析为 `{current: 245, max: 320, pct: 76.6}`
- `经验`: `"3200/8125"` → 需解析为 `{current: 3200, next: 8125, pct: 39.4}`
- `技能`: `"飞叶快刀/精神强念/耐热/电磁炮"` → 需拆分为数组
- `属性2`: 值为 `"无"` 时代表单属性

### 2.4 背包数据结构

```javascript
"背包": {
  "道具名称": {
    "类型": "药品",      // 分类名称（药品/精灵球/树果/技能机/重要道具/战斗道具/一般道具/宝物）
    "数量": 5,           // 持有数量（整数）
    "图标": ""           // 图标路径或编号（保留）
  },
  // ... 更多道具
}
```

**示例**：
```javascript
"背包": {
  "伤药": {
    "类型": "药品",
    "数量": 10,
    "图标": ""
  },
  "精灵球": {
    "类型": "精灵球",
    "数量": 20,
    "图标": ""
  }
}
```

### 2.5 盒子数据结构

```javascript
"盒子": {
  // ⚠️ 弦九的盒子数据结构待确认
  // 可能格式：
  // "盒子1": [ 宝可梦对象数组 ]
  // 或按位置索引存储
}
```

**注意**：盒子功能在原版中存在，但具体存储格式需要进一步分析。

### 2.6 人际关系数据

```javascript
"人际关系": {
  "角色名": {
    "好感度": 50    // 整数 0-100
  },
  // ... 更多角色
}
```

**示例**：
```javascript
"人际关系": {
  "小智": { "好感度": 75 },
  "小霞": { "好感度": 60 }
}
```

---

## 三、自动刷新机制

### 3.1 MutationObserver 监听

```javascript
// 监听聊天区域的变化
var chatElement = document.querySelector('#chat, .chat, .mes_block');

var observer = new MutationObserver(function(mutations) {
  for (var i = 0; i < mutations.length; i++) {
    var mutation = mutations[i];
    if (mutation.type === 'childList') {
      // 检测到新消息，触发延迟刷新
      pkmAutoSchedule();
    }
  }
});

observer.observe(chatElement, {
  childList: true,      // 监听子节点变化
  subtree: true         // 包括所有后代节点
});
```

### 3.2 防抖延迟

```javascript
var pkmAutoPending = false;

function pkmAutoSchedule() {
  if (pkmAutoPending) return;  // 防止重复调度
  
  pkmAutoPending = true;
  setTimeout(function() {
    pkmAutoPending = false;
    pkmAutoCheck();  // 实际检查是否需要刷新
  }, 550);  // ⚠️ 550ms 防抖延迟
}

function pkmAutoCheck() {
  // 检查数据是否变化
  // 如果变化则调用 pkmHudRenderCurrent()
}
```

**关键参数**：
- **延迟时间**: `550ms`
- **防抖机制**: 避免频繁刷新

### 3.3 渲染入口

```javascript
function pkmHudRenderCurrent() {
  try {
    render();              // 主渲染函数
    resizeFrame();         // 调整框架尺寸
    pkmPartnerDotsRefresh(); // 刷新伙伴点位（可选）
    return true;
  } catch(e) {
    return false;
  }
}
```

---

## 四、HUD 挂载点与模式

### 4.1 窗口模式

```javascript
// 从 localStorage 读取模式
var winMode = localStorage.getItem('pk_winmode') || '0';

// '0' = 内联模式（嵌入聊天区）
// '1' = 窗口模式（独立浮窗）
```

### 4.2 挂载点选择

```javascript
if (winMode === '0') {
  // 内联模式：替换此元素的 innerHTML
  var container = document.querySelector('#pkm-hud-inline');
} else {
  // 窗口模式：挂载到此槽位
  var container = document.querySelector('#pkm-hud-slot');
}

container.innerHTML = '<div class="swsh-hud">...</div>';
```

---

## 五、SWSH HUD 数据对接方案

### 5.1 数据适配层（swshBridge）

```javascript
// bridge.js - 数据适配层
const swshBridge = {
  
  /**
   * 获取当前数据（对接弦九三条链路）
   */
  getStat() {
    // 优先级 1: 从 WIN.Mvu 读取
    if (window.parent && window.parent.Mvu && window.parent.Mvu.getMvuData) {
      try {
        const d = window.parent.Mvu.getMvuData({
          type: 'message',
          message_id: 'latest'
        });
        if (d && d.stat_data && d.stat_data.训练家) {
          return d.stat_data;
        }
      } catch(e) {}
    }
    
    // 优先级 2: localStorage 备份
    try {
      const chatKey = this.getChatKey();
      const backup = JSON.parse(localStorage.getItem('pk_mvu_backup_' + chatKey) || 'null');
      if (backup && backup.训练家) return backup;
    } catch(e) {}
    
    // 优先级 3: DOM 文本格式（旧版兼容）
    try {
      const el = document.querySelector('.statusbar-data-source');
      if (el) {
        const text = el.value || el.textContent || '';
        const parsed = this.parseTextFormat(text);
        if (parsed) return parsed;
      }
    } catch(e) {}
    
    // 兜底: 返回空模板
    return this.getDefaultStat();
  },
  
  /**
   * 获取聊天 key（用于 localStorage）
   */
  getChatKey() {
    // 简化版，实际需要根据 SillyTavern 的聊天ID生成
    return 'default';
  },
  
  /**
   * 解析 HP 字符串 "245/320" → {current, max, pct}
   */
  parseHP(str) {
    const parts = String(str || '0/0').split('/').map(v => parseInt(v.trim(), 10) || 0);
    const current = parts[0] || 0;
    const max = parts[1] || 1;
    return {
      current: current,
      max: max,
      pct: Math.round((current / max) * 100 * 10) / 10
    };
  },
  
  /**
   * 解析经验字符串 "3200/8125" → {current, next, pct}
   */
  parseExp(str) {
    const parts = String(str || '0/0').split('/').map(v => parseInt(v.trim(), 10) || 0);
    const current = parts[0] || 0;
    const next = parts[1] || 1;
    return {
      current: current,
      next: next,
      pct: Math.round((current / next) * 100 * 10) / 10
    };
  },
  
  /**
   * 解析技能字符串 "招式1/招式2/招式3/招式4" → 数组
   */
  parseMoves(str) {
    if (!str || str === '无') return [];
    return String(str).split('/').map(m => m.trim()).filter(m => m);
  },
  
  /**
   * 解析属性（处理"无"的情况）
   */
  parseTypes(type1, type2) {
    const types = [type1];
    if (type2 && type2 !== '无') {
      types.push(type2);
    }
    return types.filter(t => t);
  },
  
  /**
   * 规范化队伍成员数据
   */
  normalizeMon(rawMon) {
    if (!rawMon || rawMon.名字 === '空') return null;
    
    return {
      name: rawMon.名字 || '',
      nickname: rawMon.昵称 || '',
      level: rawMon.等级 || 1,
      gender: rawMon.性别 || '',
      shiny: rawMon.是否闪光 || false,
      
      // 解析后的数据
      hp: this.parseHP(rawMon.HP),
      exp: this.parseExp(rawMon.经验),
      types: this.parseTypes(rawMon.属性1, rawMon.属性2),
      moves: this.parseMoves(rawMon.技能),
      
      // 原始字段
      nature: rawMon.性格 || '',
      ability: rawMon.特性 || '',
      held: rawMon.携带道具 === '无' ? '' : (rawMon.携带道具 || ''),
      friendship: rawMon.亲密度 || 0,
      ball: rawMon.精灵球 || '',
      
      // 图标处理（见 5.2）
      icon: rawMon.图标 || '',
      sprite: this.resolveSprite(rawMon)
    };
  },
  
  /**
   * 规范化整个数据结构
   */
  normalize(rawStat) {
    const stat = rawStat || this.getStat();
    
    return {
      trainer: stat.训练家 || {},
      party: this.normalizeParty(stat.队伍 || {}),
      bag: this.normalizeBag(stat.背包 || {}),
      box: stat.盒子 || {},
      relations: stat.人际关系 || {},
      tasks: stat.任务 || { 主线: '', 支线: '', 传说: '' },
      environment: stat.环境 || {}
    };
  },
  
  /**
   * 规范化队伍（1-6号位）
   */
  normalizeParty(rawParty) {
    const party = [];
    for (let i = 1; i <= 6; i++) {
      const mon = this.normalizeMon(rawParty[String(i)]);
      party.push(mon);
    }
    return party;
  },
  
  /**
   * 规范化背包
   */
  normalizeBag(rawBag) {
    const bag = {};
    for (let itemName in rawBag) {
      const item = rawBag[itemName];
      bag[itemName] = {
        category: item.类型 || '',
        count: item.数量 || 0,
        icon: item.图标 || ''
      };
    }
    return bag;
  },
  
  /**
   * 解析旧版文本格式（兼容）
   */
  parseTextFormat(text) {
    // [训练家信息]...[/训练家信息] 格式解析
    // 这是弦九的降级兼容，demo 可暂不实现
    return null;
  },
  
  /**
   * 获取空数据模板
   */
  getDefaultStat() {
    return {
      训练家: { 名字: '', 活力: 0, 活力上限: 0, 金钱: 0 },
      队伍: {
        '1': { 名字: '空' },
        '2': { 名字: '空' },
        '3': { 名字: '空' },
        '4': { 名字: '空' },
        '5': { 名字: '空' },
        '6': { 名字: '空' }
      },
      背包: {},
      盒子: {},
      人际关系: {},
      任务: { 主线: '', 支线: '', 传说: '' },
      环境: { 当前地点: '', 日期: '', 时间: '' }
    };
  },
  
  /**
   * 解析精灵图标（三段回退）
   */
  resolveSprite(mon) {
    // 优先级 1: 自定义图标
    if (mon.图标) return mon.图标;
    
    // 优先级 2: 本地资源库
    // 根据名字查找 ui_assets/icons/pokemon/
    const localIcon = this.findLocalIcon(mon.名字);
    if (localIcon) return localIcon;
    
    // 优先级 3: PokeAPI 在线资源
    return this.getPokeAPISprite(mon.名字);
  },
  
  findLocalIcon(name) {
    // TODO: 实现本地图标查找逻辑
    // 需要一个名字 → 图鉴编号的映射表
    return null;
  },
  
  getPokeAPISprite(name) {
    // TODO: 调用 PokeAPI 或使用预设映射
    return '';
  }
};
```

### 5.2 图标资源映射

**问题**：弦九的 `队伍[i].图标` 字段是自定义URL，可能为空。

**解决方案**：三段回退机制

```javascript
resolveSprite(mon) {
  // 1. 优先使用自定义图标
  if (mon.图标 && mon.图标.startsWith('http')) {
    return mon.图标;
  }
  
  // 2. 回退到本地资源库
  // ui_assets/icons/pokemon/poke_icon_XXXX_00_n.png
  const dexId = NAME_TO_DEX[mon.名字]; // 需要建立映射表
  if (dexId) {
    const localPath = `ui_assets/icons/pokemon/poke_icon_${String(dexId).padStart(4, '0')}_00s_n.png`;
    // 检查文件是否存在（或直接返回，CSS会显示替代图）
    return localPath;
  }
  
  // 3. 回退到 PokeAPI
  const apiDexId = NAME_TO_NATIONAL_DEX[mon.名字];
  if (apiDexId) {
    return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${apiDexId}.png`;
  }
  
  // 4. 最终回退：占位符
  return 'assets/pokemon/placeholder.png';
}
```

---

## 六、Demo 数据层改造方案

### 6.1 当前问题

**现状**：
- Demo 使用硬编码 `PARTY` / `BAGS` / `DEX` 等数组
- 完全独立于弦九接口
- 无法测试真实数据流

**改造目标**：
- ✅ 保持视觉完全不变
- ✅ 数据层从硬编码改为动态读取
- ✅ 支持弦九接口 + 降级到 mock 数据

### 6.2 改造步骤

#### Step 1: 引入 swshBridge

```javascript
// 在 demo/swsh-hud-demo/index.html 的 <script> 开头引入

// === 数据适配层 ===
const swshBridge = { ... }; // 完整实现见 5.1

// === 数据源切换 ===
const USE_MOCK_DATA = !window.parent.Mvu; // 如果没有 Mvu 插件，使用 mock

function getStatData() {
  if (USE_MOCK_DATA) {
    return MOCK_DATA; // 保留原 demo 的硬编码数据作为 mock
  } else {
    return swshBridge.getStat();
  }
}
```

#### Step 2: 重构数据初始化

**原代码**：
```javascript
// 硬编码队伍
const PARTY = [
  {name:"妙蛙花", level:50, ...},
  {name:"喷火龙", level:52, ...},
  // ...
];
```

**改造后**：
```javascript
// 动态队伍
let PARTY = [];

function loadPartyData() {
  const stat = getStatData();
  const normalized = swshBridge.normalize(stat);
  
  PARTY = normalized.party.map((mon, index) => {
    if (!mon) {
      // 空位保持原 demo 的占位结构
      return {name: "空", sprite: null};
    }
    
    // 转换为 demo 的格式
    return {
      name: mon.name,
      nickname: mon.nickname,
      level: mon.level,
      gender: mon.gender,
      shiny: mon.shiny,
      sprite: mon.sprite,
      hp: mon.hp.current + '/' + mon.hp.max,
      exp: mon.exp.current + '/' + mon.exp.next,
      types: mon.types,
      moves: mon.moves,
      nature: mon.nature,
      ability: mon.ability,
      held: mon.held,
      friendship: mon.friendship,
      // 额外需要的字段
      dex: mon.name, // 简化处理，实际需要查图鉴编号
      trainer: normalized.trainer.名字,
      trainerId: '000000', // 如果弦九没有提供，使用默认值
      stats: [100, 80, 75, 85, 90, 95], // ⚠️ 弦九没有提供六维，需要额外处理
      abilityDescription: '...' // 同上
    };
  });
}

// 初始化时调用
loadPartyData();
```

#### Step 3: 重构渲染触发

**原代码**：
```javascript
function render() {
  // 直接使用 PARTY 渲染
  const mon = PARTY[S.party];
  // ...
}
```

**改造后**：
```javascript
function render() {
  // 每次渲染前检查是否需要重新加载数据
  if (shouldReloadData()) {
    loadPartyData();
    loadBagData();
    // ... 其他数据
  }
  
  // 渲染逻辑不变
  const mon = PARTY[S.party];
  // ...
}

function shouldReloadData() {
  // 简单策略：每次都重新加载（实际可优化为检测数据指纹）
  return !USE_MOCK_DATA;
}
```

#### Step 4: 接入自动刷新

```javascript
// 监听聊天区域变化
if (!USE_MOCK_DATA && window.parent.document) {
  const chatEl = window.parent.document.querySelector('#chat');
  if (chatEl) {
    const observer = new MutationObserver(() => {
      scheduleRefresh();
    });
    
    observer.observe(chatEl, {
      childList: true,
      subtree: true
    });
  }
}

let refreshTimer = null;
function scheduleRefresh() {
  if (refreshTimer) clearTimeout(refreshTimer);
  refreshTimer = setTimeout(() => {
    loadPartyData();
    loadBagData();
    render(); // 触发重新渲染
  }, 550); // 弦九的防抖延迟
}
```

### 6.3 Mock 数据保留

```javascript
// 将原 demo 的硬编码数据改为 MOCK_DATA
const MOCK_DATA = {
  训练家: {
    名字: "小智",
    活力: 3,
    活力上限: 3,
    金钱: 31400,
    徽章: "8个",
    身份: "训练家",
    声望: "100 知名",
    气场: "无",
    可命令等级: 100
  },
  队伍: {
    '1': {
      名字: "妙蛙花",
      英文名: "Venusaur",
      昵称: "",
      等级: 50,
      性别: "♂",
      是否闪光: false,
      图标: "",
      HP: "245/320",
      经验: "125000/125000",
      属性1: "草",
      属性2: "毒",
      技能: "飞叶快刀/精神强念/光合作用/毒粉",
      性格: "大胆",
      特性: "茂盛",
      携带道具: "奇迹种子",
      携带道具英文: "Miracle Seed",
      亲密度: 255,
      个体值: "6V",
      精灵球: "精灵球",
      精灵球英文: "Poke Ball",
      孵化剩余: ""
    },
    '2': {
      名字: "喷火龙",
      // ... 完整字段
    },
    // ... 其余队伍
  },
  背包: {
    "伤药": { 类型: "药品", 数量: 10, 图标: "" },
    "好伤药": { 类型: "药品", 数量: 5, 图标: "" },
    "精灵球": { 类型: "精灵球", 数量: 20, 图标: "" },
    // ... 更多道具
  },
  人际关系: {
    "小霞": { 好感度: 75 },
    "小刚": { 好感度: 80 }
  },
  任务: {
    主线: "挑战冠军联盟",
    支线: "完成图鉴收集",
    传说: ""
  },
  环境: {
    当前地点: "真新镇",
    日期: "2024年11月14日",
    时间: "下午3点",
    赛程: ""
  }
};
```

---

## 七、不匹配字段处理

### 7.1 Demo 需要但弦九未提供的字段

| Demo 字段 | 弦九字段 | 解决方案 |
|----------|---------|---------|
| `stats` (六维数值) | ❌ 无 | **方案1**: 根据等级/种族值估算<br>**方案2**: 显示"未知"或隐藏雷达图 |
| `abilityDescription` | ❌ 无 | **方案1**: 维护本地特性说明库<br>**方案2**: 从 PokeAPI 获取 |
| `movePP` (招式PP) | ❌ 无 | **方案1**: 维护本地招式数据库<br>**方案2**: 显示默认值 |
| `trainerNote` (训练家笔记) | ❌ 无 | 显示空状态或隐藏 Tab |
| `ribbons` (缎带) | ❌ 无 | 显示"没有缎带" |
| `dexNumber` (图鉴编号) | ❌ 无 | 维护名字→编号映射表 |

**建议优先级**：
1. **六维数值** - 高优先级（雷达图是核心展示）
   - 维护种族值表 + 根据等级估算
   
2. **特性说明** - 中优先级
   - 维护常见特性的说明文本
   
3. **招式PP** - 中优先级
   - 维护招式基础数据（弦九原版有此数据，可复用）
   
4. **训练家笔记/缎带** - 低优先级
   - 显示空状态即可

### 7.2 弦九提供但 Demo 未使用的字段

| 弦九字段 | Demo 使用 | 处理 |
|---------|----------|------|
| `个体值` | ❌ 未显示 | 可在详情页添加一行展示 |
| `孵化剩余` | ❌ 未显示 | 队伍详情可显示（如果是蛋） |
| `世界事件` | ❌ 未使用 | 可在"世界"模块展示 |
| `战场` | ❌ 未使用 | 暂缓实现（DESIGN.md已规划） |
| `附近宝可梦` | ❌ 未使用 | 暂缓实现 |

**建议**：
- 保留接口，UI 暂不展示
- 在数据适配层预留处理逻辑
- 后续版本逐步补充

### 7.3 数据格式差异

| 场景 | 弦九格式 | Demo 需要 | 转换 |
|-----|---------|----------|------|
| HP | `"245/320"` | `{current, max, pct}` | `parseHP()` |
| 经验 | `"3200/8125"` | `{current, next, pct}` | `parseExp()` |
| 技能 | `"招式1/招式2/招式3/招式4"` | `["招式1", "招式2", ...]` | `parseMoves()` |
| 属性 | `属性1:"火", 属性2:"无"` | `["火"]` | `parseTypes()` |
| 性别 | `"♂"` / `"♀"` / `""` | 同左 | 直接使用 |
| 空队伍 | `{名字:"空"}` | `null` | 检测名字 |

**全部已在 `swshBridge` 中实现**。

---

## 八、实施检查清单

### Phase A: 数据适配层（2-3天）

- [ ] 创建 `bridge.js` 文件
- [ ] 实现 `swshBridge.getStat()` 三条链路
- [ ] 实现 `parseHP()` / `parseExp()` / `parseMoves()` 等解析器
- [ ] 实现 `normalize()` 完整数据规范化
- [ ] 实现 `resolveSprite()` 三段回退
- [ ] 单元测试：用 mock 数据验证所有解析器

### Phase B: Demo 数据层改造（2-3天）

- [ ] 将硬编码数据迁移到 `MOCK_DATA`
- [ ] 实现 `loadPartyData()` / `loadBagData()` 动态加载
- [ ] 重构 `render()` 触发时机
- [ ] 实现 `USE_MOCK_DATA` 开关
- [ ] 测试：mock 模式下视觉完全一致
- [ ] 测试：弦九模式下数据正确渲染

### Phase C: 自动刷新接入（1天）

- [ ] 实现 MutationObserver 监听
- [ ] 实现 550ms 防抖机制
- [ ] 挂钩到 `pkmHudRenderCurrent()` 调用链
- [ ] 测试：聊天消息触发自动刷新

### Phase D: 缺失字段补全（2-3天）

- [ ] 建立名字→图鉴编号映射表
- [ ] 建立种族值表（用于估算六维）
- [ ] 建立招式PP数据库
- [ ] 建立特性说明库
- [ ] 实现估算逻辑
- [ ] 测试：详情页雷达图正常显示

### Phase E: 集成测试（1-2天）

- [ ] 在 SillyTavern + Mvu 环境中测试
- [ ] 验证数据实时更新
- [ ] 验证三条链路降级
- [ ] 验证 localStorage 备份
- [ ] 性能测试：大数据量下刷新流畅度

---

## 九、风险与注意事项

### 9.1 已知风险

1. **弦九接口未公开文档**
   - 当前分析基于逆向工程
   - API 可能在新版本变化
   - **缓解**：保持三条链路降级机制

2. **六维数值缺失**
   - 弦九未提供种族值/努力值/个体值
   - 雷达图只能估算
   - **缓解**：维护本地种族值表

3. **图标资源缺失**
   - 弦九的 `图标` 字段可能为空
   - 需要维护名字→图鉴编号映射
   - **缓解**：三段回退机制

4. **盒子数据结构不明**
   - 分析中未找到完整盒子数据示例
   - **缓解**：先实现队伍/背包，盒子功能后续补充

### 9.2 性能考虑

- **刷新频率**: 550ms 防抖已优化
- **数据解析**: 字符串拆分性能可接受
- **图标加载**: 使用 lazy loading
- **大数据量**: 背包/盒子数据量大时需要虚拟滚动

### 9.3 兼容性

- **浏览器**: 需支持 ES6（已在 demo 中使用）
- **SillyTavern 版本**: 需支持 Mvu 插件
- **Mvu 插件版本**: 需 v?.?.? 以上（待确认）

---

## 十、总结

### 核心数据流

```
[Mvu 插件] 
    ↓ WIN.Mvu.getMvuData({type:'message', message_id:'latest'})
[stat_data]
    ↓ swshBridge.normalize()
[规范化数据] 
    ↓ loadPartyData() / loadBagData()
[Demo 格式]
    ↓ render()
[SWSH HUD 界面]
```

### 关键接口

1. **数据获取**: `swshBridge.getStat()` - 三条链路降级
2. **数据规范化**: `swshBridge.normalize()` - 统一格式
3. **字段解析**: `parseHP()` / `parseExp()` / `parseMoves()` - 格式转换
4. **图标解析**: `resolveSprite()` - 三段回退
5. **自动刷新**: MutationObserver + 550ms 防抖

### 实施优先级

```
1️⃣ 数据适配层 (swshBridge) - 核心基础
2️⃣ Demo 数据层改造 - 对接验证
3️⃣ 自动刷新接入 - 实时更新
4️⃣ 缺失字段补全 - 功能完整
5️⃣ 集成测试 - 上线准备
```

---

> **下一步**: 等待你确认方案后，开始实施 Phase A（数据适配层）。  
> 实施过程中保持视觉完全不变，所有改动仅在数据层。
