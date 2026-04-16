const express = require('express');
const app = express();
const path = require('path');

const PORT = process.env.PORT || 8080;

// Middleware to serve static frontend files
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// State Configuration
let emergencyMode = false;

// Mock event zones
let zones = {
    'Gate A': { capacity: 1000, current: 850, baseWaitTime: 5 },
    'Gate B': { capacity: 1000, current: 300, baseWaitTime: 5 },
    'Hall A': { capacity: 5000, current: 4800, baseWaitTime: 10 },
    'Hall B': { capacity: 4000, current: 1500, baseWaitTime: 8 },
    'Food Court': { capacity: 800, current: 750, baseWaitTime: 20 },
    'Tech Zone': { capacity: 2000, current: 600, baseWaitTime: 5 }
};

// Pure utility to calculate crowd level (Low/Medium/High)
function getCrowdLevelFromPercentage(percentage) {
    if (percentage > 85) return 'High';
    if (percentage > 50) return 'Medium';
    return 'Low';
}

// AI Decision Engine Function
function makeDecision(location, destination, crowdLevel, waitTime) {
    if (emergencyMode) {
        return {
            crowd: crowdLevel,
            waitTime: `${waitTime} mins`,
            route: `Nearest Emergency Exit from ${location}`,
            decision: "Emergency Mode Active. Evacuate immediately.",
            alert: "Emergency! Use nearest exit"
        };
    }

    let route = `${location} → ${destination}`;
    let decision = "Direct route is clear";
    let alert = "Safe to proceed";

    if (crowdLevel === 'High') {
        const altRoute = destination === 'Exit' ? 'Exit Gate B' : 'Alternate Connector';
        route = `${location} → ${altRoute} → ${destination}`;
        decision = `Avoid direct path (High Traffic)`;
        alert = `${location} is overcrowded`;
    } else if (waitTime > 15) {
        route = `${location} → Fast Lane → ${destination}`;
        decision = `Delay suggested or use alternate path (${waitTime}m wait)`;
        alert = `High wait time in ${location}`;
    }

    return {
        crowd: crowdLevel,
        waitTime: `${waitTime} mins`,
        route: route,
        decision: decision,
        alert: alert
    };
}

// Dynamic info calculator for a zone
function getZoneInfo(zoneId) {
    const data = zones[zoneId];
    if (!data) return null;

    const percentage = (data.current / data.capacity) * 100;
    const crowdLevel = getCrowdLevelFromPercentage(percentage);
    
    // Simple wait time prediction formula: Base Time + (Current Crowd / 100) * 0.5
    // Randomize a little for realism
    let calculatedWait = Math.round(data.baseWaitTime + (data.current / 100) * 0.4);
    
    // Apply emergency override
    if(emergencyMode) calculatedWait = 0; 
    
    return {
        id: zoneId,
        percentage: percentage.toFixed(1),
        crowdLevel: crowdLevel,
        waitTime: calculatedWait
    };
}

// REST API Endpoints

// 1. /api/crowd-status
app.get('/api/crowd-status', (req, res) => {
    let result = {};
    for (let zoneId in zones) {
        let info = getZoneInfo(zoneId);
        // Include decision even here, arbitrarily picking destination as 'General'
        let decisionPackage = makeDecision(zoneId, 'General', info.crowdLevel, info.waitTime);
        
        result[zoneId] = {
            currentPeople: zones[zoneId].current,
            capacity: zones[zoneId].capacity,
            density: info.percentage,
            level: info.crowdLevel,
            waitTimePredicted: info.waitTime,
            aiDecision: decisionPackage // included as requested
        };
    }
    
    res.json({
        emergencyMode,
        timestamp: new Date().toISOString(),
        zones: result
    });
});

// 2. /api/predict-wait
app.get('/api/predict-wait', (req, res) => {
    const location = req.query.location || 'Gate A';
    const destination = req.query.destination || 'Hall A';
    
    const info = getZoneInfo(location);
    if (!info) return res.status(404).json({error: "Zone not found"});

    const decisionPackage = makeDecision(location, destination, info.crowdLevel, info.waitTime);
    res.json(decisionPackage);
});

// 3. /api/suggest-route
app.get('/api/suggest-route', (req, res) => {
    const location = req.query.from || 'Gate A';
    const destination = req.query.to || 'Hall A';

    const info = getZoneInfo(location);
    if (!info) return res.status(404).json({error: "Zone not found"});

    // Same decision logic
    const decisionPackage = makeDecision(location, destination, info.crowdLevel, info.waitTime);
    res.json(decisionPackage);
});

// Admin Controllers

// 4. Toggle Emergency Mode
app.post('/api/admin/emergency', (req, res) => {
    emergencyMode = req.body.active;
    res.json({ success: true, emergencyMode });
});

// 5. Simulate Crowd Spike
app.post('/api/admin/simulate-spike', (req, res) => {
    const { zoneId, spikeAmount } = req.body;
    if (zones[zoneId]) {
        zones[zoneId].current = Math.min(zones[zoneId].capacity, zones[zoneId].current + spikeAmount);
        res.json({ success: true, message: `Spiked ${zoneId} by ${spikeAmount}` });
    } else {
        res.status(400).json({ error: "Zone not found" });
    }
});

// 6. Reset Scenario
app.post('/api/admin/reset', (req, res) => {
    emergencyMode = false;
    zones['Gate A'].current = 200;
    zones['Gate B'].current = 100;
    zones['Hall A'].current = 500;
    zones['Hall B'].current = 300;
    zones['Food Court'].current = 150;
    zones['Tech Zone'].current = 200;
    res.json({ success: true, message: "System reset to base levels." });
});

// Start Server
app.listen(PORT, () => {
    console.log(`EventFlow AI backend listening on http://localhost:${PORT}`);
});
