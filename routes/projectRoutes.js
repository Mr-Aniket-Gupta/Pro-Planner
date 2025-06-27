const express = require('express');
const router = express.Router();
const { createProject, getProjects, updateProject } = require('../controllers/projectController');

router.post('/', createProject);
router.get('/', getProjects);
router.put('/:projectId', updateProject);

module.exports = router;
