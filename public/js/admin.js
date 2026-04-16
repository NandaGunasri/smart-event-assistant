document.addEventListener('DOMContentLoaded', () => {
    const heatmapGrid = document.getElementById('heatmapGrid');
    const alertsStream = document.getElementById('alertsStream');
    const emergencyToggle = document.getElementById('emergencyToggle');
    const resetBtn = document.getElementById('resetBtn');
    const updatePulse = document.getElementById('updatePulse');
    
    let isEmergency = false;
    let oldLevels = {}; // keep track to push alerts only on change

    // Fetch loop
    async function updateDashboard() {
        try {
            // Pulse UI
            updatePulse.style.opacity = '1';
            setTimeout(() => { updatePulse.style.opacity = '0.3'; }, 200);

            const res = await fetch('/api/crowd-status');
            const data = await res.json();
            
            // Sync Emergency state if changed elsewhere
            if (data.emergencyMode !== isEmergency) {
                isEmergency = data.emergencyMode;
                updateEmergencyBtn();
            }

            renderGrid(data.zones);
            checkAlerts(data.zones);

        } catch (e) {
            console.error("Dashboard update failed", e);
        }
    }

    function renderGrid(zones) {
        heatmapGrid.innerHTML = '';
        const zoneKeys = Object.keys(zones);
        
        zoneKeys.forEach(zoneId => {
            const z = zones[zoneId];
            const levelClass = `level-${z.level}`;
            const timeInfo = isEmergency ? 'EVACUATE' : `${z.waitTimePredicted}m wait`;
            
            const html = `
                <div class="heat-zone ${levelClass}">
                    <div style="flex-grow: 1;">
                        <div class="zone-header">${zoneId}</div>
                        <div style="font-size: 0.85rem; color: #88a; margin-top: 0.25rem;">
                            Occ: ${z.currentPeople} / ${z.capacity}
                        </div>
                        <div class="progress-bg">
                            <div class="progress-bar" style="width: ${z.density}%"></div>
                        </div>
                    </div>
                    <div style="text-align: right; min-width: 80px;">
                        <div style="font-size: 1.2rem; font-weight: bold;">${z.density}%</div>
                        <div style="font-size: 0.8rem; color: #88a;">${timeInfo}</div>
                    </div>
                </div>
            `;
            heatmapGrid.insertAdjacentHTML('beforeend', html);
        });
    }

    function checkAlerts(zones) {
        Object.keys(zones).forEach(key => {
            const level = zones[key].level;
            if (oldLevels[key] !== level && level === 'High') {
                logAlert(`⚠️ WARNING: ${key} capacity critical (${zones[key].density}%). Rerouting active.`);
            }
            oldLevels[key] = level;
        });
    }

    function logAlert(msg) {
        const time = new Date().toLocaleTimeString();
        const p = document.createElement('div');
        p.textContent = `[${time}] ${msg}`;
        p.style.marginBottom = '0.5rem';
        alertsStream.prepend(p);
    }

    // Controls
    emergencyToggle.addEventListener('click', async () => {
        isEmergency = !isEmergency;
        updateEmergencyBtn();
        
        await fetch('/api/admin/emergency', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ active: isEmergency })
        });
        
        logAlert(isEmergency ? "🚨 SYSTEM EMERGENCY ACTIVATED" : "✅ Emergency deactivated. Return to normal ops.");
        updateDashboard();
    });

    function updateEmergencyBtn() {
        if (isEmergency) {
            emergencyToggle.style.background = 'var(--alert-color)';
            emergencyToggle.textContent = 'Emergency Mode: ON';
            emergencyToggle.classList.add('glow-text');
        } else {
            emergencyToggle.style.background = '#444';
            emergencyToggle.textContent = 'Emergency Mode: OFF';
            emergencyToggle.classList.remove('glow-text');
        }
    }

    document.querySelectorAll('.sim-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const zoneId = e.target.getAttribute('data-zone');
            const spike = parseInt(e.target.getAttribute('data-spike'));
            
            await fetch('/api/admin/simulate-spike', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ zoneId, spikeAmount: spike })
            });
            logAlert(`Simulated crowd spike at ${zoneId} (+${spike})`);
            updateDashboard();
        });
    });

    resetBtn.addEventListener('click', async () => {
        await fetch('/api/admin/reset', { method: 'POST' });
        logAlert("Scenario reset complete.");
        updateDashboard();
    });

    // Start
    setInterval(updateDashboard, 2000);
    updateDashboard();
});
