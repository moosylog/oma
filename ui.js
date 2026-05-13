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
	
    translateQMKMacro: (code) => {
        if (!code) return "Rebuild as a Custom ZMK Macro.";
        
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
                { id: 'SINGLE_TAP', label: '1 Tap' }, { id: 'SINGLE_HOLD', label: 'Hold' },
                { id: 'DOUBLE_TAP', label: '2 Taps' }, { id: 'DOUBLE_HOLD', label: 'Tap + Hold' },
                { id: 'DOUBLE_SINGLE_TAP', label: 'Tap then Hold' },
                { id: 'TRIPLE_TAP', label: '3 Taps' }, { id: 'TRIPLE_HOLD', label: '2 Taps + Hold' }
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
                        let uiKey = m[1].replace(/KC_/g, '').replace(/X_/g, '');
                        steps.push(`<span class="keycap text-[10px] bg-white !border-slate-300 shadow-sm mx-0.5">${uiKey}</span>`);
                    }
                    if (steps.length > 0) {
                        tdHtml += `<div class="flex items-center gap-3 mb-2 mt-1"><span class="w-24 shrink-0 text-[10px] font-bold text-slate-500 uppercase text-right">${c.label}</span><span class="text-slate-300 text-[10px]">➔</span><div class="flex flex-wrap items-center gap-y-1">${[...new Set(steps)].join('<span class="text-slate-300 text-[10px] mx-1">+</span>')}</div></div>`;
                        foundTd = true;
                    }
                }
            });
            if (foundTd) return `<strong class="block text-slate-800 text-xs mb-2">Tap Dance Behaviors:</strong><div class="pt-1 pb-1">${tdHtml}</div>`;
        }

        let htmlOutput = "";
        let cleanCode = codeToParse.replace(/if\s*\(.*?\)\s*\{/g, '').replace(/\}/g, '').replace(/break;/g, '').replace(/case ST_MACRO_.*?:/g, '').trim();
        const sendStringRegex = /SEND_STRING\(([\s\S]*?)\);/g;
        let match;
        let hasContent = false;
        while ((match = sendStringRegex.exec(cleanCode)) !== null) {
            hasContent = true;
            let parsedStr = match[1].replace(/"([^"]+)"/g, ' [TYPE_STR:$1] ');
            parsedStr = parsedStr.replace(/SS_TAP\(X_([A-Z0-9_]+)\)/g, '[$1]').replace(/SS_DELAY\(([0-9]+)\)/g, ' [DELAY:$1] ');
            parsedStr = parsedStr.replace(/\[TYPE_STR:([^\]]+)\]/g, '<span class="text-blue-600 font-bold text-[11px] bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 mx-1">Type "$1"</span>').replace(/\[([A-Z0-9_]+)\]/g, '<span class="keycap text-[10px] bg-white !border-slate-300 mx-0.5">$1</span>');
            htmlOutput += `<div class="flex items-center flex-wrap gap-y-2 leading-relaxed mb-2">${parsedStr}</div>`;
        }
        if (hasContent) return `<strong class="block text-slate-800 text-xs mb-2">Decoded Sequence:</strong>${htmlOutput}`;
        return "Rebuild as a Custom ZMK Macro.";
    }
};

