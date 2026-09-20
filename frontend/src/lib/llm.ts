const GROQ_API_KEY = process.env.GROQ_API_KEY || "";
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.3-70b-versatile";

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export async function chatWithLLM(
  messages: ChatMessage[],
  systemPrompt: string
): Promise<string> {
  const allMessages: ChatMessage[] = [
    { role: "system", content: systemPrompt },
    ...messages,
  ];

  const response = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: allMessages,
      temperature: 0.7,
      max_tokens: 1024,
      top_p: 0.9,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Groq API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return (
    data.choices?.[0]?.message?.content ||
    "I apologize, I could not generate a response."
  );
}

export function toChatMessages(
  messages: { role: "user" | "assistant"; content: string }[]
): ChatMessage[] {
  return messages.map((msg) => ({
    role: msg.role,
    content: msg.content,
  }));
}
