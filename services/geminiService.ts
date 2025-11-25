import { GoogleGenAI, Type } from "@google/genai";
import { Book, PredictionResult, ImportResult } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getBookPrediction = async (
  history: Book[],
  targetBookTitle: string
): Promise<PredictionResult> => {
  
  // Filter history to only include books the user has actually rated (> 0)
  // This prevents 'to-read' books (rating 0) from skewing the taste profile.
  const ratedHistory = history.filter(b => b.rating > 0);
  
  // Construct the prompt context from user history
  const historyText = ratedHistory
    .map((b) => `- "${b.title}" by ${b.author} (Rated: ${b.rating}/5)`)
    .join("\n");

  const prompt = `
    Based on the user's reading history and ratings below, predict how much they will like the book: "${targetBookTitle}".
    
    User's Reading History (${ratedHistory.length} books rated):
    ${historyText}
    
    Analyze the genres, themes, writing styles, and authors they rated highly versus poorly.
    If the history is empty, provide a general prediction based on the book's general popularity but mention the lack of data.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are an expert literary taste analyst. You provide honest, personalized predictions based on reading history.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            matchPercentage: {
              type: Type.INTEGER,
              description: "A number between 0 and 100 representing the likelihood the user will enjoy the book.",
            },
            likelyRating: {
              type: Type.NUMBER,
              description: "Predicted rating out of 5 (e.g., 4.2).",
            },
            reasoning: {
              type: Type.STRING,
              description: "A concise, friendly explanation of why this match percentage was chosen, referencing their history if applicable.",
            },
            genre: {
              type: Type.STRING,
              description: "The primary genre of the target book.",
            },
            similarBooksFromHistory: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "List of 1-3 book titles from their history that are similar to this one. Empty if none.",
            },
          },
          required: ["matchPercentage", "reasoning", "likelyRating", "genre", "similarBooksFromHistory"],
        },
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    return JSON.parse(text) as PredictionResult;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Failed to generate prediction. Please try again.");
  }
};

export const importBooksFromGoodreads = async (input: string, isUrl: boolean): Promise<ImportResult> => {
  try {
    if (isUrl) {
      // Attempt to extract a Goodreads User ID to help the search
      const idMatch = input.match(/(\d+)/);
      const userId = idMatch ? idMatch[1] : "";
      
      const searchPrompt = userId 
        ? `Search for "Goodreads user ${userId} books read" or "Goodreads ${userId} library". I need to find the list of books this user has read.`
        : `Find the Goodreads profile and read books for the URL: "${input}".`;

      // Use Google Search to find the profile and books
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `
          ${searchPrompt}
          
          Browse the results to identify specific books the user has read and rated.
          
          Return a JSON array of objects representing the books found.
          Each object must have:
          - "title": string
          - "author": string
          - "rating": number (1-5). If you cannot find an exact user rating, estimate based on shelves (e.g. 'favorites'=5) or return 0.
          
          Output ONLY the JSON array inside a markdown block like \`\`\`json ... \`\`\`.
        `,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      // Extract JSON from the text response (which might contain grounding info)
      const text = response.text || "";
      const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/\[\s*\{[\s\S]*\}\s*\]/);
      
      let books: Book[] = [];
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[1] || jsonMatch[0]);
          books = parsed.map((b: any) => ({
            id: Date.now().toString() + Math.random().toString().slice(2, 6),
            title: b.title,
            author: b.author,
            rating: b.rating || 0,
            dateAdded: Date.now()
          }));
        } catch (e) {
          console.error("Failed to parse JSON from search result", e);
        }
      }

      // Extract sources
      const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks
        ?.map((c: any) => c.web?.uri)
        .filter((uri: string) => uri);

      return { books, sources };

    } else {
      // Use Text Analysis (Robust for pasted content)
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `
          The following text is copied from a Goodreads library page. 
          Extract all books listed.
          
          Text content:
          ${input.substring(0, 30000)} 
          
          Return a JSON object with a "books" array.
        `,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              books: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    author: { type: Type.STRING },
                    rating: { type: Type.NUMBER, description: "The user's rating (stars) if found, else 0" }
                  }
                }
              }
            }
          }
        }
      });

      const text = response.text;
      if (!text) throw new Error("No response");
      
      const parsed = JSON.parse(text);
      const books = parsed.books.map((b: any) => ({
        id: Date.now().toString() + Math.random().toString().slice(2, 6),
        title: b.title,
        author: b.author,
        rating: b.rating,
        dateAdded: Date.now()
      }));

      return { books };
    }
  } catch (error) {
    console.error("Import Error:", error);
    throw new Error("Failed to import books. Please try the 'Paste Text' method for better results.");
  }
};