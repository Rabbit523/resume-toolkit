export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { createInterview } from '@/services/(endpoint)/interviews/interviews.controller';
import { sendError } from '@/helpers/endpoint';

export const POST = async (req) => {
  try {
    const body = await req.json();
    const newInterview = await createInterview(body);

    return Response.json({
      result: 'success',
      interview: newInterview
    });
  } catch (err) {
    console.error('create-interview error:', err);
    return sendError(Response, { msg: 'Failed to create interview' });
  }
};
