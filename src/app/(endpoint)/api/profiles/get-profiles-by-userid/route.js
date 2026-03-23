export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { decodedToken, sendError } from '@/helpers/endpoint';
import { getProfilesByUserId } from '@/services/(endpoint)/profiles/profile.controller';

export const GET = async (req) => {
  try {
    const token = decodedToken(req);
    const profiles = await getProfilesByUserId(token.uuid);
    return Response.json({ result: 'success', profiles });
  } catch (err) {
    console.error('get-profiles error:', err);
    return sendError(Response, { msg: 'Failed to fetch profiles' });
  }
};
