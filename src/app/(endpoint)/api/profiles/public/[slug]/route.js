import { sendError } from '@/helpers/endpoint';
import profileModel from '@/models/profile.model';
import userModel from '@/models/user.model';
import dbConnect from '@/mongodb';

export async function GET(req, { params }) {
  try {
    await dbConnect();

    const { slug } = params;
    const user = await userModel.findOne({ _id: slug }).lean();
    
    if (user.profiles.length <= 0) {
      return Response.json({ msg: 'Profile not found' }, { status: 404 });
    }
    const profiles = await profileModel.find({ _id: { $in: user.profiles || [] } });
    return Response.json(profiles);
  } catch (err) {
    console.error('public profile error:', err);
    return sendError(Response, { msg: 'Failed to fetch profile' });
  }
}
