import express, { Response } from 'express';
import User from '../models/User';
import { protect, adminOnly, adminAndUser, AuthRequest } from '../middleware/authMiddleware';

const router = express.Router();

// Get all users
router.get('/', protect, adminOnly, async (req: AuthRequest, res: Response) => {
  const users = await User.find({}).select('-password');
  res.json(users);
});

// Create new user
router.post('/', protect, adminOnly, async (req: AuthRequest, res: Response): Promise<void> => {
  const { name, email, password, role } = req.body;
  
  if (!password) {
    res.status(400).json({ message: 'Password is required' });
    return;
  }

  const userExists = await User.findOne({ email });

  if (userExists) {
    res.status(400).json({ message: 'User already exists' });
    return;
  }

  const user = await User.create({
    name,
    email,
    password,
    role: role || 'user',
  });

  if (user) {
    res.status(201).json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } else {
    res.status(400).json({ message: 'Invalid user data' });
  }
});

// Update user
router.put('/:id', protect, adminOnly, async (req: AuthRequest, res: Response): Promise<void> => {
  const user = await User.findById(req.params.id);

  if (user) {
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    if (req.body.password) {
      user.password = req.body.password;
    }

    const updatedUser = await user.save();
    res.json({
      id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
    });
  } else {
    res.status(404).json({ message: 'User not found' });
  }
});

// Delete user
router.delete('/:id', protect, adminOnly, async (req: AuthRequest, res: Response): Promise<void> => {
  const user = await User.findById(req.params.id);

  if (user) {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User removed' });
  } else {
    res.status(404).json({ message: 'User not found' });
  }
});

export default router;