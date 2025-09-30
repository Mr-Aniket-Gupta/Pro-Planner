// Data and state variables
let projects = [];
let selectedProjectIndex = null;
let taskList = [];
let sidebarTodos = [];
let sidebarNotes = '';
let activityFeedArr = [];
let calendar = null;
let isRecording = false;
let recognition = null;
let userEmails = [];
let currentOtpEmail = '';
let otpTimerInterval = null;
let otpTimeLeft = 120;

// Tooltip Portal Management
let currentTooltip = null;

function createTooltipPortal(text, element) {
    // Remove existing tooltip if any
    if (currentTooltip) {
        currentTooltip.remove();
        currentTooltip = null;
    }

    // Don't show tooltip if text is empty or same as displayed text
    if (!text || text.trim() === '') return null;
    
    // Check if text is actually truncated
    const computedStyle = window.getComputedStyle(element);
    if (computedStyle.textOverflow !== 'ellipsis' && computedStyle.overflow !== 'hidden') {
        return null; // Text is not truncated, no need for tooltip
    }

    // Create tooltip element
    const tooltip = document.createElement('div');
    tooltip.className = 'tooltip-portal';
    tooltip.textContent = text;
    
    // Add to document body
    document.body.appendChild(tooltip);
    
    // Get element position
    const rect = element.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
    
    // Position tooltip above the element
    const tooltipTop = rect.top + scrollTop - tooltip.offsetHeight - 10;
    const tooltipLeft = rect.left + scrollLeft + (rect.width / 2) - (tooltip.offsetWidth / 2);
    
    // Ensure tooltip stays within viewport
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    let finalLeft = tooltipLeft;
    let finalTop = tooltipTop;
    
    // Adjust horizontal position if tooltip goes off screen
    if (finalLeft < 10) {
        finalLeft = 10;
    } else if (finalLeft + tooltip.offsetWidth > viewportWidth - 10) {
        finalLeft = viewportWidth - tooltip.offsetWidth - 10;
    }
    
    // Adjust vertical position if tooltip goes off screen
    if (finalTop < 10) {
        finalTop = rect.bottom + scrollTop + 10;
        // Change arrow direction
        tooltip.style.setProperty('--arrow-direction', 'bottom');
    }
    
    // Set position
    tooltip.style.left = finalLeft + 'px';
    tooltip.style.top = finalTop + 'px';
    
    // Show tooltip with animation
    setTimeout(() => {
        tooltip.classList.add('show');
    }, 10);
    
    currentTooltip = tooltip;
    return tooltip;
}

function removeTooltipPortal() {
    if (currentTooltip) {
        currentTooltip.classList.remove('show');
        setTimeout(() => {
            if (currentTooltip) {
                currentTooltip.remove();
                currentTooltip = null;
            }
        }, 200);
    }
}

// Enhanced tooltip event handlers
function setupTooltipHandlers() {
    // Handle project list tooltips
    document.addEventListener('mouseover', function(e) {
        const element = e.target.closest('#projectList .truncate[title]');
        if (element && element.title) {
            createTooltipPortal(element.title, element);
        }
    });
    
    document.addEventListener('mouseout', function(e) {
        const element = e.target.closest('#projectList .truncate[title]');
        if (element) {
            removeTooltipPortal();
        }
    });
    
    // Handle task list tooltips
    document.addEventListener('mouseover', function(e) {
        const element = e.target.closest('#taskList .truncate[title]');
        if (element && element.title) {
            createTooltipPortal(element.title, element);
        }
    });
    
    document.addEventListener('mouseout', function(e) {
        const element = e.target.closest('#taskList .truncate[title]');
        if (element) {
            removeTooltipPortal();
        }
    });
    
    // Handle sidebar todo tooltips
    document.addEventListener('mouseover', function(e) {
        const element = e.target.closest('#sidebarTodoList .truncate[title]');
        if (element && element.title) {
            createTooltipPortal(element.title, element);
        }
    });
    
    document.addEventListener('mouseout', function(e) {
        const element = e.target.closest('#sidebarTodoList .truncate[title]');
        if (element) {
            removeTooltipPortal();
        }
    });
    
    // Clean up tooltips on scroll and resize
    window.addEventListener('scroll', removeTooltipPortal);
    window.addEventListener('resize', removeTooltipPortal);
}

// Toast instance for consistent notifications
const Toast = Swal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  didOpen: (toast) => {
    toast.onmouseenter = Swal.stopTimer;
    toast.onmouseleave = Swal.resumeTimer;
  }
});

// Project List Render
// Projects ko list me render karta hai
function renderProjectList() {
    const projectListEl = document.getElementById('projectList');
    projectListEl.innerHTML = '';
    if (projects.length === 0) {
        document.getElementById('emptyProjectState').style.display = 'flex';
        // Hide scrollbar when no projects
        projectListEl.style.overflowY = 'hidden';
        projectListEl.classList.add('no-scrollbar');
        projectListEl.classList.remove('has-scrollbar');
    } else {
        document.getElementById('emptyProjectState').style.display = 'none';
        projects.forEach((project, idx) => {
            const linked = isProjectLinked(project._id);
            const projectLink = getProjectSocialLink(project._id);
            let sharedLabel = project.isShared ? `<span class='ml-2 px-2 py-1 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold'>Shared</span>` : '';
            let linkedIcon = linked ? `<span class="ml-1 text-green-500 flex-shrink-0" title="Linked in Social Links">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" stroke="currentColor" stroke-width="2"/>
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" stroke="currentColor" stroke-width="2"/>
                </svg>
            </span>` : '';

            // Show URL icon only if project has a saved URL
            let urlIcon = '';
            if (projectLink && projectLink.url && projectLink.url.trim()) {
                urlIcon = `<a href="${projectLink.url}" target="_blank" class="ml-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 flex-shrink-0" title="Open Project URL (${projectLink.url})" onclick="event.stopPropagation();">
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" stroke="currentColor" stroke-width="2"/>
                        <polyline points="15,3 21,3 21,9" stroke="currentColor" stroke-width="2"/>
                        <line x1="10" y1="14" x2="21" y2="3" stroke="currentColor" stroke-width="2"/>
                    </svg>
                </a>`;
            }

            const li = document.createElement('li');
            li.className = 'flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 rounded-xl px-4 py-2 hover:bg-blue-100 dark:hover:bg-blue-800/30 cursor-pointer transition';
            li.innerHTML = `
                <span class="font-semibold text-blue-700 dark:text-blue-300 flex items-center gap-2 min-w-0 flex-1">
                  <span class="truncate cursor-help" title="${project.name}" data-tooltip="${project.name}">${project.name}</span>${sharedLabel}${!project.isShared && !project.isPublic ? ' <span style=\'color:#e02424;font-weight:bold\'>*</span>' : ''}
                  ${linkedIcon}${urlIcon}
                </span>
                <div class="flex gap-1 items-center flex-shrink-0">
                  <button onclick="selectProjectById('${project._id}')" class="text-blue-400 hover:text-blue-600 p-1 rounded transition" title="Select">
                    <svg class="w-5 h-5" fill="none" viewBox="0 0 18 18">
                      <circle cx="9" cy="9" r="8" stroke="#3B82F6" stroke-width="1.5"/>
                      <path d="M6 9l2 2 4-4" stroke="#3B82F6" stroke-width="1.5" stroke-linecap="round"/>
                    </svg>
                  </button>
                  ${project.isShared ? '' : `<button onclick="deleteProject(${idx})" class="text-red-400 hover:text-red-600 p-1 rounded transition" title="Delete">
                    <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24">
                      <rect x="5" y="7" width="14" height="12" rx="2" stroke="#ef4444" stroke-width="2"/>
                      <path d="M10 11v4M14 11v4" stroke="#ef4444" stroke-width="2" stroke-linecap="round"/>
                      <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" stroke="#ef4444" stroke-width="2"/>
                    </svg>
                  </button>`}
                </div>`;
            projectListEl.appendChild(li);
        });
        
        // Enhanced scrollbar control - always allow scrolling but hide scrollbar when not needed
        setTimeout(() => {
            const containerHeight = projectListEl.clientHeight;
            const contentHeight = projectListEl.scrollHeight;
            
            // Always enable scrolling for better UX
            projectListEl.style.overflowY = 'auto';
            
            // Add/remove scrollbar visibility class based on content
            if (contentHeight > containerHeight) {
                projectListEl.classList.add('has-scrollbar');
                projectListEl.classList.remove('no-scrollbar');
            } else {
                projectListEl.classList.add('no-scrollbar');
                projectListEl.classList.remove('has-scrollbar');
            }
        }, 10);
    }
}

// Project Details Render
// Selected project ke details card ko render karta hai
async function renderProjectDetails() {
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
    let project = projects[selectedProjectIndex];
    let access = 'both';
    let isOwner = !project.isShared;
    if (project.isShared) {
        try {
            const res = await fetch(`/api/projects/${project._id}/details`);
            if (res.ok) {
                const data = await res.json();
                project = data.project;
                access = data.access;
                isOwner = data.isOwner;
                project._access = access;
                project._isOwner = isOwner;
                project.isShared = true;
            }
        } catch (err) {
            showAlert && showAlert({ icon: 'error', title: 'Error', text: 'Failed to load shared project details!' });
        }
    }
    const detailsCard = document.getElementById('projectDetailsCard');
    const mainTaskDashboard = document.getElementById('mainTaskDashboard');
    const selectProjectMsg = document.getElementById('selectProjectMsg');
    if (detailsCard) detailsCard.style.display = '';
    if (mainTaskDashboard) mainTaskDashboard.style.display = '';
    if (selectProjectMsg) selectProjectMsg.style.display = 'none';
    // Show shared project info if applicable
    let sharedInfoDiv = document.getElementById('sharedProjectInfoMsg');
    if (!sharedInfoDiv) {
        sharedInfoDiv = document.createElement('div');
        sharedInfoDiv.id = 'sharedProjectInfoMsg';
        sharedInfoDiv.className = 'mb-2 text-indigo-700 bg-indigo-50 rounded-xl px-4 py-2 font-semibold';
        detailsCard.insertBefore(sharedInfoDiv, detailsCard.firstChild);
    }
    let message = "";
    if (!isOwner && access) {
        message = `This project is shared with you by another user. Access: ${access}`;
    }
    sharedInfoDiv.style.display = message ? '' : 'none';
    sharedInfoDiv.innerText = message;
    // Render details fields (always show all fields, use placeholders if missing)
    const projectTitle = document.getElementById('projectTitle');
    if (projectTitle) projectTitle.innerHTML = `${project.name || '-'}${project.completed ? ' <span class=\"ml-2 px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold\">Completed</span>' : ''}`;
    const projectDesc = document.getElementById('projectDesc');
    if (projectDesc) projectDesc.innerText = project.desc || project.description || 'No description provided.';
    const projectBasic = document.getElementById('projectBasic');
    if (projectBasic) projectBasic.innerHTML = '<b>Basic:</b> ' + (Array.isArray(project.basic) ? '<ul class="list-disc ml-5">' + project.basic.map(b => `<li>${b}</li>`).join('') + '</ul>' : (project.basic !== undefined && project.basic !== null ? project.basic : '-'));
    const projectAdvanced = document.getElementById('projectAdvanced');
    if (projectAdvanced) projectAdvanced.innerHTML = '<b>Advanced:</b> ' + (Array.isArray(project.advanced) ? '<ul class="list-disc ml-5">' + project.advanced.map(a => `<li>${a}</li>`).join('') + '</ul>' : (project.advanced !== undefined && project.advanced !== null ? project.advanced : '-'));
    // Hide 'Make this project private' for non-owners (read/write and read-only)
    const makePrivateDiv = document.getElementById('makeProjectPrivateDiv');
    if (makePrivateDiv) makePrivateDiv.style.display = (isOwner ? '' : 'none');
    // Notes section (Quick Notes) - Hidden in add/edit form, shown in project overview
    const projectQuickNotes = document.getElementById('projectQuickNotes');
    if (projectQuickNotes) {
        projectQuickNotes.value = project.notes || '';
        projectQuickNotes.readOnly = (project.isShared && access === 'read' && !isOwner);
        projectQuickNotes.style.height = 'auto';
        projectQuickNotes.style.height = (projectQuickNotes.scrollHeight) + 'px';
    }

    // Show Quick Notes section in project overview (not in add/edit form)
    const quickNotesSection = document.getElementById('quickNotesSection');
    if (quickNotesSection && !document.getElementById('projectModal').classList.contains('hidden')) {
        // If we're in the modal (add/edit form), hide Quick Notes
        quickNotesSection.style.display = 'none';
    } else if (quickNotesSection) {
        // If we're in project overview, show Quick Notes
        quickNotesSection.style.display = 'block';
    }
    // Save Notes button
    const saveProjectNotesBtn = document.getElementById('saveProjectNotesBtn');
    if (saveProjectNotesBtn) {
        saveProjectNotesBtn.disabled = (project.isShared && access === 'read' && !isOwner);
        saveProjectNotesBtn.style.display = (project.isShared && access === 'read' && !isOwner) ? 'none' : '';
    }
    // Progress Bar
    const progress = getProjectProgress(project._id);
    const projectProgressPercent = document.getElementById('projectProgressPercent');
    if (projectProgressPercent) projectProgressPercent.innerText = (progress !== undefined && progress !== null ? progress : 0) + '%';
    const projectProgressBar = document.getElementById('projectProgressBar');
    if (projectProgressBar) projectProgressBar.style.width = (progress !== undefined && progress !== null ? progress : 0) + '%';
    // Deadline
    const projectDeadline = document.getElementById('projectDeadline');
    if (projectDeadline) {
        projectDeadline.value = project.deadline ? new Date(project.deadline).toISOString().split('T')[0] : '';
        projectDeadline.disabled = (project.isShared && access === 'read' && !isOwner);
    }
    // Mark as Complete/Incomplete Button Toggle
    const markCompleteBtn = document.getElementById('markCompleteBtn');
    const markIncompleteBtn = document.getElementById('markIncompleteBtn');
    if (isOwner) {
        if (project.completed) {
            if (markCompleteBtn) markCompleteBtn.style.display = 'none';
            if (markIncompleteBtn) markIncompleteBtn.style.display = '';
        } else {
            if (markCompleteBtn) markCompleteBtn.style.display = '';
            if (markIncompleteBtn) markIncompleteBtn.style.display = 'none';
        }
    } else {
        if (markCompleteBtn) markCompleteBtn.style.display = 'none';
        if (markIncompleteBtn) markIncompleteBtn.style.display = 'none';
    }
    // Tasks: fetch and render for shared project
    if (project.isShared) {
        // Fetch tasks for shared project
        try {
            const res = await fetch(`/api/tasks/${project._id}`);
            if (res.ok) {
                taskList = await res.json();
            }
        } catch (err) {
            // ignore
        }
    }
    renderTasks();
    // Calendar/Chart re-render (reliable)
    requestAnimationFrame(() => {
        updateChart();
    });
    // Edit Project Button disable logic
    const editProjectBtn = document.getElementById('editProjectBtn');
    if (editProjectBtn) {
        // Disable the button if user has only read access and is not the owner
        if (project.isShared && access === 'read' && !isOwner) {
            editProjectBtn.disabled = true;
            editProjectBtn.title = 'You cannot edit this project (read access)';
            editProjectBtn.classList.add('cursor-not-allowed', 'opacity-60');
        } else {
            // Enable the button for owner or write-access users
            editProjectBtn.disabled = false;
            editProjectBtn.title = 'Edit Project';
            editProjectBtn.classList.remove('cursor-not-allowed', 'opacity-60');
        }
        // Always set the click event so the state is correct
        editProjectBtn.onclick = function (e) {
            if (editProjectBtn.disabled) {
                e.preventDefault();
                return false;
            }
            editProject();
        };
    }
}

