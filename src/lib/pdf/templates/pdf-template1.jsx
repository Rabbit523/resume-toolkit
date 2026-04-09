import { ResumePDFEngine } from '../ResumePDFEngine';
import { rgb } from 'pdf-lib';
import { formatMonthYear, normalizeUrl, sanitizeText } from '@/helpers/endpoint';

export async function generate_template1_pdf(data) {
  const engine = new ResumePDFEngine({
    fontsize: {
      name: 20,
      title: 16,
      contactInfo: 12,
      sectionTitle: 13,
      positionTitle: 12,
      companyName: 13,
      period: 10,
      achievements: 12,
      summary: 12,
      skills: 12,
      normal: 12
    },
    margin: { x: 24, y: 36 },
    spacing: { section: 14, normal: 12 },
    indents: { bullet: 8, hypen: 8 },

    minY: 36,
    lineHeight: 16,
    borderThickness: 1,

    colors: {
      border: rgb(0.5, 0.5, 0.5),
      section: rgb(0, 0.35, 0.7),
      primary: rgb(0, 0, 0)
    },
    table: {
      categoryColWidth: 140,
      padding: 4,
      tableHeaderBg: rgb(0.92, 0.92, 0.92)
    },
    customFontURL: {
      regular: `${process.env.NEXT_PUBLIC_BASE_DOMAIN}/fonts/Helvetica.ttf`,
      bold: `${process.env.NEXT_PUBLIC_BASE_DOMAIN}/fonts/Helvetica-Bold.ttf`
    }
  });

  return await engine.generate(data, async (pdf, d) => {
    pdf.center(`${d.name}`, pdf.style.fontsize.name, pdf.fonts.bold, pdf.style.colors.primary);
    pdf.offsetY(4);
    pdf.center(`${d.target_position}`, pdf.style.fontsize.title, pdf.fonts.regular, pdf.style.colors.primary);

    const contactLine = `${d.mobile}   |   ${d.email}   |   ${d.address}`;
    pdf.center(contactLine, pdf.style.fontsize.contactInfo, pdf.fonts.regular, pdf.style.colors.primary);

    const linkedinLine = d.linkedin || '';
    pdf.center(normalizeUrl(linkedinLine), pdf.style.fontsize.normal, pdf.fonts.regular, pdf.style.colors.primary);

    pdf.drawSection('Summary', true);
    pdf.drawBullets(d.summary, pdf.style.fontsize.summary, pdf.fonts.regular);

    pdf.drawSection('Technical Skills', true);
    const skillRows = Object.entries(data.technical_skills)
      .filter(([_, skills]) => Array.isArray(skills) && skills.length > 0)
      .map(([cat, skills]) => [cat, skills.join(', ')]);

    if (skillRows.length > 0) {
      pdf.drawWrappedTable({
        columnWidths: [pdf.style.table.categoryColWidth, pdf.getWidth() - (pdf.style.margin.x * 2 + pdf.style.table.categoryColWidth)],
        headers: ['Category', 'Skills'],
        rows: skillRows
      });

      pdf.offsetY(pdf.style.spacing.section);
    }
    pdf.offsetY(pdf.style.spacing.section);

    pdf.drawSection('Experience', true);
    pdf.offsetY(pdf.style.spacing.normal);

    data.work_experiences.forEach((exp) => {
      pdf.ensureSpace();
      const exp_text = sanitizeText(`- ${exp.job_title} | ${exp.company_name}`);
      pdf.page.drawText(exp_text, {
        x: pdf.style.margin.x + pdf.style.indents.hypen,
        y: pdf.getY(),
        size: pdf.style.fontsize.companyName,
        font: pdf.fonts.bold
      });
      const font = pdf.fonts.regular;
      const periodText = sanitizeText(`(${formatMonthYear(exp.start_date_employment)} ~ ${formatMonthYear(exp.end_date_employment)})`);
      pdf.page.drawText(periodText, {
        x: pdf.getWidth() - (pdf.style.margin.x + font.widthOfTextAtSize(periodText, pdf.style.fontsize.period)),
        y: pdf.y,
        size: pdf.style.fontsize.period,
        font
      });

      pdf.offsetY(pdf.style.lineHeight);
      pdf.drawBullets(exp.achievements, pdf.style.fontsize.achievements, pdf.fonts.regular);
    });

    pdf.drawSection('Education', true);
    pdf.offsetY(pdf.style.lineHeight);

    const education = sanitizeText(`${data.education[0].educationLevel} — ${data.education[0].institution}`);
    const education_period = sanitizeText(
      `(${formatMonthYear(data.education[0].startDate)} ~ ${formatMonthYear(data.education[0].yearOfCompletion)})`
    );
    pdf.page.drawText(education, {
      x: pdf.style.margin.x + pdf.style.indents.hypen,
      y: pdf.y,
      size: pdf.style.fontsize.companyName,
      font: pdf.fonts.regular
    });

    pdf.page.drawText(education_period, {
      x: pdf.getWidth() - (pdf.style.margin.x + pdf.fonts.regular.widthOfTextAtSize(education_period, pdf.style.fontsize.period)),
      y: pdf.y,
      size: pdf.style.fontsize.period,
      font: pdf.fonts.regular
    });
  });
}
