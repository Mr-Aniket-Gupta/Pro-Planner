// Data
let projects = [];
let selectedProjectIndex = null;
let taskList = [];
let sidebarTodos = [];
let sidebarNotes = '';
let activityFeedArr = [];

// ===== Calendar variable global define करो =====
let calendar = null;

// ======= AI Bot Functionality =======
let isRecording = false;
let recognition = null;

// ======= Settings Variables =======
let userEmails = [];

// ======= OTP Modal Variables =======
let currentOtpEmail = '';
let otpTimerInterval = null;
let otpTimeLeft = 120; // 2 min = 120 sec

// Project List Render
function renderProjectList() {
    const projectListEl = document.getElementById('projectList');
    projectListEl.innerHTML = '';
    if (projects.length === 0) {
        document.getElementById('emptyProjectState').style.display = '';
    } else {
        document.getElementById('emptyProjectState').style.display = 'none';
        projects.forEach((project, idx) => {
            const li = document.createElement('li');
            li.className = 'flex items-center justify-between bg-blue-50 rounded-xl px-4 py-2 hover:bg-blue-100 cursor-pointer transition';
            li.innerHTML = `
                <span class="font-semibold text-blue-700">${project.name}</span>
                <div class="flex gap-2">
                  <button onclick="selectProjectById('${project._id}')" class="ml-2 text-blue-400 hover:text-blue-600" title="Select"><svg width="18" height="18" fill="none" viewBox="0 0 18 18"><circle cx="9" cy="9" r="8" stroke="#3B82F6" stroke-width="1.5"/><path d="M6 9l2 2 4-4" stroke="#3B82F6" stroke-width="1.5" stroke-linecap="round"/></svg></button>
                  <button onclick="deleteProject(${idx})" class="ml-2 text-red-400 hover:text-red-600" title="Delete">
                    <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
                      <rect x="5" y="7" width="14" height="12" rx="2" stroke="#ef4444" stroke-width="2"/>
                      <path d="M10 11v4M14 11v4" stroke="#ef4444" stroke-width="2" stroke-linecap="round"/>
                      <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" stroke="#ef4444" stroke-width="2"/>
                    </svg>
                  </button>
                </div>`;
            projectListEl.appendChild(li);
        });
    }
}

// Project Details Render
function renderProjectDetails() {
    if (selectedProjectIndex === null || !projects[selectedProjectIndex]) {
        const detailsCard = document.getElementById('projectDetailsCard');
        const mainTaskDashboard = document.getElementById('mainTaskDashboard');
        const selectProjectMsg = document.getElementById('selectProjectMsg');
        if (detailsCard) detailsCard.style.display = 'none';
        if (mainTaskDashboard) mainTaskDashboard.style.display = 'none';
        if (selectProjectMsg) selectProjectMsg.style.display = '';
        if (calendar && typeof calendar.destroy === 'function') { calendar.destroy(); calendar = null; }
        return;
    }
    const project = projects[selectedProjectIndex];
    const detailsCard = document.getElementById('projectDetailsCard');
    const mainTaskDashboard = document.getElementById('mainTaskDashboard');
    const selectProjectMsg = document.getElementById('selectProjectMsg');
    if (detailsCard) detailsCard.style.display = '';
    if (mainTaskDashboard) mainTaskDashboard.style.display = '';
    if (selectProjectMsg) selectProjectMsg.style.display = 'none';
    const projectTitle = document.getElementById('projectTitle');
    if (projectTitle) projectTitle.innerHTML = project.name + (project.completed ? ' <span class="ml-2 px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold">Completed</span>' : '');
    const projectDesc = document.getElementById('projectDesc');
    if (projectDesc) projectDesc.innerText = project.desc;
    const projectBasic = document.getElementById('projectBasic');
    if (projectBasic) projectBasic.innerHTML = '<b>Basic:</b> ' + (Array.isArray(project.basic) ? '<ul class="list-disc ml-5">' + project.basic.map(b => `<li>${b}</li>`).join('') + '</ul>' : project.basic || '-');
    const projectAdvanced = document.getElementById('projectAdvanced');
    if (projectAdvanced) projectAdvanced.innerHTML = '<b>Advanced:</b> ' + (Array.isArray(project.advanced) ? '<ul class="list-disc ml-5">' + project.advanced.map(a => `<li>${a}</li>`).join('') + '</ul>' : project.advanced || '-');
    const dashboardProjectName = document.getElementById('dashboardProjectName');
    if (dashboardProjectName) dashboardProjectName.innerText = project.name;
    const dashboardProjectChip = document.getElementById('dashboardProjectChip');
    if (dashboardProjectChip) dashboardProjectChip.title = project.created ? 'Created: ' + new Date(project.created).toLocaleDateString() : '';
    // Progress Bar
    const progress = getProjectProgress(project._id);
    const projectProgressPercent = document.getElementById('projectProgressPercent');
    if (projectProgressPercent) projectProgressPercent.innerText = progress + '%';
    const projectProgressBar = document.getElementById('projectProgressBar');
    if (projectProgressBar) projectProgressBar.style.width = progress + '%';
    // Deadline
    const projectDeadline = document.getElementById('projectDeadline');
    if (projectDeadline) projectDeadline.value = project.deadline ? new Date(project.deadline).toISOString().split('T')[0] : '';
    // Quick Notes
    const projectQuickNotes = document.getElementById('projectQuickNotes');
    if (projectQuickNotes) {
        projectQuickNotes.value = project.notes || '';
        projectQuickNotes.style.height = 'auto';
        projectQuickNotes.style.height = (projectQuickNotes.scrollHeight) + 'px';
    }
    // Mark as Complete/Incomplete Button Toggle
    const markCompleteBtn = document.getElementById('markCompleteBtn');
    const markIncompleteBtn = document.getElementById('markIncompleteBtn');
    if (project.completed) {
        if (markCompleteBtn) markCompleteBtn.style.display = 'none';
        if (markIncompleteBtn) markIncompleteBtn.style.display = '';
    } else {
        if (markCompleteBtn) markCompleteBtn.style.display = '';
        if (markIncompleteBtn) markIncompleteBtn.style.display = 'none';
    }
    // Calendar/Chart re-render (reliable)
    requestAnimationFrame(() => {
        updateChart();
    });
}

// Project Modal
function showProjectForm(edit = false) {
    document.getElementById('projectModal').classList.remove('hidden');
    document.getElementById('projectModalTitle').innerText = edit ? 'Edit Project' : 'Add Project';
    const basicDiv = document.getElementById('basicInputs');
    const advDiv = document.getElementById('advancedInputs');
    basicDiv.innerHTML = '';
    advDiv.innerHTML = '';
    if (edit && selectedProjectIndex !== null) {
        const p = projects[selectedProjectIndex];
        document.getElementById('projectName').value = p.name;
        document.getElementById('projectDescInput').value = p.desc;
        (Array.isArray(p.basic) ? p.basic : [p.basic]).filter(Boolean).forEach(val => addBasicInput(val));
        (Array.isArray(p.advanced) ? p.advanced : [p.advanced]).filter(Boolean).forEach(val => addAdvancedInput(val));
    } else {
        document.getElementById('projectFormEl').reset();
        addBasicInput();
        addAdvancedInput();
    }
}

function closeProjectForm() {
    document.getElementById('projectModal').classList.add('hidden');
}

