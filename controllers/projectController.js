const Project = require('../models/Project');
const User = require('../models/User');
const { io } = require('../server');

// Create a new project
exports.createProject = async (req, res) => {
    try {
        const { name, desc, basic, advanced, completed, deadline, notes, isPublic } = req.body;
        const project = new Project({
            name,
            desc,
            basic,
            advanced,
            userId: req.session.userId,
            completed: completed || false,
            deadline,
            notes,
            isPublic: isPublic || false
        });
        await project.save();
        res.status(201).json(project);
    } catch (err) {
        res.status(500).json({ error: 'Failed to create project' });
    }
};

// Get all projects for the logged-in user
exports.getProjects = async (req, res) => {
    try {
        const projects = await Project.find({ userId: req.session.userId });
        res.json(projects);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch projects' });
    }
};

// Update a project (owner or shared user with write/both access)
exports.updateProject = async (req, res) => {
    try {
        const { name, desc, basic, advanced, completed, deadline, notes, isPublic } = req.body;
        const project = await Project.findById(req.params.projectId);
        if (!project) return res.status(404).json({ error: 'Project not found' });
        const userId = req.session.userId;
        const isOwner = project.userId.toString() === userId.toString();
        let sharedAccess = null;
        if (!isOwner && project.sharedWith && project.sharedWith.length > 0) {
            const shared = project.sharedWith.find(sw => sw.user.toString() === userId.toString());
            if (shared) sharedAccess = shared.access;
        }
        if (!isOwner && (sharedAccess !== 'write' && sharedAccess !== 'both')) {
            return res.status(403).json({ error: 'No permission to update this project' });
        }
        project.name = name;
        project.desc = desc;
        project.basic = basic;
        project.advanced = advanced;
        project.completed = completed;
        project.deadline = deadline;
        project.notes = notes;
        // Only allow owner to update isPublic
        if (isOwner && typeof isPublic !== 'undefined') {
            project.isPublic = isPublic;
        }
        await project.save();
        res.json(project);
    } catch (err) {
        res.status(500).json({ error: 'Failed to update project' });
    }
};

// Delete a project by ID
exports.deleteProject = async (req, res) => {
    try {
        const project = await Project.findByIdAndDelete(req.params.projectId);
        if (!project) return res.status(404).json({ error: 'Project not found' });
        res.json({ message: 'Project deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete project' });
    }
};

// Get all public projects for a user
exports.getUserPublicProjects = async (req, res) => {
    try {
        const { userId } = req.params;
        const projects = await Project.find({ userId, isPublic: true }).select('name description deadline');
        res.json(projects);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch public projects' });
    }
};

// Request access to a project
exports.requestProjectAccess = async (req, res) => {
    try {
        const { projectId, access } = req.body;
        const userId = req.session.userId;
        const project = await Project.findById(projectId);
        if (!project) return res.status(404).json({ error: 'Project not found' });
        if (project.userId.toString() === userId) return res.status(400).json({ error: 'Cannot request access to your own project' });
        const owner = await User.findById(project.userId);
        const alreadyRequested = owner.projectAccessRequests.find(r => r.project.toString() === projectId && r.requestedBy.toString() === userId && r.status === 'pending');
        if (alreadyRequested) return res.status(400).json({ error: 'Already requested' });
        owner.projectAccessRequests.push({ project: projectId, access, status: 'pending', requestedBy: userId });
        await owner.save();
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to request access' });
    }
};

// Get all access requests for the logged-in user's projects
exports.getProjectAccessRequests = async (req, res) => {
    try {
        const user = await User.findById(req.session.userId).populate({
            path: 'projectAccessRequests.project',
            select: 'name description'
        }).populate('projectAccessRequests.requestedBy', 'name emails');
        res.json(user.projectAccessRequests || []);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch access requests' });
    }
};

