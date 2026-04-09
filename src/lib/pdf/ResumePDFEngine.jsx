import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { sanitizeText } from '@/helpers/endpoint';

export class ResumePDFEngine {
  constructor(style) {
    this.style = style;
    this.pdfDoc = null;
    this.page = null;
    this.fonts = {};
    this.y = 0;
  }

  async init() {
    this.pdfDoc = await PDFDocument.create();
    this.pdfDoc.registerFontkit(fontkit);
    this.page = this.pdfDoc.addPage();

    const { width, height } = this.page.getSize();
    this.y = height - this.style.margin.y;

    await this.loadFonts();
  }

  async loadFonts() {
    const urls = this.style?.customFontURL;

    const embedStandard = async () => {
      this.fonts.regular = await this.pdfDoc.embedFont(StandardFonts.Helvetica);
      this.fonts.bold = await this.pdfDoc.embedFont(StandardFonts.HelveticaBold);
      this.fonts.italic = await this.pdfDoc.embedFont(StandardFonts.HelveticaOblique);
    };

    // If no custom fonts configured, use standard
    if (!urls) {
      await embedStandard();
      return;
    }

    const fetchFontBytes = async (url, label) => {
      if (url === undefined || url === null) return null;
      const u = String(url).trim();
      if (!u) return null;

      const res = await fetch(u).catch((e) => {
        throw new Error(`Failed to fetch ${label} font from "${u}": ${e?.message || e}`);
      });

      if (!res || !res.ok) {
        throw new Error(`Failed to fetch ${label} font from "${u}": HTTP ${res?.status ?? 'NO_RESPONSE'}`);
      }

      return await res.arrayBuffer();
    };

    // Try to fetch custom fonts (italic is optional)
    let regularBytes = null;
    let boldBytes = null;
    let italicBytes = null;

    try {
      [regularBytes, boldBytes, italicBytes] = await Promise.all([
        fetchFontBytes(urls.regular, 'regular'),
        fetchFontBytes(urls.bold, 'bold'),
        fetchFontBytes(urls.italic, 'italic')
      ]);
    } catch (e) {
      // If any fetch fails, fall back to standard fonts
      await embedStandard();
      return;
    }

    // If neither regular nor bold loaded, fall back
    if (!regularBytes && !boldBytes) {
      await embedStandard();
      return;
    }

    // Embed regular (must pass ArrayBuffer, never undefined)
    if (regularBytes) this.fonts.regular = await this.pdfDoc.embedFont(regularBytes);
    else this.fonts.regular = await this.pdfDoc.embedFont(StandardFonts.Helvetica);

    // Embed bold (fallback to regularBytes if bold missing, otherwise HelveticaBold)
    if (boldBytes) this.fonts.bold = await this.pdfDoc.embedFont(boldBytes);
    else if (regularBytes) this.fonts.bold = await this.pdfDoc.embedFont(regularBytes);
    else this.fonts.bold = await this.pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Embed italic (optional, always valid input)
    if (italicBytes) this.fonts.italic = await this.pdfDoc.embedFont(italicBytes);
    else this.fonts.italic = await this.pdfDoc.embedFont(StandardFonts.HelveticaOblique);
  }

  newPage() {
    this.page = this.pdfDoc.addPage();
    this.y = this.page.getSize().height - this.style.margin.y;
  }

  ensureSpace(amount = this.style.lineHeight) {
    if (this.y < this.style.minY + amount) this.newPage();
  }

