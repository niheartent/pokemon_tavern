/**
 * ============================================
 * SWSH Bridge - 弦九插件数据桥接层
 * ============================================
 *
 * 功能：从弦九插件获取宝可梦数据，转换为SWSH HUD格式
 * 版本：v1.0.0
 * 日期：2024-11-14
 */

// ============================================
// 1. 数据获取（三条链路）
// ============================================

/**
 * 主入口：加载宝可梦数据
 * 优先级：Mvu插件 > localStorage备份 > DOM文本 > 默认数据
 */
function loadStatData() {
  // 优先级1：从Mvu插件读取
  const mvuData = loadFromMvu();
  if (mvuData && mvuData.训练家) {
    // 成功时备份到localStorage
    try {
      const chatKey = getCurrentChatKey();
      localStorage.setItem(`pk_mvu_backup_${chatKey}`, JSON.stringify(mvuData));
    } catch (e) {
      console.warn('[SWSH Bridge] 备份失败:', e);
    }
    return mvuData;
  }

  // 优先级2/3：降级读取
  return loadStatDataLight();
}

/**
 * 降级读取函数
 */
function loadStatDataLight() {
  // 优先级2：从localStorage备份读取
  try {
    const chatKey = getCurrentChatKey();
    const backup = localStorage.getItem(`pk_mvu_backup_${chatKey}`);
    if (backup) {
      const parsed = JSON.parse(backup);
      if (parsed && parsed.训练家) {
        console.log('[SWSH Bridge] 从备份加载数据');
        return parsed;
      }
    }
  } catch (e) {
    console.warn('[SWSH Bridge] 备份读取失败:', e);
  }

  // 优先级3：从DOM元素读取旧版文本格式
  const el = document.querySelector('.statusbar-data-source');
  if (el) {
    const text = el.value || el.textContent || '';
    const parsed = loadFromText(text);
    if (parsed && parsed.训练家) {
      console.log('[SWSH Bridge] 从DOM文本加载数据');
      return parsed;
    }
  }

  // 兜底：返回默认数据
  console.warn('[SWSH Bridge] 无可用数据，使用默认数据');
  return getDefaultStat();
}

/**
 * 从Mvu插件获取数据
 */
function loadFromMvu() {
  try {
    // 检查Mvu插件是否存在
    if (typeof window.Mvu === 'undefined' || !window.Mvu.getMvuData) {
      console.log('[SWSH Bridge] Mvu插件未加载');
      return null;
    }

    let data = null;

    // 尝试1：从最新消息读取（最常用）
    data = window.Mvu.getMvuData({
      type: 'message',
      message_id: 'latest'
    });

    // 验证数据有效性
    if (data && data.stat_data && data.stat_data.训练家) {
      console.log('[SWSH Bridge] 从Mvu插件加载数据');
      return data.stat_data;
    }

    // 尝试2：如果有特定消息ID（可选）
    // const messageId = getTargetMessageId();
    // if (messageId) {
    //   data = window.Mvu.getMvuData({
    //     type: 'message',
    //     message_id: messageId
    //   });
    //   if (data && data.stat_data && data.stat_data.训练家) {
    //     return data.stat_data;
    //   }
    // }

    return null;

  } catch (e) {
    console.error('[SWSH Bridge] Mvu读取失败:', e);
    return null;
  }
}

/**
 * 从文本解析数据（旧版格式兼容）
 * 格式：[训练家信息]...[/训练家信息]
 */
function loadFromText(text) {
  // TODO: 实现文本解析逻辑
  // 目前暂时返回null，使用默认数据
  return null;
}

/**
 * 获取当前聊天的key（用于localStorage）
 */