// Approve a project access request
exports.approveProjectAccess = async (req, res) => {
    try {
        const { requestId, access } = req.body;
        const user = await User.findById(req.session.userId);
        const reqObj = user.projectAccessRequests.id(requestId);
        if (!reqObj) return res.status(404).json({ error: 'Request not found' });
        reqObj.status = 'approved';
        reqObj.access = access;
        await user.save();
        const project = await Project.findById(reqObj.project);
        if (project) {
            const already = project.sharedWith.find(sw => sw.user.toString() === reqObj.requestedBy.toString());
            if (!already) {
                project.sharedWith.push({ user: reqObj.requestedBy, access });
            } else {
                already.access = access;
            }
            await project.save();
        }
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to approve access' });
    }
};

// Revoke a user's access to a project
exports.revokeProjectAccess = async (req, res) => {
    try {
        const { projectId, userId } = req.body;
        const project = await Project.findById(projectId);
        if (!project) return res.status(404).json({ error: 'Project not found' });
        if (project.userId.toString() !== req.session.userId) return res.status(403).json({ error: 'Only owner can revoke access' });
        project.sharedWith = project.sharedWith.filter(sw => sw.user.toString() !== userId);
        await project.save();
        const owner = await User.findById(req.session.userId);
        if (owner) {
            owner.projectAccessRequests = owner.projectAccessRequests.filter(r => !(r.project.toString() === projectId && r.requestedBy.toString() === userId));
            await owner.save();
        }
        const user = await User.findById(userId);
        if (user) {
            user.projectAccessRequests = user.projectAccessRequests.filter(r => !(r.project.toString() === projectId));
            await user.save();
        }
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to revoke access' });
    }
};

// Get details of a shared project for a user
exports.getSharedProjectDetails = async (req, res) => {
    try {
        const userId = req.session.userId;
        const { projectId } = req.params;
        const project = await Project.findById(projectId).populate('sharedWith.user', 'name emails');
        if (!project) return res.status(404).json({ error: 'Project not found' });
        if (project.userId.toString() === userId) {
            let progress = 0;
            try {
                const Task = require('../models/task');
                const tasks = await Task.find({ projectId: project._id });
                if (tasks.length > 0) {
                    const done = tasks.filter(t => t.completed).length;
                    progress = Math.round((done / tasks.length) * 100);
                }
            } catch { }
            return res.json({ project: { ...project.toObject(), progress }, access: 'both', isOwner: true });
        }
        const shared = project.sharedWith.find(sw => sw.user && (sw.user._id?.toString?.() === userId || sw.user.toString() === userId));
        if (!shared) return res.status(403).json({ error: 'No access to this project' });
        let progress = 0;
        try {
            const Task = require('../models/task');
            const tasks = await Task.find({ projectId: project._id });
            if (tasks.length > 0) {
                const done = tasks.filter(t => t.completed).length;
                progress = Math.round((done / tasks.length) * 100);
            }
        } catch { }
        res.json({ project: { ...project.toObject(), progress }, access: shared.access, isOwner: false });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch shared project details' });
    }
};

// Update a shared project if user has write/both access
exports.updateSharedProject = async (req, res) => {
    try {
        const userId = req.session.userId;
        const { projectId } = req.params;
        const { name, description, deadline, notes } = req.body;
        const project = await Project.findById(projectId);
        if (!project) return res.status(404).json({ error: 'Project not found' });
        if (project.userId.toString() === userId) {
            if (name !== undefined) project.name = name;
            if (description !== undefined) project.description = description;
            if (deadline !== undefined) project.deadline = deadline;
            if (notes !== undefined) project.notes = notes;
            await project.save();
            return res.json({ success: true, project });
        }
        const shared = project.sharedWith.find(sw => sw.user && sw.user.toString() === userId);
        if (!shared || (shared.access !== 'write' && shared.access !== 'both')) {
            return res.status(403).json({ error: 'No write access to this project' });
        }
        if (name !== undefined) project.name = name;
        if (description !== undefined) project.description = description;
        if (deadline !== undefined) project.deadline = deadline;
        if (notes !== undefined) project.notes = notes;
        await project.save();
        res.json({ success: true, project });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update shared project' });
    }
};

