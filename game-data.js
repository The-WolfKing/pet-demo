/**
 * game-data.js - 伙伴繁育系统 数据配置 v2
 */

// ========== 品质配置 ==========
const QUALITY = {
  1: { name: '普通', color: '#2ecc71', css: 'q-green', coeff: 1.00 },
  2: { name: '精良', color: '#3498db', css: 'q-blue',  coeff: 1.10 },
  3: { name: '稀有', color: '#9b59b6', css: 'q-purple', coeff: 1.21 },
  4: { name: '史诗', color: '#e67e22', css: 'q-orange', coeff: 1.33 },
  5: { name: '传说', color: '#e74c3c', css: 'q-red',   coeff: 1.46 },
};

// ========== 类型模板 ==========
// 资质基数 — 三种类型总和相同(2518)，分配不同
// 攻击型ATK最高988 → 传说(×1.46)满进化(×1.331) = 1919
// 品质系数: 普通1.00 精良1.10 稀有1.21 史诗1.33 传说1.46
const TYPE_TEMPLATE = {
  attack:  { name: '战斗型', atk: 988, def: 665, hp: 865, icon: '⚔️' },  // 总2518 高攻低防
  defense: { name: '防御型', atk: 665, def: 988, hp: 865, icon: '🛡️' },  // 总2518 高防低攻
  balance: { name: '均衡型', atk: 839, def: 839, hp: 840, icon: '⚖️' },  // 总2518 均匀分配
};

