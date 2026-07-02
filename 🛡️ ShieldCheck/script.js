// Initialize Charts
let compChart, radarChart;

document.addEventListener('DOMContentLoaded', () => {
    initCharts();
    setupEventListeners();
});

function initCharts() {
    const ctx1 = document.getElementById('compositionChart').getContext('2d');
    const ctx2 = document.getElementById('radarChart').getContext('2d');

    Chart.defaults.color = '#94a3b8';
    Chart.defaults.font.family = 'Segoe UI';

    compChart = new Chart(ctx1, {
        type: 'doughnut',
        data: {
            labels: ['Upper', 'Lower', 'Num', 'Special'],
            datasets: [{
                data: [0, 0, 0, 0],
                backgroundColor: ['#7000ff', '#00f2ff', '#00ff88', '#ffb800'],
                borderWidth: 0
            }]
        },
        options: { cutout: '70%', plugins: { legend: { position: 'right' } } }
    });

    radarChart = new Chart(ctx2, {
        type: 'radar',
        data: {
            labels: ['Length', 'Variety', 'Uniqueness', 'Complexity', 'Entropy'],
            datasets: [{
                label: 'Security Profile',
                data: [0, 0, 0, 0, 0],
                fill: true,
                backgroundColor: 'rgba(0, 242, 255, 0.2)',
                borderColor: '#00f2ff',
                pointBackgroundColor: '#00f2ff'
            }]
        },
        options: {
            scales: { r: { grid: { color: 'rgba(255,255,255,0.1)' }, angleLines: { color: 'rgba(255,255,255,0.1)' }, suggestMin: 0, suggestMax: 100, ticks: { display: false } } },
            plugins: { legend: { display: false } }
        }
    });
}

function setupEventListeners() {
    const passInput = document.getElementById('passwordInput');
    const toggleBtn = document.getElementById('togglePassword');
    const voiceBtn = document.getElementById('voiceBtn');
    const genBtn = document.getElementById('generateBtn');

    passInput.addEventListener('input', (e) => analyzePassword(e.target.value));

    toggleBtn.addEventListener('click', () => {
        const type = passInput.type === 'password' ? 'text' : 'password';
        passInput.type = type;
        toggleBtn.innerHTML = type === 'password' ? '<i class="fas fa-eye"></i>' : '<i class="fas fa-eye-slash"></i>';
    });

    // Web Speech API
    if ('webkitSpeechRecognition' in window) {
        const recognition = new webkitSpeechRecognition();
        voiceBtn.addEventListener('click', () => {
            recognition.start();
            voiceBtn.style.color = '#ff4d4d';
        });
        recognition.onresult = (event) => {
            const result = event.results[0][0].transcript.replace(/\s/g, '');
            passInput.value = result;
            analyzePassword(result);
            voiceBtn.style.color = '';
        };
    }

    genBtn.addEventListener('click', generateSecurePassword);
}

function analyzePassword(pass) {
    const stats = {
        length: pass.length,
        upper: (pass.match(/[A-Z]/g) || []).length,
        lower: (pass.match(/[a-z]/g) || []).length,
        number: (pass.match(/[0-9]/g) || []).length,
        special: (pass.match(/[^A-Za-z0-9]/g) || []).length,
    };

    // 1. Update Checklist UI
    updateChecklist(stats);

    // 2. Calculate Strength Score (0 - 100)
    let score = 0;
    if (stats.length > 0) {
        score += Math.min(stats.length * 4, 30);
        if (stats.upper > 0) score += 15;
        if (stats.lower > 0) score += 15;
        if (stats.number > 0) score += 20;
        if (stats.special > 0) score += 20;
    }

    // 3. Update Strength Meter
    const fill = document.getElementById('strengthFill');
    const txt = document.getElementById('strengthText');
    fill.style.width = score + '%';
    
    if (score < 30) { txt.innerText = 'Weak'; fill.style.background = '#ff4d4d'; }
    else if (score < 60) { txt.innerText = 'Medium'; fill.style.background = '#ffb800'; }
    else if (score < 85) { txt.innerText = 'Strong'; fill.style.background = '#00ff88'; }
    else { txt.innerText = 'Military Grade'; fill.style.background = '#00f2ff'; }
    document.getElementById('strengthPercent').innerText = score + '%';

    // 4. Update Charts
    compChart.data.datasets[0].data = [stats.upper, stats.lower, stats.number, stats.special];
    compChart.update();

    radarChart.data.datasets[0].data = [
        Math.min(stats.length * 7, 100),
        ( (stats.upper > 0) + (stats.lower > 0) + (stats.number > 0) + (stats.special > 0) ) * 25,
        pass.length > 0 ? (new Set(pass).size / pass.length) * 100 : 0,
        score,
        Math.min(calculateEntropy(pass), 100)
    ];
    radarChart.update();

    // 5. Crack Time & Insights
    updateInsights(pass, score, stats);
}

function updateChecklist(stats) {
    const rules = {
        length: stats.length >= 12,
        upper: stats.upper > 0,
        lower: stats.lower > 0,
        number: stats.number > 0,
        special: stats.special > 0
    };

    Object.keys(rules).forEach(rule => {
        const el = document.querySelector(`[data-rule="${rule}"]`);
        if (rules[rule]) {
            el.classList.add('valid');
            el.querySelector('i').className = 'fas fa-check-circle';
        } else {
            el.classList.remove('valid');
            el.querySelector('i').className = 'fas fa-circle';
        }
    });
}

function calculateEntropy(pass) {
    if (!pass) return 0;
    let pool = 0;
    if (/[a-z]/.test(pass)) pool += 26;
    if (/[A-Z]/.test(pass)) pool += 26;
    if (/[0-9]/.test(pass)) pool += 10;
    if (/[^A-Za-z0-9]/.test(pass)) pool += 32;
    return Math.floor(pass.length * Math.log2(pool));
}

function updateInsights(pass, score, stats) {
    const crackTime = document.getElementById('crackTime');
    const entropyEl = document.getElementById('entropyScore');
    const dictEl = document.getElementById('dictStatus');
    const suggestEl = document.getElementById('suggestions');

    // Simple crack time logic
    if (score < 30) crackTime.innerText = "Instantly";
    else if (score < 50) crackTime.innerText = "2 Hours";
    else if (score < 75) crackTime.innerText = "5 Years";
    else crackTime.innerText = "400+ Centuries";

    const entropy = calculateEntropy(pass);
    entropyEl.innerText = entropy + " bits";

    // Common passwords check
    const common = ['123456', 'password', 'qwerty', 'admin123'];
    if (common.includes(pass.toLowerCase())) {
        dictEl.innerText = "DANGER";
        dictEl.style.color = "#ff4d4d";
    } else {
        dictEl.innerText = "Safe";
        dictEl.style.color = "#00ff88";
    }

    // Suggestions
    let html = "";
    if (stats.length < 12) html += `<p class="warn"><i class="fas fa-exclamation-triangle"></i> Increase length to 12+ chars.</p>`;
    if (stats.special === 0) html += `<p class="info"><i class="fas fa-info-circle"></i> Add a symbol (e.g., $, !, @).</p>`;
    if (score > 80) html += `<p class="success"><i class="fas fa-check-double"></i> Excellent security profile.</p>`;
    suggestEl.innerHTML = html || `<p class="msg">Analysis optimized.</p>`;
}

function generateSecurePassword() {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+";
    let generated = "";
    for (let i = 0; i < 16; i++) {
        generated += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    document.getElementById('genResult').innerText = generated;
}

// Copy functionality
document.getElementById('copyGen').onclick = () => {
    const text = document.getElementById('genResult').innerText;
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
};