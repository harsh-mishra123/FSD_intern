import express, { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';

const router = express.Router();

const generateToken = (id: string) => {
  return jwt.sign({ id }, process.env.JWT_SECRET as string, { expiresIn: '30d' });
};

// Login user
router.post('/login', async (req: Request, res: Response): Promise<any> => {
  let { email, password } = req.body;
  if (!email || !password) return res.status(401).json({ message: 'Invalid email or password' });
  
  email = email.trim();
  password = password.trim();

  const user = await User.findOne({ email });

  if (user && (await user.matchPassword(password))) {
    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken((user._id as any).toString()),
    });
  } else {
    res.status(401).json({ message: 'Invalid email or password' });
  }
});

export default router;