function initSidebar() {
    const btn = document.getElementById('menu-btn');
    const side = document.getElementById('sidebar');
    const main = document.getElementById('main');

    if (!btn || !side) return;

    btn.onclick = () => {
        btn.classList.toggle('active');
        side.classList.toggle('active');
        if (main) main.classList.toggle('pushed');
    };
}

/* appearing name and by*/
function showAuthorText() {
    const authorBox = document.getElementById('author-box');
    if (authorBox) {
        // This overrides the inline 'display: none' in your HTML
        authorBox.setAttribute("style", "display: block !important; opacity: 1 !important;");
        authorBox.classList.add('show'); 
    }
}

function typeTitle(text) {
    const el = document.getElementById('typing-title');
    if (!el) return;

    if (el.dataset.typing === "true") return;
    el.dataset.typing = "true";

    el.innerHTML = "";
    let i = 0;

    function type() {
        if (i < text.length) {
            el.innerHTML += text.charAt(i);
            i++;
            setTimeout(type, 100);
        } else {
            showAuthorText(); 
            el.dataset.typing = "false";
        }
    }
    type();
}

// Thermometer scroll indicator
function initThermometer() {
    const thermometer = document.getElementById('scroll-thermometer');
    const fill = document.getElementById('thermometer-fill');

    if (!thermometer || !fill) return;

    if (!window.location.pathname.endsWith("index.html")) {
        thermometer.style.display = "none";
        return;
    }

    window.addEventListener('scroll', () => {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrolled = (scrollTop / docHeight) * 100;

        fill.style.height = scrolled + "%";

        if (scrolled >= 50) {
            fill.style.background = "#55c2e9ff";
        } else {
            fill.style.background = "#6366f1";
        }
    });
}

// Single event listener for initialization
document.addEventListener('DOMContentLoaded', () => {
    initSidebar();
    typeTitle("ISBT FINAL YEAR PROJECT");
    initThermometer();
});

const sensorConfigs = {
    temp: { 
        label: 'Temperature', unit: 'Temperature (°C)', color: '#ff6384', bg: 'rgba(255, 99, 132, 0.2)',
        threshold: 40, thresholdLabel: 'High Temp Alert (40°C)' 
    },
    hum: { 
        label: 'Humidity', unit: 'Humidity (%)', color: '#36a2eb', bg: 'rgba(54, 162, 235, 0.2)',
        threshold: 70, thresholdLabel: 'High Humidity (70%)' 
    },
    gas: { 
        label: 'Gas Level', unit: 'Gas Concentration (PPM)', color: '#4bc0c0', bg: 'rgba(75, 192, 192, 0.2)',
        threshold: 2000, thresholdLabel: 'Danger Level (2000 PPM)' 
    }
};

let sensorChart;
let currentSensorType = 'temp';

window.onload = function() {
    const chartElement = document.getElementById('sensorMainChart');
    if (chartElement) {
        const ctx = chartElement.getContext('2d');
        sensorChart = new Chart(ctx, {
            type: 'line',
            data: { labels: [], datasets: [{ data: [], fill: true, tension: 0.3, borderWidth: 3 }] },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: true },
                    annotation: {
                        annotations: {
                            thresholdLine: {
                                type: 'line', yMin: 0, yMax: 0, borderColor: 'rgba(255, 0, 0, 0.8)',
                                borderWidth: 2, borderDash: [10, 5],
                                label: { display: true, content: '', position: 'end' }
                            }
                        }
                    }
                },
                scales: {
                    x: { title: { display: true, text: 'Timeline' } },
                    y: { title: { display: true, text: 'Value' } }
                }
            }
        });

        window.updateSensorView('temp', document.getElementById('btn-sensor-temp'));

        setInterval(() => {
            const range = document.getElementById('timeRange')?.value || 'today';
            if (range === 'today') updateSensorView(null, null);
        }, 60000);
    }
};

window.updateSensorView = function(type, btn) {
    // SAFETY CHECK: If there is no chart, don't run this logic
    if (!sensorChart) return;

    if (type) currentSensorType = type;
    
    if (btn) {
        document.querySelectorAll('.sensor-opt-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    }

    const range = document.getElementById('timeRange')?.value || 'today';
    const config = sensorConfigs[currentSensorType];

    // Original path kept
    fetch(`api/data.php?type=${currentSensorType}&range=${range}`)
        .then(res => {
            // Check if the file actually exists and returned a success code
            if (!res.ok) throw new Error('File not found or server error');
            return res.json();
        })
        .then(data => {
            // Ensure data exists before assignment
            if (!data || !data.labels) return;

            sensorChart.data.labels = data.labels;
            sensorChart.data.datasets[0].label = config.label;
            sensorChart.data.datasets[0].borderColor = config.color;
            sensorChart.data.datasets[0].backgroundColor = config.bg;
            sensorChart.data.datasets[0].data = data.values;

            sensorChart.options.scales.y.title.text = config.unit;
            
            const annotation = sensorChart.options.plugins.annotation.annotations.thresholdLine;
            annotation.yMin = config.threshold;
            annotation.yMax = config.threshold;
            annotation.label.content = config.thresholdLabel;

            sensorChart.update();
        })
        .catch(err => {
            // This stops the red error in your console
            console.warn("Chart data currently unavailable. (ESP32 may be offline)");
        });
};

function sendManualCommand(cmd, label) {
    const statusLabel = document.getElementById('sync-text');
    if (statusLabel) {
        statusLabel.innerText = "Syncing " + label + "...";
        statusLabel.style.color = "#3498db";
    }

    fetch('api/control_relay.php?set_state=' + cmd)
        .then(response => {
            if (!response.ok) throw new Error('Error');
            return response.text();
        })
        .then(data => {
            if (statusLabel) {
                statusLabel.innerText = "Active Mode: " + label;
                statusLabel.style.color = "#2ecc71";
            }
        })
        .catch(err => {
            if (statusLabel) statusLabel.innerText = "Sync Failed";
        });
}

function updateStatus() {
    const dot = document.getElementById('status-dot');
    const text = document.getElementById('status-text');
    
    // Safety check: Prevents code from breaking if element is missing
    if (!dot || !text) return;

    fetch('api/get_status.php')
        .then(response => response.json())
        .then(data => {
            dot.className = 'dot ' + data.status;
            text.innerText = data.label;
        })
        .catch(err => console.warn('Status elements found but API unavailable.'));
}

setInterval(updateStatus, 2000);
updateStatus();