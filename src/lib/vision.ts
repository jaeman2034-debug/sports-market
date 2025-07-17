// src/lib/vision.ts
export async function analyzeImageBase64(base64: string, apiKey: string) {
  const response = await fetch(
    `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requests: [
          {
            image: { content: base64.replace(/^data:image\/[a-z]+;base64,/, "") },
            features: [{ type: "LABEL_DETECTION", maxResults: 3 }],
          },
        ],
      }),
    }
  );
  const data = await response.json();
  // 라벨(상품 카테고리/이름 등) 추출
  return data.responses?.[0]?.labelAnnotations?.map((l: any) => l.description) || [];
}



