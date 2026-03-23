import { NextResponse } from 'next/server';
import { resumeValidCheck } from '@/lib/resumeValidCheck';

export async function POST(req) {
  const { profileId, jobLink, jobDescription, companyName, position } = await req.json();

  const { exists } = await resumeValidCheck(profileId, jobLink, jobDescription, companyName, position);

  return NextResponse.json({ exists }, { status: exists ? 409 : 200 });
}
