/**
 * game-core.js - 伙伴繁育系统 核心逻辑 v3
 * 新增：当前值计算、经验系统、技能CD战斗引擎
 */

// ========== 工具函数 ==========
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function randFloat(min, max) { return Math.random() * (max - min) + min; }
function pick(arr) { return arr[randInt(0, arr.length - 1)]; }
function clamp(val, min, max) { return Math.max(min, Math.min(max, val)); }

// ========== 全局状态 ==========
let petIdCounter = 0;
const GameState = {
  pets: [],
  fruit: CONFIG.INITIAL_FRUIT,
  evoStone: CONFIG.INITIAL_EVO_STONE,
  pokeball: CONFIG.INITIAL_POKEBALL,
  pokeballTimer: null,
  pokeballLastRegen: Date.now(),
  teamDungeonFloor: 1,
  towerFloor: 1,
};

// ========== 精灵球恢复 ==========
function startPokeballRegen() {
  GameState.pokeballLastRegen = Date.now();
  GameState.pokeballTimer = setInterval(() => {
    if (GameState.pokeball < CONFIG.POKEBALL_MAX) {
      GameState.pokeball++;
      if (typeof updateFooter === 'function') updateFooter();
    }
  }, CONFIG.POKEBALL_REGEN_MS);
}

function getPokeballRegenTime() {
  if (GameState.pokeball >= CONFIG.POKEBALL_MAX) return '已满';
  const elapsed = Date.now() - GameState.pokeballLastRegen;
  const remaining = CONFIG.POKEBALL_REGEN_MS - (elapsed % CONFIG.POKEBALL_REGEN_MS);
  const sec = Math.ceil(remaining / 1000);
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// ========== ★ 当前值计算 ==========
// 归一化公式：当前值 = 品质基础 + (资质/1000) × 系数 × 等级 × 基础放大
// 满级50传说满资质(~2394) → ATK ≈ 50 + (2394/1000)*7.0*50 ≈ 888 + 50 ≈ 938（单属性）
// 通过调整基础放大使 最终值在合理区间 (数百~两千)
// 资质基数已降至~988，传说满资质≈1442，满级50
// ATK: 186 + (1442/1000)*16*50 = 186+1153 = 1339, 三段进化×1.331 ≈ 1782
const COMBAT_SCALE = { atk: 16.0, def: 13.0, hp: 26.0 };
function getCombatStats(pet) {
  const base = QUALITY_BASE_STATS[pet.quality] || QUALITY_BASE_STATS[1];
  const evoBonus = 1 + (pet.evoStage * 0.1);
  return {
    atk: Math.floor((base.atk + (pet.potential.atk / 1000) * COMBAT_SCALE.atk * pet.level) * evoBonus),
    def: Math.floor((base.def + (pet.potential.def / 1000) * COMBAT_SCALE.def * pet.level) * evoBonus),
    hp:  Math.floor((base.hp  + (pet.potential.hp  / 1000) * COMBAT_SCALE.hp  * pet.level) * evoBonus),
  };
}

// ========== ★ 经验系统 ==========
function addExp(pet, exp) {
  if (!pet.exp) pet.exp = 0;
  if (!pet.totalExp) pet.totalExp = 0;
  if (pet.level >= CONFIG.MAX_LEVEL) return { leveled: false, from: pet.level, to: pet.level };

  const fromLevel = pet.level;
  pet.exp += exp;
  pet.totalExp += exp;

  while (pet.level < CONFIG.MAX_LEVEL) {
    const needed = getExpForLevel(pet.level);
    if (pet.exp >= needed) {
      pet.exp -= needed;
      pet.level++;
    } else {
      break;
    }
  }
  if (pet.level >= CONFIG.MAX_LEVEL) {
    pet.level = CONFIG.MAX_LEVEL;
    pet.exp = 0;
  }
  return { leveled: pet.level > fromLevel, from: fromLevel, to: pet.level };
}

// ========== 创建伙伴 ==========
function createPet(speciesId, quality, gender, options = {}) {
  const species = SPECIES.find(s => s.id === speciesId);
  const tmpl = TYPE_TEMPLATE[species.type];
  const q = QUALITY[quality];
  const gen = options.generation || 0;

  let potentialCap = {};
  if (gen === 0) {
    potentialCap = {
      atk: Math.floor(tmpl.atk * q.coeff),
      def: Math.floor(tmpl.def * q.coeff),
      hp:  Math.floor(tmpl.hp  * q.coeff),
    };
  } else {
    potentialCap = options.potentialCap || { atk: tmpl.atk, def: tmpl.def, hp: tmpl.hp };
  }

  let potential = {};
  if (options.potential) {
    potential = options.potential;
  } else {
    const pMin = CONFIG.CAPTURE_POTENTIAL_MIN;
    const pMax = CONFIG.CAPTURE_POTENTIAL_MAX;
    potential = {
      atk: Math.floor(potentialCap.atk * randFloat(pMin, pMax)),
      def: Math.floor(potentialCap.def * randFloat(pMin, pMax)),
      hp:  Math.floor(potentialCap.hp  * randFloat(pMin, pMax)),
    };
  }

  const skillCount = options.skillCount || randInt(2, 4);
  const shuffled = [...species.skills].sort(() => Math.random() - 0.5);
  const skills = shuffled.slice(0, skillCount);

  const affixes = options.affixes || generateWildAffixes();

  let isShiny = options.isShiny || false;
  if (!options.isShiny && gen === 0 && Math.random() < CONFIG.SHINY_BASE_CHANCE) {
    isShiny = true;
  }

  const lifeCap = options.lifeCap || randInt(CONFIG.LIFE_CAP_MIN, CONFIG.LIFE_CAP_MAX);

  const pet = {
    id: ++petIdCounter,
    name: options.variantName || species.name,
    speciesId: species.id,
    species: species,
    quality: quality,
    gender: gender,
    generation: gen,
    level: options.level || (gen === 0 ? randInt(1, 15) : 1),
    exp: 0,
    totalExp: 0,
    potential: potential,
    potentialCap: potentialCap,
    skills: skills,
    affixes: affixes,
    lifeCap: lifeCap,
    life: lifeCap,
    isShiny: isShiny,
    isVariant: options.isVariant || false,
    variantName: options.variantName || null,
    aura: options.aura || null,
    evoStage: 0,
    fatherId: options.fatherId || null,
    motherId: options.motherId || null,
    hasGen10Affix: false,
  };

  if (gen >= CONFIG.MAX_GENERATION) {
    pet.hasGen10Affix = true;
    pet.affixes.push({
      ...AFFIX_POOL.gen10,
      value: '+18%全属性',
      isBreedAffix: false,
      isGen10: true,
    });
  }

  return pet;
}

function generateWildAffixes() {
  const affixes = [];
  const count = randInt(1, 3);
  const pool = [...AFFIX_POOL.normal_pos, ...AFFIX_POOL.normal_neg];
  for (let i = 0; i < count; i++) {
    const base = pick(pool);
    affixes.push({
      ...base,
      value: randInt(base.min, base.max),
      isBreedAffix: false,
      isGen10: false,
    });
  }
  return affixes;
}

// ========== 抓捕 ==========
// 抓捕概率: 普通45% 精良30% 稀有15% 史诗8% 传说2%
const CAPTURE_RATE = { 1: 0.45, 2: 0.30, 3: 0.15, 4: 0.08, 5: 0.02 };

function capturePet(sceneSpeciesIds) {
  if (GameState.pokeball <= 0) return null;
  GameState.pokeball--;
  GameState.pokeballLastRegen = Date.now();

  // 按品质概率筛选可抓的伙伴
  const roll = Math.random();
  let qualityRoll;
  if (roll < 0.45)      qualityRoll = 1;
  else if (roll < 0.75) qualityRoll = 2;
  else if (roll < 0.90) qualityRoll = 3;
  else if (roll < 0.98) qualityRoll = 4;
  else                   qualityRoll = 5;

  // 从场景中筛选该品质的伙伴
  let candidates = sceneSpeciesIds
    .map(id => SPECIES.find(s => s.id === id))
    .filter(s => s && s.quality === qualityRoll);

  // 如果该品质没有候选，降级寻找
  if (candidates.length === 0) {
    for (let q = qualityRoll; q >= 1; q--) {
      candidates = sceneSpeciesIds
        .map(id => SPECIES.find(s => s.id === id))
        .filter(s => s && s.quality === q);
      if (candidates.length > 0) break;
    }
  }
  if (candidates.length === 0) return null;

  const species = pick(candidates);
  const quality = species.quality; // 品质由伙伴自身决定
  const gender = Math.random() < 0.5 ? 'male' : 'female';
  const pet = createPet(species.id, quality, gender);
  GameState.pets.push(pet);
  return pet;
}

// ========== 繁育核心 ==========
function canBreed(father, mother) {
  const errors = [];
  if (!father || !mother) errors.push('需要选择父系和母系');
  if (father && mother && father.id === mother.id) errors.push('不能和自己繁育');
  if (father && father.gender !== 'male') errors.push('父系必须是公');
  if (mother && mother.gender !== 'female') errors.push('母系必须是母');
  if (father && father.lifeCap <= 0) errors.push('父系寿命上限为0，已退役');
  if (mother && mother.lifeCap <= 0) errors.push('母系寿命上限为0，已退役');
  if (father && father.generation >= CONFIG.MAX_GENERATION) errors.push('父系已达十代，无法繁育');
  if (mother && mother.generation >= CONFIG.MAX_GENERATION) errors.push('母系已达十代，无法繁育');
  if (father && father.isVariant) errors.push('异色伙伴无法繁育');
  if (mother && mother.isVariant) errors.push('异色伙伴无法繁育');
  if (GameState.fruit < 1) errors.push('欲望之果不足');
  return errors;
}

// ★ 繁育预览：计算子代资质区间（供UI显示用）
function calcBreedPreviewRange(father, mother) {
  const childGen = Math.min(Math.max(father.generation, mother.generation) + 1, CONFIG.MAX_GENERATION);
  const growthFactor = 0.25 + childGen * 0.08;
  const ranges = {};
  for (const stat of ['atk', 'def', 'hp']) {
    const fVal = father.potential[stat];
    const mVal = mother.potential[stat];
    const capLimit = Math.min(father.potentialCap[stat], mother.potentialCap[stat]);
    const rangeMin = Math.floor(Math.min(fVal, mVal) * 0.95);
    const maxParent = Math.max(fVal, mVal);
    const room = Math.max(0, capLimit - maxParent);
    const growth = Math.floor(room * growthFactor);
    const rangeMax = Math.min(maxParent + growth, capLimit);
    ranges[stat] = { min: rangeMin, max: rangeMax };
  }
  return { ranges, gen: childGen };
}

function breed(father, mother) {
  const errors = canBreed(father, mother);
  if (errors.length > 0) return { success: false, errors };

  GameState.fruit -= 1;
  father.lifeCap -= CONFIG.LIFE_PER_BREED;
  mother.lifeCap -= CONFIG.LIFE_PER_BREED;

  // ★ 种类 & 外形随母系
  const speciesId = mother.speciesId;
  const species = mother.species;

  // ★ 品质随母系
  const childQuality = mother.quality;

  // ★ 代数 = max(父,母) + 1
  const childGen = Math.min(Math.max(father.generation, mother.generation) + 1, CONFIG.MAX_GENERATION);

  // ★ 资质上限：继承父母中较低的上限（子代cap不超过父母）
  const cap = {
    atk: Math.min(father.potentialCap.atk, mother.potentialCap.atk),
    def: Math.min(father.potentialCap.def, mother.potentialCap.def),
    hp:  Math.min(father.potentialCap.hp,  mother.potentialCap.hp),
  };

  // ★ 核心遗传算法 v2
  // 最小值 = min(父,母) × 0.95
  // 最大值 = min( max(父,母) + (cap - max(父,母)) × growthFactor, cap )
  // growthFactor = 0.25 + childGen × 0.08  （代数越高，成长越快）
  // 子代资质 = 在 [最小值, 最大值] 之间随机
  const potential = {};
  const breedRanges = {};
  const growthFactor = 0.25 + childGen * 0.08;

  for (const stat of ['atk', 'def', 'hp']) {
    const fVal = father.potential[stat];
    const mVal = mother.potential[stat];

    // 最小值 = 双方较低值 × 0.95
    const rangeMin = Math.floor(Math.min(fVal, mVal) * 0.95);

    // 最大值 = max(父,母) + 成长空间 × growthFactor
    const maxParent = Math.max(fVal, mVal);
    const room = Math.max(0, cap[stat] - maxParent);
    const growth = Math.floor(room * growthFactor);
    const rangeMax = Math.min(maxParent + growth, cap[stat]);

    // 随机取值
    const val = clamp(randInt(rangeMin, rangeMax), 1, cap[stat]);
    potential[stat] = val;
    breedRanges[stat] = { min: rangeMin, max: rangeMax };
  }

  // ★ 技能：从母系种类技能池随机2~4个
  const skillCount = randInt(2, 4);

  // ★ 词条继承：父母各取一条 + 概率获得繁育专属词条
  const childAffixes = [];
  if (father.affixes.length > 0) {
    const fa = pick(father.affixes.filter(a => !a.isGen10));
    if (fa) childAffixes.push({ ...fa, value: randInt(fa.min || fa.value, fa.max || fa.value) });
  }
  if (mother.affixes.length > 0) {
    const ma = pick(mother.affixes.filter(a => !a.isGen10));
    if (ma) childAffixes.push({ ...ma, value: randInt(ma.min || ma.value, ma.max || ma.value) });
  }
  if (Math.random() < CONFIG.BREED_AFFIX_CHANCE) {
    const ba = pick(AFFIX_POOL.breed);
    childAffixes.push({ ...ba, value: randInt(ba.min, ba.max), isBreedAffix: true, isGen10: false });
  }

  // ★ 性别随机
  const gender = Math.random() < 0.5 ? 'male' : 'female';

  // ★ 闪光遗传
  let shinyChance = 0;
  if (father.isShiny) shinyChance += CONFIG.SHINY_PARENT_BONUS;
  if (mother.isShiny) shinyChance += CONFIG.SHINY_PARENT_BONUS;
  const isShiny = Math.random() < shinyChance;

  // ★ 异色（5%概率，仅通过繁育产生，异色不可再繁育）
  const isVariant = Math.random() < CONFIG.VARIANT_CHANCE;
  let variantName = null;
  if (isVariant) { variantName = pick(VARIANT_NAMES[speciesId] || ['异色体']); }

  // ★ 光环（不遗传，独立判定）
  let aura = null;
  if (Math.random() < CONFIG.AURA_CHANCE) {
    const possibleAuras = AURAS.filter(a => a.speciesIds.includes(speciesId));
    if (possibleAuras.length > 0) aura = pick(possibleAuras);
  }

  const child = createPet(speciesId, childQuality, gender, {
    generation: childGen, potential, potentialCap: cap, skillCount, affixes: childAffixes,
    isShiny, isVariant, variantName, aura,
    lifeCap: randInt(CONFIG.LIFE_CAP_MIN, CONFIG.LIFE_CAP_MAX),
    fatherId: father.id, motherId: mother.id, level: 1,
  });
  GameState.pets.push(child);

  return {
    success: true, child, father, mother,
    breedRanges,  // 繁育时的实际资质区间
  };
}

// ========== 进化 ==========
function canEvolve(pet) {
  const errors = [];
  if (pet.species.maxEvo <= 0) errors.push('该种类没有进化线');
  if (pet.evoStage >= pet.species.maxEvo) errors.push('已达最高进化段数');
  if (pet.level < CONFIG.MAX_LEVEL) errors.push(`等级不足，需要满级${CONFIG.MAX_LEVEL}`);
  const total = pet.potential.atk + pet.potential.def + pet.potential.hp;
  if (total < CONFIG.EVO_TOTAL_THRESHOLD) errors.push(`总资质不足 (${total}/${CONFIG.EVO_TOTAL_THRESHOLD})`);
  if (GameState.evoStone < 1) errors.push('进化石不足');
  return errors;
}

function evolve(pet) {
  const errors = canEvolve(pet);
  if (errors.length > 0) return { success: false, errors };
  GameState.evoStone -= 1;
  const before = { potential: { ...pet.potential }, potentialCap: { ...pet.potentialCap }, evoStage: pet.evoStage, skills: [...pet.skills] };
  pet.evoStage += 1;
  for (const stat of ['atk', 'def', 'hp']) { pet.potentialCap[stat] = Math.floor(pet.potentialCap[stat] * (1 + CONFIG.EVO_POTENTIAL_BOOST)); }
  for (const stat of ['atk', 'def', 'hp']) { pet.potential[stat] = randInt(pet.potential[stat], pet.potentialCap[stat]); }
  if (pet.evoStage === 1 && pet.species.evoSkill) pet.skills.push(pet.species.evoSkill);
  return { success: true, pet, before, after: { potential: { ...pet.potential }, potentialCap: { ...pet.potentialCap }, evoStage: pet.evoStage, skills: [...pet.skills] } };
}

// ========== ★★★ 全新战斗引擎（技能CD + 优先级） ★★★ ==========

// 创建战斗单位
function createBattleUnit(pet) {
  const cs = getCombatStats(pet);
  return {
    id: pet.id,
    name: pet.name,
    emoji: pet.species.emoji,
    petRef: pet,       // 原始伙伴引用
    maxHp: cs.hp,
    curHp: cs.hp,
    atk: cs.atk,
    def: cs.def,
    skills: pet.skills.map(sk => ({
      name: sk,
      data: SKILL_DB[sk] || { cd: 1, coeff: 1.0, stat: 'atk', type: 'atk' },
      curCd: 0,  // 当前CD（0=可用）
    })),
    alive: true,
    dmgDealt: 0,
    dmgTaken: 0,
    killCount: 0,
  };
}

let battleUnitIdCounter = 0;
function createEnemyUnit(enemy) {
  return {
    id: --battleUnitIdCounter,
    name: enemy.name,
    emoji: enemy.isElite ? '👹' : '👾',
    petRef: null,
    maxHp: enemy.hp,
    curHp: enemy.hp,
    atk: enemy.atk,
    def: enemy.def,
    skills: [{ name: '普通攻击', data: { cd: 1, coeff: 1.0, stat: 'atk', type: 'atk' }, curCd: 0 }],
    alive: true,
    dmgDealt: 0,
    dmgTaken: 0,
    killCount: 0,
  };
}

// 选择技能：优先CD长（更强）的已就绪技能
function selectSkill(unit) {
  const ready = unit.skills.filter(s => s.curCd <= 0 && s.data.type !== 'passive');
  if (ready.length === 0) return null;
  // 按CD降序排（CD越长=越强=优先释放）
  ready.sort((a, b) => (b.data.cd || 1) - (a.data.cd || 1));
  return ready[0];
}

// 计算技能伤害
function calcSkillDamage(unit, skill, targetDef) {
  const data = skill.data;
  if (data.type === 'buff' || data.type === 'debuff' || data.type === 'heal' || data.type === 'passive') return 0;
  let baseStat = unit.atk;
  if (data.stat === 'def') baseStat = unit.def;
  else if (data.stat === 'atkdef') baseStat = unit.atk + unit.def;
  const raw = Math.floor(baseStat * (data.coeff || 1.0));
  const dmg = Math.max(raw - targetDef, 1);
  return dmg;
}

// 回合冷却递减
function tickCooldowns(unit) {
  unit.skills.forEach(s => { if (s.curCd > 0) s.curCd--; });
}

// 设置技能冷却
function setSkillCd(skill) {
  skill.curCd = skill.data.cd || 1;
}

// ★ 主战斗函数（团队副本）
function runTeamBattle(team, floorIndex) {
  const floor = DUNGEON_TEAM[floorIndex];
  if (!floor) return { success: false, msg: '无效层数' };

  const allies = team.map(p => createBattleUnit(p));
  const enemies = floor.enemies.map(e => createEnemyUnit(e));
  const log = [];
  let round = 0;
  const maxRound = 60;

  while (round < maxRound) {
    round++;
    log.push({ type: 'round', round });

    // CD递减
    allies.forEach(a => { if (a.alive) tickCooldowns(a); });
    enemies.forEach(e => { if (e.alive) tickCooldowns(e); });

    // 我方行动
    for (const ally of allies) {
      if (!ally.alive) continue;
      const target = enemies.find(e => e.alive);
      if (!target) break;
      const skill = selectSkill(ally);
      if (!skill) continue;
      const dmg = calcSkillDamage(ally, skill, target.def);
      if (dmg > 0) {
        target.curHp -= dmg;
        ally.dmgDealt += dmg;
        target.dmgTaken += dmg;
        log.push({ type: 'action', actorId: ally.id, actor: ally.name, actorEmoji: ally.emoji, skill: skill.name, skillIcon: skill.data.icon || '⚔️', targetId: target.id, target: target.name, dmg, targetHp: Math.max(0, target.curHp), targetMaxHp: target.maxHp });
        if (target.curHp <= 0) {
          target.alive = false;
          ally.killCount++;
          log.push({ type: 'kill', actorId: ally.id, actor: ally.name, targetId: target.id, target: target.name });
        }
      } else {
        // buff/heal类技能
        log.push({ type: 'action', actorId: ally.id, actor: ally.name, actorEmoji: ally.emoji, skill: skill.name, skillIcon: skill.data.icon || '✨', targetId: ally.id, target: ally.name, dmg: 0, info: skill.data.desc });
      }
      setSkillCd(skill);
    }
    if (enemies.every(e => !e.alive)) break;

    // 敌方行动
    for (const enemy of enemies) {
      if (!enemy.alive) continue;
      const target = allies.find(a => a.alive);
      if (!target) break;
      const skill = selectSkill(enemy);
      if (!skill) continue;
      const dmg = calcSkillDamage(enemy, skill, target.def);
      target.curHp -= dmg;
      enemy.dmgDealt += dmg;
      target.dmgTaken += dmg;
      log.push({ type: 'action', actorId: enemy.id, actor: enemy.name, actorEmoji: enemy.emoji, skill: skill.name, skillIcon: '⚔️', targetId: target.id, target: target.name, dmg, targetHp: Math.max(0, target.curHp), targetMaxHp: target.maxHp });
      if (target.curHp <= 0) {
        target.alive = false;
        enemy.killCount++;
        log.push({ type: 'death', actorId: target.id, actor: target.name, actorEmoji: target.emoji });
        // 扣除寿命
        if (target.petRef) target.petRef.lifeCap = Math.max(0, target.petRef.lifeCap - 1);
      }
      setSkillCd(skill);
    }
    if (allies.every(a => !a.alive)) break;
  }

  const win = enemies.every(e => !e.alive);

  // 经验和奖励
  const expGain = win ? (DUNGEON_EXP.team[floorIndex + 1] || 100) : Math.floor((DUNGEON_EXP.team[floorIndex + 1] || 100) * 0.3);
  const expResults = [];
  for (const ally of allies) {
    if (ally.petRef) {
      const result = addExp(ally.petRef, expGain);
      expResults.push({ name: ally.name, emoji: ally.emoji, exp: expGain, ...result });
    }
  }

  if (win) {
    GameState.fruit += floor.fruitReward;
    if (floorIndex + 1 >= GameState.teamDungeonFloor && floorIndex + 1 < DUNGEON_TEAM.length) {
      GameState.teamDungeonFloor = floorIndex + 2;
    }
  }

  return {
    success: true, win, log, rounds: round,
    reward: win ? floor.fruitReward : 0,
    rewardType: '🍎 欲望之果',
    expGain, expResults,
    allies, enemies,
    floorName: `第${floor.floor}层`,
    battleType: 'team',
  };
}

// ★ 主战斗函数（爬塔）
function runTowerBattle(pet, floorIndex) {
  const floor = DUNGEON_TOWER[floorIndex];
  if (!floor) return { success: false, msg: '无效层数' };

  const ally = createBattleUnit(pet);
  const boss = createEnemyUnit(floor.boss);
  boss.emoji = '🐲';
  boss.name = floor.boss.name;
  const log = [];
  let round = 0;
  const maxRound = 100;

  while (round < maxRound && ally.alive && boss.alive) {
    round++;
    log.push({ type: 'round', round });

    tickCooldowns(ally);
    tickCooldowns(boss);

    // 我方
    const sk1 = selectSkill(ally);
    if (sk1) {
      const dmg = calcSkillDamage(ally, sk1, boss.def);
      if (dmg > 0) {
        boss.curHp -= dmg;
        ally.dmgDealt += dmg;
        boss.dmgTaken += dmg;
        log.push({ type: 'action', actorId: ally.id, actor:ally.name, actorEmoji: ally.emoji, skill: sk1.name, skillIcon: sk1.data.icon || '⚔️', targetId: boss.id, target: boss.name, dmg, targetHp: Math.max(0, boss.curHp), targetMaxHp: boss.maxHp });
        if (boss.curHp <= 0) { boss.alive = false; ally.killCount++; log.push({ type: 'kill', actorId: ally.id, actor: ally.name, targetId: boss.id, target: boss.name }); }
      }
      setSkillCd(sk1);
    }
    if (!boss.alive) break;

    // BOSS
    const sk2 = selectSkill(boss);
    if (sk2) {
      const dmg = calcSkillDamage(boss, sk2, ally.def);
      ally.curHp -= dmg;
      boss.dmgDealt += dmg;
      ally.dmgTaken += dmg;
      log.push({ type: 'action', actorId: boss.id, actor: boss.name, actorEmoji: boss.emoji, skill: sk2.name, skillIcon: '⚔️', targetId: ally.id, target: ally.name, dmg, targetHp: Math.max(0, ally.curHp), targetMaxHp: ally.maxHp });
      if (ally.curHp <= 0) {
        ally.alive = false;
        log.push({ type: 'death', actorId: ally.id, actor: ally.name, actorEmoji: ally.emoji });
        if (ally.petRef) ally.petRef.lifeCap = Math.max(0, ally.petRef.lifeCap - 1);
      }
      setSkillCd(sk2);
    }
  }

  const win = !boss.alive;
  const expGain = win ? (DUNGEON_EXP.tower[floorIndex + 1] || 80) : Math.floor((DUNGEON_EXP.tower[floorIndex + 1] || 80) * 0.3);
  const expResults = [];
  if (ally.petRef) {
    const result = addExp(ally.petRef, expGain);
    expResults.push({ name: ally.name, emoji: ally.emoji, exp: expGain, ...result });
  }

  if (win) {
    GameState.evoStone += floor.evoStoneReward;
    if (floorIndex + 1 >= GameState.towerFloor && floorIndex + 1 < DUNGEON_TOWER.length) {
      GameState.towerFloor = floorIndex + 2;
    }
  }

  return {
    success: true, win, log, rounds: round,
    reward: win ? floor.evoStoneReward : 0,
    rewardType: '🧪 进化石',
    expGain, expResults,
    allies: [ally], enemies: [boss],
    floorName: `第${floor.floor}层`,
    battleType: 'tower',
  };
}

// ========== 快速满级 ==========
function maxLevel(pet) {
  pet.level = CONFIG.MAX_LEVEL;
  pet.exp = 0;
}

// ========== 获取伙伴总资质百分比 ==========
function getPotentialPercent(pet) {
  const tmpl = TYPE_TEMPLATE[pet.species.type];
  const q = QUALITY[pet.quality];
  const maxTotal = (tmpl.atk + tmpl.def + tmpl.hp) * q.coeff;
  const curTotal = pet.potential.atk + pet.potential.def + pet.potential.hp;
  return Math.floor((curTotal / maxTotal) * 100);
}

// ========== 获取技能信息 ==========
function getSkillInfo(skillName) {
  return SKILL_DB[skillName] || { icon: '❓', desc: '未知技能', type: 'atk', cd: 1, coeff: 1.0, stat: 'atk' };
}

// ========== 获取词条颜色 ==========
function getAffixColor(affix) {
  if (affix.isGen10) return AFFIX_COLORS.red;
  if (affix.isBreedAffix) return AFFIX_COLORS.purple;
  const rarity = affix.rarity || 'white';
  return AFFIX_COLORS[rarity] || AFFIX_COLORS.white;
}

// ========== ★ 本地存档系统 ==========
const SAVE_KEY = 'PET_GAME_SAVE_V1';

function saveGame() {
  try {
    const saveData = {
      version: 1,
      timestamp: Date.now(),
      petIdCounter: petIdCounter,
      fruit: GameState.fruit,
      evoStone: GameState.evoStone,
      pokeball: GameState.pokeball,
      pokeballLastRegen: GameState.pokeballLastRegen,
      teamDungeonFloor: GameState.teamDungeonFloor,
      towerFloor: GameState.towerFloor,
      pets: GameState.pets.map(p => ({
        id: p.id,
        name: p.name,
        speciesId: p.speciesId,
        quality: p.quality,
        gender: p.gender,
        generation: p.generation,
        level: p.level,
        exp: p.exp || 0,
        totalExp: p.totalExp || 0,
        potential: { ...p.potential },
        potentialCap: { ...p.potentialCap },
        skills: [...p.skills],
        affixes: p.affixes.map(a => ({ ...a })),
        lifeCap: p.lifeCap,
        life: p.life,
        isShiny: p.isShiny,
        isVariant: p.isVariant,
        variantName: p.variantName,
        aura: p.aura,
        evoStage: p.evoStage,
        fatherId: p.fatherId,
        motherId: p.motherId,
        hasGen10Affix: p.hasGen10Affix,
      })),
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
    return true;
  } catch (e) {
    console.error('存档失败:', e);
    return false;
  }
}

function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return false;
    const saveData = JSON.parse(raw);
    if (!saveData || saveData.version !== 1) return false;

    // 恢复ID计数器
    petIdCounter = saveData.petIdCounter || 0;

    // 恢复资源
    GameState.fruit = saveData.fruit ?? CONFIG.INITIAL_FRUIT;
    GameState.evoStone = saveData.evoStone ?? CONFIG.INITIAL_EVO_STONE;
    GameState.pokeball = saveData.pokeball ?? CONFIG.INITIAL_POKEBALL;
    GameState.teamDungeonFloor = saveData.teamDungeonFloor || 1;
    GameState.towerFloor = saveData.towerFloor || 1;

    // 恢复精灵球计时（计算离线期间应恢复的精灵球）
    const lastRegen = saveData.pokeballLastRegen || Date.now();
    const offlineMs = Date.now() - lastRegen;
    const offlineBalls = Math.floor(offlineMs / CONFIG.POKEBALL_REGEN_MS);
    if (offlineBalls > 0) {
      GameState.pokeball = Math.min(CONFIG.POKEBALL_MAX, GameState.pokeball + offlineBalls);
    }
    GameState.pokeballLastRegen = Date.now();

    // 恢复伙伴（重建species引用）
    GameState.pets = [];
    for (const pd of (saveData.pets || [])) {
      const species = SPECIES.find(s => s.id === pd.speciesId);
      if (!species) continue; // 跳过无效伙伴
      GameState.pets.push({
        id: pd.id,
        name: pd.name,
        speciesId: pd.speciesId,
        species: species,
        quality: pd.quality,
        gender: pd.gender,
        generation: pd.generation,
        level: pd.level,
        exp: pd.exp || 0,
        totalExp: pd.totalExp || 0,
        potential: pd.potential,
        potentialCap: pd.potentialCap,
        skills: pd.skills,
        affixes: pd.affixes || [],
        lifeCap: pd.lifeCap,
        life: pd.life,
        isShiny: pd.isShiny || false,
        isVariant: pd.isVariant || false,
        variantName: pd.variantName || null,
        aura: pd.aura || null,
        evoStage: pd.evoStage || 0,
        fatherId: pd.fatherId || null,
        motherId: pd.motherId || null,
        hasGen10Affix: pd.hasGen10Affix || false,
      });
    }

    console.log(`存档加载成功！${GameState.pets.length}只伙伴，离线恢复${offlineBalls}个精灵球`);
    return true;
  } catch (e) {
    console.error('读档失败:', e);
    return false;
  }
}

function deleteSave() {
  localStorage.removeItem(SAVE_KEY);
}

function hasSaveData() {
  return !!localStorage.getItem(SAVE_KEY);
}

// 自动存档（每30秒）
let autoSaveTimer = null;
function startAutoSave() {
  if (autoSaveTimer) clearInterval(autoSaveTimer);
  autoSaveTimer = setInterval(() => {
    saveGame();
  }, 30000);
}
