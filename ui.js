// ====================================================================
        // 1. SMART TAP-DANCE PARSER (Conditional Behaviors)
        // ====================================================================
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
                    // Capture the contents of tap or register functions
                    const regex = /(?:tap_code16|register_code16|tap_code|register_code)\((.*?)\)\s*;/g;
                    let m;
                    
                    while ((m = regex.exec(actionStr)) !== null) {
                        let rawKey = m[1];
                        let uiKey = rawKey.replace(/KC_/g, '').replace(/X_/g, '');
                        
                        // Parse QMK Modifiers into clean UI labels
                        uiKey = uiKey.replace(/LEFT_CTRL/g, 'Ctrl')
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
                                     
                        // Just create the visual keycap, no "Hold" or "Tap" text attached
                        steps.push(`<span class="keycap text-[10px] bg-white !border-slate-300 shadow-sm mx-0.5">${uiKey}</span>`);
                    }
                    
                    // Deduplicate identical keys (so Tap A + Hold A just becomes "A")
                    let uniqueSteps = [...new Set(steps)];
                    
                    if (uniqueSteps.length > 0) {
                        tdHtml += `
                            <div class="flex items-center gap-3 mb-2 mt-1">
                                <span class="w-24 shrink-0 text-[10px] font-bold text-slate-500 uppercase text-right">${c.label}</span> 
                                <span class="text-slate-300 text-[10px]">➔</span> 
                                <div class="flex flex-wrap items-center gap-y-1">
                                    ${uniqueSteps.join('<span class="text-slate-300 text-[10px] mx-1">+</span>')}
                                </div>
                            </div>
                        `;
                        foundTd = true;
                    }
                }
            });

            if (foundTd) {
                return `
                    <strong class="block text-slate-800 text-xs mb-2">Tap Dance Behaviors:</strong>
                    <div class="pt-1 pb-1">
                        ${tdHtml}
                    </div>
                `;
            }
        }
