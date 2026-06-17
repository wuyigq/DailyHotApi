import type { FC } from "hono/jsx";
import { raw, html } from "hono/html";
import Layout from "./Layout.js";

const styles = `
.home-main {
  max-width: 1200px;
  width: 100%;
  padding: 20px;
  margin: 0 auto;
  display: block;
  height: auto;
}
.home-header {
  text-align: center;
  padding: 30px 0 10px;
  position: relative;
}
.home-header h1 {
  font-size: 28px;
  font-weight: bold;
  margin-bottom: 8px;
  color: var(--text-color);
}
.home-header p {
  font-size: 16px;
  opacity: 0.7;
  color: var(--text-color);
}
/* settings button */
.settings-btn {
  position: absolute;
  right: 0;
  top: 34px;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 14px;
  border: 1px solid var(--card-border);
  border-radius: 8px;
  background: var(--card-bg);
  color: var(--text-color);
  cursor: pointer;
  font-size: 13px;
  transition: background 0.2s, border-color 0.2s;
  opacity: 0.8;
}
.settings-btn:hover {
  opacity: 1;
  border-color: rgba(128,128,128,0.3);
  background: rgba(128,128,128,0.06);
}
.theme-btn {
  position: absolute;
  right: 80px;
  top: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border: 1px solid var(--card-border);
  border-radius: 8px;
  background: var(--card-bg);
  color: var(--text-color);
  cursor: pointer;
  font-size: 16px;
  transition: background 0.2s, border-color 0.2s;
  opacity: 0.8;
}
.theme-btn:hover {
  opacity: 1;
  border-color: rgba(128,128,128,0.3);
  background: rgba(128,128,128,0.06);
}
.theme-btn svg {
  width: 17px;
  height: 17px;
}
.settings-btn svg {
  width: 15px;
  height: 15px;
}
/* settings overlay */
.settings-overlay {
  position: fixed;
  top: 0; left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0,0,0,0.4);
  z-index: 1000;
  display: none;
  align-items: center;
  justify-content: center;
}
.settings-overlay.open {
  display: flex;
}
.settings-modal {
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: 16px;
  width: 440px;
  max-width: 90vw;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 8px 32px rgba(0,0,0,0.15);
  overflow: hidden;
}
.settings-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18px 20px 14px;
  border-bottom: 1px solid var(--card-border);
}
.settings-modal-header h2 {
  font-size: 17px;
  font-weight: 600;
  margin: 0;
  color: var(--text-color);
}
.settings-modal-header .count {
  font-size: 12px;
  opacity: 0.5;
  font-weight: normal;
}
.settings-close-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: none;
  cursor: pointer;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-color);
  opacity: 0.5;
  transition: opacity 0.2s, background 0.2s;
  font-size: 18px;
}
.settings-close-btn:hover {
  opacity: 1;
  background: rgba(128,128,128,0.1);
}
.settings-modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
}
.settings-platform-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 20px;
  transition: background 0.15s;
}
.settings-platform-item:hover {
  background: rgba(128,128,128,0.03);
}
.settings-platform-left {
  display: flex;
  align-items: center;
  gap: 10px;
}
.settings-platform-icon {
  width: 20px;
  height: 20px;
  border-radius: 4px;
  flex-shrink: 0;
}
.settings-platform-name {
  font-size: 14px;
  color: var(--text-color);
}
.settings-platform-type {
  font-size: 11px;
  opacity: 0.5;
  color: var(--text-color);
}
/* toggle switch */
.toggle-switch {
  position: relative;
  width: 44px;
  height: 26px;
  flex-shrink: 0;
}
.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}
.toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(128,128,128,0.25);
  border-radius: 26px;
  transition: background 0.25s;
}
.toggle-slider::before {
  content: "";
  position: absolute;
  height: 20px;
  width: 20px;
  left: 3px;
  bottom: 3px;
  background: #fff;
  border-radius: 50%;
  transition: transform 0.25s;
}
.toggle-switch input:checked + .toggle-slider {
  background: #4CAF50;
}
.toggle-switch input:checked + .toggle-slider::before {
  transform: translateX(18px);
}
.settings-modal-footer {
  display: flex;
  gap: 10px;
  padding: 12px 20px 18px;
  border-top: 1px solid var(--card-border);
}
.settings-modal-footer button {
  flex: 1;
  padding: 8px 0;
  border: 1px solid rgba(128,128,128,0.2);
  border-radius: 8px;
  background: transparent;
  color: var(--text-color);
  cursor: pointer;
  font-size: 13px;
  transition: background 0.15s;
}
.settings-modal-footer button:hover {
  background: rgba(128,128,128,0.08);
}
/* card grid */
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 16px;
  padding: 10px 0 30px;
}
.card {
  border: 1px solid var(--card-border);
  border-radius: 12px;
  overflow: hidden;
  background: var(--card-bg);
  box-shadow: var(--card-shadow);
  transition: border-color 0.2s, box-shadow 0.2s;
  min-height: 220px;
}
.card:hover {
  border-color: rgba(128,128,128,0.25);
  box-shadow: 0 2px 12px rgba(0,0,0,0.08);
}
.card-hidden {
  display: none;
}
/* drag-and-drop */
.card {
  cursor: default;
  -webkit-user-drag: element;
}
.card.dragging {
  opacity: 0.4;
  transform: scale(0.95);
  transition: opacity 0.15s, transform 0.15s;
}
.card.drag-over {
  border-color: #667eea;
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.3);
  transition: border-color 0.15s, box-shadow 0.15s;
}
.drag-handle {
  cursor: grab;
  display: inline-flex;
  align-items: center;
  padding: 2px 6px;
  margin-right: 4px;
  border-radius: 4px;
  opacity: 0.3;
  transition: opacity 0.15s, background 0.15s;
  font-size: 16px;
  letter-spacing: 1px;
  line-height: 1;
  user-select: none;
}
.drag-handle:hover {
  opacity: 0.7;
  background: rgba(128,128,128,0.1);
}
.drag-handle:active {
  cursor: grabbing;
}
.card-close-btn {
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 6px;
  border: none;
  background: transparent;
  color: var(--text-color);
  opacity: 0.25;
  font-size: 14px;
  transition: opacity 0.15s, background 0.15s;
  flex-shrink: 0;
  line-height: 1;
}
.card-close-btn:hover {
  opacity: 0.7;
  background: rgba(255, 77, 79, 0.12);
  color: #ff4d4f;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  border-bottom: 1px solid var(--card-border);
}
.card-name {
  font-size: 16px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-color);
}
.card-favicon {
  width: 20px;
  height: 20px;
  border-radius: 4px;
  flex-shrink: 0;
}
.card-favicon-fallback {
  width: 20px;
  height: 20px;
  border-radius: 4px;
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
  color: #fff;
  background: #667eea;
}
.skeleton-favicon {
  width: 20px;
  height: 20px;
  border-radius: 4px;
  flex-shrink: 0;
  background: rgba(128,128,128,0.15);
}
.card-type {
  font-size: 12px;
  opacity: 0.6;
  background: rgba(128,128,128,0.1);
  padding: 2px 8px;
  border-radius: 10px;
  color: var(--text-color);
}
.card-body {
  padding: 8px 16px 12px;
}
.card-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 7px 0;
  border-bottom: 1px solid var(--card-border);
}
.card-item:last-child {
  border-bottom: none;
}
.item-index {
  font-size: 13px;
  font-weight: 700;
  min-width: 20px;
  text-align: center;
  opacity: 0.5;
  color: var(--text-color);
}
.card-item:nth-child(-n+3) .item-index {
  color: #e74c3c;
  opacity: 1;
}
.item-title {
  flex: 1;
  font-size: 14px;
  text-decoration: none;
  color: var(--text-color);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: opacity 0.15s;
}
.item-title:hover {
  opacity: 0.7;
}
.item-hot {
  font-size: 11px;
  opacity: 0.5;
  white-space: nowrap;
  color: var(--text-color);
}
.card-footer {
  padding: 8px 16px 14px;
  text-align: center;
}
.card-footer a {
  font-size: 13px;
  text-decoration: none;
  opacity: 0.5;
  color: var(--text-color);
  transition: opacity 0.15s;
}
.card-footer a:hover {
  opacity: 0.8;
}
/* skeleton */
.card.skeleton .card-body {
  padding: 8px 16px 14px;
}
.skeleton-text {
  background: rgba(128,128,128,0.12);
  border-radius: 6px;
  animation: shimmer 1.5s infinite;
  background-size: 200% 100%;
  background-image: linear-gradient(
    90deg,
    rgba(128,128,128,0.06) 25%,
    rgba(128,128,128,0.15) 50%,
    rgba(128,128,128,0.06) 75%
  );
}
.skeleton-text-title {
  height: 20px;
  width: 80px;
}
.skeleton-text-type {
  height: 20px;
  width: 50px;
}
.skeleton-text-item {
  height: 16px;
  margin-bottom: 10px;
  width: 100%;
}
.skeleton-text-item:last-child {
  width: 70%;
  margin-bottom: 0;
}
@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
/* error */
.card-error .card-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 30px 16px;
  color: var(--text-color);
  opacity: 0.6;
}
.retry-btn {
  padding: 6px 16px;
  border: 1px solid var(--text-color);
  border-radius: 8px;
  background: transparent;
  color: var(--text-color);
  cursor: pointer;
  font-size: 13px;
  transition: background 0.15s, color 0.15s;
}
.retry-btn:hover {
  background: var(--text-color);
  color: var(--text-color-hover);
}
/* loading */
.loading-indicator {
  grid-column: 1 / -1;
  text-align: center;
  padding: 60px 0;
  opacity: 0.5;
  color: var(--text-color);
}
/* responsive */
@media (max-width: 768px) {
  .card-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  .home-header { padding: 20px 0 8px; }
  .home-header h1 { font-size: 22px; }
  .home-main { padding: 12px; }
  .theme-btn { top: 22px; right: 38px; width: 30px; height: 30px; }
  .settings-btn { top: 24px; right: -4px; padding: 5px 10px; font-size: 12px; }
  .settings-modal { width: 95vw; max-height: 85vh; border-radius: 12px; }
}
`;

