/* ============================================================
 * draw-anim.js — 「AI 绘制感」生成过场动画 + 手机常驻预览
 * ------------------------------------------------------------
 * 工作台每次发出生成指令时，播放一段"AI 正在绘制手机界面"的
 * 过场动画：结构元素 SVG 描线勾勒 → 时钟卡成品图落位（模糊→
 * 清晰淡入，不描线）→ 图标真图逐个点亮 →
 * 深色底显现 → 生成卡片「描线→填充」
 * 落到手机屏幕的卡位上（Figma 6:1179 AI Suggestions 组件位）。
 *
 * 收口行为（2026-08-06 修正）：动画播完后手机界面**定格保留**，
 * 成为常驻预览底；卡片就在手机屏上。后续迭代改卡播「短版」：
 * 手机不重画，卡位旧卡淡化成草稿态 → 画笔巡游 + 卡位描线 →
 * 新卡原位描线→填充刷新。A/B 方案对比时手机暂时淡出避让，
 * 选定方案后快速重播（0.3x 速度）定格回手机。
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
  // 卡位：Figma AI Suggestions 组件（相对坐标），145×145 cr20，装 138×138 卡片
  var SLOT = { x: 190.5, y: 73, w: 145, h: 145, r: 20 };

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
  var SEARCH_BAR = { x: 27, y: 722, w: 301, h: 48, r: 23.48 };
  var SEARCH_BAR_CENTER_Y = SEARCH_BAR.y + SEARCH_BAR.h / 2;
  var STATUS_BAR = { x: 0, y: 0, w: 360, h: 36, name: '手机：状态栏.svg' };
  var SEARCH_ICONS = [
    { x: 38, w: 22.65, h: 23, name: '搜索栏：G标.png' },
    { x: 263, w: 12.4, h: 17.9, name: '手机：搜索语音.svg' },
    { x: 303, w: 15.35, h: 15.5, name: '手机：搜索镜头.svg' },
  ].map(function (icon) {
    icon.y = SEARCH_BAR_CENTER_Y - icon.h / 2;
    return icon;
  });
  var PHASES = ['落笔起稿…', '勾勒骨架…', '安放时钟…', '点亮图标…', '铺陈深底…'];

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
    '.da-wall{position:absolute;inset:0;background:#10292B;opacity:0;}',
    '.da-svg{position:absolute;inset:0;}',
    '.da-stroke{fill:none;stroke:rgba(255,255,255,.92);stroke-width:1.4;stroke-linecap:round;',
    '  stroke-dasharray:1;stroke-dashoffset:1;}',
    '.da-fillbox{transition:fill-opacity .45s ease;}',
    '.da-ic{position:absolute;opacity:0;}',
    '.da-txt{position:absolute;color:#fff;font-family:-apple-system,"SF Pro Display","PingFang SC",sans-serif;',
    '  opacity:0;white-space:nowrap;text-shadow:0 1px 6px rgba(15,20,45,.35);}',
    '.da-clockimg{position:absolute;left:25px;top:73px;width:145px;height:145px;border-radius:20px;opacity:0;',
    '  box-shadow:0 6px 18px rgba(15,20,45,.28);}',
    '.da-pen{position:absolute;width:10px;height:10px;margin:-5px 0 0 -5px;border-radius:50%;pointer-events:none;z-index:8;',
    '  background:radial-gradient(circle,#fff 0%,rgba(167,139,250,.95) 40%,rgba(124,92,252,0) 72%);',
    '  box-shadow:0 0 14px 5px rgba(150,120,255,.55);opacity:0;}',
    '.da-stage-wrap.da-hold .da-pen{opacity:.9;animation:da-orbit 3.2s linear infinite;}',
    '@keyframes da-orbit{0%{left:50px;top:120px}25%{left:310px;top:260px}50%{left:180px;top:700px}75%{left:40px;top:430px}100%{left:50px;top:120px}}',
    '.da-caption{font-size:.86rem;letter-spacing:.04em;font-weight:500;transition:opacity .45s ease;',
    '  background:linear-gradient(90deg,#6b6f7e 0%,#7C5CFC 35%,#C4B5FD 50%,#7C5CFC 65%,#6b6f7e 100%);',
    '  background-size:240% 100%;-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;',
    '  animation:da-shimmer 2.2s linear infinite;}',
    '@keyframes da-shimmer{0%{background-position:100% 0}100%{background-position:-140% 0}}',
    '.da-reveal{position:absolute;z-index:5;pointer-events:none;}',
    '.da-reveal rect{fill:rgba(255,255,255,0);stroke:#7C5CFC;stroke-width:2;stroke-dasharray:1;stroke-dashoffset:1;',
    '  filter:drop-shadow(0 0 8px rgba(124,92,252,.5));}',
    /* —— 手机屏卡位（常驻预览）—— */
    '.da-slot{position:absolute;left:' + SLOT.x + 'px;top:' + SLOT.y + 'px;width:' + SLOT.w + 'px;height:' + SLOT.h + 'px;',
    '  border-radius:' + SLOT.r + 'px;overflow:hidden;z-index:6;background:#fff;opacity:0;',
    '  box-shadow:0 6px 18px rgba(15,20,45,.28);}',
    '.da-slot.da-slot-wait{animation:da-slot-pulse 1.6s ease-in-out infinite;}',
    '@keyframes da-slot-pulse{0%,100%{filter:brightness(1) saturate(.75)}50%{filter:brightness(1.16) saturate(.75)}}',
    '.da-slot-bg{position:absolute;inset:0;}',
    '.da-slot-svg{position:absolute;inset:0;z-index:7;pointer-events:none;}',
    '.da-slot-svg rect{fill:rgba(255,255,255,0);stroke:#7C5CFC;stroke-width:2;stroke-dasharray:1;stroke-dashoffset:1;',
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
    active: false,        // 一段动画（全幕/短版）正在播
    persistent: false,    // 手机界面已定格为常驻预览
    _suspended: false,    // 常驻手机因 A/B 对比暂时淡出
    _iterMode: false,     // 当前这段动画是「迭代短版」
    _variantsMode: false, // 本轮生成结果是 A/B 方案对比
    _persistAfterPick: false, // A/B 选定后重播定格
    _root: null, _stage: null, _wrap: null, _svg: null,
    _caption: null, _pen: null, _slot: null, _slotSvg: null,
    _timers: [], _anims: [], _observer: null, _watch: null, _ro: null,
    _iterPen: null,
    _startAt: 0, _contentQueued: false, _finishing: false,
    _k: 1, _end: 3300,
    TIMELINE_END: 3300,
    ITER_END: 1300,

    enabled: function () { return !reduced; },

    /* 启动。手机已常驻 → 播迭代短版；否则全幕（重复调用 = 重置重播）。
     * opts.fast: 0.3x 速度快放全幕（A/B 选定后回手机用）
     * opts.preloaded: 卡片已渲染好，时间线走完直接收口 */
    start: function (opts) {
      opts = opts || {};
      if (!this.enabled() || !wbActive()) return;
      if (this.persistent && this._root) return this.startIteration();
      this._teardown(true);
      var host = document.getElementById('wb-preview-card');
      if (!host) return;
      // 窄屏/预览区被挤压时不播（回退到默认 spinner），避免在过小容器里硬塞 360×800 画板
      var hostRect = host.getBoundingClientRect();
      if (hostRect.width < 160 || hostRect.height < 240) return;
      this.active = true;
      this._finishing = false;
      this._iterMode = false;
      this._variantsMode = false;
      this._contentQueued = !!opts.preloaded;
      this._k = opts.fast ? 0.3 : 1;
      this._end = Math.round(this.TIMELINE_END * this._k);
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
      this._observeResize(host);
      this._build();
      requestAnimationFrame(function () { root.classList.add('da-in'); });
      this._play();
      this._guard();
    },

    /* 迭代短版：手机不重画，卡位旧卡淡化 → 画笔巡游 + 卡位描线 → 新卡原位刷新 */
    startIteration: function () {
      if (!this.enabled() || !this._root || !wbActive()) return;
      if (this.active) return; // 已在播
      if (this._suspended) this.resume();
      this.active = true;
      this._finishing = false;
      this._iterMode = true;
      this._variantsMode = false;
      this._contentQueued = false;
      this._startAt = performance.now();
      this._end = this.ITER_END;
      var self = this;
      if (this._caption) {
        this._caption.style.opacity = '1';
        this._caption.textContent = 'AI 正在重绘卡片…';
      }
      // 旧卡淡化成草稿态
      if (this._slot) {
        this._slot.classList.add('da-slot-wait');
        this._animate(this._slot, [{ opacity: 1 }, { opacity: 0.28 }],
          { duration: 420, fill: 'forwards', easing: 'ease-out' });
      }
      // 画笔在卡位附近巡游
      if (this._pen) {
        this._pen.style.opacity = '0.9';
        this._iterPen = this._animate(this._pen, [
          { left: '196px', top: '80px' },
          { left: '332px', top: '122px' },
          { left: '302px', top: '214px' },
          { left: '206px', top: '164px' },
          { left: '196px', top: '80px' },
        ], { duration: 1600, iterations: Infinity, easing: 'linear' });
      }
      // 卡位描线（循环，等新卡）
      this._slotSketch();
      this._later(function () {
        if (!self.active || self._finishing) return;
        if (self._contentQueued) self._finaleIter();
        else if (self._caption) self._caption.textContent = 'AI 正在打磨细节，马上就好…';
      }, this.ITER_END);
      this._guard();
    },

    /* 缩放适配预览容器（含窄屏） */
    _fit: function (host) {
      if (!this._stage || !this._wrap) return;
      var r = host.getBoundingClientRect();
      var availW = Math.max(120, r.width - 48);
      var availH = Math.max(160, r.height - 64); // 给 caption 留空间
      var s = Math.min(availW / W, availH / H, 0.72);
      this._stage.style.transform = 'scale(' + s + ')';
      this._wrap.style.width = (W * s) + 'px';
      this._wrap.style.height = (H * s) + 'px';
    },
    _observeResize: function (host) {
      if (!('ResizeObserver' in window) || this._ro) return;
      var self = this;
      this._ro = new ResizeObserver(function () {
        var h = document.getElementById('wb-preview-card');
        if (h && self._stage) self._fit(h);
      });
      this._ro.observe(host);
    },

    /* ---------- DOM 构建（一次性注入） ---------- */
    _build: function () {
      var stage = this._stage;

      // C：手机屏纯深色底。用户明确不要模糊壁纸，因此这里改为纯色背景层。
      var wall = document.createElement('div');
      wall.className = 'da-wall';
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
      // ② 组件容器
      function fillbox(el, color) {
        el.classList.add('da-fillbox');
        el.style.fill = color;          // 内联 style 覆盖 .da-stroke 的 fill:none
        el.style.fillOpacity = '0';
        return el;
      }
      rect('clockBox', 25, 73, 145, 145, 20); // 时钟位只勾外框不填底，成品图稍后盖上
      fillbox(rect('aiBox', 190.5, 73, 145, 145, 20), 'rgba(46,52,96,0.9)');
      // ② 12 个图标容器（位次0 谷歌文件夹是玻璃底）
      this._iconBoxEls = ICON_BOXES.map(function (p, idx) {
        return fillbox(rect('ib' + idx, p[0], p[1], 55, 55, 16),
          idx === 0 ? 'rgba(255,255,255,0.28)' : 'rgba(255,255,255,0.95)');
      });
      // ② 搜索栏胶囊 / 导航条。分页指示器按需求移除，不参与动画或定格。
      rect('searchOuter', SEARCH_BAR.x, SEARCH_BAR.y, SEARCH_BAR.w, SEARCH_BAR.h, SEARCH_BAR.r);
      rect('nav', 120, 791, 120, 3, 2);

      // ③ 时钟卡成品图（资源类素材，同壁纸：模糊→清晰淡入落位，不描线）
      var clockImg = document.createElement('img');
      clockImg.className = 'da-clockimg';
      clockImg.src = asset('时钟卡成品.png');
      clockImg.alt = '';
      stage.appendChild(clockImg);
      this._clockImg = clockImg;

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
      this._searchIconEls = SEARCH_ICONS.map(function (icon) {
        return img(icon.x, icon.y, icon.w, icon.h, icon.name);
      });
      this._statusBar = img(STATUS_BAR.x, STATUS_BAR.y, STATUS_BAR.w, STATUS_BAR.h, STATUS_BAR.name);
      this._statusBar.classList.add('da-statusbar');

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

      // 画笔光点
      var pen = document.createElement('div');
      pen.className = 'da-pen';
      stage.appendChild(pen);
      this._pen = pen;
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
      var k = this._k || 1;
      function T(ms) { return Math.round(ms * k); }
      // ① 画布起手：底色渐亮 + 外框描线
      this._animate(this._stage, [{ filter: 'brightness(.35)' }, { filter: 'brightness(1)' }], { duration: T(380), fill: 'forwards' });
      this._draw(s.frame, T(80), T(520));
      // ② 骨架勾线
      this._pop(this._statusBar, T(420), T(320), 0.98);
      this._draw(s.clockBox, T(720), T(420));
      this._draw(s.aiBox, T(790), T(420));
      this._iconBoxEls.forEach(function (el, i) { self._draw(el, T(900 + i * 60), T(300)); }); // 波浪式
      this._draw(s.searchOuter, T(1560), T(360));
      this._draw(s.nav, T(1780), T(220));
      // ③ 时钟卡成品图落位：容器框勾完后，模糊→清晰淡入（与壁纸同类资源素材处理，不描线）
      this._animate(this._clockImg, [
        { opacity: 0, filter: 'blur(14px) brightness(1.15)', transform: 'scale(1.06)' },
        { opacity: 1, filter: 'blur(0px) brightness(1)', transform: 'scale(1)' },
      ], { duration: T(680), delay: T(1150), fill: 'forwards', easing: 'ease-out' });
      // ④ 图标点亮：8 主屏 → 9 迷你连爆 → dock4 → 搜索栏3；容器同步「线稿→实体」
      var boxFillDelay = {};
      BIG_ICONS.forEach(function (it, i) {
        var d = i < 7 ? T(1900 + i * 70) : T(2570 + (i - 7) * 70); // 前7个主屏，后4个 dock
        self._pop(self._bigIconEls[i], d, T(260));
        boxFillDelay[it[0]] = d;
      });
      this._miniIconEls.forEach(function (el, i) { self._pop(el, T(2460 + i * 30), T(200), 0.4); });
      this._searchIconEls.forEach(function (el, i) { self._pop(el, T(2780 + i * 60), T(260)); });
      boxFillDelay[0] = T(2440); // 谷歌文件夹玻璃底随迷你图标点亮
      this._iconBoxEls.forEach(function (el, i) {
        var d = boxFillDelay[i] != null ? boxFillDelay[i] : T(2200);
        self._later(function () { el.style.fillOpacity = i === 0 ? '0.6' : '1'; }, d);
      });
      // AI 组件容器随时钟成品图进场；时钟外框稍后淡出让成品图完整呈现。
      this._later(function () {
        if (self._strokes) {
          self._strokes.aiBox.style.fillOpacity = '1';
          self._animate(self._strokes.clockBox, [{ opacity: 1 }, { opacity: 0 }],
            { duration: T(300), delay: T(350), fill: 'forwards' });
        }
      }, T(1500));
      // ⑤ 深色底显现＋标签渐显
      this._animate(this._wall, [
        { opacity: 0 },
        { opacity: 1 },
      ], { duration: T(620), delay: T(2500), fill: 'forwards', easing: 'ease-out' });
      this._labelEls.forEach(function (el, i) {
        self._animate(el, [{ opacity: 0, transform: 'translateY(3px)' }, { opacity: 1, transform: 'translateY(0)' }],
          { duration: T(260), delay: T(2650 + i * 40), fill: 'forwards' });
      });
      // 画笔光点：沿各幕关键位巡游，收在卡位附近
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
        { left: '263px', top: '145px', offset: 1 },
      ], { duration: this._end, fill: 'forwards', easing: 'linear' });
      // 分幕文案
      var capBase = 'AI 正在绘制界面 · ';
      [[0, 0], [420, 1], [900, 2], [1900, 3], [2500, 4]].forEach(function (ph) {
        self._later(function () { if (self._caption) self._caption.textContent = capBase + PHASES[ph[1]]; }, T(ph[0]));
      });
      // 时间线末端：内容就绪则收口，否则进入呼吸等待
      this._later(function () {
        if (!self.active || self._finishing) return;
        if (self._contentQueued) self._finale();
        else self._enterHold();
      }, this._end);
    },

    _enterHold: function () {
      if (!this.active || this._finishing) return;
      if (this._wrap) this._wrap.classList.add('da-hold');
      if (this._pen) this._pen.style.opacity = '';
      if (this._caption) this._caption.textContent = 'AI 正在打磨细节，马上就好…';
    },

    /* ---------- 手机屏卡位（常驻核心） ---------- */
    /* 把 #wb-card 当前内容克隆进手机屏卡位（Figma AI Suggestions 位）。
     * instant=true 直接显示；否则播「描线→填充」落卡动画 */
    _mountCardToSlot: function (instant) {
      if (!this._stage) return;
      this._clearSlotSketch();
      var card = document.getElementById('wb-card');
      var inner = document.getElementById('wb-card-inner');
      var content = inner && inner.firstElementChild;
      var slot = this._slot;
      if (!slot) {
        slot = document.createElement('div');
        slot.className = 'da-slot';
        var bgEl = document.createElement('div');
        bgEl.className = 'da-slot-bg';
        slot.appendChild(bgEl);
        this._stage.appendChild(slot);
        this._slot = slot;
      }
      slot.classList.remove('da-slot-wait');
      var bg = slot.querySelector('.da-slot-bg');
      bg.innerHTML = '';
      bg.style.background = (card && card.style.background) || '#fff';
      if (content) {
        var clone = content.cloneNode(true);
        clone.style.transform = 'scale(' + (SLOT.w / 138) + ')';
        clone.style.transformOrigin = 'top left';
        clone.style.pointerEvents = 'none';
        bg.appendChild(clone);
      }
      if (instant) {
        this._animate(slot, [{ opacity: Number(getComputedStyle(slot).opacity) || 0 }, { opacity: 1 }],
          { duration: 200, fill: 'forwards' });
        return;
      }
      this._sketchReveal(slot);
    },
    /* 迭代等待态：卡位描线循环（紫色勾线反复描画，营造「正在重绘」感） */
    _slotSketch: function () {
      if (!this._stage) return;
      this._clearSlotSketch();
      var svg = svgEl('svg', { 'class': 'da-slot-svg', viewBox: '0 0 ' + W + ' ' + H, width: W, height: H });
      var rc = svgEl('rect', { x: SLOT.x, y: SLOT.y, width: SLOT.w, height: SLOT.h, rx: SLOT.r, ry: SLOT.r, pathLength: 1 });
      svg.appendChild(rc);
      this._stage.appendChild(svg);
      this._slotSketchEl = svg;
      this._animate(rc, [
        { strokeDashoffset: 1, opacity: 1 },
        { strokeDashoffset: 0, opacity: 1, offset: 0.55 },
        { strokeDashoffset: 0, opacity: 0 },
      ], { duration: 1400, iterations: Infinity, easing: 'ease-in-out' });
    },
    _clearSlotSketch: function () {
      if (this._slotSketchEl) {
        if (this._slotSketchEl.parentNode) this._slotSketchEl.parentNode.removeChild(this._slotSketchEl);
        this._slotSketchEl = null;
      }
    },

    /* 卡位描线 → 卡片淡入 → 白闪填充 */
    _sketchReveal: function (slot) {
      var svg = svgEl('svg', { 'class': 'da-slot-svg', viewBox: '0 0 ' + W + ' ' + H, width: W, height: H });
      var rc = svgEl('rect', { x: SLOT.x, y: SLOT.y, width: SLOT.w, height: SLOT.h, rx: SLOT.r, ry: SLOT.r, pathLength: 1 });
      svg.appendChild(rc);
      this._stage.appendChild(svg);
      this._animate(rc, [{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }],
        { duration: 340, fill: 'forwards', easing: 'cubic-bezier(.45,.05,.35,1)' });
      var from = Number(getComputedStyle(slot).opacity) || 0;
      this._animate(slot, [
        { opacity: from, transform: 'scale(.94)' },
        { opacity: 1, transform: 'scale(1)' },
      ], { duration: 380, delay: 240, fill: 'forwards', easing: 'ease-out' });
      this._animate(rc, [
        { fill: 'rgba(255,255,255,0)' }, { fill: 'rgba(255,255,255,.55)' }, { fill: 'rgba(255,255,255,0)' },
      ], { duration: 420, delay: 300, fill: 'forwards' });
      this._later(function () { if (svg.parentNode) svg.parentNode.removeChild(svg); }, 950);
    },

    /* ---------- 收口 ---------- */
    /* ⑥ 全幕收口：卡片描线落到手机屏卡位，手机界面定格为常驻预览 */
    _finale: function () {
      if (!this.active || this._finishing) return;
      this._finishing = true;
      if (this._wrap) this._wrap.classList.remove('da-hold');
      if (this._pen) this._pen.style.opacity = '0';
      if (this._caption) this._caption.textContent = '完成 ✨';
      var self = this;
      requestAnimationFrame(function () {
        self._mountCardToSlot(false);
        self._later(function () { self._settle(); }, 980);
      });
    },
    /* 迭代短版收口：新卡原位描线刷新 */
    _finaleIter: function () {
      if (!this.active || this._finishing) return;
      this._finishing = true;
      if (this._iterPen) { try { this._iterPen.cancel(); } catch (e) {} this._iterPen = null; }
      if (this._pen) this._pen.style.opacity = '0';
      if (this._caption) this._caption.textContent = '完成 ✨';
      var self = this;
      requestAnimationFrame(function () {
        self._mountCardToSlot(false);
        self._later(function () { self._settle(); }, 980);
      });
    },
    /* 定格：手机界面转为常驻预览底，动画状态复位 */
    _settle: function () {
      this.persistent = true;
      this.active = false;
      this._finishing = false;
      this._iterMode = false;
      if (this._watch) { clearInterval(this._watch); this._watch = null; }
      var cap = this._caption;
      if (cap) this._timers.push(setTimeout(function () { cap.style.opacity = '0'; }, 700));
    },
    /* 迭代取消（闲聊回复/迭代报错）：恢复旧卡，手机保留 */
    _cancelIteration: function () {
      this.active = false;
      this._finishing = false;
      this._iterMode = false;
      this._clearSlotSketch();
      if (this._iterPen) { try { this._iterPen.cancel(); } catch (e) {} this._iterPen = null; }
      if (this._pen) this._pen.style.opacity = '0';
      if (this._slot) {
        this._slot.classList.remove('da-slot-wait');
        this._animate(this._slot, [{ opacity: 0.28 }, { opacity: 1 }], { duration: 300, fill: 'forwards' });
      }
      if (this._caption) this._caption.style.opacity = '0';
      if (this._watch) { clearInterval(this._watch); this._watch = null; }
    },

    /* ---------- 外部信号 ---------- */
    /* renderWbCard 完成 → 按当前状态路由收口/刷新 */
    onCardRendered: function () {
      if (!this.enabled() || !wbActive()) return;
      if (this.active && !this._finishing) {
        var elapsed = performance.now() - this._startAt;
        if (elapsed < this._end) { this._contentQueued = true; return; }
        if (this._iterMode) this._finaleIter();
        else this._finale();
        return;
      }
      if (this.persistent && this._root && !this.active) {
        // 手机常驻、无动画在播（版本历史切换 / A/B 选定 / 回到工作台）→ 原位描线刷新
        if (this._suspended) this.resume();
        this._variantsMode = false;
        this._mountCardToSlot(false);
        return;
      }
      if (this._variantsMode) {
        // A/B 对比期间手机被撤 → 选定后快速重播全幕（0.3x）定格回手机
        this._variantsMode = false;
        this.start({ fast: true, preloaded: true });
      }
    },
    /* 兼容旧接口 */
    contentReady: function () { this.onCardRendered(); },

    /* A/B 方案对比登场 → 手机让位（对比卡需要舞台） */
    onVariants: function () {
      this._variantsMode = true;
      if (this.active && !this._finishing) {
        if (this._iterMode) this._cancelIteration();
        else { this._finishing = true; this._exit(); return; }
      }
      if (this.persistent) this.suspend();
    },
    /* 常驻手机暂时淡出（保留 DOM，随后 resume 恢复） */
    suspend: function () {
      if (!this._root || this._suspended) return;
      this._suspended = true;
      this._root.classList.add('da-out');
      var self = this;
      this._timers.push(setTimeout(function () {
        if (self._root && self._suspended) self._root.style.display = 'none';
      }, 400));
    },
    resume: function () {
      if (!this._root || !this._suspended) return;
      this._suspended = false;
      this._root.style.display = '';
      var self = this;
      requestAnimationFrame(function () {
        if (self._root) self._root.classList.remove('da-out');
      });
    },

    /* 无卡回复（闲聊/追问）/导航离开：全幕退场；迭代短版取消并恢复旧卡（手机保留） */
    abort: function () {
      if (!this.active || this._finishing) return;
      if (this._iterMode) { this._cancelIteration(); return; }
      this._finishing = true;
      this._exit();
    },
    /* 真实错误（API/网络）→ 手机整体退场，露出底下的错误提示 */
    errorAbort: function () {
      if (this._finishing) return;
      if (this.active && this._iterMode) this._cancelIteration();
      if (!this._root) return;
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
      if (this._ro) { this._ro.disconnect(); this._ro = null; }
      if (this._root && this._root.parentNode) this._root.parentNode.removeChild(this._root);
      this._root = this._stage = this._wrap = this._svg = this._caption = this._pen = null;
      this._iconBoxEls = this._bigIconEls = this._miniIconEls = this._searchIconEls = null;
      this._statusBar = null;
      this._labelEls = this._wall = this._clockImg = null;
      this._strokes = null; this._slot = null; this._iterPen = null; this._slotSketchEl = null;
      this.active = false;
      this.persistent = false;
      this._suspended = false;
      this._iterMode = false;
      // 注：_variantsMode 不在此重置 —— 首次生成返回 A/B 时过场层会 exit，
      // 但标记需存活到用户选定方案后触发快放重播定格回手机（start() 会显式清）
      if (!silent) this._finishing = false;
    },

    /* 守护：错误提示出现 / 播放中离开工作台 / 超时 → abort */
    _guard: function () {
      var self = this;
      if (this._observer) { this._observer.disconnect(); this._observer = null; }
      if (this._watch) { clearInterval(this._watch); this._watch = null; }
      var wbLoading = document.getElementById('wb-loading');
      if (wbLoading && 'MutationObserver' in window) {
        this._observer = new MutationObserver(function () {
          // 任何代码把 wb-loading 以「无 spinner」形态重新显示 = 错误态
          var shown = wbLoading.style.display !== 'none' && wbLoading.style.display !== '';
          if (!shown) return;
          var spinner = wbLoading.querySelector('.wb-spinner');
          var spinnerHidden = !spinner || spinner.style.display === 'none';
          if (!spinnerHidden) return;
          self.errorAbort(); // 报错：撤下过场/常驻手机，露出错误提示
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
      // 每次生成（含迭代改卡）都播；首播全幕，手机常驻后播迭代短版；空输入不播；
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
          // 过场动画/常驻手机替代默认 spinner
          var wl = document.getElementById('wb-loading');
          if (wl && (DrawAnim.active || DrawAnim.persistent)) wl.style.display = 'none';
        }
        return r;
      };
    }

    var _renderCard = window.renderWbCard;
    if (typeof _renderCard === 'function') {
      window.renderWbCard = function () {
        var r = _renderCard.apply(this, arguments);
        try { DrawAnim.onCardRendered(); } catch (e) {}
        return r;
      };
    }
    var _renderVariants = window.renderWbVariants;
    if (typeof _renderVariants === 'function') {
      window.renderWbVariants = function () {
        try { DrawAnim.onVariants(); } catch (e) {}
        return _renderVariants.apply(this, arguments);
      };
    }

    // 失败路径：核心步骤报错（API 错误 / 网络错误）→ 动画优雅退场，露出原错误提示。
    // 'illust' 报错除外（插图失败仍会渲染兜底卡片，等 renderWbCard 正常收口）。
    var _updateStep = window.updateStep;
    if (typeof _updateStep === 'function') {
      window.updateStep = function (stepId, status) {
        var r = _updateStep.apply(this, arguments);
        // 'render' 报错除外：那是「回复里没卡」的闲聊路径（updateStepsFromResponse 末尾标 render=error），
        // 由下方 updateStepsFromResponse 包装走 abort() 软处理，常驻手机保留。
        if (status === 'error' && stepId !== 'illust' && stepId !== 'render') {
          try { DrawAnim.errorAbort(); } catch (e) {}
        }
        return r;
      };
    }

    // AI 回复里没有 card-update（闲聊/追问）→ 没卡可登场：
    // 全幕动画直接退场；迭代短版取消并恢复旧卡（手机保留）。
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
