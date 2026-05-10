export const UI = {
    updateDropZone: (fileName, isLoading) => {
        const dropText = document.getElementById('dropText');
        const dropSubtext = document.getElementById('dropSubtext');
        const dropIcon = document.getElementById('dropIcon');

        if (isLoading && dropText && dropSubtext && dropIcon) {
            dropText.innerText = "Analyzing Layout...";
            dropSubtext.innerText = `Processing ${fileName}...`;
            dropIcon.outerHTML = `
                <div id="dropIcon" class="w-10 h-10 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
            `;
        }
    },

    buildReport: (layerCount, state) => {
        const container = document.getElementById('outputReport');
        if (!container) return;

        let html = `
            <div class="checklist-container mb-10">
                <div class="checklist-item">
                    <div class="step-circle">1</div>
                    <div class="flex-1">
                        <h4 class="font-bold text-slate-900 text-base">Download your new file</h4>
                        <p class="text-sm text-slate-500 mt-0.5">Click the "Download Layout" button above to save your MoErgo configuration.</p>
                    </div>
                </div>
                <div class="checklist-item">
                    <div class="step-circle">2</div>
                    <div class="flex-1">
                        <h4 class="font-bold text-slate-900 text-base">Import to the MoErgo Editor</h4>
                        <p class="text-sm text-slate-500 mt-0.5">Go to <a href="https://editor.moergo.com" target="_blank" class="text-blue-600 font-semibold hover:underline">editor.moergo.com</a> and use the "Import" button.</p>
                    </div>
                </div>
                <div class="checklist-item">
                    <div class="step-circle-warn">!</div>
                    <div class="flex-1">
                        <h4 class="font-bold text-slate-900 text-base">Manual Review Required</h4>
                        <p class="text-sm text-slate-500 mt-0.5">We've migrated <strong>${layerCount} layers</strong>. See the advanced details below for specific adjustments.</p>
                    </div>
                </div>
            </div>

            <div class="space-y-6">
                <h3 class="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Advanced Migration Details</h3>
        `;

        // Warnings (Mouse, RGB, Proprietary features)
        if (Object.keys(state.log.warning).length > 0) {
            html += `
                <details class="report-category" open>
                    <summary>
                        <span class="flex items-center gap-3">
                            <span class="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
                            Items requiring manual setup (${Object.keys(state.log.warning).length})
                        </span>
                    </summary>
                    <div class="p-6 space-y-5 bg-white">
                        ${Object.entries(state.log.warning).map(([orig, data]) => `
                            <div class="flex flex-col gap-2">
                                <div class="flex items-center justify-between">
                                    <span class="keycap text-[11px]">${orig}</span>
                                    <span class="text-[10px] font-bold text-slate-300 uppercase tracking-tighter">Skipped</span>
                                </div>
                                <p class="text-xs text-slate-500 leading-relaxed pl-1 border-l-2 border-slate-100">
                                    ${data.reason}
                                </p>
                            </div>
                        `).join('')}
                    </div>
                </details>
            `;
        }

        // Hold-Taps (Mod-taps / Layer-taps)
        if (Object.keys(state.log.hold_tap).length > 0) {
            html += `
                <details class="report-category">
                    <summary>
                        <span class="flex items-center gap-3">
                            <span class="w-2 h-2 rounded-full bg-blue-500"></span>
                            Converted Hold-Tap behaviors (${Object.keys(state.log.hold_tap).length})
                        </span>
                    </summary>
                    <div class="p-6 grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white">
                        ${Object.entries(state.log.hold_tap).map(([orig, data]) => `
                            <div class="flex items-center justify-between p-3 rounded-xl bg-slate-50/50 border border-slate-100">
                                <span class="keycap text-[10px]">${orig}</span>
                                <span class="text-slate-300 text-xs">➔</span>
                                <span class="keycap keycap-composite text-[10px]">${data.translated}</span>
                            </div>
                        `).join('')}
                    </div>
                </details>
            `;
        }

        html += `</div>`;
        container.innerHTML = html;
    },

    displayFatalError: (msg, stack) => {
        const uploadScreen = document.getElementById('uploadScreen');
        if (!uploadScreen) return;
        
        uploadScreen.innerHTML = `
            <div class="glass-panel text-center py-16 px-10 border-red-100 bg-red-50/20">
                <div class="w-20 h-20 bg-red-100 text-red-600 rounded-3xl flex items-center justify-center mx-auto mb-8 rotate-3 shadow-lg shadow-red-200/50">
                    <svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                </div>
                <h3 class="text-2xl font-black text-slate-900 mb-3 tracking-tight">Oops! Something tripped us up.</h3>
                <p class="text-slate-600 mb-10 max-w-sm mx-auto text-base">We couldn't process this ZSA Source file. Check the error details below or try again.</p>
                <button onclick="window.location.reload()" class="btn-primary mx-auto px-12">Return to Start</button>
                <div class="mt-10 p-6 bg-slate-900 rounded-2xl text-left shadow-2xl">
                    <div class="flex items-center gap-2 mb-3 border-b border-white/10 pb-3">
                        <div class="w-3 h-3 rounded-full bg-red-500"></div>
                        <div class="w-3 h-3 rounded-full bg-orange-500"></div>
                        <div class="w-3 h-3 rounded-full bg-green-500"></div>
                        <span class="text-[10px] text-slate-500 font-mono ml-2 uppercase tracking-widest">Error Log</span>
                    </div>
                    <code class="text-[11px] text-pink-400 font-mono block whitespace-pre overflow-x-auto">${msg}\n\n${stack || ""}</code>
                </div>
            </div>
        `;
    },

    printPDF: () => {
        window.print();
    }
};
