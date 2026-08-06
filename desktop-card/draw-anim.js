/* ============================================================
 * draw-anim.js — 「AI 绘制感」生成过场动画
 * ------------------------------------------------------------
 * 工作台每次发出生成指令时，播放一段"AI 正在绘制手机界面"的
 * 过场动画：结构元素 SVG 描线勾勒 → 时钟表盘刻度连续描出 →
 * 图标真图逐个点亮 → 壁纸模糊淡入 → 生成卡片「描线→填充」登场。
 *
 * 接入方式：零侵入 monkey-patch（本文件在 index.html 主脚本之后
 * 加载，包装全局 sendMessage / setWbLoading / renderWbCard /
 * renderWbVariants）。index.html 仅需一行 <script src>。
 *
 * 画板坐标系：360×800（Figma 6:1179，规格见阶段一文档），
 * 通过 transform:scale 适配预览容器。
 * ============================================================ */
(function () {
  'use strict';

  var ASSET = 'assets/phone-mockup/';
  var ICON = 'icons/';
  var W = 360, H = 800;

  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 元素规格（阶段一 Figma 精确数值） ---------- */
  // 12 个 55×55 cr16 图标容器（app 行1、行2、dock）
  var ICON_BOXES = [
    [28, 253], [111, 253], [194, 253], [277, 253],
    [28, 343], [111, 343], [194, 343], [277, 343],
    [28, 657], [111, 657], [194, 657], [277, 657],
  ];
  // 真图图标（55×55），index 对应 ICON_BOXES 位次；位次0 是谷歌文件夹（迷你图标另列）
  var BIG_ICONS = [
    [1, '图标：PlayStore.png'], [2, '图标：AI相册.png'], [3, '图标：设置.png'],
    [4, '图标：游戏.png'], [5, '图标：手机管家.png'], [6, '图标：应用中心.png'], [7, '图标：文件管理.png'],
    [8, '图标：电话.png'], [9, '图标：短信.png'], [10, '图标：浏览器.png'], [11, '图标：相机.png'],
  ];
  var MINI_ICONS = [
    [34.8, 260, '谷歌文件夹：Chrome.png'], [49.5, 260, '谷歌文件夹：迷你8.png'], [64.2, 260, '谷歌文件夹：地图.png'],
    [34.8, 274, '谷歌文件夹：YouTube.png'], [49.5, 274, '谷歌文件夹：迷你1.png'], [64.2, 274, '谷歌文件夹：迷你9.png'],
    [34.8, 289, '谷歌文件夹：迷你2.png'], [49.5, 289, '谷歌文件夹：迷你4.png'], [64.2, 289, '谷歌文件夹：迷你5.png'],
  ];
  var LABELS = [
    // [x, y, w, text]  — app 标签 11px 白
    [14, 312, 83, 'Google'], [97, 312, 83, 'Play Store'], [180, 312, 83, 'AI Gallery'], [263, 312, 83, 'Settings'],
    [14, 402, 83, 'Games'], [97, 402, 83, 'Phone Master'], [180, 402, 83, 'App Center'], [263, 402, 83, 'File Manager'],
    [28, 222, 138, 'Clock'], [214, 222, 98, 'AI Suggestions'],
  ];
  var PHASES = ['落笔起稿…', '勾勒骨架…', '描绘表盘…', '点亮图标…', '铺陈壁纸…'];

  /* ---------- 样式注入（一次性） ---------- */
  var css = [
    '#da-overlay{position:absolute;inset:0;z-index:30;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;',
    '  background:radial-gradient(ellipse 60% 50% at 85% 15%,rgba(235,215,210,.6),transparent),radial-gradient(ellipse 50% 50% at 10% 85%,rgba(235,235,210,.5),transparent),#eeecf1;',
    '  opacity:0;transition:opacity .25s ease;pointer-events:none;}',
    '#da-overlay.da-in{opacity:1;}',
    '#da-overlay.da-out{opacity:0;transition:opacity .38s ease;}',
    '.da-stage-wrap{position:relative;}',
    '.da-stage{position:relative;width:' + W + 'px;height:' + H + 'px;border-radius:30px;overflow:hidden;',
    '  background:#1F2545;box-shadow:0 24px 64px rgba(20,24,50,.45),0 4px 16px rgba(20,24,50,.25);transform-origin:top left;}',
    '.da-stage-wrap.da-hold .da-stage{animation:da-breathe 2.6s ease-in-out infinite;}',
    '@keyframes da-breathe{0%,100%{filter:brightness(1)}50%{filter:brightness(1.12)}}',
    '.da-wall{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:top;opacity:0;filter:blur(10px);}',
    '.da-svg{position:absolute;inset:0;}',
    '.da-stroke{fill:none;stroke:rgba(255,255,255,.92);stroke-width:1.4;stroke-linecap:round;',
    '  stroke-dasharray:1;stroke-dashoffset:1;}',
    '.da-fillbox{transition:fill-opacity .45s ease;}',
    '.da-ic{position:absolute;opacity:0;}',
    '.da-txt{position:absolute;color:#fff;font-family:-apple-system,"SF Pro Display","PingFang SC",sans-serif;',
    '  opacity:0;white-space:nowrap;text-shadow:0 1px 6px rgba(15,20,45,.35);}',
    '.da-clock-txt{transition:color .45s ease,text-shadow .45s ease;}',
    '.da-stage.da-final .da-clock-txt{color:#16181d;text-shadow:none;}',
    '.da-pen{position:absolute;width:10px;height:10px;margin:-5px 0 0 -5px;border-radius:50%;pointer-events:none;',
    '  background:radial-gradient(circle,#fff 0%,rgba(167,139,250,.95) 40%,rgba(124,92,252,0) 72%);',
    '  box-shadow:0 0 14px 5px rgba(150,120,255,.55);opacity:0;}',
    '.da-stage-wrap.da-hold .da-pen{opacity:.9;animation:da-orbit 3.2s linear infinite;}',
    '@keyframes da-orbit{0%{left:50px;top:120px}25%{left:310px;top:260px}50%{left:180px;top:700px}75%{left:40px;top:430px}100%{left:50px;top:120px}}',
    '.da-caption{font-size:.86rem;letter-spacing:.04em;font-weight:500;',
    '  background:linear-gradient(90deg,#6b6f7e 0%,#7C5CFC 35%,#C4B5FD 50%,#7C5CFC 65%,#6b6f7e 100%);',
    '  background-size:240% 100%;-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;',
    '  animation:da-shimmer 2.2s linear infinite;}',
    '@keyframes da-shimmer{0%{background-position:100% 0}100%{background-position:-140% 0}}',
    '.da-reveal{position:absolute;z-index:5;pointer-events:none;}',
    '.da-reveal rect{fill:rgba(255,255,255,0);stroke:#7C5CFC;stroke-width:2;stroke-dasharray:1;stroke-dashoffset:1;',
    '  filter:drop-shadow(0 0 8px rgba(124,92,252,.5));}',
  ].join('\n');
  var styleEl = document.createElement('style');
  styleEl.id = 'da-style';
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  /* ---------- 工具 ---------- */
  function svgEl(tag, attrs) {
    var el = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (var k in attrs) el.setAttribute(k, attrs[k]);
    return el;
  }
  function wbActive() {
    var v = document.getElementById('workbench-view');
    return !!(v && v.classList.contains('active'));
  }
  function asset(name) { return encodeURI(ASSET + name); }

  /* ---------- 主体 ---------- */
  var DrawAnim = {
    active: false,
    _root: null, _stage: null, _wrap: null, _svg: null,
    _caption: null, _pen: null,
    _timers: [], _anims: [], _observer: null, _watch: null,
    _startAt: 0, _contentQueued: false, _finishing: false,
    _dialSvgText: null, _dialFetching: false,
    TIMELINE_END: 3300,

    enabled: function () { return !reduced; },

    /* 启动（重复调用 = 重置重播） */
    start: function () {
      if (!this.enabled() || !wbActive()) return;
      this._teardown(true);
      var host = document.getElementById('wb-preview-card');
      if (!host) return;
      // 窄屏/预览区被挤压时不播（回退到默认 spinner），避免在过小容器里硬塞 360×800 画板
      var hostRect = host.getBoundingClientRect();
      if (hostRect.width < 160 || hostRect.height < 240) return;
      this.active = true;
      this._finishing = false;
      this._contentQueued = false;
      this._startAt = performance.now();

      var root = document.createElement('div');
      root.id = 'da-overlay';
      var wrap = document.createElement('div');
      wrap.className = 'da-stage-wrap';
      var stage = document.createElement('div');
      stage.className = 'da-stage';
      wrap.appendChild(stage);
      var caption = document.createElement('div');
      caption.className = 'da-caption';
      caption.textContent = 'AI 正在绘制界面 · ' + PHASES[0];
      root.appendChild(wrap);
      root.appendChild(caption);
      host.appendChild(root);
      this._root = root; this._stage = stage; this._wrap = wrap; this._caption = caption;

      this._fit(host);
      this._build();
      requestAnimationFrame(function () { root.classList.add('da-in'); });
      this._play();
      this._guard();
    },

    /* 缩放适配预览容器（含窄屏） */
    _fit: function (host) {
      var r = host.getBoundingClientRect();
      var availW = Math.max(120, r.width - 48);
      var availH = Math.max(160, r.height - 64); // 给 caption 留空间
      var s = Math.min(availW / W, availH / H, 0.72);
      this._stage.style.transform = 'scale(' + s + ')';
      this._wrap.style.width = (W * s) + 'px';
      this._wrap.style.height = (H * s) + 'px';
    },

    /* ---------- DOM 构建（一次性注入） ---------- */
    _build: function () {
      var stage = this._stage;

      // C：壁纸（预加载，act⑤ 淡入）。
      // 注：壁纸.png 是带完整 UI 的系统截图素材，若按 Figma 坐标局部贴会产生鬼影双层图标；
      // 故作为全幅氛围壁纸（cover + 残留模糊 + 降透明度）垫在描线层下方，读作背景质感而非重复 UI。
      var wall = document.createElement('img');
      wall.className = 'da-wall';
      wall.src = asset('壁纸.png');
      wall.alt = '';
      stage.appendChild(wall);
      this._wall = wall;

      // A：描线 SVG 层
      var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H, 'class': 'da-svg', width: W, height: H });
      stage.appendChild(svg);
      this._svg = svg;

      var strokes = this._strokes = {};
      function rect(key, x, y, w, h, r, extra) {
        var el = svgEl('rect', { x: x, y: y, width: w, height: h, rx: r, ry: r, pathLength: 1, 'class': 'da-stroke' });
        if (extra) for (var k in extra) el.setAttribute(k, extra[k]);
        svg.appendChild(el);
        strokes[key] = el;
        return el;
      }
      // ① 手机外框
      rect('frame', 2, 2, W - 4, H - 4, 28, { 'stroke-width': 2 });
      // ② 状态栏小件
      var sbTime = svgEl('text', { x: 20, y: 22, fill: '#fff', 'font-size': 14, 'font-weight': 600, 'font-family': 'sans-serif', opacity: 0 });
      sbTime.textContent = '9:30';
      svg.appendChild(sbTime); strokes.sbTime = sbTime;
      strokes.sbGear = svg.appendChild(svgEl('circle', { cx: 58, cy: 18, r: 5.5, pathLength: 1, 'class': 'da-stroke' }));
      rect('sbMsg', 68, 12, 13, 12, 3);
      // 信号 4 格
      var sig = svgEl('g', { 'class': '' }); svg.appendChild(sig);
      for (var i = 0; i < 4; i++) {
        var bar = svgEl('rect', { x: 280 + i * 3.6, y: 21 - (i + 1) * 2.4, width: 2.2, height: (i + 1) * 2.4 + 2, rx: 1, pathLength: 1, 'class': 'da-stroke' });
        bar.setAttribute('stroke-width', 1);
        sig.appendChild(bar);
      }
      strokes.sbSignal = sig;
      var sb5g = svgEl('text', { x: 299, y: 22, fill: '#fff', 'font-size': 10, 'font-weight': 600, 'font-family': 'sans-serif', opacity: 0 });
      sb5g.textContent = '5G'; svg.appendChild(sb5g); strokes.sb5g = sb5g;
      rect('sbBat', 318, 12.5, 22, 11, 3);
      // ② 组件容器
      function fillbox(el, color) {
        el.classList.add('da-fillbox');
        el.style.fill = color;          // 内联 style 覆盖 .da-stroke 的 fill:none
        el.style.fillOpacity = '0';
        return el;
      }
      fillbox(rect('clockBox', 25, 73, 145, 145, 20), 'rgba(255,255,255,0.92)');
      fillbox(rect('aiBox', 190.5, 73, 145, 145, 20), 'rgba(46,52,96,0.9)');
      // ② 12 个图标容器（位次0 谷歌文件夹是玻璃底）
      this._iconBoxEls = ICON_BOXES.map(function (p, idx) {
        return fillbox(rect('ib' + idx, p[0], p[1], 55, 55, 16),
          idx === 0 ? 'rgba(255,255,255,0.28)' : 'rgba(255,255,255,0.95)');
      });
      // ② 搜索栏胶囊 ×2 / 分页指示器 / 导航条
      rect('searchOuter', 27, 722, 301, 48, 23.48);
      rect('searchGlass', 30, 726, 295, 40, 20, { 'stroke-width': 1, 'stroke-opacity': 0.55 });
      var pager = svgEl('g', {}); svg.appendChild(pager);
      pager.appendChild(svgEl('circle', { cx: 157, cy: 624, r: 3, pathLength: 1, 'class': 'da-stroke' }));
      pager.appendChild(svgEl('rect', { x: 168, y: 621, width: 20, height: 6, rx: 3, pathLength: 1, 'class': 'da-stroke' }));
      pager.appendChild(svgEl('circle', { cx: 200, cy: 624, r: 3, pathLength: 1, 'class': 'da-stroke' }));
      strokes.pager = pager;
      rect('nav', 120, 791, 120, 3, 2);
      // ③ 时钟表盘线稿容器（fetch 后注入）
      var dialG = svgEl('g', { transform: 'translate(29.5,77.5)', opacity: 1 });
      svg.appendChild(dialG);
      this._dialG = dialG;
      this._injectDial();

      // B：图标层（真图）
      var icLayer = document.createElement('div');
      icLayer.style.cssText = 'position:absolute;inset:0;';
      stage.appendChild(icLayer);
      function img(x, y, w, h, name, rad) {
        var im = document.createElement('img');
        im.className = 'da-ic';
        im.src = /\.svg$/.test(name) ? encodeURI(ICON + name) : asset(name);
        im.alt = '';
        im.style.cssText += 'left:' + x + 'px;top:' + y + 'px;width:' + w + 'px;height:' + h + 'px;' + (rad ? 'border-radius:' + rad + 'px;' : '');
        icLayer.appendChild(im);
        return im;
      }
      this._bigIconEls = BIG_ICONS.map(function (it) {
        var p = ICON_BOXES[it[0]];
        return img(p[0], p[1], 55, 55, it[1], 16);
      });
      this._miniIconEls = MINI_ICONS.map(function (it) { return img(it[0], it[1], 12, 12, it[2], 3); });
      this._searchIconEls = [
        img(38, 739, 22.65, 23, '搜索栏：G标.png'),
        img(263, 742, 12.4, 17.9, '手机：搜索语音.svg'),
        img(303, 742, 15.35, 15.5, '手机：搜索镜头.svg'),
      ];

      // 文字层（标签 + 时钟内文字）
      var txLayer = document.createElement('div');
      txLayer.style.cssText = 'position:absolute;inset:0;';
      stage.appendChild(txLayer);
      function txt(x, y, w, str, size, cls, weight) {
        var d = document.createElement('div');
        d.className = 'da-txt' + (cls ? ' ' + cls : '');
        d.textContent = str;
        d.style.cssText += 'left:' + x + 'px;top:' + y + 'px;width:' + w + 'px;text-align:center;font-size:' + size + 'px;font-weight:' + (weight || 500) + ';';
        txLayer.appendChild(d);
        return d;
      }
      this._labelEls = LABELS.map(function (l) { return txt(l[0], l[1], l[2], l[3], 11); });
      this._clockTxtEls = [
        txt(42, 112, 111, '09:30', 46, 'da-clock-txt', 750),
        txt(68, 93, 60, 'Mon, Dec 18', 10, 'da-clock-txt', 600),
        txt(82, 182, 32, '26°', 10, 'da-clock-txt', 600),
      ];

      // 画笔光点
      var pen = document.createElement('div');
      pen.className = 'da-pen';
      stage.appendChild(pen);
      this._pen = pen;
    },

    /* 时钟表盘线稿：fetch 一次缓存，逐条 stagger 描出 */
    _injectDial: function () {
      var self = this;
      if (this._dialSvgText) return this._mountDial();
      if (this._dialFetching) return;
      this._dialFetching = true;
      fetch(encodeURI(ICON + '手机：时钟表盘线稿.svg'))
        .then(function (r) { return r.ok ? r.text() : Promise.reject(r.status); })
        .then(function (text) {
          self._dialSvgText = text;
          self._dialFetching = false;
          if (self.active) self._mountDial();
        })
        .catch(function () { self._dialFetching = false; /* 表盘缺席不阻塞主动画 */ });
    },
    _mountDial: function () {
      if (!this._dialG || this._dialG.childNodes.length) return;
      var doc = new DOMParser().parseFromString(this._dialSvgText, 'image/svg+xml');
      var paths = doc.querySelectorAll('path');
      var frag = document.createDocumentFragment();
      for (var i = 0; i < paths.length; i++) {
        var p = document.importNode(paths[i], true);
        // 线稿在深底上反白显示
        if (p.getAttribute('fill') && p.getAttribute('fill') !== 'none') p.setAttribute('fill', 'rgba(255,255,255,0.85)');
        if (p.getAttribute('stroke')) p.setAttribute('stroke', 'rgba(255,255,255,0.85)');
        p.style.opacity = '0';
        frag.appendChild(p);
      }
      this._dialG.appendChild(frag);
      // 若时间线已开动，按剩余时序补 stagger
      var elapsed = this.active ? performance.now() - this._startAt : 0;
      var base = Math.max(900 - elapsed, 0);
      var nodes = this._dialG.childNodes;
      for (var j = 0; j < nodes.length; j++) {
        this._animate(nodes[j], [{ opacity: 0, transform: 'scale(.96)' }, { opacity: 1, transform: 'scale(1)' }],
          { duration: 180, delay: base + j * 16, fill: 'forwards', easing: 'ease-out' });
      }
    },

    /* ---------- 时间线 ---------- */
    _animate: function (el, kf, opts) {
      try {
        var a = el.animate(kf, opts);
        this._anims.push(a);
        return a;
      } catch (e) { /* ignore */ }
    },
    _later: function (fn, ms) { this._timers.push(setTimeout(fn, ms)); },
    _draw: function (el, delay, dur) {
      if (!el) return;
      if (el.tagName === 'g' || el.tagName === 'G') {
        var kids = el.childNodes;
        for (var i = 0; i < kids.length; i++) this._draw(kids[i], delay + i * 40, dur);
        return;
      }
      if (el.tagName === 'text') {
        this._animate(el, [{ opacity: 0 }, { opacity: 1 }], { duration: dur, delay: delay, fill: 'forwards' });
        return;
      }
      this._animate(el, [{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }],
        { duration: dur, delay: delay, fill: 'forwards', easing: 'cubic-bezier(.45,.05,.35,1)' });
    },
    _pop: function (el, delay, dur, fromScale) {
      this._animate(el, [
        { opacity: 0, transform: 'scale(' + (fromScale || 0.6) + ')' },
        { opacity: 1, transform: 'scale(1)' },
      ], { duration: dur || 260, delay: delay, fill: 'forwards', easing: 'cubic-bezier(.34,1.56,.64,1)' });
    },
    _wipe: function (el, delay, dur) {
      el.style.clipPath = 'inset(0 100% 0 0)';
      this._animate(el, [
        { opacity: 1, clipPath: 'inset(0 100% 0 0)' },
        { opacity: 1, clipPath: 'inset(0 0% 0 0)' },
      ], { duration: dur || 300, delay: delay, fill: 'forwards', easing: 'ease-out' });
    },

    _play: function () {
      var s = this._strokes, self = this;
      // ① 画布起手：底色渐亮 + 外框描线
      this._animate(this._stage, [{ filter: 'brightness(.35)' }, { filter: 'brightness(1)' }], { duration: 380, fill: 'forwards' });
      this._draw(s.frame, 80, 520);
      // ② 骨架勾线
      var t = 420;
      [s.sbTime, s.sbGear, s.sbMsg, s.sbSignal, s.sb5g, s.sbBat].forEach(function (el, i) { self._draw(el, t + i * 55, 240); });
      this._draw(s.clockBox, 720, 420);
      this._draw(s.aiBox, 790, 420);
      this._iconBoxEls.forEach(function (el, i) { self._draw(el, 900 + i * 60, 300); }); // 波浪式
      this._draw(s.searchOuter, 1560, 360);
      this._draw(s.searchGlass, 1640, 360);
      this._draw(s.pager, 1700, 220);
      this._draw(s.nav, 1780, 220);
      // ③ 表盘炫技（表盘 stagger 在 _mountDial 里按 900ms 基点排布）＋时钟文字扫入
      this._wipe(this._clockTxtEls[0], 1750, 340);
      this._wipe(this._clockTxtEls[1], 1900, 260);
      this._wipe(this._clockTxtEls[2], 2000, 240);
      // ④ 图标点亮：8 主屏 → 9 迷你连爆 → dock4 → 搜索栏3；容器同步「线稿→实体」
      var boxFillDelay = {};
      BIG_ICONS.forEach(function (it, i) {
        var d = i < 7 ? 1900 + i * 70 : 2570 + (i - 7) * 70; // 前7个主屏，后4个 dock
        self._pop(self._bigIconEls[i], d);
        boxFillDelay[it[0]] = d;
      });
      this._miniIconEls.forEach(function (el, i) { self._pop(el, 2460 + i * 30, 200, 0.4); });
      this._searchIconEls.forEach(function (el, i) { self._pop(el, 2780 + i * 60); });
      boxFillDelay[0] = 2440; // 谷歌文件夹玻璃底随迷你图标点亮
      this._iconBoxEls.forEach(function (el, i) {
        var d = boxFillDelay[i] != null ? boxFillDelay[i] : 2200;
        self._later(function () { el.style.fillOpacity = i === 0 ? '0.6' : '1'; }, d);
      });
      // 组件容器底填充随表盘/文字进场
      this._later(function () { if (self._strokes) { self._strokes.clockBox.style.fillOpacity = '1'; self._strokes.aiBox.style.fillOpacity = '1'; } }, 1500);
      // ⑤ 壁纸落位（blur 收敛到残留 2.5px，保持氛围感）＋标签渐显＋时钟文字转正色
      this._animate(this._wall, [
        { opacity: 0, filter: 'blur(18px) brightness(.75) saturate(1.1)', transform: 'scale(1.06)' },
        { opacity: 0.5, filter: 'blur(9px) brightness(.8) saturate(1.15)', transform: 'scale(1.02)' },
      ], { duration: 620, delay: 2500, fill: 'forwards', easing: 'ease-out' });
      this._labelEls.forEach(function (el, i) {
        self._animate(el, [{ opacity: 0, transform: 'translateY(3px)' }, { opacity: 1, transform: 'translateY(0)' }],
          { duration: 260, delay: 2650 + i * 40, fill: 'forwards' });
      });
      this._later(function () { if (self._stage) self._stage.classList.add('da-final'); }, 2750);
      // 画笔光点：沿各幕关键位巡游
      this._pen.style.opacity = '0.9';
      this._animate(this._pen, [
        { left: '30px', top: '30px', offset: 0 },
        { left: '330px', top: '20px', offset: 0.13 },
        { left: '97px', top: '145px', offset: 0.3 },
        { left: '97px', top: '145px', offset: 0.42 },
        { left: '55px', top: '280px', offset: 0.52 },
        { left: '304px', top: '370px', offset: 0.66 },
        { left: '180px', top: '684px', offset: 0.78 },
        { left: '180px', top: '746px', offset: 0.88 },
        { left: '180px', top: '420px', offset: 1 },
      ], { duration: this.TIMELINE_END, fill: 'forwards', easing: 'linear' });
      // 分幕文案
      var capBase = 'AI 正在绘制界面 · ';
      [[0, 0], [420, 1], [900, 2], [1900, 3], [2500, 4]].forEach(function (ph) {
        self._later(function () { if (self._caption) self._caption.textContent = capBase + PHASES[ph[1]]; }, ph[0]);
      });
      // 时间线末端：内容就绪则收口，否则进入呼吸等待
      this._later(function () {
        if (!self.active || self._finishing) return;
        if (self._contentQueued) self._finale();
        else self._enterHold();
      }, this.TIMELINE_END);
    },

    _enterHold: function () {
      if (!this.active || this._finishing) return;
      if (this._wrap) this._wrap.classList.add('da-hold');
      if (this._pen) this._pen.style.opacity = '';
      if (this._caption) this._caption.textContent = 'AI 正在打磨细节，马上就好…';
    },

    /* ---------- 外部信号 ---------- */
    /* 卡片渲染完成 → 第⑥幕（若前五幕未播完则等播完） */
    contentReady: function () {
      if (!this.active || this._finishing) return;
      var elapsed = performance.now() - this._startAt;
      if (elapsed < this.TIMELINE_END) { this._contentQueued = true; return; }
      this._finale();
    },

    /* ⑥ 卡片登场：在真卡位置描线→填充闪光→整层退场 */
    _finale: function () {
      if (!this.active || this._finishing) return;
      this._finishing = true;
      if (this._wrap) this._wrap.classList.remove('da-hold');
      if (this._caption) this._caption.textContent = '完成 ✨';
      var self = this;
      requestAnimationFrame(function () {
        var host = document.getElementById('wb-preview-card');
        var rects = self._findCardRects(host);
        if (host && rects.length) {
          var hr = host.getBoundingClientRect();
          var rsvg = svgEl('svg', { 'class': 'da-reveal', width: hr.width, height: hr.height });
          rsvg.style.cssText = 'left:0;top:0;width:' + hr.width + 'px;height:' + hr.height + 'px;';
          rects.forEach(function (cr, i) {
            var rc = svgEl('rect', {
              x: cr.left - hr.left, y: cr.top - hr.top,
              width: cr.width, height: cr.height, rx: 22, ry: 22, pathLength: 1,
            });
            rsvg.appendChild(rc);
            self._animate(rc, [{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }],
              { duration: 320, delay: i * 80, fill: 'forwards', easing: 'cubic-bezier(.45,.05,.35,1)' });
            self._animate(rc, [
              { fill: 'rgba(255,255,255,0)' }, { fill: 'rgba(255,255,255,.55)' }, { fill: 'rgba(255,255,255,0)' },
            ], { duration: 380, delay: 300 + i * 80, fill: 'forwards' });
          });
          self._root.appendChild(rsvg);
        }
        // 画布层先让位（缩小淡出），随后整层退场
        if (self._wrap) self._animate(self._wrap, [
          { opacity: 1, transform: 'scale(1)' },
          { opacity: 0, transform: 'scale(.96)' },
        ], { duration: 420, delay: 180, fill: 'forwards', easing: 'ease-in' });
        self._later(function () { self._exit(); }, 720);
      });
    },
    _findCardRects: function (host) {
      var out = [];
      if (!host) return out;
      var card = document.getElementById('wb-card');
      if (card && card.offsetParent !== null && card.offsetWidth > 10) {
        out.push(card.getBoundingClientRect());
        return out;
      }
      var stage = document.getElementById('wb-card-stage');
      if (stage) {
        Array.prototype.forEach.call(stage.children, function (w) {
          if (w.id === 'wb-card') return;
          var c = w.children && w.children[1];
          if (c && c.offsetWidth > 10) out.push(c.getBoundingClientRect());
        });
      }
      return out;
    },

    /* 错误/导航离开 → 优雅退场（不播第⑥幕） */
    abort: function () {
      if (!this.active || this._finishing) return;
      this._finishing = true;
      this._exit();
    },
    _exit: function () {
      var root = this._root, self = this;
      if (root) {
        root.classList.add('da-out');
        this._timers.push(setTimeout(function () { self._teardown(); }, 420));
      } else this._teardown();
    },
    _teardown: function (silent) {
      this._timers.forEach(clearTimeout); this._timers = [];
      this._anims.forEach(function (a) { try { a.cancel(); } catch (e) {} }); this._anims = [];
      if (this._observer) { this._observer.disconnect(); this._observer = null; }
      if (this._watch) { clearInterval(this._watch); this._watch = null; }
      if (this._root && this._root.parentNode) this._root.parentNode.removeChild(this._root);
      this._root = this._stage = this._wrap = this._svg = this._caption = this._pen = null;
      this._iconBoxEls = this._bigIconEls = this._miniIconEls = this._searchIconEls = null;
      this._labelEls = this._clockTxtEls = this._dialG = this._wall = null;
      this._strokes = null;
      this.active = false;
      if (!silent) this._finishing = false;
    },

    /* 守护：错误提示出现 / 离开工作台 / 超时 → abort */
    _guard: function () {
      var self = this;
      var wbLoading = document.getElementById('wb-loading');
      if (wbLoading && 'MutationObserver' in window) {
        this._observer = new MutationObserver(function () {
          // 动画期间任何代码把 wb-loading 重新显示 = 错误态（正常成功路径它保持隐藏）
          if (self.active && !self._finishing && wbLoading.style.display !== 'none' && wbLoading.style.display !== '') {
            var spinner = wbLoading.querySelector('.wb-spinner');
            if (!spinner || spinner.style.display === 'none') self.abort();
          }
        });
        this._observer.observe(wbLoading, { attributes: true, attributeFilter: ['style'], subtree: true });
      }
      var started = performance.now();
      this._watch = setInterval(function () {
        if (!self.active) { clearInterval(self._watch); self._watch = null; return; }
        if (!wbActive()) { self.abort(); return; }             // 用户切走视图
        if (performance.now() - started > 120000) self.abort(); // 2min 安全阀
      }, 500);
    },
  };

  window.TosDrawAnim = DrawAnim;

  /* ---------- 零侵入接线（包装全局函数） ---------- */
  function patch() {
    if (typeof window.sendMessage !== 'function') return; // 主脚本未就绪

    var _send = window.sendMessage;
    window.sendMessage = function () {
      // 每次生成（含迭代改卡）都播；空输入不播；
      // 若同一时刻已由 setWbLoading(true) 拉起（submitWelcome 路径）则不重复重播
      try {
        var input = document.getElementById('chatInput');
        var justStarted = DrawAnim.active && (performance.now() - DrawAnim._startAt < 600);
        if (DrawAnim.enabled() && wbActive() && input && input.value.trim() && !justStarted) DrawAnim.start();
      } catch (e) {}
      return _send.apply(this, arguments);
    };

    var _setWb = window.setWbLoading;
    if (typeof _setWb === 'function') {
      window.setWbLoading = function (loading) {
        var r = _setWb.apply(this, arguments);
        if (loading && DrawAnim.enabled() && wbActive()) {
          if (!DrawAnim.active) DrawAnim.start();
          // 过场动画替代默认 spinner
          var wl = document.getElementById('wb-loading');
          if (wl && DrawAnim.active) wl.style.display = 'none';
        }
        return r;
      };
    }

    ['renderWbCard', 'renderWbVariants'].forEach(function (name) {
      var orig = window[name];
      if (typeof orig !== 'function') return;
      window[name] = function () {
        var r = orig.apply(this, arguments);
        try { DrawAnim.contentReady(); } catch (e) {}
        return r;
      };
    });

    // 失败路径：核心步骤报错（API 错误 / 网络错误）→ 动画优雅退场，露出原错误提示。
    // 'illust' 报错除外（插图失败仍会渲染兜底卡片，等 renderWbCard 正常收口）。
    var _updateStep = window.updateStep;
    if (typeof _updateStep === 'function') {
      window.updateStep = function (stepId, status) {
        var r = _updateStep.apply(this, arguments);
        if (status === 'error' && stepId !== 'illust') {
          try { DrawAnim.abort(); } catch (e) {}
        }
        return r;
      };
    }

    // AI 回复里没有 card-update（闲聊/追问）→ 没卡可登场，动画直接退场。
    var _updSteps = window.updateStepsFromResponse;
    if (typeof _updSteps === 'function') {
      window.updateStepsFromResponse = function (reply, displayReply, cardData) {
        var r = _updSteps.apply(this, arguments);
        if (!cardData) { try { DrawAnim.abort(); } catch (e) {} }
        return r;
      };
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', patch);
  else patch();
})();
