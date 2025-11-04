// --- Task Summary Cards ---
function updateTaskSummaryCards() {
    // Ensure we have tasks before processing
    if (!taskList || taskList.length === 0) {
        document.getElementById('summaryTotalTasks').innerText = '0';
        document.getElementById('summaryCompletedTasks').innerText = '0';
        document.getElementById('summaryPendingTasks').innerText = '0';
        document.getElementById('summaryHighPriorityTasks').innerText = '0';
        return;
    }

    const totalTasks = taskList.length;
    const completed = taskList.filter(t => t.completed).length;
    const pending = taskList.filter(t => !t.completed).length;
    const highPriority = taskList.filter(t => t.priority === 'High').length;
    
    // Calculate completion percentage
    const completionPercentage = totalTasks > 0 ? Math.round((completed / totalTasks) * 100) : 0;
    
    // Update task summary cards with more context
    document.getElementById('summaryTotalTasks').innerHTML = `
        <div class="flex items-center justify-between">
            <span class="text-xl font-bold">${totalTasks}</span>
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
        </div>
    `;
    
    document.getElementById('summaryCompletedTasks').innerHTML = `
        <div class="flex items-center justify-between">
            <span class="text-xl font-bold text-green-600">${completed}</span>
            <div class="flex flex-col items-end">
                <span class="text-xs font-medium text-green-500">${completionPercentage}%</span>
                <div class="w-16 h-1 bg-green-100 rounded-full mt-1">
                    <div class="h-1 bg-green-500 rounded-full" style="width: ${completionPercentage}%"></div>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('summaryPendingTasks').innerHTML = `
        <div class="flex items-center justify-between">
            <span class="text-xl font-bold text-yellow-600">${pending}</span>
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        </div>
    `;
    
    document.getElementById('summaryHighPriorityTasks').innerHTML = `
        <div class="flex items-center justify-between">
            <span class="text-xl font-bold text-red-600">${highPriority}</span>
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
        </div>
    `;
}

// --- Upcoming Deadlines (Top 5) ---
function updateUpcomingDeadlines() {
    const ul = document.getElementById('upcomingDeadlines');
    ul.innerHTML = ''; // Clear existing content

    // If no tasks or projects, show empty state
    if (!taskList || taskList.length === 0) {
        ul.innerHTML = `
            <div class="flex flex-col items-center justify-center p-4 text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p class="text-sm">No upcoming deadlines</p>
            </div>
        `;
        return;
    }

    // Get upcoming tasks sorted by due date
    const now = new Date();
    const upcoming = taskList
        .filter(t => t.dueDate && !t.completed && new Date(t.dueDate) >= now)
        .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
        .slice(0, 5); // Top 5 upcoming tasks

    if (upcoming.length === 0) {
        ul.innerHTML = `
            <div class="flex flex-col items-center justify-center p-4 text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <p class="text-sm">All tasks completed!</p>
            </div>
        `;
        return;
    }

    upcoming.forEach(t => {
        const dueDate = new Date(t.dueDate);
        const daysUntilDue = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));
        
        // Determine urgency color
        let urgencyColor = 'text-blue-600';
        if (daysUntilDue <= 3) urgencyColor = 'text-red-600';
        else if (daysUntilDue <= 7) urgencyColor = 'text-yellow-600';

        // Find associated project
        const project = projects.find(p => p._id === t.projectId);

        const li = document.createElement('li');
        li.className = 'flex justify-between items-center p-2 hover:bg-blue-50 rounded-lg transition-colors';
        li.innerHTML = `
            <div class="flex-1 min-w-0">
                <p class="text-sm font-medium ${urgencyColor} truncate">${t.text}</p>
                <p class="text-xs text-gray-500 truncate">
                    ${project ? project.name : 'Unassigned Project'} • 
                    ${daysUntilDue} day${daysUntilDue !== 1 ? 's' : ''} left
                </p>
            </div>
            <span class="text-xs font-medium ${urgencyColor} ml-2">
                ${dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
        `;
        ul.appendChild(li);
    });
}

// --- Most Active Project ---
function updateMostActiveProject() {
    // If no projects or tasks, show empty state
    if (!projects || projects.length === 0 || !taskList || taskList.length === 0) {
        document.getElementById('mostActiveProject').innerHTML = `
            <div class="flex flex-col items-center justify-center p-4 text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
                <p class="text-sm">No active projects</p>
            </div>
        `;
        return;
    }

    // Calculate project task counts
    const projectTaskCounts = {};
    taskList.forEach(t => {
        if (!projectTaskCounts[t.projectId]) projectTaskCounts[t.projectId] = {
            count: 0,
            completedCount: 0
        };
        projectTaskCounts[t.projectId].count++;
        if (t.completed) projectTaskCounts[t.projectId].completedCount++;
    });

    // Find most active project
    let maxProject = null;
    let maxCount = 0;
    for (const projectId in projectTaskCounts) {
        const { count, completedCount } = projectTaskCounts[projectId];
        const completionRate = count > 0 ? (completedCount / count) * 100 : 0;
        
        // Prioritize projects with more tasks and higher completion rate
        const score = count * completionRate;
        if (score > maxCount) {
            maxCount = score;
            maxProject = projects.find(p => p._id === projectId);
        }
    }

    // Update most active project display
    if (maxProject) {
        const { count, completedCount } = projectTaskCounts[maxProject._id];
        const completionRate = count > 0 ? Math.round((completedCount / count) * 100) : 0;

        document.getElementById('mostActiveProject').innerHTML = `
            <div class="flex flex-col">
                <div class="flex justify-between items-center mb-2">
                    <h3 class="text-lg font-bold text-blue-700">${maxProject.name}</h3>
                    <span class="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                        Active
                    </span>
                </div>
                <div class="flex items-center justify-between">
                    <div class="flex-1 mr-4">
                        <div class="w-full bg-blue-100 rounded-full h-2.5 mb-1">
                            <div class="bg-blue-500 h-2.5 rounded-full" style="width: ${completionRate}%"></div>
                        </div>
                        <p class="text-xs text-gray-500">${completedCount}/${count} tasks completed</p>
                    </div>
                    <span class="text-sm font-medium text-blue-600">${completionRate}%</span>
                </div>
            </div>
        `;
    } else {
        document.getElementById('mostActiveProject').innerHTML = `
            <div class="flex flex-col items-center justify-center p-4 text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
                <p class="text-sm">No active projects</p>
            </div>
        `;
    }
}

// --- Average Completion Rate ---
function updateAvgCompletionRate() {
    if (!projects || projects.length === 0 || !taskList || taskList.length === 0) {
        document.getElementById('avgCompletionRate').innerHTML = `
            <div class="flex flex-col items-center justify-center p-4 text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p class="text-sm">No projects to calculate</p>
            </div>
        `;
        return;
    }

    let total = 0, count = 0;
    const projectCompletionDetails = [];

    projects.forEach(p => {
        const projectTasks = taskList.filter(t => t.projectId === p._id);
        if (projectTasks.length === 0) return;

        const completedTasks = projectTasks.filter(t => t.completed).length;
        const progress = Math.round((completedTasks / projectTasks.length) * 100);
        
        total += progress;
        count++;

        // Store project completion details for visualization
        projectCompletionDetails.push({
            name: p.name,
            progress: progress
        });
    });

    const avg = Math.round(total / (count || 1));

    // Determine color and icon based on completion rate
    let colorClass = 'text-green-600';
    let bgColorClass = 'bg-green-50';
    let icon = `
        <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
        </svg>
    `;

    if (avg < 50) {
        colorClass = 'text-red-600';
        bgColorClass = 'bg-red-50';
        icon = `
            <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
        `;
    } else if (avg < 75) {
        colorClass = 'text-yellow-600';
        bgColorClass = 'bg-yellow-50';
        icon = `
            <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        `;
    }

    document.getElementById('avgCompletionRate').innerHTML = `
        <div class="flex items-center justify-between">
            <div class="flex items-center">
                <div class="mr-4 ${bgColorClass} p-3 rounded-full">
                    ${icon}
                </div>
                <div>
                    <h3 class="text-xl font-bold ${colorClass}">${avg}%</h3>
                    <p class="text-xs text-gray-500">Average Completion</p>
                </div>
            </div>
            <div class="flex flex-col items-end">
                ${projectCompletionDetails.slice(0, 3).map(project => `
                    <div class="flex items-center mb-1">
                        <span class="text-xs text-gray-500 mr-2">${project.name}</span>
                        <div class="w-16 h-1 bg-blue-100 rounded-full">
                            <div class="h-1 bg-blue-500 rounded-full" style="width: ${project.progress}%"></div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
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

// --- Enhanced Daily Activity Line Chart Data ---
function getDailyActivityData(days = 30) {
    if (!activityFeedArr || activityFeedArr.length === 0) {
        // Return empty data with proper structure
        const today = new Date();
        const dateLabels = [];
        const activityCounts = [];
        for (let i = days - 1; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(today.getDate() - i);
            const dd = String(d.getDate()).padStart(2, '0');
            const mm = String(d.getMonth() + 1).padStart(2, '0');
            const yy = String(d.getFullYear()).slice(-2);
            dateLabels.push(`${dd}/${mm}/${yy}`);
            activityCounts.push(0);
        }
        return { dateLabels, activityCounts, movingAvg: new Array(days).fill(0) };
    }
    
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
        
        // Count activities for this specific date
        const count = activityFeedArr.filter(a => {
            const atime = new Date(a.time);
            return atime.getDate() === d.getDate() && 
                   atime.getMonth() === d.getMonth() && 
                   atime.getFullYear() === d.getFullYear();
        }).length;
        
        activityCounts.push(count);
    }
    
    // Enhanced 7-day moving average calculation
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
                    grid: { display: false },
                    title: {
                        display: true,
                        text: 'Date',
                        font: { size: 12, weight: 'bold' },
                        color: '#64748b'
                    }
                },
                y: {
                    beginAtZero: true,
                    suggestedMax: Math.max(5, Math.ceil(Math.max(...activityCounts, 0) * 1.2)),
                    ticks: { stepSize: 1, font: { size: 10 } },
                    grid: { color: 'rgba(203,213,225,0.4)' },
                    title: {
                        display: true,
                        text: 'Activities',
                        font: { size: 12, weight: 'bold' },
                        color: '#64748b'
                    }
                }
            },
            layout: { padding: { top: 4, right: 8, bottom: 4, left: 8 } }
        }
    });
}

// --- Task Overview ---
let allTasks = []; // Store all tasks from all projects
let taskOverviewSortAscending = true; // Track sort direction

// Fetch all tasks from all projects
async function fetchAllTasks() {
    if (!projects || projects.length === 0) {
        allTasks = [];
        renderTaskOverview();
        renderProjectOverview();
        return;
    }
    
    try {
        const tasksPromises = projects.map(project => 
            fetch(`/api/tasks/${project._id}`).then(res => res.json()).catch(() => [])
        );
        const tasksArrays = await Promise.all(tasksPromises);
        allTasks = tasksArrays.flat().map(task => ({
            ...task,
            projectName: projects.find(p => p._id === task.projectId)?.name || 'Unknown Project'
        }));
        renderTaskOverview();
        renderProjectOverview(); // Render project overview after fetching tasks
    } catch (err) {
        console.error('Failed to fetch all tasks:', err);
        allTasks = [];
        renderTaskOverview();
        renderProjectOverview();
    }
}

// Render Task Overview Table
function renderTaskOverview() {
    const tbody = document.getElementById('taskOverviewTableBody');
    const emptyState = document.getElementById('taskOverviewEmptyState');
    
    if (!tbody) return;
    
    // Filter by selected project (same as Task Status and Priority Distribution charts)
    let tasksToDisplay = allTasks;
    if (selectedProjectIndex !== null && projects[selectedProjectIndex]) {
        const selectedProjectId = projects[selectedProjectIndex]._id;
        tasksToDisplay = allTasks.filter(task => task.projectId === selectedProjectId);
    }
    
    // Get filter values
    const searchText = (document.getElementById('taskOverviewSearch')?.value || '').toLowerCase();
    const statusFilter = document.getElementById('taskOverviewStatusFilter')?.value || 'all';
    
    // Filter tasks
    let filtered = tasksToDisplay.filter(task => {
        // Search filter
        const matchesSearch = task.text.toLowerCase().includes(searchText);
        
        // Status filter
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const dueDate = task.dueDate ? new Date(task.dueDate) : null;
        if (dueDate) dueDate.setHours(0, 0, 0, 0);
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dayAfterTomorrow = new Date(now);
        dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 7);
        
        let matchesStatus = true;
        if (statusFilter === 'completed') {
            matchesStatus = task.completed === true;
        } else if (statusFilter === 'overdue') {
            matchesStatus = !task.completed && dueDate && dueDate < now;
        } else if (statusFilter === 'dueSoon') {
            matchesStatus = !task.completed && dueDate && dueDate >= now && dueDate <= dayAfterTomorrow;
        } else if (statusFilter === 'upcoming') {
            matchesStatus = !task.completed && dueDate && dueDate > dayAfterTomorrow;
        }
        // 'all' matches everything
        
        return matchesSearch && matchesStatus;
    });
    
    // Clear table
    tbody.innerHTML = '';
    
    if (filtered.length === 0) {
        emptyState?.classList.remove('hidden');
        return;
    }
    
    emptyState?.classList.add('hidden');
    
    // Render tasks
    filtered.forEach(task => {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-blue-50 transition-colors';
        
        // Priority badge colors
        const priorityColors = {
            'High': 'bg-red-100 text-red-700 border-red-200',
            'Medium': 'bg-yellow-100 text-yellow-700 border-yellow-200',
            'Low': 'bg-green-100 text-green-700 border-green-200'
        };
        const priorityClass = priorityColors[task.priority] || 'bg-gray-100 text-gray-700 border-gray-200';
        
        // Category badge
        const categoryClass = 'bg-blue-100 text-blue-700 border-blue-200';
        
        // Status badge
        let statusBadge = '';
        if (task.completed) {
            statusBadge = '<span class="px-3 py-1 rounded-full border bg-green-100 text-green-700 border-green-200 text-sm font-medium">Completed</span>';
        } else {
            const now = new Date();
            now.setHours(0, 0, 0, 0);
            const dueDate = task.dueDate ? new Date(task.dueDate) : null;
            if (dueDate) {
                dueDate.setHours(0, 0, 0, 0);
                if (dueDate < now) {
                    statusBadge = '<span class="px-3 py-1 rounded-full border bg-red-100 text-red-700 border-red-200 text-sm font-medium">Overdue</span>';
                } else if (dueDate.getTime() === now.getTime()) {
                    statusBadge = '<span class="px-3 py-1 rounded-full border bg-yellow-100 text-yellow-700 border-yellow-200 text-sm font-medium">Due Today</span>';
                } else {
                    const daysDiff = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));
                    if (daysDiff <= 7) {
                        statusBadge = `<span class="px-3 py-1 rounded-full border bg-orange-100 text-orange-700 border-orange-200 text-sm font-medium">Due Soon</span>`;
                    } else {
                        statusBadge = '<span class="px-3 py-1 rounded-full border bg-blue-100 text-blue-700 border-blue-200 text-sm font-medium">Upcoming</span>';
                    }
                }
            } else {
                statusBadge = '<span class="px-3 py-1 rounded-full border bg-gray-100 text-gray-700 border-gray-200 text-sm font-medium">No Due Date</span>';
            }
        }
        
        // Format due date
        let dueDateDisplay = '-';
        if (task.dueDate) {
            const date = new Date(task.dueDate);
            dueDateDisplay = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
        }
        
        tr.innerHTML = `
            <td class="p-3 md:p-4 text-blue-700 font-medium text-sm md:text-base">${escapeHtml(task.text)}</td>
            <td class="p-3 md:p-4">
                <span class="px-2 md:px-3 py-1 rounded-full border ${categoryClass} text-xs md:text-sm font-medium whitespace-nowrap">${escapeHtml(task.tag || 'General')}</span>
            </td>
            <td class="p-3 md:p-4">
                <span class="px-2 md:px-3 py-1 rounded-full border ${priorityClass} text-xs md:text-sm font-medium whitespace-nowrap">${escapeHtml(task.priority || 'Low')}</span>
            </td>
            <td class="p-3 md:p-4 text-gray-600 text-sm md:text-base whitespace-nowrap">${dueDateDisplay}</td>
            <td class="p-3 md:p-4">${statusBadge}</td>
        `;
        
        tbody.appendChild(tr);
    });
}

// Helper function to escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Sort tasks by due date
function sortTasksByDueDate() {
    taskOverviewSortAscending = !taskOverviewSortAscending;
    
    allTasks.sort((a, b) => {
        const dateA = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
        const dateB = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
        
        if (taskOverviewSortAscending) {
            return dateA - dateB;
        } else {
            return dateB - dateA;
        }
    });
    
    renderTaskOverview();
    
    // Update button text
    const btn = document.getElementById('sortByDueDateBtn');
    if (btn) {
        const icon = taskOverviewSortAscending ? 
            '<svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path d="M3 6h18M7 12h10M11 18h2" stroke="#fff" stroke-width="2" stroke-linecap="round" /></svg>' :
            '<svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path d="M3 18h18M7 12h10M11 6h2" stroke="#fff" stroke-width="2" stroke-linecap="round" /></svg>';
        btn.innerHTML = icon + (taskOverviewSortAscending ? ' Sort by Due Date (Asc)' : ' Sort by Due Date (Desc)');
    }
}

// Initialize Task Overview event listeners
function initTaskOverview() {
    const searchInput = document.getElementById('taskOverviewSearch');
    const statusFilter = document.getElementById('taskOverviewStatusFilter');
    const sortBtn = document.getElementById('sortByDueDateBtn');
    
    if (searchInput) {
        searchInput.addEventListener('input', () => renderTaskOverview());
    }
    
    if (statusFilter) {
        statusFilter.addEventListener('change', () => renderTaskOverview());
    }
    
    if (sortBtn) {
        sortBtn.addEventListener('click', sortTasksByDueDate);
    }
}

// --- Project Overview Table ---
function renderProjectOverview() {
    const tbody = document.getElementById('projectOverviewTableBody');
    const emptyState = document.getElementById('projectOverviewEmptyState');
    
    if (!tbody) return;
    
    if (!projects || projects.length === 0) {
        tbody.innerHTML = '';
        if (emptyState) emptyState.classList.remove('hidden');
        return;
    }
    
    if (emptyState) emptyState.classList.add('hidden');
    tbody.innerHTML = '';
    
    // Get all tasks for each project
    projects.forEach(project => {
        const projectTasks = allTasks.filter(t => t.projectId === project._id);
        const totalTasks = projectTasks.length;
        const completedTasks = projectTasks.filter(t => t.completed).length;
        const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
        
        // Status badge
        let statusBadge = '';
        if (project.completed) {
            statusBadge = '<span class="px-3 py-1 rounded-full border bg-green-100 text-green-700 border-green-200 text-sm font-medium">Completed</span>';
        } else {
            const now = new Date();
            now.setHours(0, 0, 0, 0);
            const deadline = project.deadline ? new Date(project.deadline) : null;
            if (deadline) {
                deadline.setHours(0, 0, 0, 0);
                if (deadline < now) {
                    statusBadge = '<span class="px-3 py-1 rounded-full border bg-red-100 text-red-700 border-red-200 text-sm font-medium">Overdue</span>';
                } else {
                    statusBadge = '<span class="px-3 py-1 rounded-full border bg-blue-100 text-blue-700 border-blue-200 text-sm font-medium">Active</span>';
                }
            } else {
                statusBadge = '<span class="px-3 py-1 rounded-full border bg-blue-100 text-blue-700 border-blue-200 text-sm font-medium">Active</span>';
            }
        }
        
        // Format deadline
        let deadlineDisplay = '-';
        if (project.deadline) {
            const date = new Date(project.deadline);
            deadlineDisplay = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
        }
        
        // Truncate description
        const desc = project.desc || '';
        const truncatedDesc = desc.length > 50 ? desc.substring(0, 50) + '...' : desc;
        
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-blue-50 transition-colors';
        tr.innerHTML = `
            <td class="p-3 md:p-4 text-blue-700 font-medium text-sm md:text-base">${escapeHtml(project.name)}</td>
            <td class="p-3 md:p-4 text-gray-600 text-sm md:text-base" title="${escapeHtml(project.desc || '')}">${escapeHtml(truncatedDesc || 'No description')}</td>
            <td class="p-3 md:p-4">${statusBadge}</td>
            <td class="p-3 md:p-4 text-gray-600 text-sm md:text-base">
                <span class="font-medium">${completedTasks}/${totalTasks}</span>
                <span class="text-xs text-gray-400 ml-1">tasks</span>
            </td>
            <td class="p-3 md:p-4">
                <div class="flex items-center gap-2">
                    <div class="flex-1 h-2 bg-blue-100 rounded-full overflow-hidden">
                        <div class="h-2 bg-blue-500 rounded-full transition-all" style="width:${progress}%"></div>
                    </div>
                    <span class="text-xs font-medium text-blue-700 w-12 text-right">${progress}%</span>
                </div>
            </td>
            <td class="p-3 md:p-4 text-gray-600 text-sm md:text-base whitespace-nowrap">${deadlineDisplay}</td>
        `;
        
        tbody.appendChild(tr);
    });
}

// --- Monthly Task Completion Bar Chart ---
function updateMonthlyTaskChart() {
    const canvas = document.getElementById('monthlyTaskChart');
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;
    
    // Destroy existing chart if it exists
    if (window.monthlyTaskChart && typeof window.monthlyTaskChart.destroy === 'function') {
        window.monthlyTaskChart.destroy();
    }
    
    // Filter by selected project (same as Task Status and Priority Distribution charts)
    let tasksToProcess = allTasks;
    if (selectedProjectIndex !== null && projects[selectedProjectIndex]) {
        const selectedProjectId = projects[selectedProjectIndex]._id;
        tasksToProcess = allTasks.filter(task => task.projectId === selectedProjectId);
    }
    
    // Calculate completed tasks per month for the last 12 months
    const monthlyData = {};
    const now = new Date();
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Initialize last 12 months
    for (let i = 11; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        monthlyData[monthKey] = {
            label: `${monthNames[date.getMonth()]} ${date.getFullYear()}`,
            count: 0
        };
    }
    
    // Count completed tasks by month based on completion date
    // Use activity feed to get accurate completion dates
    const completionMap = new Map(); // taskId -> completion date
    
    if (activityFeedArr && activityFeedArr.length > 0) {
        // Filter activities by selected project if project is selected
        let activitiesToProcess = activityFeedArr;
        if (selectedProjectIndex !== null && projects[selectedProjectIndex]) {
            const selectedProjectId = projects[selectedProjectIndex]._id;
            const selectedProject = projects[selectedProjectIndex];
            activitiesToProcess = activityFeedArr.filter(activity => {
                const activityMsg = activity.msg || '';
                // Check if activity mentions the selected project name
                if (activityMsg.includes(selectedProject.name)) {
                    return true;
                }
                // For task activities, check if task belongs to selected project
                if (activity.type === 'task') {
                    // Try to match task text from message
                    const taskTextMatch = activityMsg.match(/Task "([^"]+)"/);
                    if (taskTextMatch) {
                        const taskText = taskTextMatch[1];
                        const matchingTask = tasksToProcess.find(t => t.text === taskText);
                        return !!matchingTask;
                    }
                    // If no text match, check by taskId if available
                    const taskIdMatch = activityMsg.match(/Task "([^"]+)" (completed|marked as pending)/);
                    if (taskIdMatch && tasksToProcess.some(t => t._id === taskIdMatch[1])) {
                        return true;
                    }
                }
                return false;
            });
        }
        
        // Process completion activities
        activitiesToProcess.forEach(activity => {
            if (activity.type === 'task' && activity.msg) {
                const activityMsg = activity.msg.toLowerCase();
                // Check if it's a completion event (not pending)
                if (activityMsg.includes('completed') && !activityMsg.includes('pending')) {
                    // Try to extract task text from message
                    const taskTextMatch = activity.msg.match(/Task "([^"]+)"/);
                    if (taskTextMatch) {
                        const taskText = taskTextMatch[1];
                        // Find matching completed task
                        const matchingTask = tasksToProcess.find(t => {
                            // Try exact match first
                            if (t.completed && t.text === taskText && !completionMap.has(t._id)) {
                                return true;
                            }
                            // Try partial match (in case text was truncated)
                            if (t.completed && !completionMap.has(t._id) && 
                                (t.text.includes(taskText) || taskText.includes(t.text))) {
                                return true;
                            }
                            return false;
                        });
                        
                        if (matchingTask) {
                            // Use activity time as completion date
                            completionMap.set(matchingTask._id, new Date(activity.time));
                        }
                    }
                }
            }
        });
    }
    
    // Count completed tasks by month
    tasksToProcess.forEach(task => {
        if (task.completed) {
            let taskDate;
            if (completionMap.has(task._id)) {
                taskDate = completionMap.get(task._id);
            } else if (task.created) {
                // Fallback to created date if no completion date found in activity feed
                taskDate = new Date(task.created);
            } else {
                return; // Skip if no date available
            }
            
            const monthKey = `${taskDate.getFullYear()}-${String(taskDate.getMonth() + 1).padStart(2, '0')}`;
            if (monthlyData[monthKey]) {
                monthlyData[monthKey].count++;
            }
        }
    });
    
    const labels = Object.values(monthlyData).map(m => m.label);
    const data = Object.values(monthlyData).map(m => m.count);
    
    // Create gradient for bars
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height || 300);
    gradient.addColorStop(0, 'rgba(59, 130, 246, 0.8)');
    gradient.addColorStop(1, 'rgba(59, 130, 246, 0.4)');
    
    window.monthlyTaskChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Completed Tasks',
                data: data,
                backgroundColor: gradient,
                borderColor: '#3b82f6',
                borderWidth: 2,
                borderRadius: 6,
                borderSkipped: false,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(59, 130, 246, 0.9)',
                    padding: 10,
                    titleFont: { size: 14, weight: 'bold' },
                    bodyFont: { size: 13 },
                    callbacks: {
                        label: function(context) {
                            return `Completed: ${context.parsed.y} task${context.parsed.y !== 1 ? 's' : ''}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        font: { size: 11 },
                        color: '#64748b',
                        maxRotation: 45,
                        minRotation: 45
                    },
                    title: {
                        display: true,
                        text: 'Month',
                        font: { size: 12, weight: 'bold' },
                        color: '#64748b'
                    }
                },
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1,
                        font: { size: 11 },
                        color: '#64748b',
                        precision: 0
                    },
                    grid: {
                        color: 'rgba(203, 213, 225, 0.3)'
                    },
                    title: {
                        display: true,
                        text: 'Number of Completed Tasks',
                        font: { size: 12, weight: 'bold' },
                        color: '#64748b'
                    }
                }
            },
            animation: {
                duration: 800,
                easing: 'easeOutQuart'
            }
        }
    });
}