// Get all projects shared with the logged-in user
exports.getProjectsSharedWithMe = async (req, res) => {
    try {
        const userId = req.session.userId;
        const projects = await Project.find({
            'sharedWith.user': userId
        }).select('name description desc deadline userId sharedWith');
        res.json(projects);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch shared projects' });
    }
};

// Reject a project access request
exports.rejectProjectAccess = async (req, res) => {
    try {
        const { requestId } = req.body;
        const user = await User.findById(req.session.userId);
        const reqObj = user.projectAccessRequests.id(requestId);
        if (!reqObj) return res.status(404).json({ error: 'Request not found' });
        reqObj.status = 'rejected';
        await user.save();
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to reject access request' });
    }
};

// Delete a project access request
exports.deleteProjectAccessRequest = async (req, res) => {
    try {
        const { requestId } = req.body;
        const user = await User.findById(req.session.userId);
        if (!user) return res.status(404).json({ error: 'User not found' });
        user.projectAccessRequests = user.projectAccessRequests.filter(r => r._id.toString() !== requestId);
        await user.save();
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete access request' });
    }
};

// Get sharing details for a project (friends and sharedWith)
exports.getProjectSharingDetails = async (req, res) => {
    try {
        const userId = req.session.userId;
        const { projectId } = req.params;
        const Project = require('../models/Project');
        const User = require('../models/User');
        const project = await Project.findById(projectId).populate('sharedWith.user', 'name emails');
        if (!project) return res.status(404).json({ error: 'Project not found' });
        if (project.userId.toString() !== userId) return res.status(403).json({ error: 'Not your project' });
        const user = await User.findById(userId).populate('connections', 'name emails');
        const friends = user.connections.map(f => ({
            _id: f._id,
            name: f.name,
            emails: f.emails,
            access: (project.sharedWith.find(sw => sw.user && (sw.user._id || sw.user).toString() === f._id.toString()) || {}).access || null
        }));
        const sharedWith = (project.sharedWith || []).map(sw => ({
            _id: sw.user?._id || sw.user,
            name: sw.user?.name || '',
            emails: sw.user?.emails || [],
            access: sw.access
        }));
        res.json({ friends, sharedWith });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch sharing details' });
    }
};

// Change access for a user in a project (owner only)
exports.changeProjectAccess = async (req, res) => {
    try {
        const { projectId, userId, access } = req.body;
        const project = await Project.findById(projectId);
        if (!project) return res.status(404).json({ error: 'Project not found' });
        if (project.userId.toString() !== req.session.userId) return res.status(403).json({ error: 'Only owner can change access' });
        let updated = false;
        for (let sw of project.sharedWith) {
            if (sw.user.toString() === userId) {
                sw.access = access;
                updated = true;
            }
        }
        if (!updated) {
            project.sharedWith.push({ user: userId, access });
        }
        await project.save();
        io.emit('project-access-changed', { projectId, userId, access });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to change access' });
    }
};

// Get project details for owner or shared user
exports.getProjectDetails = async (req, res) => {
    try {
        const projectId = req.params.projectId;
        const userId = req.session.userId;
        const project = await Project.findById(projectId).lean();
        if (!project) return res.status(404).json({ error: 'Project not found' });
        let isOwner = project.userId.toString() === userId.toString();
        let sharedAccess = null;
        if (!isOwner && project.sharedWith && project.sharedWith.length > 0) {
            const shared = project.sharedWith.find(sw => sw.user.toString() === userId.toString());
            if (shared) sharedAccess = shared.access;
        }
        return res.json({ project, isOwner, access: sharedAccess });
    } catch (err) {
        return res.status(500).json({ error: 'Server error' });
    }
};