export const UI = {
    displayFatalError: (msg, stack = null) => {
        const reportContainer = document.getElementById('outputReport');
        if (reportContainer) {
            reportContainer.innerHTML = `<div class="bg-red-50 p-8 text-center"><h4 class="text-red-900 font-bold">Error reading file</h4><p>${msg}</p></div>`;
        }
    },

    updateDropZone: (filename, isProcessing = false) => {
        const dText = document.getElementById('dropText');
        if (dText && isProcessing) dText.innerText = `⏳ Processing ${filename}...`;
    },

    formatKeycapString: (str) => {
        if(str === "&none") return `<span class="keycap keycap-blank">&none</span>`;
        return `<span class="keycap">${MainUtils.escapeHTML(str)}</span>`;
    },

    buildReport: (layerCount, state) => {
        const reportContainer = document.getElementById('outputReport');
        if (!reportContainer) return;

        // 1. Calculations
        const warnInstances = Object.values(state.log.warning || {}).reduce((a, c) => a + c.count, 0);
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

        // 2. Drilldown Helper (The missing recommendations logic)
        const buildWarningDrilldown = (logCat) => {
            if (Object.keys(logCat).length === 0) return `<div class="p-4 text-emerald-600">🎉 Clean conversion!</div>`;
            return `<div class="flex flex-col gap-3 p-4">` + Object.entries(logCat).map(([original, data]) => {
                let foundConfig = data.contexts?.find(c => c && c.config)?.config;
                let decoded = foundConfig ? MainUtils.translateQMKMacro(foundConfig) : '';
                return `
                <details class="bg-white border border-slate-200 rounded-xl group">
                    <summary class="p-4 flex items-center justify-between cursor-pointer list-none hover:bg-slate-50">
                        <span class="font-bold text-slate-700 font-mono">${MainUtils.escapeHTML(original)}</span>
                        <span class="text-[10px] font-bold px-2 py-0.5 bg-slate-100 rounded">${data.count} Instances</span>
                    </summary>
                    <div class="p-5 border-t border-slate-100 bg-slate-50/50">
                        <p class="text-[13px] text-slate-800 mb-4">${MainUtils.escapeHTML(data.reason)}</p>
                        ${decoded ? `<div class="mb-4 p-3 bg-indigo-50 border border-indigo-100 rounded-lg">${decoded}</div>` : ''}
                        <code class="block p-3 bg-slate-800 text-emerald-400 text-xs rounded">${MainUtils.escapeHTML(original)}</code>
                    </div>
                </details>`;
            }).join('') + `</div>`;
        };

        const macroRows = Object.entries(realMacros).map(([macName, payload]) => `
            <tr>
                <td class="code align-top pt-4"><span class="keycap">${MainUtils.escapeHTML(macName)}</span></td>
                <td class="payload align-top pt-4"><div class="bg-slate-900 p-2 rounded text-[10px] text-slate-400 font-mono">${MainUtils.escapeHTML(payload)}</div></td>
                <td class="reason align-top pt-4 pl-4">${MainUtils.translateQMKMacro(payload)}</td>
            </tr>`).join('');

        const dualFuncRows = Object.entries(dualFuncHoldTaps).map(([macName, payload]) => `
            <tr>
                <td class="code align-top pt-4"><span class="keycap">${MainUtils.escapeHTML(macName)}</span></td>
                <td class="reason align-top pt-4 pl-4">${MainUtils.translateQMKMacro(payload)}</td>
            </tr>`).join('');

        // 3. Render Output
        reportContainer.innerHTML = `
            <div class="checklist-container p-6 bg-white border rounded-xl shadow-sm">
                <h3 class="text-lg font-bold mb-4">Migration Checklist</h3>
                <p class="text-sm text-slate-600">Follow the steps below to finalize your MoErgo layout.</p>
            </div>

            <div class="mt-8 stat-grid">
                <div class="stat-box"><div class="stat-num">${layerCount}</div><div class="stat-label">Layers</div></div>
                <div class="stat-box warning"><div class="stat-num">${warnInstances}</div><div class="stat-label">Action Required</div></div>
            </div>

            <!-- SECTION 1: RECOMMENDATIONS / WARNINGS -->
            <details class="report-category" open>
                <summary>⚠️ Action Required: Rebuild these features (${warnInstances})</summary>
                <div class="cat-content bg-slate-50/50">${buildWarningDrilldown(state.log.warning)}</div>
            </details>

            <!-- SECTION 2: DUAL-FUNCTION (HOLD-TAP) -->
            <details class="report-category" ${dualFuncCount > 0 ? 'open' : ''}>
                <summary>↔️ Dual-Function Keys (Hold-Tap) (${dualFuncCount})</summary>
                <div class="cat-content">
                    ${dualFuncCount === 0 ? '<div class="p-4 text-slate-400">None found.</div>' : `<table><tr><th>Key ID</th><th>Suggested Behavior</th></tr>${dualFuncRows}</table>`}
                </div>
            </details>

            <!-- SECTION 3: SEQUENTIAL MACROS -->
            <details class="report-category">
                <summary>⌨️ Sequential Macros (${macroCount})</summary>
                <div class="cat-content">
                    ${macroCount === 0 ? '<div class="p-4 text-slate-400">None found.</div>' : `<table><tr><th>Key ID</th><th>Original Code</th><th>Decoded</th></tr>${macroRows}</table>`}
                </div>
            </details>
            
            <details class="report-category">
                <summary>✅ Standard Keys (${stdInstances})</summary>
                <div class="cat-content"><p class="p-4 text-xs text-slate-500">Standard keys were mapped automatically to ZMK codes.</p></div>
            </details>
        `;
    }
};
