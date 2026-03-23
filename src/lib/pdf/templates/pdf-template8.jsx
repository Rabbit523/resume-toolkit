import { ResumePDFEngine } from '../ResumePDFEngine';
import { rgb } from 'pdf-lib';
import { sanitizeText, formatMonthYear } from '@/helpers/endpoint';

const BASE =
  process.env.NEXT_PUBLIC_BASE_DOMAIN || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

export async function generate_template8_pdf(data) {
  const engine = new ResumePDFEngine({
    fontsize: {
      name: 20,
      contact: 10,
      section: 12,
      title: 11,
      normal: 10,
      bullet: 10
    },

    margin: { x: 36, y: 36 },
    spacing: { section: 18, normal: 10 },
    indents: { bullet: 10, hypen: 6 },

    lineHeight: 13,
    minY: 36,

    colors: {
      headerBg: rgb(0, 0, 0),
      headerText: rgb(1, 1, 1),
      section: rgb(0.8, 0.1, 0.1),
      text: rgb(0.2, 0.2, 0.2),
      contact: rgb(255 / 255, 255 / 255, 255 / 255)
    },

    customFontURL: {
      regular: `${BASE}/fonts/Garamond-Regular.ttf`,
      bold: `${BASE}/fonts/Garamond-Bold.ttf`
    }
  });

  return await engine.generate(data, async (pdf, d) => {
    /* ----------------------------- */
    /* HEADER */
    /* ----------------------------- */
    pdf.offsetY(12);
    const fullName = sanitizeText((d.name || '').toUpperCase());
    const [firstName, ...rest] = fullName.split(' ');
    const lastName = rest.join(' ');

    const firstWidth = pdf.fonts.bold.widthOfTextAtSize(firstName + ' ', pdf.style.fontsize.name);

    pdf.page.drawText(firstName + ' ', {
      x: pdf.style.margin.x,
      y: pdf.getY() + 10,
      size: pdf.style.fontsize.name,
      font: pdf.fonts.bold,
      color: rgb(0, 0, 0)
    });

    pdf.page.drawText(lastName, {
      x: pdf.style.margin.x + firstWidth,
      y: pdf.getY() + 10,
      size: pdf.style.fontsize.name,
      font: pdf.fonts.bold,
      color: rgb(0.8, 0, 0)
    });

    pdf.offsetY(10);

    /* ----------------------------- */
    /* CONTACT */
    /* ----------------------------- */

    pdf.page.drawRectangle({
      x: 0,
      y: pdf.getY() - 20,
      width: pdf.getWidth(),
      height: 30,
      color: pdf.style.colors.headerBg
    });

    const contact = sanitizeText([d.address, d.mobile, d.email, d.linkedin || null].filter(Boolean).join(' | '));

    if (contact) {
      pdf.page.drawText(contact, {
        x: pdf.style.margin.x,
        y: pdf.getY() - 9,
        size: pdf.style.fontsize.contact,
        font: pdf.fonts.bold,
        color: pdf.style.colors.contact
      });

      pdf.offsetY(45);
    }

    /* ----------------------------- */
    /* SECTION DRAWER */
    /* ----------------------------- */

    function drawSection(title) {
      pdf.page.drawText(sanitizeText(title), {
        x: pdf.style.margin.x,
        y: pdf.getY(),
        size: pdf.style.fontsize.section,
        font: pdf.fonts.bold,
        color: pdf.style.colors.text
      });

      pdf.offsetY(4);

      pdf.page.drawLine({
        start: { x: pdf.style.margin.x, y: pdf.getY() },
        end: { x: pdf.getWidth() - pdf.style.margin.x, y: pdf.getY() },
        thickness: 1,
        color: pdf.style.colors.section
      });

      pdf.offsetY(12);
    }

    /* ----------------------------- */
    /* SUMMARY */
    /* ----------------------------- */

    if (d.summary) {
      drawSection('Professional Summary');

      pdf.drawTextJustifyBlock(sanitizeText(d.summary), pdf.style.fontsize.normal, pdf.fonts.regular, pdf.style.colors.text);

      pdf.offsetY(14);
    }

    /* ----------------------------- */
    /* WORK HISTORY */
    /* ----------------------------- */

    if (d.work_experiences?.length) {
      drawSection('Work History');

      d.work_experiences.forEach((job) => {
        const period = `${formatMonthYear(job.start_date_employment)} - ${formatMonthYear(job.end_date_employment)}`;

        pdf.page.drawText(sanitizeText(job.job_title), {
          x: pdf.style.margin.x,
          y: pdf.getY(),
          size: pdf.style.fontsize.title,
          font: pdf.fonts.bold,
          color: pdf.style.colors.text
        });

        pdf.page.drawText(sanitizeText(period), {
          x: pdf.getWidth() - 110,
          y: pdf.getY(),
          size: pdf.style.fontsize.normal,
          font: pdf.fonts.regular,
          color: pdf.style.colors.text
        });

        pdf.offsetY(pdf.style.lineHeight);

        pdf.page.drawText(sanitizeText(job.company_name), {
          x: pdf.style.margin.x,
          y: pdf.getY(),
          size: pdf.style.fontsize.normal,
          font: pdf.fonts.regular,
          color: pdf.style.colors.text
        });

        pdf.offsetY(pdf.style.lineHeight);

        if (job.achievements) {
          pdf.drawBullets(
            job.achievements.map((a) => sanitizeText(a)),
            pdf.style.fontsize.bullet,
            pdf.fonts.regular
          );
        }

        pdf.offsetY(12);
      });
    }

    /* ----------------------------- */
    /* SKILLS (2 COLUMN) */
    /* ----------------------------- */
    if (d.technical_skills) {
      drawSection('Skills');

      const skills = Object.values(d.technical_skills).flat();

      const columnWidth = (pdf.getWidth() - pdf.style.margin.x * 2) / 2;

      let leftY = pdf.getY();
      let rightY = pdf.getY();

      skills.forEach((skill, i) => {
        const x = i % 2 === 0 ? pdf.style.margin.x : pdf.style.margin.x + columnWidth;

        const y = i % 2 === 0 ? leftY : rightY;

        pdf.page.drawText(`• ${sanitizeText(skill)}`, {
          x,
          y,
          size: pdf.style.fontsize.normal,
          font: pdf.fonts.regular,
          color: pdf.style.colors.text
        });

        if (i % 2 === 0) leftY -= pdf.style.lineHeight;
        else rightY -= pdf.style.lineHeight;
      });

      pdf.offsetY((skills.length / 2) * pdf.style.lineHeight);
    }
    /* ----------------------------- */
    /* EDUCATION */
    /* ----------------------------- */
    pdf.offsetY(16);

    if (d.education?.length) {
      drawSection('Education');

      d.education.forEach((edu) => {
        const start = formatMonthYear(edu.startDate);
        const end = formatMonthYear(edu.yearOfCompletion);

        const period = `${start} - ${end}`;

        const width = pdf.getWidth();

        const pWidth = pdf.fonts.regular.widthOfTextAtSize(period, pdf.style.fontsize.normal);
        const xRight = width - pdf.style.margin.x - pWidth;

        pdf.page.drawText(sanitizeText(edu.educationLevel), {
          x: pdf.style.margin.x,
          y: pdf.getY(),
          size: pdf.style.fontsize.title,
          font: pdf.fonts.bold,
          color: pdf.style.colors.text
        });
        pdf.page.drawText(period, {
          x: xRight,
          y: pdf.getY(),
          size: pdf.style.fontsize.normal,
          font: pdf.fonts.regular,
          color: pdf.style.colors.text
        });

        pdf.offsetY(pdf.style.lineHeight);

        pdf.page.drawText(`${sanitizeText(edu.institution)} — ${sanitizeText(edu.fieldOfStudy)}`, {
          x: pdf.style.margin.x,
          y: pdf.getY(),
          size: pdf.style.fontsize.normal,
          font: pdf.fonts.regular,
          color: pdf.style.colors.text
        });

        pdf.offsetY(14);
      });
    }
  });
}
