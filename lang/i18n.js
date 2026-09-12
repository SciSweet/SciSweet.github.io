/*  SciSuite i18n — shared language switcher (top bar)
 *
 *  Usage: add before </body> in any page:
 *    <script src="../lang/i18n.js" data-json="../lang/PAGE-zh.json"></script>
 *    (Root-level pages: src="lang/i18n.js" data-json="lang/PAGE-zh.json")
 *
 *  FOUC prevention — add in <head>:
 *    <script>
 *    (function(){ if(localStorage.getItem('scisuite-lang')==='zh'){
 *        document.documentElement.classList.add('i18n-loading');
 *    } })();
 *    </script>
 */
(function () {
    var LANG_KEY = 'scisuite-lang';

    // --- 1. Find JSON path ---
    var scriptEl = document.querySelector('script[data-json]');
    var jsonPath = scriptEl ? scriptEl.getAttribute('data-json') : null;

    // --- 2. Inject CSS ---
    var css = document.createElement('style');
    css.textContent =
        '.i18n-bar{position:fixed;top:0;left:0;right:0;z-index:1001;height:28px;' +
        'display:flex;align-items:center;justify-content:space-between;' +
        'padding:0 clamp(20px,5vw,48px);' +
        'background:var(--c-bg-elevated,#111113);border-bottom:1px solid var(--c-border-subtle,#18181c);}' +
        '.i18n-bar .lang-sw{display:inline-flex;align-items:center;' +
        'border:1px solid var(--c-border,#222228);border-radius:var(--r-sm,6px);overflow:hidden;}' +
        '.i18n-bar .lang-sw button{padding:3px 8px;border:none;cursor:pointer;background:transparent;' +
        'color:var(--c-text-muted,#55555f);font-family:inherit;font-size:11px;font-weight:500;' +
        'transition:all .3s ease;line-height:1;}' +
        '.i18n-bar .lang-sw button:hover{color:var(--c-text-secondary,#8b8b97);}' +
        '.i18n-bar .lang-sw button.active{background:var(--c-bg-card,#141417);color:var(--c-text,#ededf0);}' +
        '.i18n-bar .lang-sep{width:1px;height:12px;background:var(--c-border,#222228);flex-shrink:0;}' +
        /* hamburger button */
        '.ham-btn{display:none;background:none;border:none;cursor:pointer;padding:2px 4px;line-height:1;}' +
        '.ham-btn svg{width:16px;height:16px;stroke:var(--c-text-muted,#55555f);stroke-width:2;stroke-linecap:round;}' +
        '.ham-btn:hover svg{stroke:var(--c-text,#ededf0);}' +
        '@media(max-width:768px){.ham-btn{display:flex;align-items:center;}}' +
        /* fullscreen overlay */
        '.mob-menu{position:fixed;top:0;left:0;right:0;bottom:0;z-index:1002;' +
        'background:rgba(9,9,11,0.97);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);' +
        'display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;' +
        'opacity:0;visibility:hidden;transition:opacity .25s ease,visibility .25s ease;}' +
        '.mob-menu.open{opacity:1;visibility:visible;}' +
        '.mob-menu a{font-size:17px;color:var(--c-text-secondary,#8b8b97);padding:10px 24px;' +
        'transition:color .2s ease;text-decoration:none;font-weight:500;}' +
        '.mob-menu a:hover,.mob-menu a.active{color:var(--c-text,#ededf0);}' +
        '.mob-close{position:absolute;top:16px;right:clamp(20px,5vw,48px);background:none;border:none;' +
        'cursor:pointer;padding:4px;}' +
        '.mob-close svg{width:22px;height:22px;stroke:var(--c-text-muted,#55555f);stroke-width:2;stroke-linecap:round;}' +
        '.mob-close:hover svg{stroke:var(--c-text,#ededf0);}' +
        '.nav{top:28px!important;}' +
        'html.i18n-loading [data-i18n]{visibility:hidden;}';
    document.head.appendChild(css);

    // Adjust page content top padding
    var firstSection = document.querySelector('.hero, .page-content, main');
    if (firstSection) {
        var current = parseInt(window.getComputedStyle(firstSection).paddingTop) || 0;
        firstSection.style.paddingTop = (current + 28) + 'px';
    }

    // --- 3. Create top bar ---
    var bar = document.createElement('div');
    bar.className = 'i18n-bar';

    // Hamburger button (left side, mobile only)
    var hamBtn = document.createElement('button');
    hamBtn.className = 'ham-btn';
    hamBtn.setAttribute('aria-label', 'Menu');
    hamBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none"><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/></svg>';
    bar.appendChild(hamBtn);

    var sw = document.createElement('div');
    sw.className = 'lang-sw';
    sw.innerHTML =
        '<button data-lang="en">EN</button>' +
        '<span class="lang-sep"></span>' +
        '<button data-lang="zh">中</button>';
    bar.appendChild(sw);
    document.body.insertBefore(bar, document.body.firstChild);

    // --- 3b. Create mobile fullscreen menu ---
    var mobMenu = document.createElement('div');
    mobMenu.className = 'mob-menu';
    var closeBtn = document.createElement('button');
    closeBtn.className = 'mob-close';
    closeBtn.setAttribute('aria-label', 'Close menu');
    closeBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none"><line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/></svg>';
    mobMenu.appendChild(closeBtn);

    // Clone nav links from .nav-mid
    var navMid = document.querySelector('.nav-mid');
    if (navMid) {
        var links = navMid.querySelectorAll('a');
        links.forEach(function (a) {
            var clone = a.cloneNode(true);
            clone.addEventListener('click', function () { mobMenu.classList.remove('open'); });
            mobMenu.appendChild(clone);
        });
    }
    document.body.appendChild(mobMenu);

    hamBtn.addEventListener('click', function () { mobMenu.classList.add('open'); });
    closeBtn.addEventListener('click', function () { mobMenu.classList.remove('open'); });

    // --- 4. i18n logic ---
    var enCache = {};
    var zhData = null;
    var currentLang = localStorage.getItem(LANG_KEY) || 'en';
    var origTitle = document.title;

    document.querySelectorAll('[data-i18n]').forEach(function (el) {
        enCache[el.getAttribute('data-i18n')] = el.innerHTML;
    });
    var enPlaceholders = {};
    document.querySelectorAll('[data-i18n-placeholder]').forEach(function (el) {
        enPlaceholders[el.getAttribute('data-i18n-placeholder')] = el.getAttribute('placeholder') || '';
    });

    function applyLang(lang) {
        currentLang = lang;
        localStorage.setItem(LANG_KEY, lang);
        document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';

        if (lang === 'zh' && zhData && zhData['page-title']) {
            document.title = zhData['page-title'];
        } else {
            document.title = origTitle;
        }

        sw.querySelectorAll('button').forEach(function (btn) {
            btn.classList.toggle('active', btn.getAttribute('data-lang') === lang);
        });

        document.querySelectorAll('[data-i18n]').forEach(function (el) {
            var key = el.getAttribute('data-i18n');
            if (lang === 'zh' && zhData && zhData[key]) {
                if (el.tagName === 'OPTION') { el.textContent = zhData[key]; }
                else { el.innerHTML = zhData[key]; }
            } else if (lang === 'en' && enCache[key]) {
                if (el.tagName === 'OPTION') { el.textContent = enCache[key]; }
                else { el.innerHTML = enCache[key]; }
            }
        });
        document.querySelectorAll('[data-i18n-placeholder]').forEach(function (el) {
            var key = el.getAttribute('data-i18n-placeholder');
            if (lang === 'zh' && zhData && zhData[key]) {
                el.setAttribute('placeholder', zhData[key]);
            } else if (lang === 'en' && enPlaceholders[key]) {
                el.setAttribute('placeholder', enPlaceholders[key]);
            }
        });

        document.documentElement.classList.remove('i18n-loading');
    }

    // =====================================================
    // TRANSLATION CACHE VERSION
    // Bump this number every time you update any *-zh.json
    // file, so returning visitors get the latest translation
    // instead of a stale browser-cached copy.
    // =====================================================
    var i18nVersion = '1';
    function loadZhAndApply() {
        if (zhData) { applyLang('zh'); return; }
        if (!jsonPath) { document.documentElement.classList.remove('i18n-loading'); return; }
        var url = jsonPath + (jsonPath.indexOf('?') === -1 ? '?' : '&') + 'v=' + i18nVersion;
        fetch(url)
            .then(function (r) { return r.json(); })
            .then(function (data) { zhData = data; applyLang('zh'); })
            .catch(function () {
                console.error('i18n: failed to load ' + jsonPath);
                document.documentElement.classList.remove('i18n-loading');
            });
    }

    sw.querySelectorAll('button').forEach(function (btn) {
        btn.addEventListener('click', function () {
            var lang = this.getAttribute('data-lang');
            if (lang === currentLang) return;
            if (lang === 'zh') { loadZhAndApply(); }
            else { applyLang('en'); }
        });
    });

    if (currentLang === 'zh') {
        loadZhAndApply();
    } else {
        sw.querySelector('button[data-lang="en"]').classList.add('active');
    }
})();
