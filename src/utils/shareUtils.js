import LZString from 'lz-string';

export function encodeTimetable(state) {
  const payload = {
    subjects: state.subjects,
    schoolTiming: state.schoolTiming,
    workingDays: state.workingDays,
    breaks: state.breaks,
    classDuration: state.classDuration,
    schedule: state.schedule,
    schoolName: state.schoolName,
    v: 1
  };
  
  const jsonString = JSON.stringify(payload);
  return LZString.compressToEncodedURIComponent(jsonString);
}

export function decodeTimetable(encodedStr) {
  try {
    const jsonString = LZString.decompressFromEncodedURIComponent(encodedStr);
    if (!jsonString) throw new Error("Decompression failed");
    
    const data = JSON.parse(jsonString);
    if (data.v !== 1) {
      console.warn("Version mismatch: Expected version 1, got", data.v);
      return { success: true, data, warning: "This timetable was created with an older version of Time-Pilot. Some features may not work as expected." };
    }
    
    return { success: true, data };
  } catch (error) {
    console.error("Decoding error:", error);
    return { success: false, error: "This link is invalid or from an incompatible version. Please ask the sender for a new link." };
  }
}
