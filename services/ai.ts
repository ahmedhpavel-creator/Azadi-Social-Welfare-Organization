
import { ORGANIZATION_INFO } from "../constants";
import { storage } from "./storage";
import { Event } from "../types";

// Lazy initialization holder
let aiClient: any | null = null;

const getApiKey = () => {
  try {
    // In Vite production build, process.env.API_KEY is replaced with the actual string value.
    // We access it directly, bypassing strict 'typeof process' checks that fail in browser.
    // @ts-ignore
    return process.env.API_KEY || "";
  } catch (e) {
    console.warn("Unable to access API_KEY");
    return "";
  }
};

const getAiClient = async () => {
  if (!aiClient) {
    const apiKey = getApiKey();
    // Dynamic import to prevent top-level process access issues in browser
    const { GoogleGenAI } = await import("@google/genai");
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
};

/**
 * Generates a response for the Chatbot using Gemini 2.5 Flash.
 * It injects organization context into the system instruction and maintains chat history.
 */
export const generateChatResponse = async (userMessage: string, history: {id?: string, role: string, text: string}[]) => {
  try {
    // 1. Gather Context (Async now)
    const settings = await storage.getAppSettings(); 
    const contactPhone = settings.contactPhone;
    
    const leaders = await storage.getLeaders();
    const leaderNames = leaders.map(l => `${l.name?.en || 'Unknown'} (${l.designation?.en || ''})`).join(', ');
    
    const events = await storage.getEvents();
    const eventList = events.slice(0, 3).map(e => `${e.title?.en || 'Event'} on ${e.date}`).join('; ');
    
    const contactInfoFull = `Phone: ${contactPhone}, Email: ${ORGANIZATION_INFO.contact.email}, Address: ${ORGANIZATION_INFO.address}`;
    const donationInfo = `We accept donations via Bkash, Nagad, and Cash. The official number is ${contactPhone}. We can also generate receipts immediately.`;

    // 2. Construct System Instruction
    const systemInstruction = `
      You are a helpful, warm, and polite AI assistant for the "${ORGANIZATION_INFO.name.en}" (also known as ${ORGANIZATION_INFO.name.bn}).
      
      Your goal is to answer visitor questions accurately based on the following context:
      - **Mission:** ${ORGANIZATION_INFO.slogan.en}
      - **Established:** ${ORGANIZATION_INFO.estDate.en}
      - **Contact:** ${contactInfoFull}
      - **Key Leaders:** ${leaderNames}
      - **Upcoming/Recent Events:** ${eventList || "No recent events listed."}
      - **Donation:** ${donationInfo}
      
      Guidelines:
      - **Islamic Etiquette:** You must strictly follow Islamic etiquette in your conversation.
      - **Greeting:** Always start or respond with "Assalamu Alaikum" (আসসালামু আলাইকুম) or "Walaikum Assalam" (ওয়ালাইকুম আসসালাম) as appropriate. Never use "Namaskar" or secular greetings like "Hi/Hello" without the Islamic greeting first.
      - **Tone:** Be very polite, humble, and respectful (Marjoniya/Adab).
      - **Terminology:** Use Islamic phrases naturally where appropriate, such as:
        - "InshaAllah" (when referring to future events).
        - "MashAllah" (when praising or acknowledging good things).
        - "JazakAllah Khair" (instead of just thanks).
        - "Alhamdulillah" (when acknowledging success or well-being).
      - If the user asks in Bengali, reply in Bengali. If in English, reply in English.
      - If you don't know the answer, politely ask them to contact the organization directly.
      - Emphasize that donations are for social welfare and helping the poor.
    `;

    // 3. Prepare Contents with History
    // Filter out initial welcome message if it was generated client-side to ensure proper turn structure
    // And ensure 'user' starts.
    const sanitizedHistory = history.filter(msg => msg.id !== 'welcome');
    
    // Convert to Gemini format
    const contents: any[] = sanitizedHistory.map(msg => ({
      role: msg.role,
      parts: [{ text: msg.text }]
    }));

    // Ensure it starts with user if history provided
    // (Usually handled by UI logic, but here we just append the new message)
    
    // Add the current message
    contents.push({
      role: 'user',
      parts: [{ text: userMessage }]
    });
    
    // Limit context window to last 20 turns to avoid token limits
    const limitedContents = contents.slice(-20);

    // 4. Call API using lazy client
    const client = await getAiClient();
    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: limitedContents,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
      },
    });

    return response.text || "I'm sorry, I couldn't generate a response at the moment.";
  } catch (error) {
    console.error("AI Service Error:", error);
    return "I am currently experiencing some connection issues. Please try again later.";
  }
};

/**
 * Generates a social media summary for an event.
 */
export const generateEventSummary = async (event: Event) => {
  try {
    const prompt = `
      You are a social media manager for the "Azadi Social Welfare Organization".
      Create a short, engaging summary for the following event, suitable for a social media post or a news snippet.
      
      Details:
      Title: ${event.title?.en} (${event.title?.bn})
      Date: ${event.date}
      Location: ${event.location}
      Description: ${event.description?.en}
      
      Please provide two versions:
      1. English Summary
      2. Bengali Summary (বাংলা সারসংক্ষেপ)
      
      Keep it professional yet inviting. Include appropriate emojis. Use Islamic greetings where appropriate.
    `;

    const client = await getAiClient();
    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "Could not generate summary.";
  } catch (error) {
    console.error("AI Summary Error:", error);
    throw new Error("Failed to connect to AI service.");
  }
};
