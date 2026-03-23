import mongoose from 'mongoose';

const interviewSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: true
    },

    time_est: {
      type: String, // keep as string: "10:30 AM"
      default: '',      
      required: true
    },

    stage: {
      type: String,
      enum: [
        '1st Round',
        '2nd Round',
        '3rd Round',
        '4th Round',
        '5th Round',
        'Final'
      ],
      required: true
    },

    interview_type: {
      type: String,
      enum: ['Video', 'Phone', 'Assessment', 'AI'],
      required: true
    },

    role: {
      type: String,
      required: true
    },

    company: {
      type: String,
      required: true
    },

    profile: {
      type: String, // job post / LinkedIn / careers link
      default: ''
    },

    interviewer: {
      type: String,
      default: ''
    },

    meeting_link: {
      type: String,
      default: ''
    },

    note: {
      type: String,
      default: ''
    },

    result: {
      type: String,
      enum: ['Success', 'Failed', 'Pending'],
      default: 'Pending'
    }
  },
  {
    collection: 'interviews',
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    }
  }
);

// 🔍 Useful indexes
interviewSchema.index({ company: 1, role: 1 });
interviewSchema.index({ date: -1 });
interviewSchema.index({ result: 1 });

export default mongoose.models.Interview ||
  mongoose.model('Interview', interviewSchema);
