document.addEventListener('DOMContentLoaded', () => {
  setupActiveNavigation();
  setupCopyButton();
  setupGalleries();
});

const MEDIA = window.LOCIART_MEDIA || { our: [], pipeline: [], sota: [], e2e: [] };
const VIDEO_ROOT = 'static/videos/';

const labels = {
  'src.mp4': 'Input',
  'source.mp4': 'Source',
  'mask.mp4': 'Mask',
  'clear.mp4': 'Removal',
  'src_sty.mp4': 'Stylized source',
  'clear_sty.mp4': 'Stylized removal',
  'fg_full.mp4': 'Foreground result',
  'bg_full.mp4': 'Background result',
  'result.mp4': 'GRNStyle',
  'ours.mp4': 'GRNStyle',
  'coinve.mp4': 'CoinVE-Edit',
  'seedance.mp4': 'Seedance 2.5',
  'regionroute.mp4': 'RegionRoute',
  'pipeline.mp4': 'Pipeline',
  'e2e_model.mp4': 'GRNStyle'
};

function setupGalleries() {
  setupPipelineGallery();
  setupResultGallery();
  setupSotaGallery();
  setupFailureGallery();
}

function setupPipelineGallery() {
  const tabs = document.getElementById('pipelineTabs');
  const grid = document.getElementById('pipelineGrid');
  if (!tabs || !grid) return;

  const discovered = [...new Set(MEDIA.pipeline.map((item) => item.group))]; const preferredOrder = ['Ghibli', 'LEGO', 'OtherStyles']; const groups = preferredOrder.filter((group) => discovered.includes(group)).concat(discovered.filter((group) => !preferredOrder.includes(group)));
  const groupLabels = { Ghibli: 'Ghibli', LEGO: 'LEGO', OtherStyles: 'Other styles' };
  tabs.innerHTML = groups.map((group, index) => (
    `<button class="tab${index === 0 ? ' active' : ''}" type="button" data-group="${escapeAttr(group)}">${escapeHtml(groupLabels[group] || group)}</button>`
  )).join('');

  const render = (group) => {
    const items = MEDIA.pipeline.filter((item) => item.group === group);
    grid.innerHTML = items.map((item) => pipelineCard(item)).join('');
    activateVideos(grid);
  };

  bindTabs(tabs, render, groups[0]);
}

function setupResultGallery() {
  const tabs = document.getElementById('resultTabs');
  const grid = document.getElementById('resultGrid');
  if (!tabs || !grid) return;

  const categories = [
    ['foreground_stylization', 'Foreground'],
    ['background_stylization', 'Background'],
    ['multi-region_stylization', 'Multi-region']
  ];

  tabs.innerHTML = categories.map(([key, label], index) => (
    `<button class="tab${index === 0 ? ' active' : ''}" type="button" data-category="${escapeAttr(key)}">${escapeHtml(label)}</button>`
  )).join('');

  const render = (category) => {
    const items = MEDIA.our.filter((item) => item.category === category);
    grid.innerHTML = items.map((item) => videoCard({
      title: `${item.style} - ${categoryLabel(item.category)}`,
      pill: item.orientation || 'video',
      files: ['source.mp4', 'mask.mp4', 'result.mp4'],
      item,
      gridClass: 'three'
    })).join('');
    activateVideos(grid);
  };

  bindTabs(tabs, render, categories[0][0]);
}

function setupSotaGallery() {
  const tabs = document.getElementById('sotaTabs');
  const grid = document.getElementById('sotaGrid');
  if (!tabs || !grid) return;

  const order = ['Pixel_Art', 'Pencil_Sketch', 'Childrens_Book', 'Papercut', 'Ghibli', 'Claymation', 'Oil_Painting'];
  const styleNames = {
    Pixel_Art: 'Pixel Art',
    Pencil_Sketch: 'Pencil Sketch',
    Childrens_Book: "Children's Book",
    Papercut: 'Papercut',
    Ghibli: 'Ghibli',
    Claymation: 'Claymation',
    Oil_Painting: 'Oil Painting'
  };
  const groups = order.filter((group) => MEDIA.sota.some((item) => item.group === group));

  tabs.innerHTML = groups.map((group, index) => (
    `<button class="tab${index === 0 ? ' active' : ''}" type="button" data-style="${escapeAttr(group)}">${escapeHtml(styleNames[group] || group)}</button>`
  )).join('');

  const render = (group) => {
    const items = MEDIA.sota.filter((item) => item.group === group);
    grid.innerHTML = items.map((item) => {
      const files = [
        'source.mp4',
        'ours.mp4',
        'coinve.mp4',
        'seedance.mp4',
        ...(item.ratios['regionroute.mp4'] ? ['regionroute.mp4'] : [])
      ];
      return videoCard({
        title: `${styleNames[item.group] || item.label} - ${item.region === 'fg' ? 'Foreground stylization' : 'Background stylization'}`,
        pill: 'SOTA comparison',
        files,
        item,
        cardClass: 'sota-card',
        gridClass: 'sota-row',
        style: `--method-count:${files.length}; --media-ratio:${item.ratios['source.mp4'] || item.ratio}`
      });
    }).join('');
    activateVideos(grid);
  };

  bindTabs(tabs, render, groups[0]);
}

