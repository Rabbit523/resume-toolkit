import { ResumePDFEngine } from '../ResumePDFEngine';
import { rgb } from 'pdf-lib';
import { formatMonthYear, normalizeUrl, sanitizeText } from '@/helpers/endpoint';

const BASE =
  process.env.NEXT_PUBLIC_BASE_DOMAIN || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

export async function generate_template4_pdf(data) {
  const engine = new ResumePDFEngine({
    fontsize: {
      name: 32,
      title: 14,
      contactInfo: 12,
      sectionTitle: 13,
      positionTitle: 12,
      companyName: 13,
      period: 11,
      achievements: 11,
      summary: 12,
      skills: 11,
      normal: 12
    },

    margin: { x: 60, y: 50 },
    spacing: { section: 22, normal: 12 },
    indents: { bullet: 4, hypen: 4 },

    minY: 24,
    lineHeight: 16,
    borderThickness: 1,

    colors: {
      border: rgb(0.75, 0.75, 0.75),
      section: rgb(0, 0.35, 0.7),
      primary: rgb(0, 0, 0),
      gray: rgb(0.6, 0.6, 0.6)
    },
    table: { padding: 4 },
    customFontURL: {
      regular: `${BASE}/fonts/Lato-Regular.ttf`,
      bold: `${BASE}/fonts/Lato-Bold.ttf`
    }
  });

  return await engine.generate(data, async (pdf, d) => {
    const firstPageBGHeight = 150;

    pdf.page.drawRectangle({
      x: 0,
      y: pdf.getHeight() - firstPageBGHeight,
      width: pdf.getWidth(),
      height: firstPageBGHeight,
      color: rgb(0.8745, 0.8314, 0.6117)
    });

    pdf.offsetY(firstPageBGHeight / 2 - 70);

    const [firstName, ...rest] = d.name.split(' ');
    let lastName = rest.join(' ');

    pdf.page.drawText(sanitizeText(firstName.toUpperCase()), {
      x: pdf.style.margin.x,
      y: pdf.getY(),
      size: pdf.style.fontsize.name,
      font: pdf.fonts.bold,
      color: pdf.style.colors.primary
    });
    pdf.offsetY(pdf.style.fontsize.name);

    pdf.page.drawText(sanitizeText(lastName.toUpperCase()), {
      x: pdf.style.margin.x,
      y: pdf.getY(),
      size: pdf.style.fontsize.name,
      font: pdf.fonts.bold,
      color: pdf.style.colors.primary
    });

    const topRightX = pdf.getWidth() / 2 + 10;
    const topRightY = pdf.getHeight() - 40;
    const rightMaxWidth = pdf.getWidth() / 2 - 10;

    const textStyle = {
      size: pdf.style.fontsize.contactInfo,
      font: pdf.fonts.regular,
      color: pdf.style.colors.primary
    };
    const safe = (v) => (v === null || v === undefined ? '' : sanitizeText(String(v)));

    const fields = [d.target_position, d.address, d.email, d.mobile].map(safe).filter((t) => t.trim() !== '');

    let currentY = topRightY;

    fields.forEach((text) => {
      const usedHeight = pdf.drawFloatingText(text, { x: topRightX, y: currentY, ...textStyle }, rightMaxWidth);
      currentY -= usedHeight; // move down by actual wrapped height
    });

    pdf.offsetY(40);

    if (d.linkedin) {
      const safe = (v) => (v === null || v === undefined ? '' : sanitizeText(String(v)));
      const linkedin = safe(d.linkedin);

      if (linkedin.trim()) {
        const url = normalizeUrl(linkedin);
        pdf.page.drawText(safe(`LinkedIn: ${url}`), {
          x: pdf.style.margin.x,
          y: pdf.getY(),
          size: pdf.style.fontsize.contactInfo,
          font: pdf.fonts.regular,
          color: pdf.style.colors.primary
        });
        pdf.offsetY(18);
      }
    }
    pdf.offsetY(60);

    if (Array.isArray(d.summary) && d.summary.length) {
      pdf.drawTextWithBackground(String('Summary').toUpperCase(), pdf.style.margin.x, pdf.getY(), {
        font: pdf.fonts.bold,
        size: pdf.style.fontsize.sectionTitle,
        backgroundColor: rgb(0, 0, 0),
        color: rgb(1, 1, 1),
        padding: 4
      });
      pdf.offsetY(24);

      const safe = (v) => (v === null || v === undefined ? '' : sanitizeText(String(v)));
      const bullets = d.summary.map(safe).filter((t) => t.trim() !== '');

      if (bullets.length) {
        pdf.drawJustifyBullets(bullets, pdf.style.fontsize.summary, pdf.fonts.regular);
        pdf.offsetY(24);
      }
    }

    // EMPLOYMENT HISTORY
    if (d.work_experiences?.length) {
      pdf.drawTextWithBackground(String('Employment History').toUpperCase(), pdf.style.margin.x, pdf.getY(), {
        font: pdf.fonts.bold,
        size: pdf.style.fontsize.sectionTitle,
        backgroundColor: rgb(0, 0, 0),
        color: rgb(1, 1, 1),
        padding: 4
      });
      pdf.offsetY(24);

      const safe = (v) => (v === null || v === undefined ? '' : sanitizeText(String(v)));

      d.work_experiences.forEach((job) => {
        const company = safe(job.company_name);
        const title = safe(job.job_title);

        const positionLine = [title, company]
          .filter((x) => x.trim() !== '')
          .join(', ')
          .trim();

        const start = safe(job.start_date_employment);
        const end = safe(job.end_date_employment);

        const period =
          start && end
            ? `${formatMonthYear(start)}  —  ${formatMonthYear(end)}`
            : start
            ? `${formatMonthYear(start)}`
            : end
            ? `${formatMonthYear(end)}`
            : '';

        if (positionLine) {
          pdf.drawTextBlock(positionLine, pdf.style.fontsize.companyName, pdf.fonts.bold);
        }

        if (period) {
          pdf.drawTextBlock(period, pdf.style.fontsize.period, pdf.fonts.regular, pdf.style.colors.gray);
        }

        if (Array.isArray(job.achievements) && job.achievements.length) {
          const bullets = job.achievements.map((a) => safe(a)).filter((t) => t.trim() !== '');

          if (bullets.length) {
            pdf.drawJustifyBullets(bullets, pdf.style.fontsize.achievements, pdf.fonts.regular);
          }
        }

        pdf.offsetY(10);
      });

      pdf.offsetY(24);
    }

    // EDUCATION
    if (d.education?.length) {
      pdf.drawTextWithBackground(String('Education').toUpperCase(), pdf.style.margin.x, pdf.getY(), {
        font: pdf.fonts.bold,
        size: pdf.style.fontsize.sectionTitle,
        backgroundColor: rgb(0, 0, 0),
        color: rgb(1, 1, 1),
        padding: 4
      });
      pdf.offsetY(24);

      d.education.forEach((edu) => {
        const safe = (v) => (v === null || v === undefined ? '' : sanitizeText(String(v)));

        const line1 = [safe(edu.educationLevel), safe(edu.fieldOfStudy) ? `in ${safe(edu.fieldOfStudy)}` : '', safe(edu.institution)]
          .filter((x) => x && x.trim() !== '')
          .join(' ')
          .replace(/\s+,/g, ',')
          .replace(/\s{2,}/g, ' ')
          .trim();

        const start = safe(edu.startDate);
        const end = safe(edu.endDate || edu.yearOfCompletion);
        const line2 = start && end ? `${formatMonthYear(start)} — ${formatMonthYear(end)}` : end ? `${formatMonthYear(end)}` : '';

        if (line1) pdf.drawTextJustifyBlock(line1, pdf.style.fontsize.companyName, pdf.fonts.bold);
        if (line2) pdf.drawTextJustifyBlock(line2, pdf.style.fontsize.period, pdf.fonts.regular);

        pdf.offsetY(10);
      });

      pdf.offsetY(24);
    }

    // SKILLS (Flattened, SAFE)
    if (d.technical_skills && typeof d.technical_skills === 'object') {
      pdf.drawTextWithBackground(String('Skills').toUpperCase(), pdf.style.margin.x, pdf.getY(), {
        font: pdf.fonts.bold,
        size: pdf.style.fontsize.sectionTitle,
        backgroundColor: rgb(0, 0, 0),
        color: rgb(1, 1, 1),
        padding: 4
      });
      pdf.offsetY(24);

      const safe = (v) => (v === null || v === undefined ? '' : sanitizeText(String(v)));

      const maxWidth = pdf.getWidth() - pdf.style.margin.x * 2;
      let buffer = '';

      // Flatten values safely (values may be arrays, strings, null, etc.)
      Object.values(d.technical_skills || {}).forEach((skillList) => {
        const list = Array.isArray(skillList) ? skillList : skillList ? [skillList] : [];

        list.forEach((s) => {
          const skillText = safe(s);
          if (!skillText.trim()) return;

          const next = buffer ? `${buffer}${skillText} | ` : `${skillText} | `;
          const test = safe(next);

          if (pdf.fonts.regular.widthOfTextAtSize(test, pdf.style.fontsize.skills) > maxWidth) {
            // Flush current buffer (trim trailing separators)
            const line = buffer.replace(/\s*\|\s*$/g, '').trim();
            if (line) pdf.drawTextJustifyBlock(safe(line), pdf.style.fontsize.skills, pdf.fonts.regular);
            buffer = `${skillText} | `;
            return;
          }

          buffer = next;
        });
      });

      // Flush last buffer
      const lastLine = buffer.replace(/\s*\|\s*$/g, '').trim();
      if (lastLine) {
        pdf.drawTextJustifyBlock(safe(lastLine), pdf.style.fontsize.skills, pdf.fonts.regular);
      }
    }
  });
}