// ========== 技能定义（全局技能库，带图标和描述） ==========
const SKILL_DB = {
  // 灵猫
  '利爪撕裂':   { icon: '🐾', desc: '以锋利爪牙撕裂目标，造成ATK×120%伤害', type: 'atk', cd: 1, coeff: 1.2, stat: 'atk' },
  '暗影突袭':   { icon: '🌑', desc: '瞬移至目标身后发动突袭，造成ATK×180%伤害', type: 'atk', cd: 3, coeff: 1.8, stat: 'atk' },
  '猫之敏捷':   { icon: '💨', desc: '提升自身闪避率20%，持续2回合', type: 'buff', cd: 4, coeff: 0, stat: 'none', buffType: 'dodge', buffVal: 0.2, buffDur: 2 },
  '九命之躯':   { icon: '💖', desc: '受到致死伤害时恢复30%HP，每场战斗1次', type: 'passive', cd: 99, coeff: 0.3, stat: 'hp' },
  '月光斩':     { icon: '🌙', desc: '聚集月光之力斩出弧形光刃，造成ATK×150%范围伤害', type: 'atk', cd: 2, coeff: 1.5, stat: 'atk' },
  '暗夜潜行':   { icon: '🦇', desc: '进入隐身状态，下次攻击暴击', type: 'buff', cd: 5, coeff: 0, stat: 'none', buffType: 'crit', buffVal: 1.0, buffDur: 1 },
  '影刃风暴':   { icon: '⚔️', desc: '【进化技】释放影刃风暴，造成ATK×250%伤害', type: 'atk', cd: 6, coeff: 2.5, stat: 'atk' },
  // 铁甲龟
  '龟壳防御':   { icon: '🛡️', desc: '缩入壳中，减伤30%持续2回合', type: 'buff', cd: 3, coeff: 0, stat: 'none', buffType: 'defUp', buffVal: 0.3, buffDur: 2 },
  '地震冲击':   { icon: '💥', desc: '重击地面，造成DEF×100%伤害', type: 'atk', cd: 2, coeff: 1.0, stat: 'def' },
  '铁壁':       { icon: '🧱', desc: '硬化外壳，防御+40%持续2回合', type: 'buff', cd: 4, coeff: 0, stat: 'none', buffType: 'defUp', buffVal: 0.4, buffDur: 2 },
  '水流护盾':   { icon: '🌊', desc: '护盾吸收DEF×200%伤害', type: 'buff', cd: 5, coeff: 2.0, stat: 'def', buffType: 'shield', buffVal: 2.0, buffDur: 3 },
  '大地之力':   { icon: '🌍', desc: '恢复自身20%最大HP', type: 'heal', cd: 4, coeff: 0.2, stat: 'hp' },
  '绝对防御':   { icon: '🏰', desc: '【进化技】2回合免疫伤害', type: 'buff', cd: 8, coeff: 0, stat: 'none', buffType: 'immune', buffVal: 1, buffDur: 2 },
  // 草原狼
  '狼嚎':       { icon: '🐺', desc: '战斗嚎叫，队伍攻击+15%持续2回合', type: 'buff', cd: 4, coeff: 0, stat: 'none', buffType: 'atkUp', buffVal: 0.15, buffDur: 2 },
  '撕咬':       { icon: '🦷', desc: '凶猛撕咬，造成ATK×130%伤害', type: 'atk', cd: 1, coeff: 1.3, stat: 'atk' },
  '协同攻击':   { icon: '🤝', desc: '协同攻击，下次攻击+25%', type: 'buff', cd: 3, coeff: 0, stat: 'none', buffType: 'atkUp', buffVal: 0.25, buffDur: 1 },
  '月下突袭':   { icon: '🌕', desc: '急速突袭，造成ATK×200%伤害', type: 'atk', cd: 4, coeff: 2.0, stat: 'atk' },
  '狼群战术':   { icon: '🐾', desc: '狼群分身，造成ATK×180%伤害', type: 'atk', cd: 3, coeff: 1.8, stat: 'atk' },
  '疾风步':     { icon: '💨', desc: '闪避下一次攻击', type: 'buff', cd: 5, coeff: 0, stat: 'none', buffType: 'dodge', buffVal: 1.0, buffDur: 1 },
  '狼王之怒':   { icon: '👑', desc: '【进化技】全属性+30%持续3回合', type: 'buff', cd: 7, coeff: 0, stat: 'none', buffType: 'allUp', buffVal: 0.3, buffDur: 3 },
  // 荧光蝶
  '毒粉':       { icon: '☠️', desc: '毒粉，目标每回合损失5%HP持续3回合', type: 'debuff', cd: 3, coeff: 0.05, stat: 'hp', buffType: 'dot', buffDur: 3 },
  '催眠孢子':   { icon: '😴', desc: '催眠目标1回合', type: 'debuff', cd: 5, coeff: 0, stat: 'none', buffType: 'stun', buffDur: 1 },
  '风之刃':     { icon: '🌪️', desc: '风刃攻击，造成ATK×140%伤害', type: 'atk', cd: 1, coeff: 1.4, stat: 'atk' },
  '彩虹光束':   { icon: '🌈', desc: '七彩光束，造成ATK×160%伤害', type: 'atk', cd: 2, coeff: 1.6, stat: 'atk' },
  // 雷霆虎
  '雷霆万钧':   { icon: '⚡', desc: '雷电轰击，造成ATK×250%伤害', type: 'atk', cd: 5, coeff: 2.5, stat: 'atk' },
  '虎啸':       { icon: '🐯', desc: '震慑敌方，降攻15%持续2回合', type: 'debuff', cd: 4, coeff: 0, stat: 'none', buffType: 'atkDown', buffVal: 0.15, buffDur: 2 },
  '闪电突袭':   { icon: '⚡', desc: '闪电突进，造成ATK×180%伤害', type: 'atk', cd: 3, coeff: 1.8, stat: 'atk' },
  '雷光爪':     { icon: '🐾', desc: '雷电爪击，造成ATK×160%伤害', type: 'atk', cd: 2, coeff: 1.6, stat: 'atk' },
  '电磁脉冲':   { icon: '📡', desc: '电磁脉冲，降速2回合', type: 'debuff', cd: 4, coeff: 0, stat: 'none', buffType: 'slow', buffDur: 2 },
  '雷暴领域':   { icon: '🌩️', desc: '雷暴领域，每回合ATK×80%伤害持续3回合', type: 'atk', cd: 5, coeff: 0.8, stat: 'atk', buffType: 'dot', buffDur: 3 },
  '虎威':       { icon: '💪', desc: '虎威，暴击率+25%持续2回合', type: 'buff', cd: 4, coeff: 0, stat: 'none', buffType: 'crit', buffVal: 0.25, buffDur: 2 },
  '蓄力一击':   { icon: '🔥', desc: '蓄力全力一击，造成ATK×400%伤害', type: 'atk', cd: 6, coeff: 4.0, stat: 'atk' },
  '天雷灭世':   { icon: '🌟', desc: '【进化技】天雷灭世，ATK×500%伤害', type: 'atk', cd: 8, coeff: 5.0, stat: 'atk' },
  // 寒冰鹿
  '冰霜吐息':   { icon: '❄️', desc: '冰息攻击，ATK×140%伤害', type: 'atk', cd: 2, coeff: 1.4, stat: 'atk' },
  '寒冰护盾':   { icon: '🧊', desc: '护盾吸收DEF×180%伤害', type: 'buff', cd: 5, coeff: 1.8, stat: 'def', buffType: 'shield', buffVal: 1.8, buffDur: 3 },
  '极寒之地':   { icon: '🌨️', desc: '冻结敌人2回合', type: 'debuff', cd: 5, coeff: 0, stat: 'none', buffType: 'stun', buffDur: 1 },
  '治愈之光':   { icon: '💚', desc: '恢复全队15%HP', type: 'heal', cd: 4, coeff: 0.15, stat: 'hp' },
  '冰晶箭':     { icon: '🏹', desc: '冰晶箭，ATK×170%伤害', type: 'atk', cd: 3, coeff: 1.7, stat: 'atk' },
  '自然祝福':   { icon: '🌿', desc: '每回合恢复5%HP持续3回合', type: 'heal', cd: 5, coeff: 0.05, stat: 'hp', buffType: 'hot', buffDur: 3 },
  '绝对零度':   { icon: '💎', desc: '【进化技】ATK×300%伤害', type: 'atk', cd: 7, coeff: 3.0, stat: 'atk' },
  // 烈焰凤
  '凤凰之火':   { icon: '🔥', desc: '凤凰圣火，ATK×200%伤害', type: 'atk', cd: 3, coeff: 2.0, stat: 'atk' },
  '浴火重生':   { icon: '🔄', desc: '死亡时50%HP复活一次', type: 'passive', cd: 99, coeff: 0.5, stat: 'hp' },
  '烈焰风暴':   { icon: '🌪️', desc: '烈焰风暴，ATK×160%伤害', type: 'atk', cd: 3, coeff: 1.6, stat: 'atk' },
  '火羽':       { icon: '🪶', desc: '火羽攻击，ATK×130%伤害', type: 'atk', cd: 1, coeff: 1.3, stat: 'atk' },
  '涅槃之翼':   { icon: '✨', desc: '全队攻击+20%持续2回合', type: 'buff', cd: 5, coeff: 0, stat: 'none', buffType: 'atkUp', buffVal: 0.2, buffDur: 2 },
  '灭世焰':     { icon: '☀️', desc: '【进化技】ATK×350%伤害', type: 'atk', cd: 7, coeff: 3.5, stat: 'atk' },
  // 暗影鸦
  '暗影啄击':   { icon: '🖤', desc: '暗影啄击，ATK×140%伤害', type: 'atk', cd: 1, coeff: 1.4, stat: 'atk' },
  '黑雾':       { icon: '🌫️', desc: '黑雾降低命中30%持续2回合', type: 'debuff', cd: 4, coeff: 0, stat: 'none', buffType: 'missUp', buffVal: 0.3, buffDur: 2 },
  '诅咒之眼':   { icon: '👁️', desc: '诅咒，每回合损失4%HP持续3回合', type: 'debuff', cd: 4, coeff: 0.04, stat: 'hp', buffType: 'dot', buffDur: 3 },
  '暗影分身':   { icon: '👤', desc: '分身减伤50%持续2回合', type: 'buff', cd: 5, coeff: 0, stat: 'none', buffType: 'defUp', buffVal: 0.5, buffDur: 2 },
  '死亡俯冲':   { icon: '💀', desc: '急速俯冲，ATK×220%伤害', type: 'atk', cd: 4, coeff: 2.2, stat: 'atk' },
  '黑暗领域':   { icon: '⬛', desc: '【进化技】敌方全属性-20%持续3回合', type: 'debuff', cd: 7, coeff: 0, stat: 'none', buffType: 'allDown', buffVal: 0.2, buffDur: 3 },
  // 翡翠蛇
  '毒牙':       { icon: '🐍', desc: '毒牙咬噬，ATK×130%伤害', type: 'atk', cd: 1, coeff: 1.3, stat: 'atk' },
  '蛇缠':       { icon: '🔗', desc: '缠绕目标1回合', type: 'debuff', cd: 5, coeff: 0, stat: 'none', buffType: 'stun', buffDur: 1 },
  '酸液喷射':   { icon: '🧪', desc: '酸液，ATK×150%伤害并降防', type: 'atk', cd: 3, coeff: 1.5, stat: 'atk' },
  '蜕皮':       { icon: '🐚', desc: '恢复20%HP', type: 'heal', cd: 4, coeff: 0.2, stat: 'hp' },
  '毒雾扩散':   { icon: '💜', desc: '毒雾，每回合损失5%HP持续3回合', type: 'debuff', cd: 4, coeff: 0.05, stat: 'hp', buffType: 'dot', buffDur: 3 },
  '剧毒领域':   { icon: '☣️', desc: '【进化技】剧毒领域，ATK×280%伤害', type: 'atk', cd: 7, coeff: 2.8, stat: 'atk' },
  // 岩石熊
  '重拳':       { icon: '👊', desc: '石化重拳，ATK×160%伤害', type: 'atk', cd: 2, coeff: 1.6, stat: 'atk' },
  '岩石护甲':   { icon: '🪨', desc: '防御+50%持续2回合', type: 'buff', cd: 4, coeff: 0, stat: 'none', buffType: 'defUp', buffVal: 0.5, buffDur: 2 },
  '大地震颤':   { icon: '🌋', desc: '震颤，DEF×120%伤害', type: 'atk', cd: 3, coeff: 1.2, stat: 'def' },
  '愤怒咆哮':   { icon: '😡', desc: '嘲讽+防御+30%持续2回合', type: 'buff', cd: 5, coeff: 0, stat: 'none', buffType: 'defUp', buffVal: 0.3, buffDur: 2 },
  '石化之躯':   { icon: '🗿', desc: '2回合免疫伤害', type: 'buff', cd: 6, coeff: 0, stat: 'none', buffType: 'immune', buffVal: 1, buffDur: 2 },
  '山崩地裂':   { icon: '⛰️', desc: '【进化技】山崩，(ATK+DEF)×200%伤害', type: 'atk', cd: 7, coeff: 2.0, stat: 'atkdef' },
  // 星光兔
  '星光弹':     { icon: '⭐', desc: '星光弹，ATK×120%伤害', type: 'atk', cd: 1, coeff: 1.2, stat: 'atk' },
  '月兔跳跃':   { icon: '🐇', desc: '闪避+40%持续2回合', type: 'buff', cd: 4, coeff: 0, stat: 'none', buffType: 'dodge', buffVal: 0.4, buffDur: 2 },
  '星尘治愈':   { icon: '✨', desc: '恢复全队25%HP', type: 'heal', cd: 4, coeff: 0.25, stat: 'hp' },
  '幸运星':     { icon: '🍀', desc: '暴击+30%持续2回合', type: 'buff', cd: 4, coeff: 0, stat: 'none', buffType: 'crit', buffVal: 0.3, buffDur: 2 },
  '星河洪流':   { icon: '🌌', desc: '星河之力，ATK×200%伤害', type: 'atk', cd: 4, coeff: 2.0, stat: 'atk' },
  '星辰祝福':   { icon: '🌠', desc: '【进化技】全队回复40%HP并增攻15%', type: 'heal', cd: 7, coeff: 0.4, stat: 'hp', buffType: 'atkUp', buffVal: 0.15, buffDur: 3 },

  // ========== 新增伙伴技能 ==========
  // 小火鼠
  '火花啃咬':   { icon: '🔥', desc: '火花啃咬，ATK×110%伤害', type: 'atk', cd: 1, coeff: 1.1, stat: 'atk' },
  '灵巧闪避':   { icon: '💨', desc: '闪避+20%持续1回合', type: 'buff', cd: 3, coeff: 0, stat: 'none', buffType: 'dodge', buffVal: 0.2, buffDur: 1 },
  '火鼠冲锋':   { icon: '🐭', desc: '燃烧冲锋，ATK×150%伤害', type: 'atk', cd: 2, coeff: 1.5, stat: 'atk' },
  // 翠羽雀
  '啄击':       { icon: '🐦', desc: '连续啄击，ATK×110%伤害', type: 'atk', cd: 1, coeff: 1.1, stat: 'atk' },
  '羽毛飞刃':   { icon: '🪶', desc: '羽毛化刃，ATK×140%伤害', type: 'atk', cd: 2, coeff: 1.4, stat: 'atk' },
  '清脆鸣唱':   { icon: '🎵', desc: '恢复全队10%HP', type: 'heal', cd: 3, coeff: 0.1, stat: 'hp' },
  // 泥潭蛙
  '毒舌弹射':   { icon: '🐸', desc: '毒舌攻击，ATK×120%伤害', type: 'atk', cd: 1, coeff: 1.2, stat: 'atk' },
  '泥浆护盾':   { icon: '🛡️', desc: '减伤20%持续2回合', type: 'buff', cd: 3, coeff: 0, stat: 'none', buffType: 'defUp', buffVal: 0.2, buffDur: 2 },
  '蛙鸣震波':   { icon: '📢', desc: '震波攻击，ATK×140%伤害', type: 'atk', cd: 2, coeff: 1.4, stat: 'atk' },
  // 刺背猬
  '蜷缩防御':   { icon: '🦔', desc: '蜷缩防御+35%持续2回合', type: 'buff', cd: 3, coeff: 0, stat: 'none', buffType: 'defUp', buffVal: 0.35, buffDur: 2 },
  '尖刺反击':   { icon: '📌', desc: '反击造成DEF×80%伤害', type: 'atk', cd: 2, coeff: 0.8, stat: 'def' },
  '冲撞':       { icon: '💥', desc: '全力冲撞，ATK×130%伤害', type: 'atk', cd: 1, coeff: 1.3, stat: 'atk' },
  // 花尾鲤
  '水流喷射':   { icon: '💧', desc: '水流喷射，ATK×110%伤害', type: 'atk', cd: 1, coeff: 1.1, stat: 'atk' },
  '鲤鱼跃龙门': { icon: '🐟', desc: '全属性+10%持续2回合', type: 'buff', cd: 4, coeff: 0, stat: 'none', buffType: 'allUp', buffVal: 0.1, buffDur: 2 },
  '水幕':       { icon: '🌊', desc: '水幕护体减伤20%持续2回合', type: 'buff', cd: 3, coeff: 0, stat: 'none', buffType: 'defUp', buffVal: 0.2, buffDur: 2 },
  // 赤角鹿
  '鹿角冲撞':   { icon: '🦌', desc: '鹿角猛撞，ATK×140%伤害', type: 'atk', cd: 2, coeff: 1.4, stat: 'atk' },
  '草木治愈':   { icon: '🌿', desc: '恢复自身15%HP', type: 'heal', cd: 3, coeff: 0.15, stat: 'hp' },
  '飞奔突击':   { icon: '💨', desc: '急速突击，ATK×170%伤害', type: 'atk', cd: 3, coeff: 1.7, stat: 'atk' },
  '自然之力':   { icon: '🌳', desc: '自然之力，恢复全队10%HP', type: 'heal', cd: 4, coeff: 0.1, stat: 'hp' },
  // 风行鹰
  '俯冲猎杀':   { icon: '🦅', desc: '高空俯冲，ATK×180%伤害', type: 'atk', cd: 3, coeff: 1.8, stat: 'atk' },
  '鹰眼锁定':   { icon: '👁️', desc: '暴击+25%持续2回合', type: 'buff', cd: 4, coeff: 0, stat: 'none', buffType: 'crit', buffVal: 0.25, buffDur: 2 },
  '风刃羽':     { icon: '🪶', desc: '风刃攻击，ATK×140%伤害', type: 'atk', cd: 1, coeff: 1.4, stat: 'atk' },
  '高空盘旋':   { icon: '🌀', desc: '闪避+30%持续2回合', type: 'buff', cd: 4, coeff: 0, stat: 'none', buffType: 'dodge', buffVal: 0.3, buffDur: 2 },
  // 雷鳗
  '放电':       { icon: '⚡', desc: '放电攻击，ATK×150%伤害', type: 'atk', cd: 2, coeff: 1.5, stat: 'atk' },
  '电流缠绕':   { icon: '🔗', desc: '电流缠绕，降速2回合', type: 'debuff', cd: 4, coeff: 0, stat: 'none', buffType: 'slow', buffDur: 2 },
  '水中闪击':   { icon: '💧', desc: '水中突袭，ATK×180%伤害', type: 'atk', cd: 3, coeff: 1.8, stat: 'atk' },
  '麻痹之触':   { icon: '⚡', desc: '麻痹1回合', type: 'debuff', cd: 5, coeff: 0, stat: 'none', buffType: 'stun', buffDur: 1 },
  // 霜牙獾
  '冰牙撕咬':   { icon: '🦡', desc: '冰牙撕咬，ATK×140%伤害', type: 'atk', cd: 1, coeff: 1.4, stat: 'atk' },
  '坚毅不屈':   { icon: '💪', desc: '防御+30%持续2回合', type: 'buff', cd: 3, coeff: 0, stat: 'none', buffType: 'defUp', buffVal: 0.3, buffDur: 2 },
  '寒霜吐息':   { icon: '❄️', desc: '寒霜吐息，ATK×160%伤害', type: 'atk', cd: 2, coeff: 1.6, stat: 'atk' },
  '獾穴防御':   { icon: '🏠', desc: '蜷缩防御+40%持续2回合', type: 'buff', cd: 4, coeff: 0, stat: 'none', buffType: 'defUp', buffVal: 0.4, buffDur: 2 },
  // 岩甲犀
  '犀角冲撞':   { icon: '🦏', desc: '犀角冲锋，ATK×170%伤害', type: 'atk', cd: 2, coeff: 1.7, stat: 'atk' },
  '岩石铠甲':   { icon: '🪨', desc: '防御+45%持续2回合', type: 'buff', cd: 4, coeff: 0, stat: 'none', buffType: 'defUp', buffVal: 0.45, buffDur: 2 },
  '大地踏步':   { icon: '🌍', desc: '震颤，DEF×100%伤害', type: 'atk', cd: 3, coeff: 1.0, stat: 'def' },
  '蛮力横扫':   { icon: '💥', desc: '横扫，ATK×190%伤害', type: 'atk', cd: 3, coeff: 1.9, stat: 'atk' },
  // 九色鹦
  '彩羽飞舞':   { icon: '🦜', desc: '彩羽攻击，ATK×140%伤害', type: 'atk', cd: 1, coeff: 1.4, stat: 'atk' },
  '模仿术':     { icon: '🪞', desc: '复制敌方最强技能效果', type: 'buff', cd: 5, coeff: 0, stat: 'none', buffType: 'atkUp', buffVal: 0.2, buffDur: 2 },
  '七彩光环':   { icon: '🌈', desc: '全队防御+15%持续2回合', type: 'buff', cd: 4, coeff: 0, stat: 'none', buffType: 'defUp', buffVal: 0.15, buffDur: 2 },
  '羽刃风暴':   { icon: '🌪️', desc: '羽刃风暴，ATK×200%伤害', type: 'atk', cd: 4, coeff: 2.0, stat: 'atk' },
  // 幻雾狐
  '狐火':       { icon: '🦊', desc: '狐火攻击，ATK×150%伤害', type: 'atk', cd: 2, coeff: 1.5, stat: 'atk' },
  '幻术迷雾':   { icon: '🌫️', desc: '敌方命中-25%持续2回合', type: 'debuff', cd: 4, coeff: 0, stat: 'none', buffType: 'missUp', buffVal: 0.25, buffDur: 2 },
  '魅惑之眼':   { icon: '👁️', desc: '眩晕敌方1回合', type: 'debuff', cd: 5, coeff: 0, stat: 'none', buffType: 'stun', buffDur: 1 },
  '九尾鞭击':   { icon: '🐾', desc: '九尾连击，ATK×220%伤害', type: 'atk', cd: 4, coeff: 2.2, stat: 'atk' },
  '灵狐步':     { icon: '💨', desc: '灵动步法，闪避+35%持续2回合', type: 'buff', cd: 4, coeff: 0, stat: 'none', buffType: 'dodge', buffVal: 0.35, buffDur: 2 },
  // 玄武蜥
  '玄甲守护':   { icon: '🦎', desc: '玄甲护体，DEF+40%持续2回合', type: 'buff', cd: 3, coeff: 0, stat: 'none', buffType: 'defUp', buffVal: 0.4, buffDur: 2 },
  '龙尾横扫':   { icon: '🐉', desc: '龙尾横扫，ATK×160%伤害', type: 'atk', cd: 2, coeff: 1.6, stat: 'atk' },
  '寒水吐息':   { icon: '❄️', desc: '寒水吐息，ATK×180%伤害', type: 'atk', cd: 3, coeff: 1.8, stat: 'atk' },
  '坚壳再生':   { icon: '💚', desc: '恢复自身25%HP', type: 'heal', cd: 4, coeff: 0.25, stat: 'hp' },
  // 冰晶蝎
  '寒毒尾刺':   { icon: '🦂', desc: '寒毒尾刺，ATK×160%伤害', type: 'atk', cd: 2, coeff: 1.6, stat: 'atk' },
  '冰甲':       { icon: '🧊', desc: '冰甲护体，DEF+30%持续2回合', type: 'buff', cd: 3, coeff: 0, stat: 'none', buffType: 'defUp', buffVal: 0.3, buffDur: 2 },
  '冻结之钳':   { icon: '❄️', desc: '冻结之钳，ATK×200%伤害', type: 'atk', cd: 4, coeff: 2.0, stat: 'atk' },
  '冰晶暴风':   { icon: '🌨️', desc: '冰晶暴风，ATK×180%伤害', type: 'atk', cd: 3, coeff: 1.8, stat: 'atk' },
  // 穷奇（史诗）
  '穷奇噬魂':   { icon: '👹', desc: '噬魂攻击，ATK×200%伤害', type: 'atk', cd: 3, coeff: 2.0, stat: 'atk' },
  '邪风裂空':   { icon: '🌪️', desc: '邪风裂空，ATK×250%伤害', type: 'atk', cd: 5, coeff: 2.5, stat: 'atk' },
  '暴虐冲锋':   { icon: '💀', desc: '暴虐冲锋，ATK×180%伤害', type: 'atk', cd: 2, coeff: 1.8, stat: 'atk' },
  '恐惧嚎叫':   { icon: '😱', desc: '降低敌方全属性15%持续2回合', type: 'debuff', cd: 5, coeff: 0, stat: 'none', buffType: 'allDown', buffVal: 0.15, buffDur: 2 },
  '吞天':       { icon: '🌑', desc: '吞噬天日，ATK×300%伤害', type: 'atk', cd: 6, coeff: 3.0, stat: 'atk' },
  '天罚之牙':   { icon: '⚡', desc: '【进化技】天罚裁决，ATK×400%伤害', type: 'atk', cd: 8, coeff: 4.0, stat: 'atk' },
  // 毕方（史诗）
  '毕方圣焰':   { icon: '🔥', desc: '圣焰灼烧，ATK×200%伤害', type: 'atk', cd: 3, coeff: 2.0, stat: 'atk' },
  '炎翼斩':     { icon: '🪶', desc: '炎翼斩击，ATK×180%伤害', type: 'atk', cd: 2, coeff: 1.8, stat: 'atk' },
  '火雨倾盆':   { icon: '🌧️', desc: '火雨，ATK×160%伤害持续2回合', type: 'atk', cd: 4, coeff: 1.6, stat: 'atk', buffType: 'dot', buffDur: 2 },
  '涅槃之羽':   { icon: '🔄', desc: '恢复全队20%HP', type: 'heal', cd: 5, coeff: 0.2, stat: 'hp' },
  '灼烧领域':   { icon: '☀️', desc: '灼烧领域，每回合ATK×80%伤害持续3回合', type: 'atk', cd: 5, coeff: 0.8, stat: 'atk', buffType: 'dot', buffDur: 3 },
  '焚天之翼':   { icon: '🌟', desc: '【进化技】焚天之翼，ATK×450%伤害', type: 'atk', cd: 8, coeff: 4.5, stat: 'atk' },
  // 应龙（史诗）
  '龙息吐纳':   { icon: '🐉', desc: '龙息攻击，ATK×180%伤害', type: 'atk', cd: 2, coeff: 1.8, stat: 'atk' },
  '龙鳞护壁':   { icon: '🛡️', desc: '龙鳞护体，DEF+50%持续2回合', type: 'buff', cd: 4, coeff: 0, stat: 'none', buffType: 'defUp', buffVal: 0.5, buffDur: 2 },
  '云海翻腾':   { icon: '☁️', desc: '云海翻腾，ATK×200%伤害', type: 'atk', cd: 4, coeff: 2.0, stat: 'atk' },
  '应龙之怒':   { icon: '😤', desc: '应龙怒吼，全队攻+20%持续2回合', type: 'buff', cd: 5, coeff: 0, stat: 'none', buffType: 'atkUp', buffVal: 0.2, buffDur: 2 },
  '天降暴雨':   { icon: '🌧️', desc: '暴雨洪流，DEF×150%伤害', type: 'atk', cd: 3, coeff: 1.5, stat: 'def' },
  '苍龙破天':   { icon: '🌟', desc: '【进化技】苍龙破天，(ATK+DEF)×300%伤害', type: 'atk', cd: 8, coeff: 3.0, stat: 'atkdef' },
  // 麒麟（传说）
  '麒麟踏焰':   { icon: '🦄', desc: '麒麟踏焰，ATK×250%伤害', type: 'atk', cd: 4, coeff: 2.5, stat: 'atk' },
  '圣光庇佑':   { icon: '✨', desc: '全队减伤30%持续2回合', type: 'buff', cd: 5, coeff: 0, stat: 'none', buffType: 'defUp', buffVal: 0.3, buffDur: 2 },
  '瑞气千条':   { icon: '🌈', desc: '恢复全队25%HP', type: 'heal', cd: 5, coeff: 0.25, stat: 'hp' },
  '天地正气':   { icon: '☯️', desc: '全队全属性+20%持续3回合', type: 'buff', cd: 6, coeff: 0, stat: 'none', buffType: 'allUp', buffVal: 0.2, buffDur: 3 },
  '麒麟圣裁':   { icon: '⚡', desc: '神圣制裁，ATK×350%伤害', type: 'atk', cd: 6, coeff: 3.5, stat: 'atk' },
  '太平降世':   { icon: '🌟', desc: '【进化技】太平降世，全队回复50%HP并全属性+25%', type: 'heal', cd: 9, coeff: 0.5, stat: 'hp', buffType: 'allUp', buffVal: 0.25, buffDur: 3 },
  // 白泽（传说）
  '白泽神光':   { icon: '🐲', desc: '神光攻击，ATK×220%伤害', type: 'atk', cd: 3, coeff: 2.2, stat: 'atk' },
  '万妖退散':   { icon: '🌟', desc: '净化敌方增益并降攻20%', type: 'debuff', cd: 5, coeff: 0, stat: 'none', buffType: 'atkDown', buffVal: 0.2, buffDur: 2 },
  '知命预言':   { icon: '🔮', desc: '预言闪避，闪避+50%持续1回合', type: 'buff', cd: 4, coeff: 0, stat: 'none', buffType: 'dodge', buffVal: 0.5, buffDur: 1 },
  '灵识护盾':   { icon: '🛡️', desc: '护盾吸收DEF×250%伤害', type: 'buff', cd: 5, coeff: 2.5, stat: 'def', buffType: 'shield', buffVal: 2.5, buffDur: 3 },
  '净化波动':   { icon: '💎', desc: '净化波，ATK×280%伤害', type: 'atk', cd: 5, coeff: 2.8, stat: 'atk' },
  '万象归一':   { icon: '☯️', desc: '【进化技】万象归一，2回合免疫+全队回复30%HP', type: 'buff', cd: 9, coeff: 0.3, stat: 'hp', buffType: 'immune', buffVal: 1, buffDur: 2 },
  // 鲲鹏（传说）
  '鲲化为鹏':   { icon: '🐋', desc: '变身鹏鸟，ATK+30%持续3回合', type: 'buff', cd: 5, coeff: 0, stat: 'none', buffType: 'atkUp', buffVal: 0.3, buffDur: 3 },
  '扶摇万里':   { icon: '🌪️', desc: '扶摇直上，ATK×300%伤害', type: 'atk', cd: 5, coeff: 3.0, stat: 'atk' },
  '北冥之怒':   { icon: '🌊', desc: '北冥之力，ATK×250%伤害', type: 'atk', cd: 4, coeff: 2.5, stat: 'atk' },
  '天风破灭':   { icon: '💨', desc: '天风之力，ATK×200%伤害', type: 'atk', cd: 3, coeff: 2.0, stat: 'atk' },
  '吞噬虚空':   { icon: '⬛', desc: '吞噬，ATK×350%伤害', type: 'atk', cd: 6, coeff: 3.5, stat: 'atk' },
  '逍遥游':     { icon: '🌌', desc: '【进化技】逍遥游，ATK×600%伤害', type: 'atk', cd: 10, coeff: 6.0, stat: 'atk' },
};

