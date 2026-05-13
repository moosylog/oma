buildReport: (layerCount, state) => {
    const reportContainer = document.getElementById('outputReport');
    if (!reportContainer) return;

    const warnInstances = Object.values(state.log.warning || {}).reduce((a, c) => a + c.count, 0);

    // === SEPARATE DUAL_FUNC FROM MACROS ===
    const realMacros = {};
    const dualFuncHoldTaps = {};

    Object.entries(state.macros || {}).forEach(([keyName, payload]) => {
        if (payload && payload.includes('DUAL_FUNC')) {
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
    const dualFuncCount = Object.keys(dualFuncHoldTaps).length;
    // Now including both in the "needs attention" total
    const totalNeedsRebuild = warnInstances + macroCount + dualFuncCount;

    const stdInstances = Object.values(state.log.layer_binding || {}).reduce((a, c) => a + c.count, 0);
    const htInstances = Object.values(state.log.hold_tap || {}).reduce((a, c) => a + c.count, 0);
    const comboInstances = Object.values(state.log.combo || {}).reduce((a, c) => a + c.count, 0);
    const totalMapped = stdInstances + htInstances + comboInstances;

    const buildRows = (logCat) => {
        if (Object.keys(logCat).length === 0) return `<tr><td colspan="4" class="empty-state">🎉 Clean conversion!</td></tr>`;
        return Object.entries(logCat).map(([original, data]) => `
            <tr>
                <td class="code"><span class="keycap !border-slate-200 !shadow-none hover:translate-y-0">${MainUtils.escapeHTML(original)}</span></td>
                <td class="code">${UI.formatKeycapString(data.translated)}</td>
                <td class="reason">${MainUtils.escapeHTML(data.reason || "Auto-mapped successfully.")}</td>
                <td class="font-semibold text-slate-500 text-center">${data.count}</td>
            </tr>`).join('');
    };

    // ... (keep buildWarningDrilldown as is) ...

    const macroRows = macroCount === 0 
        ? `<tr><td colspan="3" class="empty-state">No custom macros found.</td></tr>`
        : Object.entries(realMacros).map(([macName, payload]) => `
            <tr>
                <td class="code align-top pt-4"><span class="keycap">${MainUtils.escapeHTML(macName)}</span></td>
                <td class="payload w-2/5 align-top pt-4">
                    <div class="bg-slate-900 rounded-lg p-3 max-h-32 overflow-y-auto shadow-inner">
                        <pre class="bg-transparent p-0 m-0 text-slate-400 text-[10px] font-mono whitespace-pre-wrap">${MainUtils.escapeHTML(payload)}</pre>
                    </div>
                </td>
                <td class="reason align-top pt-4 pl-4">${MainUtils.translateQMKMacro(payload)}</td>
            </tr>`).join('');

    reportContainer.innerHTML = `
        <div class="checklist-container">
            <div class="p-6 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between no-print">
                <h3 class="text-base font-bold text-slate-800">Your Setup Checklist</h3>
                <span class="text-xs font-semibold text-slate-400 uppercase tracking-widest">${totalNeedsRebuild > 0 ? '4' : '3'} Steps</span>
            </div>
            
            <div class="flex flex-col">
                <div class="checklist-item"><div class="step-circle">1</div><div class="mt-0.5"><strong class="text-slate-900 block text-[15px] mb-1">Download your Layout</strong><p class="text-[13px] text-slate-500 leading-relaxed max-w-xl">Click the blue button above.</p></div></div>
                <div class="checklist-item"><div class="step-circle">2</div><div class="mt-0.5"><strong class="text-slate-900 block text-[15px] mb-1">Import into MoErgo</strong><p class="text-[13px] text-slate-500 leading-relaxed max-w-xl">Drag and drop into the editor.</p></div></div>
                <div class="checklist-item"><div class="step-circle">3</div><div class="mt-0.5"><strong class="text-slate-900 block text-[15px] mb-1">Rename your Layers</strong><p class="text-[13px] text-slate-500 leading-relaxed max-w-xl">Re-label Layer_0, Layer_1, etc.</p></div></div>
                ${totalNeedsRebuild > 0 ? `
                <div class="checklist-item bg-orange-50/30">
                    <div class="step-circle step-circle-warn">4</div>
                    <div class="mt-0.5">
                        <strong class="text-slate-900 block text-[15px] mb-1">Rebuild Macros & Hold-Taps</strong>
                        <p class="text-[13px] text-slate-500 leading-relaxed max-w-xl">We found <strong>${macroCount} Macros</strong> and <strong>${dualFuncCount} Hold-Taps</strong> that need manual setup in ZMK. Check the sections below for details.</p>
                    </div>
                </div>` : ''}
            </div>
        </div>

        <div class="mt-12">
            <div class="stat-grid">
                <div class="stat-box"><div class="stat-num text-blue-600">${layerCount}</div><div class="stat-label">Layers</div></div>
                <div class="stat-box"><div class="stat-num">${totalMapped}</div><div class="stat-label">Auto-Mapped</div></div>
                <div class="stat-box ${dualFuncCount > 0 ? 'warning' : ''}"><div class="stat-num">${dualFuncCount}</div><div class="stat-label">Hold-Taps</div></div>
                <div class="stat-box ${macroCount > 0 ? 'warning' : ''}"><div class="stat-num">${macroCount}</div><div class="stat-label">Macros</div></div>
            </div>
            
            <!-- Hold-Tap / Dual-Function Section (Now standing alone) -->
            <details class="report-category" ${dualFuncCount > 0 ? 'open' : ''}>
                <summary>
                    <svg class="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"></path></svg>
                    Detected Hold-Taps (Dual-Function) <span class="ml-2 bg-slate-100 text-slate-500 border border-slate-200 px-2 py-0.5 rounded-md text-[10px] font-bold">${dualFuncCount + htInstances}</span>
                </summary>
                <div class="cat-content"><table><tr><th>Original Key</th><th>MoErgo Target</th><th>Status</th><th class="text-center">Instances</th></tr>${buildRows({ ...state.log.hold_tap, ...dualFuncHoldTaps })}</table></div>
            </details>

            <details class="report-category">
                <summary>
                    <svg class="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path></svg>
                    Your Custom Macros <span class="ml-2 bg-slate-100 text-slate-500 border border-slate-200 px-2 py-0.5 rounded-md text-[10px] font-bold">${macroCount}</span>
                </summary>
                <div class="cat-content"><table><tr><th>Key ID</th><th>Raw C Code</th><th>Decoded Instructions</th></tr>${macroRows}</table></div>
            </details>

            <!-- Other sections (Standard Keys, Combos, etc.) follow below -->
        </div>
    `;
}
