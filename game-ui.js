/**
 * game-ui.js - 伙伴繁育系统 UI交互
 */

// ========== 状态 ==========
let selectedScene = null;
let selectedFather = null;
let selectedMother = null;
let selectingFor = null;
let selectedEvolvePet = null;
let selectedDetailPet = null;
let teamSelection = [];
let selectedTeamFloor = 0;
let selectedTowerPet = null;
let selectedTowerFloor = 0;
let pokeballUITimer = null;

// ========== Tab 切换 ==========
function switchTab(tabName) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  document.querySelector(`.tab[data-tab="${tabName}"]`).classList.add('active');
  document.getElementById(`tab-${tabName}`).classList.add('active');
  if (tabName === 'inventory') refreshInventory();
  if (tabName === 'capture') refreshCapturePage();
  if (tabName === 'breed') refreshBreedPage();
  if (tabName === 'evolve') refreshEvolvePage();
  if (tabName === 'dungeon') refreshDungeonPage();
}

document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => switchTab(tab.dataset.tab));
});

// ========== 渲染技能图标（含CD） ==========
function renderSkillIcons(skills, isEvo) {
  let html = '<div class="skill-grid">';
  skills.forEach((sk, i) => {
    const info = getSkillInfo(sk);
    const typeClass = isEvo && i === skills.length - 1 ? 'skill-evo' : 'skill-' + info.type;
    html += `<div class="skill-icon ${typeClass}">
      ${info.icon}
      <span class="skill-cd-badge">${info.cd || 1}</span>
      <div class="skill-tooltip">
        <div class="st-name">${sk}</div>
        <div class="st-desc">${info.desc}</div>
        <div class="st-meta">CD: ${info.cd || 1} | 系数: ${(info.coeff || 1).toFixed(1)}x | 基于: ${(info.stat||'atk').toUpperCase()}</div>
      </div>
    </div>`;
  });
  html += '</div>';
  return html;
}

// ========== 渲染词条 ==========
function renderAffixes(affixes) {
  if (!affixes || affixes.length === 0) return '<span class="affix-white">无</span>';
  return affixes.map(a => {
    const color = getAffixColor(a);
    let valStr = '';
    if (a.isMixed) {
      valStr = `+${a.buffValue}${a.buffType==='pct'?'%':''}/-${Math.abs(a.debuffValue)}${a.debuffType==='pct'?'%':''}`;
    } else if (a.isGen10) {
      valStr = '全属性+18%';
    } else if (a.type === 'pct') {
      valStr = (a.value > 0 ? '+' : '') + a.value + '%';
    } else {
      valStr = typeof a.value === 'number' ? (a.value > 0 ? '+' : '') + a.value : a.value;
    }
    return `<span style="color:${color}">${a.name} ${valStr}</span>`;
  }).join(' ');
}

// ========== ★ 统一属性显示（当前值+进度条+资质） ========== 
// 完整版：用于详情面板、抓捕结果、繁育结果、进化等
function renderUnifiedStats(pet) {
  const cs = getCombatStats(pet);
  // 进度条以资质占资质上限的百分比为准
  const atkPct = Math.min(100, (pet.potential.atk / pet.potentialCap.atk * 100)).toFixed(0);
  const defPct = Math.min(100, (pet.potential.def / pet.potentialCap.def * 100)).toFixed(0);
  const hpPct  = Math.min(100, (pet.potential.hp  / pet.potentialCap.hp  * 100)).toFixed(0);
  return `
    <div class="us-row">
      <span class="us-icon" style="color:#ff6b6b">⚔</span>
      <span class="us-label">ATK</span>
      <span class="us-combat-val">${cs.atk}</span>
      <div class="us-bar-track"><div class="us-bar-fill atk" style="width:${atkPct}%"></div></div>
      <span class="us-apt">资质 <b>${pet.potential.atk}</b><span class="us-apt-cap">/${pet.potentialCap.atk}</span></span>
    </div>
    <div class="us-row">
      <span class="us-icon" style="color:#74b9ff">🛡</span>
      <span class="us-label">DEF</span>
      <span class="us-combat-val">${cs.def}</span>
      <div class="us-bar-track"><div class="us-bar-fill def" style="width:${defPct}%"></div></div>
      <span class="us-apt">资质 <b>${pet.potential.def}</b><span class="us-apt-cap">/${pet.potentialCap.def}</span></span>
    </div>
    <div class="us-row">
      <span class="us-icon" style="color:#55efc4">❤</span>
      <span class="us-label">HP</span>
      <span class="us-combat-val">${cs.hp}</span>
      <div class="us-bar-track"><div class="us-bar-fill hp" style="width:${hpPct}%"></div></div>
      <span class="us-apt">资质 <b>${pet.potential.hp}</b><span class="us-apt-cap">/${pet.potentialCap.hp}</span></span>
    </div>
  `;
}

// 紧凑版：用于卡片、副本选宠等小空间
function renderCompactStats(pet) {
  const cs = getCombatStats(pet);
  return `
    <div class="cs-row"><span class="cs-icon" style="color:#ff6b6b">⚔</span><span class="cs-val">${cs.atk}</span><span class="cs-apt">资质 ${pet.potential.atk}</span></div>
    <div class="cs-row"><span class="cs-icon" style="color:#74b9ff">🛡</span><span class="cs-val">${cs.def}</span><span class="cs-apt">资质 ${pet.potential.def}</span></div>
    <div class="cs-row"><span class="cs-icon" style="color:#55efc4">❤</span><span class="cs-val">${cs.hp}</span><span class="cs-apt">资质 ${pet.potential.hp}</span></div>
  `;
}

// 渲染经验条
function renderExpBar(pet) {
  if (pet.level >= CONFIG.MAX_LEVEL) return '<div class="exp-bar-wrap"><span class="exp-label">EXP</span><div class="stat-track"><div class="stat-fill exp" style="width:100%"></div></div><span class="stat-val">MAX</span></div>';
  const needed = getExpForLevel(pet.level);
  const pct = Math.min(100, ((pet.exp || 0) / needed * 100)).toFixed(0);
  return `<div class="exp-bar-wrap"><span class="exp-label">EXP</span><div class="stat-track"><div class="stat-fill exp" style="width:${pct}%"></div></div><span class="stat-val">${pet.exp || 0}/${needed}</span></div>`;
}

// 兼容旧调用
function renderStatBars(pet) { return renderCompactStats(pet); }
function renderCombatStats(pet) { return renderCompactStats(pet); }

// ========== ★ 统一伙伴详情卡片（用于抓捕/繁育/进化结果展示） ==========
function renderPetDetailCard(pet, extraInfo) {
  const q = QUALITY[pet.quality];
  const gi = pet.gender === 'male' ? '♂' : '♀';
  const pct = getPotentialPercent(pet);
  const cs = getCombatStats(pet);
  const needed = pet.level >= CONFIG.MAX_LEVEL ? 1 : getExpForLevel(pet.level);
  const expPct = pet.level >= CONFIG.MAX_LEVEL ? 100 : Math.min(100, ((pet.exp || 0) / needed * 100));
  const lifePct = Math.min(100, (pet.life / pet.lifeCap * 100));

  let tagsHtml = '';
  if (pet.isShiny) tagsHtml += '<span class="tag tag-shiny">✨闪光</span>';
  if (pet.isVariant) tagsHtml += `<span class="tag tag-variant">🎨${pet.variantName||'异色'}</span>`;
  if (pet.aura) tagsHtml += `<span class="tag tag-aura">💫${pet.aura.name}</span>`;
  if (pet.hasGen10Affix) tagsHtml += '<span class="tag tag-gen10">👑十代之证</span>';

  return `
    <div class="pdc-card">
      <div class="pdc-emoji">${pet.species.emoji}${pet.isShiny ? '<span class="pdc-shiny">✨</span>' : ''}</div>
      <div class="pdc-name" style="color:${pet.isVariant ? '#e67e22' : q.color}">${pet.isVariant ? '🎨 ' : ''}${pet.name} <span style="color:${pet.gender==='male'?'#3498db':'#e74c3c'}">${gi}</span></div>
      <div class="pdc-badges">
        <span class="pdc-quality-badge" style="background:${q.color}">${q.name}</span>
        <span class="pdc-type">${TYPE_TEMPLATE[pet.species.type].icon} ${TYPE_TEMPLATE[pet.species.type].name}</span>
      </div>
      <div class="pdc-info-line">Lv.${pet.level} | G${pet.generation} | 进化 ${pet.evoStage}/${pet.species.maxEvo}段 | 资质 ${pct}%</div>
      ${tagsHtml ? `<div class="pdc-tags">${tagsHtml}</div>` : ''}
      ${extraInfo ? `<div class="pdc-extra">${extraInfo}</div>` : ''}
      <div class="pdc-section-title">⚔ 属性 (Lv.${pet.level})</div>
      <div class="pdc-stats">
        ${renderUnifiedStats(pet)}
      </div>
      <div class="pdc-exp-life">
        <div class="exp-bar-wrap"><span class="exp-label">EXP</span><div class="stat-track"><div class="stat-fill exp" style="width:${expPct}%"></div></div><span class="stat-val">${pet.level>=CONFIG.MAX_LEVEL ? 'MAX' : `${pet.exp||0}/${needed}`}</span></div>
        <div class="exp-bar-wrap"><span class="exp-label" style="color:#e74c3c">❤ 寿命:</span><span class="stat-val" style="margin-left:4px">${pet.life}</span><div class="stat-track"><div class="stat-fill" style="width:${lifePct}%;background:linear-gradient(90deg,#e74c3c,#c0392b)"></div></div><span class="stat-val">上限 ${pet.lifeCap}</span></div>
      </div>
      <div class="pdc-section-title">⚔ 技能 (${pet.skills.length})</div>
      <div class="pdc-skills">${renderSkillIcons(pet.skills, pet.evoStage > 0)}</div>
      ${pet.affixes.length > 0 ? `
        <div class="pdc-section-title">📦 词条 (${pet.affixes.length})</div>
        <div class="pdc-affixes">${pet.affixes.map(a => {
          const color = getAffixColor(a);
          let desc = '';
          if (a.isMixed) {
            // 混合词条
            const buffStr = a.buffType === 'pct' ? `${a.buffStat==='all'?'全属性':a.buffStat.toUpperCase()}+${a.buffValue}%` : `${a.buffStat.toUpperCase()}+${a.buffValue}`;
            const debuffStr = a.debuffType === 'pct' ? `${a.debuffStat==='all'?'全属性':a.debuffStat.toUpperCase()}${a.debuffValue}%` : `${a.debuffStat.toUpperCase()}${a.debuffValue}`;
            desc = `<span style="color:#27ae60">${buffStr}</span> / <span style="color:#e74c3c">${debuffStr}</span>`;
          } else if (a.isGen10) {
            desc = '<span style="color:#e74c3c">全属性 +18%</span>';
          } else if (a.type === 'pct') {
            const sign = a.value > 0 ? '+' : '';
            const statLabel = a.stat === 'all' ? '全属性' : a.stat.toUpperCase();
            desc = `<span style="color:${a.value>0?'#27ae60':'#e74c3c'}">${statLabel} ${sign}${a.value}%</span>`;
          } else {
            const sign = a.value > 0 ? '+' : '';
            const statLabel = a.stat === 'all' ? '全属性' : a.stat.toUpperCase();
            desc = `<span style="color:${a.value>0?'#27ae60':'#e74c3c'}">${statLabel} ${sign}${a.value}</span>`;
          }
          return `<div class="pdc-affix-item" style="border-left:3px solid ${color.color || color};padding-left:8px">${a.name}：${desc}</div>`;
        }).join('')}</div>
      ` : ''}
    </div>
  `;
}

