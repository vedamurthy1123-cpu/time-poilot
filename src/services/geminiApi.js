import { GoogleGenAI } from '@google/genai';

export const STORAGE_KEY = 'timepilot_gemini_api_key';

export function getApiKey() {
  return localStorage.getItem(STORAGE_KEY) || import.meta.env.VITE_GEMINI_API_KEY || '';
}

export function saveApiKey(key) {
  localStorage.setItem(STORAGE_KEY, key.trim());
}

export function clearApiKey() {
  localStorage.removeItem(STORAGE_KEY);
}

function getAI() {
  const key = getApiKey();
  if (!key) return null;
  return new GoogleGenAI({ apiKey: key });
}

// Ensure we handle when the AI doesn't return exactly JSON but adds markdown code block wrappers
function parseJSON(text) {
  try {
    const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleaned);
  } catch (err) {
    throw new Error("Failed to parse AI response as JSON");
  }
}

export async function generateTimetableData(prompt) {
  const ai = getAI();
  if (!ai) throw new Error("API Key not found");

  const systemInstruction = `You are an expert school timetable generator. Extract the following information from the user's prompt and output ONLY valid JSON.
  
Required structure:
{
  "subjects": [ { "name": "Maths", "periods": 5 } ],
  "schoolTiming": { "start": "09:00", "end": "16:00" },
  "workingDays": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
  "breaks": [
    { "name": "Tea Break", "start": "11:00", "end": "11:15" },
    { "name": "Lunch Break", "start": "13:00", "end": "14:00" }
  ],
  "classDuration": 50
}

Heuristics:
1. If the user doesn't specify periods per subject, heuristically assign logical amounts (e.g. core subjects like Maths/Science get 5, minor get 2-3).
2. Time format must be 24-hour HH:MM strings.
3. workingDays should be an array of strings representing days.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
      }
    });

    return parseJSON(response.text);
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error(error.message || "Failed to generate timetable");
  }
}

export async function processAIPromptEdit(prompt, currentState) {
  const ai = getAI();
  if (!ai) throw new Error("API Key not found");

  const systemInstruction = `# Time-Pilot Timetable Editing System Prompt

You are the AI assistant for Time-Pilot, an intelligent timetable generation and management system.
Your role is to assist users with timetable modifications while preserving timetable validity and respecting all scheduling constraints.

## Editing Modes
### 1. Manual Editing (Primary Method)
The application provides manual editing features: Add/Remove Subject, Change Class Duration, Change Break Timings, Drag-and-Drop Classes.
The AI must NEVER replace or disable manual editing functionality.

### 2. AI Editing (Secondary Method)
The AI should help users perform complex modifications through natural language instructions.
Examples: Add one extra Mathematics period this week, Move all laboratory sessions to afternoon slots, Optimize Friday's schedule.

## AI Responsibilities
When a user requests timetable changes:
1. Understand the intent.
2. Convert the request into structured actions.
3. Validate constraints (Classroom availability, Subject hour requirements, Break timings, Duplicate subject allocation conflicts).
4. Detect conflicts. Never silently create conflicts.
5. Suggest alternatives when conflicts exist.
6. Explain changes clearly.

The system does not maintain teacher information. Do not request, assign, or validate teacher-related data.

## Output Format
You MUST output your response purely as a valid JSON object with the following structure:
{
  "requestedChange": "Brief summary of what the user asked for",
  "validationResult": "Explanation of whether it's possible or if there are issues",
  "conflicts": "Details of any conflicts found (or 'None')",
  "suggestedSolution": "Your proposed solution or alternative",
  "action": { ... } // See Supported Actions below
}

Supported Action Objects:
{ "type": "swap", "subject1": "Physics", "subject2": "English" } (Swaps ALL instances of subject1 with subject2)
{ "type": "replace", "day": "Tuesday", "time": "09:20 - 10:15", "subject": "Maths" } (Replaces a specific slot with a new subject. 'time' MUST exactly match an availableTimeSlot)
{ "type": "multiple_replace", "updates": [ { "day": "Monday", "time": "09:20 - 10:15", "subject": "Maths" }, ... ] } (Perform multiple targeted replacements)
{ "type": "redistribute" } (Completely reshuffles the timetable)
{ "type": "update_config", "schoolTiming": {"start": "09:00", "end": "16:00"}, "breaks": [{"name": "Lunch", "start": "12:00", "end": "13:00"}], "classDuration": 50 }

If the user wants to change timings or breaks, use "update_config".
Output purely the JSON block, no markdown formatting outside of the JSON.`;

  try {
    const stateSummary = {
      subjects: currentState.subjects,
      schoolTiming: currentState.schoolTiming,
      breaks: currentState.breaks,
      classDuration: currentState.classDuration,
      workingDays: currentState.workingDays,
      availableTimeSlots: currentState.schedule?.[0]?.slots.filter(s => s.type === 'period').map(s => `${s.start} - ${s.end}`) || []
    };
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Current timetable config: ${JSON.stringify(stateSummary)}. User Instruction: ${prompt}`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
      }
    });
    
    return parseJSON(response.text);
  } catch (error) {
    console.error("Gemini API Edit Error:", error);
    throw new Error("Failed to interpret edit command.");
  }
}

