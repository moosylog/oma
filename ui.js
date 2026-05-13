const MainUtils = {
    escapeHTML: (str) => {
        if (!str) return '';
        return String(str).replace(/[&<>'"]/g, match => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[match] || match));
    },
    
    isHoldTap: (name, payload = '') => {
        if (!name && !payload) return false;
        const str = String(name + ' ' + payload);
        return str.includes('DUAL_FUNC');
    },
	
    // Generic QMK Macro & Tap Dance Parser
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

        let codeToParse = code;
        if (codeToParse.includes('_reset')) {
            codeToParse = codeToParse.split(/void\s+[a-zA-Z0-9_]+_reset/)[0];
        }

        if (codeToParse.includes('case SINGLE_TAP:') || codeToParse.includes('dance_step')) {
            let tdHtml = "";
            const tdCases = [
                { id: 'SINGLE_TAP', label: '1 Tap' },
                { id: 'SINGLE_HOLD', label: 'Hold' },
                { id: 'DOUBLE_TAP', label: '2 Taps' },
                { id: 'DOUBLE_HOLD', label: 'Tap + Hold' },
                { id: 'DOUBLE_SINGLE_TAP', label: 'Tap then Hold' },
                { id: 'TRIPLE_TAP', label: '3 Taps' },
                { id: 'TRIPLE_HOLD', label: '2 Taps + Hold' }
            ];

            let foundTd = false;
            tdCases.forEach(c => {
                let caseRegex = new RegExp(`case\\s+${c.id}:(.*?)(?:break;|case\\s+[A-Z_]+:|\\})`, 's');
                let match = codeToParse.match(caseRegex);
                
                if (match) {
                    let actionStr = match[1].trim();
                    let steps = [];
                    const regex = /(?:tap_code16|register_code16|tap_code|register_code)\((.*?)\)\s*;/g;
                    let m;
                    
                    while ((m = regex.exec(actionStr)) !== null) {
                        let rawKey = m[1];
                        let uiKey = rawKey.replace(/KC_/g, '').replace(/X_/g, '');
                        uiKey = uiKey.replace(/LEFT_CTRL/g, 'Ctrl').replace(/LEFT_SHIFT/g, 'Shift').replace(/LEFT_ALT/g, 'Alt').replace(/LEFT_GUI/g, 'Cmd/Win').replace(/RIGHT_CTRL/g, 'RCtrl').replace(/RIGHT_SHIFT/g, 'RShift').replace(/RIGHT_ALT/g, 'RAlt').replace(/RIGHT_GUI/g, 'RCmd/Win').replace(/LCTL\((.*?)\)/, 'Ctrl + $1').replace(/LSFT\((.*?)\)/, 'Shift + $1').replace(/LALT\((.*?)\)/, 'Alt + $1').replace(/LGUI\((.*?)\)/, 'Cmd + $1').replace(/RCTL\((.*?)\)/, 'RCtrl + $1').replace(/RSFT\((.*?)\)/, 'RShift + $1').replace(/RALT\((.*?)\)/, 'RAlt + $1').replace(/RGUI\((.*?)\)/, 'RCmd + $1');
                        steps.push(`<span class="keycap text-[10px] bg-white !border-slate-300 shadow-sm mx-0.5">${uiKey}</span>`);
                    }
                    
                    let uniqueSteps = [...new Set(steps)];
                    if (uniqueSteps.length > 0) {
                        tdHtml += `
                            <div class="flex items-center gap-3 mb-2 mt-1">
                                <span class="w-24 shrink-0 text-[10px] font-bold text-slate-500 uppercase text-right">${c.label}</span> 
                                <span class="text-slate-300 text-[10px]">➔</span> 
                                <div class="flex flex-wrap items-center gap-y-1">
                                    ${uniqueSteps.join('<span class="text-slate-300 text-[10px] mx-1">+</span>')}
                                </div>
                            </div>`;
                        foundTd = true;
                    }
                }
            });

            if (foundTd) {
                return `<strong class="block text-slate-800 text-xs mb-2">Tap Dance Behaviors:</strong><div class="pt-1 pb-1">${tdHtml}</div>`;
            }
        }

        let htmlOutput = "";
        let cleanCode = codeToParse.replace(/if\s*\(.*?\)\s*\{/g, '').replace(/\}/g, '').replace(/break;/g, '').replace(/case ST_MACRO_.*?:/g, '').trim();
        const sendStringRegex = /SEND_STRING\(([\s\S]*?)\);/g;
        let match;
        let hasContent = false;

        while ((match = sendStringRegex.exec(cleanCode)) !== null) {
            hasContent = true;
            let parsedStr = match[1];
            parsedStr = parsedStr.replace(/"([^"]+)"/g, ' [TYPE_STR:$1] ');
            const mods = { 'SS_LCTL': 'Ctrl', 'SS_LSFT': 'Shift', 'SS_LALT': 'Alt', 'SS_LGUI': 'Cmd/Win', 'SS_RCTL': 'RCtrl', 'SS_RSFT': 'RShift', 'SS_RALT': 'RAlt', 'SS_RGUI': 'RCmd/Win' };
            for (const [qmkMod, uiMod] of Object.entries(mods)) {
                let modRegex = new RegExp(`${qmkMod}\\(([^)]+)\\)`, 'g');
                parsedStr = parsedStr.replace(modRegex, `<strong class="text-slate-600 ml-1">${uiMod} +</strong> $1`);
            }
            parsedStr = parsedStr.replace(/SS_TAP\(X_([A-Z0-9_]+)\)/g, '[$1]').replace(/SS_DOWN\(X_([A-Z0-9_]+)\)/g, 'Hold [$1]').replace(/SS_UP\(X_([A-Z0-9_]+)\)/g, 'Release [$1]').replace(/SS_DELAY\(([0-9]+)\)/g, ' [DELAY:$1] ').replace(/X_([A-Z0-9_]+)/g, '[$1]');
            parsedStr = parsedStr.replace(/\[TYPE_STR:([^\]]+)\]/g, '<span class="text-blue-600 font-bold text-[11px] whitespace-nowrap inline-block bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 shadow-sm mx-1">Type "$1"</span>').replace(/\[DELAY:([0-9]+)\]/g, '<span class="text-amber-600 font-bold text-[10px] bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 mx-1">⏱️ $1ms</span>').replace(/\[([A-Z0-9_]+)\]/g, '<span class="keycap text-[10px] bg-white !border-slate-300 shadow-sm mx-0.5">$1</span>');
            htmlOutput += `<div class="flex items-center flex-wrap gap-y-2 leading-relaxed mb-2">${parsedStr}</div>`;
        }

        const codeRegex = /(tap_code16|register_code16|tap_code|register_code)\((.*?)\)\s*;/g;
        let tapSteps = [];
        while ((match = codeRegex.exec(cleanCode)) !== null) {
            hasContent = true;
            let action = match[1];
            let rawKey = match[2];
            let uiKey = rawKey.replace(/KC_/g, '').replace(/X_/g, '');
            uiKey = uiKey.replace(/LEFT_CTRL/g, 'Ctrl').replace(/LEFT_SHIFT/g, 'Shift').replace(/LEFT_ALT/g, 'Alt').replace(/LEFT_GUI/g, 'Cmd/Win').replace(/RIGHT_CTRL/g, 'RCtrl').replace(/RIGHT_SHIFT/g, 'RShift').replace(/RIGHT_ALT/g, 'RAlt').replace(/RIGHT_GUI/g, 'RCmd/Win').replace(/LCTL\((.*?)\)/, 'Ctrl + $1').replace(/LSFT\((.*?)\)/, 'Shift + $1').replace(/LALT\((.*?)\)/, 'Alt + $1').replace(/LGUI\((.*?)\)/, 'Cmd + $1').replace(/RCTL\((.*?)\)/, 'RCtrl + $1').replace(/RSFT\((.*?)\)/, 'RShift + $1').replace(/RALT\((.*?)\)/, 'RAlt + $1').replace(/RGUI\((.*?)\)/, 'RCmd + $1');
            let keycap = `<span class="keycap text-[10px] bg-white !border-slate-300 shadow-sm mx-0.5">${uiKey}</span>`;
            if (action.includes('tap')) tapSteps.push(`Tap ${keycap}`);
            else if (action.includes('register')) tapSteps.push(`Hold ${keycap}`);
        }
        
        let uniqueSteps = [];
        tapSteps.forEach(step => { if (uniqueSteps[uniqueSteps.length - 1] !== step) uniqueSteps.push(step); });
        if (uniqueSteps.length > 0) {
            htmlOutput += `<div class="flex items-center flex-wrap gap-2 mt-2">${uniqueSteps.join('<span class="text-slate-300 text-[10px]">➔</span>')}</div>`;
        }
        if (hasContent) return `<strong class="block text-slate-800 text-xs mb-2">Decoded Sequence:</strong>${htmlOutput}`;
        return "Rebuild as a Custom ZMK Macro.";
    }
};

