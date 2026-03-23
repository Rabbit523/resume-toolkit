export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { sendError } from '@/helpers/endpoint';
import { generateToken, getUserByEmail, verifyPassword } from '@/services/(endpoint)/users/user.controller';
import { randomUUID } from '@/helpers/common';
import dbConnect from '@/mongodb';
import { CONSTANT_USER_ROLE_ADMIN, CONSTANT_USER_ROLE_USER, ERROR_SUCCESS } from '@/config/constants';

export const POST = async (req) => {
  try {
    await dbConnect();
    const { email, password } = await req.json();
    const users = await getUserByEmail(email);
    const user = users[0];
    if (user) {
      if (await verifyPassword(user.password, password)) {
        const tokenId = randomUUID();
        const token = generateToken(user, tokenId);

        const data = {
          token,
          username: user.username,
          email: user.email,
          role: user.role,
          profiles: user.profiles,
          _id: user._id
        };
        if (user.email !== process.env.ADMIN && user.role === CONSTANT_USER_ROLE_ADMIN) {
         data.role = CONSTANT_USER_ROLE_USER; 
        }
        return Response.json({ valid: true, result: ERROR_SUCCESS, data });
      } else {
        return sendError(Response, { msg: 'Incorrect password' });
      }
    } else {
      return sendError(Response, { msg: 'The email does not exist' });
    }
  } catch (e) {
    console.log(e);
    return sendError(Response, { msg: 'Unknown error' });
  }
};
