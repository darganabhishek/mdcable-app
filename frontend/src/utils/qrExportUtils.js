import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';

/**
 * Utility to export multiple customer QR codes to a printable PDF.
 * @param {Array} customers - Array of customer objects.
 */
export const exportQRsToPDF = async (customers) => {
  if (!customers || customers.length === 0) return;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  // Layout settings
  const margin = 15;
  const qrSize = 50;
  const cardWidth = (pageWidth - (margin * 3)) / 2; // 2 columns
  const cardHeight = 85; // Height for QR + Caption
  const cardsPerPage = 6; // 2x3 grid

  const toTitleCase = (str) => {
    if (!str || str.toLowerCase() === 'null') return '';
    return str.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const renderAddress = (house_no, locality) => {
    const parts = [house_no, locality].filter(p => p && p.toLowerCase() !== 'null');
    return parts.length > 0 ? parts.map(toTitleCase).join(', ') : '-';
  };

  for (let i = 0; i < customers.length; i++) {
    const customer = customers[i];
    const pageIndex = Math.floor(i / cardsPerPage);
    const cardIndex = i % cardsPerPage;
    
    if (i > 0 && cardIndex === 0) {
      doc.addPage();
    }

    const col = cardIndex % 2;
    const row = Math.floor(cardIndex / 2);
    
    const x = margin + (col * (cardWidth + margin));
    const y = margin + (row * (cardHeight + 10));

    // Generate QR Code as DataURL
    try {
      const qrDataUrl = await QRCode.toDataURL(customer.id, {
        margin: 1,
        width: 200,
        errorCorrectionLevel: 'H'
      });

      // Add QR Code to PDF
      doc.addImage(qrDataUrl, 'PNG', x + (cardWidth - qrSize) / 2, y, qrSize, qrSize);

      // Add Caption
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      const name = toTitleCase(customer.name);
      const nameWidth = doc.getTextWidth(name);
      doc.text(name, x + (cardWidth - nameWidth) / 2, y + qrSize + 5);

      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      
      const idText = `ID: ${customer.customer_id}`;
      const idWidth = doc.getTextWidth(idText);
      doc.text(idText, x + (cardWidth - idWidth) / 2, y + qrSize + 9);

      const mobileText = `Mob: ${customer.mobile}`;
      const mobileWidth = doc.getTextWidth(mobileText);
      doc.text(mobileText, x + (cardWidth - mobileWidth) / 2, y + qrSize + 13);

      const address = renderAddress(customer.house_no, customer.locality);
      const splitAddress = doc.splitTextToSize(address, cardWidth - 10);
      doc.text(splitAddress, x + 5, y + qrSize + 17, { align: 'center', maxWidth: cardWidth - 10 });

      // Add a light border/frame for the card
      doc.setDrawColor(230, 230, 230);
      doc.roundedRect(x, y - 2, cardWidth, cardHeight, 3, 3);

    } catch (err) {
      console.error(`Failed to generate QR for customer ${customer.name}`, err);
    }
  }

  doc.save(`customer_qrs_export_${new Date().getTime()}.pdf`);
};
