// human-review.js — 评审页面交互逻辑
// 由 devkeel inject-review 注入

(function() {
var CDN = 'https://cdn.jsdmirror.com/npm';
var DEPS = {
  css: [
    { href: CDN + '/@highlightjs/cdn-assets@11.11.1/styles/github.min.css' },
    { href: CDN + '/@highlightjs/cdn-assets@11.11.1/styles/github-dark.min.css', media: '(prefers-color-scheme: dark)' }
  ],
  js: [
    CDN + '/@highlightjs/cdn-assets@11.11.1/highlight.min.js',
    CDN + '/mermaid@11/dist/mermaid.min.js',
    CDN + '/marked/marked.min.js'
  ]
};

function loadCSS(spec) {
  var link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = spec.href;
  if (spec.media) link.media = spec.media;
  document.head.appendChild(link);
}

function loadScript(src) {
  return new Promise(function(resolve, reject) {
    var s = document.createElement('script');
    s.src = src;
    s.onload = resolve;
    s.onerror = function() { console.warn('Failed to load: ' + src); resolve(); };
    document.head.appendChild(s);
  });
}

function loadAllDeps() {
  DEPS.css.forEach(loadCSS);
  return DEPS.js.reduce(function(chain, src) {
    return chain.then(function() { return loadScript(src); });
  }, Promise.resolve());
}

// 折叠/展开
window.toggleSection = function(head) {
  var section = head.parentElement;
  section.classList.toggle('collapsed');
  localStorage.setItem(section.id, section.classList.contains('collapsed'));
};

// Artifact 标签页切换
window.switchArtifactTab = function(name) {
  document.querySelectorAll('.artifact-tab').forEach(function(t) { t.classList.remove('active'); });
  document.querySelectorAll('.artifact-panel').forEach(function(p) { p.classList.remove('active'); });
  var tab = document.querySelector('[data-tab="' + name + '"]');
  if (tab) tab.classList.add('active');
  var panel = document.querySelector('[data-panel="' + name + '"]');
  if (!panel) return;
  panel.classList.add('active');
  if (!panel.dataset.rendered) {
    var script = document.querySelector('script[data-artifact="' + name + '"]');
    if (script) {
      var md = script.textContent;
      panel.innerHTML = typeof marked !== 'undefined' ? marked.parse(md) : '<pre>' + md + '</pre>';
      panel.dataset.rendered = 'true';
      if (typeof hljs !== 'undefined') {
        panel.querySelectorAll('pre code').forEach(function(b) { hljs.highlightElement(b); });
      }
      if (typeof mermaid !== 'undefined') {
        panel.querySelectorAll('pre > code.language-mermaid').forEach(function(code) {
          var pre = code.parentElement;
          pre.className = 'mermaid';
          pre.textContent = code.textContent;
        });
        mermaid.run({ nodes: panel.querySelectorAll('.mermaid') });
      }
    }
  }
};

function buildTestCoverageCard() {
  var script = document.querySelector('script[data-artifact="test-points"]');
  if (!script) return;
  var md = script.textContent;

  var tpCount = (md.match(/^####\s+TP-/gm) || []).length;

  var covered = (md.match(/已覆盖/g) || []).length;
  var uncovered = (md.match(/未覆盖/g) || []).length;
  var pending = (md.match(/待确认/g) || []).length;

  var card = document.querySelector('[data-card="test-coverage"]');
  if (!card) return;
  card.innerHTML = '<h3>测试覆盖</h3>'
    + '<p><strong>' + tpCount + '</strong> 测试点</p>'
    + '<p>已覆盖: ' + covered + ' | 未覆盖: ' + uncovered + ' | 待确认: ' + pending + '</p>';
}

function buildArtifactViewer() {
  var viewer = document.querySelector('.artifact-viewer');
  if (!viewer) return;

  var tabs = viewer.querySelector('.artifact-tabs');
  if (!tabs) return;

  var fsBtn = document.createElement('button');
  fsBtn.className = 'artifact-fullscreen-btn';
  fsBtn.textContent = '⛶ 全屏';
  fsBtn.onclick = function() {
    var isFs = viewer.classList.toggle('fullscreen');
    fsBtn.textContent = isFs ? '✕ 退出' : '⛶ 全屏';
  };
  viewer.appendChild(fsBtn);

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && viewer.classList.contains('fullscreen')) {
      viewer.classList.remove('fullscreen');
      fsBtn.textContent = '⛶ 全屏';
    }
  });

  var knownTabs = {};
  viewer.querySelectorAll('.artifact-tab').forEach(function(tab) {
    knownTabs[tab.dataset.tab] = true;
  });

  var knownPanels = {};
  viewer.querySelectorAll('.artifact-panel').forEach(function(panel) {
    knownPanels[panel.dataset.panel] = true;
  });

  document.querySelectorAll('script[data-artifact]').forEach(function(script) {
    var name = script.dataset.artifact;
    if (!name) return;

    if (!knownTabs[name]) {
      var tab = document.createElement('button');
      tab.className = 'artifact-tab';
      tab.dataset.tab = name;
      tab.textContent = name;
      tab.onclick = function() { switchArtifactTab(name); };
      tabs.appendChild(tab);
      knownTabs[name] = true;
    }

    if (!knownPanels[name]) {
      var panel = document.createElement('div');
      panel.className = 'artifact-panel';
      panel.dataset.panel = name;
      viewer.appendChild(panel);
      knownPanels[name] = true;
    }
  });

  var firstTab = tabs.querySelector('.artifact-tab');
  if (firstTab && !viewer.querySelector('.artifact-tab.active')) {
    switchArtifactTab(firstTab.dataset.tab);
  }
}

function getEffectiveTheme() {
  var stored = localStorage.getItem('harness-theme');
  if (stored === 'dark' || stored === 'light') return stored;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  var btn = document.querySelector('.theme-toggle');
  if (btn) btn.textContent = theme === 'dark' ? '☀️' : '🌙';
}

function initThemeToggle() {
  applyTheme(getEffectiveTheme());
  var btn = document.createElement('button');
  btn.className = 'theme-toggle';
  btn.setAttribute('aria-label', '切换主题');
  btn.onclick = function() {
    var next = getEffectiveTheme() === 'dark' ? 'light' : 'dark';
    localStorage.setItem('harness-theme', next);
    applyTheme(next);
  };
  document.body.appendChild(btn);
  applyTheme(getEffectiveTheme());
}

function checkHarnessUpgrade() {
  var meta = document.querySelector('meta[name="harness-version"]');
  if (!meta) return;
  var currentVersion = meta.getAttribute('content');
  if (!currentVersion) return;

  var registryUrl = 'https://registry.npmjs.org/devkeel/latest';
  fetch(registryUrl, { signal: AbortSignal.timeout(5000) })
    .then(function(res) { return res.json(); })
    .then(function(data) {
      var latest = data.version;
      if (!latest) return;
      if (latest === currentVersion) return;
      if (!isNewer(latest, currentVersion)) return;
      showUpgradeBanner(currentVersion, latest);
    })
    .catch(function() {});
}

function isNewer(latest, current) {
  var l = latest.replace(/[^\d.]/g, '').split('.').map(Number);
  var c = current.replace(/[^\d.]/g, '').split('.').map(Number);
  for (var i = 0; i < Math.max(l.length, c.length); i++) {
    var lv = l[i] || 0;
    var cv = c[i] || 0;
    if (lv > cv) return true;
    if (lv < cv) return false;
  }
  return false;
}

function showUpgradeBanner(current, latest) {
  var banner = document.createElement('div');
  banner.className = 'upgrade-banner';
  banner.innerHTML = '<span class="upgrade-icon">⬆</span> DevKeel 有新版本可用：<strong>' + current + '</strong> → <strong>' + latest + '</strong>　<code>pnpm add -g devkeel@latest</code>';
  var header = document.querySelector('.page-header .wrapper') || document.querySelector('.page-header') || document.body.firstElementChild;
  if (header) {
    header.insertBefore(banner, header.firstChild);
  } else {
    document.body.insertBefore(banner, document.body.firstChild);
  }
}

function initMermaid() {
  if (typeof mermaid === 'undefined') return;
  document.querySelectorAll('pre > code.language-mermaid').forEach(function(code) {
    var pre = code.parentElement;
    pre.className = 'mermaid';
    pre.textContent = code.textContent;
  });
  var isDark = getEffectiveTheme() === 'dark';
  mermaid.initialize({
    startOnLoad: false,
    theme: isDark ? 'base' : 'default',
    themeVariables: isDark ? {
      background: '#0f172a',
      primaryColor: 'rgba(99,102,241,0.25)',
      primaryTextColor: '#f1f5f9',
      primaryBorderColor: '#818cf8',
      secondaryColor: 'rgba(6,78,59,0.4)',
      secondaryTextColor: '#f1f5f9',
      secondaryBorderColor: '#34d399',
      tertiaryColor: 'rgba(76,29,149,0.4)',
      tertiaryTextColor: '#f1f5f9',
      tertiaryBorderColor: '#a78bfa',
      lineColor: '#94a3b8',
      textColor: '#f1f5f9',
      mainBkg: 'rgba(99,102,241,0.15)',
      nodeBorder: '#818cf8',
      clusterBkg: 'rgba(30,41,59,0.6)',
      clusterBorder: '#475569',
      edgeLabelBackground: '#1e293b',
      fontSize: '14px'
    } : { fontSize: '14px' }
  });
  mermaid.run();
}

function init() {
  document.querySelectorAll('.section').forEach(function(s) {
    var stored = localStorage.getItem(s.id);
    if (stored !== null) {
      if (stored === 'true') s.classList.add('collapsed');
      else s.classList.remove('collapsed');
    }
  });

  loadAllDeps().then(function() {
    initMermaid();
    if (typeof hljs !== 'undefined') hljs.highlightAll();
    buildArtifactViewer();
    buildTestCoverageCard();
    checkHarnessUpgrade();
    initThemeToggle();
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
})();