// Project Modal
// Project add/edit modal ko show karta hai
function showProjectForm(edit = false) {
    if (!edit) {
        // Add new project
        openProjectAddModal();
        return;
    }

    let p = projects[selectedProjectIndex];
    let access = 'both';
    let isOwner = !p?.isShared;
    // For shared projects, use the latest fetched details if available
    if (p?.isShared) {
        fetch(`/api/projects/${p._id}/details`).then(async res => {
            if (res.ok) {
                const data = await res.json();
                // Use the latest details for editing
                openProjectEditModal(data.project, access, isOwner, true);
            } else {
                showAlert({ icon: 'error', title: 'Error', text: 'Failed to load shared project details!' });
            }
        });
        return;
    }
    openProjectEditModal(p, access, isOwner, false);
}

// Function to open add project modal
function openProjectAddModal() {
    document.getElementById('projectModal').classList.remove('hidden');
    document.getElementById('projectModalTitle').innerText = 'Add New Project';

    // Set access control for AI generation (always allow for new projects)
    window.currentProjectAccess = 'write';

    // Clear the form
    document.getElementById('projectFormEl').reset();
    document.getElementById('projectName').value = '';
    document.getElementById('projectDescInput').value = '';

    // Clear basic and advanced inputs
    const basicDiv = document.getElementById('basicInputs');
    const advDiv = document.getElementById('advancedInputs');
    basicDiv.innerHTML = '<input type="text" class="w-full border border-blue-100 p-3 rounded-xl bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-200 basic-input" placeholder="Basic Requirement" />';
    advDiv.innerHTML = '<input type="text" class="w-full border border-blue-100 p-3 rounded-xl bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-200 advanced-input" placeholder="Advanced Feature" />';

    // Show make private option for new projects
    const makePrivateDiv = document.getElementById('makeProjectPrivateDiv');
    if (makePrivateDiv) makePrivateDiv.style.display = '';

    // Hide Quick Notes section completely
    const quickNotesSection = document.getElementById('quickNotesSection');
    if (quickNotesSection) {
        quickNotesSection.style.display = 'none';
    }

    // Clear notes and prevent auto-focus
    const projectQuickNotes = document.getElementById('projectQuickNotes');
    if (projectQuickNotes) {
        projectQuickNotes.value = '';
        projectQuickNotes.blur(); // Remove focus from Quick Notes
    }

    // Update Generate button states (always enabled for new projects)
    updateGenerateButtonStates('write');

    // Focus on project name input instead
    setTimeout(() => {
        const projectNameInput = document.getElementById('projectName');
        if (projectNameInput) {
            projectNameInput.focus();
        }
    }, 100);
}

function openProjectEditModal(p, access, isOwner, isSharedEdit) {
    document.getElementById('projectModal').classList.remove('hidden');
    document.getElementById('projectModalTitle').innerText = 'Edit Project';
    
    // Set access control for AI generation
    window.currentProjectAccess = access;
    
    const basicDiv = document.getElementById('basicInputs');
    const advDiv = document.getElementById('advancedInputs');
    basicDiv.innerHTML = '';
    advDiv.innerHTML = '';
    document.getElementById('projectName').value = p.name || '';
    document.getElementById('projectDescInput').value = p.desc || '';
    // Prefill basic and advanced fields from latest details
    (Array.isArray(p.basic) ? p.basic : (p.basic ? [p.basic] : [])).forEach(val => addBasicInput(val));
    (Array.isArray(p.advanced) ? p.advanced : (p.advanced ? [p.advanced] : [])).forEach(val => addAdvancedInput(val));
    // Hide 'Make this project private' for non-owners and for shared project edit
    const makePrivateDiv = document.getElementById('makeProjectPrivateDiv');
    if (makePrivateDiv) makePrivateDiv.style.display = (isOwner && !isSharedEdit ? '' : 'none');
    // Hide Quick Notes section completely
    const quickNotesSection = document.getElementById('quickNotesSection');
    if (quickNotesSection) {
        quickNotesSection.style.display = 'none';
    }

    // Prefill notes if available and prevent auto-focus
    const projectQuickNotes = document.getElementById('projectQuickNotes');
    if (projectQuickNotes) {
        projectQuickNotes.value = p.notes || '';
        projectQuickNotes.blur(); // Remove focus from Quick Notes
    }

    // Update Generate button states based on access
    updateGenerateButtonStates(access);

    // Focus on project name input instead
    setTimeout(() => {
        const projectNameInput = document.getElementById('projectName');
        if (projectNameInput) {
            projectNameInput.focus();
        }
    }, 100);
}

// Project modal ko close karta hai
function closeProjectForm() {
    document.getElementById('projectModal').classList.add('hidden');
}

// Project edit button ke liye
function editProject() {
    const p = projects[selectedProjectIndex];
    let access = 'both';
    let isOwner = !p.isShared;
    if (p.isShared && p._access) {
        access = p._access;
        isOwner = p._isOwner;
    }
    if (p.isShared && access === 'read' && !isOwner) {
        showAlert({ icon: 'warning', title: 'Read Only', text: 'Aapko is project ko edit karne ki permission nahi hai.' });
        return;
    }
    showProjectForm(true);
}

// Project add/edit form submit event
// Project ko add ya update karta hai
const projectForm = document.getElementById('projectFormEl');
if (!projectForm) {
    console.error('Project form element not found!');
} else {
    console.log('Project form element found, adding event listener');
}

// Add both form submit and button click event listeners
projectForm.addEventListener('submit', handleProjectFormSubmit);
document.addEventListener('click', function(e) {
    if (e.target && e.target.form === projectForm && e.target.type === 'submit') {
        console.log('Submit button clicked directly');
        e.preventDefault();
        handleProjectFormSubmit(e);
    }
});