// ========== 伙伴种类（31种） ==========
// quality: 固定品质 1普通 2精良 3稀有 4史诗 5传说
const SPECIES = [
  // === 普通 🟢 (7种) ===
  { id: 11, name: '星光兔', emoji: '🐰', type: 'balance', quality: 1, skills: ['星光弹','月兔跳跃','星尘治愈','幸运星','星河洪流'], evoSkill: '星辰祝福', maxEvo: 2 },
  { id: 4,  name: '荧光蝶', emoji: '🦋', type: 'attack',  quality: 1, skills: ['毒粉','催眠孢子','风之刃','彩虹光束'], evoSkill: null, maxEvo: 0 },
  { id: 12, name: '小火鼠', emoji: '🐭', type: 'attack',  quality: 1, skills: ['火花啃咬','灵巧闪避','火鼠冲锋'], evoSkill: null, maxEvo: 0 },
  { id: 13, name: '翠羽雀', emoji: '🐦', type: 'balance', quality: 1, skills: ['啄击','羽毛飞刃','清脆鸣唱'], evoSkill: null, maxEvo: 0 },
  { id: 14, name: '泥潭蛙', emoji: '🐸', type: 'defense', quality: 1, skills: ['毒舌弹射','泥浆护盾','蛙鸣震波'], evoSkill: null, maxEvo: 0 },
  { id: 15, name: '刺背猬', emoji: '🦔', type: 'defense', quality: 1, skills: ['蜷缩防御','尖刺反击','冲撞'], evoSkill: null, maxEvo: 0 },
  { id: 16, name: '花尾鲤', emoji: '🐟', type: 'balance', quality: 1, skills: ['水流喷射','鲤鱼跃龙门','水幕'], evoSkill: null, maxEvo: 0 },
  // === 精良 🔵 (8种) ===
  { id: 3,  name: '草原狼', emoji: '🐺', type: 'balance', quality: 2, skills: ['狼嚎','撕咬','协同攻击','月下突袭','狼群战术','疾风步'], evoSkill: '狼王之怒', maxEvo: 1 },
  { id: 9,  name: '翡翠蛇', emoji: '🐍', type: 'balance', quality: 2, skills: ['毒牙','蛇缠','酸液喷射','蜕皮','毒雾扩散'], evoSkill: '剧毒领域', maxEvo: 2 },
  { id: 2,  name: '铁甲龟', emoji: '🐢', type: 'defense', quality: 2, skills: ['龟壳防御','地震冲击','铁壁','水流护盾','大地之力'], evoSkill: '绝对防御', maxEvo: 3 },
  { id: 17, name: '赤角鹿', emoji: '🦌', type: 'balance', quality: 2, skills: ['鹿角冲撞','草木治愈','飞奔突击','自然之力'], evoSkill: null, maxEvo: 1 },
  { id: 18, name: '风行鹰', emoji: '🦅', type: 'attack',  quality: 2, skills: ['俯冲猎杀','鹰眼锁定','风刃羽','高空盘旋'], evoSkill: null, maxEvo: 1 },
  { id: 19, name: '雷鳗',   emoji: '🐡', type: 'attack',  quality: 2, skills: ['放电','电流缠绕','水中闪击','麻痹之触'], evoSkill: null, maxEvo: 1 },
  { id: 20, name: '霜牙獾', emoji: '🦡', type: 'defense', quality: 2, skills: ['冰牙撕咬','坚毅不屈','寒霜吐息','獾穴防御'], evoSkill: null, maxEvo: 1 },
  { id: 21, name: '岩甲犀', emoji: '🦏', type: 'defense', quality: 2, skills: ['犀角冲撞','岩石铠甲','大地踏步','蛮力横扫'], evoSkill: null, maxEvo: 1 },
  // === 稀有 🟣 (8种) ===
  { id: 1,  name: '灵猫',   emoji: '🐱', type: 'attack',  quality: 3, skills: ['利爪撕裂','暗影突袭','猫之敏捷','九命之躯','月光斩','暗夜潜行'], evoSkill: '影刃风暴', maxEvo: 2 },
  { id: 8,  name: '暗影鸦', emoji: '🐦‍⬛', type: 'attack',  quality: 3, skills: ['暗影啄击','黑雾','诅咒之眼','暗影分身','死亡俯冲'], evoSkill: '黑暗领域', maxEvo: 1 },
  { id: 10, name: '岩石熊', emoji: '🐻', type: 'defense', quality: 3, skills: ['重拳','岩石护甲','大地震颤','愤怒咆哮','石化之躯'], evoSkill: '山崩地裂', maxEvo: 3 },
  { id: 6,  name: '寒冰鹿', emoji: '🦌', type: 'balance', quality: 3, skills: ['冰霜吐息','寒冰护盾','极寒之地','治愈之光','冰晶箭','自然祝福'], evoSkill: '绝对零度', maxEvo: 2 },
  { id: 22, name: '九色鹦', emoji: '🦜', type: 'balance', quality: 3, skills: ['彩羽飞舞','模仿术','七彩光环','羽刃风暴'], evoSkill: null, maxEvo: 1 },
  { id: 23, name: '幻雾狐', emoji: '🦊', type: 'attack',  quality: 3, skills: ['狐火','幻术迷雾','魅惑之眼','九尾鞭击','灵狐步'], evoSkill: null, maxEvo: 2 },
  { id: 24, name: '玄武蜥', emoji: '🦎', type: 'defense', quality: 3, skills: ['玄甲守护','龙尾横扫','寒水吐息','坚壳再生'], evoSkill: null, maxEvo: 2 },
  { id: 25, name: '冰晶蝎', emoji: '🦂', type: 'attack',  quality: 3, skills: ['寒毒尾刺','冰甲','冻结之钳','冰晶暴风'], evoSkill: null, maxEvo: 1 },
  // === 史诗 🟠 (5种) ===
  { id: 5,  name: '雷霆虎', emoji: '🐯', type: 'attack',  quality: 4, skills: ['雷霆万钧','虎啸','闪电突袭','雷光爪','电磁脉冲','雷暴领域','虎威','蓄力一击'], evoSkill: '天雷灭世', maxEvo: 3 },
  { id: 7,  name: '烈焰凤', emoji: '🐦‍🔥', type: 'attack',  quality: 4, skills: ['凤凰之火','浴火重生','烈焰风暴','火羽','涅槃之翼'], evoSkill: '灭世焰', maxEvo: 2 },
  { id: 26, name: '穷奇',   emoji: '👹', type: 'attack',  quality: 4, skills: ['穷奇噬魂','邪风裂空','暴虐冲锋','恐惧嚎叫','吞天'], evoSkill: '天罚之牙', maxEvo: 3 },
  { id: 27, name: '毕方',   emoji: '🕊️', type: 'balance', quality: 4, skills: ['毕方圣焰','炎翼斩','火雨倾盆','涅槃之羽','灼烧领域'], evoSkill: '焚天之翼', maxEvo: 2 },
  { id: 28, name: '应龙',   emoji: '🐉', type: 'defense', quality: 4, skills: ['龙息吐纳','龙鳞护壁','云海翻腾','应龙之怒','天降暴雨'], evoSkill: '苍龙破天', maxEvo: 3 },
  // === 传说 🔴 (3种) ===
  { id: 29, name: '麒麟',   emoji: '🦄', type: 'balance', quality: 5, skills: ['麒麟踏焰','圣光庇佑','瑞气千条','天地正气','麒麟圣裁'], evoSkill: '太平降世', maxEvo: 3 },
  { id: 30, name: '白泽',   emoji: '🐲', type: 'defense', quality: 5, skills: ['白泽神光','万妖退散','知命预言','灵识护盾','净化波动'], evoSkill: '万象归一', maxEvo: 3 },
  { id: 31, name: '鲲鹏',   emoji: '🐋', type: 'attack',  quality: 5, skills: ['鲲化为鹏','扶摇万里','北冥之怒','天风破灭','吞噬虚空'], evoSkill: '逍遥游', maxEvo: 3 },
];

