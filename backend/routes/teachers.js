const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');
const verifyToken = require('../middleware/authMiddleware');

// POST /api/teachers/register-teacher
router.post('/register-teacher', verifyToken, async (req, res) => {
  try {
    const { name, email, department } = req.body;
    const teacherId = req.user.uid;

    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }

    const teacherRef = db.collection('teachers').doc(teacherId);
    
    // Check if teacher already exists
    const doc = await teacherRef.get();
    if (doc.exists) {
      return res.status(200).json({ message: 'Teacher profile already exists', id: teacherId });
    }

    const teacherData = {
      teacherId,
      name,
      email,
      department: department || '',
      createdAt: new Date().toISOString(),
      fcmToken: null
    };

    await teacherRef.set(teacherData);

    res.status(201).json({ message: 'Teacher registered successfully', id: teacherId });
  } catch (error) {
    console.error('Error registering teacher:', error);
    res.status(500).json({ error: 'Failed to register teacher' });
  }
});

module.exports = router;