function editProject() {
    showProjectForm(true);
}
// add project to database
document.getElementById('projectFormEl').addEventListener('submit', async function (e) {
    e.preventDefault();
    const name = document.getElementById('projectName').value;
    const desc = document.getElementById('projectDescInput').value;
    const basic = Array.from(document.querySelectorAll('.basic-input')).map(i => i.value).filter(Boolean);
    const advanced = Array.from(document.querySelectorAll('.advanced-input')).map(i => i.value).filter(Boolean);
    if (document.getElementById('projectModalTitle').innerText === 'Edit Project' && selectedProjectIndex !== null) {
        // Edit (API call)
        const projectId = projects[selectedProjectIndex]._id;
        try {
            const res = await fetch(`/api/projects/${projectId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, desc, basic, advanced })
            });
            if (!res.ok) throw new Error('Project update failed');
            showAlert({ icon: 'success', title: 'Success', text: 'Project updated!' });
        } catch (err) {
            showAlert({ icon: 'error', title: 'Error', text: 'Failed to update project!' });
        }
    } else {
        await addProject({ name, desc, basic, advanced });
    }
    await fetchProjects();
    closeProjectForm();
});

// Project select/update par default tasks fetch ho (pehle jaisa)
function origSelectProject(idx) {
    selectedProjectIndex = idx;
    renderProjectDetails();
    fetchTasks(projects[selectedProjectIndex]._id);
}

// Task List Render
function renderTasks(filter = '', tag = '') {
    const taskUl = document.getElementById('taskList');
    taskUl.innerHTML = '';
    let filtered = taskList.filter(task =>
        (selectedProjectIndex === null || task.projectId === projects[selectedProjectIndex]?._id) &&
        task.text.toLowerCase().includes(filter ? filter.toLowerCase() : '') &&
        (tag === '' || task.tag === tag)
    );
    if (filtered.length === 0) {
        document.getElementById('emptyTaskState').style.display = '';
    } else {
        document.getElementById('emptyTaskState').style.display = 'none';
    }
    filtered.forEach((task, index) => {
        const li = document.createElement('li');
        li.className = 'flex items-center justify-between bg-blue-50 rounded-xl px-4 py-2 shadow-sm';
        li.innerHTML = `
            <div class="flex items-center gap-2">
              <input type="checkbox" ${task.completed ? 'checked' : ''} onchange="toggleTask(${index})" class="accent-blue-500">
              <span class="${task.completed ? 'line-through text-gray-400' : 'text-gray-700 font-medium'}">${task.text}</span>
              <span class="text-xs text-blue-400 ml-2">[${task.tag}]</span>
            </div>
            <div class="flex gap-2">
              <button onclick="editTask(${index})" class="text-yellow-400 hover:text-yellow-500 transition rounded-lg px-2" title="Edit">✏️</button>
              <button onclick="deleteTask(${index})" class="text-red-400 hover:text-red-500 transition rounded-lg px-2" title="Delete">✖</button>
            </div>
          `;
        taskUl.appendChild(li);
    });
    updateDashboard();
    // Progress bar update
    if (selectedProjectIndex !== null && projects[selectedProjectIndex]) {
        const progress = getProjectProgress(projects[selectedProjectIndex]._id);
        document.getElementById('projectProgressPercent').innerText = progress + '%';
        document.getElementById('projectProgressBar').style.width = progress + '%';
    }
}
// Add task
async function addTask() {
    const input = document.getElementById('taskInput');
    const tag = document.getElementById('taskTag').value;
    const priority = document.getElementById('taskPriority').value;
    // Due date input
    let dueDate = '';
    if (document.getElementById('taskDueDate')) dueDate = document.getElementById('taskDueDate').value;
    if (input.value.trim() && selectedProjectIndex !== null) {
        await addTaskToDB({ text: input.value.trim(), tag, projectId: projects[selectedProjectIndex]._id, dueDate, priority });
        input.value = '';
        if (document.getElementById('taskDueDate')) document.getElementById('taskDueDate').value = '';
    }
}
async function toggleTask(index) {
    const task = taskList[index];
    await updateTaskInDB(task._id, { completed: !task.completed }, task.projectId);
}
async function deleteTask(index) {
    const task = taskList[index];
    await deleteTaskFromDB(task._id, task.projectId);
}
async function editTask(index) {
    const task = taskList[index];
    Swal.fire({
        title: 'Edit Task',
        html: `<input id="swalTaskText" class="swal2-input" value="${task.text}">
                 <select id="swalTaskTag" class="swal2-input">
                   <option value="General" ${task.tag === 'General' ? 'selected' : ''}>General</option>
                   <option value="Frontend" ${task.tag === 'Frontend' ? 'selected' : ''}>Frontend</option>
                   <option value="Backend" ${task.tag === 'Backend' ? 'selected' : ''}>Backend</option>
                   <option value="Bug" ${task.tag === 'Bug' ? 'selected' : ''}>Bug</option>
                 </select>
                 <select id="swalTaskPriority" class="swal2-input">
                   <option value="Low" ${task.priority === 'Low' ? 'selected' : ''}>Low Priority</option>
                   <option value="Medium" ${task.priority === 'Medium' ? 'selected' : ''}>Medium Priority</option>
                   <option value="High" ${task.priority === 'High' ? 'selected' : ''}>High Priority</option>
                 </select>
                 <input id="swalTaskDueDate" type="date" class="swal2-input" value="${task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : ''}">`,
        focusConfirm: false,
        preConfirm: () => {
            return {
                text: document.getElementById('swalTaskText').value,
                tag: document.getElementById('swalTaskTag').value,
                priority: document.getElementById('swalTaskPriority').value,
                dueDate: document.getElementById('swalTaskDueDate').value
            }
        }
    }).then(async result => {
        if (result.isConfirmed) {
            await updateTaskInDB(task._id, { text: result.value.text, tag: result.value.tag, priority: result.value.priority, dueDate: result.value.dueDate }, task.projectId);
        }
    });
}
function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(taskList));
}
function updateDashboard() {
    const filtered = taskList.filter(task => selectedProjectIndex === null || task.projectId === projects[selectedProjectIndex]?.projectId);
    const totalTasksEl = document.getElementById('totalTasks');
    const completedTasksEl = document.getElementById('completedTasks');
    const pendingTasksEl = document.getElementById('pendingTasks');
    const progressPercentEl = document.getElementById('progressPercent');
    const ring = document.getElementById('progressRing');
    if (totalTasksEl) totalTasksEl.innerText = `Total: ${filtered.length}`;
    if (completedTasksEl) completedTasksEl.innerText = `Done: ${filtered.filter(t => t.completed).length}`;
    if (pendingTasksEl) pendingTasksEl.innerText = `Pending: ${filtered.filter(t => !t.completed).length}`;
    // Progress Ring
    const total = filtered.length;
    const done = filtered.filter(t => t.completed).length;
    const percent = total ? Math.round((done / total) * 100) : 0;
    if (progressPercentEl) progressPercentEl.innerText = percent + '%';
    if (ring) {
        const circleLen = 2 * Math.PI * 50;
        ring.setAttribute('stroke-dasharray', circleLen);
        ring.setAttribute('stroke-dashoffset', circleLen - (circleLen * percent / 100));
        ring.style.transition = 'stroke-dashoffset 0.6s cubic-bezier(.4,2,.6,1)';
    }
}
function updateChart() {
    const filtered = taskList.filter(task => selectedProjectIndex === null || task.projectId === projects[selectedProjectIndex]?.projectId);
    const completedData = {};
    const pendingData = {};
    filtered.forEach(task => {
        const date = new Date(task.created).toLocaleDateString();
        if (!completedData[date]) completedData[date] = 0;
        if (!pendingData[date]) pendingData[date] = 0;
        if (task.completed) completedData[date]++;
        else pendingData[date]++;
    });
    const labels = Object.keys(completedData);
    const completed = labels.map(label => completedData[label]);
    const pending = labels.map(label => pendingData[label]);
    const chartCanvas = document.getElementById('taskChart');
    if (!chartCanvas) return;
    const ctx = chartCanvas.getContext('2d');
}
document.getElementById('taskSearch').addEventListener('input', function () {
    renderTasks(this.value, document.getElementById('taskTagFilter').value);
});
document.getElementById('taskTagFilter').addEventListener('change', function () {
    renderTasks(document.getElementById('taskSearch').value, this.value);
});
// Calendar
function renderCalendar() {
    if (calendar && typeof calendar.destroy === 'function') { calendar.destroy(); calendar = null; }
    const calendarEl = document.getElementById('calendar');
    if (!calendarEl) return;
    // Calendar focus on click
    calendarEl.addEventListener('click', function () {
        document.getElementById('calendarContainer').focus();
    });
    const filtered = taskList.filter(task => selectedProjectIndex === null || task.projectId === projects[selectedProjectIndex]?._id);
    const events = filtered.map(task => ({
        title: task.text,
        start: new Date(task.created).toISOString().split('T')[0]
    }));
    calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        events
    });
    calendar.render();
}
document.addEventListener('DOMContentLoaded', async function () {
    await fetchProjects();
    updateSummaryCards();
    if (projects.length > 0) {
        selectedProjectIndex = 0;
        renderProjectDetails();
        await fetchTasks(projects[0]._id);
    } else {
        renderProjectList();
        const origSelectProject = selectProject;
        renderProjectDetails();
        document.getElementById('mainTaskDashboard').style.display = 'none';
        document.getElementById('selectProjectMsg').style.display = '';
        renderTasks();
        renderCalendar();
    }
    fetchUserData();
});

// Add More for Basic/Advanced
function addBasicInput(val = '') {
    const div = document.createElement('div');
    div.className = 'flex gap-2';
    div.innerHTML = `<input type="text" class="w-full border border-blue-100 p-3 rounded-xl bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-200 basic-input" placeholder="Basic Requirement" value="${val}"><button type="button" onclick="this.parentNode.remove()" class="text-red-400 hover:text-red-600 px-2">✖</button>`;
    document.getElementById('basicInputs').appendChild(div);
}
function addAdvancedInput(val = '') {
    const div = document.createElement('div');
    div.className = 'flex gap-2';
    div.innerHTML = `<input type="text" class="w-full border border-blue-100 p-3 rounded-xl bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-200 advanced-input" placeholder="Advanced Feature" value="${val}"><button type="button" onclick="this.parentNode.remove()" class="text-red-400 hover:text-red-600 px-2">✖</button>`;
    document.getElementById('advancedInputs').appendChild(div);
}
// Helper for modern alert
function showAlert({ icon = 'success', title = '', text = '', color = '#2563eb', bg = '#f0f6ff' }) {
    Swal.fire({ icon, title, text, background: bg, color, confirmButtonColor: '#2563eb' });
}
// Logout पर Swal
function logoutUser() {
    Swal.fire({
        title: 'Logout',
        text: 'Are you sure you want to logout?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#2563eb',
        cancelButtonColor: '#d1d5db',
        confirmButtonText: 'Yes, logout',
        background: '#f0f6ff',
        color: '#2563eb'
    }).then((result) => {
        if (result.isConfirmed) {
            localStorage.removeItem('proplanner_token');
            window.location.href = '/logout';
        }
    });
}

// ======= Dark Theme Toggle =======
const themeToggleBtn = document.getElementById('themeToggleBtn');
const moonIcon = document.getElementById('moonIcon');
const sunIcon = document.getElementById('sunIcon');

// save theme in localStorage 
function setTheme(isDark) {
    if (isDark) {
        document.body.classList.add('dark-theme');
        moonIcon.style.display = 'none';
        sunIcon.style.display = 'block';
        localStorage.setItem('theme', 'dark');
    } else {
        document.body.classList.remove('dark-theme');
        moonIcon.style.display = 'block';
        sunIcon.style.display = 'none';
        localStorage.setItem('theme', 'light');
    }
}

// theme toggle button
if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', function () {
        const isDark = !document.body.classList.contains('dark-theme');
        setTheme(isDark);
    });
}

// पेज लोड पर थीम सेट करें
window.addEventListener('DOMContentLoaded', function () {
    const savedTheme = localStorage.getItem('theme');
    setTheme(savedTheme === 'dark');
});

// ===== Sidebar Todo List (DB Version, alerts added) =====

async function fetchUserData() {
    try {
        const res = await fetch('/api/userdata');
        if (!res.ok) throw new Error('Failed to fetch user data');
        const data = await res.json();
        sidebarTodos = data.todos || [];
        sidebarNotes = data.notes || '';
        renderSidebarTodos();
        loadSidebarNotes();
    } catch (err) {
        alert('Failed to load user data!');
        console.error(err);
    }
}

// ======= Sidebar Todos =======
function renderSidebarTodos() {
    const ul = document.getElementById('sidebarTodoList');
    ul.innerHTML = '';
    sidebarTodos.forEach((todo, idx) => {
        const li = document.createElement('li');
        li.className = 'flex items-center justify-between bg-blue-50 rounded-xl px-3 py-2';
        li.innerHTML = `<span class="${todo.done ? 'line-through text-gray-400' : 'text-gray-700 font-medium'}">${todo.text}</span>
      <div class="flex gap-2">
        <button onclick="toggleSidebarTodo(${idx})" class="text-green-500 hover:text-green-700" title="Done">✔</button>
        <button onclick="deleteSidebarTodo(${idx})" class="text-red-400 hover:text-red-600" title="Delete">✖</button>
      </div>`;
        ul.appendChild(li);
    });
}

function loadSidebarNotes() {
    document.getElementById('sidebarNotes').value = sidebarNotes;
}

async function addSidebarTodo() {
    const input = document.getElementById('sidebarTodoInput');
    const val = input.value.trim();
    if (!val) return;
    sidebarTodos.push({ text: val, done: false });
    addActivityFeed('Todo added: ' + val);
    await saveSidebarTodos('add');
    input.value = '';
    renderSidebarTodos();
}
async function toggleSidebarTodo(idx) {
    sidebarTodos[idx].done = !sidebarTodos[idx].done;
    addActivityFeed('Todo updated: ' + sidebarTodos[idx].text);
    await saveSidebarTodos('update');
    renderSidebarTodos();
}
async function deleteSidebarTodo(idx) {
    addActivityFeed('Todo deleted: ' + sidebarTodos[idx].text);
    sidebarTodos.splice(idx, 1);
    await saveSidebarTodos('delete');
    renderSidebarTodos();
}
async function saveSidebarTodos(action) {
    try {
        await fetch('/api/userdata/todos', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ todos: sidebarTodos })
        });
        if (action === 'add') showAlert({ icon: 'success', title: 'Success', text: 'Todo added!' });
        if (action === 'delete') showAlert({ icon: 'success', title: 'Success', text: 'Todo deleted!' });
        if (action === 'update') showAlert({ icon: 'success', title: 'Success', text: 'Todo updated!' });
    } catch (err) {
        showAlert({ icon: 'error', title: 'Error', text: 'Failed to save todos!' });
    }
}
// ===== Sidebar Notes (DB Version, alerts added) =====
function loadSidebarNotes() {
    document.getElementById('sidebarNotes').value = sidebarNotes;
}
async function saveSidebarNotes() {
    sidebarNotes = document.getElementById('sidebarNotes').value;
    try {
        await fetch('/api/userdata/notes', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ notes: sidebarNotes })
        });
        showAlert({ icon: 'success', title: 'Success', text: 'Notes saved!' });
    } catch (err) {
        showAlert({ icon: 'error', title: 'Error', text: 'Failed to save notes!' });
    }
}
// ===== Init Sidebar on Load (DB Version) =====
document.addEventListener('DOMContentLoaded', function () {
    fetchUserData();
});

// Projects API
async function fetchProjects() {
    try {
        const res = await fetch('/api/projects');
        if (!res.ok) throw new Error('Failed to load projects!');
        projects = await res.json();
        renderProjectList();
        addActivityFeed('Projects loaded');
    } catch (err) {
        showAlert({ icon: 'error', title: 'Error', text: 'Failed to load projects!' });
    }
}
async function addProject(project) {
    try {
        const res = await fetch('/api/projects', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(project)
        });
        if (!res.ok) throw new Error('Project add failed');
        showAlert({ icon: 'success', title: 'Success', text: 'Project added!' });
        addActivityFeed('Project added: ' + project.name);
        await fetchProjects();
    } catch (err) {
        showAlert({ icon: 'error', title: 'Error', text: 'Failed to add project!' });
    }
}
// Project update (edit)
async function updateProject(projectId, data) {
    try {
        const res = await fetch(`/api/projects/${projectId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error('Project update failed');
        addActivityFeed('Project updated: ' + (data.name || projectId));
        await fetchProjects();
    } catch (err) {
        showAlert({ icon: 'error', title: 'Error', text: 'Failed to update project!' });
    }
}
async function deleteProject(idx) {
    const project = projects[idx];
    if (!project) return;
    const confirmDelete = await Swal.fire({
        title: 'Delete Project',
        text: `Are you sure you want to delete the project '${project.name}'?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Delete',
        cancelButtonText: 'Cancel'
    });
    if (confirmDelete.isConfirmed) {
        try {
            const res = await fetch(`/api/projects/${project._id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Project delete failed');
            showAlert({ icon: 'success', title: 'Success', text: 'Project deleted!' });
            addActivityFeed('Project deleted: ' + project.name);
            await fetchProjects();
            if (selectedProjectIndex === idx) {
                selectedProjectIndex = null;
                renderProjectDetails();
            }
        } catch (err) {
            showAlert({ icon: 'error', title: 'Error', text: 'Failed to delete project!' });
        }
    }
}
// Tasks API
async function fetchTasks(projectId) {
    const res = await fetch(`/api/tasks/${projectId}`);
    taskList = await res.json();
    renderTasks();
    updateDashboardOverview();
}
async function addTaskToDB(task) {
    try {
        const res = await fetch('/api/tasks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(task)
        });
        if (!res.ok) throw new Error('Task add failed');
        showAlert({ icon: 'success', title: 'Success', text: 'Task added!' });
        addActivityFeed('Task added: ' + task.text);
        await fetchTasks(task.projectId);
        updateSummaryCards();
    } catch (err) {
        showAlert({ icon: 'error', title: 'Error', text: 'Failed to add task!' });
    }
}
async function updateTaskInDB(taskId, data, projectId) {
    try {
        const res = await fetch(`/api/tasks/${taskId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error('Task update failed');
        addActivityFeed('Task updated: ' + (data.text || taskId));
        showAlert({ icon: 'success', title: 'Success', text: 'Task updated!' });
        await fetchTasks(projectId);
    } catch (err) {
        showAlert({ icon: 'error', title: 'Error', text: 'Failed to update task!' });
    }
}
async function deleteTaskFromDB(taskId, projectId) {
    try {
        const res = await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Task delete failed');
        showAlert({ icon: 'success', title: 'Success', text: 'Task deleted!' });
        addActivityFeed('Task deleted: ' + taskId);
        await fetchTasks(projectId);
    } catch (err) {
        showAlert({ icon: 'error', title: 'Error', text: 'Failed to delete task!' });
    }
}

// ===== Project Complete, Deadline, Notes, Progress Bar, Priority, Quick Notes, Recent Activity, Export PDF =====
// Helper: Calculate project progress
function getProjectProgress(projectId) {
    const projectTasks = taskList.filter(t => t.projectId === projectId);
    if (projectTasks.length === 0) return 0;
    const done = projectTasks.filter(t => t.completed).length;
    return Math.round((done / projectTasks.length) * 100);
}
// Mark project as complete
async function markProjectComplete(projectId) {
    const project = projects.find(p => p._id === projectId);
    if (!project) return;
    const res = await fetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...project, completed: true })
    });
    if (res.ok) {
        showAlert({ icon: 'success', title: 'Project Completed', text: 'Project marked as complete!' });
        await fetchProjects();
        renderProjectDetails();
        addActivityFeed('Project completed: ' + project.name);
        updateSummaryCards();
    } else {
        showAlert({ icon: 'error', title: 'Error', text: 'Failed to mark project complete!' });
    }
}
// Mark project as incomplete
async function markProjectIncomplete(projectId) {
    const project = projects.find(p => p._id === projectId);
    if (!project) return;
    const res = await fetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...project, completed: false })
    });
    if (res.ok) {
        showAlert({ icon: 'success', title: 'Project Incomplete', text: 'Project marked as incomplete!' });
        await fetchProjects();
        renderProjectDetails();
        addActivityFeed('Project marked as incomplete: ' + project.name);
        updateSummaryCards();
    } else {
        showAlert({ icon: 'error', title: 'Error', text: 'Failed to mark project incomplete!' });
    }
}
// Update project notes
async function saveProjectNotes(projectId, notes) {
    const project = projects.find(p => p._id === projectId);
    if (!project) return;
    const res = await fetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...project, notes })
    });
    if (res.ok) {
        showAlert({ icon: 'success', title: 'Notes Saved', text: 'Project notes updated!' });
        await fetchProjects();
    } else {
        showAlert({ icon: 'error', title: 'Error', text: 'Failed to save notes!' });
    }
}
// Update project deadline
async function saveProjectDeadline(projectId, deadline) {
    const project = projects.find(p => p._id === projectId);
    if (!project) return;
    const res = await fetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...project, deadline })
    });
    if (res.ok) {
        showAlert({ icon: 'success', title: 'Deadline Saved', text: 'Project deadline updated!' });
        await fetchProjects();
    } else {
        showAlert({ icon: 'error', title: 'Error', text: 'Failed to save deadline!' });
    }
}
// Export project as PDF
async function exportProjectPDF(projectId) {
    const project = projects.find(p => p._id === projectId);
    if (!project) return;
    const tasks = taskList.filter(t => t.projectId === projectId);
    const doc = new window.jspdf.jsPDF();
    doc.text(`Project: ${project.name}`, 10, 10);
    doc.text(`Description: ${project.desc}`, 10, 20);
    doc.text(`Deadline: ${project.deadline ? new Date(project.deadline).toLocaleDateString() : 'N/A'}`, 10, 30);
    doc.text(`Progress: ${getProjectProgress(projectId)}%`, 10, 40);
    doc.text('Tasks:', 10, 50);
    tasks.forEach((t, i) => {
        doc.text(`- [${t.completed ? 'x' : ' '}] ${t.text} (${t.tag || ''})`, 12, 60 + i * 8);
    });
    doc.save(`${project.name}_project.pdf`);
}

// ===== Dashboard Summary Cards =====
function updateSummaryCards() {
    const total = projects.length;
    const completed = projects.filter(p => p.completed).length;
    const active = projects.filter(p => !p.completed && (!p.deadline || new Date(p.deadline) >= new Date())).length;
    const overdue = projects.filter(p => !p.completed && p.deadline && new Date(p.deadline) < new Date()).length;
    document.getElementById('summaryTotalProjects').innerText = total;
    document.getElementById('summaryCompletedProjects').innerText = completed;
    document.getElementById('summaryActiveProjects').innerText = active;
    document.getElementById('summaryOverdueProjects').innerText = overdue;
}
// ===== Pie Chart (Task Status) =====
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
// ===== Doughnut Chart (Priority) =====
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
// ===== Upcoming Deadlines =====
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
// ===== Activity Feed =====
function addActivityFeed(msg) {
    activityFeedArr.unshift({ msg, time: new Date() });
    if (activityFeedArr.length > 20) activityFeedArr.pop();
    updateActivityFeed();
}
function updateActivityFeed() {
    const ul = document.getElementById('activityFeed');
    if (!ul) return;
    ul.innerHTML = '';
    if (activityFeedArr.length === 0) {
        ul.innerHTML = '<li>No recent activity</li>';
        return;
    }
    activityFeedArr.forEach(a => {
        const li = document.createElement('li');
        li.innerHTML = `<span>${a.msg}</span> <span class="text-gray-400 text-xs ml-2">${a.time.toLocaleTimeString()}</span>`;
        ul.appendChild(li);
    });
}

// Task add input में due date field भी दिखाओ
const taskInputRow = document.querySelector('.flex.flex-col.md\\:flex-row.md\\:items-end.gap-4.mb-2');
if (taskInputRow && !document.getElementById('taskDueDate')) {
    const dueInput = document.createElement('input');
    dueInput.type = 'date';
    dueInput.id = 'taskDueDate';
    dueInput.className = 'border border-blue-100 p-3 rounded-xl bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-200';
    dueInput.style.minWidth = '140px';
    dueInput.placeholder = 'Due Date';
    taskInputRow.insertBefore(dueInput, taskInputRow.lastElementChild);
}

async function deleteProject(idx) {
    const project = projects[idx];
    if (!project) return;
    const confirmDelete = await Swal.fire({
        title: 'Delete Project',
        text: `Are you sure you want to delete the project '${project.name}'?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Delete',
        cancelButtonText: 'Cancel'
    });
    if (confirmDelete.isConfirmed) {
        try {
            const res = await fetch(`/api/projects/${project._id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Project delete failed');
            showAlert({ icon: 'success', title: 'Success', text: 'Project deleted!' });
            addActivityFeed('Project deleted: ' + project.name);
            await fetchProjects();
            // Agar delete hua project selected tha toh details hata do
            if (selectedProjectIndex === idx) {
                selectedProjectIndex = null;
                renderProjectDetails();
            }
        } catch (err) {
            showAlert({ icon: 'error', title: 'Error', text: 'Failed to delete project!' });
        }
    }
}

// --- Project Search ---
document.getElementById('projectSearch').addEventListener('input', async function () {
    const q = this.value;
    // UserId backend se session se milega, yahan API me nahi bhejna (server side handle ho raha hai)
    const res = await fetch(`/api/projects/search?q=${encodeURIComponent(q)}`);
    projects = await res.json();
    renderProjectList();
});

// --- Task Search & Filter ---
function getSelectedProjectId() {
    if (selectedProjectIndex !== null && projects[selectedProjectIndex]) {
        return projects[selectedProjectIndex]._id;
    }
    return null;
}
async function fetchAndRenderTasksWithFilters() {
    const projectId = getSelectedProjectId();
    if (!projectId) return;
    const q = document.getElementById('taskSearch').value;
    const priority = document.getElementById('filterPriority').value;
    const status = document.getElementById('filterStatus').value;
    const due = document.getElementById('filterDue').value;
    const params = new URLSearchParams({ projectId, q, priority, status, due });
    const res = await fetch(`/api/tasks/search?${params.toString()}`);
    taskList = await res.json();
    renderTasks();
}
// Add event listeners for task filters (with null checks)
const taskSearchEl = document.getElementById('taskSearch');
const filterPriorityEl = document.getElementById('filterPriority');
const filterStatusEl = document.getElementById('filterStatus');
const filterDueEl = document.getElementById('filterDue');

if (taskSearchEl) taskSearchEl.addEventListener('input', fetchAndRenderTasksWithFilters);
if (filterPriorityEl) filterPriorityEl.addEventListener('change', fetchAndRenderTasksWithFilters);
if (filterStatusEl) filterStatusEl.addEventListener('change', fetchAndRenderTasksWithFilters);
if (filterDueEl) filterDueEl.addEventListener('change', fetchAndRenderTasksWithFilters);

// Project select by id (for filtered/search lists)
function selectProjectById(id) {
    const idx = projects.findIndex(p => p._id === id);
    if (idx !== -1) origSelectProject(idx);
}

// ======= Modern Settings Modal Sidebar Tabs =======
function initializeSettingsTabs() {
    const settingsTabs = document.querySelectorAll('.settings-tab');
    const settingsSections = document.querySelectorAll('.settings-section');

    if (settingsTabs.length === 0) {
        console.log('Settings tabs not found, will retry later');
        return;
    }

    settingsTabs.forEach(tab => {
        tab.addEventListener('click', function () {
            settingsTabs.forEach(t => t.classList.remove('bg-blue-200', 'font-bold'));
            this.classList.add('bg-blue-200', 'font-bold');
            const section = this.getAttribute('data-section');
            settingsSections.forEach(sec => sec.classList.add('hidden'));
            const targetSection = document.getElementById('settings-section-' + section);
            if (targetSection) {
                targetSection.classList.remove('hidden');
            }
        });
    });

    // Default: Profile tab active
    if (settingsTabs[0]) settingsTabs[0].click();
}

// Initialize settings tabs when DOM is ready
document.addEventListener('DOMContentLoaded', function () {
    initializeSettingsTabs();
});

// ======= AI Bot Functionality =======

// Initialize AI Bot functionality
function initializeAIBot() {

    // Initialize Web Speech API
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onresult = function (event) {
            const transcript = event.results[0][0].transcript;
            const input = document.getElementById('aiMessageInput');
            if (input) {
                input.value = transcript;
            }
            stopVoiceRecording();
        };

        recognition.onerror = function (event) {
            console.error('Speech recognition error:', event.error);
            stopVoiceRecording();
            showAlert({ icon: 'error', title: 'Voice Error', text: 'Voice recognition failed: ' + event.error });
        };

        recognition.onend = function () {
            stopVoiceRecording();
        };
    }
}

// Initialize AI Bot when DOM is ready
document.addEventListener('DOMContentLoaded', function () {
    initializeAIBot();

    // Initialize settings button (backup)
    initializeSettingsButton();
});

// ======= AI Bot Modal Open Function (Global) =======
function openAiBotModal() {
    const modal = document.getElementById('aiBotModal');
    if (modal) {
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
        // ...rest of your code (focus input etc.) ...
    } else {
        alert('AI Bot modal not found. Please refresh the page.');
    }
}
window.openAiBotModal = openAiBotModal;

// ======= DOMContentLoaded Event Listeners =======
document.addEventListener('DOMContentLoaded', function () {
    // AI Bot Button Event
    const aiBotBtn = document.getElementById('aiBotBtn');
    if (aiBotBtn) {
        aiBotBtn.addEventListener('click', openAiBotModal);
    }
    // Settings Button Event
    const settingsBtn = document.getElementById('settingsBtn');
    if (settingsBtn && typeof openSettingsModal === 'function') {
        settingsBtn.onclick = openSettingsModal;
    }
});

// Voice Input Functions
function toggleVoiceInput() {

    // Safety check for variables
    if (typeof isRecording === 'undefined') {
        console.error('isRecording variable not initialized');
        return;
    }

    if (isRecording) {
        stopVoiceRecording();
    } else {
        startVoiceRecording();
    }
}

function startVoiceRecording() {

    if (!recognition) {
        console.error('Recognition not available');
        showAlert({ icon: 'error', title: 'Not Supported', text: 'Voice recognition is not supported in your browser.' });
        return;
    }

    try {
        recognition.start();
        isRecording = true;

        const micIcon = document.getElementById('micIcon');
        const stopIcon = document.getElementById('stopIcon');
        const voiceStatus = document.getElementById('voiceStatus');
        const voiceStatusText = document.getElementById('voiceStatusText');
        const voiceBtn = document.getElementById('voiceBtn');

        if (micIcon) micIcon.style.display = 'none';
        if (stopIcon) stopIcon.style.display = 'block';
        if (voiceStatus) voiceStatus.classList.remove('hidden');
        if (voiceStatusText) voiceStatusText.textContent = 'Listening... Speak now!';
        if (voiceBtn) voiceBtn.classList.add('text-red-500', 'recording');

    } catch (error) {
        console.error('Error starting voice recognition:', error);
        showAlert({ icon: 'error', title: 'Voice Error', text: 'Could not start voice recognition: ' + error.message });
    }
}

function stopVoiceRecording() {

    if (recognition && isRecording) {
        recognition.stop();
    }
    isRecording = false;

    const micIcon = document.getElementById('micIcon');
    const stopIcon = document.getElementById('stopIcon');
    const voiceStatus = document.getElementById('voiceStatus');
    const voiceBtn = document.getElementById('voiceBtn');

    if (micIcon) micIcon.style.display = 'block';
    if (stopIcon) stopIcon.style.display = 'none';
    if (voiceStatus) voiceStatus.classList.add('hidden');
    if (voiceBtn) voiceBtn.classList.remove('text-red-500', 'recording');

}

// Send AI Message
async function sendAiMessage() {
    const messageInput = document.getElementById('aiMessageInput');
    const message = messageInput.value.trim();

    if (!message) {
        showAlert({ icon: 'warning', title: 'Empty Message', text: 'Please enter a message to send.' });
        return;
    }

    // Add user message to chat
    addMessageToChat('user', message);
    messageInput.value = '';

    // Show typing indicator
    const typingId = addTypingIndicator();

    try {
        // Get current project context
        let projectContext = '';
        if (selectedProjectIndex !== null && projects[selectedProjectIndex]) {
            const project = projects[selectedProjectIndex];
            projectContext = `Current Project: ${project.name} - ${project.desc}`;
        }

        const response = await fetch('/api/userdata/ai/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message, projectContext })
        });

        const data = await response.json();

        // Remove typing indicator
        removeTypingIndicator(typingId);

        if (data.success) {
            addMessageToChat('ai', data.response);
        } else {
            addMessageToChat('ai', 'Sorry, I encountered an error. Please try again later.');
        }

    } catch (error) {
        console.error('AI Chat Error:', error);
        removeTypingIndicator(typingId);
        addMessageToChat('ai', 'Sorry, I am temporarily unavailable. Please try again later.');
    }
}

// Add message to chat
function addMessageToChat(sender, message) {
    const chatArea = document.getElementById('aiChatArea');
    const messageDiv = document.createElement('div');
    messageDiv.className = 'flex items-start gap-3';

    if (sender === 'user') {
        messageDiv.innerHTML = `
            <div class="flex-1"></div>
            <div class="bg-blue-100 rounded-xl p-3 max-w-xs">
                <p class="text-sm text-blue-700">${message}</p>
            </div>
            <div class="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="#fff" stroke-width="2"/>
                    <circle cx="12" cy="7" r="4" stroke="#fff" stroke-width="2"/>
                </svg>
            </div>
        `;
    } else {
        // Format AI response with better styling
        const formattedMessage = formatAIResponse(message);
        messageDiv.innerHTML = `
            <div class="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="#9333ea"/>
                </svg>
            </div>
            <div class="bg-white border border-purple-200 rounded-xl p-4 max-w-md shadow-sm">
                <div class="prose prose-sm max-w-none">
                    ${formattedMessage}
                </div>
            </div>
        `;
    }

    chatArea.appendChild(messageDiv);
    chatArea.scrollTop = chatArea.scrollHeight;
}

// Format AI response with better styling
function formatAIResponse(message) {
    let formatted = message;

    // Replace **text** with <strong>text</strong>
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>');

    // Replace *text* with <em>text</em>
    formatted = formatted.replace(/\*(.*?)\*/g, '<em class="italic text-gray-700">$1</em>');

    // Replace bullet points with styled list items
    formatted = formatted.replace(/^\* (.*$)/gm, '<li class="text-gray-700 mb-1">• $1</li>');

    // Replace numbered lists
    formatted = formatted.replace(/^\d+\. (.*$)/gm, '<li class="text-gray-700 mb-1">$&</li>');

    // Wrap lists in ul tags
    formatted = formatted.replace(/(<li.*<\/li>)/gs, '<ul class="list-none space-y-1 mb-3">$1</ul>');

    // Replace line breaks with proper spacing
    formatted = formatted.replace(/\n\n/g, '</p><p class="mb-3">');
    formatted = formatted.replace(/\n/g, '<br>');

    // Wrap in paragraph tags
    formatted = `<p class="text-gray-800 leading-relaxed mb-3">${formatted}</p>`;

    // Add special styling for sections
    formatted = formatted.replace(/(<strong.*?English.*?<\/strong>)/g, '<div class="bg-blue-50 border-l-4 border-blue-400 p-3 mb-3 rounded-r">$1');
    formatted = formatted.replace(/(<strong.*?Hindi.*?<\/strong>)/g, '</div><div class="bg-green-50 border-l-4 border-green-400 p-3 mb-3 rounded-r">$1');

    // Add closing div for Hindi section
    if (formatted.includes('bg-green-50')) {
        formatted += '</div>';
    }

    // Style code blocks
    formatted = formatted.replace(/`([^`]+)`/g, '<code class="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono">$1</code>');

    // Style quotes
    formatted = formatted.replace(/^"([^"]+)"$/gm, '<blockquote class="border-l-4 border-purple-300 pl-3 italic text-gray-600">"$1"</blockquote>');

    return formatted;
}

// Add typing indicator
function addTypingIndicator() {
    const chatArea = document.getElementById('aiChatArea');
    const typingDiv = document.createElement('div');
    const typingId = 'typing-' + Date.now();
    typingDiv.id = typingId;
    typingDiv.className = 'flex items-start gap-3';
    typingDiv.innerHTML = `
        <div class="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="#9333ea"/>
            </svg>
        </div>
        <div class="bg-purple-50 rounded-xl p-3">
            <div class="flex space-x-1">
                <div class="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                <div class="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style="animation-delay: 0.1s"></div>
                <div class="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
            </div>
        </div>
    `;

    chatArea.appendChild(typingDiv);
    chatArea.scrollTop = chatArea.scrollHeight;
    return typingId;
}

// Remove typing indicator
function removeTypingIndicator(typingId) {
    const typingDiv = document.getElementById(typingId);
    if (typingDiv) {
        typingDiv.remove();
    }
}

// Settings button event listener - Add immediately
function initializeSettingsButton() {
    let settingsBtn = document.getElementById('settingsBtn');
    if (settingsBtn && !settingsBtn.hasAttribute('data-listener-added')) {
        settingsBtn.addEventListener('click', function () {
            console.log('Settings button clicked!');
            openSettingsModal();
        });
        settingsBtn.setAttribute('data-listener-added', 'true');
    } else if (!settingsBtn) {
        console.log('Settings button not found on page load');
    }
}

// Initialize settings button immediately
initializeSettingsButton();

// Voice button event listener - Add immediately if available
const voiceBtn = document.getElementById('voiceBtn');
if (voiceBtn && !voiceBtn.hasAttribute('data-listener-added')) {
    voiceBtn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        if (typeof toggleVoiceInput === 'function') {
            toggleVoiceInput();
        } else {
            console.error('toggleVoiceInput function not found');
        }
    });
    voiceBtn.setAttribute('data-listener-added', 'true');
}

// Enter key to send message and voice button
document.addEventListener('DOMContentLoaded', function () {
    const messageInput = document.getElementById('aiMessageInput');
    if (messageInput) {
        messageInput.addEventListener('keypress', function (e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendAiMessage();
            }
        });
    }

    // Voice button event listener (backup)
    const voiceBtn = document.getElementById('voiceBtn');
    if (voiceBtn && !voiceBtn.hasAttribute('data-listener-added')) {
        voiceBtn.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            if (typeof toggleVoiceInput === 'function') {
                toggleVoiceInput();
            } else {
                console.error('toggleVoiceInput function not found');
            }
        });
        voiceBtn.setAttribute('data-listener-added', 'true');
    }

    // Also add AI Bot button listener here as backup
    const aiBotBtnBackup = document.getElementById('aiBotBtn');
    if (aiBotBtnBackup && !aiBotBtnBackup.hasAttribute('data-listener-added')) {
        aiBotBtnBackup.addEventListener('click', openAiBotModal);
        aiBotBtnBackup.setAttribute('data-listener-added', 'true');
    }

    // Also add voice button listener here as backup
    const voiceBtnBackup = document.getElementById('voiceBtn');
    if (voiceBtnBackup && !voiceBtnBackup.hasAttribute('data-listener-added')) {
        voiceBtnBackup.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            if (typeof toggleVoiceInput === 'function') {
                toggleVoiceInput();
            } else {
                console.error('toggleVoiceInput function not found');
            }
        });
        voiceBtnBackup.setAttribute('data-listener-added', 'true');
    }
});

