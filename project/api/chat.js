export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {
    const requestData = req.body || {};

    let userMessage = "";

    if (requestData.message) {
      userMessage = requestData.message;
    } else if (
      requestData.messages &&
      Array.isArray(requestData.messages) &&
      requestData.messages.length > 0
    ) {
      userMessage =
        requestData.messages[requestData.messages.length - 1]?.content || "";
    }

    if (!userMessage) {
      return res.status(400).json({
        error: "No user message provided"
      });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: "Missing GEMINI_API_KEY"
      });
    }

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: userMessage
                }
              ]
            }
          ]
        })
      }
    );

    const data = await geminiResponse.json();

    if (!geminiResponse.ok) {
      return res.status(geminiResponse.status).json({
        error: data?.error?.message || "Gemini API request failed"
      });
    }

    let text = "No response";

    if (
      data.candidates &&
      data.candidates[0] &&
      data.candidates[0].content &&
      data.candidates[0].content.parts &&
      data.candidates[0].content.parts[0] &&
      data.candidates[0].content.parts[0].text
    ) {
      text = data.candidates[0].content.parts[0].text;
    }

    return res.status(200).json({
      content: [
        {
          text
        }
      ]
    });
  } catch (error) {
    return res.status(500).json({
      error: error.message || "Internal server error"
    });
  }
}