import mongoose from 'mongoose';

const jobSchema = new mongoose.Schema(
  {
    title: { type: String, default: '' },
    company_name: { type: String, default: '' },
    apply_options: {
      type: Array,
      default: [
        {
          title: { type: String, default: '' },
          link: { type: String, default: '' }
        }
      ]
    },
    extensions: { type: String, default: '' },
    job_id: { type: String, default: '' }
  },
  {
    collection: 'job',
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
  }
);

jobSchema.index({ email: 1 }); // Optimized for lookup
export default mongoose.models.JobModel || mongoose.model('JobModel', jobSchema);