// ========== 光环配置 ==========
const AURAS = [
  { id: 1, name: '猫科之王',   desc: '队伍猫科攻击+10%',   speciesIds: [1] },
  { id: 2, name: '龟甲壁垒',   desc: '队伍龟类防御+10%',   speciesIds: [2] },
  { id: 3, name: '狼群协同',   desc: '队伍狼类攻速+8%',    speciesIds: [3] },
  { id: 4, name: '虎啸山林',   desc: '队伍虎类暴击+5%',    speciesIds: [5] },
  { id: 5, name: '自然之力',   desc: '队伍全体生命+5%',    speciesIds: [4, 6] },
  { id: 6, name: '元素亲和',   desc: '队伍全体技能CD-10%', speciesIds: [1,2,3,4,5,6,7,8,9,10,11] },
  { id: 7, name: '凤凰涅槃',   desc: '队伍火系伤害+12%',   speciesIds: [7] },
  { id: 8, name: '暗影支配',   desc: '队伍暗系伤害+12%',   speciesIds: [8] },
  { id: 9, name: '大地之心',   desc: '队伍坦克防御+8%',    speciesIds: [2, 10] },
  { id: 10, name: '星辰守护', desc: '队伍全体暴击+3%',    speciesIds: [11] },
];

// ========== 词条池（增加颜色品质） ==========
const AFFIX_COLORS = {
  white:  { name: '普通', color: '#cccccc', bg: '#cccccc22' },
  green:  { name: '优秀', color: '#2ecc71', bg: '#2ecc7122' },
  blue:   { name: '精良', color: '#3498db', bg: '#3498db22' },
  purple: { name: '史诗', color: '#9b59b6', bg: '#9b59b622' },
  orange: { name: '传说', color: '#e67e22', bg: '#e67e2222' },
  red:    { name: '绝世', color: '#e74c3c', bg: '#e74c3c22' },
};

