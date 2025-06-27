const express = require('express');
const router = express.Router();
const { getUserData, updateTodos, updateNotes } = require('../controllers/userDataController');

// Get all user data (todos + notes)
router.get('/', getUserData);
// Update todos
router.put('/todos', updateTodos);
// Update notes
router.put('/notes', updateNotes);

module.exports = router; 