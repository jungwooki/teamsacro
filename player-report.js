/* Player-level MPS Report and bio-banding IDP views. */
state.playerView = 'report';
const openPlayerBase = openPlayer;
openPlayer = function (code, jumpToIdp) {
  state.playerView = jumpToIdp ? 'idp' : 'report';
  openPlayerBase(code, jumpToIdp);
};

function playerMenu() {
  return `<div class="player-result-navigation"><div class="player-result-title"><h2>분석 리포트와 성장플랜</h2></div><nav class="player-menu" aria-label="선수 상세 메뉴">
    <button type="button" data-player-view="report" class="${state.playerView === 'report' ? 'active' : ''}" aria-current="${state.playerView === 'report' ? 'page' : 'false'}"><span>MPS Report<small>측정 지표와 분석</small></span><span class="player-menu-arrow" aria-hidden="true">→</span></button>
    <button type="button" data-player-view="idp" class="${state.playerView === 'idp' ? 'active' : ''}" aria-current="${state.playerView === 'idp' ? 'page' : 'false'}"><span>바이오밴딩 IDP<small>훈련 목표와 실행 기록</small></span><span class="player-menu-arrow" aria-hidden="true">→</span></button>
  </nav></div>`;
}

const STAGE_BODY_WATCH = {
  준비기: ['균형·운동조절', '기술·협응'],
  가속기: ['착지·감속', '방향전환', '훈련량·회복'],
  최고성장기: ['균형·협응', '착지·감속', '훈련량·회복'],
  감속기: ['좌우 균형', '방향전환', '몸통 안정'],
  완성기: ['속도·파워 부하', '훈련량 관리', '회복'],
};

function playerQuickNotes(p) {
  const memo = record(p).coachMemo || '';
  const tags = STAGE_BODY_WATCH[stage(p)] || [];
  return `<section class="player-quick-grid" aria-label="지도자 메모와 성장단계 확인 항목">
    <div class="panel coach-quick-note"><div><span class="eyebrow">COACH NOTE</span><h3>지도자 메모</h3><p>오늘 본 모습이나 다음 훈련에서 확인할 점을 짧게 남기세요.</p></div><textarea id="coach-quick-memo" rows="2" maxlength="1000" placeholder="예: 후반전 방향전환 시 움직임 관찰">${esc(memo)}</textarea><div class="coach-note-actions"><small>이 브라우저에만 저장됩니다.</small><button type="button" class="button" data-save-coach-memo>메모 저장 →</button><span id="coach-note-status" role="status"></span></div></div>
    <div class="panel stage-watch-card"><span class="eyebrow">STAGE WATCH</span><h3>${stageLabel(p)} · 신체 확인 영역</h3><p>이 선수의 성장단계상 취약점</p><div class="stage-watch-tags">${tags.map(tag => `<span>${esc(tag)}</span>`).join('')}</div><small>성장 중 몸이 적응하느라 흔들릴 수 있는 영역이에요. 문제가 아니라 성장 과정이며, 훈련에서 함께 챙겨주면 좋습니다.</small></div>
  </section>`;
}

function ageText(months) {
  const rounded = Math.round(months);
  return `${Math.floor(rounded / 12)}년 ${rounded % 12}개월`;
}

function reportProfile(p) {
  const chronological = chronologicalMonths(p);
  const bone = boneMonths(p);
  const max = Math.max(chronological, bone, 12 * 15);
  const row = (label, value, color) => `<div class="age-row"><span>${label}</span><div class="age-track"><i class="${color}" style="width:${Math.min(100, value / max * 100)}%"></i></div><b>${ageText(value)}</b></div>`;
  return `<section class="panel report-growth"><div class="report-section-heading"><div><span class="eyebrow">GROWTH PROFILE</span><h2>성장 프로필</h2></div><span class="report-stage">${stageLabel(p)}</span></div>
    <div class="growth-stats"><div><small>현재 키</small><strong>${one(p.height)}<em>cm</em></strong></div><div><small>몸무게</small><strong>${one(p.weight)}<em>kg</em></strong></div><div><small>체지방률</small><strong>${one(p.bodyFat)}<em>%</em></strong></div><div><small>예상키 범위</small><strong>${range(p)}</strong></div></div>
    <div class="growth-visual">${row('역연령', chronological, 'chrono')}${row('골연령', bone, 'bone')}</div>
    <p class="report-caption">골연령은 역연령 대비 ${signed(Math.round(maturityDifference(p)), 0)}개월 · ${esc(p.phv)}. 예상키는 범위로만 표시하며 확정 키가 아닙니다.</p></section>`;
}

