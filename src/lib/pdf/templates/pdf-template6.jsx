import { ResumePDFEngine } from '../ResumePDFEngine';
import { rgb } from 'pdf-lib';
import { formatMonthYear, sanitizeText } from '@/helpers/endpoint';
import _ from 'mongoose-sequence';

const BASE =
  process.env.NEXT_PUBLIC_BASE_DOMAIN || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

function flattenSkills(technical_skills) {
  if (!technical_skills) return [];

  let out = [];

  // Case 1: Already a flat array
  if (Array.isArray(technical_skills)) {
    out = technical_skills;
  }

  // Case 2: Object with category arrays
  else if (typeof technical_skills === 'object') {
    for (const value of Object.values(technical_skills)) {
      if (Array.isArray(value)) {
        out.push(...value);
      }
    }
  }

  return out.map((s) => sanitizeText(s)).filter(Boolean);
}

function joinContact(d) {
  return [d.mobile, d.email, d.linkedin, d.address]
    .filter(Boolean)
    .map((v) => sanitizeText(v))
    .join('   |   ');
}

function normalizeSummary(summary) {
  if (!summary) return '';
  if (Array.isArray(summary)) return summary.join(' ');
  return summary;
}

export async function generate_template6_pdf(data) {
  const engine = new ResumePDFEngine({
    fontsize: {
      name: 22,
      title: 14,
      sectionTitle: 13,
      normal: 11,
      contactInfo: 11,
      positionTitle: 12,
      companyName: 12,
      period: 10,
      achievements: 9,
      skills: 9
    },

    margin: { x: 24, y: 46 },
    spacing: { section: 14, normal: 10 },
    indents: { bullet: 6, hypen: 4 },

    minY: 46,
    lineHeight: 13,
    borderThickness: 1,

    colors: {
      primary: rgb(0, 0, 0),
      accent: rgb(0.06, 0.46, 0.43),
      rightBg: rgb(0.07, 0.42, 0.4),
      rightText: rgb(1, 1, 1),
      border: rgb(0.85, 0.85, 0.85)
    },

    customFontURL: {
      regular: `${BASE}/fonts/Garamond-Regular.ttf`,
      bold: `${BASE}/fonts/Garamond-Bold.ttf`,
      italic: `${BASE}/fonts/Garamond-Italic.ttf`
    }
  });

  return await engine.generate(data, async (pdf, d) => {
    const pageWidth = pdf.getWidth();
    const pageHeight = pdf.getHeight();
    const leftWidth = pageWidth * 0.64;
    const rightWidth = pageWidth - leftWidth;
    const leftX = pdf.style.margin.x;
    const rightX = leftWidth + 26;

    // Draw right sidebar background
    const drawRightBackground = () => {
      pdf.page.drawRectangle({
        x: leftWidth,
        y: 0,
        width: rightWidth,
        height: pageHeight,
        color: pdf.style.colors.rightBg
      });
    };

    drawRightBackground();

    let rightY = pageHeight - pdf.style.margin.y;
    // =========================
    // RIGHT COLUMN CONTENT
    // =========================
    function renderRightColumn() {
      const rightColor = pdf.style.colors.rightText;

      const drawRightSection = (title) => {
        pdf.page.drawText(title.toUpperCase(), {
          x: rightX,
          y: rightY,
          size: pdf.style.fontsize.sectionTitle,
          font: pdf.fonts.bold,
          color: rightColor
        });

        rightY -= 6;

        pdf.page.drawLine({
          start: { x: rightX, y: rightY },
          end: { x: pageWidth - 26, y: rightY },
          thickness: 1,
          color: rgb(1, 1, 1)
        });

        rightY -= 14;
      };

      // ========= SKILLS =========
      drawRightSection('Skills');

      const skills = flattenSkills(d.technical_skills);

      const chipHeight = pdf.drawChips({
        items: skills,
        x: rightX,
        y: rightY,
        maxWidth: rightWidth - 40,
        font: pdf.fonts.bold,
        size: 8.5,
        borderColor: rgb(1, 1, 1),
        bgColor: rgb(0.15, 0.55, 0.52),
        textColor: rgb(1, 1, 1)
      });

      rightY -= chipHeight + 20;

      // ========= KEY ACHIEVEMENTS =========
      const achievements = d.key_achievements || [
        'Led Enterprise Data Platform Migration',
        'Delivered Robust ETL Pipelines for Reporting',
        'Improved Operational Efficiency'
      ];
      drawRightSection('Key Achievements');
      achievements.forEach((item) => {
        const lines = pdf.wrap(item, pdf.fonts.regular, 9, rightWidth - 40);
        lines.forEach((ln) => {
          pdf.page.drawText(`• ${ln}`, {
            x: rightX,
            y: rightY,
            size: 9,
            font: pdf.fonts.regular,
            color: rightColor
          });
          rightY -= pdf.style.lineHeight;
        });
        rightY -= 6;
      });

      // ========= COURSES =========
      const courses = d.courses || ['Microsoft Azure Fundamentals & Administration', 'DevOps & Automation'];
      drawRightSection('Courses');
      courses.forEach((c) => {
        pdf.page.drawText(c, {
          x: rightX,
          y: rightY,
          size: 9,
          font: pdf.fonts.regular,
          color: rightColor
        });
        rightY -= pdf.style.lineHeight;
      });

      rightY -= 10;

      // ========= INTERESTS =========
      const interests = d.interests || ['Cloud Platform Optimization', 'Security Operations', 'AI Systems'];
      drawRightSection('Interests');
      interests.forEach((item) => {
        const lines = pdf.wrap(item, pdf.fonts.regular, 9, rightWidth - 40);
        lines.forEach((ln) => {
          pdf.page.drawText(`• ${ln}`, {
            x: rightX,
            y: rightY,
            size: 9,
            font: pdf.fonts.regular,
            color: rightColor
          });
          rightY -= pdf.style.lineHeight;
        });
        rightY -= 6;
      });
    }
    renderRightColumn();

    // ========= HEADER =========
    pdf.page.drawText(sanitizeText(d.name.toUpperCase()), {
      x: leftX,
      y: pdf.getY(),
      size: pdf.style.fontsize.name,
      font: pdf.fonts.bold
    });
    pdf.offsetY(22);
    const title = sanitizeText(d.target_position || d.professional_title || '');
    pdf.page.drawText(sanitizeText(title), {
      x: leftX,
      y: pdf.getY(),
      size: pdf.style.fontsize.title,
      font: pdf.fonts.bold,
      color: pdf.style.colors.accent
    });
    pdf.offsetY(14);

    // MULTI-LINE CONTACT FIX
    const contact = joinContact(d);
    const contactLines = pdf.wrap(contact, pdf.fonts.regular, pdf.style.fontsize.contactInfo, leftWidth - pdf.style.margin.x * 2);
    contactLines.forEach((line) => {
      pdf.page.drawText(line, {
        x: leftX,
        y: pdf.getY(),
        size: pdf.style.fontsize.contactInfo,
        font: pdf.fonts.regular
      });
      pdf.offsetY(pdf.style.lineHeight);
    });
    pdf.offsetY(18);

    // ========= SECTION HELPER =========
    const drawSectionTitle = (label) => {
      pdf.ensureSpace(30);

      pdf.page.drawText(label.toUpperCase(), {
        x: leftX,
        y: pdf.getY(),
        size: pdf.style.fontsize.sectionTitle,
        font: pdf.fonts.bold
      });

      pdf.offsetY(6);

      // underline (FULL LEFT COLUMN WIDTH)
      pdf.page.drawLine({
        start: { x: leftX, y: pdf.getY() },
        end: { x: leftWidth - 20, y: pdf.getY() },
        thickness: 1,
        color: pdf.style.colors.border
      });

      pdf.offsetY(14);
    };

    const originalNewPage = pdf.newPage.bind(pdf);

    pdf.newPage = () => {
      originalNewPage();
      drawRightBackground();
    };

    // ========= SUMMARY =========
    drawSectionTitle('Summary');

    pdf.drawTextJustifyColumnBlock(
      normalizeSummary(d.summary),
      pdf.style.fontsize.normal,
      pdf.fonts.regular,
      pdf.style.colors.primary,
      leftX,
      leftWidth - pdf.style.margin.x - 20
    );

    pdf.offsetY(12);

    // ========= EXPERIENCE =========
    drawSectionTitle('Experience');

    d.work_experiences.forEach((job) => {
      pdf.ensureSpace(15);

      const period = `${formatMonthYear(job.start_date_employment)} - ${formatMonthYear(job.end_date_employment)}`;

      pdf.page.drawText(sanitizeText(job.job_title), {
        x: leftX,
        y: pdf.getY(),
        size: pdf.style.fontsize.positionTitle,
        font: pdf.fonts.bold
      });

      pdf.page.drawText(period, {
        x: leftWidth - 90,
        y: pdf.getY(),
        size: pdf.style.fontsize.period,
        font: pdf.fonts.italic
      });

      pdf.offsetY(pdf.style.lineHeight);

      pdf.page.drawText(sanitizeText(job.company_name), {
        x: leftX,
        y: pdf.getY(),
        size: pdf.style.fontsize.companyName,
        font: pdf.fonts.bold,
        color: pdf.style.colors.accent
      });

      pdf.offsetY(pdf.style.lineHeight);

      pdf.drawJustifyColumnBullets(
        job.achievements,
        pdf.style.fontsize.achievements,
        pdf.fonts.regular,
        leftX,
        leftWidth - pdf.style.margin.x - 20
      );

      pdf.offsetY(5);
    });

    // ========= EDUCATION =========
    drawSectionTitle('Education');

    d.education.forEach((edu) => {
      pdf.ensureSpace(20);

      const period = `${formatMonthYear(edu.startDate)} - ${formatMonthYear(edu.yearOfCompletion)}`;

      pdf.page.drawText(sanitizeText(edu.educationLevel), {
        x: leftX,
        y: pdf.getY(),
        size: pdf.style.fontsize.positionTitle,
        font: pdf.fonts.bold
      });

      pdf.page.drawText(period, {
        x: leftWidth - 90,
        y: pdf.getY(),
        size: pdf.style.fontsize.period,
        font: pdf.fonts.italic
      });

      pdf.offsetY(pdf.style.lineHeight);

      pdf.page.drawText(sanitizeText(edu.institution), {
        x: leftX,
        y: pdf.getY(),
        size: pdf.style.fontsize.normal,
        font: pdf.fonts.regular
      });

      pdf.offsetY(14);
    });
  });
}
