'use client';

import { useState } from 'react';
import jsPDF from 'jspdf';

interface TimesheetData {
  date: string;
  startTime: string;
  estimatedDuration: string;
  language: string;
  subject: string;
  location: string;
  bookingMadeBy: string;
  serviceUserName: string;
  notesToInterpreter: string;
  interpreterName: string;
  jobReferenceNo: string;
  interpreterReportsTo: string;
  reportsToContactNumber: string;
  actualStartTime: string;
  actualFinishTime: string;
  serviceUserAttended: string;
  interpreterOnTime: string;
  easyToArrange: string;
  performanceRating: string;
  customerFullName: string;
  department: string;
  customerSignature: string;
  customerDate: string;
  interpreterSignature: string;
  interpreterDate: string;
  interpreterDeclaration: string;
}

export default function TimesheetGenerator() {
  const [formData, setFormData] = useState<TimesheetData>({
    date: '',
    startTime: '',
    estimatedDuration: '',
    language: '',
    subject: '',
    location: '',
    bookingMadeBy: '',
    serviceUserName: '',
    notesToInterpreter: '',
    interpreterName: '',
    jobReferenceNo: '',
    interpreterReportsTo: '',
    reportsToContactNumber: '',
    actualStartTime: '',
    actualFinishTime: '',
    serviceUserAttended: '',
    interpreterOnTime: '',
    easyToArrange: '',
    performanceRating: '',
    customerFullName: '',
    department: '',
    customerSignature: '',
    customerDate: '',
    interpreterSignature: '',
    interpreterDate: '',
    interpreterDeclaration: 'I am an authorised signatory for my department. I am signing to confirm that the Interpreter and the hours that I am authorising are accurate and I approve payment. I am signing to confirm that I have checked and verified the photo identification of the interpreter with the timesheet. I understand that if I knowingly provide false information this may result in disciplinary action and I may be liable to prosecution and civil recovery proceedings. I consent to the disclosure of information from this form to and by the Participating Authority for the purpose of verification of this claim and the investigation, prevention, detection and prosecution of fraud.'
  });

  const handleInputChange = (field: keyof TimesheetData, value: string) => {
    setFormData(prev => {
      const newData = {
      ...prev,
      [field]: value
      };
      
      // Auto-calculate duration when start time or end time changes
      if (field === 'startTime' || field === 'actualFinishTime') {
        if (newData.startTime && newData.actualFinishTime) {
          const startTime = new Date(`2000-01-01T${newData.startTime}`);
          const endTime = new Date(`2000-01-01T${newData.actualFinishTime}`);
      
      if (endTime > startTime) {
        const diffMs = endTime.getTime() - startTime.getTime();
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        
        let duration = '';
        if (diffHours > 0) {
          duration += `${diffHours} hour${diffHours > 1 ? 's' : ''}`;
        }
        if (diffMinutes > 0) {
          duration += `${diffHours > 0 ? ' ' : ''}${diffMinutes} minute${diffMinutes > 1 ? 's' : ''}`;
        }
        
            newData.estimatedDuration = duration;
      } else {
            newData.estimatedDuration = 'Invalid time range';
      }
    } else {
          newData.estimatedDuration = '';
        }
      }
      
      return newData;
    });
  };

  const generatePDF = async (options?: { blank?: boolean }) => {
      const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const marginX = 15;
    const marginY = 15;
    const footerHeight = 18;
    const contentWidth = pageWidth - (2 * marginX);
    const bottomY = pageHeight - marginY - footerHeight;
    const gutter = 8;
    const columnWidth = (contentWidth - gutter) / 2;

    // Typography - larger sizes for better readability
    const font = {
      headerSize: 17,
      sectionSize: 11,
      labelSize: 9,
      valueSize: 9,
      smallSize: 8,
    };
    const lineHeights = {
      small: 2.5,
      normal: 3.5,
      sectionGap: 3,
      blockGap: 4,
    };

    let y = marginY + 15;

    const drawHeader = async () => {
      // Enhanced letterhead with better design - reduced height
      const headerHeight = 30;
      const logoWidth = 30;
      const logoHeight = 8;
      
      // Background rectangle for letterhead
      pdf.setFillColor(248, 250, 252); // Light gray background
      pdf.rect(marginX, marginY, pageWidth - (2 * marginX), headerHeight, 'F');
      
      // Border around letterhead
      pdf.setDrawColor(200, 200, 200);
      pdf.setLineWidth(0.3);
      pdf.rect(marginX, marginY, pageWidth - (2 * marginX), headerHeight);
      
      try {
        const logoResponse = await fetch('/logo-purple.jpeg');
        if (!logoResponse.ok) {
          throw new Error('Logo fetch failed');
        }
        
        const logoBlob = await logoResponse.blob();
        const logoBase64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            if (reader.result) {
              resolve(reader.result as string);
            } else {
              reject(new Error('Failed to convert logo to base64'));
            }
          };
          reader.onerror = () => reject(new Error('FileReader error'));
          reader.readAsDataURL(logoBlob);
        });
        
        const logoX = marginX + 5;
        const logoY = marginY + 5;
        
        pdf.addImage(logoBase64, 'JPEG', logoX, logoY, logoWidth, logoHeight);
      } catch (error) {
        console.log('Logo loading failed:', error);
        // Enhanced placeholder logo
        pdf.setFillColor(128, 0, 128);
        pdf.rect(marginX + 5, marginY + 5, logoWidth, logoHeight, 'F');
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(8);
        pdf.setTextColor(255, 255, 255);
        pdf.text('COMPANY', marginX + 5 + logoWidth/2, marginY + 5 + logoHeight/2 - 2, { align: 'center' });
        pdf.text('LOGO', marginX + 5 + logoWidth/2, marginY + 5 + logoHeight/2 + 2, { align: 'center' });
        pdf.setTextColor(0, 0, 0);
      }

      // Company details with enhanced styling
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9);
      pdf.setTextColor(51, 65, 85); // Slate gray
      pdf.text('Radley House', pageWidth - marginX - 5, marginY + 8, { align: 'right' });
      
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7);
      pdf.setTextColor(71, 85, 105); // Lighter slate gray
      const companyDetails = [
        'Richardshaw Rd, Pudsey, LS28 6LE',
        'Company No. 15333696'
      ];
      const companyX = pageWidth - marginX - 5;
      let companyY = marginY + 12;
      companyDetails.forEach((line) => {
        pdf.text(line, companyX, companyY, { align: 'right' });
        companyY += 3;
      });

      // Main title with enhanced styling
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(font.headerSize + 2);
      pdf.setTextColor(30, 41, 59); // Dark slate
      pdf.text('TIMESHEET', pageWidth / 2, marginY + headerHeight - 8, { align: 'center' });
      
      // Subtle underline for title
      pdf.setDrawColor(200, 200, 200);
      pdf.setLineWidth(0.5);
      pdf.line(marginX + 10, marginY + headerHeight - 5, pageWidth - marginX - 10, marginY + headerHeight - 5);
    };



    const addPageIfNeeded = async (requiredHeight: number) => {
      const footerHeight = 18;
      const availableHeight = bottomY - footerHeight - 3; // Reduced buffer
      if (y + requiredHeight <= availableHeight) return;
      pdf.addPage();
      await drawHeader();
      y = marginY + 35; // Adjusted for smaller header height
    };

    const sectionTitle = async (title: string) => {
      await addPageIfNeeded(lineHeights.sectionGap + 3);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(font.sectionSize);
      pdf.text(title, marginX, y);
      y += 2;
      pdf.setDrawColor(200, 200, 200);
      pdf.setLineWidth(0.4);
      pdf.line(marginX, y, marginX + contentWidth, y);
      y += lineHeights.sectionGap;
    };

    const drawLabelValue = (
      label: string,
      value: string,
      startX: number,
      labelWidth: number,
      valueMaxWidth: number,
      extraSpacing: number = 0
    ) => {
      pdf.setFontSize(font.labelSize);
    pdf.setFont('helvetica', 'bold');
      pdf.text(label, startX, y);
    pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(font.valueSize);
      const displayValue = value && value.trim() !== '' ? value : '_________________';
      const wrapped = pdf.splitTextToSize(displayValue, valueMaxWidth);
      pdf.text(wrapped, startX + labelWidth, y);
      const rowHeight = Math.max(lineHeights.normal, wrapped.length * lineHeights.small) + extraSpacing;
      y += rowHeight;
      return rowHeight;
    };

    const drawKVRowToColumn = (
      items: Array<{ label: string; value: string; extraSpacing?: number }>,
      startX: number,
      startY: number,
      maxWidth: number,
      allowPageBreaks: boolean = true
    ) => {
      const savedY = y;
      y = startY;
      const labelWidth = 32;
      items.forEach((it) => {
        if (allowPageBreaks) {
          addPageIfNeeded(lineHeights.normal);
        }
        drawLabelValue(it.label, it.value, startX, labelWidth, maxWidth - labelWidth, it.extraSpacing || 0);
      });
      const endY = y;
      y = savedY;
      return endY;
    };

    const drawTick = (x1: number, y1: number, x2: number, y2: number, x3: number, y3: number) => {
      pdf.setLineWidth(0.5);
      pdf.setDrawColor(0, 0, 0);
      pdf.line(x1, y1, x2, y2);
      pdf.line(x2, y2, x3, y3);
    };

    const drawCheckboxWithLabel = (
      x: number,
      yBaseline: number,
      label: string,
      checked: boolean
    ) => {
      const boxSize = 3;
      const gap = 3;
      const boxY = yBaseline - boxSize + 1;
      pdf.rect(x, boxY, boxSize, boxSize);
      if (checked) {
        drawTick(x + 0.7, boxY + boxSize * 0.55, x + boxSize * 0.45, boxY + boxSize - 0.7, x + boxSize - 0.6, boxY + 0.7);
      }
      pdf.text(label, x + boxSize + gap, yBaseline);
      return boxSize + gap + pdf.getTextWidth(label);
    };

    const drawYesNo = (question: string, x: number, yLine: number, selected: 'yes' | 'no' | '') => {
      const gapAfterQuestion = 8;
      pdf.setFontSize(font.valueSize);
      pdf.text(question, x, yLine);
      let cursor = x + pdf.getTextWidth(question) + gapAfterQuestion;
      cursor += drawCheckboxWithLabel(cursor, yLine, 'Yes', selected === 'yes') + 12;
      drawCheckboxWithLabel(cursor, yLine, 'No', selected === 'no');
    };

    const drawRatingRow = (selectedRating: string) => {
      const labels = ['Excellent', 'Good', 'Fair', 'Poor', 'Very Poor'];
      const keys = ['excellent', 'good', 'fair', 'poor', 'very poor'];
      const xStart = marginX;
      let x = xStart;
      labels.forEach((label, i) => {
        const isSelected = selectedRating === (keys[i] as any);
        x += drawCheckboxWithLabel(x, y, label, isSelected) + 10;
      });
      y += lineHeights.blockGap;
    };

    const drawFooter = () => {
      const footerY = pageHeight - marginY - footerHeight;
      
      // Footer background
      pdf.setFillColor(248, 250, 252); // Light gray background
      pdf.rect(marginX, footerY, pageWidth - (2 * marginX), footerHeight, 'F');
      
      // Footer border
      pdf.setDrawColor(200, 200, 200);
      pdf.setLineWidth(0.3);
      pdf.rect(marginX, footerY, pageWidth - (2 * marginX), footerHeight);
      
      // Top border line
      pdf.line(marginX, footerY, pageWidth - marginX, footerY);
      
      // Company name - center
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8);
      pdf.setTextColor(51, 65, 85); // Slate gray
      pdf.text('Jambo Linguists Ltd', pageWidth / 2, footerY + 6, { align: 'center' });
      
      // Tagline
      pdf.setFont('helvetica', 'italic');
      pdf.setFontSize(6);
      pdf.setTextColor(71, 85, 105);
      pdf.text('The Home Of Swahili', pageWidth / 2, footerY + 10, { align: 'center' });
      
      // Contact details - left side
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(5);
      pdf.setTextColor(71, 85, 105);
      pdf.text('jamii@jambolinguists.com', marginX + 5, footerY + 14);
      pdf.text('+44 7938 065717', marginX + 5, footerY + 17);
      
      // Address - right side
      pdf.text('Radley House, Richardshaw Rd', pageWidth - marginX - 5, footerY + 14, { align: 'right' });
      pdf.text('Pudsey, LS28 6LE', pageWidth - marginX - 5, footerY + 17, { align: 'right' });
      
      // Company number - bottom center
      pdf.setFontSize(4);
      pdf.text('Company No. 15333696', pageWidth / 2, footerY + 18, { align: 'center' });
    };

    const isBlank = options?.blank === true;
    const data: TimesheetData = isBlank
      ? {
          date: '',
          startTime: '',
          estimatedDuration: '',
          language: '',
          subject: '',
          location: '',
          bookingMadeBy: '',
          serviceUserName: '',
          notesToInterpreter: '',
          interpreterName: '',
          jobReferenceNo: '',
          interpreterReportsTo: '',
          reportsToContactNumber: '',
          actualStartTime: '',
          actualFinishTime: '',
          serviceUserAttended: '',
          interpreterOnTime: '',
          easyToArrange: '',
          performanceRating: '',
          customerFullName: '',
          department: '',
          customerSignature: '',
          customerDate: '',
          interpreterSignature: '',
          interpreterDate: '',
          interpreterDeclaration: ''
        }
      : formData;

    await drawHeader();
    y = marginY + 35; // Reduced for smaller header height

    await sectionTitle('BOOKING DETAILS');
    const leftStartX = marginX;
    const rightStartX = marginX + columnWidth + gutter;
    const twoColStartY = y;

    const measureKVRowsHeight = (
      items: Array<{ label: string; value: string; extraSpacing?: number }>,
      maxWidth: number
    ) => {
      const labelWidth = 32;
      let total = 0;
      items.forEach((it) => {
        const displayValue = it.value && it.value.trim() !== '' ? it.value : '_________________';
        const wrapped = pdf.splitTextToSize(displayValue, maxWidth - labelWidth);
        const rowHeight = Math.max(lineHeights.normal, wrapped.length * lineHeights.small) + (it.extraSpacing || 0);
        total += rowHeight;
      });
      return total;
    };

    const leftItems = [
      { label: 'Date:', value: data.date, extraSpacing: 1 },
      { label: 'Start time:', value: data.startTime, extraSpacing: 1 },
      { label: 'End time:', value: data.actualFinishTime, extraSpacing: 1 },
      { label: 'Duration:', value: data.estimatedDuration, extraSpacing: 1 },
      { label: 'Language:', value: data.language, extraSpacing: 1 },
      { label: 'Subject:', value: data.subject, extraSpacing: 1 },
      { label: 'Location:', value: data.location, extraSpacing: 1 },
      { label: 'Booking made by:', value: data.bookingMadeBy, extraSpacing: 1 },
      { label: 'Service user name:', value: data.serviceUserName, extraSpacing: 1 },
      { label: 'Notes to interpreter:', value: data.notesToInterpreter, extraSpacing: 1 },
    ];
    const rightItems = [
      { label: 'Name:', value: data.interpreterName, extraSpacing: 1 },
      { label: 'Job Ref No:', value: data.jobReferenceNo, extraSpacing: 1 },
      { label: 'Reports to:', value: data.interpreterReportsTo, extraSpacing: 1 },
      { label: 'Contact number:', value: data.reportsToContactNumber, extraSpacing: 1 },
    ];
    const leftHeight = measureKVRowsHeight(leftItems, columnWidth);
    const rightHeight = measureKVRowsHeight(rightItems, columnWidth);
    const twoColMaxHeight = Math.max(leftHeight, rightHeight);
    await addPageIfNeeded(twoColMaxHeight + lineHeights.blockGap);

    pdf.setFont('helvetica', 'normal');
    const leftEndY = drawKVRowToColumn(
      leftItems,
      leftStartX,
      twoColStartY,
      columnWidth,
      false
    );

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(font.sectionSize);
    const rightHeaderY = twoColStartY - (3 + lineHeights.sectionGap);
    pdf.text('INTERPRETER PROFILE', rightStartX, rightHeaderY);
    pdf.setDrawColor(200, 200, 200);
    pdf.setLineWidth(0.4);
    pdf.line(rightStartX, rightHeaderY + 3, rightStartX + columnWidth, rightHeaderY + 3);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(font.valueSize);
    const rightEndY = drawKVRowToColumn(
      [
        { label: 'Name:', value: data.interpreterName },
        { label: 'Job Ref No:', value: data.jobReferenceNo },
        { label: 'Reports to:', value: data.interpreterReportsTo },
        { label: 'Contact number:', value: data.reportsToContactNumber },
      ],
      rightStartX,
      twoColStartY,
      columnWidth,
      false
    );

    y = Math.max(leftEndY, rightEndY) + lineHeights.blockGap;

    await sectionTitle('TO BE COMPLETED BY THE CUSTOMER');

    await addPageIfNeeded(lineHeights.normal * 2);
    pdf.setFontSize(font.valueSize);
    pdf.setFont('helvetica', 'normal');
    const labelWidth = 24;
    drawLabelValue('Start Time:', data.actualStartTime, marginX, labelWidth, (contentWidth / 2) - labelWidth - 6);
    const prevY = y - lineHeights.normal;
    const rightHalfX = marginX + contentWidth / 2 + 6;
    const savedY = y;
    y = prevY;
    drawLabelValue('Finish Time:', data.actualFinishTime, rightHalfX, labelWidth, (contentWidth / 2) - labelWidth - 6);
    y = savedY;
    
    // Add extra spacing after time fields
    y += lineHeights.blockGap;
    
    await addPageIfNeeded(lineHeights.blockGap);
    pdf.setFontSize(font.valueSize);
    drawYesNo('Did the service user attend?', marginX, y, (data.serviceUserAttended as any));
    y += lineHeights.blockGap; // Increased spacing between yes/no questions
    await addPageIfNeeded(lineHeights.blockGap);
    drawYesNo('Did the interpreter arrive on time?', marginX, y, (data.interpreterOnTime as any));
    y += lineHeights.blockGap; // Increased spacing between yes/no questions
    await addPageIfNeeded(lineHeights.blockGap);
    drawYesNo('Was it easy to arrange the interpreter?', marginX, y, (data.easyToArrange as any));
    y += lineHeights.blockGap;

    await addPageIfNeeded(lineHeights.blockGap);
    pdf.setFont('helvetica', 'normal');
    pdf.text('How would you rate their performance?', marginX, y);
    y += lineHeights.blockGap; // Increased spacing after question
    drawRatingRow(data.performanceRating);

    await addPageIfNeeded(lineHeights.blockGap);
    pdf.setDrawColor(230, 230, 230);
    pdf.line(marginX, y, marginX + contentWidth, y);
    y += lineHeights.small;
    pdf.setFont('helvetica', 'italic');
    pdf.setFontSize(font.smallSize);
    pdf.text('Please complete the following fields in BLOCK CAPITALS:', marginX, y);
    y += lineHeights.sectionGap + 2; // Added extra spacing after BLOCK CAPITALS instruction
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(font.valueSize);
    drawLabelValue('Customer Full Name:', data.customerFullName, marginX, 40, contentWidth - 40, 1.5);
    drawLabelValue('Department:', data.department, marginX, 28, contentWidth - 28, 1.5);
    await addPageIfNeeded(lineHeights.blockGap);
    const signRowY = y;
    drawLabelValue('Customer\'s Signature:', data.customerSignature, marginX, 42, (contentWidth / 2) - 42 - 6, 1.5);
    const savedY2 = y;
    y = signRowY;
    drawLabelValue('Date:', data.customerDate, marginX + contentWidth / 2 + 6, 14, (contentWidth / 2) - 14 - 6, 1.5);
    y = Math.max(savedY2, y) + lineHeights.sectionGap;

    await sectionTitle('INTERPRETER\'S DECLARATION');
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8); // Increased font size for better readability
    const declarationText = data.interpreterDeclaration || 'I am an authorised signatory for my department. I am signing to confirm that the Interpreter and the hours that I am authorising are accurate and I approve payment. I am signing to confirm that I have checked and verified the photo identification of the interpreter with the timesheet. I understand that if I knowingly provide false information this may result in disciplinary action and I may be liable to prosecution and civil recovery proceedings. I consent to the disclosure of information from this form to and by the Participating Authority for the purpose of verification of this claim and the investigation, prevention, detection and prosecution of fraud.';
    const wrappedDeclaration = pdf.splitTextToSize(declarationText, contentWidth);
    const declHeight = wrappedDeclaration.length * 2.5; // More compact line height
    await addPageIfNeeded(declHeight + lineHeights.sectionGap);
    pdf.text(wrappedDeclaration, marginX, y);
    y += declHeight + lineHeights.sectionGap + 3; // Added extra spacing after declaration text

    const interpRowY = y;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(font.valueSize);
    drawLabelValue('Interpreter\'s Signature:', data.interpreterSignature, marginX, 44, (contentWidth / 2) - 44 - 6);
    const savedY3 = y;
    y = interpRowY;
    drawLabelValue('Date:', data.interpreterDate, marginX + contentWidth / 2 + 6, 14, (contentWidth / 2) - 14 - 6);
    y = Math.max(savedY3, y);

    // Reduce spacing before footer - only add minimal gap
    y += lineHeights.small;

    // Add footer to all pages
    const pageCount = (pdf as any).getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i);
      drawFooter();
    }

      const filename = isBlank ? 'timesheet-fillable.pdf' : 'timesheet.pdf';
      pdf.save(filename);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="max-w-5xl mx-auto px-4">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-3">Timesheet Generator</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">Create professional timesheets for interpreter services with our easy-to-use form</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-100">
          <form className="space-y-8">
            {/* BOOKING DETAILS */}
            <div className="border-b border-gray-200 pb-8">
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Booking Details</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Date</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => handleInputChange('date', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-600 transition-all duration-200 hover:border-gray-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => handleInputChange('startTime', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                  <input
                    type="time"
                    value={formData.actualFinishTime}
                    onChange={(e) => handleInputChange('actualFinishTime', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Duration (Auto-calculated)</label>
                  <input
                    type="text"
                    value={formData.estimatedDuration}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
                  <input
                    type="text"
                    value={formData.language}
                    onChange={(e) => handleInputChange('language', e.target.value)}
                    placeholder="e.g., English to French"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                  <input
                    type="text"
                    value={formData.subject}
                    onChange={(e) => handleInputChange('subject', e.target.value)}
                    placeholder="e.g., Medical consultation"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    placeholder="e.g., City Hospital"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Booking Made By</label>
                  <input
                    type="text"
                    value={formData.bookingMadeBy}
                    onChange={(e) => handleInputChange('bookingMadeBy', e.target.value)}
                    placeholder="Name of person who made booking"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Service User Name</label>
                  <input
                    type="text"
                    value={formData.serviceUserName}
                    onChange={(e) => handleInputChange('serviceUserName', e.target.value)}
                    placeholder="Name of person receiving service"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-600"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes to Interpreter</label>
                  <textarea
                    value={formData.notesToInterpreter}
                    onChange={(e) => handleInputChange('notesToInterpreter', e.target.value)}
                    placeholder="Any special instructions or notes"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-600"
                  />
                </div>
              </div>
            </div>

            {/* INTERPRETER PROFILE */}
            <div className="border-b border-gray-200 pb-8">
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Interpreter Profile</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Interpreter Name</label>
                  <input
                    type="text"
                    value={formData.interpreterName}
                    onChange={(e) => handleInputChange('interpreterName', e.target.value)}
                    placeholder="Full name of interpreter"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Job Reference No</label>
                  <input
                    type="text"
                    value={formData.jobReferenceNo}
                    onChange={(e) => handleInputChange('jobReferenceNo', e.target.value)}
                    placeholder="Job reference number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Interpreter Reports To</label>
                  <input
                    type="text"
                    value={formData.interpreterReportsTo}
                    onChange={(e) => handleInputChange('interpreterReportsTo', e.target.value)}
                    placeholder="Name of supervisor"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reports To Contact Number</label>
                  <input
                    type="text"
                    value={formData.reportsToContactNumber}
                    onChange={(e) => handleInputChange('reportsToContactNumber', e.target.value)}
                    placeholder="Contact number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-600"
                  />
                </div>
              </div>
            </div>

            {/* CUSTOMER SECTION */}
            <div className="border-b border-gray-200 pb-8">
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Customer Section</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Actual Start Time</label>
                  <input
                    type="time"
                    value={formData.actualStartTime}
                    onChange={(e) => handleInputChange('actualStartTime', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Actual Finish Time</label>
                  <input
                    type="time"
                    value={formData.actualFinishTime}
                    onChange={(e) => handleInputChange('actualFinishTime', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Did the service user attend?</label>
                  <select
                    value={formData.serviceUserAttended}
                    onChange={(e) => handleInputChange('serviceUserAttended', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  >
                    <option value="" className="text-gray-600">Select...</option>
                    <option value="yes" className="text-gray-900">Yes</option>
                    <option value="no" className="text-gray-900">No</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Did the interpreter arrive on time?</label>
                  <select
                    value={formData.interpreterOnTime}
                    onChange={(e) => handleInputChange('interpreterOnTime', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  >
                    <option value="" className="text-gray-600">Select...</option>
                    <option value="yes" className="text-gray-900">Yes</option>
                    <option value="no" className="text-gray-900">No</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Did you find it easy to arrange the interpreter?</label>
                  <select
                    value={formData.easyToArrange}
                    onChange={(e) => handleInputChange('easyToArrange', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  >
                    <option value="" className="text-gray-600">Select...</option>
                    <option value="yes" className="text-gray-900">Yes</option>
                    <option value="no" className="text-gray-900">No</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Performance Rating</label>
                  <select
                    value={formData.performanceRating}
                    onChange={(e) => handleInputChange('performanceRating', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  >
                    <option value="" className="text-gray-600">Select rating...</option>
                    <option value="excellent" className="text-gray-900">Excellent</option>
                    <option value="good" className="text-gray-900">Good</option>
                    <option value="fair" className="text-gray-900">Fair</option>
                    <option value="poor" className="text-gray-900">Poor</option>
                    <option value="very poor" className="text-gray-900">Very Poor</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Customer Full Name</label>
                  <input
                    type="text"
                    value={formData.customerFullName}
                    onChange={(e) => handleInputChange('customerFullName', e.target.value)}
                    placeholder="Full name in BLOCK CAPITALS"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => handleInputChange('department', e.target.value)}
                    placeholder="Department name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Customer's Signature</label>
                  <input
                    type="text"
                    value={formData.customerSignature}
                    onChange={(e) => handleInputChange('customerSignature', e.target.value)}
                    placeholder="Signature or name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Customer Date</label>
                  <input
                    type="date"
                    value={formData.customerDate}
                    onChange={(e) => handleInputChange('customerDate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  />
                </div>
              </div>
            </div>

            {/* INTERPRETER DECLARATION */}
            <div className="pb-8">
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mr-4">
                  <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Interpreter's Declaration</h2>
              </div>
              <div className="space-y-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Interpreter Declaration Text</label>
                  <textarea
                    value={formData.interpreterDeclaration}
                    onChange={(e) => handleInputChange('interpreterDeclaration', e.target.value)}
                    placeholder="Enter the declaration text that will appear on the timesheet..."
                    rows={6}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-600 transition-all duration-200 hover:border-gray-400 resize-none"
                  />
                  <p className="text-xs text-gray-500 mt-2">This text will appear in the Interpreter's Declaration section of the PDF.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Interpreter's Signature</label>
                    <input
                      type="text"
                      value={formData.interpreterSignature}
                      onChange={(e) => handleInputChange('interpreterSignature', e.target.value)}
                      placeholder="Signature or name"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-600 transition-all duration-200 hover:border-gray-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Interpreter Date</label>
                    <input
                      type="date"
                      value={formData.interpreterDate}
                      onChange={(e) => handleInputChange('interpreterDate', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 transition-all duration-200 hover:border-gray-400"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center space-y-4">
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  type="button"
                  onClick={async () => await generatePDF()}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-10 py-4 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Generate Timesheet PDF
                </button>
                <button
                  type="button"
                  onClick={async () => await generatePDF({ blank: true })}
                  className="bg-gradient-to-r from-gray-600 to-gray-700 text-white px-10 py-4 rounded-xl hover:from-gray-700 hover:to-gray-800 transition-all duration-200 font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download Blank Template
                </button>
              </div>
            </div>

            {/* Live Preview Indicator */}
            <div className="mt-6 text-center">
              <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-200 shadow-sm">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-3 animate-pulse"></div>
                <span className="font-medium">Live Preview Active</span>
                <span className="ml-2 text-green-600">Updates automatically as you type</span>
              </div>
            </div>

            {/* PDF Preview Section */}
            <div className="mt-10 border-t border-gray-200 pt-10">
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-3xl font-bold text-gray-900">Live Document Preview</h3>
                    <p className="text-gray-600 mt-1">See exactly how your timesheet will look</p>
                  </div>
                  <div className="ml-4 inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-800 border border-green-200">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                    LIVE
                  </div>
                </div>
                <button
                  onClick={() => {}} // No action needed here as preview is always visible
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="bg-gray-100 rounded-lg p-4">
                <div className="flex justify-center">
                  <div className="w-full max-w-4xl">
                                         <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                       <div className="p-6">
                                                  {/* Enhanced Header with Logo and Company Details */}
                         <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
                           <div className="flex justify-between items-start">
                             <div className="flex items-center">
                               <img 
                                 src="/logo-purple.jpeg" 
                                 alt="Company Logo" 
                                 className="w-20 h-6 object-contain mr-4"
                                 onError={(e) => {
                                   const target = e.target as HTMLImageElement;
                                   target.style.display = 'none';
                                   target.nextElementSibling?.classList.remove('hidden');
                                 }}
                               />
                               <div className="w-20 h-6 bg-purple-600 rounded flex flex-col items-center justify-center mr-4 hidden">
                                 <span className="text-white text-xs font-bold leading-tight">COMPANY</span>
                                 <span className="text-white text-xs font-bold leading-tight">LOGO</span>
                               </div>
                             </div>
                             <div className="text-right">
                               <div className="text-sm font-bold text-slate-700">Radley House</div>
                               <div className="text-xs text-slate-600">Richardshaw Rd, Pudsey, LS28 6LE</div>
                               <div className="text-xs text-slate-600">Company No. 15333696</div>
                             </div>
                           </div>
                         </div>
                         
                         <h2 className="text-3xl font-bold text-slate-800 mb-4 text-center">TIMESHEET</h2>
                         <hr className="border-gray-300 mb-6" />
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* BOOKING DETAILS */}
                          <div className="border-b border-gray-200 pb-4">
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">BOOKING DETAILS</h3>
                            <div className="grid grid-cols-1 gap-2">
                              <div>
                                <label className="block text-sm font-medium text-gray-700">Date</label>
                                <p className="text-gray-900">{formData.date || '_________________'}</p>
                              </div>
                                                             <div>
                                 <label className="block text-sm font-medium text-gray-700">Start Time</label>
                                 <p className="text-gray-900">{formData.startTime || '_________________'}</p>
                               </div>
                               <div>
                                 <label className="block text-sm font-medium text-gray-700">End Time</label>
                                 <p className="text-gray-900">{formData.actualFinishTime || '_________________'}</p>
                               </div>
                                                              <div>
                                 <label className="block text-sm font-medium text-gray-700">Duration</label>
                                 <p className="text-gray-900">{formData.estimatedDuration || '_________________'}</p>
                               </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700">Language</label>
                                <p className="text-gray-900">{formData.language || '_________________'}</p>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700">Subject</label>
                                <p className="text-gray-900">{formData.subject || '_________________'}</p>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700">Location</label>
                                <p className="text-gray-900">{formData.location || '_________________'}</p>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700">Booking Made By</label>
                                <p className="text-gray-900">{formData.bookingMadeBy || '_________________'}</p>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700">Service User Name</label>
                                <p className="text-gray-900">{formData.serviceUserName || '_________________'}</p>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700">Notes to Interpreter</label>
                                <p className="text-gray-900">{formData.notesToInterpreter || '_________________'}</p>
                              </div>
                            </div>
                          </div>

                          {/* INTERPRETER PROFILE */}
                          <div className="border-b border-gray-200 pb-4">
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">INTERPRETER PROFILE</h3>
                            <div className="grid grid-cols-1 gap-2">
                              <div>
                                <label className="block text-sm font-medium text-gray-700">Interpreter Name</label>
                                <p className="text-gray-900">{formData.interpreterName || '_________________'}</p>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700">Job Reference No</label>
                                <p className="text-gray-900">{formData.jobReferenceNo || '_________________'}</p>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700">Interpreter Reports To</label>
                                <p className="text-gray-900">{formData.interpreterReportsTo || '_________________'}</p>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700">Reports To Contact Number</label>
                                <p className="text-gray-900">{formData.reportsToContactNumber || '_________________'}</p>
                              </div>
                            </div>
                          </div>

                          {/* CUSTOMER SECTION */}
                          <div className="border-b border-gray-200 pb-4">
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">TO BE COMPLETED BY THE CUSTOMER</h3>
                            <div className="grid grid-cols-1 gap-2">
                              <div>
                                <label className="block text-sm font-medium text-gray-700">Actual Start Time</label>
                                <p className="text-gray-900">{formData.actualStartTime || '_________________'}</p>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700">Actual Finish Time</label>
                                <p className="text-gray-900">{formData.actualFinishTime || '_________________'}</p>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700">Did the service user attend?</label>
                                <p className="text-gray-900">{formData.serviceUserAttended || '_________________'}</p>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700">Did the interpreter arrive on time?</label>
                                <p className="text-gray-900">{formData.interpreterOnTime || '_________________'}</p>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700">Did you find it easy to arrange the interpreter?</label>
                                <p className="text-gray-900">{formData.easyToArrange || '_________________'}</p>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700">Performance Rating</label>
                                <p className="text-gray-900">{formData.performanceRating || '_________________'}</p>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700">Customer Full Name</label>
                                <p className="text-gray-900">{formData.customerFullName || '_________________'}</p>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700">Department</label>
                                <p className="text-gray-900">{formData.department || '_________________'}</p>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700">Customer's Signature</label>
                                <p className="text-gray-900">{formData.customerSignature || '_________________'}</p>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700">Customer Date</label>
                                <p className="text-gray-900">{formData.customerDate || '_________________'}</p>
                              </div>
                            </div>
                          </div>

                          {/* INTERPRETER DECLARATION */}
                          <div className="pb-4">
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">INTERPRETER'S DECLARATION</h3>
                            <div className="space-y-3">
                              <div>
                                <label className="block text-sm font-medium text-gray-700">Declaration Text</label>
                                <p className="text-gray-900 text-sm leading-relaxed">{formData.interpreterDeclaration || 'I am an authorised signatory for my department. I am signing to confirm that the Interpreter and the hours that I am authorising are accurate and I approve payment. I am signing to confirm that I have checked and verified the photo identification of the interpreter with the timesheet. I understand that if I knowingly provide false information this may result in disciplinary action and I may be liable to prosecution and civil recovery proceedings. I consent to the disclosure of information from this form to and by the Participating Authority for the purpose of verification of this claim and the investigation, prevention, detection and prosecution of fraud.'}</p>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700">Interpreter's Signature</label>
                                  <p className="text-gray-900">{formData.interpreterSignature || '_________________'}</p>
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700">Interpreter Date</label>
                                  <p className="text-gray-900">{formData.interpreterDate || '_________________'}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Footer */}
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mt-6">
                          <div className="text-center mb-2">
                            <div className="text-sm font-bold text-slate-700">Jambo Linguists Ltd</div>
                            <div className="text-xs italic text-slate-600">The Home Of Swahili</div>
                          </div>
                          <div className="flex justify-between text-xs text-slate-600">
                            <div>
                              <div>jamii@jambolinguists.com</div>
                              <div>+44 7938 065717</div>
                            </div>
                            <div className="text-right">
                              <div>Radley House, Richardshaw Rd</div>
                              <div>Pudsey, LS28 6LE</div>
                            </div>
                          </div>
                          <div className="text-center text-xs text-slate-500 mt-2">
                            Company No. 15333696
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 text-center">
                  <p className="text-sm text-gray-600 mb-4">
                    This preview updates automatically as you fill out the form above. Use the buttons below to generate the final PDF.
                  </p>
                  <div className="flex flex-wrap justify-center gap-3">
                    <button
                      onClick={async () => await generatePDF()}
                      className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors font-medium"
                    >
                      Download Filled PDF
                    </button>
                    <button
                      onClick={async () => await generatePDF({ blank: true })}
                      className="bg-gray-700 text-white px-6 py-2 rounded-md hover:bg-gray-800 transition-colors font-medium"
                    >
                      Download Blank Template
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
