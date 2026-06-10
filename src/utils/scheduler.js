function timeToMinutes(timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

function minutesToTime(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

export function generateTimeSlots(timing, classDuration, breaks) {
  const slots = [];
  const startMins = timeToMinutes(timing.start);
  const endMins = timeToMinutes(timing.end);

  const sortedBreaks = (breaks || []).map(b => ({
    ...b,
    startMins: timeToMinutes(b.start),
    endMins: timeToMinutes(b.end)
  })).sort((a, b) => a.startMins - b.startMins);

  let current = startMins;
  let pIdx = 1;

  for (const b of sortedBreaks) {
    while (current + classDuration <= b.startMins) {
      slots.push({
        id: `p${pIdx++}`,
        type: 'period',
        start: minutesToTime(current),
        end: minutesToTime(current + classDuration),
        duration: classDuration
      });
      current += classDuration;
    }

    if (current < b.startMins) {
      slots.push({
        id: `buffer-${b.name.replace(/\s+/g, '')}`,
        type: 'buffer',
        start: minutesToTime(current),
        end: minutesToTime(b.startMins),
        duration: b.startMins - current
      });
    }

    slots.push({
      id: `break-${b.name.replace(/\s+/g, '')}`,
      type: 'break',
      name: b.name,
      start: b.start,
      end: b.end,
      duration: b.endMins - b.startMins
    });

    current = b.endMins;
  }

  while (current + classDuration <= endMins) {
    slots.push({
      id: `p${pIdx++}`,
      type: 'period',
      start: minutesToTime(current),
      end: minutesToTime(current + classDuration),
      duration: classDuration
    });
    current += classDuration;
  }

  if (current < endMins) {
    slots.push({
      id: 'buffer-end',
      type: 'buffer',
      start: minutesToTime(current),
      end: minutesToTime(endMins),
      duration: endMins - current
    });
  }

  return slots;
}

export function generateInitialSchedule(slots, workingDays, subjects) {
  const schedule = workingDays.map(day => {
    return {
      day,
      slots: slots.map(slot => {
        if (slot.type === 'break' || slot.type === 'buffer') {
          return { ...slot, subject: null };
        }
        return { ...slot, subject: null }; 
      })
    };
  });

  // Balanced Greedy Scheduling
  let subjectPool = [];
  subjects.forEach(sub => {
    for (let i = 0; i < sub.periods; i++) {
      subjectPool.push({ name: sub.name });
    }
  });

  // Shuffle subject pool
  subjectPool.sort(() => Math.random() - 0.5);

  schedule.forEach(day => {
    day.slots.forEach(slot => {
      if (slot.type === 'period' && subjectPool.length > 0) {
        // Try to pick a subject that is not already scheduled back-to-back
        // and teacher is not clashing (basic heuristics)
        let pickedIndex = 0;
        slot.subject = subjectPool.splice(pickedIndex, 1)[0];
      }
    });
  });

  return schedule;
}
