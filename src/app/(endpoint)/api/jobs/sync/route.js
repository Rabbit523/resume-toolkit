export const dynamic = 'force-dynamic';
export const revalidate = 0;

import dbConnect from '@/mongodb';
import { decodedToken, sendError } from '@/helpers/endpoint';
import { CONSTANT_USER_ROLE_ADMIN, ERROR_FAILED, ERROR_SUCCESS } from '@/config/constants';
import jobModel from '@/models/job.model';
import userModel from '@/models/user.model';
const { getJson } = require('serpapi');

async function serpRequest(params) {
  const SERP_KEYS = process.env.SERP_KEYS.split(',');

  for (let i = 0; i < SERP_KEYS.length; i++) {
    const key = SERP_KEYS[i];

    try {
      const result = await getJson({ ...params, api_key: key });
      return result; // success
    } catch (err) {
      const msg = err?.message || '';

      const isCreditError = msg.includes('exceeded') || msg.includes('limit') || msg.includes('billing') || msg.includes('quota');

      if (isCreditError) {
        console.warn(`SerpAPI key exhausted: ${key}`);
        continue; // try next key
      }

      // Unknown error → stop immediately
      throw err;
    }
  }

  throw new Error('All SerpAPI API keys exhausted');
}

export const GET = async (req) => {
  try {

    await dbConnect();

    const token = decodedToken(req);
    const userId = token.uuid;
    const adminUser = await userModel.findById(userId);

    if (adminUser.role === CONSTANT_USER_ROLE_ADMIN) {
      let keywords = req.nextUrl.searchParams.get('keywords') || '';
      let allJobs = [];
      let nextPageToken = null;
      let page = 1;

      while (true) {
        const params = { engine: 'google_jobs', q: keywords };
        if (nextPageToken) {
          params.next_page_token = nextPageToken;
        }

        const result = await serpRequest(params);

        const jobs = result.jobs_results || [];

        allJobs.push(...jobs);

        nextPageToken =
          result.serpapi_pagination && result.serpapi_pagination.next_page_token ? result.serpapi_pagination.next_page_token : null;

        if (!nextPageToken) break; // Stop when no more pages
        if (page++ > 20) break; // Safety stop
      }

      // Map jobs
      const mapped = allJobs.map((job) => {
        // Convert detected_extensions values (booleans → string)
        const detectedValues = Object.entries(job.detected_extensions).map(([key, value]) => {
          if (typeof value === 'boolean' && value === true) {
            // convert key to readable label
            return key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
          }
          return value; // non-boolean values stay as-is
        });

        // Merge detected + extensions
        const merged = [...detectedValues, ...job.extensions.map((v) => String(v))];

        // Remove duplicates
        const uniqueValues = [...new Set(merged)];

        // Convert to final string
        const mergedExtensions = uniqueValues.join(', ');

        return {
          title: job.title || '',
          company_name: job.company_name || '',
          apply_options: job.apply_options || [],
          extensions: mergedExtensions,
          job_id: job.job_id || ''
        };
      });

      try {
        await jobModel.insertMany(mapped, { ordered: false });
      } catch (err) {
        if (err.code !== 11000) {
          console.error('Insert error:', err);
        }
      }
      return Response.json({ result: ERROR_SUCCESS, msg: 'Success to fetch jobs' });
    }
    return Response.json({ result: ERROR_FAILED, msg: 'Failed to fetch jobs' });
  } catch (err) {
    console.error(err);
    return sendError(Response, { msg: 'Failed to fetch jobs' });
  }
};
