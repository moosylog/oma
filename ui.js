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
        console.error(msg, stack);
    },

    updateDropZone: (filename, isProcessing = false) => {
        const dz = document.getElementById('dropZone');
        if (dz && isProcessing) dz.innerText = "Processing...";
    },

    formatKeycapString: (str) => {
        return `<span class="keycap">${MainUtils.escapeHTML(str)}</span>`;
    },

    buildReport: (layerCount, state) => {
        const reportContainer = document.getElementById('outputReport');
        if (!reportContainer) return;

        // --- Helper: The Unified "Card" Renderer (Restores ZSA Source Details) ---
        const renderItemCard = (name, data, isDualFunc = false) => {
            const count = data.count || 1;
            const reason = data.reason || (isDualFunc ? "Convert DUAL_FUNC to ZMK hold-tap behavior" : "Rebuild as a Custom ZMK Macro.");
            const config = data.config || (typeof data === 'string' ? data : '');
            
            // Build Contexts (Hardware Locations)
            let contextHtml = '';
            if (data.contexts && data.contexts.length > 0) {
                let occurrences = data.contexts.map(c => {
                    let colorDot = c.color ? `<span class="inline-block w-2 h-2 rounded-full mr-2" style="background-color: ${c.color}"></span>` : '';
                    return `${colorDot}Layer ${c.layer} ➔ <strong>${c.pos}</strong>`;
                }).join('<br>');
                contextHtml = `<div class="mt-4 pt-4 border-t border-slate-200"><strong class="block text-[10px] uppercase text-slate-500 mb-1">Hardware Locations</strong><p class="text-[12px] text-slate-600 leading-relaxed">${occurrences}</p></div>`;
            }

            // Build Source Code Display
            let sourceDisplay = '';
            if (config) {
                sourceDisplay = `
                    <div class="mt-4">
                        <strong class="block text-[11px] uppercase text-slate-500 mb-1.5">Exact Source Code & Parameters</strong>
                        <div class="rounded-lg overflow-hidden bg-slate-800 border border-slate-700">
                            <code class="block w-full p-3 text-emerald-400 text-xs font-mono break-all">${MainUtils.escapeHTML(name)}</code>
                            <div class="border-t border-slate-700 bg-slate-900/50 p-3">
                                <code class="block w-full text-blue-300 text-[11px] font-mono whitespace-pre-wrap">${MainUtils.escapeHTML(config)}</code>
                            </div>
                        </div>
                    </div>`;
            }

            return `
                <details class="bg-white border border-slate-200 rounded-xl shadow-sm mb-3 group">
                    <summary class="p-4 flex items-center justify-between cursor-pointer list-none hover:bg-slate-50">
                        <span class="font-bold text-slate-700 font-mono">${MainUtils.escapeHTML(name)}</span>
                        <span class="bg-slate-100 text-slate-500 text-[10px] font-bold px-2 py-0.5 rounded">${count} Instances</span>
                    </summary>
                    <div class="p-5 border-t border-slate-100 bg-slate-50/50">
                        <div class="mb-4">
                            <strong class="block text-[11px] uppercase text-slate-500 mb-1">ZMK Replacement Suggestion</strong>
                            <p class="text-[13px] text-slate-800 font-medium">${MainUtils.escapeHTML(reason)}</p>
                        </div>
                        ${MainUtils.translateQMKMacro(config)}
                        ${sourceDisplay}
                        ${contextHtml}
                    </div>
                </details>`;
        };

        // --- Data Processing ---
        const warnInstances = Object.values(state.log.warning || {}).reduce((a, c) => a + c.count, 0);
        const realMacros = {};
        const dualFuncHoldTaps = {};

        Object.entries(state.macros || {}).forEach(([keyName, payload]) => {
            if (payload && payload.includes('DUAL_FUNC')) {
                dualFuncHoldTaps[keyName] = { config: payload, count: 1, reason: "Convert DUAL_FUNC to ZMK hold-tap behavior" };
            } else {
                realMacros[keyName] = { config: payload, count: 1 };
            }
        });

        // --- HTML Assembly ---
        reportContainer.innerHTML = `
            <div class="checklist-container p-6 border rounded-xl mb-8">
                <h3 class="text-lg font-bold text-slate-800 mb-2">Migration Checklist</h3>
                <p class="text-sm text-slate-500">Follow these steps to finalize your setup.</p>
            </div>

            <div class="stat-grid mb-8">
                <div class="stat-box warning"><div class="stat-num">${warnInstances}</div><div class="stat-label">Actions Required</div></div>
                <div class="stat-box"><div class="stat-num">${Object.keys(dualFuncHoldTaps).length}</div><div class="stat-label">Hold-Taps</div></div>
                <div class="stat-box"><div class="stat-num">${Object.keys(realMacros).length}</div><div class="stat-label">Macros</div></div>
            </div>

            <!-- SECTION 1: RECOMMENDATIONS (Same level as others) -->
            <div class="mb-10">
                <h4 class="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                    <span class="w-2 h-2 rounded-full bg-orange-400"></span> Action Required: Recommendations
                </h4>
                ${Object.entries(state.log.warning || {}).map(([name, data]) => renderItemCard(name, data)).join('')}
            </div>

            <!-- SECTION 2: DUAL-FUNCTION (Same level) -->
            <div class="mb-10">
                <h4 class="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                    <span class="w-2 h-2 rounded-full bg-blue-400"></span> Dual-Function (Hold-Tap)
                </h4>
                ${Object.keys(dualFuncHoldTaps).length === 0 ? '<p class="text-sm text-slate-400 p-4">None detected.</p>' : 
                  Object.entries(dualFuncHoldTaps).map(([name, data]) => renderItemCard(name, data, true)).join('')}
            </div>

            <!-- SECTION 3: SEQUENTIAL MACROS (Same level) -->
            <div class="mb-10">
                <h4 class="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                    <span class="w-2 h-2 rounded-full bg-emerald-400"></span> Custom Macros
                </h4>
                ${Object.keys(realMacros).length === 0 ? '<p class="text-sm text-slate-400 p-4">No custom macros found.</p>' : 
                  Object.entries(realMacros).map(([name, data]) => renderItemCard(name, data)).join('')}
            </div>
        `;
    }
};