  wrap(text, font, size, maxWidth) {
    const words = String(text).split(' ');
    const lines = [];
    let line = '';

    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(test, size) > maxWidth) {
        if (line) lines.push(line);
        line = word;
      } else {
        line = test;
      }
    }

    if (line) lines.push(line);
    return lines;
  }

  center(text, size, font, color = this.style.colors.primary) {
    const width = this.page.getSize().width;
    const w = font.widthOfTextAtSize(text, size);
    this.page.drawText(text, { x: (width - w) / 2, y: this.y, size, font, color });
    this.offsetY(this.style.lineHeight);
  }

  drawTextBlock(text, size, font, color = this.style.colors.primary) {
    const maxWidth = this.page.getSize().width - this.style.margin.x * 2;
    const lines = this.wrap(text, font, size, maxWidth);
    for (const ln of lines) {
      this.ensureSpace();
      this.page.drawText(ln, { x: this.style.margin.x, y: this.y, size, font, color });
      this.offsetY(this.style.lineHeight);
    }
  }

  drawSection(title, isBottomBorder = false) {
    this.ensureSpace(this.style.spacing.section);
    this.offsetY(this.style.spacing.section);

    this.page.drawText(sanitizeText(String(title).toUpperCase()), {
      x: this.style.margin.x,
      y: this.y,
      size: this.style.fontsize.sectionTitle,
      font: this.fonts.bold,
      color: this.style.colors.section
    });

    if (isBottomBorder) {
      this.offsetY(4);
      this.page.drawLine({
        start: { x: this.style.margin.x, y: this.getY() },
        end: { x: this.page.getSize().width - this.style.margin.x, y: this.getY() },
        thickness: this.style.borderThickness,
        color: this.style.colors.border
      });
    }
    this.offsetY(this.style.spacing.section);
  }

  drawBullets(items, size, font) {
    const maxWidth = this.page.getSize().width - this.style.margin.x * 2 - (this.style.indents.bullet + this.style.indents.hypen);

    if (typeof items === 'string') {
      const wrappedLines = this.wrap(items, font, size, maxWidth);
      wrappedLines.forEach((line) => {
        this.ensureSpace();
        this.page.drawText(sanitizeText(line), {
          x: this.style.margin.x + (this.style.indents.bullet + this.style.indents.hypen),
          y: this.y,
          size,
          font
        });
        this.offsetY(this.style.lineHeight);
      });
    } else if (typeof items === 'object') {
      if (!items || items.length === 0) return;
      items.forEach((item) => {
        const text = items.length === 1 ? item : `• ${item}`;
        const wrappedLines = this.wrap(text, font, size, maxWidth);
        wrappedLines.forEach((line) => {
          this.ensureSpace();
          this.page.drawText(sanitizeText(line), {
            x: this.style.margin.x + (this.style.indents.bullet + this.style.indents.hypen),
            y: this.y,
            size,
            font
          });
          this.offsetY(this.style.lineHeight);
        });
      });
    }

    this.offsetY(4);
  }

  async generate(data, templateFn) {
    await this.init();
    this.pdfDoc.setTitle(`${data.name} - Resume`);
    this.pdfDoc.setProducer('');
    this.pdfDoc.setCreator('');
    this.pdfDoc.setAuthor(`${data.name}`);
    this.pdfDoc.setKeywords([`Resume`, data.name, data.target_position || '']);
    await templateFn(this, data);
    return await this.pdfDoc.save();
  }

  offsetX(amount) {
    this.x -= Math.ceil(amount);
  }

  offsetY(amount) {
    this.y -= Math.ceil(amount);
  }

  getY() {
    return this.y;
  }

  getWidth() {
    return this.getPage().getSize().width;
  }

  getHeight() {
    return this.getPage().getSize().height;
  }

  getPage() {
    return this.page;
  }

  drawRowBorders(startX, y, rowHeight, colWidths) {
    const totalWidth = colWidths.reduce((a, b) => a + b, 0);

    this.page.drawLine({ start: { x: startX, y }, end: { x: startX + totalWidth, y } });
    this.page.drawLine({ start: { x: startX, y: y - rowHeight }, end: { x: startX + totalWidth, y: y - rowHeight } });

    let x = startX;
    for (const w of colWidths) {
      this.page.drawLine({ start: { x, y }, end: { x, y: y - rowHeight } });
      x += w;
    }

    this.page.drawLine({ start: { x, y }, end: { x, y: y - rowHeight } });
  }

  drawTableRow(startX, y, rowHeight, colWidths, rowLines, isHeader = false) {
    if (isHeader) {
      this.page.drawRectangle({
        x: startX,
        y: y - rowHeight,
        width: colWidths.reduce((a, b) => a + b, 0),
        height: rowHeight,
        color: this.style.table.tableHeaderBg
      });
    }

    let x = startX;

    rowLines.forEach((cellLines, i) => {
      let textY = y - this.style.fontsize.skills - 4;
      const cellX = x + this.style.table.padding;

      for (const line of cellLines) {
        this.page.drawText(sanitizeText(line), { x: cellX, y: textY, size: this.style.fontsize.skills, font: this.fonts.regular });
        textY -= this.style.fontsize.skills + 3;
      }

      x += colWidths[i];
    });

    this.drawRowBorders(startX, y, rowHeight, colWidths);
  }

  drawWrappedTable({ columnWidths, headers, rows }) {
    const wrapCell = (text, width) => {
      return this.wrap(text, this.fonts.regular, this.style.fontsize.skills, width - this.style.table.padding * 2);
    };

    const headerLines = headers.map((h, i) => wrapCell(h, columnWidths[i]));
    const headerHeight = Math.max(...headerLines.map((l) => l.length)) * (this.style.fontsize.skills + 3) + this.style.table.padding * 2;

    this.drawTableRow(this.style.margin.x, this.getY(), headerHeight, columnWidths, headerLines, true);
    this.offsetY(headerHeight);

    rows.forEach((row) => {
      const rowLines = row.map((cell, i) => wrapCell(String(cell), columnWidths[i]));
      const rowHeight = Math.max(...rowLines.map((l) => l.length)) * (this.style.fontsize.skills + 3) + this.style.table.padding * 2;
      this.drawTableRow(this.style.margin.x, this.getY(), rowHeight, columnWidths, rowLines);
      this.offsetY(rowHeight);
    });
  }

  drawFloatingText(text, options, maxWidth) {
    const lines = this.wrap(text, options.font, options.size, maxWidth);

    let newY = options.y;
    for (const ln of lines) {
      this.ensureSpace();
      this.page.drawText(ln, {
        x: options.x,
        y: newY,
        size: options.size,
        font: options.font,
        color: options.color
      });
      newY -= this.style.lineHeight;
    }
    return lines.length * this.style.lineHeight;
  }

  drawTextWithBackground(text, x, y, options) {
    const { font, size = 12, color = rgb(0, 0, 0), backgroundColor = null, padding = 2 } = options;

    // Measure text width/height
    const textWidth = font.widthOfTextAtSize(text, size);
    const textHeight = font.heightAtSize(size);

    // Draw background rectangle
    if (backgroundColor) {
      this.page.drawRectangle({
        x: x - padding,
        y: y - padding * 2,
        width: textWidth + padding * 2,
        height: textHeight + padding * 2,
        color: backgroundColor
      });
    }

    // Draw the actual text
    this.page.drawText(text, { x, y, size, font, color });
  }

  justifyLine(line, maxWidth, size, font) {
    const words = line.split(' ');
    if (words.length <= 1) return { text: line, offsets: [] }; // no justification possible

    const totalWordWidth = words.map((w) => font.widthOfTextAtSize(w, size)).reduce((a, b) => a + b, 0);

    const totalSpaceWidth = maxWidth - totalWordWidth;
    const spaceCount = words.length - 1;
    const spaceSize = totalSpaceWidth / spaceCount;

    return { words, spaceSize };
  }

  drawTextJustifyBlock(text, size, font, color = this.style.colors.primary, width) {
    const maxWidth = width || this.page.getSize().width - this.style.margin.x * 2;
    const lines = this.wrap(text, font, size, maxWidth);

    lines.forEach((ln, i) => {
      this.ensureSpace();

      const isLastLine = i === lines.length - 1;
      const xStart = this.style.margin.x;

      // --- LEFT ALIGN last line ---
      if (isLastLine) {
        this.page.drawText(ln, { x: xStart, y: this.y, size, font, color });
        this.offsetY(this.style.lineHeight);
        return;
      }

      // --- JUSTIFY all other lines ---
      const { words, spaceSize } = this.justifyLine(ln, maxWidth, size, font);
      let cursorX = xStart;

      for (let w = 0; w < words.length; w++) {
        const word = words[w];
        this.page.drawText(word, { x: cursorX, y: this.y, size, font, color });

        cursorX += font.widthOfTextAtSize(word, size);

        if (w < words.length - 1) {
          cursorX += spaceSize; // distribute spacing
        }
      }

      this.offsetY(this.style.lineHeight);
    });
  }

  drawTextJustifyColumnBlock(text, size, font, color, xStart, maxWidth) {
    const lines = this.wrap(text, font, size, maxWidth);

    lines.forEach((ln, i) => {
      this.ensureSpace();

      const isLastLine = i === lines.length - 1;

      if (isLastLine) {
        this.page.drawText(ln, {
          x: xStart,
          y: this.y,
          size,
          font,
          color
        });
        this.offsetY(this.style.lineHeight);
        return;
      }

      const words = ln.split(' ');
      const totalWordWidth = words.reduce((sum, w) => sum + font.widthOfTextAtSize(w, size), 0);

      const totalSpaceWidth = maxWidth - totalWordWidth;
      const spaceSize = totalSpaceWidth / (words.length - 1);

      let cursorX = xStart;

      words.forEach((word, idx) => {
        this.page.drawText(word, {
          x: cursorX,
          y: this.y,
          size,
          font,
          color
        });

        cursorX += font.widthOfTextAtSize(word, size);
        if (idx < words.length - 1) cursorX += spaceSize;
      });

      this.offsetY(this.style.lineHeight);
    });
  }

  drawJustifyBullets(items, size, font) {
    if (!items || (Array.isArray(items) && items.length === 0)) return;

    const { margin, indents, lineHeight } = this.style;
    const bulletGap = 10;
    const bulletX = margin.x + indents.bullet;
    const textX = bulletX + bulletGap;
    const maxWidth = this.page.getSize().width - margin.x * 2 - bulletGap - indents.bullet;

    const list = typeof items === 'string' ? [items] : items;

    for (const rawItem of list) {
      const item = sanitizeText(String(rawItem)).replace(/\s+/g, ' ').trim();
      if (!item) continue;

      const lines = this.wrap(item, font, size, maxWidth);

      lines.forEach((line, index) => {
        this.ensureSpace();

        if (index === 0 && list.length > 1) {
          this.page.drawText('•', {
            x: bulletX,
            y: this.y,
            size,
            font
          });
        }

        this.page.drawText(line, {
          x: textX,
          y: this.y,
          size,
          font
        });

        this.offsetY(lineHeight);
      });
    }

    if (Array.isArray(items)) {
      this.offsetY(4);
    }
  }

  drawJustifyColumnBullets(items, size, font, xStart, maxWidth) {
    if (!items || (Array.isArray(items) && items.length === 0)) return;

    const { indents, lineHeight } = this.style;
    const bulletIndent = indents.bullet + indents.hypen;

    const list = typeof items === 'string' ? [items] : items;
    const useBullets = list.length > 1;

    for (const item of list) {
      const bullet = useBullets ? '• ' : '';
      const text = bullet + item;
      const wrappedLines = this.wrap(text, font, size, maxWidth - bulletIndent);

      for (let i = 0; i < wrappedLines.length; i++) {
        this.ensureSpace();

        const line = wrappedLines[i];
        const isLastLine = i === wrappedLines.length - 1;

        if (isLastLine) {
          this.page.drawText(line, { x: xStart + bulletIndent, y: this.y, size, font });
          this.offsetY(lineHeight);
          continue;
        }

        const { words, spaceSize } = this.justifyLine(line, maxWidth - bulletIndent, size, font);
        let cursorX = xStart + bulletIndent;

        for (let w = 0; w < words.length; w++) {
          const word = words[w];
          this.page.drawText(word, { x: cursorX, y: this.y, size, font });
          cursorX += font.widthOfTextAtSize(word, size);
          if (w < words.length - 1) cursorX += spaceSize;
        }

        this.offsetY(lineHeight);
      }
    }

    this.offsetY(4);
  }

  drawSectionTitle(title, x, y, lineToX, accentColor) {
    const t = sanitizeText(String(title).toUpperCase());
    this.page.drawText(t, {
      x,
      y,
      size: this.style.fontsize.sectionTitle,
      font: this.fonts.bold,
      color: this.style.colors.section
    });

    // horizontal line to the right
    const textWidth = this.fonts.bold.widthOfTextAtSize(t, this.style.fontsize.sectionTitle);
    const startLineX = x + textWidth + 10;

    if (lineToX && lineToX > startLineX) {
      this.page.drawLine({
        start: { x: startLineX, y: y + 4 },
        end: { x: lineToX, y: y + 4 },
        thickness: 1,
        color: accentColor ?? this.style.colors.border
      });
    }
  }

  /**
   * Draw “chips” like the sample SKILLS.
   * Returns height used.
   */
  drawChips({
    items,
    x,
    y,
    maxWidth,
    font,
    size,
    paddingX = 8,
    paddingY = 4,
    gapX = 6,
    gapY = 6,
    borderColor = rgb(0.75, 0.75, 0.75),
    bgColor = rgb(0.97, 0.97, 0.97),
    textColor = rgb(0, 0, 0),
    radius = 2
  }) {
    const list = (Array.isArray(items) ? items : []).map((s) => sanitizeText(s)).filter(Boolean);

    let cursorX = x;
    let cursorY = y;

    const lineH = size + paddingY * 2;
    const startY = y;

    for (const label of list) {
      const textW = font.widthOfTextAtSize(label, size);
      const chipW = textW + paddingX * 2;

      // new line if overflow
      if (cursorX + chipW > x + maxWidth) {
        cursorX = x;
        cursorY -= lineH + gapY;
      }

      // background
      this.page.drawRectangle({
        x: cursorX,
        y: cursorY - lineH,
        width: chipW,
        height: lineH,
        color: bgColor,
        borderColor,
        borderWidth: 1
      });

      // text
      this.page.drawText(label, {
        x: cursorX + paddingX,
        y: cursorY - lineH + paddingY + 1,
        size,
        font,
        color: textColor
      });

      cursorX += chipW + gapX;
    }

    const used = startY - cursorY + lineH;
    return used;
  }
}