// ========== 通用：渲染伙伴卡片 ==========
function renderPetCard(pet, onClick, showActions) {
  const q = QUALITY[pet.quality];
  const gi = pet.gender === 'male' ? '♂' : '♀';
  const gc = pet.gender === 'male' ? '#3498db' : '#e74c3c';
  const pct = getPotentialPercent(pet);
  let tags = '';
  if (pet.isShiny) tags += '<span class="tag tag-shiny">✨闪光</span>';
  if (pet.isVariant) tags += `<span class="tag tag-variant">🎨${pet.variantName||'异色'}</span>`;
  if (pet.aura) tags += `<span class="tag tag-aura">💫${pet.aura.name}</span>`;
  if (pet.generation >= 10) tags += '<span class="tag tag-gen10">👑十代</span>';
  if (pet.evoStage > 0) tags += `<span class="tag tag-evolved">⚡进化${pet.evoStage}</span>`;

  let actions = '';

  const card = document.createElement('div');
  card.className = `pet-card ${q.css} ${pet.isShiny?'shiny':''} ${pet.isVariant?'variant':''}`;
  card.innerHTML = `
    <span class="pet-gen">G${pet.generation}</span>
    <span class="pet-quality" style="background:${q.color}">${q.name}</span>
    <div class="pet-emoji">${pet.species.emoji}</div>
    <div class="pet-name" style="color:${pet.isVariant?'#9b59b6':''}">${pet.name} <span style="color:${gc}">${gi}</span></div>
    <div class="pet-info">Lv.${pet.level} | 资质${pct}%</div>
    <div class="card-unified-stats">${renderCompactStats(pet)}</div>
    ${renderSkillIcons(pet.skills, pet.evoStage > 0)}
    <div class="pet-tags">${tags}</div>
    ${actions}
  `;
  if (onClick) card.addEventListener('click', () => onClick(pet));
  return card;
}

// ========== 仓库页（两栏布局） ==========
function refreshInventory() {
  const grid = document.getElementById('inventory-grid');
  const tip = document.getElementById('empty-tip');
  grid.innerHTML = '';

  // 获取筛选/排序条件
  const fq = document.getElementById('filter-quality').value;
  const ft = document.getElementById('filter-type').value;
  const sm = document.getElementById('sort-mode').value;

  let pets = [...GameState.pets];

  // 筛选
  if (fq !== 'all') pets = pets.filter(p => p.quality === parseInt(fq));
  if (ft !== 'all') pets = pets.filter(p => p.species.type === ft);

  // 排序
  pets.sort((a, b) => {
    switch (sm) {
      case 'potential-desc': return getPotentialPercent(b) - getPotentialPercent(a);
      case 'potential-asc': return getPotentialPercent(a) - getPotentialPercent(b);
      case 'level-desc': return b.level - a.level;
      case 'gen-desc': return b.generation - a.generation;
      case 'quality-desc': return b.quality - a.quality;
      default: return 0;
    }
  });

  if (pets.length === 0 && GameState.pets.length === 0) {
    tip.classList.remove('hidden');
    grid.parentElement.classList.add('hidden');
  } else {
    tip.classList.add('hidden');
    grid.parentElement.classList.remove('hidden');

    if (pets.length === 0) {
      grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;color:#8899aa;padding:30px">没有符合条件的伙伴</div>';
    } else {
      pets.forEach(pet => {
        const card = createInvCard(pet);
        grid.appendChild(card);
      });
    }
  }

  document.getElementById('pet-count').textContent = `🐾 ${GameState.pets.length}/50`;

  // 如果当前选中的伙伴还在列表里，保持高亮
  if (selectedDetailPet) {
    const found = GameState.pets.find(p => p.id === selectedDetailPet.id);
    if (found) {
      showInvDetail(found);
    }
  }

  updateFooter();
}

function createInvCard(pet) {
  const q = QUALITY[pet.quality];
  const pct = getPotentialPercent(pet);
  const card = document.createElement('div');
  card.className = `inv-card ${selectedDetailPet && selectedDetailPet.id === pet.id ? 'active' : ''}`;
  card.style.borderColor = q.color + '88';

  let tags = '';
  if (pet.isShiny) tags += '✨';
  if (pet.isVariant) tags += '🎨';
  if (pet.aura) tags += '💫';
  if (pet.generation >= 10) tags += '👑';
  if (pet.evoStage > 0) tags += '⚡';

  card.innerHTML = `
    <span class="ic-gen">G${pet.generation}</span>
    <span class="ic-quality" style="background:${q.color}"></span>
    <div class="ic-emoji">${pet.species.emoji}</div>
    <div class="ic-name">${pet.name} <span style="font-size:10px;color:#8899aa">Lv.${pet.level}</span></div>
    ${tags ? `<div class="ic-tags">${tags}</div>` : ''}
    <div class="ic-stats">${renderCompactStats(pet)}</div>
  `;

  card.addEventListener('click', () => {
    selectedDetailPet = pet;
    // 更新所有卡片高亮
    document.querySelectorAll('.inv-card').forEach(c => c.classList.remove('active'));
    card.classList.add('active');
    showInvDetail(pet);
  });

  return card;
}

// ========== 仓库右侧详情 ==========
function showInvDetail(pet) {
  document.getElementById('inv-detail-empty').classList.add('hidden');
  document.getElementById('inv-detail-content').classList.remove('hidden');

  const q = QUALITY[pet.quality];
  const tmpl = TYPE_TEMPLATE[pet.species.type];
  const pct = getPotentialPercent(pet);
  const gi = pet.gender === 'male' ? '♂' : '♀';
  const gc = pet.gender === 'male' ? '#3498db' : '#e74c3c';

  // Header
  let headerTags = '';
  if (pet.isShiny) headerTags += '<span class="tag tag-shiny">✨闪光</span> ';
  if (pet.isVariant) headerTags += `<span class="tag tag-variant">🎨${pet.variantName||'异色'}</span> `;
  if (pet.aura) headerTags += `<span class="tag tag-aura">💫${pet.aura.name}</span> `;
  if (pet.generation >= 10) headerTags += '<span class="tag tag-gen10">👑十代</span> ';
  if (pet.evoStage > 0) headerTags += `<span class="tag tag-evolved">⚡进化${pet.evoStage}</span> `;

  document.getElementById('detail-header').innerHTML = `
    <div style="font-size:48px;margin-bottom:6px">${pet.species.emoji}</div>
    <div style="font-size:18px;font-weight:bold;color:${pet.isVariant?'#9b59b6':q.color}">
      ${pet.name} <span style="color:${gc}">${gi}</span>
    </div>
    <div style="margin:5px 0;">
      <span style="background:${q.color};color:#fff;padding:2px 10px;border-radius:10px;font-size:11px">${q.name}</span>
      <span style="font-size:11px;color:#8899aa;margin-left:6px">${tmpl.icon} ${tmpl.name}</span>
    </div>
    <div style="font-size:12px;color:#8899aa">
      Lv.${pet.level} | G${pet.generation} | 进化 ${pet.evoStage}/${pet.species.maxEvo}段 | 资质 ${pct}%
    </div>
    ${headerTags ? `<div style="margin-top:6px">${headerTags}</div>` : ''}
  `;

  // Stats — 统一显示（当前值+进度条+资质）
  document.getElementById('detail-stats').innerHTML = `
    <div class="detail-stat-section">
      <div class="detail-stat-title">⚔️ 属性 (Lv.${pet.level})</div>
      ${renderUnifiedStats(pet)}
    </div>
    <div class="detail-stat-section" style="margin-top:8px">
      ${renderExpBar(pet)}
      <div class="us-row" style="margin-top:4px">
        <span class="us-icon" style="color:#e056fd">💜</span>
        <span class="us-label">寿命</span>
        <span class="us-combat-val">${pet.lifeCap}</span>
        <div class="us-bar-track"><div class="us-bar-fill life" style="width:${(pet.lifeCap/CONFIG.LIFE_CAP_MAX*100).toFixed(0)}%"></div></div>
        <span class="us-apt">上限 ${CONFIG.LIFE_CAP_MAX}</span>
      </div>
    </div>
  `;

  // Skills
  document.getElementById('detail-skills').innerHTML = `
    <div style="font-size:12px;font-weight:bold;margin-bottom:6px;color:#8899aa">⚔️ 技能 (${pet.skills.length})</div>
    ${renderSkillIcons(pet.skills, pet.evoStage > 0)}
  `;

  // Affixes
  let affixHtml = pet.affixes.map(a => {
    const color = getAffixColor(a);
    let valStr = '';
    if (a.isMixed) {
      const buffLabel = a.buffStat === 'all' ? '全属性' : a.buffStat.toUpperCase();
      const debuffLabel = a.debuffStat === 'all' ? '全属性' : a.debuffStat.toUpperCase();
      const buffStr = `${buffLabel}+${a.buffValue}${a.buffType==='pct'?'%':''}`;
      const debuffStr = `${debuffLabel}${a.debuffValue}${a.debuffType==='pct'?'%':''}`;
      valStr = `<span style="color:#27ae60">${buffStr}</span> / <span style="color:#e74c3c">${debuffStr}</span>`;
    } else if (a.isGen10) {
      valStr = '<span style="color:#e74c3c">全属性 +18%</span>';
    } else if (a.type === 'pct') {
      valStr = `<span style="color:${a.value>0?'#27ae60':'#e74c3c'}">${a.stat==='all'?'全属性':a.stat.toUpperCase()} ${a.value>0?'+':''}${a.value}%</span>`;
    } else {
      valStr = `<span style="color:${a.value>0?'#27ae60':'#e74c3c'}">${a.stat==='all'?'全属性':a.stat.toUpperCase()} ${a.value>0?'+':''}${a.value}</span>`;
    }
    return `<div style="padding:2px 0">${a.name}：${valStr}</div>`;
  }).join('');
  document.getElementById('detail-affixes').innerHTML = `
    <div style="font-size:12px;font-weight:bold;margin-bottom:6px;color:#8899aa">📜 词条 (${pet.affixes.length})</div>
    <div style="font-size:12px">${affixHtml || '<span style="color:#555">无</span>'}</div>
    ${pet.aura ? `<div style="margin-top:6px;color:#1abc9c;font-size:12px">💫 光环: ${pet.aura.name} - ${pet.aura.desc}</div>` : ''}
  `;

  // 隐藏雷达图
  document.getElementById('detail-radar-wrap').classList.add('hidden');

  // Lineage
  const lineage = document.getElementById('detail-lineage');
  if (pet.fatherId || pet.motherId) {
    const father = GameState.pets.find(p => p.id === pet.fatherId);
    const mother = GameState.pets.find(p => p.id === pet.motherId);
    lineage.innerHTML = `
      <div style="font-size:12px;font-weight:bold;margin-bottom:6px;color:#8899aa">🧬 血统</div>
      <div style="font-size:11px">
        父系: ${father ? `${father.species.emoji} ${father.name} G${father.generation}` : '(已不在)'}
        <br>母系: ${mother ? `${mother.species.emoji} ${mother.name} G${mother.generation}` : '(已不在)'}
      </div>
    `;
  } else {
    lineage.innerHTML = '<div style="font-size:12px;font-weight:bold;margin-bottom:6px;color:#8899aa">🧬 血统</div><div style="font-size:11px;color:#555">野生抓捕</div>';
  }

  // Actions - 放生按钮
  document.getElementById('detail-actions').innerHTML = `
    <button class="detail-release-btn" onclick="releaseSinglePet(${pet.id})">🗑️ 放生此伙伴</button>
  `;
}

