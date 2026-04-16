document.addEventListener('DOMContentLoaded', () => {
    const askAIBtn = document.getElementById('askAIBtn');
    const aiResponsePanel = document.getElementById('aiResponsePanel');
    const liveAlertBanner = document.getElementById('liveAlertBanner');
    const liveAlertText = document.getElementById('liveAlertText');
    
    // Check for alerts every 5 seconds
    setInterval(pollStatus, 5000);
    pollStatus();

    askAIBtn.addEventListener('click', async () => {
        const from = document.getElementById('currentLocationBtn').value;
        const to = document.getElementById('destinationBtn').value;
        
        // UI resetting for typing effect
        aiResponsePanel.classList.add('active');
        document.getElementById('resRoute').textContent = 'Computing optimal path...';
        document.getElementById('resWaitTime').textContent = '-';
        document.getElementById('resCrowd').textContent = '-';
        document.getElementById('resDecision').textContent = '-';
        
        try {
            const res = await fetch(`/api/suggest-route?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`);
            const data = await res.json();
            
            setTimeout(() => {
                document.getElementById('resRoute').textContent = data.route;
                
                // Color based on level
                let crowdHtml = data.crowd;
                if(data.crowd === 'High') crowdHtml = `<span class="badge bg-alert">High</span>`;
                if(data.crowd === 'Low') crowdHtml = `<span class="badge bg-success">Low</span>`;
                
                document.getElementById('resCrowd').innerHTML = crowdHtml;
                document.getElementById('resWaitTime').textContent = data.waitTime;
                document.getElementById('resDecision').innerHTML = `<strong>${data.alert}</strong> &mdash; ${data.decision}`;
                
                if(data.alert && data.alert.includes('Emergency')) {
                    document.getElementById('resDecision').style.borderLeft = "4px solid #ff3366";
                } else {
                    document.getElementById('resDecision').style.borderLeft = "4px solid #00f0ff";
                }
            }, 800); // Simulate AI calculation delay
        } catch (err) {
            console.error('Failed to fetch route', err);
            document.getElementById('resRoute').textContent = 'Error calculating route. Please try again.';
        }
    });
    
    async function pollStatus() {
        try {
            const res = await fetch('/api/crowd-status');
            const data = await res.json();
            
            if (data.emergencyMode) {
                liveAlertBanner.classList.add('active');
                liveAlertText.textContent = "EMERGENCY MODE ACTIVE! Please use nearest exits immediately. Avoid elevators.";
            } else {
                liveAlertBanner.classList.remove('active');
            }
        } catch(e) {
            console.error(e);
        }
    }
});
