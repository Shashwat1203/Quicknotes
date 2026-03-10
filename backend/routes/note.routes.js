const express = require('express');
const router = express.Router();
const { getNotes, setNote, updateNote, deleteNote } = require('../controllers/note.controller');
const { protect } = require('../middleware/auth.middleware');

router.route('/').get(protect, getNotes).post(protect, setNote);
router.route('/:id').put(protect, updateNote).delete(protect, deleteNote);

module.exports = router;
