import { ResumePDFEngine } from '../ResumePDFEngine';
import { rgb } from 'pdf-lib';
import { formatMonthYear, sanitizeText } from '@/helpers/endpoint';

export async function generate_template2_pdf(data) {
  const engine = new ResumePDFEngine({
    fontsize: {
      name: 20,
      title: 16,
      contactInfo: 12,
      sectionTitle: 14,
      positionTitle: 13,
      companyName: 12,
      period: 10,
      achievements: 10 + 1,
      summary: 10,
      skills: 10
    },
    margin: { x: 32, y: 32 },
    spacing: { section: 14, normal: 12 },
    indents: { bullet: 8, hypen: 8 },

    minY: 48,
    lineHeight: 16,
    borderThickness: 2,

    colors: {
      accentGreen: rgb(0.18, 0.55, 0.27),
      accentGreen1: rgb(0.15, 0.52, 0.25),
      dark: rgb(0.12, 0.12, 0.12),
      faded: rgb(0.48, 0.48, 0.48),
      black: rgb(0, 0, 0),
      section: rgb(0.18, 0.55, 0.27),
      border: rgb(0, 0, 0),
      achievements: rgb(0.15, 0.15, 0.15)
    },
    customFontURL: {
      regular: `${process.env.NEXT_PUBLIC_BASE_DOMAIN}/fonts/Bitter-Regular.otf`,
      bold: `${process.env.NEXT_PUBLIC_BASE_DOMAIN}/fonts/Bitter-Bold.otf`
    }
  });

  return await engine.generate(data, async (pdf, d) => {
    pdf.drawTextBlock(sanitizeText(d.name.toUpperCase()), pdf.style.fontsize.name, pdf.fonts.bold, pdf.style.colors.black);
    pdf.offsetY(pdf.style.spacing.normal / 2);
    pdf.drawTextBlock(sanitizeText(d.professional_title || d.target_position), pdf.style.fontsize.title, pdf.fonts.bold, pdf.style.colors.accentGreen);

    const contact = sanitizeText([d.mobile, d.email, d.linkedin || null, d.address].filter(Boolean).join('   |   '));
    pdf.drawTextBlock(contact, pdf.style.fontsize.contactInfo, pdf.fonts.regular, pdf.style.colors.dark);
    pdf.offsetY(pdf.style.spacing.normal);

    // Summary
    pdf.drawSection('Summary', true);
    pdf.offsetY(pdf.style.spacing.normal);
    pdf.drawBullets(d.summary, pdf.style.fontsize.summary, pdf.fonts.regular);

    // Experiences
    pdf.drawSection('Experiences', true);

    d.work_experiences.forEach((exp) => {
      pdf.offsetY(pdf.style.spacing.normal);
      const expMarginX = pdf.style.margin.x * 1.2;

      pdf.ensureSpace();
      pdf.drawTextBlock(sanitizeText(exp.job_title), pdf.style.fontsize.positionTitle, pdf.fonts.bold, pdf.style.colors.black);
      pdf.drawTextBlock(sanitizeText(exp.company_name), pdf.style.fontsize.companyName, pdf.fonts.bold, pdf.style.colors.accentGreen1);

      const expPeriodStr = sanitizeText(`${formatMonthYear(exp.start_date_employment)} – ${formatMonthYear(exp.end_date_employment)}`);
      pdf.drawTextBlock(expPeriodStr, pdf.style.fontsize.period, pdf.fonts.regular, pdf.style.colors.faded);
      exp.achievements.forEach((bullet) => {
        const lines = pdf.wrap('• ' + bullet, pdf.fonts.regular, pdf.style.fontsize.achievements, pdf.getWidth() - expMarginX * 2);
        lines.forEach((l) => {
          pdf.ensureSpace();
          pdf.page.drawText(sanitizeText(l), {
            x: expMarginX,
            y: pdf.getY(),
            size: pdf.style.fontsize.achievements,
            font: pdf.fonts.regular,
            color: pdf.style.colors.achievements
          });
          pdf.offsetY(pdf.style.fontsize.achievements * 1.5);
        });
      });
    });
    pdf.offsetY(pdf.style.spacing.section);

    // Education
    pdf.drawSection('Education', true);
    pdf.offsetY(pdf.style.spacing.normal);
    const edu = d.education[0];
    pdf.drawTextBlock(sanitizeText(edu.educationLevel), pdf.style.fontsize.positionTitle, pdf.fonts.bold);

    pdf.drawTextBlock(sanitizeText(edu.institution), pdf.style.fontsize.companyName, pdf.fonts.regular, pdf.style.colors.accentGreen);

    pdf.drawTextBlock(
      sanitizeText(`${edu.startDate} – ${edu.yearOfCompletion}`),
      pdf.style.fontsize.period,
      pdf.fonts.regular,
      pdf.style.colors.faded
    );

    // Skills
    pdf.drawSection('Skills', true);
    let buffer = '';
    Object.values(d.technical_skills || {}).forEach((skillList) => {
      skillList.forEach((s) => {
        const skillText = sanitizeText(String(s));
        const test = sanitizeText(buffer + skillText + ' ');
        if (pdf.fonts.regular.widthOfTextAtSize(test, pdf.style.fontsize.skills) > pdf.getWidth() - pdf.style.margin.x * 2) {
          pdf.drawTextBlock(sanitizeText(buffer), pdf.style.fontsize.skills, pdf.fonts.regular);
          buffer = '';
        }

        buffer += skillText + ',   ';
      });
    });

    buffer = buffer.replace(/, $/, ''); // remove trailing comma
    if (buffer.length > 0) {
      pdf.drawTextBlock(buffer, pdf.style.fontsize.skills, pdf.fonts.regular);
    }
  });
}