function reportPhysicalCard(label, value, unit, mean, max, digits, note) {
  const v = Number(value);
  return `<article class="panel physical-card"><small>${label}</small><strong>${Number.isFinite(v) ? v.toFixed(digits) : '—'}<em>${unit}</em></strong>${barCompare(value, mean, max, digits, unit)}<p>${note}</p></article>`;
}

function reportPhysical(p) {
  const ref = stageRef(p).physical;
  const l = livePlayer(p);
  const cards = [
    reportPhysicalCard('경기투입양호도', l.availability, '점', null, 100, 1, '기존 팀 대시보드의 측정 당시 참고 점수'),
    reportPhysicalCard('회복 관찰 · SDNN', p.sdnn, 'ms', ref.sdnn, Math.max(150, (ref.sdnn || 0) * 2), 1, '같은 성장단계 평균과 비교한 HRV 측정값'),
    reportPhysicalCard('회복 관찰 · RMSSD', p.rmssd, 'ms', ref.rmssd, Math.max(150, (ref.rmssd || 0) * 2), 1, '같은 성장단계 평균과 비교한 HRV 측정값'),
    reportPhysicalCard('ECW/TBW', p.ecw, '', ref.ecw, 0.43, 3, '측정 당시 체수분 관련 지표'),
  ];
  const sites = [
    ['아킬레스건', p.achillesLeft, p.achillesRight],
    ['슬개건', p.patellarLeft, p.patellarRight],
    ['족저근막', p.plantarLeft, p.plantarRight],
  ];
  const status = value => `<b class="site-status ${value === '위험' ? 'danger' : value === '주의' ? 'caution' : 'good'}">${esc(value || '자료 없음')}</b>`;
  return `<section class="report-block"><div class="report-section-heading"><div><span class="eyebrow">PHYSICAL CONDITION</span><h2>피지컬 컨디션과 몸 상태</h2><p>측정 당시 수치와 같은 성장단계 선수 평균을 함께 봅니다.</p></div></div>
    <div class="physical-card-grid">${cards.join('')}</div>
    <div class="site-card-grid">${sites.map(([name, left, right]) => `<article class="panel site-card"><h3>${name}</h3><div><span>왼쪽 ${status(left)}</span><span>오른쪽 ${status(right)}</span></div></article>`).join('')}</div>
    <p class="report-caption">초음파는 측정 부위의 당시 소견입니다. 과거 부상 전체를 확인하지 않습니다. HRV의 높낮이만으로 회복 상태를 확정하지 않습니다.</p></section>`;
}

function radarChart(p) {
  const ref = stageRef(p).mental;
  const cx = 210, cy = 178, radius = 112;
  const point = (index, value) => {
    const angle = -Math.PI / 2 + index * Math.PI * 2 / 5;
    const r = radius * Math.max(0, Math.min(6, Number(value) || 0)) / 6;
    return [cx + Math.cos(angle) * r, cy + Math.sin(angle) * r];
  };
  const polygon = values => values.map((value, index) => point(index, value).map(v => v.toFixed(1)).join(',')).join(' ');
  const rings = [1.5, 3, 4.5, 6].map(value => `<polygon class="radar-ring" points="${polygon(Array(5).fill(value))}"></polygon>`).join('');
  const axes = MENTAL_CORE.map(([, label], index) => {
    const [x, y] = point(index, 6);
    const labelX = cx + (x - cx) * 1.27;
    const labelY = cy + (y - cy) * 1.25;
    return `<line class="radar-axis" x1="${cx}" y1="${cy}" x2="${x}" y2="${y}"></line><text x="${labelX}" y="${labelY}" text-anchor="middle">${esc(label)}</text>`;
  }).join('');
  return `<svg class="mental-radar" viewBox="0 0 420 356" role="img" aria-label="${esc(p.name)} 선수의 멘탈 5대 요소와 같은 성장단계 평균 비교">${rings}${axes}<polygon class="radar-reference" points="${polygon(MENTAL_CORE.map(([key]) => ref[key]))}"></polygon><polygon class="radar-current" points="${polygon(MENTAL_CORE.map(([key]) => p[key]))}"></polygon></svg>`;
}