async function handleProjectFormSubmit(e) {
    e.preventDefault();
    console.log('Form submit event triggered'); // Debug log
    
    // Prevent duplicate submissions
    const submitBtn = e.target.querySelector('button[type="submit"]') || e.target;
    console.log('Submit button found:', submitBtn); // Debug log
    if (submitBtn.disabled) {
        console.log('Submit button is disabled, returning'); // Debug log
        return;
    }
    
    // Disable submit button to prevent duplicate submissions
    submitBtn.disabled = true;
    submitBtn.textContent = 'Saving...';
    
    try {
        const name = document.getElementById('projectName').value.trim();
        const desc = document.getElementById('projectDescInput').value.trim();
        const basic = Array.from(document.querySelectorAll('.basic-input')).map(i => i.value).filter(Boolean);
        const advanced = Array.from(document.querySelectorAll('.advanced-input')).map(i => i.value).filter(Boolean);
        // Quick Notes are now handled in project overview, not in add/edit form
        const notes = '';
        const isPublic = !document.getElementById('projectIsPrivate').checked;
        
        // Validate required fields
        if (!name) {
            showAlert({ icon: 'warning', title: 'Validation Error', text: 'Project name is required!' });
            submitBtn.disabled = false;
            submitBtn.textContent = 'Save Project';
            return;
        }
        if (!desc) {
            showAlert({ icon: 'warning', title: 'Validation Error', text: 'Project description is required!' });
            submitBtn.disabled = false;
            submitBtn.textContent = 'Save Project';
            return;
        }
        
        if (document.getElementById('projectModalTitle').innerText === 'Edit Project' && selectedProjectIndex !== null) {
        const projectId = projects[selectedProjectIndex]._id;
        const oldProject = projects[selectedProjectIndex];
        let updateData = { name, desc, basic, advanced, notes };
        // Only allow isPublic for non-shared projects (do NOT send isPublic at all for shared)
        if (!oldProject.isShared) {
            updateData.isPublic = isPublic;
        }
        if (oldProject.deadline) updateData.deadline = oldProject.deadline;
        try {
            const res = await fetch(`/api/projects/${projectId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updateData)
            });
            if (!res.ok) throw new Error('Project update failed');
            showAlert({ icon: 'success', title: 'Success', text: 'Project updated!' });
            // After update, re-fetch details for shared project to update UI
            if (oldProject.isShared) {
                await fetch(`/api/projects/${projectId}/details`).then(async res2 => {
                    if (res2.ok) {
                        const data2 = await res2.json();
                        projects[selectedProjectIndex] = { ...oldProject, ...data2.project };
                        await renderProjectDetails();
                    }
                });
            }
        } catch (err) {
            showAlert({ icon: 'error', title: 'Error', text: 'Failed to update project!' });
        }
        } else {
            // Add new project
            console.log('About to add project with data:', { name, desc, basic, advanced, notes, isPublic });
            const result = await addProject({ name, desc, basic, advanced, notes, isPublic });
            console.log('Add project result:', result);
            await fetchProjects();
        }
        
        closeProjectForm();
    } catch (error) {
        console.error('Error saving project:', error);
        showAlert({ icon: 'error', title: 'Error', text: 'Failed to save project!' });
    } finally {
        // Re-enable submit button
        submitBtn.disabled = false;
        submitBtn.textContent = 'Save Project';
    }
}

// Project select/update par default tasks fetch ho (pehle jaisa)
async function origSelectProject(idx) {
    selectedProjectIndex = idx;
    await renderProjectDetails();
    if (projects[selectedProjectIndex]) { // Check if project still exists
        await fetchTasks(projects[selectedProjectIndex]._id);
    }
}

// Task List Render
// Selected project ke tasks ko render karta hai
function renderTasks(filter = '', tag = '', priority = '') {
    const taskUl = document.getElementById('taskList');
    taskUl.innerHTML = '';
    let filtered = taskList.filter(task =>
        (selectedProjectIndex === null || task.projectId === projects[selectedProjectIndex]?._id) &&
        task.text.toLowerCase().includes(filter ? filter.toLowerCase() : '') &&
        (tag === '' || task.tag === tag) &&
        (priority === '' || task.priority === priority)
    );
    if (filtered.length === 0) {
        document.getElementById('emptyTaskState').style.display = '';
    } else {
        document.getElementById('emptyTaskState').style.display = 'none';
    }
    // Access logic
    let project = projects[selectedProjectIndex];
    let access = 'both';
    let isOwner = !project.isShared;
    if (project.isShared && project._access) {
        access = project._access;
        isOwner = project._isOwner;
    }
    // Disable add task button for read-only shared users
    const addTaskBtn = document.getElementById('addTaskBtn');
    if (addTaskBtn) {
        if (project.isShared && access === 'read' && !isOwner) {
            addTaskBtn.disabled = true;
            addTaskBtn.title = 'You cannot add tasks (read access)';
            addTaskBtn.classList.add('cursor-not-allowed', 'opacity-60');
        } else {
            addTaskBtn.disabled = false;
            addTaskBtn.title = 'Add Task';
            addTaskBtn.classList.remove('cursor-not-allowed', 'opacity-60');
        }
    }
    filtered.forEach((task, index) => {
        const li = document.createElement('li');
        li.className = 'flex items-center justify-between bg-blue-50 rounded-xl px-2 sm:px-4 py-2 shadow-sm gap-2';
        let taskBtns = '';
        // Disable task update for read-only users
        if (!(project.isShared && access === 'read' && !isOwner)) {
            taskBtns = `
              <button onclick="editTask(${index})" class="text-yellow-400 hover:text-yellow-500 transition rounded-lg p-1 sm:px-2 w-6 h-6 sm:w-auto sm:h-auto flex items-center justify-center" title="Edit">✏️</button>
              <button onclick="deleteTask(${index})" class="text-red-400 hover:text-red-500 transition rounded-lg p-1 sm:px-2 w-6 h-6 sm:w-auto sm:h-auto flex items-center justify-center" title="Delete">✖</button>
            `;
        } else {
            taskBtns = `
              <button disabled class="text-yellow-200 cursor-not-allowed rounded-lg p-1 sm:px-2 w-6 h-6 sm:w-auto sm:h-auto flex items-center justify-center" title="You cannot edit (read access)">✏️</button>
              <button disabled class="text-red-200 cursor-not-allowed rounded-lg p-1 sm:px-2 w-6 h-6 sm:w-auto sm:h-auto flex items-center justify-center" title="You cannot delete (read access)">✖</button>
            `;
        }
        // Priority badge styling
        let priorityBadge = '';
        if (task.priority) {
            const priorityColors = {
                'High': 'bg-red-100 text-red-700 border-red-200',
                'Medium': 'bg-yellow-100 text-yellow-700 border-yellow-200',
                'Low': 'bg-green-100 text-green-700 border-green-200'
            };
            const colorClass = priorityColors[task.priority] || 'bg-gray-100 text-gray-700 border-gray-200';
            // Responsive priority badge - smaller on mobile
            priorityBadge = `<span class="text-xs px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full border ${colorClass} ml-1 sm:ml-2 flex-shrink-0">${task.priority}</span>`;
        }

        // Truncate task text if too long (similar to project list)
        const maxTaskTextLength = 50; // Adjust based on your needs
        const truncatedTaskText = task.text.length > maxTaskTextLength 
            ? task.text.substring(0, maxTaskTextLength) + '...' 
            : task.text;

        li.innerHTML = `
            <div class="flex items-center gap-2 min-w-0 flex-1">
              <input type="checkbox" ${task.completed ? 'checked' : ''} onchange="toggleTask(${index})" class="accent-blue-500 flex-shrink-0" ${(project.isShared && access === 'read' && !isOwner) ? 'disabled' : ''}>
              <span class="${task.completed ? 'line-through text-gray-400' : 'text-gray-700 font-medium'} min-w-0 flex-1 truncate cursor-help" title="${task.text}" data-tooltip="${task.text}">${truncatedTaskText}</span>
              <span class="text-xs text-blue-400 ml-1 sm:ml-2 flex-shrink-0 hidden sm:inline">[${task.tag}]</span>
              ${priorityBadge}
            </div>
            <div class="flex gap-1 flex-shrink-0">
              ${taskBtns}
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
// Task add karta hai
async function addTask() {
    let project = projects[selectedProjectIndex];
    let access = 'both';
    let isOwner = !project.isShared;
    if (project.isShared && project._access) {
        access = project._access;
        isOwner = project._isOwner;
    }
    if (project.isShared && access === 'read' && !isOwner) {
        showAlert({ icon: 'warning', title: 'Read Only', text: 'You cannot add tasks to this shared project.' });
        return;
    }
    const input = document.getElementById('taskInput');
    const tag = document.getElementById('taskTag').value;
    const priority = document.getElementById('taskPriority').value;
    let dueDate = '';
    if (document.getElementById('taskDueDate')) dueDate = document.getElementById('taskDueDate').value;
    const isPublic = false; // ab task ke liye nahi bhejna
    if (input.value.trim() && selectedProjectIndex !== null) {
        await addTaskToDB({ text: input.value.trim(), tag, projectId: projects[selectedProjectIndex]._id, dueDate, priority, isPublic });
        input.value = '';
        if (document.getElementById('taskDueDate')) document.getElementById('taskDueDate').value = '';
        if (document.getElementById('taskIsPublic')) document.getElementById('taskIsPublic').checked = false;
    }
}
async function toggleTask(index) {
    let project = projects[selectedProjectIndex];
    let access = 'both';
    let isOwner = !project.isShared;
    if (project.isShared && project._access) {
        access = project._access;
        isOwner = project._isOwner;
    }
    if (project.isShared && access === 'read' && !isOwner) {
        showAlert({ icon: 'warning', title: 'Read Only', text: 'You cannot update tasks in this shared project.' });
        return;
    }
    const task = taskList[index];
    await updateTaskInDB(task._id, { completed: !task.completed }, task.projectId);
}
async function deleteTask(index) {
    let project = projects[selectedProjectIndex];
    let access = 'both';
    let isOwner = !project.isShared;
    if (project.isShared && project._access) {
        access = project._access;
        isOwner = project._isOwner;
    }
    if (project.isShared && access === 'read' && !isOwner) {
        showAlert({ icon: 'warning', title: 'Read Only', text: 'You cannot delete tasks in this shared project.' });
        return;
    }
    const task = taskList[index];
    await deleteTaskFromDB(task._id, task.projectId);
}
async function editTask(index) {
    let project = projects[selectedProjectIndex];
    let access = 'both';
    let isOwner = !project.isShared;
    if (project.isShared && project._access) {
        access = project._access;
        isOwner = project._isOwner;
    }
    if (project.isShared && access === 'read' && !isOwner) {
        showAlert({ icon: 'warning', title: 'Read Only', text: 'You cannot edit tasks in this shared project.' });
        return;
    }
    const task = taskList[index];

    // Enhanced themed Edit Task modal
    Swal.fire({
        title: '<div class="flex items-center gap-2"><svg width="24" height="24" fill="none" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="#3B82F6" stroke-width="2"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="#3B82F6" stroke-width="2"/></svg><span class="text-blue-600 font-bold">Edit Task</span></div>',
        html: `
            <div class="space-y-4 text-left">
                <div>
                    <label class="block text-sm font-semibold text-blue-600 mb-2">Task Name</label>
                    <input id="swalTaskText" class="w-full border border-blue-200 p-3 rounded-xl bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-300 text-blue-700 placeholder-blue-300 transition" value="${task.text}" placeholder="Enter task name">
                </div>
                <div>
                    <label class="block text-sm font-semibold text-blue-600 mb-2">Category</label>
                    <select id="swalTaskTag" class="w-full border border-blue-200 p-3 rounded-xl bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-300 text-blue-700 transition">
                        <option value="General" ${task.tag === 'General' ? 'selected' : ''}>📋 General</option>
                        <option value="Frontend" ${task.tag === 'Frontend' ? 'selected' : ''}>🎨 Frontend</option>
                        <option value="Backend" ${task.tag === 'Backend' ? 'selected' : ''}>⚙️ Backend</option>
                        <option value="Bug" ${task.tag === 'Bug' ? 'selected' : ''}>🐛 Bug Fix</option>
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-semibold text-blue-600 mb-2">Priority</label>
                    <select id="swalTaskPriority" class="w-full border border-blue-200 p-3 rounded-xl bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-300 text-blue-700 transition">
                        <option value="Low" ${task.priority === 'Low' ? 'selected' : ''}>🟢 Low Priority</option>
                        <option value="Medium" ${task.priority === 'Medium' ? 'selected' : ''}>🟡 Medium Priority</option>
                        <option value="High" ${task.priority === 'High' ? 'selected' : ''}>🔴 High Priority</option>
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-semibold text-blue-600 mb-2">Due Date</label>
                    <input id="swalTaskDueDate" type="date" class="w-full border border-blue-200 p-3 rounded-xl bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-300 text-blue-700 transition" value="${task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : ''}">
                </div>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: '<svg width="18" height="18" fill="none" viewBox="0 0 24 24" class="mr-2"><path d="M20 6L9 17l-5-5" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>Update Task',
        cancelButtonText: '<svg width="18" height="18" fill="none" viewBox="0 0 24 24" class="mr-2"><path d="M6 18L18 6M6 6l12 12" stroke="#6B7280" stroke-width="2" stroke-linecap="round"/></svg>Cancel',
        confirmButtonColor: '#3B82F6',
        cancelButtonColor: '#6B7280',
        background: '#f0f6ff',
        color: '#1e40af',
        customClass: {
            popup: 'rounded-2xl shadow-2xl',
            title: 'text-blue-600 font-bold text-xl',
            confirmButton: 'bg-gradient-to-r from-blue-400 to-blue-600 hover:from-blue-500 hover:to-blue-700 text-white font-semibold px-6 py-3 rounded-xl transition-all duration-200 shadow-lg',
            cancelButton: 'bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold px-6 py-3 rounded-xl transition-all duration-200'
        },
        focusConfirm: false,
        preConfirm: () => {
            const text = document.getElementById('swalTaskText').value.trim();
            if (!text) {
                Swal.showValidationMessage('Task name is required');
                return false;
            }
            return {
                text: text,
                tag: document.getElementById('swalTaskTag').value,
                priority: document.getElementById('swalTaskPriority').value,
                dueDate: document.getElementById('swalTaskDueDate').value
            }
        }
    }).then(async result => {
        if (result.isConfirmed) {
            try {
                await updateTaskInDB(task._id, {
                    text: result.value.text,
                    tag: result.value.tag,
                    priority: result.value.priority,
                    dueDate: result.value.dueDate
                }, task.projectId);

                // Show success message
                Toast.fire({
                    icon: 'success',
                    title: 'Task Updated!'
                });

                // Refresh task list
                await fetchAndRenderTasksWithFilters();
            } catch (error) {
                // Only show error if request actually failed
                const message = toReadableMessage(error?.message || error);
                Toast.fire({ icon: 'error', title: message || 'Failed to update task. Please try again.' });
            }
        }
    });
}
// Local storage me tasks save karta hai
function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(taskList));
}
// Dashboard summary/progress update karta hai
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
// Project ke tasks ka chart update karta hai
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
// Task search/filter event listeners
document.getElementById('taskSearch').addEventListener('input', function () {
    renderTasks(this.value, document.getElementById('taskTagFilter').value, document.getElementById('taskPriorityFilter').value);
});
document.getElementById('taskTagFilter').addEventListener('change', function () {
    renderTasks(document.getElementById('taskSearch').value, this.value, document.getElementById('taskPriorityFilter').value);
});
document.getElementById('taskPriorityFilter').addEventListener('change', function () {
    renderTasks(document.getElementById('taskSearch').value, document.getElementById('taskTagFilter').value, this.value);
});
// Calendar render karta hai
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
// DOMContentLoaded par initial data fetch, render, aur setup karta hai
document.addEventListener('DOMContentLoaded', async function () {
    // Initialize tooltip handlers
    setupTooltipHandlers();
    
    await fetchProjects();
    updateSummaryCards();
    if (projects.length > 0) {
        selectedProjectIndex = 0;
        await renderProjectDetails(); // Await details rendering
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
    // Load activity data from localStorage
    loadActivityFromStorage();
    
    // Start polling for real-time updates
    setInterval(pollForProjectUpdates, 15000); // Poll every 15 seconds
});

// Add More for Basic/Advanced
// Project form me basic/advanced input add karta hai
function addBasicInput(val = '') {
    const div = document.createElement('div');
    div.className = 'flex gap-2';
    div.innerHTML = `<input type="text" class="w-full border border-blue-100 p-3 rounded-xl bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-200 basic-input" placeholder="Basic Requirement" value="${val}"><button type="button" onclick="this.parentNode.remove()" class="text-red-400 hover:text-red-600 px-2 transition-colors">✖</button>`;
    document.getElementById('basicInputs').appendChild(div);
}

function addAdvancedInput(val = '') {
    const div = document.createElement('div');
    div.className = 'flex gap-2';
    div.innerHTML = `<input type="text" class="w-full border border-blue-100 p-3 rounded-xl bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-200 advanced-input" placeholder="Advanced Feature" value="${val}"><button type="button" onclick="this.parentNode.remove()" class="text-red-400 hover:text-red-600 px-2 transition-colors">✖</button>`;
    document.getElementById('advancedInputs').appendChild(div);
}

// AI Generation Functions
async function generateBasicRequirements() {
    const generateBtn = document.getElementById('generateBasicBtn');
    const projectName = document.getElementById('projectName').value.trim();
    const projectDesc = document.getElementById('projectDescInput').value.trim();
    
    if (!projectName || !projectDesc) {
        showAlert({ icon: 'warning', title: 'Missing Information', text: 'Please enter project name and description first!' });
        return;
    }
    
    // Check access control
    if (!hasEditAccess()) {
        showAlert({ icon: 'warning', title: 'Access Denied', text: 'You do not have permission to generate content for this project.' });
        return;
    }
    
    generateBtn.disabled = true;
    generateBtn.textContent = 'Generating...';
    
    try {
        const response = await fetch('/api/ai/generate-requirements', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                projectName,
                projectDesc,
                type: 'basic'
            })
        });
        
        if (!response.ok) {
            throw new Error('Failed to generate requirements');
        }
        
        const data = await response.json();
        if (data.basicRequirements && data.basicRequirements.length > 0) {
            // Add generated requirements to existing inputs
            data.basicRequirements.forEach(req => {
                if (req.trim()) {
                    addBasicInput(req.trim());
                }
            });
            showAlert({ icon: 'success', title: 'Generated!', text: `Added ${data.basicRequirements.length} basic requirements.` });
        } else {
            showAlert({ icon: 'info', title: 'No Suggestions', text: 'AI could not generate specific requirements for this project.' });
        }
    } catch (error) {
        console.error('Error generating basic requirements:', error);
        showAlert({ icon: 'error', title: 'Generation Failed', text: 'Could not generate suggestions. Please try again.' });
    } finally {
        generateBtn.disabled = false;
        generateBtn.textContent = 'Generate';
    }
}

async function generateAdvancedFeatures() {
    const generateBtn = document.getElementById('generateAdvancedBtn');
    const projectName = document.getElementById('projectName').value.trim();
    const projectDesc = document.getElementById('projectDescInput').value.trim();
    
    if (!projectName || !projectDesc) {
        showAlert({ icon: 'warning', title: 'Missing Information', text: 'Please enter project name and description first!' });
        return;
    }
    
    // Check access control
    if (!hasEditAccess()) {
        showAlert({ icon: 'warning', title: 'Access Denied', text: 'You do not have permission to generate content for this project.' });
        return;
    }
    
    generateBtn.disabled = true;
    generateBtn.textContent = 'Generating...';
    
    try {
        const response = await fetch('/api/ai/generate-requirements', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                projectName,
                projectDesc,
                type: 'advanced'
            })
        });
        
        if (!response.ok) {
            throw new Error('Failed to generate features');
        }
        
        const data = await response.json();
        if (data.advancedFeatures && data.advancedFeatures.length > 0) {
            // Add generated features to existing inputs
            data.advancedFeatures.forEach(feature => {
                if (feature.trim()) {
                    addAdvancedInput(feature.trim());
                }
            });
            showAlert({ icon: 'success', title: 'Generated!', text: `Added ${data.advancedFeatures.length} advanced features.` });
        } else {
            showAlert({ icon: 'info', title: 'No Suggestions', text: 'AI could not generate specific features for this project.' });
        }
    } catch (error) {
        console.error('Error generating advanced features:', error);
        showAlert({ icon: 'error', title: 'Generation Failed', text: 'Could not generate suggestions. Please try again.' });
    } finally {
        generateBtn.disabled = false;
        generateBtn.textContent = 'Generate';
    }
}

// Access control function
function hasEditAccess() {
    // Check if this is a new project (always allow)
    const modalTitle = document.getElementById('projectModalTitle').textContent;
    if (modalTitle === 'Add New Project') {
        return true;
    }
    
    // For edit mode, check if user has edit access
    // This would need to be set when opening the modal
    return window.currentProjectAccess !== 'read';
}

// Update Generate button states based on access level
function updateGenerateButtonStates(access) {
    const generateBasicBtn = document.getElementById('generateBasicBtn');
    const generateAdvancedBtn = document.getElementById('generateAdvancedBtn');
    
    const hasAccess = access === 'write' || access === 'both';
    
    if (generateBasicBtn) {
        generateBasicBtn.disabled = !hasAccess;
        if (!hasAccess) {
            generateBasicBtn.style.opacity = '0.5';
            generateBasicBtn.title = 'You need edit access to generate content';
        } else {
            generateBasicBtn.style.opacity = '1';
            generateBasicBtn.title = 'Generate AI-powered basic requirements';
        }
    }
    
    if (generateAdvancedBtn) {
        generateAdvancedBtn.disabled = !hasAccess;
        if (!hasAccess) {
            generateAdvancedBtn.style.opacity = '0.5';
            generateAdvancedBtn.title = 'You need edit access to generate content';
        } else {
            generateAdvancedBtn.style.opacity = '1';
            generateAdvancedBtn.title = 'Generate AI-powered advanced features';
        }
    }
}
// Utility: Convert any error-like value into a readable string
function toReadableMessage(value) {
    try {
        if (value == null) return '';
        if (typeof value === 'string') return value;
        if (value instanceof Error) return value.message || String(value);
        if (typeof value === 'object') {
            // Common API response shapes
            if (value.message) return value.message;
            if (value.error) return value.error;
            if (value.errors && Array.isArray(value.errors)) return value.errors.map(e => e.message || e).join(', ');
            return JSON.stringify(value);
        }
        return String(value);
    } catch (_) {
        return 'Unknown error occurred';
    }
}

// Modern alert (Swal) show karta hai
function showAlert({ icon = 'success', title = '', text = '', color = '#2563eb', bg = '#f0f6ff' }) {
    const readable = toReadableMessage(title || text);
    Toast.fire({ icon, title: readable });
}
// Logout par Swal confirmation
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
// Theme toggle aur localStorage logic
const themeToggleBtn = document.getElementById('themeToggleBtn');
const moonIcon = document.getElementById('moonIcon');
const sunIcon = document.getElementById('sunIcon');

// save theme in localStorage 
function setTheme(isDark) {
    const moonEl = document.getElementById('moonIcon');
    const sunEl = document.getElementById('sunIcon');
    if (isDark) {
        document.body.classList.add('dark-theme');
        if (moonEl) moonEl.style.display = 'none';
        if (sunEl) sunEl.style.display = 'block';
        localStorage.setItem('theme', 'dark');
    } else {
        document.body.classList.remove('dark-theme');
        if (moonEl) moonEl.style.display = 'block';
        if (sunEl) sunEl.style.display = 'none';
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
// Sidebar todos ko render, add, toggle, delete, save karta hai
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
        // Truncate todo text if too long
        const maxTodoTextLength = 40;
        const truncatedTodoText = todo.text.length > maxTodoTextLength 
            ? todo.text.substring(0, maxTodoTextLength) + '...' 
            : todo.text;

        li.innerHTML = `<span class="${todo.done ? 'line-through text-gray-400' : 'text-gray-700 font-medium'} truncate cursor-help" title="${todo.text}" data-tooltip="${todo.text}">${truncatedTodoText}</span>
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
    addActivityFeed(`Todo "${val}" added to personal list`, 'todo');
    await saveSidebarTodos('add');
    input.value = '';
    renderSidebarTodos();
}
async function toggleSidebarTodo(idx) {
    sidebarTodos[idx].done = !sidebarTodos[idx].done;
    addActivityFeed(`Todo "${sidebarTodos[idx].text}" marked as ${sidebarTodos[idx].done ? 'completed' : 'pending'}`, 'todo');
    await saveSidebarTodos('update');
    renderSidebarTodos();
}
async function deleteSidebarTodo(idx) {
    addActivityFeed(`Todo "${sidebarTodos[idx].text}" removed from personal list`, 'delete');
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
// Sidebar notes save karta hai
async function saveSidebarNotes() {
    sidebarNotes = document.getElementById('sidebarNotes').value;
    try {
        await fetch('/api/userdata/notes', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ notes: sidebarNotes })
        });
        showAlert({ icon: 'success', title: 'Success', text: 'Notes saved!' });
        addActivityFeed('Personal notes updated', 'update');
    } catch (err) {
        showAlert({ icon: 'error', title: 'Error', text: 'Failed to save notes!' });
    }
}
// Sidebar notes/todos initial load
// ... existing code ...

// Projects API
// Projects ko fetch, add, update, delete karta hai
async function fetchProjects() {
    window.showLoader();
    try {
        // Fetch own projects
        const resOwn = await fetch('/api/projects');
        if (!resOwn.ok) throw new Error('Failed to load projects!');
        let ownProjects = await resOwn.json();
        // Fetch shared projects
        const resShared = await fetch('/api/projects/shared-with-me');
        let sharedProjects = [];
        if (resShared.ok) {
            sharedProjects = await resShared.json();
            // Mark shared projects
            sharedProjects = sharedProjects.map(p => ({ ...p, isShared: true }));
        }
        // Merge lists
        projects = [...ownProjects, ...sharedProjects];

        // Load social links if not already loaded
        if (socialLinks.length === 0) {
            try {
                const socialRes = await fetch('/api/userdata/social-links');
                if (socialRes.ok) {
                    const socialData = await socialRes.json();
                    socialLinks = Array.isArray(socialData.socialLinks) ? socialData.socialLinks : [];
                }
            } catch (err) {
                console.error('Failed to load social links:', err);
            }
        }

        renderProjectList();
        addActivityFeed('Project list refreshed successfully', 'info');
    } catch (err) {
        showAlert({ icon: 'error', title: 'Error', text: err.message || 'Failed to load projects!' });
        console.error(err);
    } finally {
        window.hideLoader();
    }
}
async function addProject(project) {
    try {
        console.log('Adding project:', project); // Debug log
        
        const res = await fetch('/api/projects', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(project)
        });
        
        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            throw new Error(errorData.error || `HTTP ${res.status}: Project add failed`);
        }
        
        const savedProject = await res.json();
        console.log('Project saved successfully:', savedProject); // Debug log
        
        // Show success toast
        showAlert({ 
            icon: 'success', 
            title: 'Project Created! 🎉', 
            text: `"${project.name}" has been created successfully!`,
            timer: 3000,
            showConfirmButton: false
        });
        
        addActivityFeed(`Project "${project.name}" created successfully`, 'project');
        
        return savedProject;
    } catch (err) {
        console.error('Add project error:', err);
        showAlert({ 
            icon: 'error', 
            title: 'Failed to Create Project', 
            text: err.message || 'Failed to add project!' 
        });
        throw err; // Re-throw to let caller handle
    }
}
// Project update (edit)
async function updateProject(projectId, data) {
    window.showLoader();
    try {
        const res = await fetch(`/api/projects/${projectId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error('Project update failed');
        // Saare tasks ko bhi update karo
        await fetch(`/api/tasks/update-public-status/${projectId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isPublic: data.isPublic })
        });
        addActivityFeed(`Project "${data.name || projectId}" details updated`, 'update');
        await fetchProjects();
    } catch (err) {
        showAlert({ icon: 'error', title: 'Error', text: 'Failed to update project!' });
    } finally {
        window.hideLoader();
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
        window.showLoader();
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
        } finally {
            window.hideLoader();
        }
    }
}
// Tasks API
// Tasks ko fetch, add, update, delete karta hai
async function fetchTasks(projectId) {
    window.showLoader();
    const res = await fetch(`/api/tasks/${projectId}`);
    try {
        const data = await res.json();
        if (Array.isArray(data)) taskList = data;
        else if (data && Array.isArray(data.tasks)) taskList = data.tasks;
        else taskList = [];
    } catch (_) {
        taskList = [];
    }
    renderTasks();
    updateDashboardOverview();
    window.hideLoader();
}
async function addTaskToDB(task) {
    window.showLoader();
    try {
        const res = await fetch('/api/tasks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(task)
        });
        if (!res.ok) throw new Error('Task add failed');
        showAlert({ icon: 'success', title: 'Success', text: 'Task added!' });
        addActivityFeed(`Task "${task.text}" added to project`, 'task');
        await fetchTasks(task.projectId);
        updateSummaryCards();
    } catch (err) {
        showAlert({ icon: 'error', title: 'Error', text: 'Failed to add task!' });
    } finally {
        window.hideLoader();
    }
}
async function updateTaskInDB(taskId, data, projectId) {
    window.showLoader();
    try {
        const res = await fetch(`/api/tasks/${taskId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!res.ok) {
            let errMsg = 'Task update failed';
            try {
                const errData = await res.json();
                errMsg = toReadableMessage(errData);
            } catch (_) { }
            throw new Error(errMsg);
        }
        // Generate specific message based on what was updated
        if (data.completed !== undefined) {
            const status = data.completed ? 'completed' : 'marked as pending';
            addActivityFeed(`Task "${data.text || taskId}" ${status}`, 'task');
        } else {
            addActivityFeed(`Task "${data.text || taskId}" details updated`, 'update');
        }
        showAlert({ icon: 'success', title: 'Task updated!' });
        await fetchTasks(projectId);
    } catch (err) {
        showAlert({ icon: 'error', title: toReadableMessage(err) || 'Failed to update task!' });
    } finally {
        window.hideLoader();
    }
}
async function deleteTaskFromDB(taskId, projectId) {
    window.showLoader();
    try {
        const res = await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Task delete failed');
        showAlert({ icon: 'success', title: 'Success', text: 'Task deleted!' });
        // Get task name before deletion for activity feed
        const taskName = taskList.find(t => t._id === taskId)?.text || taskId;
        addActivityFeed(`Task "${taskName}" removed from project`, 'delete');
        await fetchTasks(projectId);
    } catch (err) {
        showAlert({ icon: 'error', title: 'Error', text: 'Failed to delete task!' });
    } finally {
        window.hideLoader();
    }
}

// ===== Project Complete, Deadline, Notes, Progress Bar, Priority, Quick Notes, Recent Activity, Export PDF =====
// Project progress calculate karta hai
function getProjectProgress(projectId) {
    const projectTasks = taskList.filter(t => t.projectId === projectId);
    if (projectTasks.length === 0) return 0;
    const done = projectTasks.filter(t => t.completed).length;
    return Math.round((done / projectTasks.length) * 100);
}
// Project ko complete/incomplete mark karta hai
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
        addActivityFeed(`Project "${project.name}" marked as completed! 🎉`, 'complete');
        updateSummaryCards();
    } else {
        showAlert({ icon: 'error', title: 'Error', text: 'Failed to mark project complete!' });
    }
}
// Project ko incomplete mark karta hai
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
        addActivityFeed(`Project "${project.name}" marked as incomplete`, 'update');
        updateSummaryCards();
    } else {
        showAlert({ icon: 'error', title: 'Error', text: 'Failed to mark project incomplete!' });
    }
}
// Project notes/deadline update karta hai
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
        addActivityFeed(`Project notes updated for "${project.name}"`, 'update');
        await fetchProjects();
    } else {
        showAlert({ icon: 'error', title: 'Error', text: 'Failed to save notes!' });
    }
}
// Project deadline update karta hai
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
        addActivityFeed(`Project deadline updated for "${project.name}"`, 'update');
        await fetchProjects();
    } else {
        showAlert({ icon: 'error', title: 'Error', text: 'Failed to save deadline!' });
    }
}
// Project ko PDF me export karta hai - Enhanced Professional Version
async function exportProjectPDF(projectId) {
    try {
        // Show loading state
        const exportBtn = document.getElementById('exportProjectBtn');
        if (exportBtn) {
            const originalText = exportBtn.innerHTML;
            exportBtn.innerHTML = `
                <svg class="animate-spin" width="18" height="18" fill="none" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" stroke-dasharray="31.416" stroke-dashoffset="31.416"/>
                </svg>
                Generating PDF...
            `;
            exportBtn.disabled = true;
        }

        const project = projects.find(p => p._id === projectId);
        if (!project) {
            showAlert({ icon: 'error', title: 'Project Not Found', text: 'Unable to find project for PDF export.' });
            return;
        }

        const tasks = taskList.filter(t => t.projectId === projectId);
        const doc = new window.jspdf.jsPDF();

        // Set font and styling
        doc.setFont('helvetica');
        doc.setFontSize(12);

        let yPosition = 25;
        const leftMargin = 25;
        const rightMargin = 185;
        const lineHeight = 8;
        const sectionSpacing = 20;

        // ===== HEADER =====
        doc.setFontSize(24);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 64, 175); // Blue color
        doc.text('PROJECT REPORT', 105, yPosition, { align: 'center' });

        yPosition += 25;

        // ===== PROJECT NAME =====
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 64, 175);
        doc.text('Project Name', leftMargin, yPosition);
        yPosition += 8;

        doc.setFontSize(14);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0, 0, 0);
        doc.text(project.name, leftMargin + 5, yPosition);
        yPosition += sectionSpacing;

        // ===== PROJECT DESCRIPTION =====
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 64, 175);
        doc.text('Project Description', leftMargin, yPosition);
        yPosition += 8;

        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0, 0, 0);

        // Handle long descriptions with word wrapping
        const descLines = doc.splitTextToSize(project.desc || 'No description available', rightMargin - leftMargin - 10);
        descLines.forEach(line => {
            doc.text(line, leftMargin + 5, yPosition);
            yPosition += 6;
        });
        yPosition += sectionSpacing;

        // ===== FEATURES SECTION (TWO COLUMN LAYOUT) =====
        const hasBasicFeatures = project.basic && project.basic.length > 0;
        const hasAdvancedFeatures = project.advanced && project.advanced.length > 0;

        if (hasBasicFeatures || hasAdvancedFeatures) {
            doc.setFontSize(16);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(30, 64, 175);
            doc.text('Project Features', leftMargin, yPosition);
            yPosition += 15;

            // Calculate column positions
            const colWidth = (rightMargin - leftMargin - 10) / 2;
            const leftColX = leftMargin + 5;
            const rightColX = leftMargin + 5 + colWidth + 10;

            // Basic Features Column
            if (hasBasicFeatures) {
                doc.setFontSize(12);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(30, 64, 175);
                doc.text('Basic Features:', leftColX, yPosition);
                yPosition += 8;

                doc.setFontSize(10);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(0, 0, 0);

                project.basic.forEach(feature => {
                    if (feature && feature.trim()) {
                        doc.text(`• ${feature.trim()}`, leftColX + 5, yPosition);
                        yPosition += 5;
                    }
                });
            }

            // Advanced Features Column
            if (hasAdvancedFeatures) {
                // Calculate the starting Y position for advanced features
                const advancedStartY = yPosition - (hasBasicFeatures ? project.basic.length * 5 + 8 : 0);

                doc.setFontSize(12);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(30, 64, 175);
                doc.text('Advanced Features:', rightColX, advancedStartY);

                doc.setFontSize(10);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(0, 0, 0);

                let advancedY = advancedStartY + 8;
                project.advanced.forEach(feature => {
                    if (feature && feature.trim()) {
                        doc.text(`• ${feature.trim()}`, rightColX + 5, advancedY);
                        advancedY += 5;
                    }
                });

                // Update main Y position to the maximum of both columns
                yPosition = Math.max(yPosition, advancedY);
            }

            // Move to next section
            yPosition += sectionSpacing;
        }

        // ===== PROJECT DEADLINE =====
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 64, 175);
        doc.text('Project Deadline', leftMargin, yPosition);
        yPosition += 8;

        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0, 0, 0);
        const deadline = project.deadline ? new Date(project.deadline).toLocaleDateString() : 'No deadline set';
        doc.text(deadline, leftMargin + 5, yPosition);
        yPosition += sectionSpacing;

        // ===== PROJECT PROGRESS =====
        const progress = getProjectProgress(projectId);
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 64, 175);
        doc.text('Project Progress', leftMargin, yPosition);
        yPosition += 8;

        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0, 0, 0);
        doc.text(`${progress}% Complete`, leftMargin + 5, yPosition);
        yPosition += sectionSpacing;

        // ===== TASKS TABLE =====
        if (tasks.length > 0) {
            doc.setFontSize(16);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(30, 64, 175);
            doc.text('Project Tasks', leftMargin, yPosition);
            yPosition += 8;

            // Add task count
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(107, 114, 128);
            doc.text(`Total Tasks: ${tasks.length} | Completed: ${tasks.filter(t => t.completed).length} | Pending: ${tasks.filter(t => !t.completed).length}`, leftMargin + 5, yPosition);
            yPosition += 15;

            // Calculate column widths for better fit
            const tableWidth = rightMargin - leftMargin;
            const taskNameWidth = tableWidth * 0.35;
            const tagWidth = tableWidth * 0.20;
            const priorityWidth = tableWidth * 0.20;
            const dueDateWidth = tableWidth * 0.15;
            const statusWidth = tableWidth * 0.10;

            // Table headers
            doc.setFontSize(9);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(255, 255, 255);
            doc.setFillColor(59, 130, 246); // Blue background

            // Header row
            doc.rect(leftMargin, yPosition - 8, tableWidth, 8, 'F');
            doc.text('Task Name', leftMargin + 3, yPosition - 2);
            doc.text('Tag', leftMargin + taskNameWidth + 3, yPosition - 2);
            doc.text('Priority', leftMargin + taskNameWidth + tagWidth + 3, yPosition - 2);
            doc.text('Due Date', leftMargin + taskNameWidth + tagWidth + priorityWidth + 3, yPosition - 2);
            doc.text('Status', leftMargin + taskNameWidth + tagWidth + priorityWidth + dueDateWidth + 3, yPosition - 2);

            yPosition += 2;

            // Table content
            doc.setFontSize(8);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(0, 0, 0);
            doc.setFillColor(255, 255, 255);

            tasks.forEach((task, index) => {
                // Alternate row colors
                if (index % 2 === 0) {
                    doc.setFillColor(248, 250, 252); // Light gray
                } else {
                    doc.setFillColor(255, 255, 255); // White
                }

                doc.rect(leftMargin, yPosition - 8, tableWidth, 8, 'F');

                // Task name (truncated if too long)
                const maxTaskNameLength = Math.floor(taskNameWidth / 4); // Approximate characters per unit
                const taskName = task.text.length > maxTaskNameLength ? task.text.substring(0, maxTaskNameLength - 3) + '...' : task.text;
                doc.text(taskName, leftMargin + 3, yPosition - 2);

                // Tag (truncated if too long)
                const tag = (task.tag || 'General').substring(0, 8);
                doc.text(tag, leftMargin + taskNameWidth + 3, yPosition - 2);

                // Priority with color coding
                const priority = (task.priority || 'Low').substring(0, 6);
                if (priority === 'High') {
                    doc.setTextColor(220, 38, 38); // Red
                } else if (priority === 'Medium') {
                    doc.setTextColor(245, 158, 11); // Orange
                } else {
                    doc.setTextColor(59, 130, 246); // Blue
                }
                doc.text(priority, leftMargin + taskNameWidth + tagWidth + 3, yPosition - 2);
                doc.setTextColor(0, 0, 0);

                // Due date (shortened format)
                const dueDate = task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-GB') : 'N/A';
                doc.text(dueDate, leftMargin + taskNameWidth + tagWidth + priorityWidth + 3, yPosition - 2);

                // Status
                const status = task.completed ? 'Done' : 'Pending';
                doc.text(status, leftMargin + taskNameWidth + tagWidth + priorityWidth + dueDateWidth + 3, yPosition - 2);

                yPosition += 8;

                // Check if we need a new page
                if (yPosition > 250) {
                    doc.addPage();
                    yPosition = 20;

                    // Add header to new page
                    doc.setFontSize(12);
                    doc.setFont('helvetica', 'bold');
                    doc.setTextColor(30, 64, 175);
                    doc.text(`Project: ${project.name} - Tasks (Continued)`, leftMargin, yPosition);
                    yPosition += 15;
                }
            });

            yPosition += sectionSpacing;
        }

        // ===== QUICK NOTES =====
        if (project.notes && project.notes.trim()) {
            doc.setFontSize(16);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(30, 64, 175);
            doc.text('Quick Notes', leftMargin, yPosition);
            yPosition += 8;

            doc.setFontSize(11);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(0, 0, 0);

            // Handle long notes with word wrapping and proper padding
            const notesLines = doc.splitTextToSize(project.notes, rightMargin - leftMargin - 20);
            notesLines.forEach(line => {
                doc.text(line, leftMargin + 10, yPosition);
                yPosition += 7;
            });
            yPosition += sectionSpacing;
        }

        // ===== FOOTER =====
        doc.setFontSize(10);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(107, 114, 128); // Gray
        doc.text(`Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, 105, 280, { align: 'center' });
        doc.text('ProPlanner - Professional Project Management', 105, 285, { align: 'center' });

        // Save the PDF
        const fileName = `${project.name.replace(/[^a-zA-Z0-9]/g, '_')}_project_report.pdf`;
        doc.save(fileName);

        // Show success message
        showAlert({
            icon: 'success',
            title: 'PDF Exported Successfully!',
            text: `Project report has been saved as "${fileName}"`
        });

    } catch (error) {
        console.error('PDF Export Error:', error);
        showAlert({
            icon: 'error',
            title: 'Export Failed',
            text: 'Failed to generate PDF. Please try again.'
        });
    } finally {
        // Restore button state
        const exportBtn = document.getElementById('exportProjectBtn');
        if (exportBtn) {
            exportBtn.innerHTML = `
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                Export as PDF
            `;
            exportBtn.disabled = false;
        }
    }
}

