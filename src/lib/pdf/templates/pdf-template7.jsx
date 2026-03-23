import { ResumePDFEngine } from '../ResumePDFEngine';
import { rgb } from 'pdf-lib';
import { formatMonthYear, sanitizeText } from '@/helpers/endpoint';

const BASE =
  process.env.NEXT_PUBLIC_BASE_DOMAIN || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

function normalizeSummary(summary) {
  if (!summary) return '';
  if (Array.isArray(summary))
    return summary
      .map((s) => sanitizeText(s))
      .filter(Boolean)
      .join(' ');
  return sanitizeText(summary);
}

export async function generate_template7_pdf(data) {
  const engine = new ResumePDFEngine({
    fontsize: {
      name: 28,
      contactInfo: 11,
      sectionTitle: 12,
      positionTitle: 12,
      companyName: 11,
      period: 10,
      achievements: 11,
      summary: 11,
      skills: 11,
      normal: 11
    },

    margin: { x: 36, y: 36 },
    spacing: { section: 18, normal: 10 },
    indents: { bullet: 10, hypen: 6 },

    minY: 36,
    lineHeight: 14,

    colors: {
      header: rgb(87 / 255, 87 / 255, 87 / 255),
      text: rgb(60 / 255, 60 / 255, 70 / 255),
      sectionBg: rgb(230 / 255, 230 / 255, 230 / 255)
    },

    customFontURL: {
      regular: `${BASE}/fonts/Garamond-Regular.ttf`,
      bold: `${BASE}/fonts/Garamond-Bold.ttf`,
      italic: `${BASE}/fonts/Garamond-Italic.ttf`
    }
  });

  return await engine.generate(data, async (pdf, d) => {
    /* -------------------------------- */
    /* HEADER NAME */
    /* -------------------------------- */
    pdf.offsetY(22);

    const name = sanitizeText((d.name || '').toUpperCase());

    pdf.page.drawText(name, {
      x: pdf.style.margin.x,
      y: pdf.getY(),
      size: pdf.style.fontsize.name,
      font: pdf.fonts.bold,
      color: pdf.style.colors.header
    });

    pdf.offsetY(22);

    /* -------------------------------- */
    /* CONTACT LINE */
    /* -------------------------------- */
    const contact = sanitizeText([d.mobile, d.email, d.address, d.linkedin || null].filter(Boolean).join('   |   '));
    if (contact) {
      pdf.page.drawText(contact, {
        x: pdf.style.margin.x,
        y: pdf.getY(),
        size: pdf.style.fontsize.contactInfo,
        font: pdf.fonts.regular,
        color: pdf.style.colors.text
      });

      pdf.offsetY(24);
    }

    /* -------------------------------- */
    /* SECTION DRAWER */
    /* -------------------------------- */

    function drawSection(title) {
      const width = pdf.getWidth();
      const height = 26;

      pdf.page.drawRectangle({
        x: 0,
        y: pdf.getY() - 4,
        width,
        height,
        color: pdf.style.colors.sectionBg
      });

      pdf.page.drawText(sanitizeText(title.toUpperCase()), {
        x: pdf.style.margin.x,
        y: pdf.getY() + 4,
        size: pdf.style.fontsize.sectionTitle,
        font: pdf.fonts.bold,
        color: pdf.style.colors.header
      });

      pdf.offsetY(20);
    }

    /* -------------------------------- */
    /* SUMMARY */
    /* -------------------------------- */
    pdf.offsetY(16);
    const summaryText = normalizeSummary(d.summary);
    if (summaryText) {
      drawSection('Professional Summary');
      pdf.drawTextJustifyBlock(summaryText, pdf.style.fontsize.summary, pdf.fonts.regular, pdf.style.colors.text);
      pdf.offsetY(10);
    }

    /* -------------------------------- */
    /* EXPERIENCE */
    /* -------------------------------- */
    pdf.offsetY(16);
    if (d.work_experiences?.length) {
      drawSection('Experience');

      d.work_experiences.forEach((job) => {
        const period = `${formatMonthYear(job.start_date_employment)} - ${formatMonthYear(job.end_date_employment)}`;

        const width = pdf.getWidth();

        const periodWidth = pdf.fonts.regular.widthOfTextAtSize(period, pdf.style.fontsize.period);

        const xRight = width - pdf.style.margin.x - periodWidth;

        /* TITLE */

        pdf.page.drawText(sanitizeText(job.job_title), {
          x: pdf.style.margin.x,
          y: pdf.getY(),
          size: pdf.style.fontsize.positionTitle,
          font: pdf.fonts.bold,
          color: pdf.style.colors.header
        });

        pdf.page.drawText(period, {
          x: xRight,
          y: pdf.getY(),
          size: pdf.style.fontsize.period,
          font: pdf.fonts.regular,
          color: pdf.style.colors.text
        });

        pdf.offsetY(pdf.style.lineHeight);

        /* COMPANY */

        pdf.page.drawText(sanitizeText(job.company_name), {
          x: pdf.style.margin.x,
          y: pdf.getY(),
          size: pdf.style.fontsize.companyName,
          font: pdf.fonts.regular,
          color: pdf.style.colors.text
        });

        pdf.offsetY(pdf.style.lineHeight);

        /* BULLETS */
        if (job.achievements?.length) {
          pdf.drawBullets(
            job.achievements.map((a) => sanitizeText(a)),
            pdf.style.fontsize.achievements,
            pdf.fonts.regular
          );
        }

        pdf.offsetY(12);
      });
    }

    /* -------------------------------- */
    /* EDUCATION */
    /* -------------------------------- */
    pdf.offsetY(16);
    if (d.education?.length) {
      drawSection('Education');

      d.education.forEach((edu) => {
        const start = formatMonthYear(edu.startDate);
        const end = formatMonthYear(edu.yearOfCompletion);

        const period = `${start} - ${end}`;

        const width = pdf.getWidth();

        const pWidth = pdf.fonts.regular.widthOfTextAtSize(period, pdf.style.fontsize.period);

        const xRight = width - pdf.style.margin.x - pWidth;

        pdf.page.drawText(sanitizeText(edu.educationLevel), {
          x: pdf.style.margin.x,
          y: pdf.getY(),
          size: pdf.style.fontsize.positionTitle,
          font: pdf.fonts.bold,
          color: pdf.style.colors.header
        });

        pdf.page.drawText(period, {
          x: xRight,
          y: pdf.getY(),
          size: pdf.style.fontsize.period,
          font: pdf.fonts.regular,
          color: pdf.style.colors.text
        });

        pdf.offsetY(pdf.style.lineHeight);
        pdf.page.drawText(sanitizeText(edu.fieldOfStudy), {
          x: pdf.style.margin.x,
          y: pdf.getY(),
          size: pdf.style.fontsize.normal,
          font: pdf.fonts.regular,
          color: pdf.style.colors.text
        });
        pdf.offsetY(pdf.style.lineHeight);
        pdf.page.drawText(sanitizeText(edu.institution), {
          x: pdf.style.margin.x,
          y: pdf.getY(),
          size: pdf.style.fontsize.normal,
          font: pdf.fonts.bold,
          color: pdf.style.colors.text
        });

        pdf.offsetY(16);
      });
    }

    /* -------------------------------- */
    /* SKILLS */
    /* -------------------------------- */
    pdf.offsetY(20);
    if (d.technical_skills) {
      drawSection('Technical Skills');

      Object.entries(d.technical_skills).forEach(([cat, items]) => {
        if (!Array.isArray(items)) return;

        const safeItems = items.filter((i) => typeof i === 'string' && i.trim().length > 0).join(', ');

        pdf.drawTextBlock(`${sanitizeText(cat)}: ${safeItems}`, pdf.style.fontsize.skills, pdf.fonts.regular, pdf.style.colors.text);
      });
    }
  });
}
