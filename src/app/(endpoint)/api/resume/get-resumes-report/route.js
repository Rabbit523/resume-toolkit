export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { getResumesReport } from '@/services/(endpoint)/resumes/resume.controller';
import { decodedToken, sendError } from '@/helpers/endpoint';

export const GET = async (req) => {
  const token = decodedToken(req);
  const userId = token.uuid;

  const url = new URL(req.url, `http://${req.headers.host}`);
  const params = new URLSearchParams(url.search); // Parse query parameters

  const range = params.get('range');

  try {
    const resumes = await getResumesReport({ range, userId });

    return Response.json({
      result: 'success',
      resumes
    });
  } catch (err) {
    console.error('get-resumes error:', err);
    return sendError(Response, { msg: 'Failed to fetch resumes' });
  }
};