// ======= Modular Settings Forms =======
// Profile Form
const profileForm = document.getElementById('profileForm');
if (profileForm) {
    profileForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        const name = document.getElementById('settingsName').value;

        if (!name.trim()) {
            Swal.fire({ icon: 'error', title: 'Error', text: 'Please enter a name.' });
            return;
        }

        try {
            const res = await fetch('/api/userdata/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: name.trim() })
            });
            const data = await res.json();
            if (data.success) {
                Swal.fire({ icon: 'success', title: 'Updated!', text: 'Profile updated successfully.' });
                prefillSettingsModal();
            } else {
                Swal.fire({ icon: 'error', title: 'Error', text: data.message || 'Update failed.' });
            }
        } catch (error) {
            console.error('Profile update error:', error);
            Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to update profile. Please try again.' });
        }
    });
}

// Email Management
// userEmails is already declared at the top of the file

// Load user emails
async function loadUserEmails() {
    try {
        const res = await fetch('/api/userdata/profile');
        const data = await res.json();
        userEmails = data.emails || [];
        renderEmailList();
    } catch (error) {
        console.error('Failed to load emails:', error);
    }
}

// Render email list
function renderEmailList() {
    const emailList = document.getElementById('emailList');
    if (!emailList) return;

    emailList.innerHTML = '';

    if (userEmails.length === 0) {
        emailList.innerHTML = '<p class="text-gray-500 text-sm">No emails added yet.</p>';
        return;
    }

    userEmails.forEach(emailObj => {
        const emailDiv = document.createElement('div');
        emailDiv.className = 'flex items-center justify-between p-3 bg-blue-50 rounded-xl border border-blue-100';

        const status = emailObj.verified ?
            (emailObj.isPrimary ? 'Primary' : 'Verified') :
            (emailObj.pending ? 'Pending' : 'Unverified');

        const statusColor = emailObj.verified ?
            (emailObj.isPrimary ? 'text-green-600' : 'text-blue-600') :
            'text-yellow-600';

        emailDiv.innerHTML = `
            <div class="flex-1">
                <div class="font-medium text-gray-800">${emailObj.email}</div>
                <div class="text-sm ${statusColor}">${status}</div>
            </div>
            <div class="flex gap-2">
                ${!emailObj.verified ? `
                    <button onclick="resendOTP('${emailObj.email}')" class="text-blue-500 hover:text-blue-700 text-sm">Resend OTP</button>
                ` : ''}
                ${emailObj.verified && !emailObj.isPrimary ? `
                    <button onclick="setPrimaryEmail('${emailObj.email}')" class="text-green-500 hover:text-green-700 text-sm">Set Primary</button>
                ` : ''}
                ${emailObj.verified ? `
                    <button onclick="removeEmail('${emailObj.email}')" class="text-red-500 hover:text-red-700 text-sm">Remove</button>
                ` : ''}
            </div>
        `;

        emailList.appendChild(emailDiv);
    });
}

