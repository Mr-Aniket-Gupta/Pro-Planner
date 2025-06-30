// Data
let projects = [];
let selectedProjectIndex = null;
let taskList = [];

// ===== Calendar variable global define करो =====
let calendar = null;

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
                  <button onclick="selectProject(${idx})" class="ml-2 text-blue-400 hover:text-blue-600" title="Select"><svg width="18" height="18" fill="none" viewBox="0 0 18 18"><circle cx="9" cy="9" r="8" stroke="#3B82F6" stroke-width="1.5"/><path d="M6 9l2 2 4-4" stroke="#3B82F6" stroke-width="1.5" stroke-linecap="round"/></svg></button>
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
            showAlert({icon:'success',title:'Success',text:'Project updated!'});
        } catch (err) {
            showAlert({icon:'error',title:'Error',text:'Failed to update project!'});
        }
    } else {
        await addProject({ name, desc, basic, advanced });
    }
    await fetchProjects();
    closeProjectForm();
});
function selectProject(idx) {
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
async function addTask() {
    const input = document.getElementById('taskInput');
    const tag = document.getElementById('taskTag').value;
    const priority = document.getElementById('taskPriority').value;
    // Due date input (add करो)
    let dueDate = '';
    if(document.getElementById('taskDueDate')) dueDate = document.getElementById('taskDueDate').value;
    if (input.value.trim() && selectedProjectIndex !== null) {
        await addTaskToDB({ text: input.value.trim(), tag, projectId: projects[selectedProjectIndex]._id, dueDate, priority });
        input.value = '';
        if(document.getElementById('taskDueDate')) document.getElementById('taskDueDate').value = '';
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
function showAlert({icon='success',title='',text='',color='#2563eb',bg='#f0f6ff'}) {
    Swal.fire({icon,title,text,background:bg,color,confirmButtonColor:'#2563eb'});
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
    localStorage.clear();
            window.location.href = '/logout';
        }
    });
}

// ======= Dark Theme Toggle =======
const themeToggleBtn = document.getElementById('themeToggleBtn');
const moonIcon = document.getElementById('moonIcon');
const sunIcon = document.getElementById('sunIcon');

// थीम स्टेट localStorage में सेव करें
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

// बटन क्लिक इवेंट
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
let sidebarTodos = [];
let sidebarNotes = '';

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

