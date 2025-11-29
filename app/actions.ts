"use server";

import { redirect } from "next/navigation";
import { GoogleGenAI } from "@google/genai"; 


const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export async function submitUrl(data: any, formData: FormData) {
  const url = formData.get("url") as string;

  if (!url) {
    return { error: "Please enter a URL" };
  }

  let formattedUrl = url;
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    formattedUrl = `https://${url}`;
  }

  try {
    new URL(formattedUrl);

    console.log(formattedUrl);
    redirect(`/results?url=${encodeURIComponent(formattedUrl)}`);
  } catch (err) {
    console.log(err);
    return { error: "Please enter a valid URL" };
  }
}

export async function analyzeSeo(url: string) {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "SEO-Inspector-Bot/1.0",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch website: ${response.status}`);
    }

    const html = await response.text();

    const title = extractTag(html, "title");
    const metaDescription = extractMetaTag(html, "description");
    const h1Tags = extractAllTags(html, "h1");
    const h2Tags = extractAllTags(html, "h2");
    const imgTags = extractAllImgTags(html);
    const seoData = {
      url,
      title,
      metaDescription,
      h1Count: h1Tags.length,
      h1Tags: h1Tags.slice(0, 5),
      h2Count: h2Tags.length,
      h2Tags: h2Tags.slice(0, 5),
      imgCount: imgTags.length,
      imagesWithoutAlt: imgTags.filter((img) => !img.alt).length,
      wordCount: countWords(stripHtml(html)),
      hasCanonical: html.includes('rel="canonical"'),
      hasSitemap: html.toLowerCase().includes("sitemap"),
      hasRobotsTxt: html.toLowerCase().includes("robots.txt"),
      hasSchema:
        html.includes("application/ld+json") || html.includes("itemtype="),
      hasFavicon:
        html.includes('rel="icon"') || html.includes('rel="shortcut icon"'),
      hasViewport: html.includes('name="viewport"'),
      hasHttps: url.startsWith("https://"),
    };


    const prompt = `
You are an SEO expert assistant.

Analyze this website's SEO data and provide an assessment with scores, issues, and recommendations:

${JSON.stringify(seoData, null, 2)}

Return ONLY a JSON object with the following structure:

{
  "metaTagsScore": number (0-100),
  "contentScore": number (0-100),
  "performanceScore": number (0-100),
  "mobileScore": number (0-100),
  "issues": [
    {
      "title": string,
      "description": string,
      "severity": "high" | "medium" | "low"
    }
  ],
  "recommendations": [
    {
      "title": string,
      "description": string,
      "impact": "high" | "medium" | "low"
    }
  ],
  "metaTagsDetails": [
    {
      "name": string,
      "value": string,
      "status": "good" | "warning" | "bad"
    }
  ],
  "contentDetails": [
    {
      "name": string,
      "value": string,
      "status": "good" | "warning" | "bad"
    }
  ],
  "technicalDetails": [
    {
      "name": string,
      "value": string,
      "status": "good" | "warning" | "bad"
    }
  ]
}

Provide detailed, actionable recommendations.
`;

    const geminiResponse = await ai.models.generateContent({
      model: "gemini-1.5-flash-001",
      // KOREKSI 1: Gunakan format standar 'parts' agar tidak error
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }] 
        }
      ],
      // Opsional: Paksa output JSON (fitur baru 1.5 Flash)
      config: {
        responseMimeType: "application/json",
      }
    });

    let content = (geminiResponse.text ?? "").trim();

    if (content.startsWith("```json")) {
      content = content.slice(7, -3).trim();
    }
    console.log(content);
    const analysisResult = JSON.parse(content);

    return analysisResult;
  } catch (error) {
    console.error("Error analyzing SEO:", error);
    return {
      metaTagsScore: 0,
      contentScore: 0,
      performanceScore: 0,
      mobileScore: 0,
      issues: [
        {
          title: "Error analyzing website",
          description: `We encountered an error while analyzing this website: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
          severity: "high",
        },
      ],
      recommendations: [
        {
          title: "Check website accessibility",
          description:
            "Make sure the website is publicly accessible and not blocking our crawler.",
          impact: "high",
        },
      ],
      metaTagsDetails: [],
      contentDetails: [],
      technicalDetails: [],
    };
  }
}

function extractTag(html: string, tag: string): string {
  const regex = new RegExp(`<${tag}[^>]*>(.*?)<\/${tag}>`, "i");
  const match = html.match(regex);
  return match ? match[1].trim() : "";
}

function extractMetaTag(html: string, name: string): string {
  const regex = new RegExp(
    `<meta[^>]*name=["']${name}["'][^>]*content=["']([^"']*)["'][^>]*>|<meta[^>]*content=["']([^"']*)["'][^>]*name=["']${name}["'][^>]*>`,
    "i"
  );
  const match = html.match(regex);
  return match ? (match[1] || match[2] || "").trim() : "";
}

function extractAllTags(html: string, tag: string): string[] {
  const regex = new RegExp(`<${tag}[^>]*>(.*?)<\/${tag}>`, "gi");
  const matches = html.matchAll(regex);
  const results: string[] = [];

  for (const match of matches) {
    if (match[1]) {
      results.push(match[1].trim());
    }
  }

  return results;
}

function extractAllImgTags(html: string): { src: string; alt: string }[] {
  const regex =
    /<img[^>]*src=["']([^"']*)["'][^>]*alt=["']([^"']*)["'][^>]*>|<img[^>]*alt=["']([^"']*)["'][^>]*src=["']([^"']*)["'][^>]*>/gi;
  const matches = html.matchAll(regex);
  const results: { src: string; alt: string }[] = [];

  for (const match of matches) {
    if (match[1]) {
      results.push({
        src: match[1],
        alt: match[2] || "",
      });
    } else if (match[4]) {
      results.push({
        src: match[4],
        alt: match[3] || "",
      });
    }
  }

  return results;
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function countWords(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}