function setupFailureGallery() {
  const tabs = document.getElementById('failureTabs');
  const grid = document.getElementById('failureGrid');
  if (!tabs || !grid) return;

  const issues = [
    ['structural_mismatch', 'Structural mismatch'],
    ['element_damage', 'Element damage']
  ];

  tabs.innerHTML = issues.map(([key, label], index) => (
    `<button class="tab${index === 0 ? ' active' : ''}" type="button" data-issue="${escapeAttr(key)}">${escapeHtml(label)}</button>`
  )).join('');

  const render = (issue) => {
    const items = MEDIA.e2e.filter((item) => item.issue === issue);
    grid.innerHTML = items.map((item) => videoCard({
      title: issueLabel(issue),
      pill: 'Failure analysis',
      files: ['src.mp4', 'mask.mp4', 'pipeline.mp4', 'e2e_model.mp4'],
      item,
      gridClass: 'four'
    })).join('');
    activateVideos(grid);
  };

  bindTabs(tabs, render, issues[0][0]);
}

function pipelineCard(item) {
  return `<article class="video-card pipeline-card" data-video-card>
    <div class="video-card-head">
      <div>
        <div class="video-card-title">${escapeHtml(item.label)}</div>
      </div>
      <div class="card-actions">
        <button class="group-toggle" type="button" data-group-toggle>Play group</button>
        <span class="pill">Dataset sample</span>
      </div>
    </div>
    <div class="pipeline-layout">
      <div class="pipeline-col">${videoCell(item, 'src.mp4')}</div>
      <div class="pipeline-col">${videoCell(item, 'mask.mp4')}${videoCell(item, 'clear.mp4')}</div>
      <div class="pipeline-col">${videoCell(item, 'src_sty.mp4')}${videoCell(item, 'clear_sty.mp4')}</div>
      <div class="pipeline-col">${videoCell(item, 'fg_full.mp4')}${videoCell(item, 'bg_full.mp4')}</div>
    </div>
  </article>`;
}

function videoCard({ title, subtitle = '', pill, files, item, gridClass, cardClass = '', style = '' }) {
  const subtitleHtml = subtitle ? `<div class="video-card-subtitle">${escapeHtml(subtitle)}</div>` : '';
  const styleAttribute = style ? ` style="${escapeAttr(style)}"` : '';
  return `<article class="video-card ${escapeAttr(cardClass)}" data-video-card>
    <div class="video-card-head">
      <div>
        <div class="video-card-title">${escapeHtml(title)}</div>
        ${subtitleHtml}
      </div>
      <div class="card-actions">
        <button class="group-toggle" type="button" data-group-toggle>Play group</button>
        <span class="pill">${escapeHtml(pill)}</span>
      </div>
    </div>
    <div class="video-grid ${escapeAttr(gridClass)}"${styleAttribute}>
      ${files.map((file) => videoCell(item, file)).join('')}
    </div>
  </article>`;
}

function videoCell(item, file) {
  const label = labels[file] || file.replace('.mp4', '');
  const labelClass = /result|ours|full/.test(file) ? ' result-label' : (/mask/.test(file) ? ' mask-label' : '');
  const src = `${VIDEO_ROOT}${item.path}/${file}`;
  return `<div class="video-cell">
    <span class="video-label${labelClass}">${escapeHtml(label)}</span>
    <video muted loop playsinline preload="metadata" data-src="${escapeAttr(src)}" aria-label="${escapeAttr(label)} for ${escapeAttr(item.path)}"></video>
  </div>`;
}

function bindTabs(container, render, initial) {
  container.querySelectorAll('.tab').forEach((button) => {
    button.addEventListener('click', () => {
      container.querySelectorAll('.tab').forEach((tab) => tab.classList.remove('active'));
      button.classList.add('active');
      const key = button.dataset.group || button.dataset.category || button.dataset.style || button.dataset.issue;
      render(key);
    });
  });
  render(initial);
}