// --- Enhanced Daily Activity Line Chart with Navigation ---
let lineChartDaysOffset = 0; // Track navigation offset (0 = current period, negative = past)
let lineChartDaysRange = 30; // Number of days to show

// Enhanced function to get daily activity data with offset
function getDailyActivityDataWithOffset(days = 30, offsetDays = 0) {
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - days - offsetDays);
    const endDate = new Date(today);
    endDate.setDate(today.getDate() - offsetDays);
    
    // Filter activities by selected project (same as Task Status and Priority Distribution charts)
    let activitiesToProcess = activityFeedArr || [];
    if (selectedProjectIndex !== null && projects[selectedProjectIndex]) {
        const selectedProjectId = projects[selectedProjectIndex]._id;
        const selectedProject = projects[selectedProjectIndex];
        activitiesToProcess = (activityFeedArr || []).filter(activity => {
            const activityMsg = activity.msg || '';
            // Check if activity mentions the selected project name
            if (activityMsg.includes(selectedProject.name)) {
                return true;
            }
            // For task activities, check if task belongs to selected project
            if (activity.type === 'task' || activity.type === 'complete' || activity.type === 'update') {
                // Try to match task text from message
                const taskTextMatch = activityMsg.match(/Task "([^"]+)"/);
                if (taskTextMatch) {
                    const taskText = taskTextMatch[1];
                    const matchingTask = allTasks.find(t => {
                        // Exact match
                        if (t.text === taskText && t.projectId === selectedProjectId) {
                            return true;
                        }
                        // Partial match for truncated text
                        if (t.projectId === selectedProjectId && 
                            (t.text.includes(taskText) || taskText.includes(t.text))) {
                            return true;
                        }
                        return false;
                    });
                    return !!matchingTask;
                }
                // Check if activity mentions project name in other ways
                if (activityMsg.includes(selectedProject.name)) {
                    return true;
                }
            }
            // For project activities, check project name
            if (activity.type === 'project' || activity.type === 'complete') {
                if (activityMsg.includes(selectedProject.name)) {
                    return true;
                }
            }
            return false;
        });
    }
    
    const dateLabels = [];
    const activityCounts = [];
    
    for (let i = 0; i < days; i++) {
        const d = new Date(startDate);
        d.setDate(startDate.getDate() + i);
        const dd = String(d.getDate()).padStart(2, '0');
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const yy = String(d.getFullYear()).slice(-2);
        const label = `${dd}/${mm}/${yy}`;
        dateLabels.push(label);
        
        // Count activities for this specific date
        let count = 0;
        if (activitiesToProcess.length > 0) {
            count = activitiesToProcess.filter(a => {
                const atime = new Date(a.time);
                return atime.getDate() === d.getDate() && 
                       atime.getMonth() === d.getMonth() && 
                       atime.getFullYear() === d.getFullYear();
            }).length;
        }
        
        activityCounts.push(count);
    }
    
    // Enhanced 7-day moving average calculation
    const windowSize = 7;
    const movingAvg = activityCounts.map((_, idx, arr) => {
        const start = Math.max(0, idx - windowSize + 1);
        const slice = arr.slice(start, idx + 1);
        const sum = slice.reduce((s, v) => s + v, 0);
        return Number((sum / slice.length).toFixed(2));
    });
    
    // Format date range for label
    const startLabel = startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const endLabel = endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    
    return { 
        dateLabels, 
        activityCounts, 
        movingAvg,
        dateRange: `${startLabel} - ${endLabel}`
    };
}