// Add email
const addEmailBtn = document.getElementById('addEmailBtn');
if (addEmailBtn) {
    addEmailBtn.addEventListener('click', async function () {
        const emailInput = document.getElementById('addEmailInput');
        const email = emailInput.value.trim();

        if (!email) {
            Swal.fire({ icon: 'warning', title: 'Error', text: 'Please enter an email address.' });
            return;
        }

        try {
            const res = await fetch('/api/userdata/email/send-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            const data = await res.json();

            if (data.success) {
                openOtpModal(email);
                emailInput.value = '';
            } else {
                Swal.fire({ icon: 'error', title: 'Error', text: data.message });
            }
        } catch (error) {
            Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to send OTP. Please try again.' });
        }
    });
}

// Verify email OTP
async function verifyEmailOTP(email, otp) {
    try {
        const res = await fetch('/api/userdata/email/verify-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, otp })
        });

        const data = await res.json();

        if (data.success) {
            Swal.fire({ icon: 'success', title: 'Success!', text: 'Email verified successfully.' });
            closeOtpModal();
            await loadUserEmails();
        } else {
            Swal.fire({ icon: 'error', title: 'Error', text: data.message });
            document.getElementById('verifyOtpBtn').disabled = false;
        }
    } catch (error) {
        Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to verify OTP. Please try again.' });
        document.getElementById('verifyOtpBtn').disabled = false;
    }
}