export const UI = {
    displayFatalError: (msg, stack = null) => {
        const reportContainer = document.getElementById('outputReport');
        document.getElementById('uploadScreen').classList.add('hidden');
        document.getElementById('successScreen').classList.remove('hidden');
        document.getElementById('successScreen').classList.add('flex');
        if (reportContainer) {
            reportContainer.innerHTML = `
                <div class="bg-red-50 border border-red-200 rounded-3xl p-8 mt-4 shadow-sm text-center">
                    <div class="mx-auto w-16 h-16 rounded-full bg-red-100 flex items-center justify-center text-red-500 mb-4 shadow-sm">
                        <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                    </div>
                    <h4 class="text-red-900 font-extrabold text-2xl mb-2">Oops! We couldn't read that file.</h4>
                    <p class="text-red-700 text-sm mb-6 max-w-md mx-auto leading-relaxed">Something went wrong while trying to read your layout.</p>
                    <button onclick="location.reload()" class="btn-primary mx-auto w-auto px-8 mb-6 bg-red-600 hover:bg-red-700">Try Again</button>
                    <details class="group mt-4 border-t border-red-200/50 pt-4 text-left">
                        <summary class="text-xs font-bold text-red-800 cursor-pointer flex items-center justify-center gap-1">Technical Details</summary>
                        <div class="mt-4 p-4 bg-white/60 rounded-xl border border-red-100 font-mono text-[11px] text-red-900 overflow-x-auto whitespace-pre-wrap">${MainUtils.escapeHTML(stack || msg)}</div>
                    </details>
                </div>`;
            document.getElementById('successHeader').style.display = 'none';
            document.getElementById('actionHeader').style.display = 'none';
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    },

    updateDropZone: (filename, isProcessing = false) => {
        const dz = document.getElementById('dropZone');
        const dText = document.getElementById('dropText');
        const dSub = document.getElementById('dropSubtext');
        const dIcon = document.getElementById('dropIcon');
        if (!dz) return;
        if (isProcessing) {
            dText.innerText = `⏳ Processing your layout...`; dSub.innerText = "Extracting magic from " + filename;
            dIcon.outerHTML = `<svg class="w-8 h-8 text-blue-500 animate-spin" id="dropIcon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>`;
        } 
    },

    formatKeycapString: (str) => {
        if(str === "&none") return `<span class="keycap keycap-blank">&none</span>`;
        if(str.includes("mt ") || str.includes("lt ") || str.includes("sk ")) return `<span class="keycap keycap-composite">${MainUtils.escapeHTML(str)}</span>`;
        if(str.includes("tog ") || str.includes("sl ")) return `<span class="keycap keycap-layer">${MainUtils.escapeHTML(str)}</span>`;
        return `<span class="keycap">${MainUtils.escapeHTML(str)}</span>`;
    },

    printPDF: () => {
        const details = document.querySelectorAll('details, .print-expand-item');
        const state = [];
        details.forEach(d => {
            state.push({ el: d, wasOpen: d.hasAttribute('open') });
            d.setAttribute('open', '');
        });
        window.print();
        setTimeout(() => {
            state.forEach(item => { if (!item.wasOpen) item.el.removeAttribute('open'); });
        }, 1000);
    },

    buildReport: (layerCount, state) => {
        const reportContainer = document.getElementById('outputReport');
        if (!reportContainer) return;

        const warnInstances = Object.values(state.log.warning || {}).reduce((a, c) => a + c.count, 0);

        // === SEPARATE DUAL_FUNC FROM GENERIC MACROS ===
        const realMacros = {};
        const dualFuncHoldTaps = {};

        Object.entries(state.macros || {}).forEach(([keyName, payload]) => {
            if (payload && payload.includes('DUAL_FUNC')) {
                dualFuncHoldTaps[keyName] = payload;
            } else {
                realMacros[keyName] = payload;
            }
        });

        const macroCount = Object.keys(realMacros).length;
        const dualFuncCount = Object.keys(dualFuncHoldTaps).length;

        const stdInstances = Object.values(state.log.layer_binding || {}).reduce((a, c) => a + c.count, 0);
        const htInstances = Object.values(state.log.hold_tap || {}).reduce((a, c) => a + c.count, 0);
        const comboInstances = Object.values(state.log.combo || {}).reduce((a, c) => a + c.count, 0);
        const totalMapped = stdInstances + htInstances + comboInstances;

        const buildRows = (logCat) => {
            if (Object.keys(logCat).length === 0) return `<tr><td colspan="4" class="empty-state">🎉 Clean conversion!</td></tr>`;
            return Object.entries(logCat).map(([original, data]) => `
                <tr>
                    <td class="code"><span class="keycap !border-slate-200">${MainUtils.escapeHTML(original)}</span></td>
                    <td class="code">${UI.formatKeycapString(data.translated)}</td>
                    <td class="reason">${MainUtils.escapeHTML(data.reason || "Auto-mapped successfully.")}</td>
                    <td class="font-semibold text-slate-500 text-center">${data.count}</td>
                </tr>`).join('');
        };

        const macroRows = Object.entries(realMacros).map(([macName, payload]) => `
            <tr>
                <td class="code align-top pt-4"><span class="keycap">${MainUtils.escapeHTML(macName)}</span></td>
                <td class="payload w-2/5 align-top pt-4"><div class="bg-slate-900 rounded-lg p-3 shadow-inner"><pre class="text-slate-400 text-[10px] font-mono whitespace-pre-wrap">${MainUtils.escapeHTML(payload)}</pre></div></td>
                <td class="reason align-top pt-4 pl-4">${MainUtils.translateQMKMacro(payload)}</td>
            </tr>`).join('');

        const dualFuncRows = Object.entries(dualFuncHoldTaps).map(([macName, payload]) => `
            <tr>
                <td class="code align-top pt-4"><span class="keycap">${MainUtils.escapeHTML(macName)}</span></td>
                <td class="reason align-top pt-4 pl-4">${MainUtils.translateQMKMacro(payload)}</td>
            </tr>`).join('');

        reportContainer.innerHTML = `
            <div class="checklist-container">
                <div class="p-6 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between no-print">
                    <h3 class="text-base font-bold text-slate-800">Your Setup Checklist</h3>
                </div>
                <div class="flex flex-col">
                    <div class="checklist-item"><div class="step-circle">1</div><div><strong class="text-slate-900 block text-[15px] mb-1">Download your Layout</strong></div></div>
                    <div class="checklist-item"><div class="step-circle">2</div><div><strong class="text-slate-900 block text-[15px] mb-1">Import into MoErgo Layout Editor</strong></div></div>
                </div>
            </div>

            <div class="mt-12">
                <div class="stat-grid">
                    <div class="stat-box"><div class="stat-num text-blue-600">${layerCount}</div><div class="stat-label">Layers</div></div>
                    <div class="stat-box"><div class="stat-num">${totalMapped}</div><div class="stat-label">Keys Mapped</div></div>
                    <div class="stat-box"><div class="stat-num">${macroCount + dualFuncCount}</div><div class="stat-label">Custom Actions</div></div>
                </div>

                <!-- 1. DUAL FUNCTION KEYS (NEW SECTION - SAME LEVEL AS MACRO) -->
                <details class="report-category" ${dualFuncCount > 0 ? 'open' : ''}>
                    <summary>
                        <svg class="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path></svg>
                        Dual-Function Keys (Hold-Tap) <span class="ml-2 bg-slate-100 text-slate-500 border px-2 py-0.5 rounded-md text-[10px] font-bold">${dualFuncCount}</span>
                    </summary>
                    <div class="cat-content">
                        ${dualFuncCount === 0 ? '<div class="p-4 text-slate-400">No dual-function macros detected.</div>' : `<table><tr><th>Key ID</th><th>Decoded Instructions</th></tr>${dualFuncRows}</table>`}
                    </div>
                </details>

                <!-- 2. SEQUENTIAL MACROS -->
                <details class="report-category">
                    <summary>
                        <svg class="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path></svg>
                        Sequential Macros <span class="ml-2 bg-slate-100 text-slate-500 border px-2 py-0.5 rounded-md text-[10px] font-bold">${macroCount}</span>
                    </summary>
                    <div class="cat-content">
                        ${macroCount === 0 ? '<div class="p-4 text-slate-400">No sequential macros found.</div>' : `<table><tr><th>Key ID</th><th>Raw C Code</th><th>Decoded Instructions</th></tr>${macroRows}</table>`}
                    </div>
                </details>
                
                <details class="report-category">
                    <summary>
                        <svg class="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16m-7 6h7"></path></svg>
                        Standard Keys <span class="ml-2 bg-slate-100 text-slate-500 border px-2 py-0.5 rounded-md text-[10px] font-bold">${stdInstances}</span>
                    </summary>
                    <div class="cat-content"><table><tr><th>Original</th><th>MoErgo</th><th>Status</th><th class="text-center">Count</th></tr>${buildRows(state.log.layer_binding)}</table></div>
                </details>
            </div>`;
    }
};
