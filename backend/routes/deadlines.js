const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');
const verifyToken = require('../middleware/authMiddleware');

// All deadline routes are protected
router.use(verifyToken);

// POST /api/deadlines/create-deadline
router.post('/create-deadline', async (req, res) => {
  try {
    const { subject: courseName, title, description, dueDate, priority } = req.body;
    const teacherId = req.user.uid;

    if (!title || !dueDate) {
      return res.status(400).json({ error: 'Title and Due Date are required' });
    }

    const deadlineData = {
      title,
      courseName: courseName || '',
      description: description || '',
      dueDate,
      priority: priority || 'medium',
      teacherId,
      reminderSent: {
        sevenDay: false,
        threeDay: false,
        oneDay: false,
        sixHour: false
      },
      calendarSynced: false,
      createdAt: new Date().toISOString()
    };

    const docRef = await db.collection('deadlines').add(deadlineData);
    
    res.status(201).json({ 
      message: 'Deadline created successfully', 
      id: docRef.id,
      ...deadlineData
    });
  } catch (error) {
    console.error('Error creating deadline:', error);
    res.status(500).json({ error: 'Failed to create deadline' });
  }
});

// GET /api/deadlines/:teacherId
router.get('/:teacherId', async (req, res) => {
  try {
    const { teacherId } = req.params;
    
    // Ensure standard teachers can only fetch their own data
    if (teacherId !== req.user.uid) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const snapshot = await db.collection('deadlines')
      .where('teacherId', '==', teacherId)
      .get();
      
    const deadlines = [];
    snapshot.forEach(doc => {
      deadlines.push({ id: doc.id, ...doc.data() });
    });

    res.status(200).json(deadlines);
  } catch (error) {
    console.error('Error fetching deadlines:', error);
    res.status(500).json({ error: 'Failed to fetch deadlines' });
  }
});

// PUT /api/deadlines/update-deadline/:id
router.put('/update-deadline/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const deadlineRef = db.collection('deadlines').doc(id);
    
    const doc = await deadlineRef.get();
    if (!doc.exists) {
      return res.status(404).json({ error: 'Deadline not found' });
    }
    
    if (doc.data().teacherId !== req.user.uid) {
         return res.status(403).json({ error: 'Forbidden' });
    }

    // Don't allow updating teacherId
    delete updates.teacherId;
    
    await deadlineRef.update(updates);
    
    res.status(200).json({ message: 'Deadline updated successfully' });
  } catch (error) {
    console.error('Error updating deadline:', error);
    res.status(500).json({ error: 'Failed to update deadline' });
  }
});

// DELETE /api/deadlines/delete-deadline/:id
router.delete('/delete-deadline/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const deadlineRef = db.collection('deadlines').doc(id);
        
        const doc = await deadlineRef.get();
        if (!doc.exists) {
          return res.status(404).json({ error: 'Deadline not found' });
        }
        
        if (doc.data().teacherId !== req.user.uid) {
             return res.status(403).json({ error: 'Forbidden' });
        }
    
        await deadlineRef.delete();
        
        res.status(200).json({ message: 'Deadline deleted successfully' });
      } catch (error) {
        console.error('Error deleting deadline:', error);
        res.status(500).json({ error: 'Failed to delete deadline' });
      }
});

module.exports = router;