const Home: FC = () => {
  return (
    <Layout title="今日热榜">
      {raw(`<style>${styles}</style>`)}
      <main class="home-main">
        <div class="home-header">
          <h1>🔥 今日热榜</h1>
          <p>聚合全网热门数据，实时更新</p>
          <button class="theme-btn" id="theme-btn" title="切换主题">☀️</button>
          <button class="settings-btn" id="settings-btn" title="设置">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
            设置
          </button>
        </div>
        <div id="card-grid" class="card-grid">
          <div class="loading-indicator">加载中…</div>
        </div>
      </main>
      {/* Settings modal */}
      {raw(`
        <div class="settings-overlay" id="settings-overlay">
          <div class="settings-modal">
            <div class="settings-modal-header">
              <h2>⚙️ 显示设置 <span class="count" id="settings-count"></span></h2>
              <button class="settings-close-btn" id="settings-close-btn">✕</button>
            </div>
            <div class="settings-modal-body" id="settings-list"></div>
            <div class="settings-modal-footer">
              <button id="settings-select-all">全部显示</button>
              <button id="settings-deselect-all">全部隐藏</button>
            </div>
          </div>
        </div>
      `)}
      {html`
        <script>
          (function () {
            var grid = document.getElementById("card-grid");
            if (!grid) return;

            /* ======== Theme Toggle ======== */
            (function() {
              var btn = document.getElementById("theme-btn");
              if (!btn) return;
              function setIcon(t) {
                btn.textContent = t === "dark" ? "\u{1F319}" : "☀️";
              }
              setIcon(document.documentElement.getAttribute("data-theme"));
              btn.addEventListener("click", function() {
                var next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
                document.documentElement.setAttribute("data-theme", next);
                localStorage.setItem("hot-theme", next);
                setIcon(next);
              });
            })();

            /* ======== Utilities ======== */
            function escapeHTML(str) {
              var div = document.createElement("div");
              div.textContent = str;
              return div.innerHTML;
            }
            function escapeAttr(str) {
              return String(str).replace(/"/g, "&quot;");
            }
            var MAX_ITEMS = 5;

            /* ======== Shared State ======== */
            var allRoutes = [];
            var cardMap = {};
            var hiddenPlatforms = {};
            try {
              var stored = localStorage.getItem("hidden-platforms");
              if (stored) stored.split(",").forEach(function(n) { hiddenPlatforms[n.trim()] = true; });
            } catch(e) {}

            function saveHidden() {
              var h = [];
              for (var k in hiddenPlatforms) { if (hiddenPlatforms[k]) h.push(k); }
              localStorage.setItem("hidden-platforms", h.join(","));
            }

            function updateSettingsCount() {
              var el = document.getElementById("settings-count");
              if (!el) return;
              var visible = allRoutes.length;
              for (var k in hiddenPlatforms) { if (hiddenPlatforms[k]) visible--; }
              el.textContent = "已选 " + visible + "/" + allRoutes.length;
            }

            /* ======== Settings Panel ======== */
            function renderSettingsList() {
              var list = document.getElementById("settings-list");
              if (!list) return;
              var html = "";
              allRoutes.forEach(function(route) {
                var checked = hiddenPlatforms[route.name] ? "" : " checked";
                html += '<div class="settings-platform-item">' +
                  '<div class="settings-platform-left">' +
                  '<span class="settings-platform-name">' + escapeHTML(route.name) + '</span>' +
                  '</div>' +
                  '<label class="toggle-switch">' +
                  '<input type="checkbox"' + checked + ' data-platform="' + escapeAttr(route.name) + '">' +
                  '<span class="toggle-slider"></span>' +
                  '</label>' +
                  '</div>';
              });
              list.innerHTML = html;
              updateSettingsCount();
              list.querySelectorAll("input[type=checkbox]").forEach(function(cb) {
                cb.addEventListener("change", function() {
                  var name = cb.getAttribute("data-platform");
                  hiddenPlatforms[name] = !cb.checked;
                  saveHidden();
                  updateSettingsCount();
                  var card = document.getElementById("card-" + name);
                  if (card) card.classList.toggle("card-hidden", !cb.checked);
                });
              });
            }

            (function() {
              var btn = document.getElementById("settings-btn");
              var overlay = document.getElementById("settings-overlay");
              var close = document.getElementById("settings-close-btn");
              var selectAll = document.getElementById("settings-select-all");
              var deselectAll = document.getElementById("settings-deselect-all");
              if (btn) btn.addEventListener("click", function() { overlay.classList.add("open"); renderSettingsList(); });
              if (close) close.addEventListener("click", function() { overlay.classList.remove("open"); });
              if (overlay) overlay.addEventListener("click", function(e) { if (e.target === overlay) overlay.classList.remove("open"); });
              if (selectAll) selectAll.addEventListener("click", function() {
                allRoutes.forEach(function(r) { hiddenPlatforms[r.name] = false; });
                saveHidden(); renderSettingsList();
                allRoutes.forEach(function(r) { var c = document.getElementById("card-" + r.name); if (c) c.classList.remove("card-hidden"); });
              });
              if (deselectAll) deselectAll.addEventListener("click", function() {
                allRoutes.forEach(function(r) { hiddenPlatforms[r.name] = true; });
                saveHidden(); renderSettingsList();
                allRoutes.forEach(function(r) { var c = document.getElementById("card-" + r.name); if (c) c.classList.add("card-hidden"); });
              });
            })();

            /* ======== Card close button delegation ======== */
            grid.addEventListener("click", function(e) {
              var closeBtn = e.target.closest(".card-close-btn");
              if (!closeBtn) return;
              e.stopPropagation();
              var routeName = closeBtn.getAttribute("data-route");
              if (routeName) hideCard(routeName);
            });

            /* ======== Favicon with override map + text fallback ======== */
            var PLATFORM_ICONS = {
              "earthquake": "/logo/earthquake.svg",
              "baidu": "https://www.baidu.com/favicon.ico",
              "hupu": "https://www.hupu.com/favicon.ico",
              "sspai": "https://cdn.sspai.com/favicon.ico",
              "douban-group": "https://www.douban.com/favicon.ico",
              "52pojie": "https://www.52pojie.cn/favicon.ico",
              "geekpark": "/logo/geekpark.svg",
              "yystv": "/logo/yystv.svg",
              "hostloc": "https://hostloc.com/favicon.ico",
              "weatheralarm": "/logo/weatheralarm.svg",
              "nodeseek": "https://nodeseek.com/favicon.ico",
              "linuxdo": "https://linux.do/favicon.ico"
            };

            function faviconURL(link, name) {
              if (PLATFORM_ICONS[name]) return PLATFORM_ICONS[name];
              if (!link) return "";
              try {
                var hostname = new URL(link).hostname;
                return "https://" + hostname + "/favicon.ico";
              } catch(e) { return ""; }
            }

            function faviconHTML(link, name) {
              var src = faviconURL(link, name);
              if (src) {
                return '<img class="card-favicon" src="' + escapeAttr(src) + '" alt="" loading="lazy" data-platform="' + escapeAttr(name) + '">';
              }
              return '<span class="card-favicon-fallback">' + escapeHTML(name.charAt(0).toUpperCase()) + '</span>';
            }

            function attachFaviconFallback(card) {
              var img = card.querySelector(".card-favicon");
              if (!img) return;
              img.addEventListener("error", function() {
                var span = document.createElement("span");
                span.className = "card-favicon-fallback";
                var name = img.getAttribute("data-platform") || "";
                span.textContent = name.charAt(0).toUpperCase();
                img.parentNode.replaceChild(span, img);
              });
            }

            /* ======== Card Rendering ======== */
            function createSkeletonHTML() {
              return (
                '<div class="card-header">' +
                '<span class="card-name"><span class="drag-handle" title="拖拽排序">⋮⋮</span><span class="skeleton-favicon"></span><span class="skeleton-text skeleton-text-title"></span></span>' +
                '<span class="skeleton-text skeleton-text-type"></span>' +
                '<span class="card-close-btn" title="隐藏此热榜">✕</span>' +
                "</div>" +
                '<div class="card-body">' +
                Array(MAX_ITEMS)
                  .fill('<div class="skeleton-text skeleton-text-item"></div>')
                  .join("") +
                "</div>"
              );
            }

            function hideCard(routeName) {
              hiddenPlatforms[routeName] = true;
              saveHidden();
              var card = document.getElementById("card-" + routeName);
              if (card) card.classList.add("card-hidden");
            }

            function updateCard(card, data, route) {
              card.classList.remove("skeleton");
              var fav = faviconHTML(data.link, route.name);
              var items = data.data && data.data.length
                ? data.data.slice(0, MAX_ITEMS).map(function (item, i) {
                var title = item.title || "";
                var url = item.url || item.mobileUrl || "#";
                var hot = item.hot;
                var hotHTML = (hot !== undefined && hot !== null)
                  ? '<span class="item-hot">' + escapeHTML(String(hot)) + "</span>"
                  : "";
                return (
                  '<div class="card-item">' +
                  '<span class="item-index">' + (i + 1) + "</span>" +
                  '<a href="' + escapeAttr(url) + '" target="_blank" rel="noopener" class="item-title" title="' +
                  escapeAttr(title) + '">' + escapeHTML(title) + "</a>" +
                  hotHTML +
                  "</div>"
                );
              }).join("")
                : '<div style="text-align:center;padding:30px;opacity:0.5;color:var(--text-color)">暂无数据</div>';
              card.innerHTML =
                '<div class="card-header">' +
                '<span class="card-name"><span class="drag-handle" title="拖拽排序">⋮⋮</span>' + fav + escapeHTML(data.title || route.name) + "</span>" +
                '<span class="card-type">' + escapeHTML(data.type || "") + "</span>" +
                '<span class="card-close-btn" title="隐藏此热榜" data-route="' + escapeAttr(route.name) + '">✕</span>' +
                "</div>" +
                '<div class="card-body">' + items + "</div>" +
                (data.link
                  ? '<div class="card-footer"><a href="' + escapeAttr(data.link) +
                    '" target="_blank" rel="noopener">查看更多 →</a></div>'
                  : "");
              attachFaviconFallback(card);
            }

            function showError(card, route) {
              card.classList.remove("skeleton");
              card.classList.add("card-error");
              card.innerHTML =
                '<div class="card-header"><span class="card-name"><span class="drag-handle" title="拖拽排序">⋮⋮</span>' +
                escapeHTML(route.name) + "</span>" +
                '<span class="card-close-btn" title="隐藏此热榜" data-route="' + escapeAttr(route.name) + '">✕</span>' +
                "</div>" +
                '<div class="card-body"><span>加载失败</span>' +
                '<button class="retry-btn">重新加载</button></div>';
              card.querySelector(".retry-btn").addEventListener("click", function () {
                card.classList.remove("card-error");
                card.classList.add("skeleton");
                card.innerHTML = createSkeletonHTML();
                fetchData(route, card);
              });
            }

            function fetchData(route, card) {
              fetch(route.path)
                .then(function (r) { return r.json(); })
                .then(function (data) {
                  if (data && data.code === 200) {
                    updateCard(card, data, route);
                  } else {
                    showError(card, route);
                  }
                })
                .catch(function () { showError(card, route); });
            }

            /* ======== Init ======== */
            fetch("/all")
              .then(function (r) { return r.json(); })
              .then(function (data) {
                if (!data || !data.routes || !data.routes.length) {
                  grid.innerHTML = '<div class="loading-indicator">暂无数据</div>';
                  return;
                }
                grid.innerHTML = "";
                allRoutes = data.routes;
                /* ======== Drag and Drop Order ======== */
                var draggedCard = null;

                function getCardOrder() {
                  var order = [];
                  grid.querySelectorAll(".card").forEach(function(c) {
                    var name = c.id.replace("card-", "");
                    order.push(name);
                  });
                  return order;
                }

                function saveCardOrder() {
                  try {
                    localStorage.setItem("card-order", JSON.stringify(getCardOrder()));
                  } catch(e) {}
                }

                function restoreCardOrder() {
                  try {
                    var saved = localStorage.getItem("card-order");
                    if (!saved) return;
                    var order = JSON.parse(saved);
                    order.forEach(function(name) {
                      var card = document.getElementById("card-" + name);
                      if (card) grid.appendChild(card);
                    });
                  } catch(e) {}
                }

                function attachDragEvents(card) {
                  card.addEventListener("dragstart", function(e) {
                    draggedCard = card;
                    card.classList.add("dragging");
                    e.dataTransfer.setData("text/plain", "");
                    e.dataTransfer.effectAllowed = "move";
                  });

                  card.addEventListener("dragend", function() {
                    card.classList.remove("dragging");
                    grid.querySelectorAll(".card.drag-over").forEach(function(c) {
                      c.classList.remove("drag-over");
                    });
                    saveCardOrder();
                  });

                  card.addEventListener("dragover", function(e) {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = "move";
                    if (card !== draggedCard) {
                      card.classList.add("drag-over");
                    }
                  });

                  card.addEventListener("dragleave", function() {
                    card.classList.remove("drag-over");
                  });

                  card.addEventListener("drop", function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    card.classList.remove("drag-over");
                    if (card === draggedCard || !draggedCard) return;

                    var cards = Array.from(grid.children);
                    var fromIdx = cards.indexOf(draggedCard);
                    var toIdx = cards.indexOf(card);

                    if (fromIdx < toIdx) {
                      grid.insertBefore(draggedCard, card.nextSibling);
                    } else {
                      grid.insertBefore(draggedCard, card);
                    }
                    saveCardOrder();
                  });
                }

                allRoutes.forEach(function (route) {
                  var card = document.createElement("div");
                  card.className = "card skeleton";
                  card.id = "card-" + route.name;
                  card.setAttribute("draggable", "true");
                  card.innerHTML = createSkeletonHTML();
                  if (hiddenPlatforms[route.name]) card.classList.add("card-hidden");
                  grid.appendChild(card);
                  cardMap[route.name] = card;
                  attachDragEvents(card);
                });

                /* Restore saved order */
                restoreCardOrder();

                allRoutes.forEach(function (route) {
                  fetchData(route, cardMap[route.name]);
                });
              })
              .catch(function () {
                grid.innerHTML = '<div class="loading-indicator">加载失败，请刷新页面重试</div>';
              });
          })();
        </script>
      `}
    </Layout>
  );
};

export default Home;
