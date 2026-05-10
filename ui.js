export const UI = {
    updateDropZone: (fileName, isLoading) => {
        const dropText = document.getElementById('dropText');
        const dropSubtext = document.getElementById('dropSubtext');
        const dropIcon = document.getElementById('dropIcon');

        if (isLoading) {
            dropText.innerText = "Analyzing Layout...";
            dropSubtext.innerText = `Processing ${fileName}...`;
            // Restores the loading spinner animation
            if (dropIcon) {
                dropIcon.outerHTML = `<div id="dropIcon" class="w-10 h-10 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mx-auto"></div>`;
            }
        }
    },

    buildReport: (layerCount, state) => {
        const container = document.getElementById('outputReport');
        
        let html = `
            <div class="checklist-container mb-10">
                <div class="checklist-item">
                    <div class="step-circle">1</div>
                    <div class="flex-1">
                        <h4 class="font-bold text-slate-900 text-base">Download your converted JSON</h4>
                        <p class="text-sm text-slate-500 mt-0.5">Click the "Download Layout" button above. This is your new MoErgo configuration file.</p>
                    </div>
                </div>
                <div class="checklist-item">
                    <div class="step-circle">2</div>
                    <div class="flex-1">
                        <h4 class="font-bold text-slate-900 text-base">Import into the MoErgo Editor</h4>
                        <p class="text-sm text-slate-500 mt-0.5">Open the <a href="https://editor.moergo.com" target="_blank" class="text-blue-600 font-semibold hover:underline">MoErgo Layout Editor</a>, click "Import", and select the JSON file.</p>
                    </div>
                </div>
                <div class="checklist-item bg-blue-50/30">
                    <div class="step-circle-warn bg-blue-100 text-blue-600 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm border border-blue-200 shadow-sm">i</div>
                    <div class="flex-1">
                        <h4 class="font-bold text-slate-900 text-base">Migration Summary</h4>
                        <p class="text-sm text-slate-500 mt-0.5">We successfully migrated <strong>${layerCount} layers</strong>. Review the technical details below for specifics.</p>
                    </div>
                </div>
            </div>

            <h3 class="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 px-2">Migration Intelligence</h3>
        `;

        // Warnings Category (Mouse, RGB, Proprietary features)
        if (Object.keys(state.log.warning).length > 0) {
            html += `
                <details class="report-category group" open>
                    <summary class="flex items-center justify-between">
                        <span class="flex items-center gap-3">
                            <span class="text-orange-500">⚠️</span> 
                            Items Requiring Manual Attention (${Object.keys(state.log.warning).length})
                        </span>
                        <svg class="w-4 h-4 text-slate-400 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                    </summary>
                    <div class="p-6 space-y-5 bg-white">
                        ${Object.entries(state.log.warning).map(([orig, data]) => `
                            <div class="flex flex-col gap-2 pb-4 border-b border-slate-50 last:border-0 last:pb-0">
                                <div class="flex justify-between items-center">
                                    <span class="keycap text-[11px] font-bold">${orig}</span>
                                    <span class="eyebrow text-[9px] text-orange-400">Review Required</span>
                                </div>
                                <p class="text-[13px] text-slate-600 leading-relaxed italic">"${data.reason}"</p>
                            </div>
                        `).join('')}
                    </div>
                </details>
            `;
        }

        // Hold-Taps (Mod-taps, Layer-taps)
        if (Object.keys(state.log.hold_tap).length > 0) {
            html += `
                <details class="report-category group">
                    <summary class="flex items-center justify-between">
                        <span class="flex items-center gap-3">
                            <span class="text-blue-500">🎯</span> 
                            Hold-Tap Bindings (${Object.keys(state.log.hold_tap).length})
                        </span>
                        <svg class="w-4 h-4 text-slate-400 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                    </summary>
                    <div class="p-6 bg-white">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                            ${Object.entries(state.log.hold_tap).map(([orig, data]) => `
                                <div class="flex items-center justify-between p-3 rounded-xl bg-slate-50/50 border border-slate-100">
                                    <span class="keycap text-[10px]">${orig}</span>
                                    <span class="text-slate-300">→</span>
                                    <span class="keycap keycap-composite text-[10px]">${data.translated}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </details>
            `;
        }

        // Standard Bindings
        if (Object.keys(state.log.layer_binding).length > 0) {
            html += `
                <details class="report-category group">
                    <summary class="flex items-center justify-between">
                        <span class="flex items-center gap-3">
                            <span class="text-slate-500">⌨️</span> 
                            Converted Key Bindings (${Object.keys(state.log.layer_binding).length})
                        </span>
                        <svg class="w-4 h-4 text-slate-400 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                    </summary>
                    <div class="p-6 bg-white">
                        <div class="flex flex-wrap gap-2">
                            ${Object.entries(state.log.layer_binding).map(([orig, data]) => `
                                <div class="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50 border border-slate-100">
                                    <span class="text-[10px] font-mono text-slate-400 font-bold">${orig}</span>
                                    <span class="text-slate-300">→</span>
                                    <span class="keycap text-[10px]">${data.translated}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </details>
            `;
        }

        container.innerHTML = html;
    },

    displayFatalError: (msg, stack) => {
        const uploadScreen = document.getElementById('uploadScreen');
        uploadScreen.innerHTML = `
            <div class="glass-panel text-center py-12 border-red-100 bg-red-50/30">
                <div class="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-200">
                    <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </div>
                <h3 class="text-2xl font-extrabold text-slate-900 mb-2">Oops! We couldn't read that file.</h3>
                <p class="text-slate-600 mb-8 max-w-md mx-auto leading-relaxed">Something went wrong while trying to read your layout. Please make sure you uploaded the correct <strong>Source .zip</strong> file from ZSA Oryx.</p>
                <button onclick="window.location.reload()" class="btn-primary mx-auto">Try Again</button>
                
                <div class="mt-10 text-left bg-white border border-slate-200 rounded-2xl p-6 shadow-inner">
                    <h5 class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Diagnostic Log</h5>
                    <div class="overflow-auto max-h-40">
                        <code class="text-[11px] text-red-500 font-mono whitespace-pre leading-relaxed">${msg}\n\n${stack || ""}</code>
                    </div>
                </div>
            </div>
        `;
    },

    printPDF: () => {
        window.print();
    }
};
