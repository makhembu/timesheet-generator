'use client';

import { useEffect, useRef, useState } from 'react';
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
  customerSignatureImage?: string;
  customerDate: string;
  interpreterSignature: string;
  interpreterSignatureImage?: string;
  interpreterDate: string;
  customDeclaration: string;
}

const initialFormData: TimesheetData = {
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
  customerSignatureImage: '',
  customerDate: '',
  interpreterSignature: '',
  interpreterSignatureImage: '',
  interpreterDate: '',
  customDeclaration:
    'I am an authorised signatory for my department. I am signing to confirm that the Interpreter and the hours that I am authorising are accurate and I approve payment. I am signing to confirm that I have checked and verified the photo identification of the interpreter with the timesheet. I understand that if I knowingly provide false information this may result in disciplinary action and I may be liable to prosecution and civil recovery proceedings. I consent to the disclosure of information from this form to and by the Participating Authority for the purpose of verification of this claim and the investigation, prevention, detection and prosecution of fraud.',
};

export default function TimesheetGenerator() {
  const [formData, setFormData] = useState<TimesheetData>(initialFormData);
  const [enableCustomerDraw, setEnableCustomerDraw] = useState(false);
  const [enableInterpreterDraw, setEnableInterpreterDraw] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(true);
  const customerCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const interpreterCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingCustomerRef = useRef(false);
  const isDrawingInterpreterRef = useRef(false);
  const lastPosCustomerRef = useRef<{ x: number; y: number } | null>(null);
  const lastPosInterpreterRef = useRef<{ x: number; y: number } | null>(null);

  // Load saved form (if any)
  useEffect(() => {
    try {
      const saved = localStorage.getItem('timesheetFormData');
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<TimesheetData>;
        setFormData(prev => ({ ...prev, ...parsed }));
      }
      const savedPreview = localStorage.getItem('isPreviewOpen');
      if (savedPreview !== null) {
        setIsPreviewOpen(savedPreview === 'true');
      }
    } catch {}
  }, []);

  // Auto-save on changes
  useEffect(() => {
    try {
      localStorage.setItem('timesheetFormData', JSON.stringify(formData));
      localStorage.setItem('isPreviewOpen', String(isPreviewOpen));
    } catch {}
  }, [formData, isPreviewOpen]);

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
      
      // Ensure notes to interpreter doesn't exceed 150 characters
      if (field === 'notesToInterpreter' && value.length > 150) {
        newData.notesToInterpreter = value.substring(0, 150);
      }
      
      return newData;
    });
  };

  const readFileAsDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleSignatureUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    field: 'customerSignatureImage' | 'interpreterSignatureImage'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await readFileAsDataURL(file);
      setFormData(prev => ({ ...prev, [field]: dataUrl } as any));
    } catch {}
  };

  const getCanvasContext = (canvas: HTMLCanvasElement | null) => {
    if (!canvas) return null;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#111827';
    return ctx;
  };

  const getRelativePos = (canvas: HTMLCanvasElement, clientX: number, clientY: number) => {
    const rect = canvas.getBoundingClientRect();
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const startDraw = (
    who: 'customer' | 'interpreter',
    clientX: number,
    clientY: number
  ) => {
    if ((who === 'customer' && !enableCustomerDraw) || (who === 'interpreter' && !enableInterpreterDraw)) return;
    const canvas = who === 'customer' ? customerCanvasRef.current : interpreterCanvasRef.current;
    const ctx = getCanvasContext(canvas);
    if (!canvas || !ctx) return;
    const pos = getRelativePos(canvas, clientX, clientY);
    if (who === 'customer') {
      isDrawingCustomerRef.current = true;
      lastPosCustomerRef.current = pos;
    } else {
      isDrawingInterpreterRef.current = true;
      lastPosInterpreterRef.current = pos;
    }
  };

  const moveDraw = (
    who: 'customer' | 'interpreter',
    clientX: number,
    clientY: number
  ) => {
    if ((who === 'customer' && !enableCustomerDraw) || (who === 'interpreter' && !enableInterpreterDraw)) return;
    const canvas = who === 'customer' ? customerCanvasRef.current : interpreterCanvasRef.current;
    const ctx = getCanvasContext(canvas);
    if (!canvas || !ctx) return;
    const isDrawing = who === 'customer' ? isDrawingCustomerRef.current : isDrawingInterpreterRef.current;
    const lastPos = who === 'customer' ? lastPosCustomerRef.current : lastPosInterpreterRef.current;
    if (!isDrawing || !lastPos) return;
    const pos = getRelativePos(canvas, clientX, clientY);
    ctx.beginPath();
    ctx.moveTo(lastPos.x, lastPos.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    if (who === 'customer') {
      lastPosCustomerRef.current = pos;
    } else {
      lastPosInterpreterRef.current = pos;
    }
  };

  const endDraw = (who: 'customer' | 'interpreter') => {
    if ((who === 'customer' && !enableCustomerDraw) || (who === 'interpreter' && !enableInterpreterDraw)) return;
    const canvas = who === 'customer' ? customerCanvasRef.current : interpreterCanvasRef.current;
    if (who === 'customer') {
      isDrawingCustomerRef.current = false;
    } else {
      isDrawingInterpreterRef.current = false;
    }
    if (canvas) {
      try {
        const dataUrl = canvas.toDataURL('image/png');
        setFormData(prev => ({
          ...prev,
          [who === 'customer' ? 'customerSignatureImage' : 'interpreterSignatureImage']: dataUrl,
        } as any));
      } catch {}
    }
  };

  const clearCanvas = (who: 'customer' | 'interpreter') => {
    const canvas = who === 'customer' ? customerCanvasRef.current : interpreterCanvasRef.current;
    const ctx = getCanvasContext(canvas || null);
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setFormData(prev => ({
      ...prev,
      [who === 'customer' ? 'customerSignatureImage' : 'interpreterSignatureImage']: '',
    } as any));
  };

  const generatePDF = async (options?: { blank?: boolean; share?: boolean }) => {
    // Validate notes length before generating PDF
    if (!options?.blank && formData.notesToInterpreter.length > 150) {
      alert('Notes to interpreter exceed 150 characters. Please shorten the text to prevent overflow issues in the PDF.');
      return;
    }
    
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
      labelSize: 10,
      valueSize: 10,
      smallSize: 9,
    };
    const lineHeights = {
      small: 3.0, // Increased from 2.5 by 20%
      normal: 4.2, // Increased from 3.5 by 20%
      sectionGap: 3.6, // Increased from 3 by 20%
      blockGap: 4.8, // Increased from 4 by 20%
    };

    let y = marginY + 15;

    const drawHeader = async () => {
      // Enhanced letterhead with better design - reduced height
      const headerHeight = 30;
      const logoWidth = 45;
      const logoHeight = 12;
      
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
      // Single-line label; push value start by labelWidth
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(font.labelSize);
      pdf.text(label, startX, y);

      // Wrap value within its column
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(font.valueSize);
      const displayValue = value && value.trim() !== '' ? value : '_________________';
      const wrappedValue = pdf.splitTextToSize(displayValue, Math.max(valueMaxWidth, 0));

      // Row height based on value height (label is single line)
      const valueHeight = Math.max(lineHeights.normal, wrappedValue.length * lineHeights.small);
      const rowHeight = valueHeight + extraSpacing;

      pdf.text(wrappedValue, startX + labelWidth, y);
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
      const labelWidth = 40; // push values a bit further right
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
      y += lineHeights.blockGap * 1.2; // Increased spacing by 20%
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
      
      // Spacer for aesthetics
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(5);
      pdf.text('', pageWidth / 2, footerY + 15.2, { align: 'center' });
      
      // Page numbers removed by request

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
          customDeclaration: formData.customDeclaration
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
        const wrappedValue = pdf.splitTextToSize(displayValue, maxWidth - labelWidth);
        const wrappedLabel = pdf.splitTextToSize(it.label, labelWidth);
        const labelHeight = Math.max(lineHeights.normal, wrappedLabel.length * lineHeights.small);
        const valueHeight = Math.max(lineHeights.normal, wrappedValue.length * lineHeights.small);
        const rowHeight = Math.max(labelHeight, valueHeight) + (it.extraSpacing || 0);
        total += rowHeight;
      });
      return total;
    };

    const leftItems = [
      { label: 'Date:', value: data.date, extraSpacing: 1.2 },
      { label: 'Start time:', value: data.startTime, extraSpacing: 1.2 },
      { label: 'End time:', value: data.actualFinishTime, extraSpacing: 1.2 },
      { label: 'Duration:', value: data.estimatedDuration, extraSpacing: 1.2 },
      { label: 'Language:', value: data.language, extraSpacing: 1.2 },
      { label: 'Subject:', value: data.subject, extraSpacing: 1.2 },
      { label: 'Location:', value: data.location, extraSpacing: 1.2 },
      { label: 'Booking made by:', value: data.bookingMadeBy, extraSpacing: 1.2 },
      { label: 'Service user name:', value: data.serviceUserName, extraSpacing: 1.2 },
      { label: 'Notes to interpreter:', value: data.notesToInterpreter.length > 150 ? data.notesToInterpreter.substring(0, 150) + '...' : data.notesToInterpreter, extraSpacing: 1.2 },
    ];
    const rightItems = [
      { label: 'Name:', value: data.interpreterName, extraSpacing: 1.2 },
      { label: 'Job Ref No:', value: data.jobReferenceNo, extraSpacing: 1.2 },
      { label: 'Reports to:', value: data.interpreterReportsTo, extraSpacing: 1.2 },
      { label: 'Contact number:', value: data.reportsToContactNumber, extraSpacing: 1.2 },
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
    drawLabelValue('Start Time:', data.actualStartTime, marginX, labelWidth, (contentWidth / 2) - labelWidth - 6, 1.2);
    const prevY = y - lineHeights.normal;
    const rightHalfX = marginX + contentWidth / 2 + 6;
    const savedY = y;
    y = prevY;
    drawLabelValue('Finish Time:', data.actualFinishTime, rightHalfX, labelWidth, (contentWidth / 2) - labelWidth - 6, 1.2);
    y = savedY;
    
    // Add extra spacing after time fields
    y += lineHeights.blockGap;
    
    await addPageIfNeeded(lineHeights.blockGap);
    pdf.setFontSize(font.valueSize);
    drawYesNo('Did the service user attend?', marginX, y, (data.serviceUserAttended as any));
    y += lineHeights.blockGap * 1.2; // Increased spacing between yes/no questions by 20%
    await addPageIfNeeded(lineHeights.blockGap);
    drawYesNo('Did the interpreter arrive on time?', marginX, y, (data.interpreterOnTime as any));
    y += lineHeights.blockGap * 1.2; // Increased spacing between yes/no questions by 20%
    await addPageIfNeeded(lineHeights.blockGap);
    drawYesNo('Was it easy to arrange the interpreter?', marginX, y, (data.easyToArrange as any));
    y += lineHeights.blockGap * 1.2;

    await addPageIfNeeded(lineHeights.blockGap);
    pdf.setFont('helvetica', 'normal');
    pdf.text('How would you rate their performance?', marginX, y);
    y += lineHeights.blockGap * 1.2; // Increased spacing after question by 20%
    drawRatingRow(data.performanceRating);

    await addPageIfNeeded(lineHeights.blockGap);
    pdf.setDrawColor(230, 230, 230);
    pdf.line(marginX, y, marginX + contentWidth, y);
    y += lineHeights.small;
    pdf.setFont('helvetica', 'italic');
    pdf.setFontSize(font.smallSize);
    pdf.text('Please complete the following fields in BLOCK CAPITALS:', marginX, y);
    y += (lineHeights.sectionGap + 2) * 1.2; // Increased spacing after BLOCK CAPITALS instruction by 20%
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(font.valueSize);
    drawLabelValue('Customer Full Name:', data.customerFullName, marginX, 40, contentWidth - 40, 1.8);
    drawLabelValue('Department:', data.department, marginX, 28, contentWidth - 28, 1.8);
    await addPageIfNeeded(lineHeights.blockGap);
    const drawSignatureRow = async (
      label: string,
      textValue: string,
      imageDataUrl: string | undefined,
      startX: number,
      labelWidth: number,
      valueMaxWidth: number,
      maxImageHeight: number
    ) => {
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(font.labelSize);
      pdf.text(label, startX, y);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(font.valueSize);

      if (imageDataUrl) {
        try {
          // Reserve space for signature image
          const imgWidth = valueMaxWidth;
          const imgHeight = maxImageHeight;
          await addPageIfNeeded(imgHeight + 2);
          pdf.addImage(imageDataUrl, 'PNG', startX + labelWidth, y - (imgHeight - 3), imgWidth, imgHeight);
          y += imgHeight + 2;
          return;
        } catch {}
      }
      // Fallback to text line
      drawLabelValue('', textValue, startX, labelWidth, valueMaxWidth, 1.8);
    };

    const signRowY = y;
    await drawSignatureRow(
      'Customer\'s Signature:',
      data.customerSignature,
      (data as any).customerSignatureImage,
      marginX,
      42,
      (contentWidth / 2) - 42 - 6,
      12
    );
    const savedY2 = y;
    y = signRowY;
    drawLabelValue('Date:', data.customerDate, marginX + contentWidth / 2 + 6, 14, (contentWidth / 2) - 14 - 6, 1.8);
    y = Math.max(savedY2, y) + lineHeights.sectionGap;

    await sectionTitle('INTERPRETER\'S DECLARATION');
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8); // Increased font size for better readability
    const declarationText = data.customDeclaration || 'I am an authorised signatory for my department. I am signing to confirm that the Interpreter and the hours that I am authorising are accurate and I approve payment. I am signing to confirm that I have checked and verified the photo identification of the interpreter with the timesheet. I understand that if I knowingly provide false information this may result in disciplinary action and I may be liable to prosecution and civil recovery proceedings. I consent to the disclosure of information from this form to and by the Participating Authority for the purpose of verification of this claim and the investigation, prevention, detection and prosecution of fraud.';
    const wrappedDeclaration = pdf.splitTextToSize(declarationText, contentWidth);
    const declHeight = wrappedDeclaration.length * 3.0; // Increased line height by 20% from 2.5
    await addPageIfNeeded(declHeight + lineHeights.sectionGap);
    pdf.text(wrappedDeclaration, marginX, y);
    y += declHeight + lineHeights.sectionGap + 3.6; // Increased spacing after declaration text by 20%

    const interpRowY = y;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(font.valueSize);
    await drawSignatureRow(
      'Interpreter\'s Signature:',
      data.interpreterSignature,
      (data as any).interpreterSignatureImage,
      marginX,
      44,
      (contentWidth / 2) - 44 - 6,
      12
    );
    const savedY3 = y;
    y = interpRowY;
    drawLabelValue('Date:', data.interpreterDate, marginX + contentWidth / 2 + 6, 14, (contentWidth / 2) - 14 - 6, 1.2);
    y = Math.max(savedY3, y);

    // Reduce spacing before footer - only add minimal gap
    y += lineHeights.small * 1.2; // Increased spacing by 20%

    // Add footer to all pages
    const pageCount = (pdf as any).getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i);
      drawFooter();
    }

      const safeDate = (data.date || new Date().toISOString().slice(0,10)).replace(/\//g,'-');
      const safeJob = (data.jobReferenceNo || '').replace(/[^a-zA-Z0-9_-]+/g,'').slice(0,24);
      const filename = isBlank ? `Jambo_Timesheet_Template.pdf` : `Jambo_Timesheet_${safeDate}${safeJob ? '_' + safeJob : ''}.pdf`;
      if (options?.share && (navigator as any).share) {
        try {
          const blob = pdf.output('blob');
          const file = new File([blob], filename, { type: 'application/pdf' });
          await (navigator as any).share({ title: filename, files: [file] });
          return;
        } catch {
          // Fallback to save
        }
      }
      pdf.save(filename);
  };

  return (
              <div className="min-h-screen py-4 sm:py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center justify-between bg-white/70 border border-gray-200 rounded-lg p-3 sm:p-4">
            <div className="flex items-center">
              <img
                src="/logo-purple.jpeg"
                alt="Company Logo"
                className="w-28 h-8 object-contain mr-3 sm:mr-4"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.nextElementSibling?.classList.remove('hidden');
                }}
              />
              <div className="w-28 h-8 bg-purple-600 rounded flex flex-col items-center justify-center mr-3 sm:mr-4 hidden">
                <span className="text-white text-[10px] sm:text-xs font-bold leading-tight">COMPANY</span>
                <span className="text-white text-[10px] sm:text-xs font-bold leading-tight">LOGO</span>
              </div>
              <div>
                <div className="text-base sm:text-xl font-bold text-slate-800">Jambo Linguists Ltd</div>
                <div className="text-xs sm:text-sm text-slate-600">The Home Of Swahili</div>
              </div>
            </div>
            <div className="hidden sm:block text-right text-xs text-slate-600">
              <div>jamii@jambolinguists.com</div>
              <div>+44 7938 065717</div>
            </div>
          </div>

          <div className="text-center mt-4">
            <h1 className="text-2xl sm:text-4xl font-bold text-white drop-shadow mb-1">Jambo Timesheet Generator</h1>
            <p className="text-sm sm:text-base text-slate-300">Fill out the form below to generate your timesheet PDF</p>
          </div>
        </div>
 
        <div className="card p-4 sm:p-6 lg:p-8">
          <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
            {/* BOOKING DETAILS */}
            <div className="border-b border-gray-200 pb-4 sm:pb-6">
              <h2 className="section-header">BOOKING DETAILS</h2>
              <div className="form-grid">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => handleInputChange('date', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-600 transition-colors hover:border-gray-400"
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes to Interpreter
                    <span className="text-xs text-gray-500 ml-2 font-normal">
                      (Max 150 characters)
                    </span>
                  </label>
                  <textarea
                    value={formData.notesToInterpreter}
                    onChange={(e) => handleInputChange('notesToInterpreter', e.target.value)}
                    placeholder="Any special instructions or notes"
                    rows={3}
                    maxLength={150}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-600 transition-colors ${
                      formData.notesToInterpreter.length > 130 ? 'border-red-300 focus:border-red-500 focus:ring-red-500' :
                      formData.notesToInterpreter.length > 100 ? 'border-orange-300 focus:border-orange-500 focus:ring-orange-500' :
                      'border-gray-300 focus:border-blue-500'
                    }`}
                  />
                  <div className="char-limit-info">
                    <span className="char-limit-text">
                      Maximum 150 characters to prevent overflow
                    </span>
                    <span className={`char-limit-counter ${
                      formData.notesToInterpreter.length > 130 ? 'danger' : 
                      formData.notesToInterpreter.length > 100 ? 'warning' : 
                      'safe'
                    }`}>
                      {formData.notesToInterpreter.length}/150
                    </span>
                  </div>
                  {formData.notesToInterpreter.length > 100 && (
                    <div className="text-xs text-gray-600 mt-1">
                      <span className="font-medium">Note:</span> Long text may be truncated in the PDF to maintain proper document layout and prevent overflow issues.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* INTERPRETER PROFILE */}
            <div className="border-b border-gray-200 pb-4 sm:pb-6">
              <h2 className="section-header">INTERPRETER PROFILE</h2>
              <div className="form-grid">
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
            <div className="border-b border-gray-200 pb-4 sm:pb-6">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">TO BE COMPLETED BY THE CUSTOMER</h2>
              <div className="form-grid">
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
                    onChange={(e) => handleInputChange('customerFullName', e.target.value.toUpperCase())}
                    placeholder="Full name in BLOCK CAPITALS"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-600 uppercase"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => handleInputChange('department', e.target.value.toUpperCase())}
                    placeholder="Department name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-600 uppercase"
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
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center gap-2">
                      <input type="file" accept="image/*" onChange={(e) => handleSignatureUpload(e, 'customerSignatureImage')} className="text-xs" />
                      <button type="button" onClick={() => clearCanvas('customer')} className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200">Clear</button>
                      <label className="ml-2 inline-flex items-center gap-1 text-xs text-gray-700">
                        <input type="checkbox" checked={enableCustomerDraw} onChange={(e) => setEnableCustomerDraw(e.target.checked)} />
                        Enable drawing
                      </label>
                    </div>
                    <div className={`relative rounded-md bg-white ${enableCustomerDraw ? 'border border-gray-300' : 'border-2 border-dashed border-gray-300'}`}>
                      {!enableCustomerDraw && (
                        <div className="absolute inset-0 flex items-center justify-center text-gray-500 pointer-events-none select-none">
                          <div className="flex items-center gap-2 text-xs sm:text-sm">
                            <svg className="w-4 h-4 sm:w-5 sm:h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M12 19l7-7 3 3-7 7-3 .5.5-3z"/>
                              <path d="M18 13l-3-3"/>
                            </svg>
                            <span>Enable drawing to sign</span>
                          </div>
                        </div>
                      )}
                      <canvas
                        ref={customerCanvasRef}
                        width={600}
                        height={180}
                        aria-label="Customer signature canvas"
                        aria-describedby="customer-signature-help"
                        className={`w-full h-28 sm:h-36 ${enableCustomerDraw ? 'cursor-crosshair' : 'cursor-not-allowed pointer-events-none'}`}
                        onMouseDown={(e) => startDraw('customer', e.clientX, e.clientY)}
                        onMouseMove={(e) => moveDraw('customer', e.clientX, e.clientY)}
                        onMouseUp={() => endDraw('customer')}
                        onMouseLeave={() => endDraw('customer')}
                        onTouchStart={(e) => { const t=e.touches[0]; startDraw('customer', t.clientX, t.clientY); }}
                        onTouchMove={(e) => { const t=e.touches[0]; moveDraw('customer', t.clientX, t.clientY); }}
                        onTouchEnd={() => endDraw('customer')}
                      />
                    </div>
                    <div id="customer-signature-help" className="sr-only">Check Enable drawing to sign with your finger or mouse, or upload an image.</div>
                    {formData.customerSignatureImage && (
                      <div className="text-xs text-gray-600">Signature captured.</div>
                    )}
                  </div>
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
            <div className="pb-4 sm:pb-6">
              <h2 className="section-header">INTERPRETER'S DECLARATION</h2>
              
              {/* Custom Declaration Text Editor */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Declaration Text
                    <span className="text-xs text-gray-500 ml-2 font-normal">
                      (This text appears in both filled and blank PDFs)
                    </span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const defaultDeclaration = 'I am an authorised signatory for my department. I am signing to confirm that the Interpreter and the hours that I am authorising are accurate and I approve payment. I am signing to confirm that I have checked and verified the photo identification of the interpreter with the timesheet. I understand that if I knowingly provide false information this may result in disciplinary action and I may be liable to prosecution and civil recovery proceedings. I consent to the disclosure of information from this form to and by the Participating Authority for the purpose of verification of this claim and the investigation, prevention, detection and prosecution of fraud.';
                      handleInputChange('customDeclaration', defaultDeclaration);
                    }}
                    className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors"
                  >
                    Reset to Default
                  </button>
                </div>
                                  <textarea
                    value={formData.customDeclaration}
                    onChange={(e) => handleInputChange('customDeclaration', e.target.value)}
                    placeholder="Enter the declaration text that will appear in the PDF"
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-600 resize-y declaration-textarea"
                  />
                                  <div className="mt-2 text-xs text-gray-600">
                    <p>This declaration text will be used in both the filled timesheet and blank template PDFs.</p>
                    <p className="mt-1">You can customize the legal text, company policies, or any other declaration content as needed.</p>
                    <div className="mt-2 flex justify-between items-center">
                      <span className="text-gray-500">
                        Current length: {formData.customDeclaration.length} characters
                      </span>
                      <span className="text-gray-500">
                        Recommended: Keep under 500 characters for optimal PDF layout
                      </span>
                    </div>
                  </div>
              </div>
              
              <div className="form-grid">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Interpreter's Signature</label>
                  <input
                    type="text"
                    value={formData.interpreterSignature}
                    onChange={(e) => handleInputChange('interpreterSignature', e.target.value)}
                    placeholder="Signature or name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-600"
                  />
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center gap-2">
                      <input type="file" accept="image/*" onChange={(e) => handleSignatureUpload(e, 'interpreterSignatureImage')} className="text-xs" />
                      <button type="button" onClick={() => clearCanvas('interpreter')} className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200">Clear</button>
                      <label className="ml-2 inline-flex items-center gap-1 text-xs text-gray-700">
                        <input type="checkbox" checked={enableInterpreterDraw} onChange={(e) => setEnableInterpreterDraw(e.target.checked)} />
                        Enable drawing
                      </label>
                    </div>
                    <div className={`relative rounded-md bg-white ${enableInterpreterDraw ? 'border border-gray-300' : 'border-2 border-dashed border-gray-300'}`}>
                      {!enableInterpreterDraw && (
                        <div className="absolute inset-0 flex items-center justify-center text-gray-500 pointer-events-none select-none">
                          <div className="flex items-center gap-2 text-xs sm:text-sm">
                            <svg className="w-4 h-4 sm:w-5 sm:h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M12 19l7-7 3 3-7 7-3 .5.5-3z"/>
                              <path d="M18 13l-3-3"/>
                            </svg>
                            <span>Enable drawing to sign</span>
                          </div>
                        </div>
                      )}
                      <canvas
                        ref={interpreterCanvasRef}
                        width={600}
                        height={180}
                        aria-label="Interpreter signature canvas"
                        aria-describedby="interpreter-signature-help"
                        className={`w-full h-28 sm:h-36 ${enableInterpreterDraw ? 'cursor-crosshair' : 'cursor-not-allowed pointer-events-none'}`}
                        onMouseDown={(e) => startDraw('interpreter', e.clientX, e.clientY)}
                        onMouseMove={(e) => moveDraw('interpreter', e.clientX, e.clientY)}
                        onMouseUp={() => endDraw('interpreter')}
                        onMouseLeave={() => endDraw('interpreter')}
                        onTouchStart={(e) => { const t=e.touches[0]; startDraw('interpreter', t.clientX, t.clientY); }}
                        onTouchMove={(e) => { const t=e.touches[0]; moveDraw('interpreter', t.clientX, t.clientY); }}
                        onTouchEnd={() => endDraw('interpreter')}
                      />
                    </div>
                    <div id="interpreter-signature-help" className="sr-only">Check Enable drawing to sign with your finger or mouse, or upload an image.</div>
                    {formData.interpreterSignatureImage && (
                      <div className="text-xs text-gray-600">Signature captured.</div>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Interpreter Date</label>
                  <input
                    type="date"
                    value={formData.interpreterDate}
                    onChange={(e) => handleInputChange('interpreterDate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  />
                </div>
              </div>
            </div>

            <div className="text-center pb-24 sm:pb-0">
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  type="button"
                  onClick={async () => await generatePDF()}
                  className="btn-primary"
                >
                  Generate Timesheet PDF
                </button>
                <button
                  type="button"
                  onClick={async () => await generatePDF({ share: true })}
                  className="btn-secondary"
                >
                  Share PDF
                </button>
                <button
                  type="button"
                  onClick={async () => await generatePDF({ blank: true })}
                  className="btn-secondary"
                >
                  Download Blank Template
                </button>
                <button
                  type="button"
                  onClick={() => {
                    try {
                      localStorage.setItem('timesheetFormData', JSON.stringify(formData));
                      alert('Form data saved.');
                    } catch {}
                  }}
                  className="bg-gray-200 text-gray-800 px-6 py-2 rounded-md hover:bg-gray-300 transition-colors font-medium"
                >
                  Save Form
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFormData(initialFormData);
                    try { localStorage.removeItem('timesheetFormData'); } catch {}
                  }}
                  className="bg-red-600 text-white px-6 py-2 rounded-md hover:bg-red-700 transition-colors font-medium"
                >
                  Clear Form
                </button>
              </div>
            </div>

            {/* Live Preview Indicator */}
            <div className="mt-4 text-center">
              <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                Live Preview Active - Updates automatically as you type
              </div>
            </div>

            {/* PDF Preview Section */}
            <div className="mt-6 sm:mt-8 border-t border-gray-200 pt-6 sm:pt-8">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-3">
                <div className="flex items-center">
                  <h3 className="text-xl sm:text-2xl font-bold text-white drop-shadow">Live Document Preview</h3>
                  <div className="ml-3 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1 animate-pulse"></div>
                    LIVE
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPreviewOpen(o => !o)}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                  aria-expanded={isPreviewOpen}
                  aria-controls="live-preview-section"
                >
                  {isPreviewOpen ? (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  ) : (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  )}
                </button>
              </div>
              
              {isPreviewOpen && (
              <div id="live-preview-section" className="bg-gray-100 rounded-lg p-3 sm:p-4">
                <div className="flex justify-center">
                  <div className="w-full max-w-4xl">
                    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                      <div className="p-4 sm:p-6">
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
                         
                         <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-4 text-center">TIMESHEET</h2>
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
                                <p className="text-gray-900">
                                  {formData.notesToInterpreter ? 
                                    (formData.notesToInterpreter.length > 150 ? 
                                      formData.notesToInterpreter.substring(0, 150) + '...' : 
                                      formData.notesToInterpreter
                                    ) : 
                                    '_________________'
                                  }
                                </p>
                                {formData.notesToInterpreter && formData.notesToInterpreter.length > 150 && (
                                  <div className="mt-1">
                                    <p className="text-xs text-red-500 font-medium">
                                      ⚠️ Text truncated to prevent overflow in PDF
                                    </p>
                                    <p className="text-xs text-gray-600">
                                      Original length: {formData.notesToInterpreter.length} characters
                                    </p>
                                  </div>
                                )}
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
                            
                            {/* Declaration Text Preview */}
                            <div className="mb-4">
                              <label className="block text-sm font-medium text-gray-700 mb-1">Declaration Text</label>
                              <div className="declaration-preview">
                                {formData.customDeclaration || 'No declaration text entered'}
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-1 gap-2">
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
                
                <div className="mt-4 text-center pb-24 sm:pb-0">
                  <p className="text-sm text-slate-300 mb-4">
                    This preview updates automatically as you fill out the form above. Use the buttons below to generate the final PDF.
                  </p>
                  <div className="flex flex-col sm:flex-row justify-center gap-3">
                    <button
                      type="button"
                      onClick={async () => await generatePDF()}
                      className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors font-medium"
                    >
                      Download Filled PDF
                    </button>
                    <button
                      type="button"
                      onClick={async () => await generatePDF({ share: true })}
                      className="bg-gray-700 text-white px-6 py-2 rounded-md hover:bg-gray-800 transition-colors font-medium"
                    >
                      Share PDF
                    </button>
                    <button
                      type="button"
                      onClick={async () => await generatePDF({ blank: true })}
                      className="bg-gray-700 text-white px-6 py-2 rounded-md hover:bg-gray-800 transition-colors font-medium"
                    >
                      Download Blank Template
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        try {
                          localStorage.setItem('timesheetFormData', JSON.stringify(formData));
                          alert('Form data saved.');
                        } catch {}
                      }}
                      className="bg-gray-200 text-gray-800 px-6 py-2 rounded-md hover:bg-gray-300 transition-colors font-medium"
                    >
                      Save Form
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFormData(initialFormData);
                        try { localStorage.removeItem('timesheetFormData'); } catch {}
                      }}
                      className="bg-red-600 text-white px-6 py-2 rounded-md hover:bg-red-700 transition-colors font-medium"
                    >
                      Clear Form
                    </button>
                  </div>
                </div>
              </div>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
/** Sticky mobile action bar **/
// Renders at the root to give quick access on small screens
// Note: This is appended after the component due to file structure; JSX is already returned above.
