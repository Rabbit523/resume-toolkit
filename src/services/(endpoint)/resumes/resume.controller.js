import { CONSTANT_USER_ROLE_ADMIN } from '@/config/constants';
import resumeModel from '@/models/resume.model';
import userModel from '@/models/user.model';
import dbConnect from '@/mongodb';

export async function getResumes({ skip, limit, sortBy, sortOrder, startDate, endDate, companyName, profileId, description, userId }) {
  try {
    await dbConnect();

    const filter = {};

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);

      end.setUTCHours(23, 59, 59, 999);

      filter.created_at = {
        $gte: start,
        $lte: end
      };
    }

    if (companyName) {
      filter.companyName = { $regex: new RegExp(companyName, 'i') };
    }

    if (description) {
      filter.jobDescription = { $regex: description, $options: 'i' };
    }

    const user = await userModel.findById(userId);

    if (user.role !== CONSTANT_USER_ROLE_ADMIN) {
      filter.associatedProfileId = { $in: user.profiles || [] };
    }

    // Multi-profile filter
    if (profileId) {
      const profileIds = profileId
        .split(',')
        .map((id) => id.trim())
        .filter(Boolean);

      if (profileIds.length > 0) {
        if (filter.associatedProfileId?.$in) {
          // Non-admin users can only query within their own profiles
          filter.associatedProfileId = {
            $in: filter.associatedProfileId.$in.filter((id) => profileIds.includes(String(id)))
          };
        } else {
          filter.associatedProfileId = { $in: profileIds };
        }
      }
    }

    const resumes = await resumeModel
      .find(filter)
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await resumeModel.countDocuments(filter);

    return { resumes, total };
  } catch (err) {
    console.error('Error fetching resumes:', err);
    throw new Error('Database error while fetching resumes');
  }
}

export async function getResumesReport({ range, userId }) {
  await dbConnect();

  const now = new Date();
  let startDate = null;

  if (range === 'today') {
    startDate = new Date(now.setHours(0, 0, 0, 0));
  }

  if (range === 'week') {
    startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  }

  if (range === 'month') {
    startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  }

  const match = {};
  if (startDate) {
    match.created_at = { $gte: startDate };
  }

  // Filter by userId if provided
  const user = await userModel.findById(userId);
  if (user.role !== CONSTANT_USER_ROLE_ADMIN) {
    match.associatedProfileId = { $in: user.profiles || [] };
  }

  const resumes = await resumeModel.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$associatedProfileId',
        count: { $sum: 1 }
      }
    }
  ]);

  return resumes;
}

// UPDATE
export async function updateResumeById(id, updates) {
  try {
    await dbConnect();

    const updated = await resumeModel.findByIdAndUpdate(id, updates, { new: true }).lean();
    return updated;
  } catch (err) {
    console.error('Error updating resume:', err);
    throw new Error('Database error while updating resume');
  }
}

// DELETE
export async function deleteResumeById(id) {
  try {
    await dbConnect();
    const deleted = await resumeModel.findByIdAndDelete(id).lean();
    return deleted;
  } catch (err) {
    console.error('Error deleting resume:', err);
    throw new Error('Database error while deleting resume');
  }
}