// ===== Dashboard Summary Cards =====
// Dashboard ke summary cards update karta hai
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
// Pie chart update karta hai
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
// Doughnut chart update karta hai
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
// Upcoming deadlines update karta hai
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
// Enhanced Activity feed update/add karta hai with real-time chart updates
function addActivityFeed(msg, type = 'info') {
    const activityEntry = { 
        msg, 
        time: new Date(), 
        type,
        date: new Date().toDateString() // Add date for easier filtering
    };
    activityFeedArr.unshift(activityEntry);
    if (activityFeedArr.length > 50) activityFeedArr.pop(); // Keep more entries for better chart data
    
    updateActivityFeed();
    
    // Update line chart in real-time
    if (typeof updateLineChart === 'function') {
        setTimeout(() => {
            updateLineChart();
        }, 100); // Small delay to ensure data is processed
    }
    
    // Save activity to localStorage for persistence
    saveActivityToStorage();
}

// Save activity data to localStorage
function saveActivityToStorage() {
    try {
        localStorage.setItem('proplanner_activity_feed', JSON.stringify(activityFeedArr));
    } catch (error) {
        console.warn('Could not save activity to localStorage:', error);
    }
}

// Load activity data from localStorage
function loadActivityFromStorage() {
    try {
        const stored = localStorage.getItem('proplanner_activity_feed');
        if (stored) {
            const parsed = JSON.parse(stored);
            // Convert date strings back to Date objects
            activityFeedArr = parsed.map(activity => ({
                ...activity,
                time: new Date(activity.time),
                date: activity.date || new Date(activity.time).toDateString()
            }));
        }
    } catch (error) {
        console.warn('Could not load activity from localStorage:', error);
        activityFeedArr = [];
    }
}

