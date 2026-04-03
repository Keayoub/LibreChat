const express = require('express');
const { createProjectsHandlers } = require('@librechat/api');
const { requireJwtAuth } = require('~/server/middleware');
const db = require('~/models');

const router = express.Router();

const handlers = createProjectsHandlers({
  createProject: db.createProject,
  getProjectById: db.getProjectById,
  getProjectsByUser: db.getProjectsByUser,
  updateProject: db.updateProject,
  deleteProject: db.deleteProject,
  unsetConversationProject: db.unsetConversationProject,
  saveConvo: db.saveConvo,
  getConvo: db.getConvo,
  getConvosByCursor: db.getConvosByCursor,
});

router.use(requireJwtAuth);

router.get('/', handlers.listProjects);
router.post('/', handlers.createProject);
router.get('/:id', handlers.getProject);
router.patch('/:id', handlers.updateProject);
router.delete('/:id', handlers.deleteProject);
router.get('/:id/conversations', handlers.listProjectConversations);
router.post('/:id/conversations/:conversationId', handlers.assignConversation);
router.delete('/conversations/:conversationId', handlers.unassignConversation);

module.exports = router;