function renderSidebarTodos() {
    const ul = document.getElementById('sidebarTodoList');
    ul.innerHTML = '';
    sidebarTodos.forEach((todo, idx) => {
        const li = document.createElement('li');
        li.className = 'flex items-center justify-between bg-blue-50 rounded-xl px-3 py-2';
        li.innerHTML = `<span class="${todo.done ? 'line-through text-gray-400' : 'text-gray-700 font-medium'}">${todo.text}</span>
            <div class="flex gap-2">
                <button onclick="toggleSidebarTodo(${idx})" class="text-green-500 hover:text-green-700" title="Done"><svg width="16" height="16" fill="none" viewBox="0 0 16 16"><circle cx="8" cy="8" r="7" stroke="#10B981" stroke-width="1.5"/><path d="M5 8l2 2 4-4" stroke="#10B981" stroke-width="1.5" stroke-linecap="round"/></svg></button>
                <button onclick="deleteSidebarTodo(${idx})" class="text-red-400 hover:text-red-600" title="Delete"><svg width="16" height="16" fill="none" viewBox="0 0 16 16"><rect width="16" height="16" rx="4" fill="#fee2e2"/><path d="M4 8h8" stroke="#ef4444" stroke-width="1.5" stroke-linecap="round"/></svg></button>
            </div>`;
        ul.appendChild(li);
    });
}
async function addSidebarTodo() {
    const input = document.getElementById('sidebarTodoInput');
    const val = input.value.trim();
    if (!val) return;
    sidebarTodos.push({ text: val, done: false });
    await saveSidebarTodos('add');
    input.value = '';
    renderSidebarTodos();
}
async function toggleSidebarTodo(idx) {
    sidebarTodos[idx].done = !sidebarTodos[idx].done;
    await saveSidebarTodos('update');
    renderSidebarTodos();
}
async function deleteSidebarTodo(idx) {
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
        if(action==='add') showAlert({icon:'success',title:'Success',text:'Todo added!'});
        if(action==='delete') showAlert({icon:'success',title:'Success',text:'Todo deleted!'});
        if(action==='update') showAlert({icon:'success',title:'Success',text:'Todo updated!'});
    } catch (err) {
        showAlert({icon:'error',title:'Error',text:'Failed to save todos!'});
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
        showAlert({icon:'success',title:'Success',text:'Notes saved!'});
    } catch (err) {
        showAlert({icon:'error',title:'Error',text:'Failed to save notes!'});
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
    } catch (err) {
        showAlert({icon:'error',title:'Error',text:'Failed to load projects!'});
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
        showAlert({icon:'success',title:'Success',text:'Project added!'});
        await fetchProjects();
    } catch (err) {
        showAlert({icon:'error',title:'Error',text:'Failed to add project!'});
    }
}
// Tasks API
async function fetchTasks(projectId) {
    if (!projectId) {
        taskList = [];
        renderTasks();
        updatePieChart();
        updateDoughnutChart();
        updateUpcomingDeadlines();
        return;
    }
    try {
        const res = await fetch(`/api/tasks/${projectId}`);
        if (!res.ok) throw new Error('Failed to load tasks!');
        taskList = await res.json();
        renderTasks();
        updatePieChart();
        updateDoughnutChart();
        updateUpcomingDeadlines();
    } catch (err) {
        showAlert({icon:'error',title:'Error',text:'Failed to load tasks!'});
        taskList = [];
        renderTasks();
        updatePieChart();
        updateDoughnutChart();
        updateUpcomingDeadlines();
    }
}
async function addTaskToDB(task) {
    try {
        const res = await fetch('/api/tasks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(task)
        });
        if (!res.ok) throw new Error('Task add failed');
        showAlert({icon:'success',title:'Success',text:'Task added!'});
        await fetchTasks(task.projectId);
        addActivityFeed('Task added: ' + task.text);
        updateSummaryCards();
    } catch (err) {
        showAlert({icon:'error',title:'Error',text:'Failed to add task!'});
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
        showAlert({icon:'success',title:'Success',text:'Task updated!'});
        await fetchTasks(projectId);
    } catch (err) {
        showAlert({icon:'error',title:'Error',text:'Failed to update task!'});
    }
}
async function deleteTaskFromDB(taskId, projectId) {
    try {
        const res = await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Task delete failed');
        showAlert({icon:'success',title:'Success',text:'Task deleted!'});
        await fetchTasks(projectId);
    } catch (err) {
        showAlert({icon:'error',title:'Error',text:'Failed to delete task!'});
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
        showAlert({icon:'success',title:'Project Completed',text:'Project marked as complete!'});
        await fetchProjects();
        renderProjectDetails();
        addActivityFeed('Project completed: ' + project.name);
        updateSummaryCards();
    } else {
        showAlert({icon:'error',title:'Error',text:'Failed to mark project complete!'});
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
        showAlert({icon:'success',title:'Project Incomplete',text:'Project marked as incomplete!'});
        await fetchProjects();
        renderProjectDetails();
        addActivityFeed('Project marked as incomplete: ' + project.name);
        updateSummaryCards();
    } else {
        showAlert({icon:'error',title:'Error',text:'Failed to mark project incomplete!'});
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
        showAlert({icon:'success',title:'Notes Saved',text:'Project notes updated!'});
        await fetchProjects();
    } else {
        showAlert({icon:'error',title:'Error',text:'Failed to save notes!'});
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
        showAlert({icon:'success',title:'Deadline Saved',text:'Project deadline updated!'});
        await fetchProjects();
    } else {
        showAlert({icon:'error',title:'Error',text:'Failed to save deadline!'});
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
  const upcoming = taskList.filter(t => t.dueDate && !t.completed && new Date(t.dueDate) >= new Date()).sort((a,b)=>new Date(a.dueDate)-new Date(b.dueDate)).slice(0,5);
  const ul = document.getElementById('upcomingDeadlines');
  if (!ul) return;
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
let activityFeedArr = [];
function addActivityFeed(msg) {
  activityFeedArr.unshift({msg,time:new Date()});
  if(activityFeedArr.length>10) activityFeedArr.pop();
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
if(taskInputRow && !document.getElementById('taskDueDate')) {
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
    const confirmDelete = confirm(`Kya aap sach me project '${project.name}' ko delete karna chahte hain?`);
    if (!confirmDelete) return;
    try {
        const res = await fetch(`/api/projects/${project._id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Project delete failed');
        showAlert({icon:'success',title:'Success',text:'Project deleted!'});
        await fetchProjects();
        // Agar delete hua project selected tha toh details hata do
        if(selectedProjectIndex === idx) {
            selectedProjectIndex = null;
            renderProjectDetails();
        }
    } catch (err) {
        showAlert({icon:'error',title:'Error',text:'Failed to delete project!'});
    }
}