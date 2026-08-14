const express = require('express');
const { register, login, getCurrentUser } = require('../controllers/auth.controller.js');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', getCurrentUser);

module.exports = router;