export async function generateTimetableFromPDF(base64PDF) {
  const ai = getAI();
  if (!ai) throw new Error("API Key not found");

  const systemInstruction = `You are an expert school timetable extractor. Analyze the uploaded PDF timetable and extract ALL schedule data with 100% accuracy.

You MUST output ONLY valid JSON with this exact structure:
{
  "schoolName": "Name of school if visible, else empty string",
  "subjects": [
    { "name": "Mathematics", "periods": 5 }
  ],
  "schoolTiming": { "start": "09:00", "end": "16:00" },
  "workingDays": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
  "breaks": [
    { "name": "Tea Break", "start": "10:45", "end": "11:00" },
    { "name": "Lunch Break", "start": "13:00", "end": "14:00" }
  ],
  "classDuration": 45,
  "schedule": [
    {
      "day": "Monday",
      "slots": [
        { "type": "period", "start": "09:00", "end": "09:45", "subject": { "name": "Mathematics" } },
        { "type": "period", "start": "09:45", "end": "10:30", "subject": { "name": "Physics" } },
        { "type": "break", "start": "10:30", "end": "10:45", "name": "Tea Break", "subject": null },
        { "type": "period", "start": "10:45", "end": "11:30", "subject": { "name": "Chemistry" } }
      ]
    }
  ]
}

STRICT RULES — follow every rule exactly:
1. ALL times must be 24-hour "HH:MM" strings (e.g. "09:00", "13:30").
2. "subjects" — list every unique subject found in the timetable. "periods" = total count of that subject across ALL days.
3. "schedule" — include ALL working days and ALL time slots in chronological order per day.
4. For BREAK slots: "type" must be "break", include "name" (e.g. "Lunch Break"), set "subject" to null. The start/end must exactly match the entry in "breaks".
5. For PERIOD slots: "type" must be "period", "subject" must be {"name": "SubjectName"}. For empty/free periods, use "subject": null.
6. "classDuration" = duration in minutes of ONE period (e.g. 45 or 50).
7. "schoolTiming" start = the start time of the very first period. end = the end time of the very last period.
8. Every day in "workingDays" MUST have a corresponding entry in "schedule" with the exact same day name.
9. The number of slots per day must be IDENTICAL across all days (same time structure).
10. TIMETABLE ORIENTATION: If days are rows and periods are columns (horizontal), map each row to its day. If days are columns and periods are rows (vertical), map each column to its day.
11. Do NOT skip any slot, do NOT add extra text outside the JSON.
12. If a subject name contains abbreviations (e.g. "Maths", "Phy", "Che"), use the full readable name.
13. Count "periods" in "subjects" only for actual subject periods — NOT for free periods or breaks.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          inlineData: {
            mimeType: 'application/pdf',
            data: base64PDF
          }
        },
        {
          text: 'Extract every detail from this timetable PDF. Carefully map each cell to its correct day and time slot. Check the timetable orientation (horizontal or vertical). Output ONLY valid JSON, no markdown.'
        }
      ],
      config: {
        systemInstruction,
        responseMimeType: "application/json",
      }
    });

    return parseJSON(response.text);
  } catch (error) {
    console.error("Gemini PDF API Error:", error);
    throw new Error(error.message || "Failed to extract timetable from PDF");
  }
}