// Resend OTP (from email list)
async function resendOTP(email) {
    try {
        const res = await fetch('/api/userdata/email/send-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        const data = await res.json();
        if (data.success) {
            openOtpModal(email);
        } else {
            Swal.fire({ icon: 'error', title: 'Error', text: data.message });
        }
    } catch (error) {
        Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to resend OTP. Please try again.' });
    }
}

// Set primary email
async function setPrimaryEmail(email) {
    try {
        const res = await fetch('/api/userdata/email/primary', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });

        const data = await res.json();

        if (data.success) {
            Swal.fire({ icon: 'success', title: 'Success!', text: 'Primary email updated successfully.' });
            await loadUserEmails();
        } else {
            Swal.fire({ icon: 'error', title: 'Error', text: data.message });
        }
    } catch (error) {
        Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to update primary email. Please try again.' });
    }
}

// Remove email
async function removeEmail(email) {
    const result = await Swal.fire({
        icon: 'warning',
        title: 'Remove Email',
        text: `Are you sure you want to remove ${email}?`,
        showCancelButton: true,
        confirmButtonText: 'Remove',
        cancelButtonText: 'Cancel'
    });
    if (result.isConfirmed) {
        try {
            const res = await fetch('/api/userdata/email/remove', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            const data = await res.json();
            if (data.success) {
                Swal.fire({ icon: 'success', title: 'Success!', text: 'Email removed successfully.' });
                await loadUserEmails();
            } else {
                Swal.fire({ icon: 'error', title: 'Error', text: data.message });
            }
        } catch (error) {
            Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to remove email. Please try again.' });
        }
    }
}
// Prefill settings modal with user data
async function prefillSettingsModal() {
    try {
        const res = await fetch('/api/userdata/profile');
        const data = await res.json();

        // Fill name field
        const nameInput = document.getElementById('settingsName');
        if (nameInput) {
            nameInput.value = data.name || '';
        }

        // Load emails
        userEmails = data.emails || [];
        renderEmailList();
    } catch (error) {
        console.error('Failed to load user data:', error);
    }
}

// Modal open par Profile tab default select ho
function openSettingsModal() {
    const settingsModal = document.getElementById('settingsModal');
    if (settingsModal) {
        settingsModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';

        // Initialize settings tabs if not already done
        initializeSettingsTabs();

        // Set Profile tab as active
        const settingsTabs = document.querySelectorAll('.settings-tab');
        if (settingsTabs[0]) {
            settingsTabs[0].click();
        }

        prefillSettingsModal();
    } else {
        console.error('Settings modal not found');
    }
}

// Close settings modal
function closeSettingsModal() {
    const settingsModal = document.getElementById('settingsModal');
    if (settingsModal) {
        settingsModal.classList.add('hidden');
        document.body.style.overflow = '';
    }
}

function openOtpModal(email) {
    currentOtpEmail = email;
    document.getElementById('otpModal').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    document.getElementById('otpInput').value = '';
    document.getElementById('otpEmailText').innerText = `OTP sent to: ${email}`;
    document.getElementById('resendOtpBtn').style.display = 'none';
    document.getElementById('resendOtpBtn').disabled = true;
    document.getElementById('verifyOtpBtn').disabled = false;
    startOtpTimer();
}

function closeOtpModal() {
    document.getElementById('otpModal').classList.add('hidden');
    document.body.style.overflow = '';
    stopOtpTimer();
}

function startOtpTimer() {
    otpTimeLeft = 120;
    updateOtpTimer();
    otpTimerInterval = setInterval(() => {
        otpTimeLeft--;
        updateOtpTimer();
        if (otpTimeLeft <= 0) {
            clearInterval(otpTimerInterval);
            document.getElementById('otpTimer').innerText = 'Didn\'t get OTP?';
            document.getElementById('resendOtpBtn').style.display = '';
            document.getElementById('resendOtpBtn').disabled = false;
        }
    }, 1000);
}

function stopOtpTimer() {
    if (otpTimerInterval) clearInterval(otpTimerInterval);
    document.getElementById('otpTimer').innerText = '';
    document.getElementById('resendOtpBtn').style.display = 'none';
    document.getElementById('resendOtpBtn').disabled = true;
}

function updateOtpTimer() {
    const min = Math.floor(otpTimeLeft / 60);
    const sec = otpTimeLeft % 60;
    document.getElementById('otpTimer').innerText = `Resend available in ${min}:${sec.toString().padStart(2, '0')}`;
    document.getElementById('resendOtpBtn').style.display = 'none';
    document.getElementById('resendOtpBtn').disabled = true;
}

async function verifyOtp() {
    const otp = document.getElementById('otpInput').value.trim();
    if (otp.length !== 6) {
        Swal.fire({ icon: 'warning', title: 'Invalid OTP', text: 'Please enter a valid 6-digit OTP.' });
        return;
    }
    document.getElementById('verifyOtpBtn').disabled = true;
    try {
        const res = await fetch('/api/userdata/email/verify-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: currentOtpEmail, otp })
        });
        const data = await res.json();
        if (data.success) {
            Swal.fire({ icon: 'success', title: 'Success!', text: 'Email verified successfully.' });
            closeOtpModal();
            await loadUserEmails();
        } else {
            Swal.fire({ icon: 'error', title: 'Error', text: data.message });
            document.getElementById('verifyOtpBtn').disabled = false;
        }
    } catch (error) {
        Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to verify OTP. Please try again.' });
        document.getElementById('verifyOtpBtn').disabled = false;
    }
}

