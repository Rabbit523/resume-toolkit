export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { NextResponse } from 'next/server';
import { formatPhoneNumber } from '@/helpers/common';
import { sanitizeText, formatASCIIPart, buildResumeFilename, sendError } from '@/helpers/endpoint';
import OpenAI from 'openai';
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
import { resumeValidCheck } from '@/lib/resumeValidCheck';

export const POST = async (req) => {
  try {
    await dbConnect();

    const { profileId, desc, url, userId, companyName, position } = await req.json();

    const { exists } = await resumeValidCheck(profileId, url, desc, companyName, position);
    if (exists) {
      return NextResponse.json({ error: 'Resume already exists' }, { status: 409 });
    }

    const profile = await profileModel.findById(profileId);
    const profileTemplate = profile?.profileTemplate || 'template1';
    const completion = await generateResume(profile.profileWorkExperience, desc, profileTemplate);

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
    console.log({ r });

    const resume_name = buildResumeFilename({
      name: formatASCIIPart(r.name),
      role: formatASCIIPart(position),
      company: formatASCIIPart(companyName)
    });
    console.log(`name = `, resume_name);
    const resumeData = {
      companyName: companyName,
      jobTitle: position,
      jobLink: url,
      jobDescription: desc,
      resumeResponse: completion,
      resumeBuiltModel: 'gpt-4.1-nano',
      resumeFileName: resume_name,
      associatedUserId: userId,
      associatedProfileId: profileId
    };

    await resumeModel.create(resumeData);

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

const prepareResumePrompt_0 = (experienceDetails, jobDescription) => {
  let experiences = '';
  experienceDetails.map((experience) => {
    experiences += `${experience.jobTitle} at ${experience.employer} (${experience.startDate} - ${experience.endDate})`;
    experiences += `\n`;
  });

  return `Act as a senior US-based technical recruiter and hiring manager
specializing in the EXACT target position described in the job description.

You must adapt tone, bullet emphasis, technical depth, and impact metrics
specifically for this target role (not generic software engineering).

---------------------
GLOBAL RULES (STRICT)
---------------------
- Write in American English.
- Optimize for US recruiters and ATS systems (Greenhouse, Lever, Workday).
- Assume recruiters spend 6–10 seconds per resume.
- Prioritize relevance to the TARGET POSITION over general experience.
- Avoid vague language (“worked on”, “assisted”, “responsible for”).
- Do NOT inflate seniority or fabricate experience.
- Output VALID JSON ONLY.

---------------------
0) TARGET POSITION ANALYSIS (INTERNAL)
---------------------
Before generating content, internally infer:
- Role type (Backend / Frontend / Full-Stack / Platform / Infra / Data)
- Seniority level (Junior / Mid / Senior / Staff / Lead)
- Core evaluation signals recruiters expect for THIS role
- Key technologies and systems emphasized in the job description

Use this analysis to guide ALL sections below.

---------------------
1) POSITION-ALIGNED WORK EXPERIENCE
---------------------
For EACH role, generate:

- company_name
- company_location (city, state, US if applicable)
- job_title
- start_date_employment
- end_date_employment
- achievements (4–6 bullets ONLY; max 7 for senior+ roles)

ACHIEVEMENT BULLET RULES (MANDATORY):
Each bullet MUST:
- Start with a strong role-appropriate action verb
- Describe a concrete system, feature, or technical outcome
- Align directly with expectations of the TARGET POSITION
- Mention technologies ONLY if relevant to this role
- Include scope or impact where possible:
  (users, scale, latency, reliability, cost, revenue, developer velocity)

ROLE-SPECIFIC EMPHASIS:
- Backend roles → APIs, data models, performance, scalability, reliability
- Frontend roles → UX, performance, accessibility, state management
- Full-Stack roles → end-to-end ownership, architecture, integration
- Platform/Infra roles → CI/CD, cloud, observability, cost, reliability
- Senior+ roles → system design, ownership, mentoring, cross-team impact

DISALLOWED:
- Generic responsibility lists
- Tool dumping
- Multiple sentences per bullet
- Repeating the same achievement across roles

---------------------
2) POSITION-TARGETED PROFESSIONAL SUMMARY
---------------------
Write a 4–5 line professional summary that:
- Explicitly positions the candidate as a fit for the TARGET POSITION
- States role identity (e.g., “Senior Backend Software Engineer”)
- Highlights 3–4 core strengths required for this role
- Includes 1 system-level or business-level impact
- Sounds natural to a US hiring manager (not marketing copy)

---------------------
3) POSITION-PRIORITIZED TECHNICAL SKILLS
---------------------
Generate a technical skills section that:
- Is ordered by importance to the TARGET POSITION
- Is strictly derived from the job description + experience
- Contains ~25–40 skills total
- Excludes irrelevant, outdated, or junior-level tools

Two-level depth only. Example:

{
  "Languages": [],
  "Backend": [],
  "Frontend": [],
  "Databases": [],
  "Cloud & DevOps": []
}

Do NOT include categories that are not relevant to the target role.

---------------------
4) TARGET ROLE EXTRACTION
---------------------
From the job description, extract:
- target_company_name
- target_position

---------------------
OUTPUT FORMAT (JSON ONLY)
---------------------
{
  "work_experiences": [
    {
      "job_title": "",
      "company_name": "",
      "company_location": "",
      "start_date_employment": "",
      "end_date_employment": "",
      "achievements": []
    }
  ],
  "summary": "",
  "technical_skills": {},
  "target_company_name": "",
  "target_position": ""
}

---------------------
INPUT DATA
---------------------
Work Experience:
${experiences}

Job Description:
${jobDescription}
`;
};

const prepareResumePrompt = (experienceDetails, jobDescription) => {
  let experiences = '';
  experienceDetails.map((experience) => {
    experiences += `${experience.jobTitle} at ${experience.employer} (${experience.startDate} - ${experience.endDate})`;
    experiences += `\n`;
  });

  return `
You are a world-class technical resume assistant.

### SYSTEM INSTRUCTION
Make the resume align as closely as possible with the Job Description (JD).
Must proactively REPLACE, REPHRASE, and ADD bullet points under each Experience entry, especially recent/current roles, to ensure the language, skills, and technologies match the JD specifically.
Do NOT leave any Experience section or bullet point unchanged if it could better reflect or incorporate keywords, duties, or requirements from the JD.
Acceptable and encouraged to write NEW bullet points where there are relevant experiences (even if not previously mentioned).
Prioritize jobs/roles closest to the desired job.
Please write all documents like human is saying and writing, not like AI.

### Main objectives:
1. Maximize keyword/skills and responsibilities match between the resume and the job description (JD). Use the exact relevant technology, tool, process, or methodology names from the JD wherever accurate.
2. Preserve all original company names, job titles, and periods/dates in the Professional Experience section.
3. In each Experience/job entry, ensure 6-8 highly relevant and impactful bullet points. Aggressively update, rewrite, or add new ones so they reflect the actual duties, skills, or stacks requested in the JD—especially prioritizing skills, tools, or requirements from the current and most recent positions. If an original bullet or responsibility does not closely match the JD, replace or revise it.
4. In the Summary, integrate the most essential and high-priority skills, stacks, and requirements from the JD, emphasizing the strongest elements from the original. Keep it dense with relevant keywords and technologies, but natural in tone.
5. In every section (Summary, Experience, Skills), INCLUDE as many relevant unique keywords and technologies from the job description as possible.
6. Add or emphasize a comprehensive "Skills" section if missing, and ensure it features all key skills, stacks, programming languages, and tools from the job description for which the candidate is qualified.
7. For each experience, emphasize or add any additional skills, technologies, or stacks that are required or mentioned in the JD, if there is relevant background or reasonable context.
8. Do NOT use any section separators like "---" or similar. Use only clear, professional section headers.
9. Never use vague or buzzwordy language (like “results-driven”, “proven track record”, “team player”, "adept at", "meticulous", "dynamic" etc.). Be concise, specific, and let real achievements and skills stand out.
10. achievements must be in bullet points format and numbers of bullet points must be between 8 to 12 for each work experience.
11. Write in clean, plain text. Every section must be clearly headed (e.g., Summary, Professional Experience, Skills, Education). In "Skills", list one skill per line—do not use commas or paragraphs for skills.
12. Never combine all skills into a paragraph or comma-separated line; use a vertical, single-line list under Skills.
13. ensuring it aligns with the provided job description and my work experience and then categorize them with two-level depth like {"Frontend":["skill1","skill2","skill3","skill4","skill5"],"Backend":["skill1","skill2","skill3","skill4","skill5"],....}
14. Preserve all original quantified metrics (numbers, percentages, etc) and actively introduce additional quantification in new or reworded bullets wherever possible. Use measurable outcomes, frequency, scope, or scale to increase the impact of each responsibility or accomplishment. Strive for at least 75% of all Experience bullet points to include a number, percentage, range, or scale to strengthen ATS, recruiter, and hiring manager perception.
15. Strictly maximize verb variety: No action verb (e.g., developed, led, built, designed, implemented, improved, created, managed, engineered, delivered, optimized, automated, collaborated, mentored) may appear more than twice in the entire document, and never in adjacent or back-to-back bullet points within or across jobs. Each bullet must start with a unique, action-oriented verb whenever possible.
16. In all Experience bullets, prefer keywords and phrasing directly from the JD where it truthfully reflects the candidate’s background and would boost ATS/recruiter relevance.
17. Generate an ATS-friendly professional title based on the target position from the job description and the candidate’s most recent role seniority.
18. Rules for professional title generation:
   - Never downgrade seniority.
   - Preserve the job family from the target position.
   - If the candidate’s seniority is higher than the target position, combine the candidate’s seniority with the target job family.
   - Keep the title concise, standard, and recruiter-friendly.
   - Do not invent a different discipline outside the target_position job family.

Example:
Candidate most recent role: Senior Software Engineer
Target position: Full Stack Developer
Result: Senior Full Stack Developer

### Output
{
  "professional_title": "",
  "work_experiences": [{"job_title": "","company_name": "","start_date_employment": "","end_date_employment": "","achievements": []}],
  "summary": [],
  "technical_skills": {
    "Frontend":["skill1","skill2","skill3","skill4","skill5"],
    "Backend":["skill1","skill2","skill3","skill4","skill5"]
  },
  "target_company_name": "",
  "target_position": ""
}

### Here is my work experience:
${experiences}

### Here is the job description:
${jobDescription}
`;
};

const prepareResumePrompt_2 = (experienceDetails, jobDescription) => {
  let experiences = '';
  experienceDetails.map((experience) => {
    experiences += `${experience.jobTitle} at ${experience.employer} (${experience.startDate} - ${experience.endDate})\n`;
  });
  return `
Act as a senior US-based technical recruiter AND ATS optimization specialist hiring specifically for the EXACT role described in the job description.

You are optimizing for:
1) Human hiring managers
2) ATS keyword scanning systems
3) Semantic relevance scoring

---------------------------------------------------------
STEP 1 — STRICT KEYWORD EXTRACTION
---------------------------------------------------------
From the job description:
- Extract ALL required technical keywords
- Extract ALL architectural keywords
- Extract ALL compliance/security keywords
- Extract ALL cloud/infrastructure keywords
- Extract ALL soft leadership keywords

These MUST be embedded verbatim (exact phrase match) throughout the resume.

---------------------------------------------------------
STEP 2 — GENERATE PROFESSIONAL TITLE (HEADER)
---------------------------------------------------------

OBJECTIVE:
Generate an ATS-friendly professional title that aligns with BOTH:
1) The extracted target_position
2) The candidate’s most recent role seniority

CRITICAL LOGIC RULES:

1. Seniority Protection Rule (MANDATORY)
   - Determine the candidate’s highest or most recent seniority level from work_experiences.
   - If the candidate’s most recent role is MORE senior than the target_position,
     DO NOT downgrade the professional_title.
   - Never reduce Senior → Mid-Level → Junior.

2. Alignment Rule
   - The professional_title must stay within the same job family as target_position.
   - Do NOT introduce new domains (Cloud, Platform, Security, Infrastructure, Backend, etc.)
     unless explicitly present in target_position.

3. Seniority Resolution Matrix:

   CASE A:
   If candidate seniority == target_position seniority
   → Use target_position unchanged.

   CASE B:
   If candidate seniority > target_position seniority
   → Use candidate seniority + target job family.
   Example:
     Candidate: Senior Software Engineer
     Target: Mid-Level Full Stack Developer
     Result: Senior Full Stack Developer

   CASE C:
   If candidate seniority < target_position seniority
   → Use target_position unchanged.

4. Preserve the core job family exactly.
   If target_position says "Full Stack Developer",
   the title must contain "Full Stack Developer".

5. Allowed minor refinements:
   - Reorder wording for clarity.
   - Replace hyphen with parentheses.
   - Remove internal company codes.

6. Absolutely DO NOT:
   - Add new technology domains.
   - Add cloud/platform/security unless explicitly present.
   - Invent architectural scope.

Return:
"professional_title": ""

---------------------------------------------------------
STEP 3 — POSITION-ALIGNED WORK EXPERIENCE GENERATION
---------------------------------------------------------

OBJECTIVE:
Rewrite EACH provided role into a job-aligned, high-impact work experience section.

---------------------------------------------------------
PRIORITY ORDER (Highest → Lowest)
---------------------------------------------------------

1. Chronological integrity
2. Structural correctness
3. Role alignment with target job
4. Quantified impact
5. Tone refinement

If any rule conflicts, follow this priority order.

---------------------------------------------------------
PHASE 1 — JOB ANALYSIS (INTERNAL)
---------------------------------------------------------

Before writing:

Extract:
1) Core technologies
2) Architecture expectations
3) Product type
4) Business priorities
5) Seniority level

Reinterpret each past role through that lens,
without fabricating experience outside its timeline.

---------------------------------------------------------
PHASE 2 — OUTPUT STRUCTURE (STRICT JSON)
---------------------------------------------------------

Return:

{
  "work_experiences": [
    {
      "company_name": "",
      "company_location": "City, State, Country",
      "job_title": "",
      "start_date_employment": "",
      "end_date_employment": "",
      "achievements": []
    }
  ]
}

---------------------------------------------------------
STRUCTURAL ENFORCEMENT
---------------------------------------------------------

• Preserve role count exactly.
• Preserve company names exactly.
• Preserve employment dates exactly.
• Do NOT merge or omit roles.
• Only rewrite achievements.

---------------------------------------------------------
ACHIEVEMENT RULES
---------------------------------------------------------

For EACH role:

• Target 8 bullets per role.
• Maintain quality over quantity.
• Do not fabricate scope to reach 8.
• 250–300 characters per bullet
• ONE sentence per bullet
• Start with a strong, varied action verb
• Each bullet must include:
    - A concrete system or initiative
    - Technical approach
    - Measurable OR observable impact

---------------------------------------------------------
QUANTIFICATION RULE
---------------------------------------------------------

• At least ONE bullet per role MUST contain a quantified metric.
• Prefer percentage (e.g., improved load time by 28%).
• If not appropriate, use scale-based numbers (e.g., supported 40k+ users).
• Do NOT fabricate unrealistic metrics.
• Do NOT force metrics into every bullet.

---------------------------------------------------------
VERSION & TEMPORAL CONTROL (STRICT)
---------------------------------------------------------

1. A specific version number (e.g., Angular 21) may ONLY appear in roles
   whose employment dates overlap with or occur after that version’s release year.

2. If a role predates the version release:
   - Do NOT mention that version.
   - Do NOT mention upgrading to that version.
   - Do NOT imply migration to that version.
   - Do NOT reference architecture tied specifically to that version.

3. For older roles:
   - Refer to “modern Angular versions available at the time”
   - Or describe architectural readiness
   - Or describe standalone-aligned patterns without version naming

Version integrity overrides keyword embedding.

---------------------------------------------------------
ALIGNMENT RULE
---------------------------------------------------------

• Mention technologies ONLY if:
    - They appear in the job description
    - They were realistically usable during that role

• Do NOT inject unrelated architecture (cloud, distributed systems, etc.)
  unless clearly required in the job description.

---------------------------------------------------------
DISALLOWED
---------------------------------------------------------

❌ Generic responsibility lists  
❌ Tool stacking  
❌ Repeating sentence patterns  
❌ Buzzword stuffing  
❌ Multiple sentences per bullet  
❌ Future-version leakage  

---------------------------------------------------------
FINAL VALIDATION
---------------------------------------------------------

Before output, confirm:

✓ Role count matches input  
✓ No future technology versions in past roles  
✓ Dates unchanged  
✓ Companies unchanged  
✓ At least one quantified bullet per role  
✓ Bullets reflect job priorities  
✓ No fabricated architecture claims  

Return final JSON only.

---------------------------------------------------------
STEP 4 — SUMMARY SECTION
---------------------------------------------------------
Create a 5-7 bullet executive summary that:
- Clearly states 8+ years of full-stack development experience
- Mentions service-oriented architectures and distributed systems
- Mentions Python, relational databases, AWS
- Mentions data-intensive applications
- Mentions reliability engineering and security best practices
- Mentions mentoring engineers
- Mentions performance optimization

---------------------------------------------------------
STEP 5 — TECHNICAL SKILLS SECTION
---------------------------------------------------------
Categorize skills with TWO-LEVEL DEPTH:

{
  "Programming Languages": [],
  "Cloud & Infrastructure": [],
  "Architecture & Design": [],
  "Data & Databases": [],
  "DevOps & Reliability": [],
  "Security & Compliance": [],
  "Leadership": []
}

Rules:
- Include ALL keywords from job description.
- Do not omit required technologies.
- Use exact phrasing from job description.

---------------------------------------------------------
STEP 6 — TARGET INFORMATION
---------------------------------------------------------
Extract from job description:
{
  "target_company_name": "",
  "target_position": ""
}

---------------------------------------------------------
OUTPUT FORMAT (JSON ONLY)
---------------------------------------------------------
{
"work_experiences": [
  {
    "job_title": "",
    "company_name": "",
    "start_date_employment": "",
    "end_date_employment": "",
    "achievements": []
  }
],
"summary": [],
"technical_skills": {},
"target_company_name": "",
"target_position": "",
"professional_title": "",
}

### Here is my work experience:
${experiences}

### Here is the job description:
${jobDescription}
`;
};

const prepareResumePrompt_1 = (experienceDetails, jobDescription) => {
  let experiences = '';
  experienceDetails.map((experience) => {
    experiences += `${experience.jobTitle} at ${experience.employer} (${experience.startDate} - ${experience.endDate})\n`;
  });

  return `
Act as a senior US-based technical recruiter, hiring manager, and ATS optimization specialist.

Your goal is to generate a HIGH-CONVERSION technical resume optimized for:

1) Human recruiters
2) Hiring managers
3) ATS parsing systems

This resume should sound **like it was written by a real senior engineer**, not by AI.

---------------------------------------------------------
GLOBAL WRITING RULES
---------------------------------------------------------

• Every bullet MUST describe:
  - a real system or feature
  - the technical approach used
  - the outcome or impact

• Avoid vague phrases such as:
  "responsible for", "worked on", "various technologies", "helped with".

• Prefer this structure:

  Action + System/Feature + Technology + Outcome

Example:

BAD:
"Implemented scalable architectures for backend services."

GOOD:
"Built Node.js APIs powering payment workflows that processed 2M+ monthly transactions."

---------------------------------------------------------
STEP 1 — KEYWORD ANALYSIS
---------------------------------------------------------

From the job description extract:

• Required technologies
• Frameworks
• Cloud platforms
• Infrastructure tools
• Security/compliance concepts
• Leadership signals

These technologies should appear naturally across the resume.

DO NOT keyword stuff.

Use technologies only where they make sense for the role.

---------------------------------------------------------
STEP 2 — PROFESSIONAL TITLE GENERATION
---------------------------------------------------------

Generate an ATS-friendly professional title that aligns with:

• target_position from job description
• candidate's most recent role seniority

RULES:

1. Never downgrade seniority.
2. Preserve the job family from the target position.
3. If candidate seniority is higher, combine seniority with job family.

Example:

Candidate: Senior Software Engineer  
Target: Full Stack Developer  

Result:
Senior Full Stack Developer

Return:

"professional_title": ""

---------------------------------------------------------
STEP 3 — POSITION-ALIGNED EXPERIENCE GENERATION
---------------------------------------------------------

Rewrite each role to align with the job description while preserving:

• company name
• employment dates
• job title
• role count

Do NOT fabricate new companies or roles.

---------------------------------------------------------
ACHIEVEMENT STRUCTURE
---------------------------------------------------------

For EACH role:

• Target 8 bullets
• Each bullet: 250–300 characters
• ONE sentence per bullet
• Start with a strong action verb
• Avoid repeating the same verbs
• Each bullet must describe a **specific technical contribution**

Each bullet must include:

1) a system or product
2) the technical implementation
3) a measurable or observable outcome

---------------------------------------------------------
QUANTIFICATION RULE
---------------------------------------------------------

At least ONE bullet per role must contain a metric:

Examples:

• reduced latency by 35%
• supported 100k+ users
• processed 5M+ records daily
• improved deployment speed by 60%

Do NOT fabricate unrealistic numbers.

---------------------------------------------------------
ANTI-GENERIC LANGUAGE RULE
---------------------------------------------------------

The following phrases are NOT allowed:

• "leveraged modern technologies"
• "responsible for"
• "worked with various tools"
• "helped improve performance"
• "participated in development"

Each bullet must reference something concrete such as:

• payment service
• customer dashboard
• internal data pipeline
• authentication service
• billing platform
• analytics pipeline

---------------------------------------------------------
TECHNOLOGY USAGE RULE
---------------------------------------------------------

Mention technologies only if:

1) they appear in the job description
OR
2) they are realistically used in that role.

Do NOT force technology names into every bullet.

Natural usage is preferred.

---------------------------------------------------------
VERSION CONTROL RULE
---------------------------------------------------------

Technology versions may only appear if they existed during the role timeline.

Example:

If Angular 17 released in 2023,
do not reference it in a role from 2019.

For older roles:

Use wording such as:
"modern Angular architecture patterns available at the time."

---------------------------------------------------------
STRUCTURAL ENFORCEMENT
---------------------------------------------------------

Return this exact JSON structure:

{
  "work_experiences": [
    {
      "company_name": "",
      "company_location": "City, State, Country",
      "job_title": "",
      "start_date_employment": "",
      "end_date_employment": "",
      "achievements": []
    }
  ]
}

---------------------------------------------------------
STEP 4 — EXECUTIVE SUMMARY
---------------------------------------------------------

Create a 5–7 bullet professional summary.

The summary should clearly highlight:

• 8+ years of engineering experience
• full-stack or backend expertise
• distributed systems
• cloud platforms (AWS/Azure/GCP if applicable)
• building scalable production systems
• mentoring engineers
• reliability and performance optimization

Each summary bullet must be:

• 1 sentence
• 180–220 characters
• focused on concrete expertise

---------------------------------------------------------
STEP 5 — TECHNICAL SKILLS
---------------------------------------------------------

Create a categorized skills section:

{
  "Programming Languages": [],
  "Frameworks": [],
  "Cloud & Infrastructure": [],
  "Architecture & Design": [],
  "Databases": [],
  "DevOps": [],
  "Security": [],
  "Leadership": []
}

Rules:

• Include all technologies mentioned in the job description
• Avoid duplicate technologies
• Use exact naming from the job description

---------------------------------------------------------
STEP 6 — TARGET INFORMATION
---------------------------------------------------------

Extract from the job description:

{
  "target_company_name": "",
  "target_position": ""
}

---------------------------------------------------------
FINAL VALIDATION
---------------------------------------------------------

Before returning the response ensure:

✓ Role count matches input  
✓ Companies unchanged  
✓ Dates unchanged  
✓ 8 bullets per role (when possible)  
✓ Each bullet describes a concrete technical system  
✓ At least one quantified metric per role  
✓ No vague language  
✓ Technologies appear naturally  

---------------------------------------------------------
OUTPUT FORMAT
---------------------------------------------------------

Return JSON only.

{
"work_experiences": [
  {
    "job_title": "",
    "company_name": "",
    "start_date_employment": "",
    "end_date_employment": "",
    "achievements": []
  }
],
"summary": [],
"technical_skills": {},
"target_company_name": "",
"target_position": "",
"professional_title": ""
}

---------------------------------------------------------
CANDIDATE EXPERIENCE
---------------------------------------------------------

${experiences}

---------------------------------------------------------
JOB DESCRIPTION
---------------------------------------------------------

${jobDescription}
`;
};

const prepareTwoColResumePrompt = (experienceDetails, jobDescription) => {
  let experiences = '';
  experienceDetails.map((experience) => {
    experiences += `${experience.jobTitle} at ${experience.employer} (${experience.startDate} - ${experience.endDate})\n`;
  });

  return `
You are a senior US-based technical recruiter, ATS optimization specialist,
AND executive resume strategist.

This resume will be rendered in a PREMIUM 2-COLUMN single-page format.

The LEFT column contains:
• Summary (MAX 3 sentences)
• Work Experience (MAX 4–5 bullets per role)
• Education

The RIGHT column contains:
• Core Skills
• Key Achievements
• Courses
• Interests

The resume MUST be:
• Clean
• Highly impactful
• Balanced between columns
• Optimized for ATS and humans
• 1 PAGE ONLY
• Senior-level professional tone

---------------------------------------------------------
STEP 1 — STRICT KEYWORD EXTRACTION
---------------------------------------------------------
From the job description:
- Extract ALL required technical keywords
- Extract ALL architectural keywords
- Extract ALL compliance/security keywords
- Extract ALL cloud/infrastructure keywords
- Extract ALL leadership keywords

These MUST be embedded naturally throughout the resume.

---------------------------------------------------------
STEP 2 — GENERATE PROFESSIONAL HEADER TITLE
---------------------------------------------------------
Create a strong, market-aligned professional title
based strictly on the job description.

Examples:
- Senior Backend Engineer | Distributed Systems
- Cloud Platform Engineer | AWS & Reliability
- Senior Full-Stack Engineer | Scalable Architectures
- Software Engineer | Healthcare Systems & Compliance

Return as:
"professional_title": ""

---------------------------------------------------------
STEP 3 — SUMMARY (MAX 3 SENTENCES)
---------------------------------------------------------
Rules:
- 2–3 sentences only
- Mention total years of experience
- Mention architecture focus
- Mention core tech stack
- Mention reliability/security
- Mention business impact
- No fluff
- Senior authoritative tone

---------------------------------------------------------
STEP 4 — WORK EXPERIENCE
---------------------------------------------------------
For each job:

Return JSON with:
{
  job_title,
  company_name,
  start_date_employment,
  end_date_employment,
  achievements: []
}

STRICT RULES:
- 4 or 5 bullets MAX per role
- Each bullet 160–220 characters
- Each bullet must contain at least ONE keyword from job description
- Emphasize:
    - full-stack development
    - service-oriented architectures
    - distributed systems
    - event-driven architectures
    - data-intensive applications
    - observability and monitoring
    - reliability engineering
    - security best practices
- Include measurable impact when possible
- Prioritize modernization, scalability, compliance
- Avoid redundancy

---------------------------------------------------------
STEP 5 — RIGHT COLUMN CONTENT GENERATION
---------------------------------------------------------

Generate:

1) Core Skills (12–18 total skills)
   - Short, chip-friendly phrases
   - Extract directly from job description
   - Include stack, cloud, architecture, compliance

2) Key Achievements (3–5 items)
   - Realistic
   - Executive-level impact statements
   - Aligned to job description
   - Measurable where possible

3) Courses (2–3 relevant, realistic)
   - Based on technologies mentioned
   - Cloud / DevOps / Security preferred

4) Interests (2–3 professional interests)
   - Cloud, AI, distributed systems, open-source
   - Must feel authentic and senior-level

---------------------------------------------------------
STEP 6 — BALANCED LENGTH CONTROL
---------------------------------------------------------
IMPORTANT:

The LEFT column (summary + experience + education)
and RIGHT column (skills + achievements + courses + interests)
must be visually balanced.

Do NOT overload one side.

---------------------------------------------------------
STEP 7 — TARGET INFO
---------------------------------------------------------
Extract:
{
  "target_company_name": "",
  "target_position": ""
}

---------------------------------------------------------
FINAL OUTPUT FORMAT (JSON ONLY)
---------------------------------------------------------

{
  "professional_title": "",
  "summary": [],
  "work_experiences": [],
  "technical_skills": [],
  "key_achievements": [],
  "courses": [],
  "interests": [],
  "education": [],
  "target_company_name": "",
  "target_position": ""
}

---------------------------------------------------------

Here is my work experience:
${experiences}

Here is the job description:
${jobDescription}
`;
};

const prepareResumePrompt_ATS_Friendly = (experienceDetails, jobDescription) => {
  let experiences = '';
  experienceDetails.map((experience) => {
    experiences += `${experience.jobTitle} at ${experience.employer} (${experience.startDate} - ${experience.endDate})\n`;
  });
  return `
    ### SYSTEM INSTRUCTION (UPDATED)

1. Align strongly with the Job Description (JD), but NEVER fabricate experience. Only adapt, rephrase, or expand based on realistic and transferable experience.

2. Prioritize IMPACT over keyword stuffing:
   - Each bullet must clearly show outcome, scale, or business value.
   - At least 70% of bullets must include numbers, scale, or measurable results.

3. Bullet rules:
   - 5–8 bullet points per role (not more)
   - Each bullet must be concise (1–2 lines max)
   - Use varied action verbs, but do NOT force unnatural synonyms

4. Rewrite bullets to match JD technologies and responsibilities where truthfully applicable:
   - Prefer JD keywords (tools, frameworks, processes)
   - Emphasize system design, ownership, and complexity

5. Focus especially on MOST RECENT roles:
   - Add or strengthen backend, data, AI, cloud, or system-level work if relevant

6. Summary:
   - 4–6 lines max
   - Focus on strongest technical strengths + JD alignment
   - Mention 2–3 standout systems or domains (e.g., data pipelines, integrations, scalable systems)

7. Skills:
   - Group into categories (Frontend, Backend, Cloud, Data, Tools)
   - Only include skills that are actually relevant
   - Avoid overloading with unnecessary tools

8. Maintain clean, human-readable tone:
   - Avoid buzzwords
   - Avoid robotic phrasing
   - Make it sound like a strong senior engineer wrote it

9. Professional Title:
   - Align with target role
   - Never downgrade seniority
   - Keep concise and standard

10. Optimize for BOTH:
   - ATS keyword matching
   - Human readability (hiring manager scan in 10–15 seconds)
  `;
};

const getAICompletion = async (prompt) => {
  const model = 'gpt-4.1-nano';
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const completion = await openai.chat.completions.create({ model, messages: [{ role: 'user', content: prompt }], temperature: 0.7 });
  return JSON.parse(completion.choices[0].message.content); // Validate JSON
};

const generateResume = async (experienceDetails, jobDescription, profileTemplate = 'template1') => {
  const prompt =
    profileTemplate === 'template6'
      ? prepareTwoColResumePrompt(experienceDetails, jobDescription)
      : prepareResumePrompt(experienceDetails, jobDescription);

  const completion = await getAICompletion(prompt);

  return completion;
};