const AFFIX_POOL = {
  normal_pos: [
    { id: 1001, name: '攻击强化I',  stat: 'atk', min: 50,  max: 150, rarity: 'white' },
    { id: 1002, name: '攻击强化II', stat: 'atk', min: 150, max: 300, rarity: 'green' },
    { id: 1003, name: '攻击强化III',stat: 'atk', min: 300, max: 500, rarity: 'blue' },
    { id: 1004, name: '防御强化I',  stat: 'def', min: 50,  max: 150, rarity: 'white' },
    { id: 1005, name: '防御强化II', stat: 'def', min: 150, max: 300, rarity: 'green' },
    { id: 1006, name: '防御强化III',stat: 'def', min: 300, max: 500, rarity: 'blue' },
    { id: 1007, name: '生命强化I',  stat: 'hp',  min: 100, max: 300, rarity: 'white' },
    { id: 1008, name: '生命强化II', stat: 'hp',  min: 300, max: 600, rarity: 'green' },
    { id: 1009, name: '生命强化III',stat: 'hp',  min: 600, max: 1000, rarity: 'blue' },
    { id: 1010, name: '全能I',      stat: 'all', min: 30,  max: 80,  rarity: 'purple' },
    { id: 1011, name: '全能II',     stat: 'all', min: 80,  max: 200, rarity: 'orange' },
  ],
  normal_neg: [
    { id: 2001, name: '攻击衰减', stat: 'atk', min: -150, max: -50, rarity: 'white' },
    { id: 2002, name: '防御衰减', stat: 'def', min: -150, max: -50, rarity: 'white' },
    { id: 2003, name: '迟钝',     stat: 'all', min: -60,  max: -20, rarity: 'white' },
  ],
  breed: [
    { id: 3001, name: '繁育之力I',   stat: 'atk', min: 100, max: 250, rarity: 'purple' },
    { id: 3002, name: '繁育之力II',  stat: 'def', min: 100, max: 250, rarity: 'purple' },
    { id: 3003, name: '繁育之力III', stat: 'hp',  min: 200, max: 600, rarity: 'purple' },
    { id: 3004, name: '繁育精华',    stat: 'all', min: 60,  max: 150, rarity: 'orange' },
  ],
  gen10: { id: 9001, name: '十代之证', desc: '全属性+18%', multiplier: 0.18, rarity: 'red' },
};

