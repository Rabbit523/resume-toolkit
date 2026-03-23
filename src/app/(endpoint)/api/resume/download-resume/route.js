export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { formatPhoneNumber } from '@/helpers/common';
import { sanitizeText, formatASCIIPart, sendError, buildResumeFilename } from '@/helpers/endpoint';
import profileModel from '@/models/profile.model';
import dbConnect from '@/mongodb';
import resumeModel from '@/models/resume.model';
import { generate_template1_pdf } from '@/lib/pdf/templates/pdf-template1';
import { generate_template2_pdf } from '@/lib/pdf/templates/pdf-template2';
import { generate_template3_pdf } from '@/lib/pdf/templates/pdf-template3';
import { generate_template4_pdf } from '@/lib/pdf/templates/pdf-template4';
import { generate_template5_pdf } from '@/lib/pdf/templates/pdf-template5';
import { generate_template6_pdf } from '@/lib/pdf/templates/pdf-template6';
import { generate_template7_pdf } from '@/lib/pdf/templates/pdf-template7';
import { generate_template8_pdf } from '@/lib/pdf/templates/pdf-template8';

export const POST = async (req) => {
  try {
    await dbConnect();

    const { profileId, resumeId } = await req.json();
    const profile = await profileModel.findById(profileId);
    const resume = await resumeModel.findById(resumeId);
    const completion = resume.resumeResponse;
    const addr = profile.profileAddress;
    const address =
      addr.street || addr.city || addr.state || addr.zip ? [addr.street, addr.city, addr.state, addr.zip].filter(Boolean).join(', ') : '';

    const data = {
      name: sanitizeText(profile.profileName),
      mobile: sanitizeText(formatPhoneNumber(profile.profileMobile)),
      email: sanitizeText(profile.profileEmail),
      linkedin: sanitizeText(profile.profileLinkedIn),
      address: sanitizeText(address),
      education: profile.profileEducation
    };
    const r = { ...completion, ...data };
    console.log(`r = `, r);

    const profileTemplate = profile?.profileTemplate || 'template2';
    const resume_name = buildResumeFilename({
      name: formatASCIIPart(r.name),
      role: formatASCIIPart(resume.jobTitle),
      company: formatASCIIPart(resume.companyName)
    });

    let pdfBytes = null;
    if (profileTemplate === 'template1') {
      pdfBytes = await generate_template1_pdf(r);
    } else if (profileTemplate === 'template2') {
      pdfBytes = await generate_template2_pdf(r);
    } else if (profileTemplate === 'template3') {
      pdfBytes = await generate_template3_pdf(r);
    } else if (profileTemplate === 'template4') {
      pdfBytes = await generate_template4_pdf(r);
    } else if (profileTemplate === 'template5') {
      pdfBytes = await generate_template5_pdf(r);
    } else if (profileTemplate === 'template6') {
      pdfBytes = await generate_template6_pdf(r);
    } else if (profileTemplate === 'template7') {
      pdfBytes = await generate_template7_pdf(r);
    } else if (profileTemplate === 'template8') {
      pdfBytes = await generate_template8_pdf(r);
    } else {
      pdfBytes = await generate_template1_pdf(r);
    }

    return new Response(new Uint8Array(Buffer.from(pdfBytes)), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${resume_name}.pdf"`
      }
    });
  } catch (error) {
    console.log(error);
    return sendError(Response, { msg: error?.message || 'Unknown error' });
  }
};
