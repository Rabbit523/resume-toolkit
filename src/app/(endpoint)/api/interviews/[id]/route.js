export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { deleteInterviewById, updateInterviewById } from '@/services/(endpoint)/interviews/interviews.controller';
import { sendError } from '@/helpers/endpoint';

export const PUT = async (req, { params }) => {
  try {
    const { id } = params;
    const body = await req.json();
    const updatedOne = await updateInterviewById(id, body);

    return Response.json({
      result: 'success',
      interview: updatedOne
    });
  } catch (err) {
    console.error('update-interview-error:', err);
    return sendError(Response, { msg: 'Failed to update interview' });
  }
};

export const DELETE = async (req, { params }) => {
  try {
    const { id } = params;
    const res = await deleteInterviewById(id);

    return Response.json({
      result: 'success',
      interview: res
    });
  } catch (err) {
    console.error('delete-interview error:', err);
    return sendError(Response, { msg: 'Failed to delete interview' });
  }
};
