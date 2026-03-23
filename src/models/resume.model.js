import mongoose from 'mongoose'

const resumeSchema = new mongoose.Schema(
  {
    companyName: { type: String, index: true },
    jobTitle: { type: String, index: true },
    jobLink: String,
    jobDescription: String,

    resumePrompt: String,
    resumeResponse: { type: Object, default: {} },
    resumeBuiltModel: String,
    resumeFileName: String,

    associatedProfileId: { type: mongoose.Schema.Types.ObjectId, ref: 'ProfileModel', index: true },
    associatedUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'UserModel', index: true }
  },
  {
    collection: 'resume',
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
  }
)

resumeSchema.index({ associatedUserId: 1, associatedProfileId: 1 }) // fast user/profile resume lookups

export default mongoose.models.ResumeModel || mongoose.model('ResumeModel', resumeSchema)
