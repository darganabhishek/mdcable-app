import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const COMPANY_NAME = "M.D. Cable Networks";
const COMPANY_ADDR = "Shop No. 12, Laxmi Bai Nagar Market, New Delhi-110023";
const COMPANY_PHONE = "+91 9811900500";

const toTitleCase = (str) => {
    if (!str || str.toLowerCase() === 'null') return '';
    return str.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

const drawHeader = (doc, title) => {
    // Background accent
    doc.setFillColor(33, 37, 41);
    doc.rect(0, 0, 210, 40, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text(COMPANY_NAME, 15, 25);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(title.toUpperCase(), 195, 25, { align: 'right' });
    
    doc.setTextColor(33, 37, 41);
};

const drawFooter = (doc) => {
    const pageHeight = doc.internal.pageSize.height;
    doc.setFontSize(9);
    doc.setTextColor(150);
    doc.text("This is a computer generated document. No signature required.", 105, pageHeight - 15, { align: 'center' });
    doc.text(`${COMPANY_ADDR} | ${COMPANY_PHONE}`, 105, pageHeight - 10, { align: 'center' });
};

export const generateInvoice = (customer, autoDownload = true) => {
    try {
        const doc = new jsPDF();
        
        drawHeader(doc, "Invoice / Bill");
        
        // Bill Details
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text("Bill To:", 15, 55);
        doc.setFont('helvetica', 'normal');
        doc.text(toTitleCase(customer.name), 15, 62);
        doc.text(`ID: ${customer.customer_id}`, 15, 68);
        doc.text(`${customer.house_no}, ${customer.locality}`, 15, 74);
        doc.text(`${customer.city}, ${customer.pincode || ''}`, 15, 80);
        doc.text(`Mobile: ${customer.mobile}`, 15, 86);

        doc.setFont('helvetica', 'bold');
        doc.text("Invoice Details:", 130, 55);
        doc.setFont('helvetica', 'normal');
        doc.text(`Invoice No: INV-${Date.now().toString().slice(-6)}`, 130, 62);
        doc.text(`Date: ${new Date().toLocaleDateString()}`, 130, 68);
        doc.text(`Service: ${customer.service_type}`, 130, 74);
        doc.text(`Billing Period: ${new Date().toLocaleString('default', { month: 'long' })} ${new Date().getFullYear()}`, 130, 80);

        // Table
        const tableData = [
            [
                customer.service_type + " Subscription",
                customer.package?.name || "Standard Plan",
                "1 Month",
                `INR ${customer.package?.price || 0}`
            ]
        ];

        if (customer.discount > 0) {
            tableData.push(["Discount", "Applied Special Discount", "", `-INR ${customer.discount}`]);
        }

        autoTable(doc, {
            startY: 100,
            head: [['Description', 'Plan', 'Duration', 'Amount']],
            body: tableData,
            theme: 'grid',
            headStyles: { fillStyle: 'F', fillColor: [33, 37, 41], textColor: [255, 255, 255] },
            styles: { fontSize: 10 },
            columnStyles: { 3: { halign: 'right' } }
        });

        const finalY = doc.lastAutoTable.finalY + 10;
        const total = (customer.package?.price || 0) - (customer.discount || 0);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.text(`Total Amount: INR ${total.toFixed(2)}`, 195, finalY, { align: 'right' });

        drawFooter(doc);

        if (autoDownload) {
            doc.save(`Invoice_${customer.customer_id}.pdf`);
        }
        return doc;
    } catch (error) {
        console.error("Error generating invoice:", error);
    }
};

export const generateReceipt = (customer, payment = null, autoDownload = true) => {
    try {
        const doc = new jsPDF();
        
        drawHeader(doc, "Payment Receipt");
        
        // Receipt Details
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text("Received From:", 15, 55);
        doc.setFont('helvetica', 'normal');
        doc.text(toTitleCase(customer.name), 15, 62);
        doc.text(`ID: ${customer.customer_id}`, 15, 68);
        doc.text(`Mobile: ${customer.mobile}`, 15, 74);

        doc.setFont('helvetica', 'bold');
        doc.text("Receipt Details:", 130, 55);
        doc.setFont('helvetica', 'normal');
        doc.text(`Receipt No: RCT-${Date.now().toString().slice(-6)}`, 130, 62);
        doc.text(`Date: ${new Date().toLocaleDateString()}`, 130, 68);
        doc.text(`Status: COMPLETED`, 130, 74);

        const amount = payment?.amount || (customer.package?.price || 0) - (customer.discount || 0);

        autoTable(doc, {
            startY: 90,
            head: [['Payment For', 'Transaction ID', 'Mode', 'Amount Paid']],
            body: [[
                customer.service_type + " Subscription",
                payment?.transaction_id || "N/A",
                "Cash / Online",
                `INR ${amount.toFixed(2)}`
            ]],
            theme: 'grid',
            headStyles: { fillStyle: 'F', fillColor: [33, 37, 41], textColor: [255, 255, 255] },
            styles: { fontSize: 10 },
            columnStyles: { 3: { halign: 'right' } }
        });

        const finalY = doc.lastAutoTable.finalY + 15;
        
        doc.setFillColor(248, 249, 250);
        doc.rect(120, finalY - 5, 75, 25, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        doc.text(`PAID: INR ${amount.toFixed(2)}`, 195, finalY + 12, { align: 'right' });

        drawFooter(doc);

        if (autoDownload) {
            doc.save(`Receipt_${customer.customer_id}.pdf`);
        }
        return doc;
    } catch (error) {
        console.error("Error generating receipt:", error);
    }
};

export const bulkGenerateDocuments = (customers, type = 'invoice') => {
    console.log(`Bulk generating ${customers.length} ${type}s`);
    try {
        const doc = new jsPDF();
        
        customers.forEach((customer, index) => {
            if (index > 0) doc.addPage();
            
            if (type === 'invoice') {
                drawInvoiceOnPage(doc, customer);
            } else {
                drawReceiptOnPage(doc, customer);
            }
        });

        doc.save(`Bulk_${type}s_${new Date().getTime()}.pdf`);
        console.log("Bulk generation complete");
    } catch (error) {
        console.error("Bulk generation error:", error);
    }
};

// Internal helpers to draw on existing doc
const drawInvoiceOnPage = (doc, customer) => {
    drawHeader(doc, "Invoice / Bill");
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text("Bill To:", 15, 55);
    doc.setFont('helvetica', 'normal');
    doc.text(toTitleCase(customer.name), 15, 62);
    doc.text(`ID: ${customer.customer_id}`, 15, 68);
    doc.text(`${customer.house_no}, ${customer.locality}`, 15, 74);
    doc.text(`Mobile: ${customer.mobile}`, 15, 80);

    doc.setFont('helvetica', 'bold');
    doc.text("Invoice Details:", 130, 55);
    doc.setFont('helvetica', 'normal');
    doc.text(`Invoice No: INV-${Math.random().toString(36).substr(2, 6).toUpperCase()}`, 130, 62);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 130, 68);

    const price = customer.package?.price || 0;
    const total = price - (customer.discount || 0);

    autoTable(doc, {
        startY: 100,
        head: [['Description', 'Plan', 'Amount']],
        body: [[
            customer.service_type + " Subscription",
            customer.package?.name || "Standard",
            `INR ${price}`
        ],
        ...(customer.discount > 0 ? [["Discount", "Special", `-INR ${customer.discount}`]] : [])
        ],
        theme: 'grid',
        headStyles: { fillColor: [33, 37, 41] },
        columnStyles: { 2: { halign: 'right' } }
    });

    doc.setFont('helvetica', 'bold');
    doc.text(`Total: INR ${total.toFixed(2)}`, 195, doc.lastAutoTable.finalY + 10, { align: 'right' });
    drawFooter(doc);
};

const drawReceiptOnPage = (doc, customer) => {
    drawHeader(doc, "Payment Receipt");
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text("Received From:", 15, 55);
    doc.setFont('helvetica', 'normal');
    doc.text(toTitleCase(customer.name), 15, 62);
    doc.text(`ID: ${customer.customer_id}`, 15, 68);

    doc.setFont('helvetica', 'bold');
    doc.text("Receipt Info:", 130, 55);
    doc.setFont('helvetica', 'normal');
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 130, 62);

    const amount = (customer.package?.price || 0) - (customer.discount || 0);

    autoTable(doc, {
        startY: 90,
        head: [['Description', 'Status', 'Amount Paid']],
        body: [[
            customer.service_type + " Payment",
            "COMPLETED",
            `INR ${amount.toFixed(2)}`
        ]],
        theme: 'grid',
        headStyles: { fillColor: [33, 37, 41] },
        columnStyles: { 2: { halign: 'right' } }
    });

    doc.setFont('helvetica', 'bold');
    doc.text(`PAID: INR ${amount.toFixed(2)}`, 195, doc.lastAutoTable.finalY + 15, { align: 'right' });
    drawFooter(doc);
};
