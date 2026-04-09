export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { getResumes } from '@/services/(endpoint)/resumes/resume.controller';
import { decodedToken, sendError } from '@/helpers/endpoint';

export const GET = async (req) => {
  const token = decodedToken(req);
  const url = new URL(req.url, `http://${req.headers.host}`);
  const params = new URLSearchParams(url.search);

  const page = parseInt(params.get('page') || '1', 10);
  const limit = parseInt(params.get('limit') || '20', 10);

  console.log('Page:', page, 'Limit:', limit);

  // support both sortBy and sortby
  const sortBy = params.get('sortBy') || params.get('sortby') || 'created_at';
  const sortOrder = params.get('order') === 'ascend' ? 1 : -1;

  const startDate = params.get('startDate');
  const endDate = params.get('endDate');
  const companyName = params.get('companyName');
  const profileId = params.get('profileId');
  const description = params.get('description');
  const userId = token.uuid;

  try {
    const skip = (page - 1) * limit;

    const { resumes, total } = await getResumes({
      skip,
      limit,
      sortBy,
      sortOrder,
      startDate,
      endDate,
      companyName,
      profileId,
      description,
      userId
    });

    return Response.json({
      result: 'success',
      resumes,
      total
    });
  } catch (err) {
    console.error('get-resumes error:', err);
    return sendError(Response, { msg: 'Failed to fetch resumes' });
  }
};