// Helper function to format relative time
function formatRelativeTime(date) {
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) {
        return 'Just now';
    } else if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60);
        return `${minutes} min${minutes > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 86400) {
        const hours = Math.floor(diffInSeconds / 3600);
        return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 172800) {
        return 'Yesterday';
    } else {
        const days = Math.floor(diffInSeconds / 86400);
        return `${days} day${days > 1 ? 's' : ''} ago`;
    }
}

function updateActivityFeed() {
    const ul = document.getElementById('activityFeed');
    if (!ul) return;
    ul.innerHTML = '';
    if (activityFeedArr.length === 0) {
        ul.innerHTML = '<li class="text-gray-500 italic">No recent activity</li>';
        return;
    }
    activityFeedArr.forEach(a => {
        const li = document.createElement('li');
        li.className = 'flex items-center justify-between py-2 px-3 rounded-lg hover:bg-blue-50 transition-colors';

        // Activity type icons
        const icons = {
            'project': '📁',
            'task': '✅',
            'todo': '📝',
            'complete': '🎉',
            'delete': '🗑️',
            'update': '✏️',
            'info': 'ℹ️'
        };

        const icon = icons[a.type] || icons.info;

        li.innerHTML = `
            <div class="flex items-center gap-2">
                <span class="text-lg">${icon}</span>
                <span class="text-sm text-gray-700">${a.msg}</span>
            </div>
            <span class="text-xs text-gray-400 font-medium">${formatRelativeTime(a.time)}</span>
        `;
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
        window.showLoader();
        try {
            const res = await fetch(`/api/projects/${project._id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Project delete failed');
            showAlert({ icon: 'success', title: 'Success', text: 'Project deleted!' });
            addActivityFeed(`Project "${project.name}" deleted permanently`, 'delete');
            await fetchProjects();
            // Agar delete hua project selected tha toh details hata do
            if (selectedProjectIndex === idx) {
                selectedProjectIndex = null;
                renderProjectDetails();
            }
        } catch (err) {
            showAlert({ icon: 'error', title: 'Error', text: 'Failed to delete project!' });
        } finally {
            window.hideLoader();
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
    const tag = document.getElementById('taskTagFilter').value;
    const priority = document.getElementById('taskPriorityFilter').value;
    const params = new URLSearchParams({ projectId, q, tag, priority });
    const res = await fetch(`/api/tasks/search?${params.toString()}`);
    try {
        const data = await res.json();
        if (Array.isArray(data)) taskList = data;
        else if (data && Array.isArray(data.tasks)) taskList = data.tasks;
        else taskList = [];
    } catch (_) {
        taskList = [];
    }
    renderTasks(q, tag, priority);
}

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



