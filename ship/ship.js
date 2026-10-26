/* Convenium.Design ship console — hand-authored source.
   Reads window.CONVENIUM_SHIP_DATA (generated: `python library/tools/project.py ship`).
   Local customisation (hired crew, ship choice, loadout picks) lives in localStorage only;
   the library stays the source of truth. */
(function () {
  "use strict";

  var DATA = window.CONVENIUM_SHIP_DATA;
  if (!DATA) {
    var warn = document.createElement("div");
    warn.className = "data-missing";
    warn.innerHTML = "<strong>No console data.</strong> Generate it with " +
      "<code>python library/tools/project.py ship</code> and reload.";
    document.body.prepend(warn);
    return;
  }

  // --- local state (per-browser customisation only) ------------------------
  var KEY = "conveniumShip.v1";
  function loadState() {
    try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; }
  }
  function saveState() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* private mode: view-only */ }
  }
  var state = loadState();
  state.crewOverrides = state.crewOverrides || {};
  state.loadout = state.loadout || {};

  var byAgent = {};
  DATA.agents.forEach(function (a) { byAgent[a.id] = a; });

  function crewMember(id) {
    var base = DATA.crew.find(function (m) { return m.id === id; });
    var o = state.crewOverrides[id];
    if (!base) return base;
    if (!o) return base;
    var m = JSON.parse(JSON.stringify(base));
    ["name", "species", "essence", "analogy", "glyph"].forEach(function (k) {
      if (o[k]) m[k] = o[k];
    });
    m.hired = true;
    return m;
  }

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  // --- the bridge -----------------------------------------------------------
  // Station positions over the hull SVG (percent of the hull-wrap box).
  var POS = {
    1: { x: 46, y: 24 },  // captain, bridge dome
    2: { x: 17, y: 62 },
    3: { x: 30, y: 68 },
    4: { x: 44, y: 63 },
    5: { x: 58, y: 68 },
    6: { x: 72, y: 62 },
    7: { x: 81, y: 50 }
  };
  var stationsBox = document.getElementById("stations");
  var sheet = document.getElementById("crew-sheet");
  var openId = null;

  function renderStations() {
    stationsBox.textContent = "";
    DATA.crew.forEach(function (base) {
      var m = crewMember(base.id);
      var p = POS[m.station] || { x: 50, y: 50 };
      var b = el("button", "station");
      b.style.left = p.x + "%";
      b.style.top = p.y + "%";
      b.style.setProperty("--pigment", m.pigment);
      b.setAttribute("aria-expanded", String(openId === m.id));
      b.setAttribute("aria-label", "Station " + m.station + ": " + m.name + ", " + m.role.title);
      var tok = el("span", "token", m.glyph);
      var tag = el("span", "tag", m.name.split(" ")[0] + (m.hired ? " ★" : ""));
      b.append(tok, tag);
      b.addEventListener("click", function () {
        openId = openId === m.id ? null : m.id;
        renderStations();
        renderSheet();
      });
      stationsBox.append(b);
    });
  }

  function renderSheet() {
    sheet.hidden = openId === null;
    sheet.textContent = "";
    if (openId === null) return;
    var m = crewMember(openId);
    var agent = byAgent[m.role.agent] || { skills: [], access: "" };
    sheet.style.setProperty("--pigment", m.pigment);

    var kick = el("div", "sheet-kicker");
    kick.append(el("span", "badge", "Station " + m.station));
    kick.append(el("span", null, m.phase + " phase"));
    kick.append(el("span", null, agent.access === "read-only" ? "read-only" : "writes"));
    if (m.hired) kick.append(el("span", "hired-note", "★ hired by you (this browser)"));
    var h = el("h3", null, m.name);
    var role = el("p", "role", m.role.title + " — " + m.species);
    var aid = el("p", "agent-id", m.role.agent);
    var q = el("blockquote", "quote", "“" + m.analogy + "”");
    var plain = el("p", "plain", m.plainMeaning);
    var ess = el("p", null, m.essence);
    sheet.append(kick, h, role, aid, q, plain, ess);

    function list(title, items, sim) {
      sheet.append(el("h4", null, title));
      var ul = el("ul");
      items.forEach(function (it) {
        var li = el("li", null, sim ? it.hypothesis : it);
        if (sim) li.append(Object.assign(el("span", "sim", it.truth), { title: "Invented character trait, not a measured fact" }));
        ul.append(li);
      });
      sheet.append(ul);
    }
    list("Strengths", m.strengths);
    list("Blind spots", m.blindSpots, true);
    sheet.append(el("h4", null, "Working on"));
    sheet.append(el("p", "plain", m.working + " · simulated"));
    if (agent.skills.length) {
      sheet.append(el("h4", null, "Carries the skills"));
      var chips = el("div", "skill-chips");
      agent.skills.forEach(function (s) { chips.append(el("span", null, s)); });
      sheet.append(chips);
    }

    var actions = el("div", "sheet-actions");
    var hire = el("button", "primary", m.hired ? "Edit your crew member" : "Hire a replacement");
    var close = el("button", null, "Close");
    actions.append(hire, close);
    sheet.append(actions);
    close.addEventListener("click", function () { openId = null; renderStations(); renderSheet(); });
    hire.addEventListener("click", function () { renderHireForm(m); });
    if (m.hired) {
      var fire = el("button", null, "Restore the default");
      actions.append(fire);
      fire.addEventListener("click", function () {
        delete state.crewOverrides[m.id];
        saveState(); renderStations(); renderSheet();
      });
    }
  }

  function renderHireForm(m) {
    var old = sheet.querySelector(".hire-form");
    if (old) { old.remove(); return; }
    var f = el("form", "hire-form");
    function field(label, name, value, long) {
      var l = el("label", null, label);
      var input = long ? el("textarea") : el("input");
      input.name = name;
      input.value = value;
      if (long) input.rows = 2;
      l.append(input);
      return l;
    }
    f.append(
      field("Name", "name", m.name),
      field("Glyph (one emoji)", "glyph", m.glyph),
      field("Species / look", "species", m.species, true),
      field("Essence — who they are on the ship", "essence", m.essence, true),
      field("Their line on the bridge", "analogy", m.analogy, true)
    );
    var save = el("button", "primary", "Sign them on");
    save.type = "submit";
    f.append(save);
    f.append(el("p", "plain", "The agent underneath (" + m.role.agent + ") and what it verifiably does stay the same — a hire changes the character, not the pipeline."));
    f.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var o = {};
      ["name", "glyph", "species", "essence", "analogy"].forEach(function (k) {
        var v = f.elements[k].value.trim();
        if (v) o[k] = v;
      });
      state.crewOverrides[m.id] = o;
      saveState(); renderStations(); renderSheet();
    });
    sheet.append(f);
  }

  // --- the voyage -----------------------------------------------------------
  var shipSelect = document.getElementById("ship-select");
  var ships = DATA.workflows.ships;
  function currentShip() {
    return ships.find(function (s) { return s.id === (state.ship || DATA.workflows.default); }) || ships[0];
  }
  ships.forEach(function (s) {
    var o = el("option", null, s.name + " · " + s["class"]);
    o.value = s.id;
    shipSelect.append(o);
  });
  shipSelect.value = currentShip().id;
  shipSelect.addEventListener("change", function () {
    state.ship = shipSelect.value;
    saveState(); renderVoyage();
  });

  function renderVoyage() {
    var ship = currentShip();
    document.getElementById("voyage-sub").textContent = ship.name + " — " + ship.summary;
    var ol = document.getElementById("stages");
    ol.textContent = "";
    var n = 0;
    ship.stages.forEach(function (st) {
      if (st.gate) {
        var g = el("li", "gate");
        g.append(el("span", "diamond"), el("span", null, st.label));
        ol.append(g);
        return;
      }
      n += 1;
      var li = el("li", "stage");
      li.append(el("span", "ord", String(n)));
      var body = el("div");
      body.append(el("div", "ph", st.phase));
      var lbl = el("div", "lbl", st.label);
      var minis = el("span", "minis");
      (st.crew || []).forEach(function (cid) {
        var cm = crewMember(cid);
        if (!cm) return;
        var i = el("i", null, cm.glyph);
        i.title = cm.name;
        i.style.setProperty("--pigment", cm.pigment);
        minis.append(i);
      });
      lbl.append(minis);
      body.append(lbl);
      if (st.artifacts && st.artifacts.length) body.append(el("div", "artifacts", st.artifacts.join(" · ")));
      li.append(body);
      ol.append(li);
    });
    renderPhaseSkills(ship);
  }

  function renderPhaseSkills(ship) {
    var box = document.getElementById("phase-skills-body");
    box.textContent = "";
    if (ship.skills && ship.skills.length) {
      box.append(el("h5", null, "This ship routes"));
      var chips = el("div", "skill-chips");
      ship.skills.forEach(function (s) { chips.append(el("span", null, s)); });
      box.append(chips);
      return;
    }
    var phases = [];
    ship.stages.forEach(function (st) {
      if (!st.gate && phases.indexOf(st.phase) < 0) phases.push(st.phase);
    });
    if (phases.indexOf("always") < 0) phases.unshift("always");
    phases.forEach(function (ph) {
      var sks = DATA.skills.filter(function (s) { return s.routed && s.phase === ph; });
      if (!sks.length) return;
      box.append(el("h5", null, ph));
      var chips = el("div", "skill-chips");
      sks.forEach(function (s) {
        var c = el("span", null, s.id);
        c.title = s.line;
        chips.append(c);
      });
      box.append(chips);
    });
  }

  // --- the loadout ----------------------------------------------------------
  function renderSlots() {
    var box = document.getElementById("slots");
    box.textContent = "";
    DATA.slots.forEach(function (slot) {
      var card = el("div", "slot");
      card.append(el("h3", null, slot.name));
      card.append(el("p", "q", slot.question));
      var picked = state.loadout[slot.id] || slot["default"];
      slot.candidates.forEach(function (c) {
        var l = el("label", c.skill === picked ? "picked" : "");
        var r = document.createElement("input");
        r.type = "radio";
        r.name = "slot-" + slot.id;
        r.checked = c.skill === picked;
        var sk = el("span", "sk", c.skill);
        if (c.skill === slot["default"]) sk.append(el("span", "def", "default"));
        l.append(r, sk, el("span", "chg", c.changes));
        l.addEventListener("change", function () {
          state.loadout[slot.id] = c.skill;
          saveState(); renderSlots();
        });
        card.append(l);
      });
      box.append(card);
    });
  }

  // --- chrome ---------------------------------------------------------------
  document.getElementById("reset-custom").addEventListener("click", function () {
    if (!confirm("Forget the hired crew, ship choice and loadout picks stored in this browser?")) return;
    state = { crewOverrides: {}, loadout: {} };
    saveState();
    shipSelect.value = DATA.workflows.default;
    openId = null;
    renderStations(); renderSheet(); renderVoyage(); renderSlots();
  });

  var routed = DATA.skills.filter(function (s) { return s.routed; }).length;
  document.getElementById("colophon-counts").textContent =
    DATA.crew.length + " crew · " + ships.length + " ships · " + routed + " routed skills of " +
    DATA.skills.length + " in the library · " + DATA.doctrines.length + " doctrines.";

  renderStations();
  renderSheet();
  renderVoyage();
  renderSlots();
})();