function reportMental(p) {
  const ref = stageRef(p);
  const cards = MENTAL_CORE.map(([key, label, meaning]) => {
    const value = Number(p[key]);
    return `<button type="button" class="mental-core-card" data-mental-detail="${key}"><span><b>${esc(label)}</b><strong>${one(value)} <small>/ 6</small></strong></span><p>${esc(meaning)}</p>${barCompare(value, ref.mental[key], 6, 1, '점')}<em>지표 설명 보기 →</em></button>`;
  }).join('');
  return `<section class="report-block"><div class="report-section-heading"><div><span class="eyebrow">MENTAL PERFORMANCE</span><h2>멘탈 퍼포먼스</h2><p>5대 요소의 분포를 보고, 세부 지표에서 같은 성장단계 평균과 비교합니다.</p></div><span class="report-legend"><i></i> 선수 <i></i> 같은 성장단계 평균</span></div>
    <div class="mental-visual-grid"><div class="panel radar-card">${radarChart(p)}<p>${statSource('mental', p)}</p></div><div class="mental-core-grid">${cards}</div></div>
    <details class="panel mental-detail-list"><summary>멘탈 세부 지표 13개 모두 보기</summary><div>${scoreBars(p)}</div></details>
    <p class="report-caption">MGI ${one(p.mgi)}점. MGI가 높다는 사실만으로 멘탈이 좋다고 판단하지 않습니다. 5.5점 이상은 과잉자의식 가능성을 함께 확인하며 판단을 유보합니다. 자기보고 점수와 경기장 행동을 함께 살펴보세요.</p></section>`;
}

function reportObservation(p) {
  const index = STAGE_NUMBER[stage(p)];
  const areas = [
    ['기술·협응', [5, 4, 3, 3, 3]],
    ['균형·운동조절', [4, 5, 5, 4, 3]],
    ['유연성·가동성', [4, 4, 5, 3, 3]],
    ['스피드', [3, 4, 3, 4, 5]],
    ['민첩성·방향전환', [3, 4, 3, 4, 4]],
    ['근력', [2, 3, 3, 5, 5]],
    ['파워·순발력', [2, 3, 3, 5, 5]],
    ['회복·조직 스트레스', [3, 4, 5, 4, 3]],
  ].filter(([, weights]) => weights[index] >= 4);
  return `<section class="panel observation-panel"><div class="report-section-heading"><div><span class="eyebrow">STAGE GUIDE</span><h2>이 단계에서 관찰할 영역</h2><p>${stageLabel(p)} 지도 시 우선 살펴볼 항목입니다.</p></div></div><div class="observation-grid">${areas.map(([name, weights]) => `<div class="observation-item"><span>${name}</span><strong>관찰 비중 ${weights[index]}/5</strong><div><i style="width:${weights[index] * 20}%"></i></div></div>`).join('')}</div><p class="report-caption">성장단계별 관찰 비중이며 개인의 강점·약점 판정이 아닙니다. 실제 강점·약점은 피지컬 수행검사 자료가 들어오면 표시합니다.</p></section>`;
}

function reportDoctor(p) {
  return `<footer class="panel doctor-signoff"><span>REPORT REVIEW</span><strong>선수담당팀닥터 한의사 ${esc(p.doctor)}</strong><b>${esc(p.center)}</b></footer>`;
}

playerPage = function (code) {
  const p = TEAM_PLAYERS.find(item => item.code === code);
  if (!p) return '<p>선수를 찾을 수 없습니다.</p>';
  const heading = `<header class="player-report-head"><button type="button" class="back" data-back>← 선수단으로 돌아가기</button><div><span class="eyebrow">PLAYER REPORT · ${esc(p.code)}</span><h1>${esc(p.name)}</h1><p>${esc(p.birth.slice(0, 4))}년생 · 측정 ${esc(p.tested)}</p><div class="player-tags"><span>${stageLabel(p)}</span><span>${esc(p.phv)}</span><span>골연령 ${boneText(p)}</span><span class="maturity-delta">역연령 대비 ${signed(Math.round(maturityDifference(p)), 0)}개월</span></div></div></header>${playerMenu()}`;
  if (state.playerView === 'idp') {
    return heading + playerQuickNotes(p) + `<section class="idp-intro"><span class="eyebrow">MPS BIO-BANDING</span><h2>바이오밴딩 IDP</h2><p>검사 결과와 현장 관찰을 연결해 이 선수의 성장 목표를 정합니다.</p></section>` + idpPanel(p) + fieldPanel(p);
  }
  return heading + playerQuickNotes(p) + `<div id="mps-report" class="mps-report">${reportProfile(p)}${reportPhysical(p)}${reportMental(p)}${reportObservation(p)}${reportDoctor(p)}</div>`;
};

