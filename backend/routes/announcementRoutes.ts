import express, { Response } from 'express';
import mongoose from 'mongoose';
import Announcement from '../models/Announcement';
import User from '../models/User';
import { adminOnly, AuthRequest, protect } from '../middleware/authMiddleware';
import { getIO } from '../socket/socketServer';

const router = express.Router();

router.get('/', protect, async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: 'Not authorized' });
    return;
  }

  const isAdmin = req.user.role === 'admin';

  // Build query conditions:
  // - All broadcast announcements
  // - Direct messages where user is the recipient or sender
  // - Group announcements targeting the user's role group
  // - Admins also see all group announcements (they sent them)
  const queryConditions: Record<string, unknown>[] = [
    { announcementType: 'broadcast' },
    { recipient: req.user._id },
    { sender: req.user._id },
  ];

  if (isAdmin) {
    // Admins see all group announcements
    queryConditions.push({ announcementType: 'group' });
  } else {
    // Regular users only see group announcements targeted at 'users'
    queryConditions.push({ announcementType: 'group' });
  }

  const announcements = await Announcement.find({ $or: queryConditions })
    .populate('recipient', 'name email role')
    .sort({ createdAt: 1 });

  res.json(announcements);
});

router.post('/', protect, adminOnly, async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: 'Not authorized' });
    return;
  }

  const { content, recipientId, target } = req.body as {
    content?: string;
    recipientId?: string | null;
    target?: 'all' | 'users' | 'admins';
  };

  if (!content || !content.trim()) {
    res.status(400).json({ message: 'Announcement content is required' });
    return;
  }

  let announcementType: 'broadcast' | 'direct' | 'group' = 'broadcast';
  let recipient: mongoose.Types.ObjectId | null = null;
  let recipientDoc: { _id: unknown; name: string; email: string; role: string } | null = null;
  let targetGroup: 'users' | 'admins' | null = null;

  if (recipientId) {
    const selectedUser = await User.findById(recipientId).select('name email role');
    if (!selectedUser) {
      res.status(404).json({ message: 'Selected user was not found' });
      return;
    }

    announcementType = 'direct';
    recipient = selectedUser._id as mongoose.Types.ObjectId;
    recipientDoc = {
      _id: selectedUser._id,
      name: selectedUser.name,
      email: selectedUser.email,
      role: selectedUser.role,
    };
  } else if (target === 'users' || target === 'admins') {
    announcementType = 'group';
    targetGroup = target;
  }

  const createdAnnouncement = await Announcement.create({
    sender: req.user._id,
    senderName: req.user.name,
    content: content.trim(),
    announcementType,
    recipient,
  });

  const responsePayload = {
    _id: createdAnnouncement._id,
    sender: createdAnnouncement.sender,
    senderName: createdAnnouncement.senderName,
    content: createdAnnouncement.content,
    announcementType: createdAnnouncement.announcementType,
    recipient: recipientDoc,
    createdAt: createdAnnouncement.createdAt,
    updatedAt: createdAnnouncement.updatedAt,
  };

  const io = getIO();
  if (announcementType === 'broadcast') {
    io.emit('announcement:new', responsePayload);
  } else if (announcementType === 'group' && targetGroup) {
    io.to(targetGroup).emit('announcement:new', responsePayload);
    // Also notify the sender so they see the message in their own feed
    io.to(`user:${String(req.user._id)}`).emit('announcement:new', responsePayload);
  } else if (recipient) {
    io.to(`user:${String(recipient)}`).emit('announcement:new', responsePayload);
    // Also notify the sender so they see their own DM
    if (String(recipient) !== String(req.user._id)) {
      io.to(`user:${String(req.user._id)}`).emit('announcement:new', responsePayload);
    }
  }

  res.status(201).json(responsePayload);
});

export default router;