// ========== 异色名称 ==========
const VARIANT_NAMES = {
  1: ['暗影猫','月光猫'],
  2: ['翡翠龟','黄金龟'],
  3: ['白狼','血狼'],
  4: ['暮光蝶','星辰蝶'],
  5: ['白虎','炎虎'],
  6: ['樱花鹿','极光鹿'],
  7: ['冰凤','暗凤'],
  8: ['白鸦','血鸦'],
  9: ['金蛇','暗蛇'],
  10: ['冰熊','炎熊'],
  11: ['暗兔','金兔'],
};

// ========== 副本数据 ==========
// 团战副本（10层） —— 前两层很简单，后面逐层变难
// 难度曲线：指数增长，第1层=刚抓的3只普通伙伴可通关，第10层=满级史诗队伍挑战
const DUNGEON_TEAM = [];
const TEAM_FLOOR_CONFIG = [
  // floor, baseHP, baseATK, baseDEF, eliteHPMult, eliteATKMult, eliteDEFMult, mobCount
  { base: 40,   eliteMult: 1.3 },  // 第1层 - 非常简单，送经验
  { base: 70,   eliteMult: 1.4 },  // 第2层 - 简单
  { base: 120,  eliteMult: 1.5 },  // 第3层 - 需要练几级
  { base: 180,  eliteMult: 1.6 },  // 第4层
  { base: 260,  eliteMult: 1.7 },  // 第5层
  { base: 360,  eliteMult: 1.8 },  // 第6层
  { base: 480,  eliteMult: 1.9 },  // 第7层
  { base: 620,  eliteMult: 2.0 },  // 第8层
  { base: 800,  eliteMult: 2.1 },  // 第9层
  { base: 1020, eliteMult: 2.2 },  // 第10层 - 高难度
];
for (let i = 0; i < TEAM_FLOOR_CONFIG.length; i++) {
  const cfg = TEAM_FLOOR_CONFIG[i];
  const b = cfg.base;
  const eb = b * cfg.eliteMult;
  DUNGEON_TEAM.push({
    floor: i + 1,
    enemies: [
      { name: `小怪Lv${i+1}`, hp: Math.floor(b * 2.5), atk: Math.floor(b * 0.5), def: Math.floor(b * 0.2), isElite: false },
      { name: `小怪Lv${i+1}`, hp: Math.floor(b * 2.5), atk: Math.floor(b * 0.5), def: Math.floor(b * 0.2), isElite: false },
      { name: `精英Lv${i+1}`, hp: Math.floor(eb * 3),   atk: Math.floor(eb * 0.7), def: Math.floor(eb * 0.35), isElite: true },
    ],
    fruitReward: i + 1,  // 层数=繁育之果奖励数
  });
}

