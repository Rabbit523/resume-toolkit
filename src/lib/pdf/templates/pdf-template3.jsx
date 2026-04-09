import { ResumePDFEngine } from '../ResumePDFEngine';
import { rgb } from 'pdf-lib';
import { formatMonthYear, sanitizeText } from '@/helpers/endpoint';

const BASE =
  process.env.NEXT_PUBLIC_BASE_DOMAIN || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

export async function generate_template3_pdf(data) {
  const engine = new ResumePDFEngine({
    fontsize: {
      name: 28,
      title: 14,
      contactInfo: 14,
      sectionTitle: 15,
      positionTitle: 12,
      companyName: 13,
      period: 12,
      achievements: 13,
      summary: 12,
      skills: 12,
      normal: 12
    },

    margin: { x: 36, y: 36 },
    spacing: { section: 18, normal: 12 },
    indents: { bullet: 8, hypen: 6 },

    minY: 36,
    lineHeight: 16,
    borderThickness: 1,

    colors: {
      border: rgb(0, 0, 0),
      section: rgb(0, 0, 0),
      primary: rgb(0, 0, 0)
    },

    table: {
      categoryColWidth: 150,
      padding: 4,
      tableHeaderBg: rgb(0.92, 0.92, 0.92)
    },

    customFontURL: {
      regular: `${BASE}/fonts/Garamond-Regular.ttf`,
      bold: `${BASE}/fonts/Garamond-Bold.ttf`,
      italic: `${BASE}/fonts/Garamond-Italic.ttf`
    }
  });

  return await engine.generate(data, async (pdf, d) => {
    // HEADER — NAME
    // pdf.drawTextBlock(sanitizeText(d.name.toUpperCase()), pdf.style.fontsize.name, pdf.fonts.bold);
    // pdf.offsetY(10);

    // CONTACT LINE
    // const contact = [d.email, d.mobile, d.address].filter(Boolean).join('  |  ');
    // pdf.drawTextBlock(sanitizeText(contact), pdf.style.fontsize.contactInfo, pdf.fonts.regular);
    // pdf.offsetY(-10);

    // pdf.page.drawLine({
    //   start: { x: pdf.style.margin.x, y: pdf.getY() },
    //   end: { x: pdf.page.getSize().width - pdf.style.margin.x, y: pdf.getY() },
    //   thickness: pdf.style.borderThickness,
    //   color: pdf.style.colors.border
    // });

    pdf.offsetY(20);
    const pageWidth = pdf.page.getSize().width;
    const xCenter = pageWidth / 2;

    const nameText = sanitizeText((d.name || '').toUpperCase());
    const nameSize = pdf.style.fontsize.name;

    // Measure + draw centered
    const nameWidth = pdf.fonts.bold.widthOfTextAtSize(nameText, nameSize);
    pdf.page.drawText(nameText, {
      x: xCenter - nameWidth / 2,
      y: pdf.getY(),
      size: nameSize,
      font: pdf.fonts.bold,
      color: pdf.style.colors.primary
    });

    // spacing under name
    pdf.offsetY(25);

    // CONTACT LINE (PHONE FIRST, CENTERED)
    const contactParts = [d.mobile, d.email, d.address].map((v) => (v ? sanitizeText(v) : null)).filter(Boolean);

    // Use a bullet separator like the AI screenshot
    const contactText = contactParts.join(' | ');
    const contactSize = pdf.style.fontsize.contactInfo;

    if (contactText) {
      const contactWidth = pdf.fonts.regular.widthOfTextAtSize(contactText, contactSize);

      pdf.page.drawText(contactText, {
        x: xCenter - contactWidth / 2,
        y: pdf.getY(),
        size: contactSize,
        font: pdf.fonts.regular,
        color: pdf.style.colors.primary
      });

      pdf.offsetY(14);
    }

    // WORK EXPERIENCE SECTION
    if (d.work_experiences?.length) {
      pdf.offsetY(5);

      pdf.drawSection('Professional Experience', true);

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
          color: pdf.style.colors.primary
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
      pdf.drawSection('Education', true);

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

    // TECHNICAL SKILLS SECTION
    if (d.technical_skills && Object.keys(d.technical_skills).length) {
      const technicalSkills = Object.entries(d.technical_skills)
        .map(([category, items]) => [category, Array.isArray(items) ? items.filter((item) => item && String(item).trim() !== '') : []])
        .filter(([_, items]) => items.length > 0);

      if (technicalSkills.length > 0) {
        pdf.drawSection('Technical Skills', true);

        technicalSkills.forEach(([category, items]) => {
          pdf.drawTextBlock(sanitizeText(`${category}: ${items.join(', ')}`), pdf.style.fontsize.skills, pdf.fonts.regular);
        });
      }
    }
  });
}