// ======= Modular Settings Forms =======
// Profile Form
const profileForm = document.getElementById('profileForm');
if (profileForm) {
    profileForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        const name = document.getElementById('settingsName').value;

        if (!name.trim()) {
            Toast.fire({ icon: 'error', title: 'Please enter a name.' });
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
                Toast.fire({ icon: 'success', title: 'Profile updated successfully.' });
                prefillSettingsModal();
            } else {
                Toast.fire({ icon: 'error', title: data.message || 'Update failed.' });
            }
        } catch (error) {
            console.error('Profile update error:', error);
            Toast.fire({ icon: 'error', title: 'Failed to update profile. Please try again.' });
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
                <button onclick="removeEmail('${emailObj.email}')" class="text-red-500 hover:text-red-700 text-sm">Remove</button>
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
                    Toast.fire({ icon: 'warning', title: 'Please enter an email address.' });
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
                        Toast.fire({ icon: 'error', title: data.message });
                    }
                } catch (error) {
                    Toast.fire({ icon: 'error', title: 'Failed to send OTP. Please try again.' });
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
            Toast.fire({ icon: 'success', title: 'Email verified successfully.' });
            closeOtpModal();
            await loadUserEmails();
        } else {
            Toast.fire({ icon: 'error', title: data.message });
            document.getElementById('verifyOtpBtn').disabled = false;
        }
    } catch (error) {
        Toast.fire({ icon: 'error', title: 'Failed to verify OTP. Please try again.' });
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
            Toast.fire({ icon: 'error', title: data.message });
        }
    } catch (error) {
        Toast.fire({ icon: 'error', title: 'Failed to resend OTP. Please try again.' });
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
            Toast.fire({ icon: 'success', title: 'Primary email updated successfully.' });
            await loadUserEmails();
        } else {
            Toast.fire({ icon: 'error', title: data.message });
        }
    } catch (error) {
        Toast.fire({ icon: 'error', title: 'Failed to update primary email. Please try again.' });
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
            Toast.fire({ icon: 'success', title: 'Email removed successfully.' });
            await loadUserEmails();
        } else {
            Toast.fire({ icon: 'error', title: data.message });
        }
    } catch (error) {
        Toast.fire({ icon: 'error', title: 'Failed to remove email. Please try again.' });
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
        Toast.fire({ icon: 'warning', title: 'Please enter a valid 6-digit OTP.' });
        return;
    }
    const verifyBtn = document.getElementById('verifyOtpBtn');
    const prevText = verifyBtn.innerHTML;
    verifyBtn.disabled = true;
    verifyBtn.innerHTML = '<span class="inline-flex items-center gap-2 justify-center w-full"><svg class="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path></svg> Verifying...</span>';
    try {
        const res = await fetch('/api/userdata/email/verify-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: currentOtpEmail, otp })
        });
        const data = await res.json();
        if (data.success) {
            Toast.fire({ icon: 'success', title: 'Email verified successfully.' });
            closeOtpModal();
            await loadUserEmails();
        } else {
            Toast.fire({ icon: 'error', title: data.message });
            verifyBtn.disabled = false;
            verifyBtn.innerHTML = prevText;
        }
    } catch (error) {
        Toast.fire({ icon: 'error', title: 'Failed to verify OTP. Please try again.' });
        verifyBtn.disabled = false;
        verifyBtn.innerHTML = prevText;
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
            Toast.fire({ icon: 'success', title: 'OTP resent! Please check your email.' });
            startOtpTimer();
        } else {
            Toast.fire({ icon: 'error', title: data.message });
            document.getElementById('resendOtpBtn').disabled = false;
        }
    } catch (error) {
        Toast.fire({ icon: 'error', title: 'Failed to resend OTP. Please try again.' });
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
    
    // Direct save button handler as backup
    document.addEventListener('click', function(e) {
        if (e.target && e.target.textContent === 'Save Project' && e.target.type === 'submit') {
            console.log('Direct save button click detected');
            e.preventDefault();
            handleProjectFormSubmit(e);
        }
    });
    
    // Test function for debugging
    window.testProjectSave = async function() {
        console.log('Testing project save...');
        try {
            const testProject = {
                name: 'Test Project',
                desc: 'This is a test project',
                basic: ['Test basic requirement'],
                advanced: ['Test advanced feature'],
                notes: '',
                isPublic: true
            };
            const result = await addProject(testProject);
            console.log('Test project save result:', result);
        } catch (error) {
            console.error('Test project save error:', error);
        }
    };
    
    // Test function for generating sample activity data
    window.generateSampleActivity = function() {
        console.log('Generating sample activity data...');
        const today = new Date();
        
        // Generate activities for the last 7 days
        for (let i = 0; i < 7; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() - i);
            
            // Generate 0-5 random activities per day
            const activityCount = Math.floor(Math.random() * 6);
            
            for (let j = 0; j < activityCount; j++) {
                const activityTime = new Date(date);
                activityTime.setHours(Math.floor(Math.random() * 24));
                activityTime.setMinutes(Math.floor(Math.random() * 60));
                
                const activities = [
                    'Project created',
                    'Task completed',
                    'Task added',
                    'Project updated',
                    'Notes saved',
                    'Deadline set',
                    'Todo completed',
                    'Project shared'
                ];
                
                const randomActivity = activities[Math.floor(Math.random() * activities.length)];
                addActivityFeed(`Sample: ${randomActivity}`, 'info');
            }
        }
        
        console.log('Sample activity data generated!');
    };
    
    // Handle window resize for responsive project list
    let resizeTimeout;
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            // Re-render project list to adjust scrollbar
            if (projects.length > 0) {
                renderProjectList();
            }
        }, 150);
    });

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

    // Add basic input button (prevent duplicate listeners)
    const addBasicInputBtn = document.getElementById('addBasicInputBtn');
    if (addBasicInputBtn) {
        // Remove existing listeners to prevent duplicates
        addBasicInputBtn.replaceWith(addBasicInputBtn.cloneNode(true));
        const newAddBasicInputBtn = document.getElementById('addBasicInputBtn');
        newAddBasicInputBtn.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            addBasicInput();
        });
    }

    // Add advanced input button (prevent duplicate listeners)
    const addAdvancedInputBtn = document.getElementById('addAdvancedInputBtn');
    if (addAdvancedInputBtn) {
        // Remove existing listeners to prevent duplicates
        addAdvancedInputBtn.replaceWith(addAdvancedInputBtn.cloneNode(true));
        const newAddAdvancedInputBtn = document.getElementById('addAdvancedInputBtn');
        newAddAdvancedInputBtn.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
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
        // Declare Sortable instances at top level for access by other functions
        let projectsSortable, tasksSortable, todosSortable;
        
        // Projects Drag & Drop with double-click activation
        projectsSortable = new Sortable(document.getElementById('projectList'), {
            animation: 150,
            disabled: true, // Initially disabled
            onEnd: function (evt) {
                if (evt.oldIndex === evt.newIndex) return;
                const moved = projects.splice(evt.oldIndex, 1)[0];
                projects.splice(evt.newIndex, 0, moved);
                renderProjectList();
                // Disable dragging after operation is complete
                projectsSortable.option('disabled', true);
                showDragModeNotification('Drag mode disabled', 'info');
                // TODO: Backend में ऑर्डर सेव करना हो तो यहाँ API कॉल करें
            }
        });

        // Enable dragging on double-click for projects
        document.getElementById('projectList').addEventListener('dblclick', function(e) {
            e.preventDefault();
            e.stopPropagation();
            if (e.target.closest('li')) {
                projectsSortable.option('disabled', false);
                // Show visual feedback that dragging is enabled
                const listItem = e.target.closest('li');
                listItem.classList.add('drag-mode-enabled');
                showDragModeNotification('Drag mode enabled - Drag to reorder projects', 'success');
                // Auto-disable after 5 seconds if no drag occurs
                setTimeout(() => {
                    projectsSortable.option('disabled', true);
                    document.querySelectorAll('#projectList li').forEach(li => {
                        li.classList.remove('drag-mode-enabled');
                    });
                    showDragModeNotification('Drag mode disabled', 'info');
                }, 5000);
            }
        });

        // Cancel drag mode when clicking outside
        document.addEventListener('click', function(e) {
            if (!e.target.closest('#projectList li') && !e.target.closest('#taskList li') && !e.target.closest('#sidebarTodoList li')) {
                if (projectsSortable) projectsSortable.option('disabled', true);
                if (tasksSortable) tasksSortable.option('disabled', true);
                if (todosSortable) todosSortable.option('disabled', true);
                document.querySelectorAll('#projectList li, #taskList li, #sidebarTodoList li').forEach(li => {
                    li.classList.remove('drag-mode-enabled');
                });
            }
        });

        // Tasks Drag & Drop with double-click activation
        tasksSortable = new Sortable(document.getElementById('taskList'), {
            animation: 150,
            disabled: true, // Initially disabled
            onEnd: function (evt) {
                if (evt.oldIndex === evt.newIndex) return;
                // सिर्फ वही टास्क्स जो दिख रहे हैं (फिल्टर के बाद)
                let filter = document.getElementById('taskSearch')?.value || '';
                let tag = document.getElementById('taskTagFilter')?.value || '';
                const safeList = Array.isArray(taskList) ? taskList : [];
                let filtered = safeList.filter(task =>
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
                taskList = safeList.sort((a, b) => {
                    let ai = newOrder.indexOf(a._id);
                    let bi = newOrder.indexOf(b._id);
                    if (ai === -1) ai = 9999;
                    if (bi === -1) bi = 9999;
                    return ai - bi;
                });
                renderTasks(filter, tag);
                // Disable dragging after operation is complete
                tasksSortable.option('disabled', true);
                showDragModeNotification('Drag mode disabled', 'info');
                // TODO: Backend में ऑर्डर सेव करना हो तो यहाँ API कॉल करें
            }
        });

        // Enable dragging on double-click for tasks
        document.getElementById('taskList').addEventListener('dblclick', function(e) {
            e.preventDefault();
            e.stopPropagation();
            if (e.target.closest('li')) {
                tasksSortable.option('disabled', false);
                // Show visual feedback that dragging is enabled
                const listItem = e.target.closest('li');
                listItem.classList.add('drag-mode-enabled');
                showDragModeNotification('Drag mode enabled - Drag to reorder tasks', 'success');
                // Auto-disable after 5 seconds if no drag occurs
                setTimeout(() => {
                    tasksSortable.option('disabled', true);
                    document.querySelectorAll('#taskList li').forEach(li => {
                        li.classList.remove('drag-mode-enabled');
                    });
                    showDragModeNotification('Drag mode disabled', 'info');
                }, 5000);
            }
        });
    }
});