// ========== 抓捕页（场景选择） ==========
function initCapturePage() {
  const list = document.getElementById('scene-list');
  CAPTURE_SCENES.forEach(scene => {
    const card = document.createElement('div');
    card.className = 'scene-card';
    card.style.background = scene.bg;
    card.innerHTML = `
      <div class="scene-emoji">${scene.emoji}</div>
      <div class="scene-name">${scene.name}</div>
      <div class="scene-desc">${scene.desc}</div>
    `;
    card.addEventListener('click', () => {
      document.querySelectorAll('.scene-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      selectedScene = scene;
      showScenePreview(scene);
      document.getElementById('btn-capture').disabled = false;
    });
    list.appendChild(card);
  });
}

function showScenePreview(scene) {
  const preview = document.getElementById('scene-species-preview');
  const icons = document.getElementById('scene-species-icons');
  const title = document.getElementById('scene-preview-title');
  preview.classList.remove('hidden');
  title.textContent = `${scene.emoji} ${scene.name} — 可能遇到的伙伴：`;
  icons.innerHTML = '';
  scene.speciesIds.forEach(sid => {
    const sp = SPECIES.find(s => s.id === sid);
    if (!sp) return;
    const tmpl = TYPE_TEMPLATE[sp.type];
    const item = document.createElement('div');
    item.className = 'scene-species-item';
    item.innerHTML = `<span class="ss-emoji">${sp.emoji}</span><span>${sp.name}</span><span style="font-size:9px;color:#667">${tmpl.icon}</span>`;
    icons.appendChild(item);
  });
}

function refreshCapturePage() {
  document.getElementById('pokeball-count-cap').textContent = GameState.pokeball;
  document.getElementById('pokeball-timer').textContent = getPokeballRegenTime();
}

document.getElementById('btn-capture').addEventListener('click', () => {
  if (!selectedScene) { alert('请先选择一个场景！'); return; }
  if (GameState.pokeball <= 0) { alert('精灵球不足！请等待恢复或看广告获取。'); return; }
  if (captureAnimLock) return; // 动画进行中不可重复抓捕
  lastCaptureSceneIds = selectedScene.speciesIds; // 记住场景
  const pet = capturePet(selectedScene.speciesIds);
  if (!pet) { alert('抓捕失败！'); return; }
  showCaptureResult(pet);
  refreshCapturePage();
  updateFooter();
  saveGame();
});

let captureAnimLock = false; // 防止动画未完成时重复抓捕
let lastCaptureSceneIds = null; // 记住上次场景

function showCaptureResult(pet) {
  const overlay = document.getElementById('capture-result-overlay');
  const panel = document.getElementById('capture-result');
  overlay.classList.remove('hidden');
  captureAnimLock = true;

  // 第1阶段：精灵球飞出动画
  panel.innerHTML = `
    <div class="capture-anim-stage" style="position:relative;overflow:hidden;">
      <div class="pokeball-throw">🔴</div>
    </div>
  `;

  // 第2阶段：0.9秒后白光爆发
  setTimeout(() => {
    const stage = panel.querySelector('.capture-anim-stage');
    if (stage) {
      const flash = document.createElement('div');
      flash.className = 'pokeball-flash';
      stage.appendChild(flash);
    }
  }, 900);

  // 第3阶段：1.2秒后显示伙伴（从小到大缩放）
  setTimeout(() => {
    let shinyBanner = '';
    if (pet.isShiny) {
      shinyBanner = `
        <div class="shiny-banner">
          <div class="shiny-stars">✨✨✨</div>
          <div class="shiny-text">🌟 闪光个体！！！🌟</div>
          <div class="shiny-desc">运气爆棚！资质额外 +10%！</div>
          <div class="shiny-stars">✨✨✨</div>
        </div>
      `;
    }

    const revealClass = pet.isVariant ? 'capture-variant-shake' : 'capture-reveal';
    const variantGlow = pet.isVariant ? 'variant-glow' : '';

    panel.innerHTML = `
      <div class="result-title">🎉 抓捕成功！</div>
      ${shinyBanner}
      <div class="${revealClass} ${variantGlow}" style="border-radius:12px;">
        ${renderPetDetailCard(pet)}
      </div>
      <div class="capture-bottom-actions">
        <button class="btn btn-small" style="background:#555;padding:8px 20px" onclick="closeCaptureResult()">关闭</button>
        <button class="btn btn-small" style="background:#3498db;padding:8px 20px" onclick="captureAgain()">🔴 消耗1个精灵球再次探索</button>
      </div>
    `;

    // 异色时面板抖动
    if (pet.isVariant) {
      panel.classList.add('variant-window-shake');
      setTimeout(() => panel.classList.remove('variant-window-shake'), 600);
    }

    // 动画完成，解锁（闪光横幅+缩放完成后）
    const unlockDelay = pet.isShiny ? 1200 : 800;
    setTimeout(() => { captureAnimLock = false; }, unlockDelay);
  }, 1200);
}

function closeCaptureResult() {
  document.getElementById('capture-result-overlay').classList.add('hidden');
}

function captureAgain() {
  if (!lastCaptureSceneIds) return;
  if (GameState.pokeball <= 0) {
    showSaveToast('❌ 精灵球不足！');
    return;
  }
  if (captureAnimLock) return;
  const pet = capturePet(lastCaptureSceneIds);
  if (!pet) {
    showSaveToast('❌ 抓捕失败！');
    return;
  }
  // 不关闭面板，直接重新播放动画
  showCaptureResult(pet);
  refreshCapturePage();
  updateFooter();
  saveGame();
}

// ========== 繁育页 ==========
function refreshBreedPage() {
  selectedFather = null;
  selectedMother = null;
  document.getElementById('father-content').innerHTML = '<p>点击选择</p>';
  document.getElementById('mother-content').innerHTML = '<p>点击选择</p>';
  document.getElementById('breed-result').classList.add('hidden');
  document.getElementById('btn-breed').disabled = true;
}

document.getElementById('father-slot').addEventListener('click', () => {
  selectingFor = 'father';
  showSelectModal('male');
});
document.getElementById('mother-slot').addEventListener('click', () => {
  selectingFor = 'mother';
  showSelectModal('female');
});

function showSelectModal(gender) {
  const modal = document.getElementById('select-modal');
  const list = document.getElementById('modal-pet-list');
  const title = document.getElementById('modal-title');
  title.textContent = gender === 'male' ? '选择父系 ♂' : '选择母系 ♀';
  list.innerHTML = '';

  const allGender = GameState.pets.filter(p => {
    if (p.gender !== gender) return false;
    if (p.generation >= CONFIG.MAX_GENERATION) return false;
    if (p.isVariant) return false;
    if (selectingFor === 'father' && selectedMother && p.id === selectedMother.id) return false;
    if (selectingFor === 'mother' && selectedFather && p.id === selectedFather.id) return false;
    return true;
  });

  if (allGender.length === 0) {
    list.innerHTML = `<div class="empty-tip">没有可用的${gender==='male'?'公':'母'}性伙伴</div>`;
  } else {
    // 可用的排前面，寿命不足的排后面
    const available = allGender.filter(p => p.lifeCap > 0);
    const noLife = allGender.filter(p => p.lifeCap <= 0);

    available.forEach(pet => {
      list.appendChild(renderPetCard(pet, (p) => {
        if (selectingFor === 'father') {
          selectedFather = p;
          renderParentSlot('father', p);
        } else {
          selectedMother = p;
          renderParentSlot('mother', p);
        }
        closeModal();
        checkBreedReady();
      }));
    });

    noLife.forEach(pet => {
      const card = renderPetCard(pet, null);
      card.style.opacity = '0.4';
      card.style.filter = 'grayscale(80%)';
      card.style.pointerEvents = 'none';
      card.style.position = 'relative';
      const overlay = document.createElement('div');
      overlay.style.cssText = 'position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(0,0,0,0.7);color:#e74c3c;font-size:13px;font-weight:bold;padding:4px 12px;border-radius:8px;white-space:nowrap;z-index:2;';
      overlay.textContent = '💀 寿命不足';
      card.style.position = 'relative';
      card.appendChild(overlay);
      list.appendChild(card);
    });
  }

  modal.classList.remove('hidden');
}

function closeModal() {
  document.getElementById('select-modal').classList.add('hidden');
}

function renderParentSlot(role, pet) {
  const container = document.getElementById(`${role}-content`);
  const q = QUALITY[pet.quality];
  const gi = pet.gender === 'male' ? '♂' : '♀';
  const pct = getPotentialPercent(pet);
  const lifePct = Math.min(100, (pet.life / pet.lifeCap * 100));
  container.innerHTML = `
    <div style="font-size:40px;text-align:center">${pet.species.emoji}</div>
    <div style="font-size:14px;font-weight:bold;text-align:center;color:${q.color}">${pet.name} <span style="color:${pet.gender==='male'?'#3498db':'#e74c3c'}">${gi}</span></div>
    <div style="text-align:center;margin:4px 0">
      <span style="background:${q.color};color:#fff;padding:1px 8px;border-radius:10px;font-size:11px">${q.name}</span>
      <span style="font-size:11px;color:#8899aa;margin-left:4px">${TYPE_TEMPLATE[pet.species.type].icon} ${TYPE_TEMPLATE[pet.species.type].name}</span>
    </div>
    <div style="font-size:10px;color:#8899aa;text-align:center;margin-bottom:6px">
      Lv.${pet.level} | G${pet.generation} | 进化${pet.evoStage}/${pet.species.maxEvo}段 | 资质${pct}%
    </div>
    ${renderUnifiedStats(pet)}
    <div class="exp-bar-wrap" style="margin-top:4px"><span class="exp-label" style="color:#e74c3c;font-size:10px">❤寿命</span><span class="stat-val" style="font-size:10px">${pet.life}</span><div class="stat-track"><div class="stat-fill" style="width:${lifePct}%;background:linear-gradient(90deg,#e74c3c,#c0392b)"></div></div><span class="stat-val" style="font-size:10px">上限${pet.lifeCap}</span></div>
    ${renderSkillIcons(pet.skills, pet.evoStage > 0)}
  `;
  updateBreedPreview();
}

function updateBreedPreview() {
  const preview = document.getElementById('breed-preview');
  if (!selectedFather || !selectedMother) {
    preview.classList.add('hidden');
    return;
  }
  preview.classList.remove('hidden');

  // 使用新的繁育区间公式
  const result = calcBreedPreviewRange(selectedFather, selectedMother);
  const r = result.ranges;
  const statConfig = {
    hp:  { label: '❤ 生命资质', color: '#27ae60' },
    atk: { label: '⚔ 攻击资质', color: '#e74c3c' },
    def: { label: '🛡 防御资质', color: '#3498db' },
  };
  for (const stat of ['atk', 'def', 'hp']) {
    const cfg = statConfig[stat];
    document.getElementById(`preview-${stat}`).innerHTML = `
      <span style="color:${cfg.color};font-weight:bold">${cfg.label}</span>
      <span style="color:#f1c40f;font-size:14px;font-weight:bold;margin-left:8px">${r[stat].min} - ${r[stat].max}</span>
    `;
  }
  // 显示子代代数
  const genLabel = document.getElementById('preview-gen');
  if (genLabel) genLabel.textContent = `第${result.gen}代`;
}

function checkBreedReady() {
  const errors = canBreed(selectedFather, selectedMother);
  document.getElementById('btn-breed').disabled = errors.length > 0;
}

document.getElementById('btn-breed').addEventListener('click', () => {
  if (!selectedFather || !selectedMother) return;
  const errors = canBreed(selectedFather, selectedMother);
  if (errors.length > 0) {
    alert('繁育失败：\n' + errors.join('\n'));
    return;
  }
  // 启动10秒倒计时
  startBreedTimer();
});

function startBreedTimer() {
  const overlay = document.getElementById('breed-timer-overlay');
  const countdown = document.getElementById('breed-countdown');
  const fill = document.getElementById('breed-timer-fill');
  overlay.classList.remove('hidden');
  let remaining = 10;
  countdown.textContent = remaining;
  fill.style.width = '0%';

  const timer = setInterval(() => {
    remaining--;
    countdown.textContent = remaining;
    fill.style.width = ((10 - remaining) / 10 * 100) + '%';
    if (remaining <= 0) {
      clearInterval(timer);
      overlay.classList.add('hidden');
      // 执行繁育
      const result = breed(selectedFather, selectedMother);
      if (!result.success) {
        alert('繁育失败：\n' + result.errors.join('\n'));
        return;
      }
      renderParentSlot('father', selectedFather);
      renderParentSlot('mother', selectedMother);
      updateFooter();
      saveGame(); // 自动存档
      showBreedResultOverlay(result);
    }
  }, 1000);
}

function showBreedResultOverlay(result) {
  const overlay = document.getElementById('breed-result-overlay');
  const content = document.getElementById('breed-result-content');
  overlay.classList.remove('hidden');
  const child = result.child;

  let extraInfo = '';
  if (child.isShiny) extraInfo += '✨ <strong style="color:#f1c40f">闪光个体！</strong><br>';
  if (child.isVariant) extraInfo += `🎨 <strong style="color:#9b59b6">异色变异！→ ${child.variantName}</strong><br>`;
  if (child.aura) extraInfo += `💫 <strong style="color:#1abc9c">获得光环：${child.aura.name} - ${child.aura.desc}</strong><br>`;
  if (child.generation >= 10) extraInfo += '👑 <strong style="color:#e74c3c">第十代！获得十代之证词条！</strong><br>';
  const breedAffixes = child.affixes.filter(a => a.isBreedAffix);
  if (breedAffixes.length > 0) {
    extraInfo += `🔮 <strong style="color:#27ae60">获得繁育词条：${breedAffixes.map(a=>a.name+'+'+a.value).join(', ')}</strong><br>`;
  }
  // 显示繁育区间
  if (result.breedRanges) {
    extraInfo += `<div style="font-size:11px;color:#8899aa;margin-top:4px">`;
    for (const stat of ['hp', 'atk', 'def']) {
      const r = result.breedRanges[stat];
      const label = stat === 'hp' ? '❤HP' : stat === 'atk' ? '⚔ATK' : '🛡DEF';
      extraInfo += `${label}: ${r.min}~${r.max} → <span style="color:#f1c40f">${result.child.potential[stat]}</span>　`;
    }
    extraInfo += `</div>`;
  }

  content.innerHTML = `
    <div class="result-title">🐣 恭喜！繁育成功！</div>
    ${renderPetDetailCard(child, extraInfo || null)}
  `;
}

function closeBreedResult() {
  document.getElementById('breed-result-overlay').classList.add('hidden');
}

// ========== 进化页 ==========
function refreshEvolvePage() {
  const list = document.getElementById('evolve-pet-list');
  list.innerHTML = '';
  selectedEvolvePet = null;
  document.getElementById('evolve-panel').classList.add('hidden');

  const allPets = GameState.pets.filter(p => p.species.maxEvo > 0);
  if (allPets.length === 0) {
    list.innerHTML = '<div class="empty-tip">没有可进化的伙伴</div>';
    return;
  }

  // 分三组：可进化（全满足）、部分满足、不可进化
  const readyPets = [];    // 所有条件都满足
  const partialPets = [];  // 至少一个条件满足但不是全部
  const blockedPets = [];  // 一个条件都不满足，或已满进化

  allPets.forEach(pet => {
    if (pet.evoStage >= pet.species.maxEvo) {
      blockedPets.push(pet); // 已满进化
      return;
    }
    // 检查各项条件是否满足（只判等级和总资质）
    const levelOk = pet.level >= CONFIG.MAX_LEVEL;
    const total = pet.potential.atk + pet.potential.def + pet.potential.hp;
    const aptOk = total >= CONFIG.EVO_TOTAL_THRESHOLD;
    const metCount = (levelOk ? 1 : 0) + (aptOk ? 1 : 0);

    if (metCount === 2) readyPets.push(pet);
    else if (metCount >= 1) partialPets.push(pet);
    else blockedPets.push(pet);
  });

  function renderSection(title, color, icon, pets, dimmed) {
    if (pets.length === 0) return '';
    let html = `<div style="grid-column:1/-1;margin:12px 0 6px;padding:8px 12px;background:${color};border-radius:8px;font-size:13px;font-weight:bold;">
      ${icon} ${title} <span style="color:#8899aa;font-weight:normal;font-size:11px">(${pets.length})</span>
    </div>`;
    const container = document.createElement('div');
    container.innerHTML = html;
    list.appendChild(container.firstElementChild);

    pets.forEach(pet => {
      const card = renderPetCard(pet, (p) => {
        selectedEvolvePet = p;
        showEvolvePanel(p);
      }, true);
      if (dimmed) {
        card.style.opacity = '0.45';
        card.style.filter = 'grayscale(60%)';
      }
      list.appendChild(card);
    });
  }

  renderSection('✅ 可进化', 'rgba(39,174,96,0.15)', '⚡', readyPets, false);
  renderSection('⏳ 部分条件满足', 'rgba(241,196,15,0.15)', '🔧', partialPets, false);
  renderSection('🔒 不可进化', 'rgba(149,165,166,0.15)', '🚫', blockedPets, true);
}

function showEvolvePanel(pet) {
  const overlay = document.getElementById('evolve-overlay');
  const detail = document.getElementById('evolve-detail');
  overlay.classList.remove('hidden');
  document.getElementById('evolve-result').classList.add('hidden');

  const errors = canEvolve(pet);
  const canDo = errors.length === 0;
  const q = QUALITY[pet.quality];
  const total = pet.potential.atk + pet.potential.def + pet.potential.hp;

  // 进化条件检查区块
  let condHtml = `<div class="pdc-section-title">📋 进化条件</div><div style="font-size:12px;color:#8899aa;line-height:2">`;
  condHtml += `<div>等级: Lv.${pet.level} ${pet.level>=CONFIG.MAX_LEVEL?'<span style="color:#27ae60">✅</span>':'<span style="color:#e74c3c">❌ 需满级'+CONFIG.MAX_LEVEL+'</span>'}</div>`;
  condHtml += `<div>总资质: ${total} ${total>=CONFIG.EVO_TOTAL_THRESHOLD?'<span style="color:#27ae60">✅</span>':'<span style="color:#e74c3c">❌ 需≥'+CONFIG.EVO_TOTAL_THRESHOLD+'</span>'}</div>`;
  condHtml += `<div>进化石: ${GameState.evoStone} ${GameState.evoStone>=1?'<span style="color:#27ae60">✅</span>':'<span style="color:#e74c3c">❌ 不足</span>'}</div>`;
  condHtml += `<div>进化段数: ${pet.evoStage}/${pet.species.maxEvo} ${pet.evoStage<pet.species.maxEvo?'<span style="color:#27ae60">✅</span>':'<span style="color:#e74c3c">❌ 已满</span>'}</div>`;
  if (pet.species.evoSkill && pet.evoStage === 0) condHtml += `<div style="color:#e67e22">🆕 进化后获得新技能：${pet.species.evoSkill}</div>`;
  condHtml += `</div>`;

  detail.innerHTML = renderPetDetailCard(pet, condHtml);
  const btnEvolve = document.getElementById('btn-evolve');
  btnEvolve.style.display = '';
  btnEvolve.disabled = !canDo;
}

function closeEvolveOverlay() {
  document.getElementById('evolve-overlay').classList.add('hidden');
}

document.getElementById('btn-evolve').addEventListener('click', () => {
  if (!selectedEvolvePet) return;
  const result = evolve(selectedEvolvePet);
  if (!result.success) {
    alert('进化失败：\n' + result.errors.join('\n'));
    return;
  }
  showEvolveResult(result);
  updateFooter();
  saveGame();
});

function showEvolveResult(result) {
  const detail = document.getElementById('evolve-detail');
  const b = result.before;
  const a = result.after;
  const pet = result.pet;

  const newSkill = a.skills.length > b.skills.length ? a.skills[a.skills.length-1] : null;

  let extraInfo = `
    <div style="display:flex;gap:12px;justify-content:center;align-items:center;flex-wrap:wrap;margin:4px 0">
      <div style="font-size:11px;color:#8899aa">
        资质变化:
        ATK <span style="color:#27ae60">${b.potential.atk}→${a.potential.atk}(+${a.potential.atk-b.potential.atk})</span> |
        DEF <span style="color:#27ae60">${b.potential.def}→${a.potential.def}(+${a.potential.def-b.potential.def})</span> |
        HP <span style="color:#27ae60">${b.potential.hp}→${a.potential.hp}(+${a.potential.hp-b.potential.hp})</span>
      </div>
    </div>
    <div style="font-size:11px;color:#f1c40f">上限提升 +10%</div>
    ${newSkill ? `<div style="color:#e67e22;font-weight:bold;font-size:13px">🆕 获得新技能：${newSkill}</div>` : ''}
  `;

  // 直接替换弹窗内容为进化结果
  detail.innerHTML = `
    <div class="result-title" style="color:#e67e22;font-size:18px;text-align:center;margin-bottom:12px">⚡ 进化成功！ → 第${a.evoStage}段</div>
    ${renderPetDetailCard(pet, extraInfo)}
  `;

  // 隐藏执行按钮
  document.getElementById('btn-evolve').style.display = 'none';

  // 刷新进化列表
  refreshEvolvePage();
}

// ========== 雷达图 ==========
function drawRadarChart(pet) {
  const canvas = document.getElementById('radar-chart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;
  const cx = w / 2, cy = h / 2;
  const r = 90;

  ctx.clearRect(0, 0, w, h);

  const labels = ['ATK', 'DEF', 'HP'];
  const values = [pet.potential.atk / 1640, pet.potential.def / 1640, pet.potential.hp / 1640];
  const capValues = [pet.potentialCap.atk / 1640, pet.potentialCap.def / 1640, pet.potentialCap.hp / 1640];
  const colors = ['#e74c3c', '#3498db', '#27ae60'];
  const n = 3;
  const angleStep = (Math.PI * 2) / n;
  const startAngle = -Math.PI / 2;

  // 背景网格
  for (let level = 0.25; level <= 1; level += 0.25) {
    ctx.beginPath();
    for (let i = 0; i <= n; i++) {
      const angle = startAngle + i * angleStep;
      const x = cx + Math.cos(angle) * r * level;
      const y = cy + Math.sin(angle) * r * level;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = '#243447';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // 轴线
  for (let i = 0; i < n; i++) {
    const angle = startAngle + i * angleStep;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r);
    ctx.strokeStyle = '#344958';
    ctx.stroke();
  }

  // 上限区域
  ctx.beginPath();
  for (let i = 0; i <= n; i++) {
    const angle = startAngle + (i % n) * angleStep;
    const x = cx + Math.cos(angle) * r * capValues[i % n];
    const y = cy + Math.sin(angle) * r * capValues[i % n];
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.fillStyle = 'rgba(241, 196, 15, 0.1)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(241, 196, 15, 0.3)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // 当前值区域
  ctx.beginPath();
  for (let i = 0; i <= n; i++) {
    const angle = startAngle + (i % n) * angleStep;
    const x = cx + Math.cos(angle) * r * values[i % n];
    const y = cy + Math.sin(angle) * r * values[i % n];
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.fillStyle = 'rgba(52, 152, 219, 0.25)';
  ctx.fill();
  ctx.strokeStyle = '#3498db';
  ctx.lineWidth = 2;
  ctx.stroke();

  // 数据点
  for (let i = 0; i < n; i++) {
    const angle = startAngle + i * angleStep;
    const x = cx + Math.cos(angle) * r * values[i];
    const y = cy + Math.sin(angle) * r * values[i];
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fillStyle = colors[i];
    ctx.fill();
  }

  // 标签
  ctx.font = 'bold 13px Microsoft YaHei';
  for (let i = 0; i < n; i++) {
    const angle = startAngle + i * angleStep;
    const lx = cx + Math.cos(angle) * (r + 25);
    const ly = cy + Math.sin(angle) * (r + 25);
    ctx.fillStyle = colors[i];
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(labels[i], lx, ly);
  }

  // 中心文字
  ctx.font = '11px Microsoft YaHei';
  ctx.fillStyle = '#8899aa';
  ctx.fillText(`资质: ${getPotentialPercent(pet)}%`, cx, cy + r + 40);
}

// ========== 副本页 ==========
function refreshDungeonPage() {
  refreshTeamDungeon();
  refreshTowerDungeon();
}

function switchDungeonTab(type) {
  document.querySelectorAll('.dungeon-tab').forEach(t => t.classList.remove('active'));
  document.querySelector(`.dungeon-tab[data-dtype="${type}"]`).classList.add('active');
  document.getElementById('dungeon-team').classList.toggle('hidden', type !== 'team');
  document.getElementById('dungeon-tower').classList.toggle('hidden', type !== 'tower');
}

// -- 团队副本 --
function refreshTeamDungeon() {
  teamSelection = [];
  const list = document.getElementById('team-select-list');
  list.innerHTML = '';
  if (GameState.pets.length === 0) {
    list.innerHTML = '<div style="color:#8899aa;font-size:12px">没有伙伴可出战</div>';
  } else {
    GameState.pets.forEach(pet => {
      const card = document.createElement('div');
      card.className = 'pet-mini-card';
      card.dataset.petId = pet.id;
      card.innerHTML = `<span class="mini-emoji">${pet.species.emoji}</span><div class="mini-info"><div class="mini-name">${pet.name} <span style="color:#8899aa">Lv.${pet.level}</span></div><div class="mini-compact-stats">${renderCompactStats(pet)}</div></div>`;
      card.addEventListener('click', () => toggleTeamMember(pet, card));
      list.appendChild(card);
    });
  }
  updateSelectedTeamDisplay();

  const floorList = document.getElementById('team-floor-list');
  floorList.innerHTML = '';
  document.getElementById('team-floor-info').textContent = `(当前进度: 第${GameState.teamDungeonFloor}层)`;
  DUNGEON_TEAM.forEach((floor, i) => {
    const btn = document.createElement('button');
    btn.className = 'floor-btn';
    if (i + 1 < GameState.teamDungeonFloor) btn.classList.add('cleared');
    if (i + 1 > GameState.teamDungeonFloor) btn.classList.add('locked');
    if (i === selectedTeamFloor) btn.classList.add('selected');
    btn.textContent = `第${floor.floor}层`;
    btn.addEventListener('click', () => {
      if (i + 1 > GameState.teamDungeonFloor) return;
      selectedTeamFloor = i;
      document.querySelectorAll('#team-floor-list .floor-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      checkTeamBattleReady();
    });
    floorList.appendChild(btn);
  });
  document.getElementById('btn-team-battle').disabled = true;
  document.getElementById('team-battle-log').classList.add('hidden');
}

function toggleTeamMember(pet, card) {
  const idx = teamSelection.findIndex(p => p.id === pet.id);
  if (idx >= 0) {
    teamSelection.splice(idx, 1);
    card.classList.remove('selected');
  } else {
    if (teamSelection.length >= 3) return;
    teamSelection.push(pet);
    card.classList.add('selected');
  }
  updateSelectedTeamDisplay();
  checkTeamBattleReady();
}

function updateSelectedTeamDisplay() {
  const container = document.getElementById('selected-team');
  container.innerHTML = '';
  for (let i = 0; i < 3; i++) {
    const slot = document.createElement('div');
    slot.className = 'selected-team-slot';
    if (teamSelection[i]) {
      slot.classList.add('filled');
      slot.textContent = `${teamSelection[i].species.emoji} ${teamSelection[i].name}`;
    } else {
      slot.textContent = `槽位${i+1}`;
    }
    container.appendChild(slot);
  }
}

function checkTeamBattleReady() {
  document.getElementById('btn-team-battle').disabled = teamSelection.length < 3;
}

document.getElementById('btn-team-battle').addEventListener('click', () => {
  if (teamSelection.length < 3) return;
  const result = runTeamBattle(teamSelection, selectedTeamFloor);
  // 拉起战斗过程界面，动画播放完毕后再显示结果
  playBattleArena(result, () => {
    showBattleLog('team-battle-log', result);
    refreshTeamDungeon();
    updateFooter();
    saveGame(); // 自动存档
  });
});

// -- 爬塔副本 --
function refreshTowerDungeon() {
  selectedTowerPet = null;
  const list = document.getElementById('tower-pet-list');
  list.innerHTML = '';
  if (GameState.pets.length === 0) {
    list.innerHTML = '<div style="color:#8899aa;font-size:12px">没有伙伴可出战</div>';
  } else {
    GameState.pets.forEach(pet => {
      const card = document.createElement('div');
      card.className = 'pet-mini-card';
      card.innerHTML = `<span class="mini-emoji">${pet.species.emoji}</span><div class="mini-info"><div class="mini-name">${pet.name} <span style="color:#8899aa">Lv.${pet.level}</span></div><div class="mini-compact-stats">${renderCompactStats(pet)}</div></div>`;
      card.addEventListener('click', () => {
        document.querySelectorAll('#tower-pet-list .pet-mini-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        selectedTowerPet = pet;
        checkTowerBattleReady();
      });
      list.appendChild(card);
    });
  }

  const floorList = document.getElementById('tower-floor-list');
  floorList.innerHTML = '';
  document.getElementById('tower-floor-info').textContent = `(当前进度: 第${GameState.towerFloor}层)`;
  DUNGEON_TOWER.forEach((floor, i) => {
    const btn = document.createElement('button');
    btn.className = 'floor-btn';
    if (i + 1 < GameState.towerFloor) btn.classList.add('cleared');
    if (i + 1 > GameState.towerFloor) btn.classList.add('locked');
    if (i === selectedTowerFloor) btn.classList.add('selected');
    btn.textContent = `第${floor.floor}层`;
    btn.addEventListener('click', () => {
      if (i + 1 > GameState.towerFloor) return;
      selectedTowerFloor = i;
      document.querySelectorAll('#tower-floor-list .floor-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      checkTowerBattleReady();
    });
    floorList.appendChild(btn);
  });
  document.getElementById('btn-tower-battle').disabled = true;
  document.getElementById('tower-battle-log').classList.add('hidden');
}

function checkTowerBattleReady() {
  document.getElementById('btn-tower-battle').disabled = !selectedTowerPet;
}

document.getElementById('btn-tower-battle').addEventListener('click', () => {
  if (!selectedTowerPet) return;
  const result = runTowerBattle(selectedTowerPet, selectedTowerFloor);
  playBattleArena(result, () => {
    showBattleLog('tower-battle-log', result);
    refreshTowerDungeon();
    updateFooter();
    saveGame(); // 自动存档
  });
});

// -- 战斗日志显示（结构化） --
function showBattleLog(elementId, result) {
  const el = document.getElementById(elementId);
  el.classList.remove('hidden');
  let html = '';
  if (result.log) {
    result.log.forEach(entry => {
      if (typeof entry === 'string') {
        html += `<div class="log-line">${entry}</div>`;
      } else if (entry.type === 'round') {
        html += `<div class="log-round">── 第 ${entry.round} 回合 ──</div>`;
      } else if (entry.type === 'action') {
        const hpPct = entry.targetMaxHp > 0 ? Math.max(0, entry.targetHp / entry.targetMaxHp * 100).toFixed(0) : 0;
        if (entry.dmg > 0) {
          html += `<div class="log-action">${entry.actorEmoji} <b>${entry.actor}</b> 使用 <span class="log-skill">${entry.skillIcon} ${entry.skill}</span> → ${entry.target} <span class="log-dmg">-${entry.dmg}</span> <span class="log-hp-mini">[${Math.max(0, entry.targetHp)}/${entry.targetMaxHp}]</span></div>`;
        } else {
          html += `<div class="log-action log-buff">${entry.actorEmoji} <b>${entry.actor}</b> 使用 <span class="log-skill">${entry.skillIcon} ${entry.skill}</span> ${entry.info || ''}</div>`;
        }
      } else if (entry.type === 'kill') {
        html += `<div class="log-kill">💀 ${entry.target} 被 ${entry.actor} 击败！</div>`;
      } else if (entry.type === 'death') {
        html += `<div class="log-death">☠️ ${entry.actorEmoji} ${entry.actor} 阵亡！(寿命-1)</div>`;
      }
    });
  }
  el.innerHTML = html;
  el.scrollTop = el.scrollHeight;

  // 弹出战斗结果Overlay
  showBattleResultOverlay(result);
}

// ========== ★ 战斗结果全屏Overlay ★ ==========
function showBattleResultOverlay(result) {
  const overlay = document.getElementById('battle-result-overlay');
  const content = document.getElementById('battle-result-content');
  overlay.classList.remove('hidden');

  const isWin = result.win;
  const bgGrad = isWin
    ? 'linear-gradient(135deg, #0a3d0c 0%, #1a2736 50%, #0d2f4e 100%)'
    : 'linear-gradient(135deg, #3d0a0a 0%, #1a2736 50%, #2f0d0d 100%)';

  // 统计数据
  let statsHtml = '';
  if (result.allies) {
    statsHtml += '<div class="br-stats-grid">';
    result.allies.forEach(a => {
      const hpPct = a.maxHp > 0 ? Math.max(0, a.curHp / a.maxHp * 100).toFixed(0) : 0;
      const alive = a.alive;
      statsHtml += `
        <div class="br-unit-card ${alive ? '' : 'br-dead'}">
          <div class="br-unit-emoji">${a.emoji}</div>
          <div class="br-unit-name">${a.name}</div>
          <div class="br-unit-hp-bar"><div class="br-unit-hp-fill" style="width:${hpPct}%;background:${alive ? '#27ae60' : '#e74c3c'}"></div></div>
          <div class="br-unit-hp-text">${alive ? Math.max(0, a.curHp) : '阵亡'} / ${a.maxHp}</div>
          <div class="br-unit-stats-row">
            <span class="br-dmg-dealt">⚔ ${a.dmgDealt}</span>
            <span class="br-dmg-taken">🛡 ${a.dmgTaken}</span>
            ${a.killCount > 0 ? `<span class="br-kills">💀 ${a.killCount}</span>` : ''}
          </div>
        </div>`;
    });
    statsHtml += '</div>';
  }

  // 经验结果
  let expHtml = '';
  if (result.expResults && result.expResults.length > 0) {
    expHtml = '<div class="br-exp-section"><div class="br-exp-title">📈 经验获取</div>';
    result.expResults.forEach(e => {
      expHtml += `<div class="br-exp-row">${e.emoji} ${e.name}: +${e.exp} EXP ${e.leveled ? `<span class="br-levelup">🆙 Lv.${e.from} → Lv.${e.to}</span>` : ''}</div>`;
    });
    expHtml += '</div>';
  }

  // 敌方信息
  let enemyHtml = '';
  if (result.enemies) {
    enemyHtml = '<div class="br-enemy-section">';
    result.enemies.forEach(e => {
      enemyHtml += `<span class="br-enemy-tag">${e.emoji} ${e.name} ${e.alive ? `(剩${Math.max(0,e.curHp)}HP)` : '💀'}</span> `;
    });
    enemyHtml += '</div>';
  }

  content.style.background = bgGrad;
  content.innerHTML = `
    <div class="br-header">
      <div class="br-result-icon">${isWin ? '🏆' : '💀'}</div>
      <div class="br-result-text">${isWin ? '战斗胜利！' : '战斗失败...'}</div>
      <div class="br-floor-text">${result.floorName} | ${result.rounds} 回合</div>
    </div>
    ${statsHtml}
    ${enemyHtml}
    ${isWin ? `<div class="br-reward-section"><span class="br-reward-icon">${result.rewardType}</span> <span class="br-reward-val">×${result.reward}</span></div>` : ''}
    ${expHtml}
    <button class="btn btn-primary br-close-btn" onclick="closeBattleResult()">确认</button>
  `;
}

function closeBattleResult() {
  document.getElementById('battle-result-overlay').classList.add('hidden');
}

// ========== ★★★ 战斗过程动画引擎 ★★★ ==========

function buildArenaUnitCard(unit, side) {
  const hpPct = unit.maxHp > 0 ? (unit.curHp / unit.maxHp * 100).toFixed(0) : 100;
  const skillIcons = unit.skills.map(s => {
    const data = s.data || {};
    return `<span class="arena-skill-icon" title="${s.name} (CD:${data.cd||1})">${data.icon || '⚔️'}</span>`;
  }).join('');
  const hpColor = side === 'enemy' ? '#e74c3c' : '#27ae60';
  return `
    <div class="arena-unit" id="arena-unit-${unit.id}" data-uid="${unit.id}">
      <div class="arena-unit-emoji">${unit.emoji}</div>
      <div class="arena-unit-name">${unit.name}</div>
      <div class="arena-unit-vals">⚔${unit.atk} 🛡${unit.def}</div>
      <div class="arena-hp-bar">
        <div class="arena-hp-fill" id="arena-hp-${unit.id}" style="width:${hpPct}%;background:${hpColor}"></div>
      </div>
      <div class="arena-hp-text" id="arena-hp-text-${unit.id}">${unit.curHp}/${unit.maxHp}</div>
      <div class="arena-skills">${skillIcons}</div>
    </div>`;
}

function playBattleArena(result, onFinish) {
  const overlay = document.getElementById('battle-arena-overlay');
  const enemyArea = document.getElementById('arena-enemy-units');
  const allyArea = document.getElementById('arena-ally-units');
  const floorLabel = document.getElementById('arena-floor-label');
  const roundLabel = document.getElementById('arena-round-label');
  const actionText = document.getElementById('arena-action-text');
  const logBar = document.getElementById('arena-log-bar');

  overlay.classList.remove('hidden');
  floorLabel.textContent = result.floorName || '';
  roundLabel.textContent = '准备';
  actionText.textContent = '';
  logBar.innerHTML = '';

  // 初始化HP追踪：拷贝初始满血状态
  const hpState = {};
  result.allies.forEach(u => { hpState[u.id] = { cur: u.maxHp, max: u.maxHp, alive: true }; });
  result.enemies.forEach(u => { hpState[u.id] = { cur: u.maxHp, max: u.maxHp, alive: true }; });

  // 区分敌我ID集合
  const allyIds = new Set(result.allies.map(u => u.id));
  const enemyIds = new Set(result.enemies.map(u => u.id));

  // 渲染初始卡牌
  enemyArea.innerHTML = result.enemies.map(u => buildArenaUnitCard(u, 'enemy')).join('');
  allyArea.innerHTML = result.allies.map(u => buildArenaUnitCard(u, 'ally')).join('');

  // 收集需要动画播放的事件
  const events = result.log || [];
  let idx = 0;
  const TICK_MS = 800; // 每个事件间隔

  function updateHpUI(uid) {
    const s = hpState[uid];
    if (!s) return;
    const fill = document.getElementById(`arena-hp-${uid}`);
    const text = document.getElementById(`arena-hp-text-${uid}`);
    const card = document.getElementById(`arena-unit-${uid}`);
    if (fill) fill.style.width = Math.max(0, s.cur / s.max * 100) + '%';
    if (text) text.textContent = `${Math.max(0, s.cur)}/${s.max}`;
    if (!s.alive && card) card.classList.add('arena-unit-dead');
  }

  function showDmgFloat(uid, dmg) {
    const card = document.getElementById(`arena-unit-${uid}`);
    if (!card) return;
    const float = document.createElement('div');
    float.className = 'arena-dmg-float';
    float.textContent = `-${dmg}`;
    card.appendChild(float);
    setTimeout(() => float.remove(), 900);
  }

  function doAttackAnim(attackerUid, targetUid) {
    const atkCard = document.getElementById(`arena-unit-${attackerUid}`);
    const tgtCard = document.getElementById(`arena-unit-${targetUid}`);
    if (!atkCard || !tgtCard) return;
    // 已死亡的单位不播放攻击动画
    if (hpState[attackerUid] && !hpState[attackerUid].alive) return;
    if (hpState[targetUid] && !hpState[targetUid].alive) return;

    // 判断方向：我方往上撞，敌方往下撞
    const isAlly = allyIds.has(attackerUid);
    atkCard.classList.add(isAlly ? 'arena-charge-up' : 'arena-charge-down');
    setTimeout(() => {
      atkCard.classList.remove('arena-charge-up', 'arena-charge-down');
      tgtCard.classList.add('arena-shake');
      setTimeout(() => tgtCard.classList.remove('arena-shake'), 400);
    }, 300);
  }

  // 优先使用log中记录的ID，回退到name匹配
  function getTargetId(entry) {
    if (entry.targetId !== undefined && entry.targetId !== null) return entry.targetId;
    const all = [...result.allies, ...result.enemies];
    const found = all.find(u => u.name === entry.target);
    return found ? found.id : null;
  }
  function getActorId(entry) {
    if (entry.actorId !== undefined && entry.actorId !== null) return entry.actorId;
    const all = [...result.allies, ...result.enemies];
    const found = all.find(u => u.name === entry.actor);
    return found ? found.id : null;
  }

  function playNext() {
    if (idx >= events.length) {
      // 战斗结束，延迟后关闭并显示结果
      setTimeout(() => {
        overlay.classList.add('hidden');
        if (onFinish) onFinish();
        showBattleResultOverlay(result);
      }, 1200);
      return;
    }

    const ev = events[idx];
    idx++;

    if (ev.type === 'round') {
      roundLabel.textContent = `回合 ${ev.round}`;
      actionText.textContent = '';
      setTimeout(playNext, 400);
    } else if (ev.type === 'action') {
      const actorId = getActorId(ev);
      const targetId = getTargetId(ev);
      actionText.innerHTML = `${ev.actorEmoji} <b>${ev.actor}</b> → ${ev.skillIcon || '⚔️'} ${ev.skill} → <b>${ev.target}</b>`;

      if (ev.dmg > 0 && targetId !== null) {
        doAttackAnim(actorId, targetId);
        // 更新HP追踪
        if (hpState[targetId]) {
          hpState[targetId].cur = Math.max(0, hpState[targetId].cur - ev.dmg);
        }
        setTimeout(() => {
          showDmgFloat(targetId, ev.dmg);
          updateHpUI(targetId);
        }, 350);
      }

      // 底部日志条
      const line = document.createElement('div');
      line.className = 'arena-log-line';
      line.innerHTML = `${ev.actorEmoji} ${ev.actor} ${ev.skillIcon||'⚔️'} ${ev.skill} → ${ev.target} ${ev.dmg > 0 ? `<span style="color:#e74c3c">-${ev.dmg}</span>` : ''}`;
      logBar.appendChild(line);
      logBar.scrollTop = logBar.scrollHeight;

      setTimeout(playNext, TICK_MS);
    } else if (ev.type === 'kill') {
      const targetId = getTargetId(ev);
      if (targetId !== null && hpState[targetId]) {
        hpState[targetId].alive = false;
        hpState[targetId].cur = 0;
        updateHpUI(targetId);
      }
      actionText.innerHTML = `💀 <b>${ev.target}</b> 被击败！`;
      const line = document.createElement('div');
      line.className = 'arena-log-line';
      line.style.color = '#f1c40f';
      line.textContent = `💀 ${ev.target} 被 ${ev.actor} 击败！`;
      logBar.appendChild(line);
      logBar.scrollTop = logBar.scrollHeight;
      setTimeout(playNext, TICK_MS);
    } else if (ev.type === 'death') {
      const actorId = getActorId(ev);
      if (actorId !== null && hpState[actorId]) {
        hpState[actorId].alive = false;
        hpState[actorId].cur = 0;
        updateHpUI(actorId);
      }
      actionText.innerHTML = `☠️ ${ev.actorEmoji} <b>${ev.actor}</b> 阵亡！(寿命-1)`;
      const line = document.createElement('div');
      line.className = 'arena-log-line';
      line.style.color = '#e74c3c';
      line.textContent = `☠️ ${ev.actor} 阵亡！`;
      logBar.appendChild(line);
      logBar.scrollTop = logBar.scrollHeight;
      setTimeout(playNext, TICK_MS);
    } else {
      setTimeout(playNext, 200);
    }
  }

  // 开场延迟后开始播放
  setTimeout(playNext, 800);
}

// ========== 广告系统 ==========
function addFreeResources() {
  const overlay = document.getElementById('ad-overlay');
  const timer = document.getElementById('ad-timer');
  const reward = document.getElementById('ad-reward');
  const btn = document.getElementById('btn-ad-close');
  overlay.classList.remove('hidden');
  reward.style.display = 'none';
  btn.style.display = 'none';
  let remaining = 3;
  timer.textContent = remaining;

  const t = setInterval(() => {
    remaining--;
    timer.textContent = remaining;
    if (remaining <= 0) {
      clearInterval(t);
      timer.textContent = '✅';
      GameState.fruit += 3;
      GameState.evoStone += 2;
      GameState.pokeball = Math.min(GameState.pokeball + 2, CONFIG.POKEBALL_MAX);
      reward.style.display = 'block';
      btn.style.display = 'inline-block';
      updateFooter();
      saveGame(); // 自动存档
    }
  }, 1000);
}

function closeAdOverlay() {
  document.getElementById('ad-overlay').classList.add('hidden');
}

// ========== 底部状态栏 ==========
function updateFooter() {
  document.getElementById('fruit-count').textContent = GameState.fruit;
  document.getElementById('evo-stone-count').textContent = GameState.evoStone;
  document.getElementById('pokeball-count').textContent = GameState.pokeball;
  const regenFooter = document.getElementById('pokeball-regen-footer');
  if (GameState.pokeball < CONFIG.POKEBALL_MAX) {
    regenFooter.textContent = `(${getPokeballRegenTime()})`;
  } else {
    regenFooter.textContent = '';
  }
  // 抓捕页也更新
  const pcCap = document.getElementById('pokeball-count-cap');
  if (pcCap) pcCap.textContent = GameState.pokeball;
  const ptTimer = document.getElementById('pokeball-timer');
  if (ptTimer) ptTimer.textContent = getPokeballRegenTime();
  // 统计
  const stats = document.getElementById('gen-stats');
  if (GameState.pets.length > 0) {
    const maxGen = GameState.pets.reduce((max, p) => Math.max(max, p.generation), 0);
    const shinies = GameState.pets.filter(p => p.isShiny).length;
    const variants = GameState.pets.filter(p => p.isVariant).length;
    stats.textContent = `G${maxGen} | ✨${shinies} | 🎨${variants} | 总${GameState.pets.length}`;
  } else {
    stats.textContent = '';
  }
}

function refreshAll() {
  refreshInventory();
  refreshBreedPage();
  refreshEvolvePage();
  updateFooter();
}

// ========== 图鉴系统 ==========
function showEncyclopedia() {
  const modal = document.getElementById('encyclopedia-modal');
  const content = document.getElementById('encyclopedia-content');
  modal.classList.remove('hidden');
  content.innerHTML = '';

  SPECIES.forEach(sp => {
    const tmpl = TYPE_TEMPLATE[sp.type];
    const owned = GameState.pets.filter(p => p.speciesId === sp.id);
    const ownedCount = owned.length;

    // 找到这个种类在哪些场景
    const scenes = CAPTURE_SCENES.filter(s => s.speciesIds.includes(sp.id));
    const sceneNames = scenes.map(s => s.emoji + ' ' + s.name).join(', ');

    const card = document.createElement('div');
    card.className = 'ency-card';
    card.innerHTML = `
      <div class="ency-card-header">
        <span class="ency-emoji">${sp.emoji}</span>
        <div class="ency-info">
          <div class="ency-name">${sp.name}</div>
          <div class="ency-type">${tmpl.icon} ${tmpl.name} | 进化上限: ${sp.maxEvo}段</div>
        </div>
      </div>
      <div class="ency-stats">
        基础ATK: ${tmpl.atk} | DEF: ${tmpl.def} | HP: ${tmpl.hp}
      </div>
      <div class="ency-skills">
        <span style="color:#8899aa">技能池 (${sp.skills.length}):</span>
        ${renderSkillIcons(sp.skills, false)}
        ${sp.evoSkill ? `<div class="ency-evo">⚡ 进化技: ${sp.evoSkill}</div>` : '<div style="color:#555;font-size:10px;margin-top:4px">无进化技能</div>'}
      </div>
      <div class="ency-scenes">🗺️ 出没场景: ${sceneNames || '未知'}</div>
      <div class="ency-owned ${ownedCount > 0 ? 'ency-owned-yes' : 'ency-owned-no'}">
        ${ownedCount > 0 ? `✅ 已拥有 ${ownedCount} 只` : '❌ 未拥有'}
      </div>
    `;
    content.appendChild(card);
  });
}

function closeEncyclopedia() {
  document.getElementById('encyclopedia-modal').classList.add('hidden');
}

// ========== 精灵球UI定时器 ==========
function startPokeballUITimer() {
  pokeballUITimer = setInterval(() => {
    updateFooter();
  }, 5000);
}

// ========== 初始化 ==========
window.addEventListener('DOMContentLoaded', () => {
  // 尝试加载存档
  const loaded = loadGame();
  if (loaded) {
    showSaveToast('📂 存档已加载！');
  }

  initCapturePage();
  startPokeballRegen();
  startPokeballUITimer();
  startAutoSave();
  updateFooter();
  refreshInventory();
});

// ========== 存档提示 ==========
function showSaveToast(msg) {
  const toast = document.createElement('div');
  toast.className = 'save-toast';
  toast.textContent = msg;
  document.body.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('show'));
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 2000);
}

// ========== 手动存档 ==========
function manualSave() {
  if (saveGame()) {
    showSaveToast('💾 存档成功！');
  } else {
    showSaveToast('❌ 存档失败！');
  }
}

// ========== 重置存档 ==========
function resetGameConfirm() {
  if (confirm('⚠️ 确定要删除存档并重新开始吗？\n此操作不可撤销！')) {
    deleteSave();
    location.reload();
  }
}

// ========== ★ 放生系统 ==========
let pendingReleaseIds = [];   // 待放生的宠物ID列表
let batchSelectedIds = new Set();  // 批量放生选中的ID

// -- 单个放生（从详情面板） --
function releaseSinglePet(petId) {
  const pet = GameState.pets.find(p => p.id === petId);
  if (!pet) return;
  const q = QUALITY[pet.quality];
  pendingReleaseIds = [petId];
  document.getElementById('release-confirm-msg').innerHTML =
    `确定要放生 <strong style="color:${q.color}">${pet.species.emoji} ${pet.name}</strong> 吗？<br><span style="font-size:12px;color:#e74c3c">放生后将无法恢复！</span>`;
  document.getElementById('release-confirm-overlay').classList.remove('hidden');
}

// -- 批量放生弹窗 --
function openBatchRelease() {
  if (GameState.pets.length === 0) {
    alert('没有伙伴可以放生');
    return;
  }
  batchSelectedIds.clear();
  document.getElementById('batch-select-all').checked = false;
  document.getElementById('batch-filter-quality').value = 'all';
  document.getElementById('batch-release-modal').classList.remove('hidden');
  refreshBatchList();
}

function closeBatchRelease() {
  document.getElementById('batch-release-modal').classList.add('hidden');
}

function refreshBatchList() {
  const grid = document.getElementById('batch-release-list');
  const fq = document.getElementById('batch-filter-quality').value;
  grid.innerHTML = '';

  let pets = [...GameState.pets];
  if (fq !== 'all') pets = pets.filter(p => p.quality === parseInt(fq));

  if (pets.length === 0) {
    grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;color:#8899aa;padding:30px">没有符合条件的伙伴</div>';
    updateBatchCount();
    return;
  }

  // 去掉不在当前筛选列表中的选中项
  const visibleIds = new Set(pets.map(p => p.id));
  // 保留已选但不在视图中的（不自动取消）

  pets.forEach(pet => {
    const q = QUALITY[pet.quality];
    const isChecked = batchSelectedIds.has(pet.id);
    const item = document.createElement('div');
    item.className = `batch-pet-item ${isChecked ? 'selected' : ''}`;
    item.innerHTML = `
      <input type="checkbox" class="bp-check" data-pet-id="${pet.id}" ${isChecked ? 'checked' : ''}>
      <span class="bp-emoji">${pet.species.emoji}</span>
      <div class="bp-info">
        <div class="bp-name" style="color:${pet.isVariant ? '#e67e22' : q.color}">${pet.name} <span style="color:#8899aa;font-weight:normal">Lv.${pet.level}</span></div>
        <div class="bp-detail">${q.name} | G${pet.generation} | 资质${getPotentialPercent(pet)}%${pet.isShiny ? ' <span class="tag tag-shiny" style="font-size:10px;padding:1px 4px">✨闪光</span>' : ''}${pet.isVariant ? ' <span class="tag tag-variant" style="font-size:10px;padding:1px 4px">🎨异色</span>' : ''}</div>
      </div>
    `;

    // 点击整行切换选中
    item.addEventListener('click', (e) => {
      if (e.target.classList.contains('bp-check')) return; // checkbox自己处理
      const cb = item.querySelector('.bp-check');
      cb.checked = !cb.checked;
      toggleBatchItem(pet.id, cb.checked, item);
    });

    // checkbox变化
    item.querySelector('.bp-check').addEventListener('change', (e) => {
      toggleBatchItem(pet.id, e.target.checked, item);
    });

    grid.appendChild(item);
  });

  updateBatchCount();
}

function toggleBatchItem(petId, checked, itemEl) {
  if (checked) {
    batchSelectedIds.add(petId);
    itemEl.classList.add('selected');
  } else {
    batchSelectedIds.delete(petId);
    itemEl.classList.remove('selected');
  }
  updateBatchCount();
  // 更新全选checkbox状态
  const allChecks = document.querySelectorAll('#batch-release-list .bp-check');
  const allChecked = Array.from(allChecks).every(c => c.checked);
  document.getElementById('batch-select-all').checked = allChecked && allChecks.length > 0;
}

function batchToggleAll() {
  const selectAll = document.getElementById('batch-select-all').checked;
  const allItems = document.querySelectorAll('#batch-release-list .batch-pet-item');
  allItems.forEach(item => {
    const cb = item.querySelector('.bp-check');
    const petId = parseInt(cb.dataset.petId);
    cb.checked = selectAll;
    if (selectAll) {
      batchSelectedIds.add(petId);
      item.classList.add('selected');
    } else {
      batchSelectedIds.delete(petId);
      item.classList.remove('selected');
    }
  });
  updateBatchCount();
}

function updateBatchCount() {
  document.getElementById('batch-selected-count').textContent = `已选: ${batchSelectedIds.size}`;
}

function confirmBatchRelease() {
  if (batchSelectedIds.size === 0) {
    alert('请先选择要放生的伙伴');
    return;
  }
  pendingReleaseIds = [...batchSelectedIds];
  const names = pendingReleaseIds.map(id => {
    const p = GameState.pets.find(pp => pp.id === id);
    return p ? `${p.species.emoji}${p.name}` : '';
  }).filter(Boolean);

  let msg = `确定要放生以下 <strong style="color:#e74c3c">${names.length}</strong> 只伙伴吗？<br>`;
  if (names.length <= 6) {
    msg += `<div style="margin:8px 0;font-size:13px;color:#f1c40f">${names.join('、')}</div>`;
  } else {
    msg += `<div style="margin:8px 0;font-size:13px;color:#f1c40f">${names.slice(0, 5).join('、')} 等${names.length}只</div>`;
  }
  msg += '<span style="font-size:12px;color:#e74c3c">放生后将无法恢复！</span>';
  document.getElementById('release-confirm-msg').innerHTML = msg;
  document.getElementById('release-confirm-overlay').classList.remove('hidden');
}

// -- 确认/取消放生 --
function cancelRelease() {
  pendingReleaseIds = [];
  document.getElementById('release-confirm-overlay').classList.add('hidden');
}

function executeRelease() {
  if (pendingReleaseIds.length === 0) return;
  // 执行放生
  const releaseSet = new Set(pendingReleaseIds);
  const count = releaseSet.size;
  GameState.pets = GameState.pets.filter(p => !releaseSet.has(p.id));
  pendingReleaseIds = [];
  batchSelectedIds.clear();

  // 关闭弹窗
  document.getElementById('release-confirm-overlay').classList.add('hidden');
  document.getElementById('batch-release-modal').classList.add('hidden');

  // 清除详情面板（如果放生了正在查看的伙伴）
  if (selectedDetailPet && releaseSet.has(selectedDetailPet.id)) {
    selectedDetailPet = null;
    document.getElementById('inv-detail-empty').classList.remove('hidden');
    document.getElementById('inv-detail-content').classList.add('hidden');
  }

  // 刷新界面
  refreshInventory();
  saveGame();
  showSaveToast(`🗑️ 已放生 ${count} 只伙伴`);
}
