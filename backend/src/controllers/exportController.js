const PDFDocument = require('pdfkit');
const HTMLtoDOCX = require('html-to-docx');
const asyncHandler = require('../middleware/asyncHandler');

// Strips HTML tags down to plain text with basic line breaks, used for PDF generation
// since pdfkit doesn't render HTML directly.
const htmlToPlainSegments = (html) => {
  const withBreaks = html
    .replace(/<\/(p|div|h[1-6]|li|blockquote|tr)>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<li[^>]*>/gi, '• ');

  const text = withBreaks
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

  return text
    .split('\n')
    .map((line) => line.trim())
    .filter((line, idx, arr) => !(line === '' && arr[idx - 1] === ''));
};

// @desc    Export document as PDF
// @route   GET /api/documents/:id/export/pdf
// @access  Private (viewer+)
const exportPDF = asyncHandler(async (req, res) => {
  const doc = req.document;

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${sanitizeFilename(doc.title)}.pdf"`);

  const pdf = new PDFDocument({ margin: 60, size: 'A4' });
  pdf.pipe(res);

  pdf.font('Helvetica-Bold').fontSize(22).text(doc.title, { align: 'left' });
  pdf.moveDown();
  pdf.font('Helvetica').fontSize(11).fillColor('#374151');

  const lines = htmlToPlainSegments(doc.content || '');
  lines.forEach((line) => {
    if (!line) {
      pdf.moveDown(0.5);
    } else {
      pdf.text(line, { align: 'left' });
    }
  });

  pdf.end();
});

// @desc    Export document as DOCX
// @route   GET /api/documents/:id/export/docx
// @access  Private (viewer+)
const exportDOCX = asyncHandler(async (req, res) => {
  const doc = req.document;

  const fullHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>
    <h1>${escapeHtml(doc.title)}</h1>
    ${doc.content || '<p></p>'}
  </body></html>`;

  const buffer = await HTMLtoDOCX(fullHtml, null, {
    table: { row: { cantSplit: true } },
    footer: false,
    pageNumber: false,
  });

  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  );
  res.setHeader('Content-Disposition', `attachment; filename="${sanitizeFilename(doc.title)}.docx"`);
  res.send(buffer);
});

// @desc    Export document as HTML
// @route   GET /api/documents/:id/export/html
// @access  Private (viewer+)
const exportHTML = asyncHandler(async (req, res) => {
  const doc = req.document;

  const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>${escapeHtml(doc.title)}</title>
<style>
  body { font-family: -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; max-width: 800px; margin: 40px auto; padding: 0 20px; line-height: 1.6; color: #1f2937; }
  h1, h2, h3 { color: #111827; }
  blockquote { border-left: 4px solid #6366f1; margin-left: 0; padding-left: 16px; color: #4b5563; }
  pre { background: #f3f4f6; padding: 12px; border-radius: 8px; overflow-x: auto; }
  table { border-collapse: collapse; width: 100%; }
  td, th { border: 1px solid #e5e7eb; padding: 8px; }
  img { max-width: 100%; }
</style>
</head>
<body>
<h1>${escapeHtml(doc.title)}</h1>
${doc.content || ''}
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html');
  res.setHeader('Content-Disposition', `attachment; filename="${sanitizeFilename(doc.title)}.html"`);
  res.send(fullHtml);
});

function sanitizeFilename(name) {
  return (name || 'document').replace(/[^a-z0-9\-_ ]/gi, '').trim().slice(0, 80) || 'document';
}

function escapeHtml(str = '') {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

module.exports = { exportPDF, exportDOCX, exportHTML };
