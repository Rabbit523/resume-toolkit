export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { NextResponse } from 'next/server';
import { formatPhoneNumber } from '@/helpers/common';
import { sanitizeText, formatASCIIPart, buildResumeFilename, sendError, sanitizeJobDescription } from '@/helpers/endpoint';
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
import { generate_template9_pdf } from '@/lib/pdf/templates/pdf-template9';
import { resumeValidCheck } from '@/lib/resumeValidCheck';

export const POST = async (req) => {
  try {
    await dbConnect();

    const { profileId, desc, url, userId, companyName, position, resumeType } = await req.json();

    const { exists } = await resumeValidCheck(profileId, url, desc, companyName, position);
    if (exists) {
      return NextResponse.json({ error: 'Resume already exists' }, { status: 409 });
    }

    const profile = await profileModel.findById(profileId);
    const profileTemplate = profile?.profileTemplate || 'template1';
    const completion = await generateResume(profile.profileWorkExperience, desc, profileTemplate, resumeType);

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
      resumeBuiltModel: 'gpt-5-nano', //'gpt-4.1-nano',
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
    } else if (profileTemplate === 'template9') {
      pdfBytes = await generate_template9_pdf(r);
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
DO NOT USE THE BUZZWORDS, VAGUE PHRASES, OR robotic phrasing commonly found in AI-generated resumes. Make it sound like a real senior engineer wrote it.
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

### Output
{
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

// Note: Possible to select prompt for users
const hybridResumePrompt = (experienceDetails, jobDescription) => {
  let experiences = '';
  experienceDetails.map((experience) => {
    experiences += `${experience.jobTitle} at ${experience.employer} (${experience.startDate} - ${experience.endDate})`;
    experiences += `\n`;
    if (experience.description) {
      experiences += `${experience.description}\n`;
    }
    if (experience.achievements && experience.achievements.length > 0) {
      experience.achievements.forEach((item) => {
        experiences += `- ${item}\n`;
      });
    }
    experiences += `\n`;
  });

  return `
You are an expert resume writer for hybrid and customer-facing technology roles, including service architecture, presales engineering, solutions consulting, technical product roles, and business analysis.

SYSTEM INSTRUCTION
Rewrite the resume so it aligns strongly with the target job description while staying believable, technically credible, and grounded in the candidate's actual background.
- Do NOT change company names or employment dates.
- Do NOT invent unrealistic achievements, fake business outcomes, fake domains, or tools the candidate would not plausibly have used.
- Do NOT change the required JSON output structure.
- Output must be valid JSON only — no explanation, commentary, or markdown outside the JSON object.

CORE GOAL
The two most important parts of this task are:
1. The achievement bullets under each work experience
2. The skills section

Both must reflect the actual target role correctly.
A technically strong resume can still fail if the skills and bullet emphasis reflect the wrong kind of job.

ROLE CONTEXT
This prompt is for hybrid / service / solutions / presales / product / business-analysis roles. Examples:
- Service Architect
- Solutions Architect
- Presales Engineer
- Sales Engineer
- Technical Consultant
- Product Manager
- Business Analyst
- Service Designer
- Customer Solutions Lead
- Technical Account Manager

These roles prioritize turning customer or business requirements into structured solutions, workflows, services, proposals, documentation, service definitions, operational models, cross-team coordination, customer communication, or platform/process alignment more than day-to-day coding depth.

GENERAL WRITING RULES
- Tailor the resume to the JD, but do not force every past job to look identical to the target role.
- Use JD terminology only when it honestly fits the candidate's actual background.
- Preserve strong original bullets if they are already specific, credible, and relevant.
- Rewrite weak, vague, repetitive, inflated, or mismatched bullets.
- Add new bullets only when they are a reasonable extension of the candidate's known experience, responsibilities, or stack.
- Make the candidate sound like a strong fit, but never fabricated.
- Write like a real human wrote it, not like an AI resume generator.
- Prefer credibility over keyword stuffing.

ACHIEVEMENT WRITING RULES
For each work experience:
- Write 5 to 8 bullet points.
- Focus on quality over quantity.
- Recent and most relevant roles should get the strongest tailoring.
- Older roles can be slightly shorter and more foundational.

Each bullet should usually reflect some version of:
[action] + [what was owned / changed / delivered / clarified / designed / supported] + [how / tools / stakeholders / systems / process] + [result / impact / scope / operational outcome]

A good bullet should reveal one or more of these:
- ownership
- complexity
- process or service definition
- scale
- decision-making
- operational impact
- customer impact
- cross-team alignment
- delivery outcome

METRICS RULES
- Use metrics only when they sound realistic, defensible, and useful.
- Good metrics include:
  number of workflows supported
  bid volume
  reduction in manual effort
  faster onboarding
  number of stakeholders or teams involved
  SLA / incident / ticket improvements
  proposal turnaround
  catalogue coverage
- Do NOT force every bullet to have a number.
- If a metric sounds inflated, indirect, or hard to defend, rewrite it into a more believable operational outcome.
- Avoid suspicious claims like:
  "95% increase in customer confidence"
  "15% increase in cross-selling"
  "95% delivery accuracy"
  "remarkable improvement"
  "massive gains"

STYLE RULES
- Write in clean, natural, professional English.
- Avoid buzzwords and corporate filler such as:
  results-driven
  proven track record
  dynamic
  team player
  self-starter
  go-getter
  passionate
  adept at
  meticulous
  synergized
  world-class
  exceptional
- Do not use robotic phrasing or repetitive sentence patterns.
- Do not overstuff keywords unnaturally.
- Vary wording naturally, but do not force artificial verb diversity rules.
- Prefer direct, specific language over vague business language.
- Make the tone sound like a real senior professional describing meaningful work.

BULLET RULES
Work experience bullets must foreground:
- requirements shaping, service/process definition, stakeholder engagement, documentation, delivery alignment, solution framing, reusable assets, operating model design, and customer-facing problem solving.
- Coding languages and frameworks may appear only as supporting background or in a condensed technical category if they help credibility.
- The resume should make the recruiter think: "this person can define, structure, articulate, and operationalize services or solutions," not "this person is mainly applying for a software engineering job."

Strong bullet examples:
- "Worked with sales, operations, and engineering stakeholders during presales cycles to translate customer onboarding and support requirements into structured service workflows, clarifying ownership boundaries, escalation paths, SLA assumptions, and delivery dependencies before proposals were finalized."
- "Standardized recurring customer requests into reusable service parameters and response templates, reducing bespoke effort across tender submissions, statements of work, and internal handover discussions."
- "Facilitated discovery sessions with technical and non-technical stakeholders to turn loosely defined customer asks into documented service models covering ticket routing, reporting expectations, onboarding steps, and service desk interaction points."
- "Partnered with CRM and business systems teams to define service-related parameters, selectable options, and downstream operational impacts for new offerings, improving clarity on what was standard, configurable, or outside catalogue scope."
- "Supported bid and proposal work by drafting service descriptions, scope assumptions, and workflow text that commercial and delivery teams could use consistently across customer-facing documentation."

BULLET EMPHASIS — prioritize these themes:
1. Customer requirement interpretation
2. Service definition and workflow/process design
3. Presales, bids, tenders, proposals, SoWs, MSAs
4. Operational alignment with delivery/support teams
5. Standardization, service catalogues, reusable assets
6. Workshops, stakeholder communication, documentation
7. Technical background as support, not as dominant identity

SUMMARY RULES
Write 3 to 4 sentences in the summary.
- Position the candidate as a strong service / solutions / presales / process / architecture hire depending on the JD.
- Emphasize ability to turn ambiguous requirements into structured, deliverable definitions, workflows, solutions, or service models.
- Mention customer-facing, operational, and cross-functional strengths first.
- Technical background may appear, but should not dominate unless the JD clearly wants it.

SKILLS RULES
This is one of the most important sections.

STEP 1 — BUILD SKILLS BASED ON WHAT THE JD ACTUALLY VALUES
- Do NOT lead with programming languages and engineering frameworks unless the JD clearly expects them as a meaningful part of the job.
- Build the skills section around what the JD actually values.
- Extract the skill categories directly from the JD language.
- Good category patterns may include:
  Service Architecture
  Service Design & Process
  Presales & Bid Support
  Stakeholder Engagement
  Operations & Delivery Alignment
  Platforms & Tools
  Domain Knowledge
  Technical Background
- Use "Technical Background" as a smaller, supporting category only when it helps credibility.
- The skills section must look like it belongs to the target role, not to the candidate's old role.

STEP 2 — STRICT SKILL SELECTION RULE
Every skill listed must satisfy at least one of these:
- explicitly requested in the JD
- clearly implied by the JD
- strongly useful for the target role
- grounded in the candidate's actual background

If a skill is real but irrelevant to the target role, remove it.

STEP 3 — FINAL SKILLS CHECK
Before outputting, verify:
- the skills section matches the target role identity
- the categories fit the JD
- the section would make a recruiter think the candidate belongs in this role
- there is no engineering-heavy skill dump for a non-engineering or hybrid role

EXPERIENCE ALIGNMENT RULES
- The most recent roles carry the strongest tailoring.
- Do not bury service/process/customer-facing achievements under engineering stack bullets.
- If a past role was engineering-heavy but the target role is this type, reinterpret the work through the lens of:
  solution design
  stakeholder alignment
  requirements translation
  workflow definition
  service operationalization
  documentation
  handoff readiness
  cross-team coordination
while staying truthful to the original experience.

TECHNICAL BACKGROUND REPOSITIONING RULE
If the candidate comes from engineering:
- preserve the technical background as a supporting strength
- do not let it dominate the summary, skills, or first impression
- use it as evidence that the candidate can communicate effectively with technical teams, validate deliverability, and translate complex requirements into workable service or solution definitions

JOB TITLE REWRITING RULE
The candidate's original job titles come from a software engineering background and must be rewritten to reflect the target role type. This is essential — a recruiter seeing "Lead Software Engineer" on a presales or service role resume will immediately question the fit.

Rules:
- Rewrite each job title to reflect the seniority level and function most relevant to the target role
- The rewritten title must be believable given the company, dates, and actual work described
- Do not invent titles that are implausible for the company size or industry
- Mirror the seniority progression of the original titles (junior → mid → senior → lead)
- Draw the new title language from the target JD where possible

Example rewrites for a presales / solutions / service target role:
  "Lead Software Engineer"      → "Lead Solutions Engineer" or "Senior Presales Engineer"
  "Senior Software Engineer"    → "Senior Technical Consultant" or "Solutions Engineer"
  "Middle Software Engineer"    → "Technical Consultant" or "Solutions Analyst"
  "Junior Software Engineer"    → "Junior Technical Consultant" or "Associate Solutions Engineer"

Use the target JD's exact role language as the anchor when choosing titles.

HARD CONSTRAINTS
- Preserve all company names exactly.
- Preserve all employment dates exactly.
- Do not fabricate tools, certifications, industries, or domain knowledge with no support.
- Do not exaggerate scope beyond what is plausible.
- Do not output any explanation, commentary, markdown, or text outside the JSON object.
- Output must be valid JSON only.

FINAL QUALITY CHECK BEFORE OUTPUT
Before producing the final JSON, verify all of the following:
- the summary matches the target role
- the skills section matches the target role
- the work experience bullets match the target role
- the candidate sounds believable and strong
- the resume is tailored, but not over-tailored
- the bullets show ownership, complexity, and outcomes
- the writing is natural and human
- the content is not stuffed with fake metrics or irrelevant keywords
- the resume does not read like a standard software engineer resume

OUTPUT FORMAT
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
  "technical_skills": {
    "Category1": ["skill1", "skill2", "skill3"],
    "Category2": ["skill1", "skill2", "skill3"]
  },
  "target_company_name": "",
  "target_position": ""
}

Here is my work experience:
${experiences}

Here is the job description:
${jobDescription}
`;
};
/*
const engineeringResumePrompt = (experienceDetails, jobDescription) => {
  let experiences = '';
  experienceDetails.forEach((exp) => {
    experiences += `${exp.jobTitle} at ${exp.employer} (${exp.startDate} - ${exp.endDate})\n`;
  });
  console.log({ experiences });
  return `
You are an expert technical resume writer for senior engineers.

Rewrite the resume to strongly align with the target job while remaining truthful and grounded in the candidate's real experience.

#CORE RULES
- Do NOT change company, title, or dates
- Do NOT invent tools, systems, or metrics
- Use only supported evidence
- Output ONLY valid JSON

#ROLE ALIGNMENT (CRITICAL)
- Identify the target role's core domain (DevOps, ML, Data, Backend, Security, Platform, Salesforce, etc.)
- Prioritize relevant experience, tools, and systems
- De-emphasize unrelated but supported technologies
- Do NOT include everything — select what strengthens alignment
- Prefer platform-specific terminology when applicable (e.g., Apex, Kubernetes, Spark, etc.)
- Avoid generic system descriptions when specific technologies are available

#TITLE
- 3~7 words
- aligned with target role
- realistic (no exaggeration)

#SUMMARY
- 3~4 sentences, natural human tone
- Sentence 1: role identity + strongest technical differentiator (e.g., scale, domain, system type)
- Sentence 2: systems built
- Sentence 3: performance / reliability / operations
- Sentence 4 (optional): mentoring or ownership

Rules:
- Do NOT list many tools
- Avoid repeating the same capability across sentences
- Must read like human-written, not keyword-stuffed

#ACHIEVEMENTS (MOST IMPORTANT)
Each bullet MUST include:
- what was built or improved
- at least one concrete technology or platform mechanism
- context (API, pipeline, integration, cloud, etc.)
- measurable impact OR system-level outcome when possible

Strong preference:
- quantified technical impact (scale, throughput, latency, deployment speed)
- specific implementation details (e.g., Batch Apex, Kafka, Airflow)
- system-level thinking (performance, reliability, data volume)

Strict rules:
- No vague bullets
- No generic responsibilities
- No weak verbs ("assisted", "participated", "helped")
- No vague impact phrases ("improved reliability", "enhanced performance", "user engagement")
- Avoid safe/low-signal bullets without technical depth
- Prefer ownership-driven language ("designed", "implemented", "led", "optimized")
- Prefer platform-specific terminology over generic descriptions
- Prefer the strongest technically detailed version when multiple valid rewrites exist

#BULLET COUNT
- Recent roles: 6~8 bullets
- Older roles: 5~6 bullets
- NEVER below minimum
- Expand from description if needed

#BULLET LENGTH
- Every recent-role bullet must be 24~36 words
- Every older-role bullet must be 18~30 words
- Do not return bullets shorter or longer than these ranges
- If a bullet is too short, expand it with supported technical detail such as stack, architecture, deployment context, system constraints, or measurable outcome
- If a bullet is too long, tighten wording without removing technical specificity or supported impact

#METRICS (CRITICAL)
- Use real numbers when available (~40~60% of bullets)
- Prefer scale, performance, reliability, and throughput
- Preserve all existing metrics

- When scale or performance is implied (e.g., "high-volume", "enterprise"),
  convert it into a concrete metric whenever reasonably possible
  (e.g., thousands, tens of thousands, millions of records)

- Replace vague terms like:
  "high-volume", "large datasets", "improved performance"
  with specific, realistic numbers when supported

- Inferred metrics must be conservative and believable
- No fake or exaggerated metrics

#SKILLS
Include ONLY skills that are:
1. explicitly supported
2. relevant to the target role

- Remove ALL duplicates and overlapping skills
- Keep one canonical representation (e.g., "CI/CD", not both "CI/CD" and "CI/CD pipelines")
- Maintain consistent granularity
- Prioritize platform-specific and role-relevant skills first

Structure:
technical_skills: {
  "Languages": [],
  "Frontend": [],
  "Backend & API": [],
  "Cloud & Infrastructure": [],
  "Databases & Messaging": [],
  "Testing & Observability": [],
  "Security & Compliance": [],
  "Delivery & Collaboration": []
}

#FINAL VALIDATION
Before output:
- every role meets minimum bullet count
- every bullet includes a concrete technical anchor
- no invented tools or metrics
- metrics used whenever reasonably possible
- no vague or low-signal bullets
- strong technical depth across all roles
- consistent senior-level tone
- reads naturally (not AI-generated)
- every bullet satisfies the required word-count range for its role

#OUTPUT FORMAT
{
  "professional_title": "",
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
  "technical_skills": {
    "Languages": [],
    "Frontend": [],
    "Backend & API": [],
    "Cloud & Infrastructure": [],
    "Databases & Messaging": [],
    "Testing & Observability": [],
    "Security & Compliance": [],
    "Delivery & Collaboration": []
  },
  "target_company_name": "",
  "target_position": ""
}

#INPUT
Work Experience:
${experiences}

Job Description:
${jobDescription}
`;
};
*/
const engineeringResumePrompt = (experienceDetails, jobDescription) => {
  let experiences = '';
  experienceDetails.forEach((exp) => {
    experiences += `${exp.jobTitle} at ${exp.employer} (${exp.startDate} - ${exp.endDate})\n`;
  });

  return `
You are an expert technical resume writer for senior engineers.

Rewrite the resume to strongly align with the target job while remaining realistic and technically credible.

#CORE RULES
- Do NOT change company, title, or dates
- Do NOT invent specific tools or technologies not present in the job description
- You MAY infer responsibilities, systems, and scale based on role type (e.g., backend engineer, Python engineer)
- Output ONLY valid JSON

#LOW-INPUT RECONSTRUCTION MODE (CRITICAL)
The input contains minimal detail (titles + dates only).

You MUST:
- reconstruct realistic responsibilities based on job title + seniority
- assume industry-standard systems for that role (e.g., APIs, databases, CI/CD, testing)
- generate believable production-level engineering work
- ensure consistency across roles (growth from junior → senior)

You MUST NOT:
- fabricate niche or uncommon tools unless present in job description
- assign unrealistic scope for early-career roles
- create exaggerated business impact

#ROLE ALIGNMENT (CRITICAL)
- Align strongly with job description domain (e.g., Python backend)
- Prioritize stack from JD:
  Python, FastAPI, Postgres, Temporal, Docker, Kubernetes

- If multiple valid implementations exist:
  → choose the one closest to JD stack

#TITLE (STRICT)
- MUST match job description title exactly when clearly defined

#SUMMARY
- 3~4 sentences
- Focus on:
  - backend systems
  - production services
  - reliability + deployment
- No fluff, no personality language

#ACHIEVEMENTS (CORE)
Each bullet MUST include:
- action (designed, built, optimized)
- system (API, service, database, pipeline)
- technology (prefer JD stack)
- outcome (performance, scale, reliability)

#BULLET COUNT
- Recent roles: 6~8 bullets
- Older roles: 5~6 bullets
- NEVER below minimum

#BULLET LENGTH (STRICT)
- Recent: 24~36 words
- Older: 18~30 words

#METRICS (CRITICAL FOR LOW-INPUT)
Since no metrics are provided:

You MUST infer realistic engineering scale using conservative ranges:

- APIs: thousands to millions of requests/day
- DB records: thousands to tens of millions
- latency: ms improvements (e.g., 300ms → 120ms)
- deployments: minutes vs hours
- uptime: 99.9% (only for senior roles)

Rules:
- Metrics MUST be believable
- DO NOT use exaggerated numbers
- DO NOT use percentages without context
- At least 40% of bullets MUST contain metrics or concrete scale

#TECHNOLOGY RULE
- Use ONLY:
  - technologies in job description
  - or universally expected ones for the role (e.g., REST APIs, SQL, CI/CD)

- NEVER introduce unrelated tools (e.g., Spark, Snowflake, Terraform unless in JD)

#ANTI-WEAK BULLET RULE
- Avoid:
  "worked on", "helped", "participated"
- Avoid:
  vague impact (e.g., "improved performance")

- Every bullet must feel like:
  a production engineering contribution

#SKILLS
- Use ONLY JD stack + essential supporting tech
- Deduplicate
- Keep concise

#FINAL VALIDATION
Before output:
- each role meets bullet count
- at least 40% bullets contain metrics or scale
- no invented niche tools
- bullets reflect backend production systems
- resume reads like a real engineer wrote it

#OUTPUT FORMAT
{
  "professional_title": "",
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
  "technical_skills": {
    "Languages": [],
    "Frontend": [],
    "Backend & API": [],
    "Cloud & Infrastructure": [],
    "Databases & Messaging": [],
    "Testing & Observability": [],
    "Security & Compliance": [],
    "Delivery & Collaboration": []
  },
  "target_company_name": "",
  "target_position": ""
}

#INPUT
Work Experience:
${experiences}

Job Description:
${jobDescription}
`;
};
const reorderWorkExperiences = (originalExperiences, aiExperiences) => {
  return originalExperiences.map((orig) => {
    const matched = aiExperiences.find((ai) => ai.company_name?.trim().toLowerCase() === orig.employer?.trim().toLowerCase());

    return {
      job_title: matched.job_title,
      company_name: orig.employer,
      start_date_employment: orig.startDate,
      end_date_employment: orig.endDate,
      achievements: matched?.achievements || []
    };
  });
};
const getAICompletion = async (prompt, model = 'gpt-4.1-nano') => {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const completion = await openai.chat.completions.create({ model, messages: [{ role: 'user', content: prompt }], temperature: 0.7 });
  return JSON.parse(completion.choices[0].message.content); // Validate JSON
};

const generateResume = async (experienceDetails, jobDescription, profileTemplate = 'template1', resumeType) => {
  let prompt;
  let completion;
  const cleanedJD = sanitizeJobDescription(jobDescription);
  if (resumeType === 'hybrid') {
    prompt = hybridResumePrompt(experienceDetails, cleanedJD);
    completion = await getAICompletion(prompt, 'gpt-5.4-nano');
  } else if (resumeType === 'engineering') {
    prompt = engineeringResumePrompt(experienceDetails, cleanedJD);
    completion = await getAICompletion(prompt, 'gpt-5.4-nano');
  } else if (profileTemplate === 'template6') {
    prompt = prepareTwoColResumePrompt(experienceDetails, jobDescription);
    completion = await getAICompletion(prompt);
  } else {
    prompt = prepareResumePrompt(experienceDetails, jobDescription);
    completion = await getAICompletion(prompt);
  }

  completion.work_experiences = reorderWorkExperiences(experienceDetails, completion.work_experiences || []);

  console.log(completion.work_experiences);
  return completion;
};