// Update date range label
function updateDateRangeLabel() {
    const labelEl = document.getElementById('dateRangeLabel');
    if (!labelEl) return;
    
    const { dateRange } = getDailyActivityDataWithOffset(lineChartDaysRange, lineChartDaysOffset);
    labelEl.textContent = dateRange;
    
    // Disable next button if we're at current period
    const nextBtn = document.getElementById('nextDateRangeBtn');
    if (nextBtn) {
        if (lineChartDaysOffset === 0) {
            nextBtn.disabled = true;
            nextBtn.classList.add('opacity-50', 'cursor-not-allowed');
        } else {
            nextBtn.disabled = false;
            nextBtn.classList.remove('opacity-50', 'cursor-not-allowed');
        }
    }
}

// Enhanced Line Chart Render with Navigation
function updateLineChart() {
    let chartData;
    
    // If a project is selected, use project-specific data
    if (selectedProjectIndex !== null && projects[selectedProjectIndex]) {
        const selectedProjectId = projects[selectedProjectIndex]._id;
        chartData = getProjectDailyTaskCompletionData(selectedProjectId, lineChartDaysRange, lineChartDaysOffset);
    } else {
        // Fallback to overall activity data if no project is selected
        chartData = getDailyActivityDataWithOffset(lineChartDaysRange, lineChartDaysOffset);
    }
    
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
            labels: chartData.dateLabels,
            datasets: [
                {
                    label: selectedProjectIndex !== null ? 
                        `Task Completion - ${projects[selectedProjectIndex].name}` : 
                        'Daily Activity',
                    data: chartData.taskCompletionCounts || chartData.activityCounts,
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
                    data: chartData.movingAvg,
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
                    grid: { display: false },
                    title: {
                        display: true,
                        text: 'Date',
                        font: { size: 12, weight: 'bold' },
                        color: '#64748b'
                    }
                },
                y: {
                    beginAtZero: true,
                    suggestedMax: Math.max(5, Math.ceil(Math.max(...(chartData.taskCompletionCounts || chartData.activityCounts), 0) * 1.2)),
                    ticks: { stepSize: 1, font: { size: 10 } },
                    grid: { color: 'rgba(203,213,225,0.4)' },
                    title: {
                        display: true,
                        text: selectedProjectIndex !== null ? 'Completed Tasks' : 'Activities',
                        font: { size: 12, weight: 'bold' },
                        color: '#64748b'
                    }
                }
            },
            layout: { padding: { top: 4, right: 8, bottom: 4, left: 8 } }
        }
    });
    
    updateDateRangeLabel();
}

