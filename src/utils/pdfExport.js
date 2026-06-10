import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export function exportToPDF(state) {
  try {
    const doc = new jsPDF({ orientation: 'landscape' });

    // Title entered by user
    const title = state.schoolName || 'Weekly Flight Deck';
    
    // Set font size to larger bold and draw left-aligned
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(title, 14, 20); // X=14 left margins

    if (!state.schedule || state.schedule.length === 0) {
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text('No timetable data to export.', 14, 40);
      triggerDownload(doc, 'timetable.pdf');
      return;
    }

    const firstDaySlots = state.schedule[0].slots;
    const dayCount = state.schedule.length;

    // Filter out buffer slots entirely so no "Free" columns appear in the table
    const activeSlots = firstDaySlots.filter(slot => slot.type !== 'buffer');

    // Header row: "Day" + one cell per active slot
    const head = [
      [
        'Day',
        ...activeSlots.map((slot) => {
          if (slot.type === 'break') return `${slot.name || 'Break'}\n${slot.start}–${slot.end}`;
          return `${slot.start}\n–${slot.end}`;
        }),
      ],
    ];

    // Body: one row per day (with Break cells vertically merged via rowSpan)
    const body = state.schedule.map((daySchedule, dayIndex) => {
      const row = [daySchedule.day];
      daySchedule.slots.forEach((slot) => {
        // Skip buffer/free slots completely
        if (slot.type === 'buffer') return;

        if (slot.type === 'break') {
          if (dayIndex === 0) {
            row.push({
              content: slot.name || 'Break',
              rowSpan: dayCount,
              styles: { valign: 'middle', halign: 'center', fillColor: [255, 255, 255], textColor: [0, 0, 0] }
            });
          }
          // For dayIndex > 0, we skip pushing to align with rowSpan columns
          return;
        }

        row.push(slot.subject?.name || '');
      });
      return row;
    });

    // Generate table with clean professional black & white theme
    autoTable(doc, {
      startY: 28, // Start slightly higher since title is left-aligned
      head,
      body,
      theme: 'grid',
      styles: {
        lineColor: [0, 0, 0],
        lineWidth: 0.5,
        textColor: [0, 0, 0],
        fillColor: [255, 255, 255],
        fontSize: 9,
        cellPadding: 4,
        valign: 'middle',
        halign: 'center',
      },
      headStyles: {
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        lineWidth: 0.5,
        lineColor: [0, 0, 0],
      },
      bodyStyles: {
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
        lineWidth: 0.5,
        lineColor: [0, 0, 0],
      },
      columnStyles: {
        0: { fontStyle: 'bold' },
      },
      alternateRowStyles: {
        fillColor: [255, 255, 255],
      },
    });

    // Get the vertical end of the table
    const finalY = doc.lastAutoTable.finalY;

    // Draw the Time-Pilot tag just below the table on the right side
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    doc.text(
      'Time-Pilot',
      doc.internal.pageSize.getWidth() - 14,
      finalY + 8,
      { align: 'right' }
    );

    triggerDownload(doc, 'timetable.pdf');
  } catch (err) {
    console.error('PDF Export Error:', err);
    alert('Failed to export PDF: ' + err.message);
  }
}

function triggerDownload(doc, filename) {
  try {
    doc.save(filename);
  } catch {
    const blob = doc.output('blob');
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 200);
  }
}
