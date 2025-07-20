const express = require('express');
const router = express.Router();
const { createProject, getProjects, updateProject, deleteProject } = require('../controllers/projectController');
const Project = require('../models/Project');

router.post('/', createProject);
router.get('/', getProjects);
router.put('/:projectId', updateProject);
router.delete('/:projectId', deleteProject);

// Project search/filter
router.get('/search', async (req, res) => {
  try {
    const { q = '', tag = '' } = req.query;
    const query = { userId: req.session.userId };
    if (q) {
      query.$or = [
        { name: { $regex: q, $options: 'i' } },
        { desc: { $regex: q, $options: 'i' } }
      ];
    }
    if (tag) {
      query.basic = tag;
    }
    const projects = await Project.find(query).sort({ created: -1 });
    res.json(projects);
  } catch (err) {
    res.status(500).json({ error: 'Failed to search projects' });
  }
});

module.exports = router;
