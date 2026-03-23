import interviewModel from '@/models/interview.model';
import dbConnect from '@/mongodb';

// 🧩 Get all interviews
export async function getInterviews(skip, limit) {
  try {
    await dbConnect();

    const [interviews, total] = await Promise.all([
      interviewModel.find({}).skip(skip).limit(limit).lean(),
      interviewModel.countDocuments({})
    ]);

    return {
      interviews,
      total
    };
  } catch (err) {
    console.error('Error fetching interviews:', err);
    throw new Error('Database error while fetching interviews');
  }
}

export async function createInterview(data) {
  try {
    await dbConnect();

    const newOne = await interviewModel.create(data);
    return newOne.toObject();
  } catch (err) {
    console.error('Error creating interview:', err);
    throw new Error('Database error while creating interview');
  }
}

// UPDATE
export async function updateInterviewById(id, updates) {
  try {
    await dbConnect();

    const updated = await interviewModel.findByIdAndUpdate(id, updates, { new: true }).lean();
    return updated;
  } catch (err) {
    console.error('Error updating interview:', err);
    throw new Error('Database error while updating interview');
  }
}

// DELETE
export async function deleteInterviewById(id) {
  try {
    await dbConnect();

    const deleted = await interviewModel.findByIdAndDelete(id).lean();
    return deleted;
  } catch (err) {
    console.error('Error deleting interview:', err);
    throw new Error('Database error while deleting interview');
  }
}

//Get Prfoiles by UserId
// export async function getProfilesByUserId(userId) {
//   try {
//     await dbConnect();

//     const user = await userModel.findById(userId);
//     if (!user) {
//       throw new Error('User not found');
//     }
//     return await profileModel.find({ _id: { $in: user.profiles || [] } });
//   } catch (err) {
//     console.error('Error fetching profiles by userId:', err);
//     throw new Error('Database error while fetching profiles by userId');
//   }
// }
