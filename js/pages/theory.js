/* Шпаргалка: шесть преобразований, анимации, все базовые функции, порядок шагов. */
(function () {
  "use strict";
  var h = UI.h, m = UI.m, B = TF.BASES;

  /* ---------- 1. правила ---------- */
  var RULES = [
    { f: "y=f(x+b)", t: "Сдвиг <b>вдоль оси x на b влево</b> (если b > 0) или на |b| вправо (если b < 0). Знак «наоборот»: " + m("f(x+3)") + " — влево на 3, " + m("f(x-3)") + " — вправо на 3.",
      p: "(x₀; y₀) → (x₀ − b; y₀)" },
    { f: "y=f(x)+c", t: "Сдвиг <b>вдоль оси y на c вверх</b> (если c > 0) или на |c| вниз. Знак «честный».",
      p: "(x₀; y₀) → (x₀; y₀ + c)" },
    { f: "y=a·f(x)", t: "<b>Растяжение от оси x</b> в a раз при a > 1, <b>сжатие к оси x</b> при 0 < a < 1. При a < 0 ещё и <b>отражение относительно оси x</b>. Точки на оси x <b>не двигаются</b> — вершина " + m("y=x^2") + " остаётся в (0; 0).",
      p: "(x₀; y₀) → (x₀; a·y₀)" },
    { f: "y=f(kx)", t: "<b>Сжатие к оси y</b> в k раз при k > 1, <b>растяжение от оси y</b> при 0 < k < 1. При k < 0 ещё и <b>отражение относительно оси y</b>. Точки на оси y <b>не двигаются</b> — вершина тоже на месте.",
      p: "(x₀; y₀) → (x₀ : k; y₀)" },
    { f: "y=f(|x|)", t: "Часть графика <b>справа от оси y оставляем</b>, левую <b>стираем</b> и рисуем вместо неё <b>зеркальную копию правой</b> (отражение относительно оси y). График становится симметричным относительно оси y.",
      p: "(x₀; y₀) при x₀ ≥ 0 остаётся, и появляется (−x₀; y₀)" },
    { f: "y=|f(x)|", t: "Часть графика <b>над осью x оставляем</b>, а то, что <b>под осью x, отражаем вверх</b> (относительно оси x). Ниже оси x ничего не остаётся.",
      p: "(x₀; y₀) → (x₀; |y₀|)" }
  ];

  function rules() {
    var g = h("div", { class: "rules" });
    RULES.forEach(function (r, i) {
      g.appendChild(h("div", { class: "rule" },
        h("div", { class: "rule__n", text: i + 1 }),
        h("div", { class: "rule__f", html: m(r.f) }),
        h("div", { class: "rule__t", html: r.t }),
        h("div", { class: "rule__p", html: "Точка: " + r.p })));
    });
    return g;
  }

  /* ---------- 2. анимации ---------- */
  var TR = [
    { id: "in", label: "f(x + b)", name: "b", vals: [3, 1, -2, -4] },
    { id: "out", label: "f(x) + c", name: "c", vals: [2, 1, -1, -3] },
    { id: "a", label: "a·f(x)", name: "a", vals: [2, 3, 0.5, -1, -2] },
    { id: "k", label: "f(kx)", name: "k", vals: [2, 3, 0.5, -1] },
    { id: "absx", label: "f(|x|)" },
    { id: "abs", label: "|f(x)|" }
  ];
  /* Для модулей у самих базовых функций часто «ничего не происходит» — берём сдвинутую версию */
  var SRC = {
    x: { abs: "x-2", absx: "x-2" },
    sq: { abs: "x^2-3", absx: "(x-2)^2-1" },
    cube: { abs: "x^3-1", absx: "(x-1)^3" },
    sqrt: { abs: "sqrt(x)-2", absx: "sqrt(x-1)" },
    inv: { abs: "1/x-1", absx: "1/(x-1)" }
  };

  function resultFormula(bk, tr, v) {
    var b = B[bk];
    if (tr === "in") return b.tpl("x" + (v > 0 ? "+" : "-") + TF.num(Math.abs(v)));
    if (tr === "out") return b.tpl("x") + (v > 0 ? "+" : "-") + TF.num(Math.abs(v));
    if (tr === "a") return bk === "inv" ? (v < 0 ? "-" : "") + TF.num(Math.abs(v)) + "/x" : TF.pre(v) + b.tpl("x");
    if (tr === "k") return b.tpl(TF.pre(v) + "x");
    if (tr === "absx") return SRC[bk].absx.replace(/x/g, "|x|");
    if (tr === "abs") return "|" + SRC[bk].abs + "|";
  }

  function explain(bk, tr, v) {
    var b = B[bk], anchor = bk === "inv" ? "центр (пересечение асимптот)" : SHORT[bk] + " (0; 0)";
    var res = "y=" + resultFormula(bk, tr, v), fx = "f(x)=" + b.tpl("x");
    var s = "<p>" + m(fx) + " → " + m(res) + "</p>";
    if (tr === "in") s += "<p>Каждая точка уезжает " + (v > 0 ? "<b>влево на " + UI.fmt(v) + "</b>" : "<b>вправо на " + UI.fmt(-v) + "</b>") + ": (x₀; y₀) → (x₀ " + (v > 0 ? "−" : "+") + " " + UI.fmt(Math.abs(v)) + "; y₀). " + cap(anchor) + " → (" + UI.fmt(-v) + "; 0).</p><p>Почему наоборот? Значение, которое у f было при x = 0, новая функция получает, когда x " + (v > 0 ? "+" : "−") + " " + UI.fmt(Math.abs(v)) + " = 0, то есть при x = " + UI.fmt(-v) + ".</p>";
    if (tr === "out") s += "<p>Каждая точка уезжает " + (v > 0 ? "<b>вверх на " + UI.fmt(v) + "</b>" : "<b>вниз на " + UI.fmt(-v) + "</b>") + ": к каждому y прибавили " + UI.fmt(v) + ". " + cap(anchor) + " → (0; " + UI.fmt(v) + ").</p>";
    if (tr === "a") s += "<p>Каждый y умножили на " + UI.fmt(v) + ": (x₀; y₀) → (x₀; " + UI.fmt(v) + "·y₀). " + (v < 0 ? "Минус переворачивает график относительно оси x. " : "") + (Math.abs(v) > 1 ? "Точки разъезжаются от оси x." : Math.abs(v) < 1 ? "Точки прижимаются к оси x." : "") + "</p><p><b>" + cap(anchor) + " остаётся на месте</b>: у неё y = 0, а 0 · " + UI.fmt(v) + " = 0. На месте и все остальные точки на оси x.</p>";
    if (tr === "k") s += "<p>Каждый x делим на " + UI.fmt(v) + ": (x₀; y₀) → (x₀ : " + UI.fmt(v) + "; y₀). " + (v < 0 ? "Минус отражает график относительно оси y. " : "") + (Math.abs(v) > 1 ? "Точки прижимаются к оси y." : Math.abs(v) < 1 ? "Точки разъезжаются от оси y." : "") + "</p><p><b>" + cap(anchor) + " остаётся на месте</b>: у неё x = 0, а 0 : " + UI.fmt(v) + " = 0. На месте и все точки на оси y.</p>";
    if (tr === "absx") s += "<p>Для самой " + m("y=" + b.tpl("x")) + " эффект " + (bk === "sq" ? "не виден (парабола и так симметрична)" : "есть, но возьмём пример нагляднее") + ", поэтому исходник тут " + m("f(x)=" + SRC[bk].absx) + ".</p><p>Правая половина (x ≥ 0) остаётся, левая (серая) стирается, а правая «перелистывается» налево, как страница книги. Получается график, симметричный относительно оси y.</p>";
    if (tr === "abs") s += "<p>Исходник тут " + m("f(x)=" + SRC[bk].abs) + " — у него есть куски ниже оси x" + (bk === "sq" || bk === "sqrt" ? " (у самой " + m("y=" + b.tpl("x")) + " их нет, и модуль ничего бы не поменял)" : "") + ".</p><p>Всё, что выше оси x, остаётся. Всё, что ниже, переворачивается наверх, как отражение в воде. Точки на оси x — места «отражения» — не двигаются.</p>";
    return s;
  }
  var SHORT = { x: "точка", sq: "вершина", cube: "центр", sqrt: "начало" };
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  /* Кадр анимации: точки исходного графика едут по правилу преобразования (параметр t от 0 до 1) */
  function frame(bk, tr, v, t) {
    var f = B[bk].f;
    if (tr === "absx" || tr === "abs") f = Formula.compile(SRC[bk][tr]);
    var map;
    if (tr === "in") map = function (x, y) { return [x - v * t, y]; };
    if (tr === "out") map = function (x, y) { return [x, y + v * t]; };
    if (tr === "a") map = function (x, y) { return [x, y * (1 + (v - 1) * t)]; };
    if (tr === "k") map = function (x, y) { return [x * (1 + (1 / v - 1) * t), y]; };
    if (tr === "abs") map = function (x, y) { return [x, y < 0 ? y * (1 - 2 * t) : y]; };
    var curves = [];
    if (tr === "absx") {
      curves.push({ pts: sample(f, 0, 30, function (x, y) { return [x, y]; }) });
      curves.push({ pts: sample(f, 0, 30, function (x, y) { return [x * (1 - 2 * t), y]; }) });
      curves.push({ pts: sample(f, -30, 0, function (x, y) { return [x, y]; }), ghost: 1 - t });
    } else curves.push({ pts: sample(f, -30, 30, map) });
    return { f: f, curves: curves };
  }
  function sample(f, a, b, map) {
    var out = [];
    for (var x = a; x <= b + 1e-9; x += 0.004) {
      var y = f(x);
      out.push(isNaN(y) || Math.abs(y) > 400 ? null : map(x, y));
    }
    return out;
  }
  function drawCurve(c, P, pts, color, width, dash) {
    c.strokeStyle = color; c.lineWidth = width; c.lineJoin = "round"; c.lineCap = "round";
    c.setLineDash(dash || []);
    c.beginPath();
    var pen = false, lastY = 0;
    pts.forEach(function (p) {
      if (!p) { pen = false; return; }
      var X = P.X(p[0]), Y = P.Y(p[1]);
      if (Y < -3 * P.h || Y > 4 * P.h || (pen && Math.abs(Y - lastY) > 2 * P.h)) { pen = false; lastY = Y; return; }
      if (pen) c.lineTo(X, Y); else c.moveTo(X, Y);
      pen = true; lastY = Y;
    });
    c.stroke();
  }

  function demo() {
    var bk = "sq", tr = TR[0], v = TR[0].vals[0], t = 1, raf = 0;
    var pb = UI.plotBox({ x: [-7, 7], y: [-5, 6] });
    var info = h("div", { class: "theory" });
    var bChips = h("div", { class: "btns" }), tChips = h("div", { class: "btns" }), vChips = h("div", { class: "btns" });
    function chipRow(box, list, isOn, onPick) {
      box.innerHTML = "";
      list.forEach(function (it) {
        var c = h("button", { class: "chip" + (isOn(it) ? " is-on" : ""), html: it.html, onclick: function () {
          Array.prototype.forEach.call(box.children, function (x) { x.classList.remove("is-on"); });
          c.classList.add("is-on"); onPick(it);
        } });
        box.appendChild(c);
      });
    }
    chipRow(bChips, TF.ORDER.map(function (k) { return { k: k, html: m("y=" + B[k].tpl("x")) }; }), function (it) { return it.k === bk; }, function (it) { bk = it.k; play(); });
    chipRow(tChips, TR.map(function (x) { return { tr: x, html: m("y=" + x.label) }; }), function (it) { return it.tr === tr; }, function (it) { tr = it.tr; v = tr.vals ? tr.vals[0] : 0; vals(); play(); });
    function vals() {
      chipRow(vChips, (tr.vals || []).map(function (x) { return { v: x, html: tr.name + " = " + UI.fmt(x) }; }), function (it) { return it.v === v; }, function (it) { v = it.v; play(); });
      vChips.style.display = tr.vals ? "" : "none";
    }
    function draw() {
      var P = pb.plot; if (!P) return;
      var fr = frame(bk, tr.id, v, t);
      var L = [{ type: "fn", f: fr.f, color: "rgba(29, 32, 51, 0.38)", dash: [6, 6], width: 2.5 }];
      // асимптоты гиперболы едут вместе с графиком
      if (bk === "inv" && tr.id !== "absx" && tr.id !== "abs") {
        var vx = tr.id === "in" ? -v * t : 0, hy = tr.id === "out" ? v * t : 0;
        L.push({ type: "vline", x: vx, color: "rgba(226, 52, 104, 0.45)", width: 1.5 }, { type: "hline", y: hy, color: "rgba(226, 52, 104, 0.45)", width: 1.5 });
      }
      L.push({ type: "custom", draw: function (c, pl) {
        fr.curves.forEach(function (cv) {
          if (cv.ghost !== undefined) { c.globalAlpha = Math.max(0, cv.ghost); drawCurve(c, pl, cv.pts, "#e23468", 3.5); c.globalAlpha = 1; }
          else drawCurve(c, pl, cv.pts, "#e23468", 3.5);
        });
      } });
      // якорь: вершина / начало / центр
      if (bk !== "inv" && tr.id !== "absx" && tr.id !== "abs") {
        var ax = tr.id === "in" ? -v * t : 0, ay = tr.id === "out" ? v * t : 0;
        var stays = tr.id === "a" || tr.id === "k";
        L.push({ type: "point", x: ax, y: ay, r: 6, color: "#1d2033", label: stays ? SHORT[bk] + " на месте" : SHORT[bk], labelDy: 22, labelDx: 10 });
      }
      P.layers = L; P.draw();
    }
    function play() {
      info.innerHTML = explain(bk, tr.id, v);
      cancelAnimationFrame(raf);
      var t0 = performance.now();
      (function step(now) {
        var u = Math.min(1, (now - t0) / 1400);
        t = u * u * (3 - 2 * u);
        draw();
        if (u < 1) raf = requestAnimationFrame(step);
      })(t0);
    }
    vals();
    UI.later(function () { pb.mount(); play(); });
    var prev = App._cleanup;
    App._cleanup = function () { cancelAnimationFrame(raf); if (prev) prev(); };
    return h("div", { class: "sliders" },
      h("div", null, h("div", { class: "train__lbl", text: "Базовая функция" }), bChips),
      h("div", null, h("div", { class: "train__lbl", text: "Преобразование" }), tChips),
      vChips,
      h("div", { class: "split" }, h("div", { class: "sliders" }, info,
        h("button", { class: "btn btn--ghost btn--sm", style: "align-self:flex-start", text: "▶ Ещё раз", onclick: play })), pb.el));
  }

  /* ---------- 3. все базовые функции ---------- */
  // [результат, исходник (серый), что произошло]
  var EX = {
    x: {
      in: [["x+2", "x", "на 2 влево"], ["x-3", "x", "на 3 вправо"]],
      out: [["x+2", "x", "на 2 вверх. Для прямой y = x это совпало со сдвигом на 2 влево!"], ["x-1", "x", "на 1 вниз"]],
      a: [["2x", "x", "круче в 2 раза, (0; 0) на месте"], ["0.5x", "x", "положе в 2 раза"], ["-x", "x", "отражение относительно оси x"]],
      k: [["2x", "x", "сжатие к оси y. У прямой y = x это то же, что 2·f(x)"], ["0.5x", "x", "растяжение от оси y"], ["-x", "x", "отражение относительно оси y. Для y = x — то же, что −f(x)"]],
      absx: [["|x|", "x", "левая половина заменена отражением правой: уголок"], ["|x|-2", "x-2", "из y = x − 2: уголок с вершиной (0; −2)"]],
      abs: [["|x|", "x", "часть ниже оси x отразилась вверх: тот же уголок"], ["|x-2|", "x-2", "из y = x − 2: уголок с вершиной (2; 0)"]]
    },
    sq: {
      in: [["(x+2)^2", "x^2", "вершина (−2; 0)"], ["(x-3)^2", "x^2", "вершина (3; 0)"]],
      out: [["x^2+2", "x^2", "вершина (0; 2)"], ["x^2-1", "x^2", "вершина (0; −1)"]],
      a: [["2x^2", "x^2", "уже, вершина на месте"], ["0.5x^2", "x^2", "шире, вершина на месте"], ["-x^2", "x^2", "ветви вниз, вершина на месте"]],
      k: [["(2x)^2", "x^2", "(2x)² = 4x²: уже, вершина на месте"], ["(0.5x)^2", "x^2", "(0,5x)² = 0,25x²: шире"], ["(-x)^2", "x^2", "(−x)² = x²: ничего не изменилось — парабола симметрична"]],
      absx: [["|x|^2", "x^2", "|x|² = x²: ничего — парабола и так симметрична"], ["(|x|-2)^2", "(x-2)^2", "из (x − 2)²: две вершины (±2; 0)"]],
      abs: [["|x^2|", "x^2", "ничего: x² ≥ 0, ниже оси x точек нет"], ["|x^2-3|", "x^2-3", "из x² − 3: «дно» отразилось вверх"]]
    },
    cube: {
      in: [["(x+2)^3", "x^3", "центр (−2; 0)"], ["(x-1)^3", "x^3", "центр (1; 0)"]],
      out: [["x^3+2", "x^3", "центр (0; 2)"], ["x^3-1", "x^3", "центр (0; −1)"]],
      a: [["2x^3", "x^3", "круче, центр на месте"], ["0.5x^3", "x^3", "положе, центр на месте"], ["-x^3", "x^3", "отражение относительно оси x"]],
      k: [["(2x)^3", "x^3", "(2x)³ = 8x³: сжатие к оси y"], ["(0.5x)^3", "x^3", "растяжение от оси y"], ["(-x)^3", "x^3", "(−x)³ = −x³: то же, что отражение относительно оси x"]],
      absx: [["|x|^3", "x^3", "левая ветка заменена отражением правой: «чашка»"], ["(|x|-1)^3", "(x-1)^3", "из (x − 1)³"]],
      abs: [["|x^3|", "x^3", "левая ветка отразилась вверх: та же «чашка»"], ["|x^3-1|", "x^3-1", "из x³ − 1: всё, что ниже оси x, — наверх"]]
    },
    sqrt: {
      in: [["sqrt(x+2)", "sqrt(x)", "начало (−2; 0)"], ["sqrt(x-3)", "sqrt(x)", "начало (3; 0)"]],
      out: [["sqrt(x)+2", "sqrt(x)", "начало (0; 2)"], ["sqrt(x)-1", "sqrt(x)", "начало (0; −1)"]],
      a: [["2sqrt(x)", "sqrt(x)", "выше в 2 раза, начало на месте"], ["0.5sqrt(x)", "sqrt(x)", "ниже в 2 раза"], ["-sqrt(x)", "sqrt(x)", "отражение относительно оси x"]],
      k: [["sqrt(2x)", "sqrt(x)", "сжатие к оси y, начало на месте"], ["sqrt(0.5x)", "sqrt(x)", "растяжение от оси y"], ["sqrt(-x)", "sqrt(x)", "отражение относительно оси y: ветка ушла влево"]],
      absx: [["sqrt(|x|)", "sqrt(x)", "появилась левая ветка — отражение правой"], ["sqrt(|x|-1)", "sqrt(x-1)", "из √(x − 1): две ветки"]],
      abs: [["|sqrt(x)|", "sqrt(x)", "ничего: √x ≥ 0"], ["|sqrt(x)-2|", "sqrt(x)-2", "из √x − 2: кусок ниже оси x отразился"]]
    },
    inv: {
      in: [["1/(x+2)", "1/x", "асимптота x = −2"], ["1/(x-3)", "1/x", "асимптота x = 3"]],
      out: [["1/x+2", "1/x", "асимптота y = 2"], ["1/x-1", "1/x", "асимптота y = −1"]],
      a: [["2/x", "1/x", "ветки дальше от осей"], ["0.5/x", "1/x", "ветки ближе к осям"], ["-1/x", "1/x", "ветки во II и IV четвертях"]],
      k: [["1/(2x)", "1/x", "1/(2x) = 0,5/x: то же, что 0,5·f(x)"], ["1/(0.5x)", "1/x", "1/(0,5x) = 2/x"], ["1/(-x)", "1/x", "= −1/x: то же, что отражение относительно оси x"]],
      absx: [["1/|x|", "1/x", "обе ветки наверху"], ["1/(|x|-1)", "1/(x-1)", "из 1/(x − 1): асимптоты x = 1 и x = −1"]],
      abs: [["|1/x|", "1/x", "левая ветка ушла наверх — то же, что 1/|x|"], ["|1/x-1|", "1/x-1", "из 1/x − 1: кусок ниже оси x отразился"]]
    }
  };
  var GROUPS = [["in", "y = f(x + b)", "сдвиг по оси x"], ["out", "y = f(x) + c", "сдвиг по оси y"], ["a", "y = a·f(x)", "растяжение от оси x"],
    ["k", "y = f(kx)", "сжатие к оси y"], ["absx", "y = f(|x|)", "отражение правой половины"], ["abs", "y = |f(x)|", "отражение нижней части"]];

  function gallery() {
    var bk = "sq", chips = h("div", { class: "btns" }), out = h("div", { class: "gal" });
    TF.ORDER.forEach(function (k) {
      var c = h("button", { class: "chip" + (k === bk ? " is-on" : ""), html: m("f(x)=" + B[k].tpl("x")), onclick: function () {
        Array.prototype.forEach.call(chips.children, function (x) { x.classList.remove("is-on"); });
        c.classList.add("is-on"); bk = k; fill();
      } });
      chips.appendChild(c);
    });
    function fill() {
      out.innerHTML = "";
      GROUPS.forEach(function (g) {
        var row = h("div", { class: "gal__row" });
        EX[bk][g[0]].forEach(function (e) {
          var R = bk === "cube" ? 4 : 5;
          row.appendChild(h("figure", { class: "gal__ex" },
            h("div", { html: TF.mini2(Formula.compile(e[1]), Formula.compile(e[0]), { r: R }) }),
            h("figcaption", null, h("div", { class: "gal__f", html: m("y=" + e[0]) }), h("div", { class: "gal__n", text: e[2] }))));
        });
        out.appendChild(h("div", { class: "gal__grp" },
          h("div", { class: "gal__h", html: "<span class='m'>" + Formula.pretty(g[1]) + "</span> <small>" + g[2] + "</small>" }), row));
      });
    }
    fill();
    return h("div", { class: "sliders" }, chips,
      h("p", { class: "muted", style: "margin:0;font-size:14px", html: "Серый пунктир — исходный график, розовый — результат. Клетка = 1." }), out);
  }

  /* ---------- 4. порядок шагов ---------- */
  function steps(list) {
    var row = h("div", { class: "chainv" });
    list.forEach(function (s, i) {
      if (i) row.appendChild(h("div", { class: "chainv__arrow", html: "→<small>" + s[2] + "</small>" }));
      row.appendChild(h("div", { class: "chainv__step" },
        h("div", { html: TF.mini2(i ? Formula.compile(list[i - 1][0]) : null, Formula.compile(s[0]), { r: s[3] || 7 }) }),
        h("div", { class: "gal__f", html: m("y=" + s[0]) })));
    });
    return row;
  }

  App.page({
    id: "theory", order: 1, icon: "📖", ring: "📖", color: "var(--cyan)",
    title: "Шпаргалка", subtitle: "Шесть преобразований, анимации и примеры для x, x², x³, √x, 1/x",
    render: function (root) {
      var s1 = UI.section("Шесть преобразований", "Есть график " + m("y=f(x)") + ". Что будет с ним, если изменить формулу:");
      s1.appendChild(rules());
      s1.appendChild(UI.callout("warn", "<p><b>Главное правило.</b> Всё, что делаем <b>с x</b> (внутри, рядом с x), меняет график <b>по горизонтали</b> и работает «наоборот»: +3 — влево, ·2 — сжатие. Всё, что делаем <b>с самой функцией</b> (снаружи), меняет график <b>по вертикали</b> и работает «честно»: +3 — вверх, ·2 — растяжение.</p>"));
      root.appendChild(s1);

      var s2 = UI.section("Посмотри в движении", "Выбери функцию и преобразование. Серый пунктир — исходный график, розовый — что с ним происходит. Обрати внимание: при растяжениях вершина стоит на месте.");
      s2.appendChild(demo());
      root.appendChild(s2);

      var s3 = UI.section("Все базовые функции во всех преобразованиях", "Выбери функцию — увидишь, как выглядит каждая из шести формул.");
      s3.appendChild(gallery());
      root.appendChild(s3);

      var s4 = UI.section("Сложная формула — по шагам", "Сложную формулу строим так же, как считаем её значение: <b>изнутри наружу</b>. Что делаешь с числом x первым — то и первый шаг.");
      s4.appendChild(UI.theory("<p>Пример: " + m("y=|(x+3)^2-5|") + ". Берём x, прибавляем 3, возводим в квадрат, вычитаем 5, берём модуль. Значит:</p>" +
        "<ol><li>" + m("y=x^2") + " — базовая парабола;</li><li>" + m("y=(x+3)^2") + " — сдвиг на 3 влево;</li><li>" + m("y=(x+3)^2-5") + " — сдвиг на 5 вниз;</li><li>" + m("y=|(x+3)^2-5|") + " — всё, что под осью x, отражаем вверх.</li></ol>"));
      s4.appendChild(steps([["x^2", "", "", 8], ["(x+3)^2", "", "3 влево", 8], ["(x+3)^2-5", "", "5 вниз", 8], ["|(x+3)^2-5|", "", "модуль", 8]]));
      s4.appendChild(UI.theory("<p>Ещё пример: " + m("y=2(x+1)^2-3") + ". Порядок: сдвиг на 1 влево → растяжение в 2 раза от оси x → сдвиг на 3 вниз.</p>" +
        "<p>Растягиваем, когда вершина в (−1; 0), то есть <b>на оси x</b> — поэтому она остаётся на месте. Если сначала опустить на 3, а потом растянуть, вершина уедет в (−1; −6). Порядок важен!</p>"));
      s4.appendChild(steps([["x^2", "", "", 6], ["(x+1)^2", "", "1 влево", 6], ["2(x+1)^2", "", "растянуть ×2", 6], ["2(x+1)^2-3", "", "3 вниз", 6]]));
      root.appendChild(s4);

      var s5 = UI.section("Ловушки");
      s5.appendChild(h("div", { class: "cheat" },
        h("div", { class: "cheat__item", html: m("f(2x+4)") + "Это не сдвиг на 4! Вынеси 2 за скобку: " + m("f(2(x+2))") + " — сжатие в 2 раза и сдвиг на <b>2</b> влево." }),
        h("div", { class: "cheat__item", html: m("2x^2 vs (2x)^2") + "Первое — растяжение в 2 раза от оси x. Второе равно 4x², оно уже, чем 2x²." }),
        h("div", { class: "cheat__item", html: m("-x^2 vs (-x)^2") + "−x² — ветви вниз (минус снаружи). (−x)² = x² — ничего не изменилось (минус внутри у чётной функции)." }),
        h("div", { class: "cheat__item", html: m("|x|^2 = x^2") + "f(|x|) не меняет график, если он и так симметричен относительно оси y. |f(x)| не меняет график, если он весь выше оси x." }),
        h("div", { class: "cheat__item", html: m("f(|x|) vs |f(x)|") + "Модуль у x — отражение <b>правой половины</b> налево (по горизонтали). Модуль снаружи — отражение <b>нижней части</b> вверх (по вертикали)." }),
        h("div", { class: "cheat__item", html: m("a·f(x)") + "Если вершина не на оси x, растяжение её сдвигает: у " + m("2(x^2+1)") + " вершина (0; 2), а не (0; 1). Неподвижны только точки на оси x." })));
      root.appendChild(s5);
    }
  });
})();
