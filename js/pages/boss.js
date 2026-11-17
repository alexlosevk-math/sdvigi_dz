/* Босс-задания: дана только формула. Ученик сам выбирает базовую функцию,
   собирает план из шагов и рисует итоговый график (точки + карандаш). */
(function () {
  "use strict";
  var h = UI.h, m = UI.m;

  var BOSS = [
    { f: "|(x-1)^2-4|", x: [-5, 7], y: [-2, 7], hint: "Базовая — парабола. Сначала найди вершину (x − 1)² − 4, модуль — последним." },
    { f: "-2(x+2)^2+3", x: [-6, 3], y: [-6, 5], hint: "Сдвиг влево → растяжение с переворотом → подъём. Множитель −2 — это a = −2." },
    { f: "-sqrt(x+4)+2", x: [-6, 8], y: [-3, 4], hint: "Это то же самое, что 2 − √(x + 4). Минус перед корнем — отражение относительно оси x." },
    { f: "|1/(x+1)-1|", x: [-6, 5], y: [-1, 5], hint: "Гипербола: сдвиг по x, потом по y, потом модуль снаружи." },
    { f: "(|x|-3)^2-1", x: [-7, 7], y: [-2, 9], hint: "Модуль стоит у x — значит, f(|x|). Сначала построй (x − 3)² − 1, а модуль у x — последним шагом." },
    { f: "|(x+1)^3-1|", x: [-5, 4], y: [-1, 10], hint: "Кубическая парабола: сдвиг по x, по y, потом модуль снаружи." },
    { f: "|2x-4|-1", x: [-2, 6], y: [-2, 5], hint: "2x − 4 = 2(x − 2). Это прямая y = x, растянутая в 2 раза и сдвинутая. Потом модуль, потом вниз." },
    { f: "-|x+2|+3", x: [-7, 4], y: [-3, 5], hint: "Базовая — y = x. Сдвиг, модуль, переворот, подъём." }
  ];

  var KINDS = [
    { t: "in", label: "сдвиг по x", tpl: function (inp) { return ["f(x + ", inp, ")"]; } },
    { t: "out", label: "сдвиг по y", tpl: function (inp) { return ["f(x) + ", inp]; } },
    { t: "a", label: "a·f(x)", tpl: function (inp) { return [inp, " · f(x)"]; } },
    { t: "k", label: "f(kx)", tpl: function (inp) { return ["f(", inp, " · x)"]; } },
    { t: "abs", label: "|f(x)|", tpl: function () { return ["|f(x)|"]; } },
    { t: "absx", label: "f(|x|)", tpl: function () { return ["f(|x|)"]; } }
  ];

  function boss(i, holder, open) {
    var B = BOSS[i], id = "boss:" + (i + 1), target = Formula.compile(B.f);
    var base = null, ops = [], locked = false;
    holder.innerHTML = "";
    holder.appendChild(h("div", { class: "draw__head", html: "Построй " + m("y=" + B.f) }));

    var baseChips = h("div", { class: "btns" });
    TF.ORDER.forEach(function (k) {
      var c = h("button", { class: "chip", html: m("y=" + TF.BASES[k].tpl("x")), onclick: function () {
        if (locked) return;
        Array.prototype.forEach.call(baseChips.children, function (x) { x.classList.remove("is-on"); });
        c.classList.add("is-on"); base = k;
      } });
      baseChips.appendChild(c);
    });
    var list = h("div", { class: "plan" });
    var addBtns = h("div", { class: "btns" });
    KINDS.forEach(function (k) {
      addBtns.appendChild(h("button", { class: "btn btn--ghost btn--sm", text: "+ " + k.label, onclick: function () {
        if (locked) return;
        ops.push({ t: k.t, raw: "" }); renderList();
        var ins = list.querySelectorAll("input"); if (ins.length && k.t !== "abs" && k.t !== "absx") ins[ins.length - 1].focus();
      } }));
    });
    var fb = h("div", { class: "task__fb" });
    var preview = h("div");
    var tools = h("div", { class: "btns" });
    var hintBtn = h("button", { class: "btn btn--ghost btn--sm", text: "💡 Подсказка", onclick: function () {
      hintBtn.remove(); tools.appendChild(h("div", { class: "hint", html: B.hint }));
    } });
    var checkBtn = h("button", { class: "btn btn--primary", text: "Проверить план", onclick: checkPlan });
    tools.appendChild(checkBtn); tools.appendChild(hintBtn);
    var stage = h("div", { class: "sliders" },
      h("div", { class: "brd__wait", html: "Сначала составь план: от какой базовой функции идём и какие шаги делаем по порядку. Когда план верный, откроется доска." }));

    function renderList() {
      list.innerHTML = "";
      if (!ops.length) list.appendChild(h("div", { class: "muted", style: "font-size:14px", text: "Шагов пока нет. Добавь их кнопками ниже — в том порядке, в каком будешь строить." }));
      ops.forEach(function (op, k) {
        var K = KINDS.filter(function (x) { return x.t === op.t; })[0];
        var inp = h("input", { class: "plan__in", type: "text", value: op.raw, placeholder: "?", disabled: locked, oninput: function () { op.raw = inp.value; } });
        var parts = K.tpl(inp).map(function (p) { return typeof p === "string" ? h("span", { class: "m", text: p }) : p; });
        list.appendChild(h("div", { class: "plan__row" },
          h("span", { class: "stepper__n", text: k + 1 }),
          h("div", { class: "plan__body" }, parts),
          locked ? h("small", { class: "muted", text: TF.describe(opVal(op)) }) : h("span", { class: "plan__acts" },
            k ? h("button", { class: "lab__del", title: "Поднять выше", text: "↑", onclick: function () { var t = ops[k - 1]; ops[k - 1] = op; ops[k] = t; renderList(); } }) : null,
            h("button", { class: "lab__del", title: "Убрать шаг", text: "✕", onclick: function () { ops.splice(k, 1); renderList(); } }))));
      });
    }
    function opVal(op) {
      if (op.t === "abs" || op.t === "absx") return { t: op.t };
      return { t: op.t, v: UI.parseNumber(op.raw) };
    }

    function checkPlan() {
      if (!base) { fb.innerHTML = '<span class="bad">Выбери базовую функцию — с какого графика начинаем.</span>'; return; }
      var parsed = ops.map(opVal);
      var bad = parsed.filter(function (o) { return o.v !== undefined && (isNaN(o.v) || o.v === 0); });
      if (bad.length) { fb.innerHTML = '<span class="bad">В каком-то шаге нет числа (или там 0). Заполни все окошки: 3, −2, 0,5 или 1/2.</span>'; return; }
      var st = TF.chain(base, parsed), f = st[st.length - 1].f;
      preview.innerHTML = "";
      if (Formula.same(f, target, { min: -8, max: 8 })) {
        locked = true; renderList();
        Array.prototype.forEach.call(addBtns.children, function (b) { b.disabled = true; });
        checkBtn.remove();
        fb.innerHTML = '<span class="ok">План верный! Теперь построй итоговый график — сразу, без промежуточных.</span>';
        showBoard(st, parsed);
      } else {
        fb.innerHTML = '<span class="bad">По такому плану получается другой график — он нарисован ниже синим. Сравни его с формулой ' + m("y=" + B.f) + " и поправь план.</span>";
        var pb = UI.plotBox({ x: B.x, y: B.y, short: true, unitGrid: true });
        preview.appendChild(pb.el);
        var P = pb.mount();
        P.layers = [{ type: "fn", f: f, color: "#0a8bd0", width: 3 }]; P.draw();
      }
    }

    function showBoard(st, parsed) {
      stage.innerHTML = "";
      var last = st[st.length - 1], splits = last.asym.v.slice();
      if (parsed.some(function (o) { return o.t === "absx"; }) && splits.indexOf(0) < 0) splits.push(0);
      var b = TF.board({
        x: B.x, y: B.y, target: last.f, keys: last.keys, pts: last.pts,
        ghosts: [{ f: st[0].f, pts: st[0].pts }],
        splits: splits, minPts: base === "sqrt" ? 3 : 5, hint: TF.drawSetup.HINT[base],
        intro: "Серым — базовый график. Отметь точки итогового графика " + m("y=" + B.f) + ", потом соедини карандашом.",
        onDone: function (peek) {
          var was = App.isDone(id);
          App.solve(id, peek ? 20 : 40, peek);
          if (!was && !peek) UI.confetti(stage);
          if (open.refresh) open.refresh();
          stage.appendChild(h("div", { class: "btns" },
            i + 1 < BOSS.length ? h("button", { class: "btn btn--primary", text: "Следующий босс →", onclick: function () { open(i + 1); } }) : h("span", { class: "ok", text: "👑 Все боссы побеждены? Проверь кружки сверху!" }),
            h("button", { class: "btn btn--ghost btn--sm", text: "⟲ Заново", onclick: function () { open(i); } })));
        }
      });
      stage.appendChild(b.el);
      b.mount();
    }

    renderList();
    holder.appendChild(h("div", { class: "split" },
      h("div", { class: "sliders" },
        h("div", { class: "train__lbl", text: "1. Базовая функция" }), baseChips,
        h("div", { class: "train__lbl", text: "2. Шаги по порядку" }), list,
        h("div", { class: "train__lbl", text: "Добавить шаг" }), addBtns,
        tools, fb, preview),
      stage));
  }

  App.page({
    id: "boss", order: 5, icon: "👑", total: BOSS.length, color: "var(--yellow)",
    title: "Босс-задания", subtitle: "Только формула: сам разложи её на шаги и нарисуй график",
    render: function (root) {
      var sec = UI.section("Босс-задания", "Здесь никто не подсказывает шаги. Выбери базовую функцию, собери план преобразований (порядок важен!) и построй итоговый график по точкам и карандашом.");
      sec.appendChild(UI.callout("tip", "<p>Как вписывать: " + m("f(x+3)") + " — сдвиг по x, в окошко 3 (влево на 3); вправо на 2 — это " + m("f(x-2)") + ", в окошко −2. " + m("a·f(x)") + " с a = −1 — отражение относительно оси x.</p>"));
      var pills = h("div", { class: "fit-level" }), holder = h("div", { class: "sliders" }), cur = 0;
      function renderPills() {
        pills.innerHTML = "";
        BOSS.forEach(function (b, k) {
          pills.appendChild(h("button", { class: (k === cur ? "is-on " : "") + (App.isDone("boss:" + (k + 1)) ? "is-done" : ""), text: k + 1, onclick: function () { open(k); } }));
        });
      }
      function open(k) { cur = k; renderPills(); boss(k, holder, open); }
      open.refresh = renderPills;
      sec.appendChild(pills); sec.appendChild(holder);
      root.appendChild(sec);
      UI.later(function () { open(0); });
    }
  });
  TF.BOSS = BOSS;
})();
