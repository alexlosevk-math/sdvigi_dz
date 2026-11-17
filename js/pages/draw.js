/* Рисуем по шагам: формула разбита на шаги, на каждом ученик
   1) называет преобразование, 2) ставит точки, 3) рисует график карандашом. */
(function () {
  "use strict";
  var h = UI.h, m = UI.m;

  var EXS = [
    { base: "sq", x: [-8, 3], y: [-6, 7], steps: [[{ t: "in", v: 3 }, "(x+3)^2"], [{ t: "out", v: -5 }, "(x+3)^2-5"], [{ t: "abs" }, "|(x+3)^2-5|"]] },
    { base: "sqrt", x: [-2, 10], y: [-2, 5], steps: [[{ t: "in", v: -2 }, "sqrt(x-2)"], [{ t: "out", v: 1 }, "sqrt(x-2)+1"]] },
    { base: "sq", x: [-4, 6], y: [-6, 6], steps: [[{ t: "in", v: -1 }, "(x-1)^2"], [{ t: "a", v: -1 }, "-(x-1)^2"], [{ t: "out", v: 4 }, "-(x-1)^2+4"]] },
    { base: "inv", x: [-7, 4], y: [-5, 4], steps: [[{ t: "in", v: 2 }, "1/(x+2)"], [{ t: "out", v: -1 }, "1/(x+2)-1"]] },
    { base: "x", x: [-6, 5], y: [-4, 5], steps: [[{ t: "in", v: 1 }, "x+1"], [{ t: "abs" }, "|x+1|"], [{ t: "out", v: -2 }, "|x+1|-2"]] },
    { base: "sq", x: [-6, 6], y: [-3, 7], steps: [[{ t: "in", v: -2 }, "(x-2)^2"], [{ t: "out", v: -1 }, "(x-2)^2-1"], [{ t: "absx" }, "(|x|-2)^2-1"]] },
    { base: "sq", x: [-5, 4], y: [-5, 6], steps: [[{ t: "in", v: 1 }, "(x+1)^2"], [{ t: "a", v: 2 }, "2(x+1)^2"], [{ t: "out", v: -3 }, "2(x+1)^2-3"]] },
    { base: "sqrt", x: [-6, 10], y: [-3, 4], steps: [[{ t: "in", v: 4 }, "sqrt(x+4)"], [{ t: "out", v: -2 }, "sqrt(x+4)-2"], [{ t: "abs" }, "|sqrt(x+4)-2|"]] },
    { base: "cube", x: [-3, 7], y: [-8, 10], steps: [[{ t: "in", v: -2 }, "(x-2)^3"], [{ t: "out", v: 1 }, "(x-2)^3+1"]] },
    { base: "sqrt", x: [-10, 3], y: [-2, 5], steps: [[{ t: "k", v: -1 }, "sqrt(-x)"], [{ t: "out", v: 1 }, "sqrt(-x)+1"]] }
  ];

  var HINT = {
    x: "прямая — ровная линия, а после модуля — уголок из двух лучей",
    sq: "парабола — плавная «чаша», острый излом бывает только там, где сработал модуль",
    cube: "кубическая парабола — плавная «змейка» через центр симметрии",
    sqrt: "ветка корня начинается в точке и плавно поднимается, становясь всё положе",
    inv: "гипербола — две отдельные ветки, они прижимаются к асимптотам, но не пересекают их"
  };

  function setup(ex) {
    var ops = ex.steps.map(function (s) { return s[0]; });
    return TF.chain(ex.base, ops);
  }
  function splitsFor(op, st) {
    var s = st.asym.v.slice();
    if (op.t === "absx" && s.indexOf(0) < 0) s.push(0);
    return s;
  }
  TF.drawSetup = { EXS: EXS, setup: setup, HINT: HINT, splitsFor: splitsFor };

  function exercise(i, holder, onSolved) {
    var ex = EXS[i], states = setup(ex), cur = 0, id = "draw:" + (i + 1), anyPeek = false;
    var final = ex.steps[ex.steps.length - 1][1];
    holder.innerHTML = "";
    var list = h("div", { class: "stepper" });
    var side = h("div", { class: "sliders" });
    var stage = h("div", { class: "sliders" });
    holder.appendChild(h("div", { class: "draw__head", html: "Построй " + m("y=" + final) + "<small class='muted'> · шагов: " + ex.steps.length + "</small>" }));
    holder.appendChild(h("div", { class: "split" }, h("div", { class: "sliders" }, list, side), stage));

    function rows() {
      list.innerHTML = "";
      list.appendChild(h("div", { class: "stepper__row is-done" },
        h("span", { class: "stepper__n", text: "0" }),
        h("div", null, h("div", { html: m("y=" + TF.BASES[ex.base].tpl("x")) }), h("small", { text: "базовая функция — уже нарисована серым" }))));
      ex.steps.forEach(function (s, k) {
        var st = k < cur ? "is-done" : k === cur ? "is-on" : "";
        list.appendChild(h("div", { class: "stepper__row " + st },
          h("span", { class: "stepper__n", text: k < cur ? "✓" : k + 1 }),
          h("div", null, h("div", { html: m("y=" + s[1]) }), h("small", { text: k < cur ? TF.describe(s[0]) : k === cur ? "сейчас" : "" }))));
      });
    }

    function step() {
      rows();
      side.innerHTML = ""; stage.innerHTML = "";
      if (cur >= ex.steps.length) { done(); return; }
      var op = ex.steps[cur][0], formula = ex.steps[cur][1], prevF = cur ? ex.steps[cur - 1][1] : TF.BASES[ex.base].tpl("x");
      var opts = UI.shuffle([TF.describe(op)].concat(TF.wrongs(op)));
      var right = TF.describe(op), fb = h("div", { class: "task__fb" });
      var box = h("div", { class: "options options--col" });
      opts.forEach(function (txt) {
        var b = h("button", { class: "option", type: "button", text: txt, onclick: function () {
          if (box.classList.contains("is-locked")) return;
          if (txt === right) {
            b.classList.add("is-on"); box.classList.add("is-locked");
            fb.innerHTML = '<span class="ok">Верно! Теперь построй график этого шага.</span>';
            showBoard();
          } else {
            b.classList.add("is-wrong");
            fb.innerHTML = '<span class="bad">' + whyWrong(op) + "</span>";
          }
        } });
        box.appendChild(b);
      });
      side.appendChild(h("div", { class: "task" },
        h("div", { class: "task__head" }, h("span", { class: "task__badge", text: "Шаг " + (cur + 1) + " из " + ex.steps.length })),
        h("div", { class: "task__q", html: "<p>Было: " + m("y=" + prevF) + "<br>Стало: " + m("y=" + formula) + "</p><p>Что делаем с графиком?</p>" }),
        box, fb));
      stage.appendChild(h("div", { class: "brd__wait", html: "Сначала выбери, что происходит с графиком, — потом откроется доска.<br><br><span class='muted'>Серый пунктир на доске — график предыдущего шага.</span>" }));
    }

    function whyWrong(op) {
      if (op.t === "in") return "Число рядом с x, внутри. Это движение по горизонтали, и знак работает наоборот.";
      if (op.t === "out") return "Число прибавлено к функции целиком, снаружи. Это движение по вертикали, знак честный.";
      if (op.t === "a") return "Множитель стоит снаружи, перед функцией. Он меняет y, значит, работает по вертикали — от оси x.";
      if (op.t === "k") return "Множитель стоит внутри, у самого x. Он меняет x, значит, работает по горизонтали.";
      if (op.t === "abs") return "Модуль снаружи, вокруг всей функции: он делает y неотрицательными.";
      if (op.t === "absx") return "Модуль стоит у x, а не вокруг всей формулы: он работает с левой и правой половинами.";
      return "Нет.";
    }

    function showBoard() {
      stage.innerHTML = "";
      var prev = states[cur], st = states[cur + 1], op = ex.steps[cur][0];
      var b = TF.board({
        x: ex.x, y: ex.y, target: st.f, keys: st.keys, pts: st.pts,
        ghosts: [{ f: prev.f, pts: prev.pts }],
        asymV: prev.asym.v, asymH: prev.asym.h,
        splits: splitsFor(op, st), minPts: ex.base === "sqrt" ? 3 : 5,
        hint: HINT[ex.base],
        intro: "Отметь точки графика " + m("y=" + ex.steps[cur][1]) + ". Удобно взять точки серого графика и подвинуть каждую по правилу шага. Клик по точке — убрать её.",
        onDone: function (peek) {
          if (peek) anyPeek = true;
          var nb = h("button", { class: "btn btn--primary", text: cur + 1 < ex.steps.length ? "Следующий шаг →" : "Готово →", onclick: function () { cur++; step(); } });
          stage.appendChild(nb);
        }
      });
      stage.appendChild(b.el);
      b.mount();
    }

    function done() {
      var was = App.isDone(id);
      App.solve(id, anyPeek ? 12 : 25, anyPeek);
      if (!was) UI.confetti(holder);
      var gallery = h("div", { class: "chainv" });
      var src = TF.BASES[ex.base].tpl("x");
      [[src, "", ""]].concat(ex.steps.map(function (s) { return [s[1], "", TF.describe(s[0])]; })).forEach(function (s, k, arr) {
        if (k) gallery.appendChild(h("div", { class: "chainv__arrow", html: "→<small>" + s[2] + "</small>" }));
        gallery.appendChild(h("div", { class: "chainv__step" },
          h("div", { html: TF.mini2(k ? Formula.compile(arr[k - 1][0]) : null, Formula.compile(s[0]), { r: 7 }) }),
          h("div", { class: "gal__f", html: m("y=" + s[0]) })));
      });
      stage.appendChild(h("div", { class: "sliders" },
        h("p", { html: "<b>🎉 График " + m("y=" + final) + " построен!</b>" + (anyPeek ? " (с подсказкой — попробуй потом ещё раз сам)" : "") }),
        gallery,
        i + 1 < EXS.length ? h("button", { class: "btn btn--primary", style: "align-self:flex-start", text: "Следующее упражнение →", onclick: function () { onSolved(i + 1); } }) : null,
        h("button", { class: "btn btn--ghost btn--sm", style: "align-self:flex-start", text: "⟲ Построить заново", onclick: function () { onSolved(i); } })));
      if (onSolved.refresh) onSolved.refresh();
    }

    step();
  }

  App.page({
    id: "draw", order: 4, icon: "✏️", total: EXS.length, color: "var(--green)",
    title: "Рисуем по шагам", subtitle: "Формула разбита на шаги: назови преобразование, отметь точки, нарисуй график сам",
    render: function (root) {
      var sec = UI.section("Строим руками", "На каждом шаге: выбери, что происходит с графиком, → отметь точки на клетках → соедини их карандашом. Серый пунктир — график предыдущего шага: его точки удобно «переносить» по правилу.");
      var pills = h("div", { class: "fit-level" });
      var holder = h("div", { class: "sliders" });
      var cur = 0;
      function renderPills() {
        pills.innerHTML = "";
        EXS.forEach(function (ex, k) {
          pills.appendChild(h("button", { class: (k === cur ? "is-on " : "") + (App.isDone("draw:" + (k + 1)) ? "is-done" : ""), text: k + 1, title: "y = " + Formula.pretty(ex.steps[ex.steps.length - 1][1]), onclick: function () { open(k); } }));
        });
      }
      function open(k) { cur = k; renderPills(); exercise(k, holder, open); }
      open.refresh = renderPills;
      sec.appendChild(pills);
      sec.appendChild(holder);
      root.appendChild(sec);
      UI.later(function () { open(0); });
    }
  });
})();