async function resendOtpFromModal() {
    document.getElementById('resendOtpBtn').disabled = true;
    try {
        const res = await fetch('/api/userdata/email/send-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: currentOtpEmail })
        });
        const data = await res.json();
        if (data.success) {
            Swal.fire({ icon: 'success', title: 'Success!', text: 'OTP resent! Please check your email.' });
            startOtpTimer();
        } else {
            Swal.fire({ icon: 'error', title: 'Error', text: data.message });
            document.getElementById('resendOtpBtn').disabled = false;
        }
    } catch (error) {
        Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to resend OTP. Please try again.' });
        document.getElementById('resendOtpBtn').disabled = false;
    }
}

// ======= AI Bot Modal Close Function (Global) =======
function closeAiBotModal() {
    const modal = document.getElementById('aiBotModal');
    if (modal) {
        modal.classList.add('hidden');
        document.body.style.overflow = '';
        if (typeof stopVoiceRecording === 'function') {
            stopVoiceRecording();
        }
    }
}
window.closeAiBotModal = closeAiBotModal;

// ======= Event Listeners for CSP Compliance =======
document.addEventListener('DOMContentLoaded', function () {
    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logoutUser);
    }

    // Landing page button
    const landingPageBtn = document.getElementById('landingPageBtn');
    if (landingPageBtn) {
        landingPageBtn.addEventListener('click', function () {
            window.location.href = '/';
        });
    }

    // Add project button
    const addProjectBtn = document.getElementById('addProjectBtn');
    if (addProjectBtn) {
        addProjectBtn.addEventListener('click', function () {
            showProjectForm();
        });
    }

    // Edit project button
    const editProjectBtn = document.getElementById('editProjectBtn');
    if (editProjectBtn) {
        editProjectBtn.addEventListener('click', editProject);
    }

    // Mark complete button
    const markCompleteBtn = document.getElementById('markCompleteBtn');
    if (markCompleteBtn) {
        markCompleteBtn.addEventListener('click', function () {
            if (selectedProjectIndex !== null && projects[selectedProjectIndex]) {
                markProjectComplete(projects[selectedProjectIndex]._id);
            }
        });
    }

    // Mark incomplete button
    const markIncompleteBtn = document.getElementById('markIncompleteBtn');
    if (markIncompleteBtn) {
        markIncompleteBtn.addEventListener('click', function () {
            if (selectedProjectIndex !== null && projects[selectedProjectIndex]) {
                markProjectIncomplete(projects[selectedProjectIndex]._id);
            }
        });
    }

    // Export project button
    const exportProjectBtn = document.getElementById('exportProjectBtn');
    if (exportProjectBtn) {
        exportProjectBtn.addEventListener('click', function () {
            if (selectedProjectIndex !== null && projects[selectedProjectIndex]) {
                exportProjectPDF(projects[selectedProjectIndex]._id);
            }
        });
    }

    // Save project notes button
    const saveProjectNotesBtn = document.getElementById('saveProjectNotesBtn');
    if (saveProjectNotesBtn) {
        saveProjectNotesBtn.addEventListener('click', function () {
            if (selectedProjectIndex !== null && projects[selectedProjectIndex]) {
                const notes = document.getElementById('projectQuickNotes').value;
                saveProjectNotes(projects[selectedProjectIndex]._id, notes);
            }
        });
    }

    // Add task button
    const addTaskBtn = document.getElementById('addTaskBtn');
    if (addTaskBtn) {
        addTaskBtn.addEventListener('click', addTask);
    }

    // Add sidebar todo button
    const addSidebarTodoBtn = document.getElementById('addSidebarTodoBtn');
    if (addSidebarTodoBtn) {
        addSidebarTodoBtn.addEventListener('click', addSidebarTodo);
    }

    // Save sidebar notes button
    const saveSidebarNotesBtn = document.getElementById('saveSidebarNotesBtn');
    if (saveSidebarNotesBtn) {
        saveSidebarNotesBtn.addEventListener('click', saveSidebarNotes);
    }

    // Close project form button
    const closeProjectFormBtn = document.getElementById('closeProjectFormBtn');
    if (closeProjectFormBtn) {
        closeProjectFormBtn.addEventListener('click', closeProjectForm);
    }

    // Add basic input button
    const addBasicInputBtn = document.getElementById('addBasicInputBtn');
    if (addBasicInputBtn) {
        addBasicInputBtn.addEventListener('click', function () {
            addBasicInput();
        });
    }

    // Add advanced input button
    const addAdvancedInputBtn = document.getElementById('addAdvancedInputBtn');
    if (addAdvancedInputBtn) {
        addAdvancedInputBtn.addEventListener('click', function () {
            addAdvancedInput();
        });
    }

    // Close settings modal button
    const closeSettingsModalBtn = document.getElementById('closeSettingsModalBtn');
    if (closeSettingsModalBtn) {
        closeSettingsModalBtn.addEventListener('click', closeSettingsModal);
    }

    // Close AI bot modal button
    const closeAiBotModalBtn = document.getElementById('closeAiBotModalBtn');
    if (closeAiBotModalBtn) {
        closeAiBotModalBtn.addEventListener('click', closeAiBotModal);
    }

    // Send AI message button
    const sendAiMessageBtn = document.getElementById('sendAiMessageBtn');
    if (sendAiMessageBtn) {
        sendAiMessageBtn.addEventListener('click', sendAiMessage);
    }

    // Close OTP modal button
    const closeOtpModalBtn = document.getElementById('closeOtpModalBtn');
    if (closeOtpModalBtn) {
        closeOtpModalBtn.addEventListener('click', closeOtpModal);
    }

    // Verify OTP button
    const verifyOtpBtn = document.getElementById('verifyOtpBtn');
    if (verifyOtpBtn) {
        verifyOtpBtn.addEventListener('click', verifyOtp);
    }

    // Resend OTP button
    const resendOtpBtn = document.getElementById('resendOtpBtn');
    if (resendOtpBtn) {
        resendOtpBtn.addEventListener('click', resendOtpFromModal);
    }

    // Project deadline change
    const projectDeadline = document.getElementById('projectDeadline');
    if (projectDeadline) {
        projectDeadline.addEventListener('change', function () {
            if (selectedProjectIndex !== null && projects[selectedProjectIndex]) {
                saveProjectDeadline(projects[selectedProjectIndex]._id, this.value);
            }
        });
    }

    // Project quick notes auto-resize
    const projectQuickNotes = document.getElementById('projectQuickNotes');
    if (projectQuickNotes) {
        projectQuickNotes.addEventListener('input', function () {
            this.style.height = 'auto';
            this.style.height = (this.scrollHeight) + 'px';
        });
    }
});

