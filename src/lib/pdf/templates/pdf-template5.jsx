// lib/pdf/templates/pdf-template6.jsx (or .js)
import { ResumePDFEngine } from '../ResumePDFEngine';
import { rgb } from 'pdf-lib';
import { formatMonthYear, sanitizeText } from '@/helpers/endpoint';

const BASE =
  process.env.NEXT_PUBLIC_BASE_DOMAIN || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

function joinContact(d) {
  const parts = [
    d.mobile,
    d.email,
    d.linkedin,
    d.address // in your data it’s address; sample shows city too
  ]
    .filter(Boolean)
    .map((v) => sanitizeText(v));
  return parts.join('  |  ');
}

function normalizeSummary(summary) {
  if (!summary) return '';
  if (Array.isArray(summary))
    return summary
      .map((s) => sanitizeText(s))
      .filter(Boolean)
      .join(' ');
  return sanitizeText(summary);
}

function flattenSkills(technical_skills) {
  // your data is an object: { Category: [..], ... }
  if (!technical_skills) return [];
  if (Array.isArray(technical_skills)) return technical_skills;

  const out = [];
  for (const v of Object.values(technical_skills)) {
    if (Array.isArray(v)) out.push(...v);
  }
  return out.map((s) => sanitizeText(s)).filter(Boolean);
}