// 爬塔副本（20层） —— 同样前几层降低难度
const DUNGEON_TOWER = [];
const TOWER_BASES = [30, 55, 90, 130, 180, 240, 310, 400, 500, 620, 750, 900, 1070, 1260, 1470, 1700, 1960, 2250, 2580, 2950];
for (let i = 0; i < TOWER_BASES.length; i++) {
  const base = TOWER_BASES[i];
  DUNGEON_TOWER.push({
    floor: i + 1,
    boss: { name: `塔守Lv${i+1}`, hp: Math.floor(base * 4), atk: Math.floor(base * 0.6), def: Math.floor(base * 0.3) },
    evoStoneReward: i < 10 ? 1 : 2,
  });
}

// ========== 系统常量 ==========
const CONFIG = {
  INITIAL_FRUIT: 5,
  INITIAL_EVO_STONE: 3,
  INITIAL_POKEBALL: 5,
  POKEBALL_MAX: 5,
  POKEBALL_REGEN_MS: 180000,  // 3min = 180000ms
  CAPTURE_POTENTIAL_MIN: 0.40,
  CAPTURE_POTENTIAL_MAX: 0.60,
  SHINY_BASE_CHANCE: 0.10,
  SHINY_PARENT_BONUS: 0.10,
  VARIANT_CHANCE: 0.05,
  AURA_CHANCE: 0.08,
  BREED_DECAY: 0.95,
  BREED_AFFIX_CHANCE: 0.30,
  BREED_TIME_MS: 10000,  // 10秒繁育时间
  LIFE_PER_BREED: 40,
  LIFE_CAP_MIN: 100,
  LIFE_CAP_MAX: 130,
  MAX_GENERATION: 10,
  MAX_LEVEL: 50,
  EVO_POTENTIAL_BOOST: 0.10,
  EVO_TOTAL_THRESHOLD: 1600,
  GEN_CAP_COEFFS: [1.0, 0.60, 0.68, 0.76, 0.83, 0.89, 0.94, 0.98, 1.0, 1.0, 1.0],
  GEN_DIFF_PENALTY: [1.0, 0.97, 0.93, 0.88, 0.82, 0.75, 0.68, 0.60, 0.52, 0.45, 0.40],
};

