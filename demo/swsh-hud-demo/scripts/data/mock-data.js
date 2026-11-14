// ============================================
// Mock Data - 测试数据
// ============================================

export const MENU = [
  {key:"dex",label:"图鉴",icon:"xmenu_button_icon_pokedex_00^s-render.png",title:"POKÉDEX"},
  {key:"team",label:"宝可梦",icon:"xmenu_button_icon_pokemon_00^s-render.png",title:"POKÉMON"},
  {key:"bag",label:"包包",icon:"xmenu_button_icon_bag_00^s-render.png",title:"BAG"},
  {key:"badge",label:"联盟卡",nativeIcon:"icon_license.png",title:"LEAGUE CARD"},
  {key:"box",label:"盒子",nativeIcon:"icon_camp.png",title:"POKÉMON BOX"},
  {key:"map",label:"城镇地图",icon:"xmenu_button_icon_map_00^s-render.png",title:"MAP"},
  {key:"relations",label:"人际关系",nativeIcon:"icon_report.png",title:"RELATIONSHIPS"},
  {key:"world",label:"世界",nativeIcon:"icon_live.png",title:"WORLD"},
  {key:"battle",label:"战场",nativeIcon:"icon_bs.png",title:"BATTLE"},
  {key:"settings",label:"设置",icon:"xmenu_button_icon_config_00^s-render.png",title:"OPTIONS"}
];

// 由于数据太长，我建议：
// 1. 保持原版JavaScript不变（已经很好了）
// 2. 只提取CSS（已完成✅）
// 3. 下一步专注于对接弦九插件

// 原因：
// - 原版JS已经很清晰，678行代码结构合理
// - 强行拆分可能引入bug
// - 我们的主要目标是对接弦九，不是过度工程化