document.addEventListener('DOMContentLoaded', function () {
    if (window.Sortable) {
        // Projects Drag & Drop
        new Sortable(document.getElementById('projectList'), {
            animation: 150,
            onEnd: function (evt) {
                if (evt.oldIndex === evt.newIndex) return;
                const moved = projects.splice(evt.oldIndex, 1)[0];
                projects.splice(evt.newIndex, 0, moved);
                renderProjectList();
                // TODO: Backend में ऑर्डर सेव करना हो तो यहाँ API कॉल करें
            }
        });
        // Tasks Drag & Drop
        new Sortable(document.getElementById('taskList'), {
            animation: 150,
            onEnd: function (evt) {
                if (evt.oldIndex === evt.newIndex) return;
                // सिर्फ वही टास्क्स जो दिख रहे हैं (फिल्टर के बाद)
                let filter = document.getElementById('taskSearch')?.value || '';
                let tag = document.getElementById('taskTagFilter')?.value || '';
                let filtered = taskList.filter(task =>
                    (selectedProjectIndex === null || task.projectId === projects[selectedProjectIndex]?._id) &&
                    task.text.toLowerCase().includes(filter ? filter.toLowerCase() : '') &&
                    (tag === '' || task.tag === tag)
                );
                const moved = filtered.splice(evt.oldIndex, 1)[0];
                filtered.splice(evt.newIndex, 0, moved);
                // अब taskList में filtered के हिसाब से ऑर्डर अपडेट करें
                // (सिर्फ दिख रहे टास्क्स का ऑर्डर बदलेगा)
                // पूरे taskList में भी ऑर्डर बदलना हो तो IDs से री-ऑर्डर करें
                let newOrder = filtered.map(t => t._id);
                taskList = taskList.sort((a, b) => {
                    let ai = newOrder.indexOf(a._id);
                    let bi = newOrder.indexOf(b._id);
                    if (ai === -1) ai = 9999;
                    if (bi === -1) bi = 9999;
                    return ai - bi;
                });
                renderTasks(filter, tag);
                // TODO: Backend में ऑर्डर सेव करना हो तो यहाँ API कॉल करें
            }
        });
    }
});

// ======= Sidebar Todos Drag & Drop =======
document.addEventListener('DOMContentLoaded', function () {
    if (window.Sortable) {
        // पहले से प्रोजेक्ट्स/टास्क्स के लिए Sortable है, अब Todos के लिए:
        new Sortable(document.getElementById('sidebarTodoList'), {
            animation: 150,
            onEnd: function (evt) {
                if (evt.oldIndex === evt.newIndex) return;
                const moved = sidebarTodos.splice(evt.oldIndex, 1)[0];
                sidebarTodos.splice(evt.newIndex, 0, moved);
                renderSidebarTodos();
                saveSidebarTodos('update');
            }
        });
    }
});