// ======= Sidebar Todos Drag & Drop with double-click activation =======
document.addEventListener('DOMContentLoaded', function () {
    if (window.Sortable) {
        // पहले से प्रोजेक्ट्स/टास्क्स के लिए Sortable है, अब Todos के लिए:
        todosSortable = new Sortable(document.getElementById('sidebarTodoList'), {
            animation: 150,
            disabled: true, // Initially disabled
            onEnd: function (evt) {
                if (evt.oldIndex === evt.newIndex) return;
                const moved = sidebarTodos.splice(evt.oldIndex, 1)[0];
                sidebarTodos.splice(evt.newIndex, 0, moved);
                renderSidebarTodos();
                saveSidebarTodos('update');
                // Disable dragging after operation is complete
                todosSortable.option('disabled', true);
                showDragModeNotification('Drag mode disabled', 'info');
            }
        });

        // Enable dragging on double-click for todos
        document.getElementById('sidebarTodoList').addEventListener('dblclick', function(e) {
            e.preventDefault();
            e.stopPropagation();
            if (e.target.closest('li')) {
                todosSortable.option('disabled', false);
                // Show visual feedback that dragging is enabled
                const listItem = e.target.closest('li');
                listItem.classList.add('drag-mode-enabled');
                showDragModeNotification('Drag mode enabled - Drag to reorder todos', 'success');
                // Auto-disable after 5 seconds if no drag occurs
                setTimeout(() => {
                    todosSortable.option('disabled', true);
                    document.querySelectorAll('#sidebarTodoList li').forEach(li => {
                        li.classList.remove('drag-mode-enabled');
                    });
                    showDragModeNotification('Drag mode disabled', 'info');
                }, 5000);
            }
        });
    }
});

// Project public/private toggle function
toggleProjectVisibility = async function (projectId, newStatus) {
    const project = projects.find(p => p._id === projectId);
    if (!project) return;
    try {
        await updateProject(projectId, { ...project, isPublic: newStatus });
        showAlert({ icon: 'success', title: 'Updated', text: `Project is now ${newStatus ? 'Public' : 'Private'}` });
    } catch (err) {
        showAlert({ icon: 'error', title: 'Error', text: 'Failed to update visibility!' });
    }
    await fetchProjects();
}

function showLoader() {
    document.getElementById('universalLoader').style.display = '';
}
function hideLoader() {
    document.getElementById('universalLoader').style.display = 'none';
}
window.showLoader = showLoader;
window.hideLoader = hideLoader;

// --- Real-time Polling for Project Updates ---
async function pollForProjectUpdates() {
    const currentProjectId = selectedProjectIndex !== null && projects[selectedProjectIndex] ? projects[selectedProjectIndex]._id : null;
    try {
        const resOwn = await fetch('/api/projects');
        if (!resOwn.ok) return; // Fail silently on poll
        const ownProjects = await resOwn.json();
        const resShared = await fetch('/api/projects/shared-with-me');
        let sharedProjects = [];
        if (resShared.ok) {
            sharedProjects = await resShared.json();
            sharedProjects = sharedProjects.map(p => ({ ...p, isShared: true }));
        }
        const newProjects = [...ownProjects, ...sharedProjects];
        // Only update UI if there's a change
        if (JSON.stringify(projects) !== JSON.stringify(newProjects)) {
            projects = newProjects;
            renderProjectList();
            if (currentProjectId) {
                const newIndex = projects.findIndex(p => p._id === currentProjectId);
                selectedProjectIndex = newIndex; // Becomes -1 if revoked
                await renderProjectDetails(); // Re-render details or clear view
            }
        }
    } catch (err) {
        console.error("Project polling failed:", err); // Log error but don't alert user
    }
}

// ======= Settings Hub (New UI) =======
const settingsHubModal = document.getElementById('settingsHubModal');
const settingsBtn = document.getElementById('settingsBtn');
const closeSettingsHubBtn = document.getElementById('closeSettingsHubBtn');
const settingsHubNav = document.getElementById('settingsHubNav');
const settingsHubContent = document.getElementById('settingsHubContent');

const settingsNavItems = [
    { id: 'profile', icon: '👤', text: 'Profile' },
    { id: 'emails', icon: '📧', text: 'Emails' },
    { id: 'social', icon: '🌐', text: 'Social Media' },
    { id: 'preferences', icon: '⚙️', text: 'Preferences' },
];
let currentSettingsTab = 'profile';

function openSettingsHub() {
    settingsHubModal.classList.remove('hidden');
    setTimeout(() => { settingsHubModal.style.transform = 'translateX(0)'; }, 10);
    renderSettingsNav();
    renderSettingsContent(currentSettingsTab);
}
function closeSettingsHub() {
    settingsHubModal.style.transform = 'translateX(100%)';
    setTimeout(() => { settingsHubModal.classList.add('hidden'); }, 300);
}
function renderSettingsNav() {
    settingsHubNav.innerHTML = settingsNavItems.map(item => `
        <a href="#" class="settings-nav-item flex items-center p-2 rounded-lg hover:bg-gray-200 text-gray-700 relative ${currentSettingsTab === item.id ? 'active' : ''}" data-tab="${item.id}">
            <span class="text-xl">${item.icon}</span>
            <span class="ml-3 hidden md:block">${item.text}</span>
        </a>
    `).join('');
    settingsHubNav.querySelectorAll('.settings-nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            currentSettingsTab = item.getAttribute('data-tab');
            renderSettingsNav();
            renderSettingsContent(currentSettingsTab);
        });
    });
}
function renderSettingsContent(tabId) {
    switch (tabId) {
        case 'profile':
            settingsHubContent.innerHTML = `
                <h2 class="text-xl font-bold text-blue-600 mb-4">Profile</h2>
                <form id="profileForm" class="space-y-4 max-w-lg">
                    <input type="text" id="settingsName" placeholder="Full Name" class="w-full border border-blue-100 p-3 rounded-xl bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-200 text-base md:text-lg" required />
                    <button type="submit" class="w-full bg-gradient-to-r from-blue-400 to-blue-600 text-white px-4 py-2 rounded-xl font-semibold shadow hover:from-blue-500 hover:to-blue-700 transition text-base md:text-lg">Update Profile</button>
                </form>
            `;
            prefillSettingsModal();
            document.getElementById('profileForm').addEventListener('submit', async function (e) {
                e.preventDefault();
                const name = document.getElementById('settingsName').value;
                if (!name.trim()) {
                    Toast.fire({ icon: 'error', title: 'Please enter a name.' });
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
                        Toast.fire({ icon: 'success', title: 'Profile updated successfully.' });
                        prefillSettingsModal();
                    } else {
                        Toast.fire({ icon: 'error', title: data.message || 'Update failed.' });
                    }
                } catch (error) {
                    Toast.fire({ icon: 'error', title: 'Failed to update profile. Please try again.' });
                }
            });
            break;
        case 'emails':
            settingsHubContent.innerHTML = `
                <h2 class="text-xl font-bold text-blue-600 mb-4">Emails</h2>
                <div>
                    <label class="block text-blue-500 font-semibold mb-1">Your Emails</label>
                    <div id="emailList" class="space-y-2 mb-4"></div>
                    <div class="flex gap-2 mt-2 flex-col sm:flex-row">
                        <input type="email" id="addEmailInput" placeholder="Add new email" class="flex-1 border border-blue-100 p-3 rounded-xl bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-200 text-base" />
                        <button type="button" id="addEmailBtn" class="bg-blue-500 text-white px-3 py-1 rounded-xl font-semibold hover:bg-blue-600 transition text-base">Add Email</button>
                    </div>
                    <p class="text-sm text-gray-600 mt-2">You can login with any of your verified emails using the same password.</p>
                </div>
            `;
            loadUserEmails();
            document.getElementById('addEmailBtn').addEventListener('click', async function () {
                const emailInput = document.getElementById('addEmailInput');
                const email = emailInput.value.trim();
                        if (!email) {
            Toast.fire({ icon: 'warning', title: 'Please enter an email address.' });
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
                        Toast.fire({ icon: 'error', title: data.message });
                    }
                } catch (error) {
                    Toast.fire({ icon: 'error', title: 'Failed to send OTP. Please try again.' });
                }
            });
            break;
        case 'preferences':
            settingsHubContent.innerHTML = `
                <h2 class="text-xl font-bold text-blue-600 mb-4">Preferences</h2>
                <div class="flex items-center gap-4 mb-6">
                    <span class="font-semibold text-blue-700">Theme:</span>
                    <button id="themeToggleBtn" title="Dark/Light Theme Toggle" class="p-2 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-600 transition flex items-center justify-center">
                        <svg id="moonIcon" width="20" height="20" fill="none" viewBox="0 0 24 24" style="display:block;">
                            <path d="M21 12.79A9 9 0 1111.21 3a7 7 0 109.79 9.79z" fill="#2563eb" />
                        </svg>
                        <svg id="sunIcon" width="20" height="20" fill="none" viewBox="0 0 24 24" style="display:none;">
                            <circle cx="12" cy="12" r="5" fill="#fbbf24" />
                            <g stroke="#fbbf24" stroke-width="2">
                                <line x1="12" y1="1" x2="12" y2="3" />
                                <line x1="12" y1="21" x2="12" y2="23" />
                                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                                <line x1="1" y1="12" x2="3" y2="12" />
                                <line x1="21" y1="12" x2="23" y2="12" />
                                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                            </g>
                        </svg>
                    </button>
                </div>
                <div class="flex items-center gap-4">
                    <span class="font-semibold text-blue-700">Logout:</span>
                    <button onclick="logoutUser()" title="Logout" class="p-2 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-600 transition flex items-center justify-center">
                        <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                            <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H7a2 2 0 01-2-2V7a2 2 0 012-2h4a2 2 0 012 2v1" stroke="#2563eb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                        </svg>
                    </button>
                </div>
            `;
            // Theme toggle logic
            const themeToggleBtn = document.getElementById('themeToggleBtn');
            const moonIcon = document.getElementById('moonIcon');
            const sunIcon = document.getElementById('sunIcon');
            if (themeToggleBtn) {
                themeToggleBtn.addEventListener('click', function () {
                    const isDark = !document.body.classList.contains('dark-theme');
                    setTheme(isDark);
                });
            }
            break;
        case 'social':
            // Fetch from backend API
            settingsHubContent.innerHTML = `
                <h2 class="text-xl font-bold text-blue-600 dark:text-blue-400 mb-6">Social Media & Project Links</h2>
                
                <!-- Top Section: Add Project URL -->
                <div class="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 md:p-6 mb-6">
                    <h3 class="text-lg font-semibold text-blue-700 dark:text-blue-300 mb-4 flex items-center gap-2">
                        <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" stroke="currentColor" stroke-width="2"/>
                            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" stroke="currentColor" stroke-width="2"/>
                        </svg>
                        Add Project URL
                    </h3>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                        <select id="projectUrlSelect" class="border border-blue-200 dark:border-blue-600 p-3 rounded-xl bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-300 dark:focus:ring-blue-600 text-blue-700 dark:text-blue-300">
                            <option value="">Select a project...</option>
                        </select>
                        <input type="url" id="projectUrlInput" placeholder="Enter project URL..." 
                               class="border border-blue-200 dark:border-blue-600 p-3 rounded-xl bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-300 dark:focus:ring-blue-600 text-blue-700 dark:text-blue-300 placeholder-blue-400 dark:placeholder-blue-500 md:col-span-2">
                    </div>
                    <button type="button" id="addProjectUrlBtn" 
                            class="bg-gradient-to-r from-blue-400 to-blue-600 text-white px-4 md:px-6 py-3 rounded-xl font-semibold shadow hover:from-blue-500 hover:to-blue-700 transition flex items-center gap-2 w-full md:w-auto justify-center">
                        <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
                            <path d="M12 5v14M5 12h14" stroke="#fff" stroke-width="2" stroke-linecap="round"/>
                        </svg>
                        Add Project URL
                    </button>
                </div>

                <!-- Middle Section: Show Added Project Links -->
                <div class="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 md:p-6 mb-6">
                    <h3 class="text-lg font-semibold text-green-700 dark:text-green-300 mb-4 flex items-center gap-2">
                        <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                            <path d="M9 12l2 2 4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z" stroke="currentColor" stroke-width="2"/>
                        </svg>
                        Project URLs
                    </h3>
                    <div id="projectUrlsList" class="space-y-3">
                        <!-- Project URLs will be injected here -->
                    </div>
                </div>

                <!-- Bottom Section: Social Media Links -->
                <div class="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 md:p-6 mb-6">
                    <h3 class="text-lg font-semibold text-purple-700 dark:text-purple-300 mb-4 flex items-center gap-2">
                        <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                            <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" stroke="currentColor" stroke-width="2"/>
                        </svg>
                        Social Media Links
                    </h3>
                    <div id="socialLinksList" class="space-y-3 mb-4">
                        <!-- Social media links will be injected here -->
                    </div>
                    <div class="flex flex-col sm:flex-row gap-2">
                        <button type="button" id="addMoreSocialBtn" class="bg-purple-500 text-white px-3 py-2 rounded-xl font-semibold hover:bg-purple-600 transition">Add More Social</button>
                    </div>
                </div>
                <button type="button" id="saveSocialLinksBtn" class="bg-gradient-to-r from-purple-400 to-purple-600 text-white px-4 py-2 rounded-xl font-semibold shadow hover:from-purple-500 hover:to-purple-700 transition">Save All Social Links</button>
            `;
            document.getElementById('socialLinksList').innerHTML = '<div class="text-gray-400 text-center py-4">Loading...</div>';
            document.getElementById('projectUrlsList').innerHTML = '<div class="text-gray-400 text-center py-4">Loading...</div>';
            fetch('/api/userdata/social-links')
                .then(res => res.json())
                .then(data => {
                    socialLinks = Array.isArray(data.socialLinks) ? data.socialLinks : [];
                    renderSocialLinks();
                    renderProjectUrlsList();
                    renderProjectList(); // update URL icons in project list
                })
                .catch(() => {
                    document.getElementById('socialLinksList').innerHTML = '<div class="text-red-500 text-center py-4">Failed to load social links.</div>';
                    document.getElementById('projectUrlsList').innerHTML = '<div class="text-red-500 text-center py-4">Failed to load project URLs.</div>';
                    socialLinks = [];
                });
            // Populate project dropdown
            populateProjectUrlDropdown();

            // Render project URLs list
            renderProjectUrlsList();

            // Add event listeners for new functionality
            document.getElementById('addProjectUrlBtn').onclick = addProjectUrl;
            document.getElementById('addMoreSocialBtn').onclick = addMoreSocialLink;

            document.getElementById('saveSocialLinksBtn').onclick = async function () {
                // Filter out empty links and ensure all links have required fields
                const filtered = socialLinks.filter(link => {
                    if (link.type === 'project') {
                        // Project links must have type, projectId, name, and url
                        return link.name.trim() && link.url.trim() && link.projectId;
                    } else if (link.type === 'social') {
                        // Social links must have type, name, and url
                        return link.name.trim() && link.url.trim();
                    }
                    return false;
                });

                try {
                    const res = await fetch('/api/userdata/social-links', {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ socialLinks: filtered })
                    });
                    const data = await res.json();
                    if (data.socialLinks) {
                        Toast.fire({ icon: 'success', title: 'Social links updated.' });
                        socialLinks = data.socialLinks;
                        renderSocialLinks();
                        renderProjectUrlsList();
                        renderProjectList(); // update URL icons in project list
                    } else {
                        Toast.fire({ icon: 'error', title: data.error || 'Failed to save social links.' });
                    }
                } catch (err) {
                    console.error('Save error:', err);
                    Toast.fire({ icon: 'error', title: 'Failed to save social links.' });
                }
            };
            break;
        default:
            settingsHubContent.innerHTML = '<h2>Select a section</h2>';
    }
}
if (settingsBtn) settingsBtn.addEventListener('click', openSettingsHub);
if (closeSettingsHubBtn) closeSettingsHubBtn.addEventListener('click', closeSettingsHub);

