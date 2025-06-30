const express = require('express');
const router = express.Router();
const { createProject, getProjects, updateProject, deleteProject } = require('../controllers/projectController');

router.post('/', createProject);
router.get('/', getProjects);
router.put('/:projectId', updateProject);
router.delete('/:projectId', deleteProject);

module.exports = router;