function activateVideos(scope) {
  const videos = scope.querySelectorAll('video[data-src]');
  videos.forEach((video) => videoObserver.observe(video));
  scope.querySelectorAll('[data-video-card]').forEach((card) => cardObserver.observe(card));

  scope.querySelectorAll('[data-group-toggle]').forEach((button) => {
    button.addEventListener('click', () => {
      const card = button.closest('[data-video-card]');
      const cardVideos = [...card.querySelectorAll('video')];
      const shouldPlay = cardVideos.some((video) => video.paused);
      cardVideos.forEach((video) => shouldPlay ? video.play().catch(() => {}) : video.pause());
      button.textContent = shouldPlay ? 'Pause group' : 'Play group';
      button.classList.toggle('is-playing', shouldPlay);
    });
  });

  scope.querySelectorAll('video').forEach((video) => {
    video.addEventListener('click', () => {
      if (video.paused) video.play().catch(() => {});
      else video.pause();
    });
    video.addEventListener('play', () => {
      video.closest('.video-cell')?.classList.add('is-playing');
      const card = video.closest('[data-video-card]');
      const button = card?.querySelector('[data-group-toggle]');
      if (button) {
        button.textContent = 'Pause group';
        button.classList.add('is-playing');
      }
    });
    video.addEventListener('pause', () => {
      video.closest('.video-cell')?.classList.remove('is-playing');
      const card = video.closest('[data-video-card]');
      const cardVideos = [...card.querySelectorAll('video')];
      if (cardVideos.every((item) => item.paused)) {
        const button = card.querySelector('[data-group-toggle]');
        if (button) {
          button.textContent = 'Play group';
          button.classList.remove('is-playing');
        }
      }
    });
  });
}

const videoObserver = new IntersectionObserver((entries, observer) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    loadVideo(entry.target);
    observer.unobserve(entry.target);
  });
}, { rootMargin: '500px 0px' });

const cardObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    const card = entry.target;
    if (entry.isIntersecting) playCardVideos(card);
    else pauseCardVideos(card);
  });
}, { threshold: 0.01, rootMargin: '-18% 0px -18% 0px' });

function loadVideo(video) {
  if (!video.src) video.src = video.dataset.src;
  video.closest('.video-cell')?.classList.add('is-loaded');
}

function playCardVideos(card) {
  card.querySelectorAll('video').forEach((video) => {
    loadVideo(video);
    video.play().catch(() => {});
  });
}

function pauseCardVideos(card) {
  card.querySelectorAll('video').forEach((video) => video.pause());
}

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    document.querySelectorAll('[data-video-card]').forEach((card) => pauseCardVideos(card));
    return;
  }

  const viewportMiddle = window.innerHeight / 2;
  document.querySelectorAll('[data-video-card]').forEach((card) => {
    const bounds = card.getBoundingClientRect();
    if (bounds.top <= viewportMiddle && bounds.bottom >= viewportMiddle) playCardVideos(card);
  });
});

function categoryLabel(category) {
  return ({
    foreground_stylization: 'Foreground stylization',
    background_stylization: 'Background stylization',
    'multi-region_stylization': 'Multi-region stylization'
  })[category] || category;
}

function issueLabel(issue) {
  return ({ structural_mismatch: 'Structural mismatch', element_damage: 'Element damage' })[issue] || issue;
}

function setupCopyButton() {
  const button = document.getElementById('copyBibtex');
  const bib = document.getElementById('bibtex');
  if (!button || !bib) return;
  button.addEventListener('click', async () => {
    const text = bib.innerText;
    try {
      await navigator.clipboard.writeText(text);
      button.textContent = 'Copied';
    } catch (error) {
      const area = document.createElement('textarea');
      area.value = text;
      document.body.appendChild(area);
      area.select();
      document.execCommand('copy');
      area.remove();
      button.textContent = 'Copied';
    }
    window.setTimeout(() => { button.textContent = 'Copy BibTeX'; }, 1600);
  });
}

function setupActiveNavigation() {
  const links = [...document.querySelectorAll('.nav-list a')];
  const sections = links.map((link) => document.querySelector(link.getAttribute('href'))).filter(Boolean);
  if (!links.length || !sections.length) return;

  const byId = new Map(links.map((link) => [link.getAttribute('href').slice(1), link]));
  const update = () => {
    const navHeight = document.querySelector('.site-nav')?.getBoundingClientRect().height || 0;
    const line = navHeight + Math.min(window.innerHeight * 0.25, 180);
    let active = sections[0];
    sections.forEach((section) => {
      if (section.getBoundingClientRect().top <= line) active = section;
    });
    links.forEach((link) => link.classList.toggle('active', link === byId.get(active.id)));
  };

  window.addEventListener('scroll', () => window.requestAnimationFrame(update), { passive: true });
  window.addEventListener('resize', update);
  window.addEventListener('load', update);
  update();
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
}

function escapeAttr(value) {
  return escapeHtml(value);
}



