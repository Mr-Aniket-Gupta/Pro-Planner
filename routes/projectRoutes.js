// Project routes
const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const Project = require('../models/Project');

// Project CRUD
router.post('/', projectController.createProject);
router.get('/', projectController.getProjects);
router.put('/:projectId', projectController.updateProject);
router.delete('/:projectId', projectController.deleteProject);
router.put('/:projectId/shared', projectController.updateSharedProject);
router.get('/:projectId/sharing-details', projectController.getProjectSharingDetails);
router.post('/change-access', projectController.changeProjectAccess);
router.get('/:projectId/details', projectController.getProjectDetails);

// Project search
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
    if (tag) query.basic = tag;
    const projects = await Project.find(query).sort({ created: -1 });
    res.json(projects);
  } catch (err) {
    res.status(500).json({ error: 'Failed to search projects' });
  }
});

// Project sharing and access
router.get('/public/:userId', projectController.getUserPublicProjects);
router.post('/request-access', projectController.requestProjectAccess);
router.get('/access-requests', projectController.getProjectAccessRequests);
router.post('/approve-access', projectController.approveProjectAccess);
router.get('/shared-with-me', projectController.getProjectsSharedWithMe);
router.post('/reject-access', projectController.rejectProjectAccess);
router.post('/revoke-access', projectController.revokeProjectAccess);
router.post('/delete-access-request', projectController.deleteProjectAccessRequest);

module.exports = router;
