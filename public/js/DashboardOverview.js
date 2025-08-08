// Dashboard Overview Section से जुड़े functions

// (Unused/commented code removed. Sirf actual dashboard overview/charts logic, functions, aur event listeners bache hain.)

// --- Task Summary Cards ---
function updateTaskSummaryCards() {
    document.getElementById('summaryTotalTasks').innerText = taskList.length;
    const completed = taskList.filter(t => t.completed).length;
    const pending = taskList.filter(t => !t.completed).length;
    const highPriority = taskList.filter(t => t.priority === 'High').length;
    document.getElementById('summaryCompletedTasks').innerText = completed;
    document.getElementById('summaryPendingTasks').innerText = pending;
    document.getElementById('summaryHighPriorityTasks').innerText = highPriority;
}

// --- Upcoming Deadlines (Top 5) ---
function updateUpcomingDeadlines() {
    const upcoming = taskList.filter(t => t.dueDate && !t.completed && new Date(t.dueDate) >= new Date()).sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate)).slice(0, 5);
    const ul = document.getElementById('upcomingDeadlines');
    ul.innerHTML = '';
    if (upcoming.length === 0) {
        ul.innerHTML = '<li>No upcoming deadlines</li>';
        return;
    }
    upcoming.forEach(t => {
        const li = document.createElement('li');
        li.innerHTML = `<span class="font-semibold text-blue-600">${t.text}</span> <span class="text-gray-400">(${new Date(t.dueDate).toLocaleDateString()})</span>`;
        ul.appendChild(li);
    });
}

// --- Most Active Project ---
function updateMostActiveProject() {
    const projectTaskCounts = {};
    taskList.forEach(t => {
        if (!projectTaskCounts[t.projectId]) projectTaskCounts[t.projectId] = 0;
        projectTaskCounts[t.projectId]++;
    });
    let max = 0, maxId = null;
    for (const id in projectTaskCounts) {
        if (projectTaskCounts[id] > max) {
            max = projectTaskCounts[id];
            maxId = id;
        }
    }
    const project = projects.find(p => p._id === maxId);
    document.getElementById('mostActiveProject').innerText = project ? project.name : 'N/A';
}

// --- Average Completion Rate ---
function updateAvgCompletionRate() {
    if (projects.length === 0) {
        document.getElementById('avgCompletionRate').innerText = '0%';
        return;
    }
    let total = 0, count = 0;
    projects.forEach(p => {
        const projectTasks = taskList.filter(t => t.projectId === p._id);
        if (projectTasks.length === 0) return;
        const done = projectTasks.filter(t => t.completed).length;
        total += Math.round((done / projectTasks.length) * 100);
        count++;
    });
    const avg = Math.round(total / (count || 1));
    document.getElementById('avgCompletionRate').innerText = isNaN(avg) ? '0%' : avg + '%';
}

// --- Pie Chart ---
function updatePieChart() {
    const completed = taskList.filter(t => t.completed).length;
    const pending = taskList.filter(t => !t.completed).length;
    const overdue = taskList.filter(t => !t.completed && t.dueDate && new Date(t.dueDate) < new Date()).length;
    const ctx = document.getElementById('pieChart')?.getContext('2d');
    if (!ctx) return;
    if (window.pieChart && typeof window.pieChart.destroy === 'function') window.pieChart.destroy();
    window.pieChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Completed', 'Pending', 'Overdue'],
            datasets: [{
                data: [completed, pending, overdue],
                backgroundColor: ['#34D399', '#FBBF24', '#F87171'],
            }],
        },
        options: { plugins: { legend: { position: 'bottom' } } }
    });
}

// --- Doughnut Chart ---
function updateDoughnutChart() {
    const high = taskList.filter(t => t.priority === 'High').length;
    const medium = taskList.filter(t => t.priority === 'Medium').length;
    const low = taskList.filter(t => t.priority === 'Low').length;
    const ctx = document.getElementById('doughnutChart')?.getContext('2d');
    if (!ctx) return;
    if (window.doughnutChart && typeof window.doughnutChart.destroy === 'function') window.doughnutChart.destroy();
    window.doughnutChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['High', 'Medium', 'Low'],
            datasets: [{
                data: [high, medium, low],
                backgroundColor: ['#F87171', '#FBBF24', '#60A5FA'],
            }],
        },
        options: { plugins: { legend: { position: 'bottom' } } }
    });
}

