/* TF — преобразования графиков для ДЗ по разделу 5.
   Шесть движений (op.t):
     "in"   y = f(x + v)    сдвиг по оси x: v > 0 — влево, v < 0 — вправо
     "out"  y = f(x) + v    сдвиг по оси y: v > 0 — вверх
     "a"    y = v·f(x)      растяжение/сжатие от оси x, v < 0 — ещё и отражение
     "k"    y = f(v·x)      сжатие/растяжение к оси y, v < 0 — ещё и отражение
     "absx" y = f(|x|)      правая половина + её отражение влево
     "abs"  y = |f(x)|      всё, что ниже оси x, отражается вверх
   Плюс доска TF.board: ученик ставит точки и рисует график карандашом. */
(function () {
  "use strict";
  var h = UI.h, m = UI.m;

  function wrap(i) { return /^(x|\|x\|)$/.test(i) ? i : "(" + i + ")"; }
  function num(v) { return String(Math.round(v * 1000) / 1000); }
  function pre(v) { return v === 1 ? "" : v === -1 ? "-" : num(v); }

  var BASES = {
    x: { name: "x", f: function (x) { return x; }, tpl: function (i) { return i; },
      pts: [[-4, -4], [-3, -3], [-2, -2], [-1, -1], [0, 0], [1, 1], [2, 2], [3, 3], [4, 4]], anchor: [0, 0], anchorName: "точка, в которую переехало начало координат (0; 0)" },
    sq: { name: "x²", f: function (x) { return x * x; }, tpl: function (i) { return wrap(i) + "^2"; },
      pts: [[-3, 9], [-2, 4], [-1, 1], [0, 0], [1, 1], [2, 4], [3, 9]], anchor: [0, 0], anchorName: "вершина" },
    cube: { name: "x³", f: function (x) { return x * x * x; }, tpl: function (i) { return wrap(i) + "^3"; },
      pts: [[-2, -8], [-1, -1], [0, 0], [1, 1], [2, 8]], anchor: [0, 0], anchorName: "центр симметрии" },
    sqrt: { name: "√x", f: function (x) { return x < 0 ? NaN : Math.sqrt(x); }, tpl: function (i) { return "sqrt(" + i + ")"; },
      pts: [[0, 0], [1, 1], [4, 2], [9, 3]], anchor: [0, 0], anchorName: "начало графика" },
    inv: { name: "1/x", f: function (x) { return x === 0 ? NaN : 1 / x; }, tpl: function (i) { return "1/" + wrap(i); },
      pts: [[-4, -0.25], [-2, -0.5], [-1, -1], [-0.5, -2], [0.5, 2], [1, 1], [2, 0.5], [4, 0.25]], anchor: null, anchorName: "центр (пересечение асимптот)", asym: { v: [0], h: [0] } }
  };
  var ORDER = ["x", "sq", "cube", "sqrt", "inv"];

  /* ---------- функции и точки ---------- */
  function apply(f, op) {
    var v = op.v;
    switch (op.t) {
      case "in": return function (x) { return f(x + v); };
      case "out": return function (x) { return f(x) + v; };
      case "a": return function (x) { return v * f(x); };
      case "k": return function (x) { return f(v * x); };
      case "absx": return function (x) { return f(Math.abs(x)); };
      case "abs": return function (x) { return Math.abs(f(x)); };
    }
    return f;
  }
  function mapPt(p, op) {
    switch (op.t) {
      case "in": return [p[0] - op.v, p[1]];
      case "out": return [p[0], p[1] + op.v];
      case "a": return [p[0], op.v * p[1]];
      case "k": return [p[0] / op.v, p[1]];
      case "abs": return [p[0], Math.abs(p[1])];
      case "absx": return p[0] >= 0 ? [p[0], p[1]] : null;
    }
    return p;
  }
  function onGrid(v) { return Math.abs(v * 2 - Math.round(v * 2)) < 1e-9; }
  function zerosOnGrid(f) {
    var out = [];
    for (var x = -15; x <= 15; x += 0.5) { var y = f(x); if (!isNaN(y) && Math.abs(y) < 1e-9) out.push([x, 0]); }
    return out;
  }
  function uniq(list) {
    var res = [];
    list.forEach(function (p) {
      if (!res.some(function (q) { return Math.abs(q[0] - p[0]) < 1e-9 && Math.abs(q[1] - p[1]) < 1e-9; })) res.push(p);
    });
    return res;
  }

  /* Цепочка состояний: base → op1 → op2 …
     Каждое состояние: { f, pts, keys: [[x, y, label]], asym: {v: [], h: []} } */
  function chain(baseKey, ops) {
    var B = BASES[baseKey];
    var st = {
      f: B.f, pts: B.pts.slice(),
      keys: B.anchor ? [[B.anchor[0], B.anchor[1], B.anchorName]] : [],
      asym: B.asym ? { v: B.asym.v.slice(), h: B.asym.h.slice() } : { v: [], h: [] }
    };
    var out = [st];
    ops.forEach(function (op) {
      var prev = out[out.length - 1], f = apply(prev.f, op);
      var pts = [], keys = [], asym = { v: [], h: [] };
      prev.pts.forEach(function (p) {
        var q = mapPt(p, op);
        if (q) pts.push(q);
        if (op.t === "absx" && p[0] > 0) pts.push([-p[0], p[1]]);
      });
      prev.keys.forEach(function (k) {
        var q = mapPt(k, op);
        if (q) keys.push([q[0], q[1], k[2]]);
        if (op.t === "absx" && k[0] > 0) keys.push([-k[0], k[1], k[2]]);
      });
      if (op.t === "abs") {
        zerosOnGrid(prev.f).forEach(function (z) { keys.push([z[0], 0, "точка на оси x (там график «отражается»)"]); pts.push(z); });
      }
      if (op.t === "absx") {
        var y0 = f(0);
        if (!isNaN(y0)) { keys.push([0, y0, "точка на оси y (там график «сгибается»)"]); pts.push([0, y0]); }
      }
      prev.asym.v.forEach(function (v) {
        if (op.t === "in") asym.v.push(v - op.v);
        else if (op.t === "k") asym.v.push(v / op.v);
        else if (op.t === "absx") { if (v > 0) asym.v.push(v, -v); else if (v === 0) asym.v.push(0); }
        else asym.v.push(v);
      });
      prev.asym.h.forEach(function (y) {
        if (op.t === "out") asym.h.push(y + op.v);
        else if (op.t === "a") asym.h.push(y * op.v);
        else if (op.t === "abs") asym.h.push(Math.abs(y));
        else asym.h.push(y);
      });
      out.push({ f: f, pts: uniq(pts), keys: uniq(keys).map(function (k) {
        var src = keys.filter(function (q) { return Math.abs(q[0] - k[0]) < 1e-9 && Math.abs(q[1] - k[1]) < 1e-9; })[0];
        return [k[0], k[1], src[2]];
      }), asym: asym });
    });
    return out;
  }

  /* ---------- словами ---------- */
  function raz(n) { return n === 2 || n === 3 || n === 4 ? "раза" : "раз"; }
  function f2(v) { return UI.fmt(v); }
  function describe(op) {
    var v = op.v, a = Math.abs(v);
    switch (op.t) {
      case "in": return v > 0 ? "сдвиг влево на " + f2(a) : "сдвиг вправо на " + f2(a);
      case "out": return v > 0 ? "сдвиг вверх на " + f2(a) : "сдвиг вниз на " + f2(a);
      case "a":
        if (v === -1) return "отражение относительно оси x";
        var s = a > 1 ? "растяжение от оси x в " + f2(a) + " " + raz(a) : "сжатие к оси x в " + f2(1 / a) + " " + raz(1 / a);
        return v < 0 ? "отражение относительно оси x и " + s : s;
      case "k":
        if (v === -1) return "отражение относительно оси y";
        var t = a > 1 ? "сжатие к оси y в " + f2(a) + " " + raz(a) : "растяжение от оси y в " + f2(1 / a) + " " + raz(1 / a);
        return v < 0 ? "отражение относительно оси y и " + t : t;
      case "absx": return "правую половину оставить, левую заменить её отражением относительно оси y";
      case "abs": return "часть графика ниже оси x отразить вверх";
    }
    return "";
  }
  /* Неправильные варианты — типичные путаницы */
  function wrongs(op) {
    var v = op.v, a = Math.abs(v);
    switch (op.t) {
      case "in": return [describe({ t: "in", v: -v }), (v > 0 ? "сдвиг вверх на " : "сдвиг вниз на ") + f2(a), (v > 0 ? "сдвиг вниз на " : "сдвиг вверх на ") + f2(a)];
      case "out": return [describe({ t: "out", v: -v }), (v > 0 ? "сдвиг вправо на " : "сдвиг влево на ") + f2(a), (v > 0 ? "сдвиг влево на " : "сдвиг вправо на ") + f2(a)];
      case "a":
        if (v === -1) return ["отражение относительно оси y", describe({ t: "abs" }), "сдвиг вниз на 1"];
        return [describe({ t: "k", v: v }), describe({ t: "a", v: v < 0 ? a : 1 / v }), (v > 0 ? "сдвиг вверх на " : "сдвиг вниз на ") + f2(a)];
      case "k":
        if (v === -1) return ["отражение относительно оси x", describe({ t: "absx" }), "сдвиг вправо на 1"];
        return [describe({ t: "a", v: v }), describe({ t: "k", v: v < 0 ? a : 1 / v }), (v > 0 ? "сдвиг влево на " : "сдвиг вправо на ") + f2(a)];
      case "absx": return [describe({ t: "abs" }), "отражение всего графика относительно оси y", "отражение всего графика относительно оси x"];
      case "abs": return [describe({ t: "absx" }), "отражение всего графика относительно оси x", "часть графика выше оси x отразить вниз"];
    }
    return [];
  }

  /* y = a·f(x − p) + q, с модулями: absx — f(|x| − p), abs — |…| снаружи */
  function build(baseKey, p) {
    var B = BASES[baseKey];
    var xx = p.absx ? "|x|" : "x";
    var inner = !p.p ? xx : xx + (p.p > 0 ? "-" : "+") + num(Math.abs(p.p));
    var a = p.a === undefined ? 1 : p.a, s;
    if (baseKey === "inv") s = (a < 0 ? "-" : "") + num(Math.abs(a)) + "/" + wrap(inner);
    else s = pre(a) + B.tpl(inner);
    if (p.q) s += (p.q > 0 ? "+" : "-") + num(Math.abs(p.q));
    if (p.abs) s = "|" + s + "|";
    return s;
  }
  function fnOf(baseKey, p) {
    var f = BASES[baseKey].f, a = p.a === undefined ? 1 : p.a;
    return function (x) {
      var X = p.absx ? Math.abs(x) : x, y = a * f(X - (p.p || 0)) + (p.q || 0);
      return p.abs ? Math.abs(y) : y;
    };
  }

  /* мини-график: серый пунктир — исходный, розовый — результат */
  function mini2(src, res, o) {
    o = o || {};
    var list = [], colors = [];
    if (src) { list.push(src); colors.push("rgba(29, 32, 51, 0.32)"); }
    list.push(res); colors.push(o.color || "#e23468");
    return UI.mini(list, { colors: colors, r: o.r, h: o.h });
  }

  /* ---------- доска для ручного построения ----------
     o: { x, y,                     окно
          target: f,                что надо построить
          keys: [[x, y, label]],    обязательные точки
          pts: [[x, y]],            точки для «Показать ответ»
          ghosts: [{ f, pts, color }], предыдущие шаги (пунктир)
          splits: [x],              асимптоты/сгибы: нужно ≥ 2 точек с каждой стороны
          minPts, hint, onDone(peeked) } */
  function board(o) {
    var phase = "pts", pts = [], strokes = [], cur = null, fails = 0, peeked = false, P = null;
    var pb = UI.plotBox({ x: o.x, y: o.y, draggable: true, unitGrid: true, onDown: down, onMove: move });
    var msg = h("div", { class: "brd__msg" });
    var bPts = h("button", { class: "chip is-on", html: "📍 Точки", onclick: function () { setTool("pts"); } });
    var bPen = h("button", { class: "chip", html: "✏️ Карандаш", disabled: true, onclick: function () { setTool("pen"); } });
    var tool = "pts";
    var bCheck = h("button", { class: "btn btn--primary btn--sm", text: "Проверить точки", onclick: check });
    var bClear = h("button", { class: "btn btn--ghost btn--sm", text: "Стереть точки", onclick: clear });
    var bShow = h("button", { class: "btn btn--ghost btn--sm", text: "👀 Показать ответ", style: "display:none", onclick: showAnswer });
    var bar = h("div", { class: "brd__bar" }, h("div", { class: "btns" }, bPts, bPen), h("div", { class: "btns" }, bCheck, bClear, bShow));
    var keys = (o.keys || []).filter(function (k) { return inView(k[0], k[1]) && onGrid(k[0]) && onGrid(k[1]); });
    var minPts = o.minPts || 5;

    function inView(x, y) { return x >= o.x[0] && x <= o.x[1] && y >= o.y[0] && y <= o.y[1]; }
    function setTool(t) {
      tool = t;
      bPts.classList.toggle("is-on", t === "pts"); bPen.classList.toggle("is-on", t === "pen");
      if (P) P.canvas.style.cursor = t === "pen" ? "crosshair" : "pointer";
    }
    function say(html, kind) { msg.className = "brd__msg" + (kind ? " brd__msg--" + kind : ""); msg.innerHTML = html; }

    function down(wx, wy) {
      if (phase === "done") return;
      if (tool === "pts") {
        if (phase !== "pts") { say("Точки уже приняты. Теперь карандаш ✏️ — соедини их линией.", "info"); return; }
        var x = Math.round(wx * 2) / 2, y = Math.round(wy * 2) / 2;
        var i = pts.findIndex(function (p) { return Math.abs(p.x - x) < 0.01 && Math.abs(p.y - y) < 0.01; });
        if (i >= 0) pts.splice(i, 1); else pts.push({ x: x, y: y, st: null });
        render();
      } else {
        cur = [[wx, wy]]; strokes.push({ pts: cur, bad: null }); render();
      }
    }
    function move(wx, wy) {
      if (!cur) return;
      var last = cur[cur.length - 1];
      if (Math.hypot((wx - last[0]) * P.sx, (wy - last[1]) * P.sx) < 3) return;
      cur.push([wx, wy]); render();
    }
    function up() { cur = null; }

    function render() {
      if (!P) return;
      var L = [];
      (o.ghosts || []).forEach(function (g) {
        L.push({ type: "fn", f: g.f, color: g.color || "rgba(29, 32, 51, 0.35)", dash: [7, 6], width: 2.5 });
        (g.pts || []).forEach(function (p) { if (inView(p[0], p[1])) L.push({ type: "point", x: p[0], y: p[1], r: 3.5, color: "rgba(29, 32, 51, 0.35)" }); });
      });
      (o.asymV || []).forEach(function (v) { L.push({ type: "vline", x: v, color: "rgba(122, 85, 240, 0.45)", width: 1.5 }); });
      (o.asymH || []).forEach(function (v) { L.push({ type: "hline", y: v, color: "rgba(122, 85, 240, 0.45)", width: 1.5 }); });
      if (phase === "done") L.push({ type: "fn", f: o.target, color: "#17a34a", width: 3, alpha: 0.75 });
      L.push({ type: "custom", draw: function (c, pl) {
        c.lineCap = "round"; c.lineJoin = "round"; c.lineWidth = 3.5;
        strokes.forEach(function (s) {
          for (var i = 1; i < s.pts.length; i++) {
            c.strokeStyle = s.bad && (s.bad[i] || s.bad[i - 1]) ? "#e23468" : "#0a8bd0";
            c.beginPath(); c.moveTo(pl.X(s.pts[i - 1][0]), pl.Y(s.pts[i - 1][1])); c.lineTo(pl.X(s.pts[i][0]), pl.Y(s.pts[i][1])); c.stroke();
          }
          if (s.pts.length === 1) { c.fillStyle = "#0a8bd0"; c.beginPath(); c.arc(pl.X(s.pts[0][0]), pl.Y(s.pts[0][1]), 2, 0, 7); c.fill(); }
        });
      } });
      pts.forEach(function (p) {
        L.push({ type: "point", x: p.x, y: p.y, r: 6, color: p.st === "ok" ? "#17a34a" : p.st === "bad" ? "#e23468" : "#1d2033" });
      });
      P.layers = L; P.draw();
    }

    function near(a, b) { return Math.abs(a[0] - b[0]) < 0.01 && Math.abs(a[1] - b[1]) < 0.01; }
    function fail() { fails++; if (fails >= 2) bShow.style.display = ""; }

    function check() {
      if (phase === "pts") checkPts(); else if (phase === "pen") checkPen();
    }
    function checkPts() {
      if (!pts.length) { say("Сначала отметь точки: кликай по пересечениям клеток. Клик по точке ещё раз — убрать её.", "bad"); return; }
      var bad = 0;
      pts.forEach(function (p) {
        var y = o.target(p.x);
        p.st = !isNaN(y) && Math.abs(y - p.y) < 0.13 ? "ok" : "bad";
        if (p.st === "bad") bad++;
      });
      render();
      if (bad) {
        fail();
        say("Красные точки (" + bad + ") не лежат на графике этого шага. Подставь их x в формулу шага и сравни y. Клик по точке убирает её.", "bad");
        return;
      }
      var miss = keys.filter(function (k) { return !pts.some(function (p) { return near([p.x, p.y], k); }); });
      if (miss.length) {
        fail();
        var names = miss.map(function (k) { return k[2]; }).filter(function (v, i, a) { return a.indexOf(v) === i; });
        say("Все точки верные, но не хватает главного: <b>" + names.join("</b>, <b>") + "</b>" + (miss.length > 1 ? " (всего таких точек " + miss.length + ")" : "") + ". Найди и отметь.", "bad");
        return;
      }
      if (pts.length < minPts) { say("Точки верные, но их мало. Нужно хотя бы " + minPts + ", чтобы было видно форму графика.", "bad"); return; }
      var side = (o.splits || []).filter(function (s) {
        var l = pts.filter(function (p) { return p.x < s - 1e-9; }).length, r = pts.filter(function (p) { return p.x > s + 1e-9; }).length;
        return l < 2 || r < 2;
      });
      if (side.length) { say("Нужны точки на обеих частях графика: хотя бы по две слева и справа от x = " + UI.fmt(side[0]) + ".", "bad"); return; }
      phase = "pen"; bPen.disabled = false; setTool("pen");
      bCheck.textContent = "Проверить линию"; bClear.textContent = "Стереть линию";
      say("✓ Точки на месте! Теперь <b>карандаш</b>: зажми и веди, соедини точки плавной линией. Можно несколькими штрихами" + (o.splits && o.splits.length ? ", через асимптоту линию не тяни" : "") + ".", "ok");
    }

    function targetSamples() {
      var T = [], x0 = o.x[0] - 0.5, x1 = o.x[1] + 0.5;
      for (var x = x0; x <= x1; x += 0.004) {
        var y = o.target(x);
        if (!isNaN(y) && y > o.y[0] - 3 && y < o.y[1] + 3) T.push([x, y]);
      }
      return T;
    }
    function checkPen() {
      var all = [];
      strokes.forEach(function (s) { all = all.concat(s.pts); });
      if (all.length < 8) { say("Нарисуй линию: выбери ✏️ и веди, зажав кнопку мыши (или пальцем).", "bad"); return; }
      var T = targetSamples(), tol = 0.33, okN = 0;
      function dist(p) {
        var best = Infinity;
        for (var i = 0; i < T.length; i++) { var dx = T[i][0] - p[0]; if (dx > best || -dx > best) continue; var d = Math.hypot(dx, T[i][1] - p[1]); if (d < best) best = d; }
        return best;
      }
      strokes.forEach(function (s) {
        s.bad = s.pts.map(function (p) { var b = dist(p) > tol; if (!b) okN++; return b; });
      });
      var frac = okN / all.length;
      var lonely = pts.filter(function (p) { return !all.some(function (q) { return Math.hypot(q[0] - p.x, q[1] - p.y) < 0.5; }); });
      render();
      if (frac < 0.85) { fail(); say("Линия заметно уходит от графика (эти места красные). Сотри и нарисуй ещё раз. Вспомни форму: " + (o.hint || "как выглядит базовый график") + ".", "bad"); return; }
      if (lonely.length) { fail(); say("Линия проходит не через все твои точки: осталось " + lonely.length + ". Дорисуй.", "bad"); return; }
      finish(false);
    }
    function finish(peek) {
      phase = "done"; peeked = peeked || peek;
      bCheck.style.display = "none"; bClear.style.display = "none"; bShow.style.display = "none";
      bPen.disabled = true; bPts.disabled = true;
      render();
      say(peek ? "Вот как надо: зелёная линия — правильный график, точки — удобные для построения. Разберись и иди дальше." : "🎯 Отлично! Зелёная линия — точный график, твоя синяя легла на него.", peek ? "info" : "ok");
      if (o.onDone) o.onDone(peeked);
    }
    function showAnswer() {
      peeked = true;
      var ans = (o.pts || []).filter(function (p) { return inView(p[0], p[1]) && onGrid(p[0]) && onGrid(p[1]); });
      keys.forEach(function (k) { if (!ans.some(function (p) { return near(p, k); })) ans.push(k); });
      pts = ans.map(function (p) { return { x: p[0], y: p[1], st: "ok" }; });
      strokes = [];
      finish(true);
    }
    function clear() {
      if (phase === "pts") pts = []; else strokes = [];
      say("", null); render();
    }

    var el = h("div", { class: "brd" }, bar, pb.el, msg);
    return {
      el: el,
      mount: function () {
        P = pb.mount();
        P.canvas.addEventListener("pointerup", up);
        P.canvas.addEventListener("pointercancel", up);
        setTool("pts");
        say(o.intro || "Кликай по клеткам — ставь точки графика. Клик по точке ещё раз — убрать её.", "info");
        render();
      },
      peeked: function () { return peeked; }
    };
  }

  window.TF = {
    BASES: BASES, ORDER: ORDER, wrap: wrap, num: num, pre: pre,
    apply: apply, mapPt: mapPt, chain: chain, describe: describe, wrongs: wrongs,
    build: build, fnOf: fnOf, mini2: mini2, board: board, onGrid: onGrid
  };
})();
