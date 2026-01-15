
import { GoogleGenAI, Type } from "@google/genai";
import { RoomConfig, SurfaceType, LightSource } from "../types";

export const optimizeLighting = async (room: RoomConfig, targetLux: number): Promise<LightSource[]> => {
  // Always use a named parameter for the API key and get it from process.env.API_KEY.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `
    部屋の照明配置を最適化してください。
    部屋の寸法: 幅 ${room.width}m, 奥行き ${room.depth}m, 高さ ${room.height}m
    面取り（45度傾斜面）サイズ: ${room.chamfer}m
    目標平均照度: ${targetLux} lux
    
    照明は、天井(CEILING)、壁面(WALL_NORTH/SOUTH/EAST/WEST)、または天井と壁の間の45度傾斜面(SLOPE_NORTH/SOUTH/EAST/WEST)に配置できます。
    
    効率的で均一な照度を得るための照明リストをJSON形式で返してください。
    uとvは各面上の0から1の正規化座標です。
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            surface: { 
              type: Type.STRING, 
              description: `Surface type: ${Object.values(SurfaceType).join(', ')}`
            },
            u: { type: Type.NUMBER },
            v: { type: Type.NUMBER },
            lumens: { type: Type.NUMBER },
            color: { type: Type.STRING }
          },
          required: ["name", "surface", "u", "v", "lumens", "color"]
        }
      }
    }
  });

  try {
    // Access the .text property directly (it's a property, not a method).
    const data = JSON.parse(response.text || '[]');
    return data.map((item: any) => ({
      ...item,
      id: Math.random().toString(36).substr(2, 9)
    }));
  } catch (e) {
    console.error("Failed to parse Gemini response", e);
    return [];
  }
};
