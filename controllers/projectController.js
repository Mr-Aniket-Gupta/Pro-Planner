const Project = require('../models/Project');

exports.createProject = async (req, res) => {
  try {
    const { name, desc, basic, advanced, completed, deadline, notes } = req.body;
    const project = new Project({
      name,
      desc,
      basic,
      advanced,
      userId: req.session.userId,
      completed: completed || false,
      deadline,
      notes
    });
    await project.save();
    res.status(201).json(project);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create project' });
  }
};

exports.getProjects = async (req, res) => {
  try {
    const projects = await Project.find({ userId: req.session.userId });
    res.json(projects);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
};

exports.updateProject = async (req, res) => {
  try {
    const { name, desc, basic, advanced, completed, deadline, notes } = req.body;
    const project = await Project.findByIdAndUpdate(
      req.params.projectId,
      { name, desc, basic, advanced, completed, deadline, notes },
      { new: true }
    );
    res.json(project);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update project' });
  }
};