// Navigation functions for Daily Activity Chart
function navigateDailyChart(direction) {
    if (direction === 'prev') {
        lineChartDaysOffset += lineChartDaysRange;
    } else if (direction === 'next') {
        lineChartDaysOffset = Math.max(0, lineChartDaysOffset - lineChartDaysRange);
    }
    updateLineChart();
}

// Initialize Daily Activity Chart Navigation
function initDailyChartNavigation() {
    const prevBtn = document.getElementById('prevDateRangeBtn');
    const nextBtn = document.getElementById('nextDateRangeBtn');
    
    if (prevBtn) {
        prevBtn.addEventListener('click', () => navigateDailyChart('prev'));
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', () => navigateDailyChart('next'));
    }
    
    updateDateRangeLabel();
}

// --- Project-Specific Daily Task Completion Line Chart ---
function getProjectDailyTaskCompletionData(projectId, days = 30, offsetDays = 0) {
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - days - offsetDays);
    const endDate = new Date(today);
    endDate.setDate(today.getDate() - offsetDays);
    
    // Filter tasks for the specific project
    const projectTasks = allTasks.filter(task => task.projectId === projectId);
    
    const dateLabels = [];
    const taskCompletionCounts = [];
    
    for (let i = 0; i < days; i++) {
        const d = new Date(startDate);
        d.setDate(startDate.getDate() + i);
        const dd = String(d.getDate()).padStart(2, '0');
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const yy = String(d.getFullYear()).slice(-2);
        const label = `${dd}/${mm}/${yy}`;
        dateLabels.push(label);
        
        // Count completed tasks for this specific date
        const completedTasksOnDate = projectTasks.filter(task => {
            if (!task.completed) return false;
            
            // Check if task was completed on this date
            const completionDate = new Date(task.completedAt || task.created);
            return completionDate.getDate() === d.getDate() && 
                   completionDate.getMonth() === d.getMonth() && 
                   completionDate.getFullYear() === d.getFullYear();
        }).length;
        
        taskCompletionCounts.push(completedTasksOnDate);
    }
    
    // 7-day moving average calculation
    const windowSize = 7;
    const movingAvg = taskCompletionCounts.map((_, idx, arr) => {
        const start = Math.max(0, idx - windowSize + 1);
        const slice = arr.slice(start, idx + 1);
        const sum = slice.reduce((s, v) => s + v, 0);
        return Number((sum / slice.length).toFixed(2));
    });
    
    // Format date range for label
    const startLabel = startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const endLabel = endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    
    return { 
        dateLabels, 
        taskCompletionCounts, 
        movingAvg,
        dateRange: `${startLabel} - ${endLabel}`
    };
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
        
        // Update charts that depend on tasks and activities
        // Fetch all tasks first, then update dependent charts
        fetchAllTasks().then(() => {
            // After tasks are fetched, update all dependent charts
            renderProjectOverview(); // Render project overview table
            updateMonthlyTaskChart(); // Update monthly task chart with latest completion data
            updateLineChart(); // Update daily activity chart with latest activities
        }).catch(() => {
            // Still try to update even if fetch fails
            renderProjectOverview();
            updateMonthlyTaskChart();
            updateLineChart();
        });
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
window.fetchAllTasks = fetchAllTasks;
window.renderTaskOverview = renderTaskOverview;
window.renderProjectOverview = renderProjectOverview;
window.updateMonthlyTaskChart = updateMonthlyTaskChart;
window.initTaskOverview = initTaskOverview;
window.initDailyChartNavigation = initDailyChartNavigation;
window.getProjectDailyTaskCompletionData = getProjectDailyTaskCompletionData;

// Initialize Task Overview and Daily Chart Navigation on DOMContentLoaded
document.addEventListener('DOMContentLoaded', function() {
    // Wait for initial data to load (projects, tasks, activity feed)
    setTimeout(() => {
        initTaskOverview();
        initDailyChartNavigation();
        
        // Fetch all tasks and update charts after projects are loaded
        if (projects && projects.length > 0) {
            fetchAllTasks().then(() => {
                // Update charts after tasks are fetched
                updateMonthlyTaskChart();
                updateLineChart();
            }).catch(() => {
                // Still update charts even if fetch fails
                updateMonthlyTaskChart();
                updateLineChart();
            });
        } else {
            // Still update charts even if no projects
            updateMonthlyTaskChart();
            updateLineChart();
        }
    }, 1000);
}); 