function getCurrentChatKey() {
  // 简化实现：使用当前URL路径
  return window.location.pathname.replace(/\//g, '_') || 'default';
}

// ============================================
// 2. 数据转换（弦九格式 → SWSH格式）
// ============================================

/**
 * 转换队伍数据
 * @param {Object} xianjiu - 弦九数据格式
 * @returns {Array} SWSH队伍格式
 */
function convertParty(xianjiu) {
  if (!xianjiu || !xianjiu.队伍) return [];

  const party = [];

  // 弦九队伍：{ "1": {...}, "2": {...}, ... "6": {...} }
  for (let i = 1; i <= 6; i++) {
    const mon = xianjiu.队伍[String(i)];

    // 跳过空位
    if (!mon || mon.名字 === '空') {
      continue;
    }

    party.push({
      id: mon.ID || '0001',
      name: mon.名字 || '未知',
      nickname: mon.昵称 || '',
      level: parseInt(mon.等级) || 1,
      hp: mon.HP体力 || '100/100',
      gender: mon.性别 || '无',
      types: parseTypes(mon.属性 || '一般'),
      ability: mon.特性 || '',
      nature: mon.性格 || '勤奋',
      moves: parseMoves(mon),
      stats: parseStats(mon),
      friendship: parseInt(mon.亲密度) || 0,
      ball: mon.精灵球 || '精灵球'
    });
  }

  return party;
}

/**
 * 转换背包数据
 * @param {Object} xianjiu - 弦九数据格式
 * @returns {Array} SWSH背包格式
 */
function convertBag(xianjiu) {
  if (!xianjiu || !xianjiu.背包) return [];

  const bag = [];
  const xianjiunBag = xianjiu.背包;

  // 弦九背包：{ "道具名": 数量, ... }
  for (const [itemName, count] of Object.entries(xianjiunBag)) {
    bag.push({
      name: itemName,
      count: parseInt(count) || 1,
      description: '', // 描述需要从物品数据库获取
      category: guessItemCategory(itemName),
      icon: guessItemIcon(itemName)
    });
  }

  return bag;
}

/**
 * 转换图鉴数据
 * @param {Object} xianjiu - 弦九数据格式
 * @returns {Array} SWSH图鉴格式
 */
function convertDex(xianjiu) {
  if (!xianjiu || !xianjiu.图鉴) return [];

  const dex = [];
  const xianjiunDex = xianjiu.图鉴;

  // 弦九图鉴：{ "全国图鉴编号": { 捕获: true/false, 名字: "...", ... }, ... }
  for (const [dexId, entry] of Object.entries(xianjiunDex)) {
    dex.push({
      id: padDexId(dexId),
      name: entry.名字 || '???',
      caught: entry.捕获 === true,
      seen: true // 在图鉴中就算见过
    });
  }

  return dex;
}

/**
 * 转换训练家数据
 * @param {Object} xianjiu - 弦九数据格式
 * @returns {Object} SWSH训练家格式
 */
function convertTrainer(xianjiu) {
  if (!xianjiu || !xianjiu.训练家) {
    return {
      name: '训练家',
      money: 0,
      badges: 0,
      playtime: '00:00'
    };
  }

  const trainer = xianjiu.训练家;

  return {
    name: trainer.名字 || '训练家',
    money: parseInt(trainer.金钱) || 0,
    badges: parseInt(trainer.徽章数) || 0,
    playtime: trainer.游戏时长 || '00:00',
    location: trainer.当前位置 || '未知地点'
  };
}

// ============================================
// 3. 辅助函数
// ============================================

/**
 * 解析属性
 */
function parseTypes(typeStr) {
  if (!typeStr) return ['一般'];
  return typeStr.split('/').map(t => t.trim());
}

/**
 * 解析招式
 */
function parseMoves(mon) {
  const moves = [];
  for (let i = 1; i <= 4; i++) {
    const move = mon[`招式${i}`];
    if (move && move !== '无') {
      moves.push({
        name: move,
        pp: mon[`招式${i}PP`] || '10/10',
        type: mon[`招式${i}属性`] || '一般'
      });
    }
  }
  return moves;
}

/**
 * 解析种族值/个体值/努力值
 */
function parseStats(mon) {
  return {
    hp: parseInt(mon.HP) || 0,
    attack: parseInt(mon.攻击) || 0,
    defense: parseInt(mon.防御) || 0,
    spAttack: parseInt(mon.特攻) || 0,
    spDefense: parseInt(mon.特防) || 0,
    speed: parseInt(mon.速度) || 0
  };
}

/**
 * 猜测道具分类
 */
function guessItemCategory(itemName) {
  if (itemName.includes('药') || itemName.includes('治疗')) return '药品';
  if (itemName.includes('球')) return '精灵球';
  if (itemName.includes('招式')) return '招式学习器';
  if (itemName.includes('食材') || itemName.includes('咖喱')) return '食材';
  return '重要物品';
}

/**
 * 猜测道具图标
 */
function guessItemIcon(itemName) {
  // 简化实现：返回默认图标
  return '0025'; // 伤药图标
}

/**
 * 补齐图鉴编号为4位
 */
function padDexId(id) {
  return String(id).padStart(4, '0');
}

/**
 * 获取默认数据（兜底）
 */
function getDefaultStat() {
  return {
    训练家: {
      名字: '训练家',
      金钱: 0,
      徽章数: 0,
      游戏时长: '00:00',
      当前位置: '真新镇'
    },
    队伍: {
      '1': { 名字: '空' },
      '2': { 名字: '空' },
      '3': { 名字: '空' },
      '4': { 名字: '空' },
      '5': { 名字: '空' },
      '6': { 名字: '空' }
    },
    背包: {},
    图鉴: {}
  };
}

// ============================================
// 4. 导出接口
// ============================================

const swshBridge = {
  // 数据获取
  loadData: loadStatData,
  loadDataLight: loadStatDataLight,

  // 数据转换
  convertParty,
  convertBag,
  convertDex,
  convertTrainer,

  // 工具函数
  getCurrentChatKey,

  // 版本信息
  version: '1.0.0'
};

// 如果在浏览器环境，挂载到window
if (typeof window !== 'undefined') {
  window.swshBridge = swshBridge;
}

// 如果是ES6模块环境，导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = swshBridge;
}
