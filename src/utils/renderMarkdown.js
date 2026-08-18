/**
 * Shared markdown-to-HTML renderer for AI output across the dashboard.
 */
export function renderMarkdown(text) {
  if (!text) return '';
  return text
    .replace(/^#### (.+)$/gm, '<h5 style="margin:14px 0 3px;font-size:12px;font-weight:900;text-transform:uppercase;letter-spacing:1px;">$1</h5>')
    .replace(/^### (.+)$/gm, '<h4 style="margin:18px 0 4px;font-size:14px;font-weight:900;text-transform:uppercase;letter-spacing:1px;border-bottom:2px solid #000;padding-bottom:4px;">$1</h4>')
    .replace(/^## (.+)$/gm, '<h3 style="margin:20px 0 6px;font-size:15px;font-weight:900;text-transform:uppercase;">$1</h3>')
    .replace(/^# (.+)$/gm, '<h2 style="margin:20px 0 6px;font-size:17px;font-weight:900;text-transform:uppercase;">$1</h2>')
    .replace(/\*\*(.+?)\*\*/g, '<strong style="font-weight:900;">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^\* (.+)$/gm, '<li style="margin:4px 0;padding-left:4px;">$1</li>')
    .replace(/^- (.+)$/gm, '<li style="margin:4px 0;padding-left:4px;">$1</li>')
    .replace(/^\d+\. (.+)$/gm, '<li style="margin:4px 0;padding-left:4px;">$1</li>')
    .replace(/(<li.*<\/li>)/gs, '<ul style="margin:8px 0;padding-left:20px;list-style:disc;">$1</ul>')
    .replace(/^---$/gm, '<hr style="border:none;border-top:2px solid #000;margin:16px 0;"/>')
    .replace(/\n\n/g, '<br/><br/>')
    .replace(/\n/g, '<br/>');
}
