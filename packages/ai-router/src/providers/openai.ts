export async function callOpenAI(params: {
  apiKey: string;
  model: string;
  input: string;
  system?: string;
  maxOutputTokens: number;
}) {
  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${params.apiKey}`
    },
    body: JSON.stringify({
      model: params.model,
      input: [
        {
          role: 'system',
          content: params.system ?? ''
        },
        {
          role: 'user',
          content: params.input
        }
      ],
      max_output_tokens: params.maxOutputTokens
    })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OpenAI error: ${text}`);
  }

  const data = await response.json();

  const text = data.output?.[0]?.content?.[0]?.text ?? '';

  return {
    text,
    usage: {
      inputTokens: data.usage?.input_tokens ?? 0,
      outputTokens: data.usage?.output_tokens ?? 0
    }
  };
}
