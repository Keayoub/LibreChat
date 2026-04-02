const express = require('express');
const { createScimRouter } = require('@librechat/api');
const db = require('~/models');

const router = express.Router();

const scimRouter = createScimRouter({
  // User deps
  findUsers: db.findUsers,
  countUsers: db.countUsers,
  getUserById: db.getUserById,
  createUser: db.createUser,
  updateUser: db.updateUser,
  deleteUserById: db.deleteUserById,
  // Group deps
  listGroups: db.listGroups,
  countGroups: db.countGroups,
  findGroupById: db.findGroupById,
  createGroup: db.createGroup,
  updateGroupById: db.updateGroupById,
  deleteGroup: db.deleteGroup,
  addUserToGroup: db.addUserToGroup,
  removeMemberById: db.removeMemberById,
});

router.use('/', scimRouter);

module.exports = router;
