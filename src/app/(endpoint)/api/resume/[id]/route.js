export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { deleteResumeById, updateResumeById } from '@/services/(endpoint)/resumes/resume.controller';
import { sendError } from '@/helpers/endpoint';

export const PUT = async (req, { params }) => {
  try {
    const { id } = params;
    const body = await req.json();
    const updatedResume = await updateResumeById(id, body);

    return Response.json({
      result: 'success',
      resume: updatedResume
    });
  } catch (err) {
    console.error('update-resume-error:', err);
    return sendError(Response, { msg: 'Failed to update resume' });
  }
};

export const DELETE = async (req, { params }) => {
  try {
    const { id } = params;
    const res = await deleteResumeById(id);

    return Response.json({
      result: 'success',
      resume: res
    });
  } catch (err) {
    console.error('delete-resume error:', err);
    return sendError(Response, { msg: 'Failed to delete resume' });
  }
};