export async function generate_template5_pdf(data) {
  const engine = new ResumePDFEngine({
    fontsize: {
      name: 26,
      title: 17,
      contactInfo: 11,
      sectionTitle: 15,
      meta: 11,
      positionTitle: 13,
      companyName: 11.5,
      period: 10.5,
      achievements: 11,
      summary: 11,
      skills: 10.5,
      normal: 11
    },

    margin: { x: 46, y: 46 },
    spacing: { section: 12, normal: 10 },
    indents: { bullet: 6, hypen: 4 },

    minY: 46,
    lineHeight: 13.5,
    borderThickness: 1,

    colors: {
      border: rgb(0.85, 0.85, 0.85),
      section: rgb(0, 0, 0),
      primary: rgb(0, 0, 0),
      accent: rgb(0.78, 0.55, 0.1)
    },

    customFontURL: {
      regular: `${BASE}/fonts/Garamond-Regular.ttf`,
      bold: `${BASE}/fonts/Garamond-Bold.ttf`,
      italic: `${BASE}/fonts/Garamond-Italic.ttf`
    }
  });

  return await engine.generate(data, async (pdf, d) => {
    const pageW = pdf.getWidth();
    const topY = pdf.getY();
    const leftX = pdf.style.margin.x;
    const rightX = pageW - pdf.style.margin.x;

    // =========================
    // HEADER (like sample)
    // =========================

    const name = sanitizeText((d.name || '').toUpperCase());
    const title = sanitizeText(d.target_position || d.professional_title || '');
    const contact = joinContact(d);

    // Name (left)
    pdf.page.drawText(name, {
      x: leftX,
      y: topY,
      size: pdf.style.fontsize.name,
      font: pdf.fonts.bold,
      color: pdf.style.colors.primary
    });

    // Title under name
    let y = topY - 20;
    if (title) {
      pdf.page.drawText(title, {
        x: leftX,
        y,
        size: pdf.style.fontsize.title,
        font: pdf.fonts.bold,
        color: pdf.style.colors.accent
      });
      y -= 14;
    }
    pdf.y = y - 5;

    if (contact) {
      const contentWidth = pageW - pdf.style.margin.x * 2;

      const lines = pdf.wrap(contact, pdf.fonts.regular, pdf.style.fontsize.contactInfo, contentWidth);

      lines.forEach((line) => {
        pdf.page.drawText(line, {
          x: leftX,
          y,
          size: pdf.style.fontsize.contactInfo,
          font: pdf.fonts.regular,
          color: pdf.style.colors.primary
        });

        y -= pdf.style.lineHeight;
      });

      y -= 6; // small spacing after contact
    }

    // set pdf cursor below header
    pdf.y = y - 20;

    // Helper: section title with orange rule (like sample)
    const drawSectionTitle = (label) => {
      pdf.ensureSpace(30);
      const t = sanitizeText(label).toUpperCase();

      pdf.page.drawText(t, {
        x: leftX,
        y: pdf.getY(),
        size: pdf.style.fontsize.sectionTitle,
        font: pdf.fonts.bold,
        color: pdf.style.colors.primary
      });

      // orange line to the right of title
      const titleW = pdf.fonts.bold.widthOfTextAtSize(t, pdf.style.fontsize.sectionTitle);
      const lineStartX = leftX + titleW + 10;

      pdf.page.drawLine({
        start: { x: lineStartX, y: pdf.getY() + 4 },
        end: { x: rightX, y: pdf.getY() + 4 },
        thickness: 1,
        color: pdf.style.colors.accent
      });

      pdf.offsetY(18);
    };

    // =========================
    // SUMMARY
    // =========================
    const summaryText = normalizeSummary(d.summary);
    if (summaryText) {
      drawSectionTitle('Summary');
      pdf.drawTextJustifyBlock(summaryText, pdf.style.fontsize.summary, pdf.fonts.regular);
      pdf.offsetY(10);
    }

    // =========================
    // SKILLS (chips)
    // =========================
    const skills = flattenSkills(d.technical_skills);
    if (skills.length) {
      drawSectionTitle('Skills');

      const chipsHeight = pdf.drawChips({
        items: skills,
        x: leftX,
        y: pdf.getY(),
        maxWidth: rightX - leftX,
        font: pdf.fonts.bold, // sample chips look bold-ish
        size: 9.2,
        borderColor: pdf.style.colors.border,
        bgColor: rgb(0.98, 0.98, 0.98),
        textColor: pdf.style.colors.primary
      });

      pdf.offsetY(chipsHeight + 24);
    }

    if (d.work_experiences?.length) {
      pdf.offsetY(10);

      drawSectionTitle('Professional Experience');

      d.work_experiences.forEach((job) => {
        pdf.ensureSpace(pdf.style.spacing.section);
        const period = `${formatMonthYear(job.start_date_employment)} – ${formatMonthYear(job.end_date_employment)}`;
        const periodText = sanitizeText(period);

        // Text fields
        const jobTitleText = sanitizeText(job.job_title);
        const companyNameText = sanitizeText(job.company_name);

        const width = pdf.getWidth();
        const xLeft = pdf.style.margin.x;

        // RIGHT side period positioning
        const periodWidth = pdf.fonts.regular.widthOfTextAtSize(periodText, pdf.style.fontsize.period);
        const xRight = width - pdf.style.margin.x - periodWidth;

        // --- ROW 1: Job Title (left) + Period (right)
        pdf.page.drawText(jobTitleText, {
          x: xLeft,
          y: pdf.getY(),
          size: pdf.style.fontsize.positionTitle,
          font: pdf.fonts.bold, // bold title like the screenshot
          color: pdf.style.colors.primary
        });

        // If you want italic for the period, keep regular unless you have an italic font.
        // (If you DO have italic, swap pdf.fonts.regular -> pdf.fonts.italic)
        pdf.page.drawText(periodText, {
          x: xRight,
          y: pdf.getY(),
          size: pdf.style.fontsize.period,
          font: pdf.fonts.italic,
          color: pdf.style.colors.primary
        });

        pdf.offsetY(pdf.style.lineHeight);

        // --- ROW 2: Company name (below)
        pdf.page.drawText(companyNameText, {
          x: xLeft,
          y: pdf.getY(),
          size: pdf.style.fontsize.companyName,
          font: pdf.fonts.bold,
          color: pdf.style.colors.accent
        });

        pdf.offsetY(pdf.style.lineHeight);

        // --- Bullets
        if (job.achievements?.length) {
          pdf.drawBullets(
            job.achievements.map((a) => sanitizeText(a)),
            pdf.style.fontsize.achievements,
            pdf.fonts.regular
          );
        }

        pdf.offsetY(8);
      });
    }

    // EDUCATION SECTION
    if (d.education?.length) {
      drawSectionTitle('Education');

      d.education.forEach((edu) => {
        const xLeft = pdf.style.margin.x;
        const width = pdf.getWidth();

        // --- Build period (right side): prefer start/end dates, fallback to yearOfCompletion
        const start = edu.startDate ? formatMonthYear(edu.startDate) : null;
        const endRaw = edu.endDate ?? edu.yearOfCompletion ?? null;
        const end = endRaw ? formatMonthYear(endRaw) : null;

        // If we have start and end => "Apr 2015 – May 2015" (or "Present")
        // If only end => show end
        // If nothing => empty
        let periodText = '';
        if (start && end) periodText = `${start} – ${end}`;
        else if (end) periodText = `${end}`;

        periodText = sanitizeText(periodText);

        // --- Line 1 left: Degree (bold) OR Institution if degree missing
        const degreeLeft = sanitizeText(edu.educationLevel || edu.degree || edu.institution || '');

        // --- Line 2 left: Institution (regular) if degree exists; otherwise skip
        const institutionText = sanitizeText(edu.institution || '');

        // Measure period for right alignment
        const periodWidth = pdf.fonts.regular.widthOfTextAtSize(periodText, pdf.style.fontsize.period);
        const xRight = width - pdf.style.margin.x - periodWidth;

        // Row 1: Degree (left) + Period (right)
        if (degreeLeft) {
          pdf.page.drawText(degreeLeft, {
            x: xLeft,
            y: pdf.getY(),
            size: pdf.style.fontsize.companyName,
            font: pdf.fonts.bold,
            color: pdf.style.colors.primary
          });
        }

        if (periodText) {
          pdf.page.drawText(periodText, {
            x: xRight,
            y: pdf.getY(),
            size: pdf.style.fontsize.period,
            font: pdf.fonts.italic,
            color: pdf.style.colors.primary
          });
        }

        pdf.offsetY(pdf.style.lineHeight);

        // Row 2: Institution (below)
        if (edu.educationLevel || edu.degree) {
          if (institutionText) {
            pdf.page.drawText(institutionText, {
              x: xLeft,
              y: pdf.getY(),
              size: pdf.style.fontsize.normal,
              font: pdf.fonts.regular,
              color: pdf.style.colors.primary
            });
            pdf.offsetY(pdf.style.lineHeight);
          }
        }

        // Details line: Field of study + GPA (ONLY if known)
        const gpaRaw = edu.finalEvaluationGrade;
        const gpaKnown =
          gpaRaw &&
          typeof gpaRaw === 'string' &&
          gpaRaw.trim() &&
          gpaRaw.trim().toLowerCase() !== 'unknown' &&
          gpaRaw.trim().toLowerCase() !== 'n/a' &&
          gpaRaw.trim() !== '-';

        const details = [
          edu.fieldOfStudy ? sanitizeText(edu.fieldOfStudy) : null,
          gpaKnown ? sanitizeText(`GPA/Grade: ${gpaRaw.trim()}`) : null
        ]
          .filter(Boolean)
          .join(' • ');

        if (details) {
          pdf.drawTextBlock(details, pdf.style.fontsize.normal, pdf.fonts.regular);
        }

        pdf.offsetY(8);
      });
    }
  });
}
