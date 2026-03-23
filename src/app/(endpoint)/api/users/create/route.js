export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { createUser } from '@/services/(endpoint)/users/user.controller';
import { sendError } from '@/helpers/endpoint';

export const POST = async (req) => {
  try {
    const body = await req.json();
    const newUser = await createUser(body);

    return Response.json({
      result: 'success',
      user: newUser
    });
  } catch (err) {
    console.error('create-user error:', err);
    return sendError(Response, { msg: 'Failed to create user' });
  }
};
