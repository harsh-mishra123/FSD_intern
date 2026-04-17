import mongoose, { Document, Model, Types } from 'mongoose';

export interface IAnnouncement extends Document {
  sender: Types.ObjectId;
  senderName: string;
  content: string;
  announcementType: 'broadcast' | 'direct' | 'group';
  recipient?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const announcementSchema = new mongoose.Schema<IAnnouncement>(
  {
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    senderName: { type: String, required: true, trim: true },
    content: { type: String, required: true, trim: true, maxlength: 3000 },
    announcementType: {
      type: String,
      enum: ['broadcast', 'direct', 'group'],
      default: 'broadcast',
    },
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

const Announcement: Model<IAnnouncement> = mongoose.model<IAnnouncement>('Announcement', announcementSchema);

export default Announcement;