/* Module registry: a future topic supplies screens, localized knowledge and
   review titles; shared navigation and quiz state live in training.js. */
(() => {
  const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const numberSafe = value => escape(value).replace(/\b\d+(?:\/\d+)?\b/g, n => `<bdi dir="ltr">${n}</bdi>`);
  const screenSpecs = window.translations.en.packing.specs.map(([id],i)=>[id,i]);
  const practiceAnswers = new Map();
  let mistakeIndex = 0;
  let selectedMaterial = 0;
  let copy;
  let lang = 'en';
  const root = document.createElement('div');
  root.id = 'packingScreens';
  const screens = screenSpecs.map(([id, topic]) => {
    const section = document.createElement('section');
    section.id = `packing-${id}`;
    section.className = `section training-screen packing-screen${['intro','snow','final'].includes(id) ? ' section--blue' : ''}`;
    section.dataset.trainingScreen = '';
    section.dataset.screenLabel = `packing.titles.${topic}`;
    section.dataset.topic = topic;
    root.append(section);
    return section;
  });
  document.querySelector('main').append(root);

  function photo(slot, label) {
    const asset = window.packingAssets[slot];
    if (!asset) return '';
    return `<figure class="packing-photo" data-photo-slot="${slot}"><div class="packing-photo-frame"><img src="${escape(asset.src)}" alt="${escape(asset.alt[lang])}" decoding="async"></div>${label?`<figcaption>${escape(label)}</figcaption>`:''}</figure>`;
  }
  const note = (text, type = '') => `<div class="packing-note ${type}">${numberSafe(text)}</div>`;
  const list = items => `<ul class="packing-list">${items.map(text => `<li><i aria-hidden="true" dir="ltr">✓</i><span>${numberSafe(text)}</span></li>`).join('')}</ul>`;
  const icon = name => `<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${{
    app:'<rect x="8" y="3" width="16" height="26" rx="3"/><path d="M12 9h8M12 14h8M14 24h4"/>',
    separate:'<rect x="3" y="9" width="10" height="15" rx="2"/><rect x="19" y="9" width="10" height="15" rx="2"/><path d="M16 5v23"/>',
    protect:'<path d="m16 3 11 5v8c0 6-6 10-11 13C11 26 5 22 5 16V8Z"/><path d="m11 16 4 4 7-8"/>',
    cart:'<path d="M3 3h4l3 22h16M8 7h20l-2 7H9M10 18h17l-1 7H10"/><circle cx="12" cy="29" r="1.5"/><circle cx="25" cy="29" r="1.5"/>',
    check:'<circle cx="16" cy="16" r="12"/><path d="m9 16 5 5 9-11"/>',
    label:'<path d="M4 5h13l12 12-12 12L4 16Z"/><circle cx="10" cy="11" r="2"/>',
    storage:'<rect x="5" y="3" width="22" height="26" rx="2"/><path d="M5 14h22M10 8v2M10 19v5"/>'
  }[name]}</svg>`;
  function roleCard(kind,title,description,steps){
    return `<article class="packing-role-card packing-role--${kind}"><header><span class="packing-role-icon">${icon(kind==='picker'?'app':'protect')}</span><div><h3>${escape(title)}</h3><p>${escape(description)}</p></div></header><ol>${steps.map((step,i)=>`<li><span class="packing-role-number" aria-hidden="true">${i+1}</span><div><strong>${escape(step.title)}</strong><p>${escape(step.body)}</p></div><span class="packing-step-icon">${icon(step.icon)}</span></li>`).join('')}</ol></article>`;
  }
  function practice(id, q, slot) {
    return `<div class="packing-practice" data-practice="${id}"><p class="step">${escape(copy.ui.practice)}</p><h3>${escape(q.q)}</h3>${slot ? photo(slot, copy.ui.example) : ''}<p class="packing-instruction">${escape(copy.ui.single)}</p><div class="scenario-answers">${q.a.map((a, i) => `<button type="button" data-practice-answer="${i}">${numberSafe(a)}</button>`).join('')}</div><p class="answer-feedback" aria-live="polite"></p></div>`;
  }
  function bindPractice(id, q) {
    const panel = root.querySelector(`[data-practice="${id}"]`);
    const show = index => {
      panel.querySelectorAll('button').forEach((b, i) => {
        b.classList.toggle('correct', i === q.correct);
        b.classList.toggle('incorrect', i === index && index !== q.correct);
        b.disabled = true;
      });
      const feedback = panel.querySelector('.answer-feedback');
      feedback.textContent = q.rule;
      feedback.className = `answer-feedback show ${index === q.correct ? 'correct' : 'incorrect'}`;
    };
    panel.querySelectorAll('[data-practice-answer]').forEach(b => b.addEventListener('click', () => {
      const index = Number(b.dataset.practiceAnswer);
      practiceAnswers.set(id, index);
      show(index);
    }));
    if (practiceAnswers.has(id)) show(practiceAnswers.get(id));
  }
  function renderMistake() {
    const area = root.querySelector('#packingMistakeCard');
    const card = copy.mistakes[mistakeIndex];
    area.innerHTML = `<p class="packing-example-count" dir="ltr">${mistakeIndex + 1} / ${copy.mistakes.length}</p>${practice(`mistake-${mistakeIndex}`, card.question, card.slot)}<div class="packing-example-nav"><button type="button" class="missed-rule-link" data-example-prev ${mistakeIndex === 0 ? 'disabled' : ''}>${escape(copy.ui.previous)}</button><button type="button" class="missed-rule-link" data-example-next ${mistakeIndex === copy.mistakes.length - 1 ? 'disabled' : ''}>${escape(copy.ui.next)}</button></div>`;
    bindPractice(`mistake-${mistakeIndex}`, card.question);
    area.querySelector('[data-example-prev]').onclick = () => { mistakeIndex--; renderMistake(); };
    area.querySelector('[data-example-next]').onclick = () => { mistakeIndex++; renderMistake(); };
  }
  function render(language) {
    lang = language;
    copy = window.translations[lang].packing;
    const c = copy.content, u = copy.ui, r = copy.rules;
    const bodies = {
      intro: `<p class="lead">${escape(c.intro)}</p>${list(c.goals)}`,
      roles: `<div class="packing-role-flow">${[[r.picker,'app'],[r.roleTrolley,'cart'],[r.packer,'protect'],[r.roleCompleted,'check'],[r.roleStorage,'storage']].map(([label,key],i)=>`${i?'<span class="role-flow-arrow" aria-hidden="true">→</span>':''}<span class="role-flow-stop">${icon(key)}<b>${escape(label)}</b></span>`).join('')}</div><div class="packing-role-cards">${roleCard('picker',r.picker,r.pickerShort,r.pickerSteps)}${roleCard('packer',r.packer,r.packerShort,r.packerSteps)}</div><p class="packing-role-placement">${escape(r.rolePlacement)}</p>${note(r.roleStorageRule,'packing-emphasis')}<button type="button" class="missed-rule-link" id="packingStorageLink">${escape(r.storageLink)}</button>`,
      separate: `<div class="packing-compatibility">${[[true,'🥫 + 🥫',r.compatible,r.compatibleWhy],[false,'🥩 + 🥪',r.rawPair,r.rawWhy],[false,'🧴 + 🥪',r.chemicalPair,r.chemicalWhy],[false,'📦 ↓ 🍞',r.damagePair,r.damageWhy]].map(([safe,icons,title,why])=>`<article class="compatibility-card ${safe?'compatible':'separate'}"><strong class="compatibility-status">${safe?'✓':'✕'} ${escape(safe?r.togetherTitle:r.separateTitle)}</strong><div class="compatibility-products" aria-hidden="true" dir="ltr">${icons}</div><h3>${escape(title)}</h3><p>${escape(why)}</p></article>`).join('')}</div>${note(r.separationNote,'packing-emphasis')}<details class="packing-category-details"><summary>${escape(u.categoryDetails)}</summary><p>${escape(r.categoryNote)}</p><div class="packing-category-grid">${['Raw Food','Ready-to-Eat (RTE)','Near Food','Non Food'].map((name,i)=>`<article class="packing-note"><h3 dir="ltr">${name}</h3><p>${escape(c.categories[i])}</p></article>`).join('')}</div></details>`,
      materials: `${photo('overview')}<p>${escape(u.materialHelp)}</p><div class="packing-materials">${copy.materialCards.map((m,i)=>`<button type="button" class="missed-rule-link" data-material="${i}" aria-pressed="${selectedMaterial===i}">${escape(m.name)}</button>`).join('')}</div><div id="packingMaterialDetail" aria-live="polite"></div>`,
      white: `${photo('white',copy.materialCards[0].name)}${list(r.whiteUses)}`,
      build: `<div class="packing-bag-diagram" role="img" aria-label="${escape(c.diagramNote)}"><div><strong>${escape(c.top)}</strong><p>${escape(c.topBody)}</p></div><div><strong>${escape(c.middle)}</strong><p>${escape(c.middleBody)}</p></div><div><strong>${escape(c.bottom)}</strong></div></div><p class="muted">${escape(c.diagramNote)}</p>`,
      trolley: `${photo('trolley',window.packingAssets.trolley.alt[lang])}${note(r.picking,'packing-emphasis')}<p>${escape(r.trolley)}</p>`,
      frozen: `${photo('ice',window.packingAssets.ice.alt[lang])}${note(r.ice)}${note(r.frozen,'packing-emphasis')}<p>${escape(r.chilled)}</p>`,
      fish: `${photo('blue',copy.materialCards[1].name)}<h3>${escape(u.fits)}</h3>${note(r.blue,'packing-emphasis')}<h3>${escape(u.tooLarge)}</h3>${note(r.oversized)}`,
      produce: `${photo('green',copy.materialCards[2].name)}${note(r.green,'packing-emphasis')}`,
      cleaning: `<p>${escape(r.small)}</p>${photo('cleaner',u.example)}${note(r.optionA,'packing-emphasis')}${note(r.optionB)}`,
      forgotten: `<div class="packing-trolley-diagram" role="img" aria-label="${escape(r.forgotten)}"><div><span>${escape(r.upper)}</span><b aria-hidden="true">▧ ▧ · ·</b></div><div><span>${escape(r.lower)}</span><b aria-hidden="true">▯</b></div></div>${note(r.forgotten,'packing-emphasis')}<p>${escape(r.consequence)}</p>`,
      double: `<p class="lead">${escape(c.doubleDefinition)}</p><div class="packing-double-diagram" aria-hidden="true"><div><div>Wolt</div></div></div><p>${escape(c.doubleWhen)}</p>${note(c.extra,'packing-emphasis')}${note(c.doubleLimit,'packing-warning')}`,
      snow: `<div class="packing-snow-bag" aria-hidden="true">❄</div><p class="lead">${escape(c.snowRule)}</p><h3>${escape(c.snowQuestion)}</h3><div class="packing-choice">${note(c.snowYes, 'packing-emphasis')}${note(c.snowNo)}</div><p class="muted">${escape(c.snowMeaning)}</p>`,
      label: `${list(c.labels)}<div class="packing-bag-numbers" dir="ltr"><b>1/3</b><b>2/3</b><b>3/3</b></div>`,
      large: `<div class="packing-large-diagram" aria-hidden="true"><span>Wolt<br>▥ ▥ ▥</span><span>Wolt<br>▣</span></div>${note(r.large,'packing-emphasis')}`,
      placement: `${note(r.placement,'packing-emphasis')}<div class="packing-storage-scenarios">${[[r.noCold,r.allShelf,false],[r.oneCold,r.allFridge,true]].map(([label,destination,cold])=>`<article class="packing-storage-case"><h3>${escape(label)}</h3><div class="packing-storage-bags" aria-hidden="true" dir="ltr"><b>1/3</b><b>2/3</b><b>${cold?'❄<br>':''}3/3</b></div><div class="packing-storage-arrow" aria-hidden="true">↓</div><strong class="packing-storage-destination">${escape(destination)}</strong></article>`).join('')}</div>`,
      storage: `${note(r.storageTiming,'packing-emphasis')}${note(r.organization)}`,
      handoff: `<div class="packing-handoff-flow" aria-hidden="true">📦 <span>→</span> 🛒 <span>→</span> 📍</div><p>${escape(r.handoff)}</p>${note(r.handoffStorage,'packing-emphasis')}<aside class="packing-team-tip"><span class="packing-tip-label">${escape(r.optional)}</span><h3>${escape(r.teamTitle)}</h3><p>${escape(r.teamTip)}</p></aside>`,
      mistakes: `<div id="packingMistakeCard"></div>`,
      final: `${note(r.final,'packing-emphasis')}${list(c.recap)}<button type="button" class="next-question show" id="packingStartQuiz">${escape(u.readyTest)}</button>`
    };
    screens.forEach((screen, i) => {
      const [id, topic] = screenSpecs[i];
      const title = copy.titles[topic];
      screen.innerHTML = `<div class="wrap"><p class="step"><bdi dir="ltr">${String(topic + 1).padStart(2, '0')} / ${screens.length}</bdi> · ${escape(u.packing)}</p><h2 tabindex="-1">${escape(title)}</h2>${id==='build'?note(r.eggs):''}${bodies[id]}</div>`;
    });
    renderMistake();
    function materialDetail(index) {
      const m = copy.materialCards[index];
      root.querySelector('#packingMaterialDetail').innerHTML = note(m.rule);
      root.querySelectorAll('[data-material]').forEach(b => b.setAttribute('aria-pressed', String(Number(b.dataset.material) === index)));
    }
    root.querySelectorAll('[data-material]').forEach(b => b.onclick = () => { selectedMaterial = Number(b.dataset.material); materialDetail(selectedMaterial); });
    materialDetail(selectedMaterial);
    root.querySelector('#packingStartQuiz').onclick = () => window.trainingApp.showQuiz();
    root.querySelector('#packingStorageLink').onclick = () => window.trainingApp.showLesson('packing-placement');
  }

  window.packingModule = {
    id: 'packing', screens, render,
    title: language => window.translations[language].packing.ui.packing,
    description: language => window.translations[language].packing.ui.description,
    knowledge: language => {
      const p = window.translations[language].packing;
      return { ...window.translations[language].knowledge, title: p.ui.test, intro: p.ui.testIntro,
        ready: p.ui.ready, almost: p.ui.almost, reviewGuide: p.ui.reviewGuide, perfect:p.ui.perfect, questions: p.questions };
    },
    reviewTitle: (id, language) => {
      const p = window.translations[language].packing;
      return p.titles[screenSpecs.find(([key]) => `packing-${key}` === id)[1]];
    },
    visual: (type, language) => {
      const p = window.translations[language].packing;
      const asset=window.packingAssets[type];
      if(asset) return `<figure class="packing-photo"><img src="${escape(asset.src)}" alt="${escape(asset.alt[language])}"></figure>`;
      if (type === 'label') return `<div class="packing-label-example" dir="ltr"><b>726</b><span>Shabbat Shalom</span></div>`;
      if (type === 'crushing') return `<div class="packing-crush-example"><strong>${escape(p.content.heavyVisual)}</strong><span aria-hidden="true">↓</span><span>${escape(p.content.breadVisual)}</span></div>`;
      return '';
    }
  };
})();