// ========== 品质初始属性（用于当前值计算） ==========
// 当前攻击 = BASE_ATK + (资质ATK × 1.1 × 等级)
// 当前防御 = BASE_DEF + (资质DEF × 0.9 × 等级)
// 当前血量 = BASE_HP  + (资质HP  × 2.0 × 等级)
const QUALITY_BASE_STATS = {
  1: { atk: 100,  def: 80,   hp: 500  },  // 普通
  2: { atk: 115,  def: 92,   hp: 575  },  // 精良 (+15%)
  3: { atk: 132,  def: 106,  hp: 661  },  // 稀有 (+15%)
  4: { atk: 155,  def: 124,  hp: 776  },  // 史诗 (+17%)
  5: { atk: 186,  def: 149,  hp: 931  },  // 传说 (+20%)
};

// ========== 副本经验配置 ==========
const DUNGEON_EXP = {
  // 团战副本经验（每个出战伙伴获得）
  //  第1层: 1-5级每打1次升1级    → 给120（Lv1需100，Lv4需130）
  //  第2层: 5-10级每打2次升1级   → 给120（Lv5需180，2次=240）
  //  第3层: 10-15级每打3次升1级  → 给120（Lv10需280，3次=360）
  //  后续层数经验持续增长
  team: [0, 120, 200, 320, 480, 680, 920, 1200, 1550, 1950, 2400],
  // 爬塔副本经验（单人，给少一些但层数多）
  tower: [0, 80, 130, 200, 280, 380, 500, 640, 800, 980, 1180, 1400, 1650, 1920, 2220, 2550, 2900, 3300, 3750, 4250, 4800],
};

// 每级所需经验：前期平缓，后期陡增
// Lv1→2: 100, Lv5→6: 180, Lv10→11: 280, Lv20→21: 480, Lv30→31: 780, Lv40→41: 1180, Lv49→50: 1560
function getExpForLevel(level) {
  if (level <= 5) return 80 + level * 20;          // 100~180，前5级很快
  if (level <= 15) return 100 + level * 18;         // 208~370，中期适中
  if (level <= 30) return 100 + level * 22;         // 430~760，中后期变难
  return 100 + level * 30;                          // 后期大幅增长
}

// ========== 副本场景背景 ==========
const DUNGEON_BG = {
  team: 'linear-gradient(180deg, #1a0a0a 0%, #2d1a0a 30%, #3d2a1a 60%, #1a0a0a 100%)',
  tower: 'linear-gradient(180deg, #0a0a2d 0%, #1a1a4d 30%, #2d2d6d 60%, #0a0a2d 100%)',
};

// ========== 抓捕场景（4个场景，每个场景包含所有品质） ==========
const CAPTURE_SCENES = [
  {
    id: 'forest',
    name: '迷雾森林',
    emoji: '🌲',
    desc: '茂密的古老森林，栖息着各种林地生灵',
    bg: 'linear-gradient(135deg, #0a3d0a 0%, #1a5c1a 40%, #2d7a2d 100%)',
    speciesIds: [
      11, 4,       // 普通: 星光兔, 荧光蝶
      3, 17,       // 精良: 草原狼, 赤角鹿
      1, 23,       // 稀有: 灵猫, 幻雾狐
      5,           // 史诗: 雷霆虎
      29,          // 传说: 麒麟
    ],
  },
  {
    id: 'river',
    name: '星辰河谷',
    emoji: '🌊',
    desc: '神秘的河谷地带，水与冰元素交织',
    bg: 'linear-gradient(135deg, #0a2d4d 0%, #1a4a7a 40%, #2d6aaa 100%)',
    speciesIds: [
      14, 16,      // 普通: 泥潭蛙, 花尾鲤
      2, 19,       // 精良: 铁甲龟, 雷鳗
      6, 24,       // 稀有: 寒冰鹿, 玄武蜥
      28,          // 史诗: 应龙
      30,          // 传说: 白泽
    ],
  },
  {
    id: 'mountain',
    name: '雷霆山脉',
    emoji: '⛰️',
    desc: '高耸入云的险峻山脉，雷电与岩石的领地',
    bg: 'linear-gradient(135deg, #2d1a0a 0%, #4d2a0a 40%, #6d3a1a 100%)',
    speciesIds: [
      15, 12,      // 普通: 刺背猬, 小火鼠
      18, 21,      // 精良: 风行鹰, 岩甲犀
      8, 10,       // 稀有: 暗影鸦, 岩石熊
      26,          // 史诗: 穷奇
      31,          // 传说: 鲲鹏
    ],
  },
  {
    id: 'sacred',
    name: '上古神域',
    emoji: '🌟',
    desc: '传说中的神域，各种神话生物在此栖息',
    bg: 'linear-gradient(135deg, #1a0a2d 0%, #3d1a4d 40%, #5d2a6d 100%)',
    speciesIds: [
      13, 16,      // 普通: 翠羽雀, 花尾鲤
      9, 20,       // 精良: 翡翠蛇, 霜牙獾
      22, 25,      // 稀有: 九色鹦, 冰晶蝎
      7, 27,       // 史诗: 烈焰凤, 毕方
      29, 30, 31,  // 传说: 麒麟, 白泽, 鲲鹏
    ],
  },
];
