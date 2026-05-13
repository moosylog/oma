const MainUtils = {
    // Safely escape dangerous HTML before injecting
    escapeHTML: (str) => {
        if (!str) return '';
        return String(str).replace(/[&<>'"]/g, match =>
            ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[match] || match)
        );
    },

    // Utility: Determine if entry corresponds to a hold-tap key definition
    isHoldTap: (name, payload = '') => {
        if (!name && !payload) return false;
        const combined = String(name + ' ' + payload);
        return combined.includes('DUAL_FUNC');
    },

    /**
     * QMK Macro → HTML Explanation.
     * NOTE: Parsing + presentation are still mixed for simplicity, but should
     * ideally be separated into parseQMKMacro() + renderMacroResponse() for testability.
     */
    translateQMKMacro: (code) => {
        if (!code) return "Rebuild as a Custom ZMK Macro.";

        // === DUAL_FUNC → Hold-Tap (Highest priority) ===
        if (code.includes('DUAL_FUNC')) {
            return `
                <strong class="block text-slate-800 text-xs mb-2">Hold-Tap Behavior</strong>
                <div class="p-3 bg-blue-50 border border-blue-100 rounded-lg">
                    <div class="flex items-center gap-2">
                        <span class="font-mono text-blue-700">DUAL_FUNC</span>
                        <span class="text-slate-400">→</span>
                        <span class="font-medium text-slate-700">Hold-Tap / Dual-Function Key</span>
                    </div>
                    <p class="mt-2 text-[13px] text-slate-600">
                        This should be recreated in ZMK using a <strong>hold-tap</strong> behavior.
                    </p>
                </div>`;
        }

        // Strip out reset helper safely
        let codeToParse = code;
        if (/_reset\s*\(/.test(codeToParse)) {
            codeToParse = codeToParse.split(/void\s+[a-zA-Z0-9_]+_reset\s*\(/)[0];
        }

        // ==============================================================
        // 1. TAP DANCE Parser
        // ==============================================================
        if (/case\s+SINGLE_TAP:|dance_step/.test(codeToParse)) {
            const tdCases = [
                { id: 'SINGLE_TAP', label: '1 Tap' },
                { id: 'SINGLE_HOLD', label: 'Hold' },
                { id: 'DOUBLE_TAP', label: '2 Taps' },
                { id: 'DOUBLE_HOLD', label: 'Tap + Hold' },
                { id: 'DOUBLE_SINGLE_TAP', label: 'Tap then Hold' },
                { id: 'TRIPLE_TAP', label: '3 Taps' },
                { id: 'TRIPLE_HOLD', label: '2 Taps + Hold' }
            ];

            let tdHtml = "";
            let foundTd = false;

            tdCases.forEach(c => {
                const caseRegex = new RegExp(
                    `case\\s+${c.id}:[\\s\\S]*?(?=break;|case\\s+[A-Z_]+:|\\})`,
                    'm'
                );
                const match = codeToParse.match(caseRegex);
                if (!match) return;

                let actionStr = match[0].trim();
                const regex = /(?:tap_code16|register_code16|tap_code|register_code)\((.*?)\)\s*;/g;
                let steps = [], m;
                while ((m = regex.exec(actionStr)) !== null) {
                    let rawKey = m[1];
                    let uiKey = rawKey.replace(/KC_|X_/g, '')
                        .replace(/LEFT_(CTRL|SHIFT|ALT|GUI)/g, (_, k) => ({CTRL:"Ctrl",SHIFT:"Shift",ALT:"Alt",GUI:"Cmd/Win"}[k]))
                        .replace(/RIGHT_(CTRL|SHIFT|ALT|GUI)/g, (_, k) => ({CTRL:"RCtrl",SHIFT:"RShift",ALT:"RAlt",GUI:"RCmd/Win"}[k]))
                        .replace(/LCTL\((.*?)\)/, 'Ctrl + $1')
                        .replace(/LSFT\((.*?)\)/, 'Shift + $1')
                        .replace(/LALT\((.*?)\)/, 'Alt + $1')
                        .replace(/LGUI\((.*?)\)/, 'Cmd + $1')
                        .replace(/RCTL\((.*?)\)/, 'RCtrl + $1')
                        .replace(/RSFT\((.*?)\)/, 'RShift + $1')
                        .replace(/RALT\((.*?)\)/, 'RAlt + $1')
                        .replace(/RGUI\((.*?)\)/, 'RCmd + $1');

                    steps.push(`<span class="keycap text-[10px] bg-white !border-slate-300 shadow-sm mx-0.5">${uiKey}</span>`);
                }

                steps = [...new Set(steps)];
                if (steps.length) {
                    tdHtml += `
                        <div class="flex items-center gap-3 mb-2 mt-1">
                            <span class="w-24 shrink-0 text-[10px] font-bold text-slate-500 uppercase text-right">${c.label}</span> 
                            <span class="text-slate-300 text-[10px]">➔</span> 
                            <div class="flex flex-wrap items-center gap-y-1">
                                ${steps.join('<span class="text-slate-300 text-[10px] mx-1">+</span>')}
                            </div>
                        </div>`;
                    foundTd = true;
                }
            });

            if (foundTd) {
                return `
                    <strong class="block text-slate-800 text-xs mb-2">Tap Dance Behaviors:</strong>
                    <div class="pt-1 pb-1">${tdHtml}</div>
                `;
            }
        }

        // ==============================================================
        // 2. STANDARD MACRO Parser
        // ==============================================================
        let htmlOutput = "";
        let cleanCode = codeToParse
            .replace(/if\s*\(.*?\)\s*\{?/g, '')
            .replace(/case ST_MACRO_.*?:/g, '')
            .replace(/\breturn\b.*;/g, '')
            .trim();

        const sendStringRegex = /SEND_STRING\(([\s\S]*?)\);/g;
        let match;
        let hasContent = false;

        while ((match = sendStringRegex.exec(cleanCode)) !== null) {
            hasContent = true;
            let parsedStr = match[1]
                .replace(/"([^"]+)"/g, ' [TYPE_STR:$1] ')
                .replace(/SS_TAP\(X_([A-Z0-9_]+)\)/g, '[$1]')
                .replace(/SS_DOWN\(X_([A-Z0-9_]+)\)/g, 'Hold [$1]')
                .replace(/SS_UP\(X_([A-Z0-9_]+)\)/g, 'Release [$1]')
                .replace(/SS_DELAY\(([0-9]+)\)/g, ' [DELAY:$1] ')
                .replace(/X_([A-Z0-9_]+)/g, '[$1]');

            Object.entries({
                'SS_LCTL': 'Ctrl', 'SS_LSFT': 'Shift', 'SS_LALT': 'Alt', 'SS_LGUI': 'Cmd/Win',
                'SS_RCTL': 'RCtrl', 'SS_RSFT': 'RShift', 'SS_RALT': 'RAlt', 'SS_RGUI': 'RCmd/Win'
            }).forEach(([qmkMod, uiMod]) => {
                parsedStr = parsedStr.replace(new RegExp(`${qmkMod}\\(([^)]+)\\)`, 'g'),
                    `<strong class="text-slate-600 ml-1">${uiMod} +</strong> $1`);
            });

            parsedStr = parsedStr
                .replace(/\[TYPE_STR:([^\]]+)\]/g, '<span class="text-blue-600 font-bold text-[11px] whitespace-nowrap inline-block bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 shadow-sm mx-1">Type "$1"</span>')
                .replace(/\[DELAY:([0-9]+)\]/g, '<span class="text-amber-600 font-bold text-[10px] bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 mx-1">⏱️ $1ms</span>')
                .replace(/\[([A-Z0-9_]+)\]/g, '<span class="keycap text-[10px] bg-white !border-slate-300 shadow-sm mx-0.5">$1</span>');

            htmlOutput += `<div class="flex items-center flex-wrap gap-y-2 leading-relaxed mb-2">${parsedStr}</div>`;
        }

        const macroRegex = /(tap_code16|register_code16|tap_code|register_code)\((.*?)\)\s*;/g;
        let tapSteps = [];
        while ((match = macroRegex.exec(cleanCode)) !== null) {
            hasContent = true;
            let [action, rawKey] = [match[1], match[2]];
            let uiKey = rawKey.replace(/KC_|X_/g, '');
            uiKey = uiKey.replace(/LEFT_CTRL/g, 'Ctrl')
                .replace(/LEFT_SHIFT/g, 'Shift')
                .replace(/LEFT_ALT/g, 'Alt')
                .replace(/LEFT_GUI/g, 'Cmd/Win')
                .replace(/RIGHT_CTRL/g, 'RCtrl')
                .replace(/RIGHT_SHIFT/g, 'RShift')
                .replace(/RIGHT_ALT/g, 'RAlt')
                .replace(/RIGHT_GUI/g, 'RCmd/Win');

            const keycap = `<span class="keycap text-[10px] bg-white !border-slate-300 shadow-sm mx-0.5">${uiKey}</span>`;
            if (action.includes('tap')) tapSteps.push(`Tap ${keycap}`);
            else tapSteps.push(`Hold ${keycap}`);
        }

        tapSteps = tapSteps.filter((v, i, a) => a[i - 1] !== v);
        if (tapSteps.length) {
            htmlOutput += `<div class="flex items-center flex-wrap gap-2 mt-2">${tapSteps.join('<span class="text-slate-300 text-[10px]">➔</span>')}</div>`;
        }

        if (hasContent) {
            return `<strong class="block text-slate-800 text-xs mb-2">Decoded Sequence:</strong>${htmlOutput}`;
        }

        return "Rebuild as a Custom ZMK Macro.";
    }
};

export const UI = {
    // Redrawn for consistent feedback handling
    updateDropZone: (filename, isProcessing = false) => {
        const dz = document.getElementById('dropZone');
        const dText = document.getElementById('dropText');
        const dSub = document.getElementById('dropSubtext');
        const dIcon = document.getElementById('dropIcon');
        if (!dz) return;

        if (isProcessing) {
            dText.innerText = `⏳ Processing your layout...`;
            dSub.innerText = `Extracting magic from ${filename}`;
            dIcon.outerHTML = `<svg class="w-8 h-8 text-blue-500 animate-spin" id="dropIcon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>`;
        } else {
            // Restore default state when not processing
            dText.innerText = "Drop your .zip file here";
            dSub.innerText = "from ZSA Oryx Export";
            dIcon.outerHTML = `<svg class="w-8 h-8 text-slate-400" id="dropIcon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l-4-4m4 4l4-4"></path></svg>`;
        }
    },

    // ... rest of UI code remains unchanged except:
    // buildReport now fixes double-counting and merge conflicts below ↓
    buildReport: (layerCount, state) => {
        const reportContainer = document.getElementById('outputReport');
        if (!reportContainer) return;

        const warnInstances = Object.values(state.log.warning || {}).reduce((a, c) => a + c.count, 0);

        // Split dual_func macros for display
        const realMacros = {};
        const dualFuncHoldTaps = {};

        Object.entries(state.macros || {}).forEach(([keyName, payload]) => {
            if (MainUtils.isHoldTap(keyName, payload)) {
                dualFuncHoldTaps[keyName] = {
                    translated: "Hold-Tap",
                    reason: "Convert DUAL_FUNC to ZMK hold-tap behavior",
                    count: 1,
                    config: payload
                };
            } else {
                realMacros[keyName] = payload;
            }
        });

        const macroCount = Object.keys(realMacros).length;
        // Do NOT count dualFuncHoldTaps twice — they now appear under hold-taps
        const totalNeedsRebuild = warnInstances + macroCount;
