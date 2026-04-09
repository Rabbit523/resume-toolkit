import crypto from 'crypto';
import mongoose from 'mongoose';
import resumeModel from '@/models/resume.model';
import dbConnect from '@/mongodb';

function normalizeText(text = '') {
  return String(text)
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .trim();
}

function hashString(text) {
  return crypto.createHash('sha256').update(normalizeText(text)).digest('hex');
}

// Note: Possible to update validation check for disallowing job link and job description change trick
export async function resumeValidCheck(profileId, jobLink, jobDescription, companyName, position) {
  await dbConnect();

  const link = normalizeText(jobLink);
  const company = normalizeText(companyName);
  const role = normalizeText(position);

  const profileObjectId = mongoose.Types.ObjectId.isValid(profileId) ? new mongoose.Types.ObjectId(profileId) : profileId;

  const existingResumes = await resumeModel
    .find({
      associatedProfileId: profileObjectId,
      jobLink: link,
      companyName: company,
      jobTitle: role
    })
    .select('jobDescription companyName jobTitle jobLink');

  if (!existingResumes.length) return { exists: false };

  const incomingHash = hashString(jobDescription);

  const isSame = existingResumes.some((resume) => hashString(resume.jobDescription) === incomingHash);

  return { exists: isSame };
}
