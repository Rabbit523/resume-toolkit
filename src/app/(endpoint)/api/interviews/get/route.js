export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { getInterviews } from '@/services/(endpoint)/interviews/interviews.controller';
import { sendError } from '@/helpers/endpoint';

export const GET = async (req) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const params = new URLSearchParams(url.search); // Parse query parameters

  // Get page and limit from URL, with defaults if not provided
  const page = parseInt(params.get('page') || 1, 10); // Default to 1 if not set
  const limit = parseInt(params.get('limit') || 20, 10); // Default to 20 if not set
  try {
    const skip = (page - 1) * limit;
    const { interviews, total } = await getInterviews({ skip, limit });

    return Response.json({ result: 'success', interviews, total });
  } catch (err) {
    console.error('get-interviews error:', err);
    return sendError(Response, { msg: 'Failed to fetch interviews' });
  }
};
