const express = require('express');
const { register, login, getCurrentUser } = require('../controllers/auth.controller.js');
const { verifyToken } = require('../middleware/auth.middleware.js');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', verifyToken, getCurrentUser);

module.exports = router;