const MENTAL_GUIDANCE = {
  pressure: ['경기 전 긴장을 말로 표현할 수 있는지 물어봅니다.', '압박 상황에서 첫 행동 하나를 선수와 함께 정합니다.'],
  support: ['도움이 필요할 때 누구에게 말할 수 있는지 확인합니다.', '훈련 후 도움이 된 피드백 한 가지를 함께 기록합니다.'],
  preparation: ['경기 전 역할 목표를 두 가지 이내로 정합니다.', '경기 후 준비 루틴 중 도움이 된 행동을 돌아봅니다.'],
  recovery: ['실수 뒤 다음 행동을 짧은 문장으로 정합니다.', '훈련에서 실수 직후 재시도할 기회를 줍니다.'],
  control: ['감정이 흔들린 상황과 회복한 순간을 함께 기록합니다.', '시야·호흡·다음 위치 순서로 다시 집중하는 연습을 합니다.'],
};

function metricDialog(p, key) {
  const metric = MENTAL_CORE.find(([id]) => id === key);
  if (!metric) return;
  const [, label, meaning] = metric;
  const ref = stageRef(p).mental[key];
  const previous = p.previous && Number.isFinite(Number(p.previous[key])) ? Number(p.previous[key]) : null;
  const values = previous === null ? [[p.tested, Number(p[key])]] : [[p.previous.tested, previous], [p.tested, Number(p[key])]];
  const bars = values.map(([date, value], index) => `<div class="history-bar"><div><i style="height:${Math.max(3, value / 6 * 100)}%"></i></div><b>${index + 1}회</b><small>${one(value)}점</small><small>${esc(date)}</small></div>`).join('');
  const dialog = document.querySelector('#player-dialog');
  document.querySelector('#player-detail').innerHTML = `<div class="dialog-head"><div><span class="eyebrow">MENTAL DETAIL</span><h2>${esc(label)}</h2></div><button type="button" class="close" data-close-metric aria-label="닫기">×</button></div><div class="dialog-body"><p>${esc(meaning)}</p><div class="metric-dialog-grid"><section class="panel"><h3>검사별 추이</h3><div class="history-chart">${bars}</div><p class="notice">${previous === null ? '현재 1회 측정. 다음 검사 후 변화가 표시됩니다.' : '검사일별 측정값입니다.'}</p></section><section class="metric-dialog-guide"><div class="panel"><h3>같은 성장단계 비교</h3>${barCompare(p[key], ref, 6, 1, '점')}<p class="notice">${statSource('mental', p)}</p></div><div class="panel"><h3>훈련에서 확인할 질문</h3>${MENTAL_GUIDANCE[key].map(text => `<p>${esc(text)}</p>`).join('')}</div></section></div></div>`;
  dialog.showModal();
}

document.addEventListener('click', event => {
  const saveMemo = event.target.closest('[data-save-coach-memo]');
  if (saveMemo && state.player) {
    const player = TEAM_PLAYERS.find(item => item.code === state.player);
    if (player) {
      setRecord(player, { coachMemo: document.querySelector('#coach-quick-memo').value.trim() });
      document.querySelector('#coach-note-status').textContent = '저장됨';
    }
    return;
  }
  const view = event.target.closest('[data-player-view]');
  if (view && state.player) {
    state.playerView = view.dataset.playerView;
    render();
    window.scrollTo(0, 0);
    return;
  }
  const metric = event.target.closest('[data-mental-detail]');
  if (metric && state.player) {
    const player = TEAM_PLAYERS.find(item => item.code === state.player);
    if (player) metricDialog(player, metric.dataset.mentalDetail);
    return;
  }
  if (event.target.closest('[data-close-metric]')) document.querySelector('#player-dialog').close();
}, { capture: true });
document.querySelector('#player-dialog').addEventListener('click', event => {
  if (event.target.id === 'player-dialog') event.target.close();
});
render();
