// Favorites shared by every page of the site: a list of stock symbols kept in this browser.
// All pages run as same-origin frames of index.html, so a change on one page reaches the others
// through the top window (live) and localStorage (kept between visits).
(() => {
  const KEY = "velora.favs";
  const read = () => { try { const v = JSON.parse(localStorage.getItem(KEY)); return Array.isArray(v) ? v : null; } catch { return null; } };
  const write = a => { try { localStorage.setItem(KEY, JSON.stringify(a)); } catch {} };
  let hub;
  try { hub = window.top.__veloraFavs ||= { list: read() || [], subs: new Set() }; }
  catch { hub = { list: read() || [], subs: new Set() }; }

  function set(list){
    hub.list = list;
    write(list);
    hub.subs.forEach(fn => { try { fn(list.slice()); } catch { hub.subs.delete(fn); } });
  }

  // Short pop over the card plus a toast, instead of a permanent mark on the card
  const css = document.createElement("style");
  css.textContent = `
    .fav-pop{position:fixed;z-index:3000;width:120px;height:120px;margin:-60px 0 0 -60px;pointer-events:none;
      animation:favPop .9s cubic-bezier(.2,.9,.3,1.2) forwards;filter:drop-shadow(0 10px 24px rgba(0,0,0,.5))}
    .fav-pop.off{animation-name:favOff}
    @keyframes favPop{0%{transform:scale(.2);opacity:0}25%{transform:scale(1.15);opacity:1}55%{transform:scale(.95);opacity:1}100%{transform:scale(1.25);opacity:0}}
    @keyframes favOff{0%{transform:scale(1);opacity:0}25%{transform:scale(1.05);opacity:.9}100%{transform:scale(.3);opacity:0}}
    .fav-toast{position:fixed;left:50%;bottom:calc(22px + env(safe-area-inset-bottom,0px));z-index:3001;transform:translate(-50%,12px);
      display:flex;align-items:center;gap:8px;padding:10px 16px;border-radius:99px;direction:rtl;white-space:nowrap;
      background:rgba(14,17,23,.92);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);
      border:1px solid rgba(255,209,102,.35);box-shadow:0 14px 34px rgba(3,7,12,.5);color:#e8eef3;
      font:500 14px "Heebo",system-ui,sans-serif;opacity:0;transition:opacity .25s,transform .25s;pointer-events:none}
    .fav-toast.on{opacity:1;transform:translate(-50%,0)}
    .fav-toast b{font-family:"JetBrains Mono",monospace;font-weight:500;direction:ltr;color:#ffd166}
    .fav-toast.off{border-color:rgba(160,220,235,.2)} .fav-toast.off b{color:#b9c8d1}
    @media (prefers-reduced-motion:reduce){.fav-pop{animation-duration:.01s}.fav-toast{transition:none}}`;
  document.head.appendChild(css);

  const STAR = `<svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M12 2.6l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.4l-5.8 3.1 1.1-6.5L2.6 9.4l6.5-.9z"
    fill="FILL" stroke="STROKE" stroke-width="1.2" stroke-linejoin="round"/></svg>`;
  let toast, toastT;
  function feedback(el, sym, on){
    if (el) {
      const r = el.getBoundingClientRect();
      const p = document.createElement("div");
      p.className = "fav-pop" + (on ? "" : " off");
      p.innerHTML = on ? STAR.replace("FILL", "#ffd166").replace("STROKE", "#fff3c4")
                       : STAR.replace("FILL", "none").replace("STROKE", "#b9c8d1");
      p.style.left = r.left + r.width / 2 + "px";
      p.style.top = r.top + r.height / 2 + "px";
      document.body.appendChild(p);
      setTimeout(() => p.remove(), 950);
    }
    if (!toast) {
      toast = document.createElement("div");
      toast.className = "fav-toast";
      toast.setAttribute("role", "status");
      document.body.appendChild(toast);
    }
    toast.classList.toggle("off", !on);
    toast.innerHTML = on ? `<b>${sym}</b> נשמרה במועדפים` : `<b>${sym}</b> הוסרה מהמועדפים`;
    toast.classList.add("on");
    clearTimeout(toastT);
    toastT = setTimeout(() => toast.classList.remove("on"), 1800);
  }

  window.Favs = {
    list: () => hub.list.slice(),
    has: sym => hub.list.includes(sym),
    // Adds or removes a symbol; `el` is the card to pop the feedback over
    toggle(sym, el){
      const on = !hub.list.includes(sym);
      set(on ? [...hub.list, sym] : hub.list.filter(s => s !== sym));
      feedback(el, sym, on);
      return on;
    },
    remove(sym){ set(hub.list.filter(s => s !== sym)); },
    onChange(fn){
      hub.subs.add(fn);
      addEventListener("pagehide", () => hub.subs.delete(fn));
    }
  };
  // Another tab of the site changed the list
  addEventListener("storage", e => {
    if (e.key !== KEY) return;
    const v = read();
    if (v && JSON.stringify(v) !== JSON.stringify(hub.list)) set(v);
  });
})();
