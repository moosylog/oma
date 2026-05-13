const MainUtils = {
    escapeHTML: (str) => {
        if (!str) return '';

        return String(str).replace(/[&<>'"]/g, match => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[match] || match));
    },

    isHoldTap: (name = '', payload = '') => {
        return `${name} ${payload}`.includes('DUAL_FUNC');
    },

    stripComments: (str = '') => {
        return str
            .replace(/\/\/.*$/gm, '')
            .replace(/\/\*[\s\S]*?\*\//g, '');
    },

    normalizeWhitespace: (str = '') => {
        return str
            .replace(/\r\n/g, '\n')
            .replace(/\t/g, '    ');
    },

    extractCaseBlock: (source, caseName) => {
        const startRegex = new RegExp(`case\\s+${caseName}\\s*:`);
        const startMatch = startRegex.exec(source);

        if (!startMatch) return null;

        const startIndex = startMatch.index + startMatch[0].length;

        const nextCaseRegex = /case\s+[A-Z_]+\s*:/g;
        nextCaseRegex.lastIndex = startIndex;

        const nextCase = nextCaseRegex.exec(source);

        const endIndex = nextCase
            ? nextCase.index
            : source.length;

        return source.slice(startIndex, endIndex);
    },

    safeKeyLabel: (rawKey = '') => {
        return rawKey
            .replace(/KC_/g, '')
            .replace(/X_/g, '')
            .replace(/LEFT_CTRL/g, 'Ctrl')
            .replace(/LEFT_SHIFT/g, 'Shift')
            .replace(/LEFT_ALT/g, 'Alt')
            .replace(/LEFT_GUI/g, 'Cmd/Win')
            .replace(/RIGHT_CTRL/g, 'RCtrl')
            .replace(/RIGHT_SHIFT/g, 'RShift')
            .replace(/RIGHT_ALT/g, 'RAlt')
            .replace(/RIGHT_GUI/g, 'RCmd/Win')
            .replace(/LCTL\((.*?)\)/, 'Ctrl + $1')
            .replace(/LSFT\((.*?)\)/, 'Shift + $1')
            .replace(/LALT\((.*?)\)/, 'Alt + $1')
            .replace(/LGUI\((.*?)\)/, 'Cmd + $1')
            .replace(/RCTL\((.*?)\)/, 'RCtrl + $1')
            .replace(/RSFT\((.*?)\)/, 'RShift + $1')
            .replace(/RALT\((.*?)\)/, 'RAlt + $1')
            .replace(/RGUI\((.*?)\)/, 'RCmd + $1');
    },

    renderKeycap: (key) => {
        return `<span class="keycap text-[10px] bg-white !border-slate-300 shadow-sm mx-0.5">${MainUtils.escapeHTML(key)}</span>`;
    },

    parseTapDance: (code) => {
        const tdCases = [
            { id: 'SINGLE_TAP', label: '1 Tap' },
            { id: 'SINGLE_HOLD', label: 'Hold' },
            { id: 'DOUBLE_TAP', label: '2 Taps' },
            { id: 'DOUBLE_HOLD', label: 'Tap + Hold' },
            { id: 'DOUBLE_SINGLE_TAP', label: 'Tap then Hold' },
            { id: 'TRIPLE_TAP', label: '3 Taps' },
            { id: 'TRIPLE_HOLD', label: '2 Taps + Hold' }
        ];

        const behaviors = [];

        tdCases.forEach(c => {
            const actionStr = MainUtils.extractCaseBlock(code, c.id);

            if (!actionStr) return;

            const regex = /(?:tap_code16|register_code16|tap_code|register_code)\((.*?)\)\s*;/g;

            const keys = [];

            let m;
            let iterations = 0;

            while ((m = regex.exec(actionStr)) !== null) {
                iterations++;

                if (iterations > 1000) break;

                const uiKey = MainUtils.safeKeyLabel(m[1]);
                keys.push(uiKey);
            }

            const uniqueKeys = [...new Set(keys)];

            if (uniqueKeys.length > 0) {
                behaviors.push({
                    trigger: c.label,
                    keys: uniqueKeys
                });
            }
        });

        return behaviors.length
            ? {
                type: 'tap_dance',
                behaviors
            }
            : null;
    },

    parseSequentialMacro: (code) => {
        const cleanCode = code
            .replace(/^\s*break;\s*$/gm, '')
            .replace(/^\s*case\s+ST_MACRO_.*?:/gm, '')
            .trim();

        const steps = [];

        const sendStringRegex = /SEND_STRING\(([\s\S]*?)\);/g;

        let match;
        let iterations = 0;

        while ((match = sendStringRegex.exec(cleanCode)) !== null) {
            iterations++;

            if (iterations > 500) break;

            steps.push({
                type: 'send_string',
                value: match[1]
            });
        }

        const codeRegex = /(tap_code16|register_code16|tap_code|register_code)\((.*?)\)\s*;/g;

        iterations = 0;

        while ((match = codeRegex.exec(cleanCode)) !== null) {
            iterations++;

            if (iterations > 1000) break;

            const action = match[1];
            const key = MainUtils.safeKeyLabel(match[2]);

            steps.push({
                type: action.includes('tap') ? 'tap' : 'hold',
                key
            });
        }

        return steps.length
            ? {
                type: 'macro_sequence',
                steps
            }
            : null;
    },

    renderTapDance: (parsed) => {
        if (!parsed || !parsed.behaviors) return '';

        const html = parsed.behaviors.map(b => {
            const renderedKeys = b.keys
                .map(k => MainUtils.renderKeycap(k))
                .join('<span class="text-slate-300 text-[10px] mx-1">+</span>');

            return `
                <div class="flex items-center gap-3 mb-2 mt-1">
                    <span class="w-24 shrink-0 text-[10px] font-bold text-slate-500 uppercase text-right">
                        ${MainUtils.escapeHTML(b.trigger)}
                    </span>

                    <span class="text-slate-300 text-[10px]">➔</span>

                    <div class="flex flex-wrap items-center gap-y-1">
                        ${renderedKeys}
                    </div>
                </div>
            `;
        }).join('');

        return `
            <strong class="block text-slate-800 text-xs mb-2">
                Tap Dance Behaviors:
            </strong>

            <div class="pt-1 pb-1">
                ${html}
            </div>
        `;
    },

    renderSequentialMacro: (parsed) => {
        if (!parsed || !parsed.steps) return '';

        const rendered = parsed.steps.map(step => {
            if (step.type === 'send_string') {
                return `
                    <span class="text-blue-600 font-bold text-[11px] whitespace-nowrap inline-block bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 shadow-sm mx-1">
                        Type ${MainUtils.escapeHTML(step.value)}
                    </span>
                `;
            }

            const keycap = MainUtils.renderKeycap(step.key);

            if (step.type === 'tap') {
                return `Tap ${keycap}`;
            }

            if (step.type === 'hold') {
                return `Hold ${keycap}`;
            }

            return '';
        });

        return `
            <strong class="block text-slate-800 text-xs mb-2">
                Decoded Sequence:
            </strong>

            <div class="flex items-center flex-wrap gap-2 mt-2">
                ${rendered.join('<span class="text-slate-300 text-[10px]">➔</span>')}
            </div>
        `;
    },

    translateQMKMacro: (code) => {
        if (!code) {
            return 'Rebuild as a Custom ZMK Macro.';
        }

        const MAX_PARSE_LENGTH = 50000;

        if (code.length > MAX_PARSE_LENGTH) {
            return 'Macro too large to safely parse.';
        }

        let codeToParse = MainUtils.normalizeWhitespace(code);
        codeToParse = MainUtils.stripComments(codeToParse);

        if (codeToParse.includes('_reset')) {
            codeToParse = codeToParse
                .split(/void\s+[a-zA-Z0-9_]+_reset/)[0]
                .trim();
        }

        if (MainUtils.isHoldTap('', codeToParse)) {
            return `
                <strong class="block text-slate-800 text-xs mb-2">
                    Hold-Tap Behavior
                </strong>

                <div class="p-3 bg-blue-50 border border-blue-100 rounded-lg">
                    <div class="flex items-center gap-2">
                        <span class="font-mono text-blue-700">DUAL_FUNC</span>
                        <span class="text-slate-400">→</span>
                        <span class="font-medium text-slate-700">
                            Hold-Tap / Dual-Function Key
                        </span>
                    </div>

                    <p class="mt-2 text-[13px] text-slate-600">
                        This should be recreated in ZMK using a
                        <strong>hold-tap</strong> behavior.
                    </p>
                </div>
            `;
        }

        const tapDance = MainUtils.parseTapDance(codeToParse);

        if (tapDance) {
            return MainUtils.renderTapDance(tapDance);
        }

        const sequence = MainUtils.parseSequentialMacro(codeToParse);

        if (sequence) {
            return MainUtils.renderSequentialMacro(sequence);
        }

        return 'Rebuild as a Custom ZMK Macro.';
    }
};

export const UI = {
    buildReport: (layerCount, state) => {
        const reportContainer = document.getElementById('outputReport');

        if (!reportContainer) {
            return;
        }

        const warnInstances = Object.values(state.log?.warning || {})
            .reduce((a, c) => a + (c.count || 0), 0);

        const stdInstances = Object.values(state.log?.layer_binding || {})
            .reduce((a, c) => a + (c.count || 0), 0);

        const comboInstances = Object.values(state.log?.combo || {})
            .reduce((a, c) => a + (c.count || 0), 0);

        const mergedHoldTaps = UI.buildMergedHoldTaps(state);

        const holdTapInstances = Object.values(mergedHoldTaps)
            .reduce((a, c) => a + (c.count || 0), 0);

        const totalMapped =
            stdInstances +
            comboInstances +
            holdTapInstances;

        const totalNeedsRebuild =
            warnInstances +
            Object.keys(state.macros || {}).length;

        reportContainer.innerHTML = `
            <div class="checklist-container">
                <div class="p-6 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between no-print">
                    <h3 class="text-base font-bold text-slate-800">
                        Your Setup Checklist
                    </h3>

                    <span class="text-xs font-semibold text-slate-400 uppercase tracking-widest">
                        ${totalNeedsRebuild > 0 ? '4' : '3'} Steps
                    </span>
                </div>

                <div class="flex flex-col">
                    <div class="checklist-item">
                        <div class="step-circle">1</div>

                        <div class="mt-0.5">
                            <strong class="text-slate-900 block text-[15px] mb-1">
                                Download your Layout
                            </strong>

                            <p class="text-[13px] text-slate-500 leading-relaxed max-w-xl">
                                Download your converted layout.
                            </p>
                        </div>
                    </div>

                    <div class="checklist-item">
                        <div class="step-circle">2</div>

                        <div class="mt-0.5">
                            <strong class="text-slate-900 block text-[15px] mb-1">
                                Import into Layout Editor
                            </strong>

                            <p class="text-[13px] text-slate-500 leading-relaxed max-w-xl">
                                Open the MoErgo Layout Editor and import your file.
                            </p>
                        </div>
                    </div>

                    <div class="checklist-item">
                        <div class="step-circle">3</div>

                        <div class="mt-0.5">
                            <strong class="text-slate-900 block text-[15px] mb-1">
                                Rename your Layers
                            </strong>

                            <p class="text-[13px] text-slate-500 leading-relaxed max-w-xl">
                                Re-label generic layer names inside the editor.
                            </p>
                        </div>
                    </div>

                    ${totalNeedsRebuild > 0 ? `
                        <div class="checklist-item bg-orange-50/30">
                            <div class="step-circle step-circle-warn">4</div>

                            <div class="mt-0.5">
                                <strong class="text-slate-900 block text-[15px] mb-1">
                                    Rebuild your Advanced Features
                                </strong>

                                <p class="text-[13px] text-slate-500 leading-relaxed max-w-xl">
                                    Some macros or advanced behaviors require manual ZMK rebuilding.
                                    See the Action Required section below.
                                </p>
                            </div>
                        </div>
                    ` : ''}
                </div>
            </div>

            <div class="mt-12">
            <div class="mt-12">
                <div class="stat-grid mb-8">
                    <div class="stat-box">
                        <div class="stat-num text-blue-600">
                            ${layerCount}
                        </div>
                        <div class="stat-label">Layers</div>
                    </div>

                    <div class="stat-box">
                        <div class="stat-num">
                            ${totalMapped}
                        </div>
                        <div class="stat-label">Keys Auto-Mapped</div>
                    </div>

                    <div class="stat-box ${warnInstances > 0 ? 'warning' : ''}">
                        <div class="stat-num">
                            ${warnInstances}
                        </div>
                        <div class="stat-label">Actions Required</div>
                    </div>
                </div>

                <details class="report-category" open>
                    <summary>
                        <svg class="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                        </svg>

                        Action Required: Rebuild these features

                        <span class="ml-2 bg-slate-100 text-slate-500 border border-slate-200 px-2 py-0.5 rounded-md text-[10px] font-bold">
                            ${warnInstances}
                        </span>
                    </summary>

                    <div class="cat-content bg-slate-50/50 pb-2">
                        ${Object.keys(state.log?.warning || {}).length === 0
                            ? `<div class="empty-state p-4">🎉 No advanced rebuilds required.</div>`
                            : Object.entries(state.log.warning).map(([original, data]) => `
                                <details class="bg-white border border-slate-200 rounded-xl shadow-sm group print-expand-item m-3">
                                    <summary class="p-4 flex items-center justify-between cursor-pointer list-none hover:bg-slate-50 transition-colors rounded-xl outline-none">
                                        <span class="font-bold text-slate-700 text-sm font-mono truncate max-w-[400px]">
                                            ${MainUtils.escapeHTML(original)}
                                        </span>

                                        <span class="bg-slate-100 text-slate-500 text-[11px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">
                                            ${data.count || 0} Instances
                                        </span>
                                    </summary>

                                    <div class="p-5 border-t border-slate-100 bg-slate-50/50 rounded-b-xl">
                                        <p class="text-[13px] text-slate-800 font-medium leading-relaxed mb-4">
                                            ${MainUtils.escapeHTML(data.reason || 'Manual rebuild required.')}
                                        </p>

                                        ${data.config
                                            ? `
                                                <div class="rounded-lg overflow-hidden shadow-inner bg-slate-800 border border-slate-700">
                                                    <code class="block w-full p-3 text-emerald-400 text-xs font-mono break-all whitespace-pre-wrap">
                                                        ${MainUtils.escapeHTML(data.config)}
                                                    </code>
                                                </div>
                                            `
                                            : ''}
                                    </div>
                                </details>
                            `).join('')}
                    </div>
                </details>

                <details class="report-category">
                    <summary>
                        Standard Keys
                    </summary>

                    <div class="cat-content">
                        <table>
                            <tr>
                                <th>Original Key</th>
                                <th>Target</th>
                                <th>Status</th>
                                <th>Instances</th>
                            </tr>

                            ${buildRows(state.log?.layer_binding || {})}
                        </table>
                    </div>
                </details>

                <details class="report-category">
                    <summary>
                        Hold-Taps / Dual-Function
                    </summary>

                    <div class="cat-content">
                        <table>
                            <tr>
                                <th>Original Key</th>
                                <th>Target</th>
                                <th>Status</th>
                                <th>Instances</th>
                            </tr>

                            ${buildRows(mergedHoldTaps)}
                        </table>
                    </div>
                </details>

                <details class="report-category">
                    <summary>
                        Combos
                    </summary>

                    <div class="cat-content">
                        <table>
                            <tr>
                                <th>Original Key</th>
                                <th>Target</th>
                                <th>Status</th>
                                <th>Instances</th>
                            </tr>

                            ${buildRows(state.log?.combo || {})}
                        </table>
                    </div>
                </details>
            </div>
        `;
    },
    displayFatalError: (msg, stack = null) => {
        const reportContainer = document.getElementById('outputReport');

        document.getElementById('uploadScreen')?.classList.add('hidden');
        document.getElementById('successScreen')?.classList.remove('hidden');
        document.getElementById('successScreen')?.classList.add('flex');

        if (!reportContainer) return;

        reportContainer.innerHTML = `
            <div class="bg-red-50 border border-red-200 rounded-3xl p-8 mt-4 shadow-sm text-center">
                <div class="mx-auto w-16 h-16 rounded-full bg-red-100 flex items-center justify-center text-red-500 mb-4 shadow-sm">
                    ⚠️
                </div>

                <h4 class="text-red-900 font-extrabold text-2xl mb-2">
                    Oops! We couldn't read that file.
                </h4>

                <p class="text-red-700 text-sm mb-6 max-w-md mx-auto leading-relaxed">
                    Something went wrong while trying to read your layout.
                </p>

                <details class="group mt-4 border-t border-red-200/50 pt-4 text-left">
                    <summary class="text-xs font-bold text-red-800 cursor-pointer">
                        Technical Details
                    </summary>

                    <div class="mt-4 p-4 bg-white/60 rounded-xl border border-red-100 font-mono text-[11px] text-red-900 overflow-x-auto whitespace-pre-wrap shadow-inner leading-relaxed">
                        ${MainUtils.escapeHTML(stack || msg)}
                    </div>
                </details>
            </div>
        `;
    },

    updateDropZone: (filename = '', isProcessing = false) => {
        const dz = document.getElementById('dropZone');
        const dText = document.getElementById('dropText');
        const dSub = document.getElementById('dropSubtext');
        const dIcon = document.getElementById('dropIcon');

        if (!dz || !dText || !dSub || !dIcon) {
            return;
        }

        if (isProcessing) {
            dText.innerText = '⏳ Processing your layout...';
            dSub.innerText = `Extracting magic from ${filename}`;

            dIcon.outerHTML = `
                <svg class="w-8 h-8 text-blue-500 animate-spin"
                     id="dropIcon"
                     fill="none"
                     stroke="currentColor"
                     viewBox="0 0 24 24">
                    <path stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15">
                    </path>
                </svg>
            `;
        } else {
            dText.innerText = 'Drop your source zip here';
            dSub.innerText = 'or click to browse';

            dIcon.outerHTML = `
                <svg class="w-8 h-8 text-slate-400"
                     id="dropIcon"
                     fill="none"
                     stroke="currentColor"
                     viewBox="0 0 24 24">
                    <path stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M12 4v16m8-8H4">
                    </path>
                </svg>
            `;
        }
    },

    buildMergedHoldTaps: (state) => {
        const merged = {
            ...(state.log?.hold_tap || {})
        };

        Object.entries(state.macros || {}).forEach(([keyName, payload]) => {
            if (!MainUtils.isHoldTap(keyName, payload)) {
                return;
            }

            const newEntry = {
                translated: 'Hold-Tap',
                reason: 'Convert DUAL_FUNC to ZMK hold-tap behavior',
                count: 1,
                config: payload
            };

            if (!merged[keyName]) {
                merged[keyName] = newEntry;
            } else {
                merged[`${keyName}_dual`] = newEntry;
            }
        });

        return merged;
    }
};