// Social Media Links Logic
let socialLinks = [];

// Project URL Functions
function populateProjectUrlDropdown() {
    const select = document.getElementById('projectUrlSelect');
    if (!select) return;

    // Clear existing options except the first one
    select.innerHTML = '<option value="">Select a project...</option>';

    // Add project options
    if (Array.isArray(projects) && projects.length > 0) {
        projects.forEach(project => {
            const option = document.createElement('option');
            option.value = project._id;
            option.textContent = project.name;
            select.appendChild(option);
        });
    }
}

function renderProjectUrlsList() {
    const container = document.getElementById('projectUrlsList');
    if (!container) return;

    container.innerHTML = '';

    // Get project links from socialLinks
    const projectLinks = socialLinks.filter(link => link.type === 'project');

    if (projectLinks.length === 0) {
        container.innerHTML = '<div class="text-gray-500 text-center py-4">No project URLs added yet.</div>';
        return;
    }

    projectLinks.forEach((link, index) => {
        const item = document.createElement('div');
        item.className = 'flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg border border-green-200 dark:border-green-700';
        item.innerHTML = `
            <div class="flex-1">
                <h4 class="font-semibold text-green-800 dark:text-green-300">${link.name}</h4>
                <p class="text-sm text-green-600 dark:text-green-400 truncate">${link.url}</p>
            </div>
            <div class="flex items-center gap-2 ml-4">
                <button type="button" class="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300" title="Open URL" onclick="window.open('${link.url}', '_blank')">
                    <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" stroke="currentColor" stroke-width="2"/>
                        <polyline points="15,3 21,3 21,9" stroke="currentColor" stroke-width="2"/>
                        <line x1="10" y1="14" x2="21" y2="3" stroke="currentColor" stroke-width="2"/>
                    </svg>
                </button>
                <button type="button" class="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300" title="Remove" onclick="removeProjectUrl(${index})">
                    <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
                        <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                    </svg>
                </button>
            </div>
        `;
        container.appendChild(item);
    });
}

function addProjectUrl() {
    const projectId = document.getElementById('projectUrlSelect').value;
    const url = document.getElementById('projectUrlInput').value.trim();

    if (!projectId) {
        Toast.fire({ icon: 'warning', title: 'Please select a project first.' });
        return;
    }

    if (!url) {
        Toast.fire({ icon: 'warning', title: 'Please enter a project URL.' });
        return;
    }

    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        Toast.fire({ icon: 'warning', title: 'Please enter a valid URL starting with http:// or https://' });
        return;
    }

    // Check if project already has a URL
    const existingIndex = socialLinks.findIndex(link => link.type === 'project' && link.projectId === projectId);
    const project = projects.find(p => p._id === projectId);

    if (existingIndex !== -1) {
        // Update existing
        socialLinks[existingIndex].url = url;
        socialLinks[existingIndex].name = project.name;
    } else {
        // Add new
        socialLinks.push({
            type: 'project',
            projectId: projectId,
            name: project.name,
            url: url
        });
    }

    // Clear form
    document.getElementById('projectUrlSelect').value = '';
    document.getElementById('projectUrlInput').value = '';

    // Re-render
    renderProjectUrlsList();
    renderSocialLinks();
    renderProjectList(); // update URL icons in project list

    Toast.fire({ icon: 'success', title: 'Project URL added successfully.' });
}

function removeProjectUrl(index) {
    const projectLinks = socialLinks.filter(link => link.type === 'project');
    const linkToRemove = projectLinks[index];
    const actualIndex = socialLinks.findIndex(link => link === linkToRemove);

    if (actualIndex !== -1) {
        socialLinks.splice(actualIndex, 1);
        renderProjectUrlsList();
        renderSocialLinks();
        renderProjectList(); // update URL icons in project list
        Toast.fire({ icon: 'success', title: 'Project URL removed successfully.' });
    }
}

function addMoreSocialLink() {
    socialLinks.push({ type: 'social', name: '', url: '' });
    renderSocialLinks();
}

// Helper: Check if a project is linked in socialLinks
function isProjectLinked(projectId) {
    return socialLinks.some(link => link.type === 'project' && link.projectId === projectId);
}

// Helper: Get the social link object for a project
function getProjectSocialLink(projectId) {
    return socialLinks.find(link => link.type === 'project' && link.projectId === projectId);
}

// Render only social media links (not project links)
function renderSocialLinks() {
    const list = document.getElementById('socialLinksList');
    if (!list) return;
    list.innerHTML = '';

    // Only render social links (not project links)
    const socialOnlyLinks = socialLinks.filter(link => link.type === 'social');

    if (socialOnlyLinks.length === 0) {
        list.innerHTML = '<div class="text-gray-500 dark:text-gray-400 text-center py-4">No social media links added yet.</div>';
        return;
    }

    socialOnlyLinks.forEach((link, idx) => {
        const row = document.createElement('div');
        row.className = 'flex flex-col sm:flex-row items-center gap-2 social-link-row bg-white dark:bg-gray-800 p-3 rounded-lg border border-purple-200 dark:border-purple-700';
        row.innerHTML = `
      <input type="text" placeholder="Name (e.g. LinkedIn, GitHub, Portfolio)" value="${link.name || ''}" class="border border-purple-200 dark:border-purple-600 p-2 rounded-xl bg-purple-50 dark:bg-purple-900/20 flex-1 w-full sm:w-auto text-purple-700 dark:text-purple-300 placeholder-purple-400 dark:placeholder-purple-500" data-idx="${idx}" data-type="name" />
      <input type="url" placeholder="URL" value="${link.url || ''}" class="border border-purple-200 dark:border-purple-600 p-2 rounded-xl bg-purple-50 dark:bg-purple-900/20 flex-1 w-full sm:w-auto text-purple-700 dark:text-purple-300 placeholder-purple-400 dark:placeholder-purple-500" data-idx="${idx}" data-type="url" />
      <button type="button" class="text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300" data-idx="${idx}" data-action="open-link" title="Open Link">
        <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" stroke="currentColor" stroke-width="2"/>
          <polyline points="15,3 21,3 21,9" stroke="currentColor" stroke-width="2"/>
          <line x1="10" y1="14" x2="21" y2="3" stroke="currentColor" stroke-width="2"/>
        </svg>
          </button>
      <button type="button" class="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300" data-idx="${idx}" data-action="remove-link" title="Remove">
        <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
          <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
          </button>
    `;
        list.appendChild(row);
    });
}

// Update input/change handlers for social link editing
window.addEventListener('input', function (e) {
    // Social link edit
    if (e.target.closest('#socialLinksList') && e.target.dataset.idx !== undefined) {
        const idx = e.target.dataset.idx;
        const type = e.target.dataset.type;
        if (type && idx !== undefined) {
            const socialOnlyLinks = socialLinks.filter(link => link.type === 'social');
            const linkToUpdate = socialOnlyLinks[idx];
            const actualIndex = socialLinks.findIndex(link => link === linkToUpdate);
            if (actualIndex !== -1) {
                socialLinks[actualIndex][type] = e.target.value;
            }
        }
    }
});
window.addEventListener('click', function (e) {
    // Open link (social media)
    if (e.target.closest('[data-action="open-link"]')) {
        const idx = e.target.closest('[data-action="open-link"]').dataset.idx;
        const socialOnlyLinks = socialLinks.filter(link => link.type === 'social');
        const url = socialOnlyLinks[idx].url;
        if (url && /^https?:\/\//.test(url)) {
            window.open(url, '_blank');
        } else {
            Toast.fire({ icon: 'warning', title: 'Please enter a valid URL (starting with http:// or https://)' });
        }
    }
    // Remove social link
    if (e.target.closest('[data-action="remove-link"]')) {
        const idx = e.target.closest('[data-action="remove-link"]').dataset.idx;
        const socialOnlyLinks = socialLinks.filter(link => link.type === 'social');
        const linkToRemove = socialOnlyLinks[idx];
        const actualIndex = socialLinks.findIndex(link => link === linkToRemove);
        if (actualIndex !== -1) {
            socialLinks.splice(actualIndex, 1);
            renderSocialLinks();
        }
    }
    // Add more social (custom)
    if (e.target.closest('#addMoreSocialBtn')) {
        socialLinks.push({ type: 'social', name: '', url: '' });
        renderSocialLinks();
    }
});

// Initial render when settings modal opens
function openSettingsModal() {
    // ...existing code...
    renderSocialLinks();
    renderProjectList(); // ensure URL icons are shown
    // ...rest of your code...
}

// Event Listeners
document.addEventListener('DOMContentLoaded', function () {
    // Project modal close button
    const closeProjectFormBtn = document.getElementById('closeProjectFormBtn');
    if (closeProjectFormBtn) {
        closeProjectFormBtn.addEventListener('click', closeProjectForm);
    }

    // Add basic input button (prevent duplicate listeners)
    const addBasicInputBtn = document.getElementById('addBasicInputBtn');
    if (addBasicInputBtn) {
        // Remove existing listeners to prevent duplicates
        addBasicInputBtn.replaceWith(addBasicInputBtn.cloneNode(true));
        const newAddBasicInputBtn = document.getElementById('addBasicInputBtn');
        newAddBasicInputBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            addBasicInput();
        });
    }

    // Add advanced input button (prevent duplicate listeners)
    const addAdvancedInputBtn = document.getElementById('addAdvancedInputBtn');
    if (addAdvancedInputBtn) {
        // Remove existing listeners to prevent duplicates
        addAdvancedInputBtn.replaceWith(addAdvancedInputBtn.cloneNode(true));
        const newAddAdvancedInputBtn = document.getElementById('addAdvancedInputBtn');
        newAddAdvancedInputBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            addAdvancedInput();
        });
    }

    // Auto-resize project notes textarea
    const projectQuickNotes = document.getElementById('projectQuickNotes');
    if (projectQuickNotes) {
        projectQuickNotes.addEventListener('input', function () {
            this.style.height = 'auto';
            this.style.height = (this.scrollHeight) + 'px';
        });
    }
});

// Helper function to show drag mode notifications
function showDragModeNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `drag-notification ${type}`;
    notification.textContent = message;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}
