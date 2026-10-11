/**
 * Madrasatus Sunnah Print Service
 * Provides robust, iframe-safe document printing with exact typography:
 * - Arabic: Amiri / Traditional Arabic / Noto Naskh Arabic (with RTL layout)
 * - Bengali: Kalpurush / SolaimanLipi
 * - English: Times New Roman
 */

interface PrintOptions {
  title?: string;
  contentHtml: string;
  isBengali?: boolean;
  isArabic?: boolean;
  language?: 'ar' | 'bn' | 'en';
  customCss?: string;
  headerHtml?: string;
  footerHtml?: string;
}

export const printDocument = ({
  title = 'مাদরাসাতুস সুন্নাহ — পাঠ পরিকল্পনা ও মূল্যায়ন',
  contentHtml,
  isBengali,
  isArabic,
  language,
  customCss = '',
  headerHtml = '',
  footerHtml = ''
}: PrintOptions) => {
  // Auto-detect language if not explicitly provided
  const hasArabicChars = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/.test(title + ' ' + contentHtml);
  const hasBengaliChars = /[\u0980-\u09FF]/.test(title + ' ' + contentHtml);

  const effectiveLang = language || (isArabic || hasArabicChars ? 'ar' : (isBengali !== false || hasBengaliChars ? 'bn' : 'en'));
  const isRtl = effectiveLang === 'ar';

  let fontToUse = '"Kalpurush", "SolaimanLipi", "Noto Sans Bengali", sans-serif';
  let defaultTitle = 'মাদরাসাতুস সুন্নাহ — অফিসিয়াল পাঠ পরিকল্পনা';

  if (effectiveLang === 'ar') {
    fontToUse = '"Amiri", "Traditional Arabic", "Scheherazade New", "Noto Naskh Arabic", serif';
    defaultTitle = 'مدرسة السنة — خطة الدرس والتقييم';
  } else if (effectiveLang === 'en') {
    fontToUse = '"Times New Roman", Times, Georgia, serif';
    defaultTitle = 'Madrasatus Sunnah — Lesson Plan & Assessment';
  }

  // Create an isolated hidden iframe
  const iframe = document.createElement('iframe');
  iframe.setAttribute('style', 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;z-index:-9999;opacity:0;');
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document || iframe.contentDocument;
  if (!doc) {
    // Fallback if iframe document cannot be retrieved
    window.print();
    return;
  }

  const baseHtml = `
    <!DOCTYPE html>
    <html lang="${effectiveLang}" dir="${isRtl ? 'rtl' : 'ltr'}">
    <head>
      <meta charset="utf-8" />
      <title>${title || defaultTitle}</title>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Amiri:ital,wght@0,400;0,700;1,400;1,700&family=Noto+Naskh+Arabic:wght@400;500;600;700&family=Scheherazade+New:wght@400;700&display=swap" rel="stylesheet">
      <link href="https://fonts.maateen.me/kalpurush/font.css" rel="stylesheet" />
      <link href="https://fonts.maateen.me/solaiman-lipi/font.css" rel="stylesheet" />
      <style>
        @font-face {
          font-family: 'Kalpurush';
          src: url('https://cdn.jsdelivr.net/gh/maateen/kalpurush-font@master/fonts/Kalpurush.woff2') format('woff2'),
               url('https://cdn.jsdelivr.net/gh/maateen/kalpurush-font@master/fonts/Kalpurush.ttf') format('truetype');
          font-weight: normal;
          font-style: normal;
        }

        @page {
          size: A4 portrait;
          margin: 10mm 12mm 10mm 12mm;
        }

        * {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          box-sizing: border-box;
        }

        body {
          margin: 0;
          padding: 0;
          font-family: ${fontToUse};
          font-size: ${effectiveLang === 'ar' ? '14px' : '13px'};
          line-height: ${effectiveLang === 'ar' ? '1.8' : '1.5'};
          color: #0f172a;
          background: #ffffff;
          direction: ${isRtl ? 'rtl' : 'ltr'};
          text-align: ${isRtl ? 'right' : 'left'};
        }

        .no-print, button, .lucide, .action-btn, [role="button"] {
          display: none !important;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          page-break-inside: auto;
          font-family: inherit;
          direction: ${isRtl ? 'rtl' : 'ltr'};
        }

        tr {
          page-break-inside: avoid;
          page-break-after: auto;
        }

        thead {
          display: table-header-group;
        }

        tfoot {
          display: table-footer-group;
        }

        th, td {
          border: 1px solid #334155;
          padding: 6px 8px;
          vertical-align: top;
          text-align: ${isRtl ? 'right' : 'left'};
        }

        th {
          background-color: #f1f5f9;
          font-weight: bold;
          text-align: center;
        }

        h1, h2, h3, h4, h5, h6 {
          font-family: inherit;
          margin-top: 0;
        }

        /* Custom provided CSS */
        ${customCss}
      </style>
    </head>
    <body>
      ${headerHtml}
      <div id="print-content-wrapper" dir="${isRtl ? 'rtl' : 'ltr'}">
        ${contentHtml}
      </div>
      ${footerHtml}
    </body>
    </html>
  `;

  doc.open();
  doc.write(baseHtml);
  doc.close();

  // Trigger print after styles and fonts load
  const triggerPrint = () => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch (e) {
      console.warn('Iframe print failed, falling back to window.print', e);
      window.print();
    } finally {
      // Remove iframe after short delay
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 2000);
    }
  };

  // Allow DOM rendering time for fonts/layout
  setTimeout(triggerPrint, 400);
};