// --- Daily Activity Line Chart Data ---
function getDailyActivityData(days = 30) {
    if (!activityFeedArr) return { dateLabels: [], activityCounts: [], movingAvg: [] };
    const today = new Date();
    const dateLabels = [];
    const activityCounts = [];
    for (let i = days - 1; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const dd = String(d.getDate()).padStart(2, '0');
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const yy = String(d.getFullYear()).slice(-2);
        const label = `${dd}/${mm}/${yy}`;
        dateLabels.push(label);
        const count = activityFeedArr.filter(a => {
            const atime = new Date(a.time);
            return atime.getDate() === d.getDate() && atime.getMonth() === d.getMonth() && atime.getFullYear() === d.getFullYear();
        }).length;
        activityCounts.push(count);
    }
    // 7-day moving average for trend
    const windowSize = 7;
    const movingAvg = activityCounts.map((_, idx, arr) => {
        const start = Math.max(0, idx - windowSize + 1);
        const slice = arr.slice(start, idx + 1);
        const sum = slice.reduce((s, v) => s + v, 0);
        return Number((sum / slice.length).toFixed(2));
    });
    return { dateLabels, activityCounts, movingAvg };
}
// --- Line Chart Render ---
function updateLineChart() {
    const { dateLabels, activityCounts, movingAvg } = getDailyActivityData(30);
    const canvas = document.getElementById('lineChart');
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;
    if (window.lineChart && typeof window.lineChart.destroy === 'function') window.lineChart.destroy();

    // Gradient fill for primary dataset
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height || 300);
    gradient.addColorStop(0, 'rgba(59,130,246,0.25)');
    gradient.addColorStop(1, 'rgba(59,130,246,0.02)');

    window.lineChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: dateLabels,
            datasets: [
                {
                    label: 'Daily Activity',
                    data: activityCounts,
                    borderColor: '#3b82f6',
                    backgroundColor: gradient,
                    fill: true,
                    tension: 0.35,
                    pointRadius: 2,
                    pointHoverRadius: 5,
                    pointBackgroundColor: '#2563eb',
                    segment: {
                        borderColor: ctx => (ctx.p0.parsed.y === 0 && ctx.p1.parsed.y === 0 ? 'rgba(59,130,246,0.3)' : '#3b82f6')
                    }
                },
                {
                    label: '7-day Avg',
                    data: movingAvg,
                    borderColor: '#10b981',
                    backgroundColor: 'transparent',
                    borderDash: [6, 6],
                    pointRadius: 0,
                    tension: 0.25
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            animation: {
                duration: 500,
                easing: 'easeOutQuart'
            },
            plugins: {
                legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 8, boxHeight: 8, padding: 12, font: { size: 10 } } },
                tooltip: {
                    callbacks: {
                        label: ctx => `${ctx.dataset.label}: ${ctx.parsed.y}`
                    }
                },
                decimation: { enabled: true, algorithm: 'lttb', samples: 60 }
            },
            scales: {
                x: {
                    ticks: { autoSkip: true, maxTicksLimit: 6, font: { size: 10 } },
                    grid: { display: false }
                },
                y: {
                    beginAtZero: true,
                    suggestedMax: Math.max(5, Math.ceil(Math.max(...activityCounts, 0) * 1.2)),
                    ticks: { stepSize: 1, font: { size: 10 } },
                    grid: { color: 'rgba(203,213,225,0.4)' }
                }
            },
            layout: { padding: { top: 4, right: 8, bottom: 4, left: 8 } }
        }
    });
}
// --- Dashboard Overview Update Function ---
function updateDashboardOverview() {
    try {
        updateTaskSummaryCards();
        updateUpcomingDeadlines();
        updateMostActiveProject();
        updateAvgCompletionRate();
        if (typeof updateActivityFeed === 'function') updateActivityFeed();
        updatePieChart();
        updateDoughnutChart();
        updateLineChart();
    } catch (err) {
        showAlert && showAlert({ icon: 'error', title: 'Error', text: err.message || 'Dashboard overview update failed!' });
        console.error(err);
    }
}

// Expose functions globally (window पर)
window.updateTaskSummaryCards = updateTaskSummaryCards;
window.updateUpcomingDeadlines = updateUpcomingDeadlines;
window.updateMostActiveProject = updateMostActiveProject;
window.updateAvgCompletionRate = updateAvgCompletionRate;
window.updatePieChart = updatePieChart;
window.updateDoughnutChart = updateDoughnutChart;
window.getDailyActivityData = getDailyActivityData;
window.updateLineChart = updateLineChart;
window.updateDashboardOverview = updateDashboardOverview; 