/* Бесконечные тренажёры: «Формула по графику» и «Куда уедет точка». */
(function () {
  "use strict";
  var h = UI.h, m = UI.m;
  function ri(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
  function chips(list, cur, onPick) {
    var box = h("div", { class: "btns" });
    list.forEach(function (it) {
      var c = h("button", { class: "chip" + (it[0] === cur ? " is-on" : ""), text: it[1], onclick: function () {
        Array.prototype.forEach.call(box.children, function (x) { x.classList.remove("is-on"); });
        c.classList.add("is-on"); onPick(it[0]);
      } });
      box.appendChild(c);
    });
    return box;
  }
  function stats(pairs) {
    var box = h("div", { class: "stats" });
    pairs.forEach(function (s) { box.appendChild(h("div", { class: "stat", html: s[0] + ": <b>" + (App.flag(s[1]) || 0) + "</b>" })); });
    return box;
  }

  /* ================= формула по графику ================= */
  var LV = [["1", "Только сдвиги"], ["2", "+ растяжения и отражения"], ["3", "+ модули"]];
  function gen(lv) {
    // у прямой y = x сдвиг по x и по y неразличимы — проверка всё равно сравнивает значения, любая верная запись засчитается
    var bk = UI.pick(lv >= 3 ? TF.ORDER : ["sq", "sq", "cube", "sqrt", "inv", "x"]), p;
    do { p = { p: ri(-4, 4), q: ri(-3, 3), a: 1 }; } while (p.p === 0 && p.q === 0);
    if (lv >= 2 && Math.random() < 0.7) p.a = UI.pick(bk === "inv" ? [-1, 2, -2] : [-1, 2, -2, 0.5, -0.5]);
    if (lv >= 3) {
      var r = Math.random();
      if (r < 0.5) { p.abs = true; if (bk !== "inv" && p.q * p.a >= 0) p.q = -p.q || -2; }
      else if (bk !== "inv") { p.absx = true; p.p = Math.abs(p.p) || 2; }
    }
    return { bk: bk, p: p, src: TF.build(bk, p), f: TF.fnOf(bk, p) };
  }

  function guess(root) {
    var lv = App.flag("guessLv") || "1";
    var sec = UI.section("Формула по графику", "Каждый раз новый график. Найди якорную точку (вершину, начало, центр, асимптоты), определи сдвиги и растяжения — и запиши формулу.");
    var st = h("div");
    function upd() { st.innerHTML = ""; st.appendChild(stats([["Угадано графиков", "guessDone"], ["С первой попытки", "guessClean"]])); }
    upd();
    sec.appendChild(h("div", null, h("div", { class: "train__lbl", text: "Сложность" }), chips(LV, lv, function (k) { lv = k; App.flag("guessLv", k); next(); })));
    sec.appendChild(st);
    var holder = h("div");
    sec.appendChild(holder);
    root.appendChild(sec);

    function next() {
      var g = gen(+lv), wrong = 0, solved = false, peek = false;
      var pb = UI.plotBox({ x: [-8, 8], y: [-6, 6], unitGrid: true });
      var input = h("input", { class: "task__input", type: "text", placeholder: "например, (x-2)^2+1", autocomplete: "off", spellcheck: "false",
        onkeydown: function (e) { if (e.key === "Enter") check(); } });
      var pv = h("div", { class: "task__preview" });
      input.addEventListener("input", function () {
        var r = input.value.trim() ? Formula.tryCompile(input.value) : null;
        pv.innerHTML = !r ? "" : r.error ? '<span class="bad">' + r.error + "</span>" : "y = " + m(input.value.replace(/^\s*y\s*=/i, ""));
      });
      var fb = h("div", { class: "task__fb" }), extra = [], showBase = false;
      var nextBtn = h("button", { class: "btn btn--ghost", text: "🎲 Другой график", onclick: next });
      var baseBtn = h("button", { class: "btn btn--ghost btn--sm", text: "💡 Какая базовая?", onclick: function () {
        showBase = true; baseBtn.remove(); draw();
        fb.innerHTML = '<span class="muted">Серым — базовая ' + m("y=" + TF.BASES[g.bk].tpl("x")) + ". Теперь найди, куда она переехала.</span>";
      } });
      var ansBtn = h("button", { class: "btn btn--ghost btn--sm", text: "👀 Ответ", style: "display:none", onclick: function () {
        peek = true; fb.innerHTML = "Ответ: " + m("y=" + g.src); ansBtn.remove();
      } });
      function draw() {
        var P = pb.plot, L = [];
        if (showBase) L.push({ type: "fn", f: TF.BASES[g.bk].f, color: "rgba(29, 32, 51, 0.35)", dash: [7, 6], width: 2.5 });
        // якорь: вершина / начало / центр, у гиперболы — асимптоты
        if (!g.p.abs && !g.p.absx) {
          if (g.bk === "inv") L.push({ type: "vline", x: g.p.p, color: "rgba(122,85,240,.55)", width: 1.5 }, { type: "hline", y: g.p.q, color: "rgba(122,85,240,.55)", width: 1.5 });
          else if (g.bk !== "x") L.push({ type: "point", x: g.p.p, y: g.p.q, r: 5, color: "#1d2033" });
        }
        L.push({ type: "fn", f: g.f, color: "#e23468", width: 3.5 });
        L = L.concat(extra);
        P.layers = L; P.draw();
      }
      function check() {
        if (solved) return;
        var r = Formula.tryCompile(input.value);
        if (r.error) { fb.innerHTML = '<span class="bad">' + r.error + "</span>"; return; }
        if (Formula.same(r.f, g.f)) {
          solved = true;
          extra = [];
          draw();
          fb.innerHTML = '<span class="ok">Точно! ' + m("y=" + g.src) + "</span>";
          App.count("guessDone"); if (!wrong && !peek && !showBase) App.count("guessClean");
          App.addXp(wrong || peek ? 3 : 8); upd();
          UI.confetti(input);
          nextBtn.textContent = "Следующий график →"; nextBtn.className = "btn btn--primary";
        } else {
          wrong++;
          extra = [{ type: "fn", f: r.f, color: "#0a8bd0", width: 2.5, dash: [8, 5] }];
          draw();
          fb.innerHTML = '<span class="bad">Не совпало. Синий пунктир — график твоей формулы: сравни, куда он уехал.</span>';
          if (wrong >= 2) ansBtn.style.display = "";
        }
      }
      holder.innerHTML = "";
      holder.appendChild(h("div", { class: "task" },
        h("div", { class: "task__head" }, h("span", { class: "task__badge", text: "Случайный график" })),
        pb.el,
        h("div", { class: "task__form" },
          h("div", { class: "task__row" }, h("span", { class: "task__prefix", text: "y =" }), input, h("button", { class: "btn btn--primary", text: "Проверить", onclick: check })),
          pv),
        fb,
        h("div", { class: "btns" }, baseBtn, ansBtn, nextBtn)));
      pb.mount(); draw();
    }
    UI.later(next);
  }

  App.page({
    id: "guess", order: 6, icon: "🎯", ring: "∞", color: "var(--orange)",
    title: "Тренажёр: формула по графику", subtitle: "Бесконечные графики: увидь сдвиги и запиши формулу",
    render: guess
  });

  /* ================= куда уедет точка ================= */
  function genPoint() {
    var x0 = ri(-3, 4) || 2, y0 = ri(-4, 4) || 3, b = UI.pick([-3, -2, -1, 1, 2, 3, 4]), c = UI.pick([-4, -2, -1, 1, 2, 3]);
    var kind = UI.pick(["in", "out", "inout", "a", "k", "ainout", "abs", "absx", "inout", "kout"]);
    var f = "", ans, why;
    function inner(v) { return "x" + (v > 0 ? "+" : "-") + Math.abs(v); }
    function outer(v) { return (v > 0 ? "+" : "-") + Math.abs(v); }
    if (kind === "in") { f = "f(" + inner(b) + ")"; ans = [x0 - b, y0]; why = "Внутри " + inner(b) + " — по x и наоборот: x₀ " + (b > 0 ? "− " : "+ ") + Math.abs(b) + "."; }
    if (kind === "out") { f = "f(x)" + outer(c); ans = [x0, y0 + c]; why = "Снаружи " + outer(c) + " — по y и честно: y₀ " + outer(c).replace("+", "+ ").replace("-", "− ") + "."; }
    if (kind === "inout") { f = "f(" + inner(b) + ")" + outer(c); ans = [x0 - b, y0 + c]; why = "x наоборот: x₀ " + (b > 0 ? "− " : "+ ") + Math.abs(b) + "; y честно: y₀ " + (c > 0 ? "+ " : "− ") + Math.abs(c) + "."; }
    if (kind === "a") { var a = UI.pick([2, 3, -1, -2]); f = (a === -1 ? "-" : a) + "f(x)"; ans = [x0, a * y0]; why = "Множитель снаружи умножает y: " + y0 + " · " + a + " = " + a * y0 + ". x не меняется."; }
    if (kind === "k") {
      var k = UI.pick([2, -1, -2, 3]); x0 = k * (ri(-2, 2) || 1); f = "f(" + (k === -1 ? "-" : k) + "x)"; ans = [x0 / k, y0];
      why = "Нужно, чтобы внутри получилось " + x0 + " (там мы знаем значение). " + (k === -1 ? "−x" : k + "x") + " = " + x0 + " при x = " + x0 / k + ". y не меняется.";
    }
    if (kind === "ainout") { var a2 = UI.pick([2, -1]); f = (a2 === -1 ? "-" : a2) + "f(" + inner(b) + ")" + outer(c); ans = [x0 - b, a2 * y0 + c]; why = "x: x₀ " + (b > 0 ? "− " : "+ ") + Math.abs(b) + ". y: сначала умножаем на " + a2 + ", потом " + (c > 0 ? "прибавляем " : "вычитаем ") + Math.abs(c) + ": " + a2 + "·" + y0 + (c > 0 ? " + " : " − ") + Math.abs(c) + " = " + (a2 * y0 + c) + "."; }
    if (kind === "kout") { x0 = 2 * (ri(-2, 2) || 1); f = "f(2x)" + outer(c); ans = [x0 / 2, y0 + c]; why = "x делим на 2 (внутри наоборот), к y прибавляем " + c + "."; }
    if (kind === "abs") { y0 = -Math.abs(y0); f = "|f(x)|"; ans = [x0, -y0]; why = "Модуль снаружи: y₀ = " + y0 + " < 0, точка отражается вверх, y = " + (-y0) + "."; }
    if (kind === "absx") { x0 = Math.abs(x0) || 2; f = "f(|x|)"; ans = [-x0, y0]; why = "f(|−" + x0 + "|) = f(" + x0 + ") = " + y0 + ": правая точка отражается налево."; }
    var q = "Точка A(" + UI.fmt(x0) + "; " + UI.fmt(y0) + ") лежит на графике " + m("y=f(x)") + ". ";
    if (kind === "absx") q += "Какая точка с x = −" + x0 + " обязательно лежит на графике " + m("y=" + f) + "?";
    else q += "Куда она переедет на графике " + m("y=" + f) + "?";
    return { q: q, ans: ans, why: why, f: f, kind: kind, A: [x0, y0] };
  }

  function point(root) {
    var sec = UI.section("Куда уедет точка", "Точка A лежит на графике y = f(x). Найди, где она окажется после преобразования. Ответ: x; y.");
    var st = h("div");
    function upd() { st.innerHTML = ""; st.appendChild(stats([["Решено", "ptDone"], ["С первой попытки", "ptClean"], ["Серия", "ptStreak"]])); }
    upd();
    sec.appendChild(st);
    var holder = h("div");
    sec.appendChild(holder);
    sec.appendChild(UI.callout("tip", "<p>Правило: <b>внутри</b> (с x) — по горизонтали и наоборот: " + m("f(x+3)") + " → x₀ − 3, " + m("f(2x)") + " → x₀ : 2. <b>Снаружи</b> — по вертикали и честно: " + m("f(x)+3") + " → y₀ + 3, " + m("2f(x)") + " → 2·y₀.</p>"));
    root.appendChild(sec);

    function next() {
      var g = genPoint(), wrong = 0, solved = false;
      var input = h("input", { class: "task__input", type: "text", placeholder: "x; y", autocomplete: "off", onkeydown: function (e) { if (e.key === "Enter") check(); } });
      var fb = h("div", { class: "task__fb" });
      var pb = UI.plotBox({ x: [-7, 7], y: [-6, 6], unitGrid: true, short: true });
      var nextBtn = h("button", { class: "btn btn--ghost", text: "🎲 Другая", onclick: next });
      function draw(B, ok) {
        var L = [{ type: "point", x: g.A[0], y: g.A[1], color: "#1d2033", label: "A" }];
        if (B) L.push({ type: "point", x: B[0], y: B[1], color: ok ? "#17a34a" : "#e23468", label: ok ? "A′" : "?" });
        if (B && ok) L.push({ type: "segment", x1: g.A[0], y1: g.A[1], x2: B[0], y2: B[1], color: "rgba(23,163,74,.6)", width: 2, dash: [6, 5], arrow: true });
        pb.plot.layers = L; pb.plot.draw();
      }
      function check() {
        if (solved) return;
        var a = UI.parseNumbers(input.value.replace(/[()]/g, " "));
        if (a.length !== 2 || a.some(isNaN)) { fb.innerHTML = '<span class="bad">Нужно два числа: x; y</span>'; return; }
        if (Math.abs(a[0] - g.ans[0]) < 1e-6 && Math.abs(a[1] - g.ans[1]) < 1e-6) {
          solved = true; draw(g.ans, true);
          fb.innerHTML = '<span class="ok">Верно! (' + UI.fmt(g.ans[0]) + "; " + UI.fmt(g.ans[1]) + ")</span> <span class='muted'>" + g.why + "</span>";
          App.count("ptDone"); if (!wrong) { App.count("ptClean"); App.count("ptStreak"); } else App.flag("ptStreak", 0);
          App.addXp(wrong ? 2 : 5); upd();
          nextBtn.textContent = "Следующая →"; nextBtn.className = "btn btn--primary"; nextBtn.focus();
        } else {
          wrong++; App.flag("ptStreak", 0); upd();
          draw(a, false);
          var msg = "Не туда.";
          if (Math.abs(a[0] - g.ans[0]) > 1e-6 && Math.abs(a[1] - g.ans[1]) < 1e-6) msg = "y верный, а x — нет. Помни: внутри всё наоборот.";
          else if (Math.abs(a[0] - g.ans[0]) < 1e-6) msg = "x верный, а y — нет. Снаружи всё честно.";
          fb.innerHTML = '<span class="bad">' + msg + "</span>" + (wrong >= 2 ? "<div class='hint'>" + g.why + "</div>" : "");
        }
      }
      holder.innerHTML = "";
      holder.appendChild(h("div", { class: "task" },
        h("div", { class: "task__q", html: "<p>" + g.q + "</p>" }),
        h("div", { class: "task__row" }, h("span", { class: "task__prefix", text: "A′ =" }), input, h("button", { class: "btn btn--primary", text: "Проверить", onclick: check })),
        fb, pb.el, h("div", { class: "btns" }, nextBtn)));
      pb.mount(); draw(null);
      input.focus({ preventScroll: true });
    }
    UI.later(next);
  }

  App.page({
    id: "point", order: 7, icon: "📍", ring: "∞", color: "var(--cyan)",
    title: "Тренажёр: куда уедет точка", subtitle: "Бесконечные задачки на перенос точки при сдвигах и растяжениях",
    render: point
  });
})();
