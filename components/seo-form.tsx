"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function SeoForm() {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [usage, setUsage] = useState<null | {
    used: number;
    limit: number;
    remaining: number;
  }>(null);

  const router = useRouter();

  useEffect(() => {
    fetch("/api/seo-usage")
      .then(res => res.json())
      .then(setUsage)
      .catch(() => {});
  }, []);

  const handleAnalyze = () => {
    if (usage && usage.remaining <= 0) {
      setError("Daily limit reached (3/day)");
      return;
    }

    if (!url) {
      setError("Please enter a URL");
      return;
    }

    let formattedUrl = url.trim();
    if (
      !formattedUrl.startsWith("http://") &&
      !formattedUrl.startsWith("https://")
    ) {
      formattedUrl = `https://${formattedUrl}`;
    }

    try {
      new URL(formattedUrl);
      router.push(`/results?url=${encodeURIComponent(formattedUrl)}`);
    } catch {
      setError("Please enter a valid URL");
    }
  };

  return (
    <div className="neo-card -rotate-1 bg-white space-y-4">

      {/* ✅ USAGE BAR */}
      {usage && (
        <div className="text-sm font-bold text-gray-700">
          Usage today: {usage.used} / {usage.limit} <br />
          Remaining: {usage.remaining}
        </div>
      )}

      <label htmlFor="url" className="block text-xl font-bold">
        Website URL
      </label>

      <div className="flex flex-col md:flex-row gap-4">
        <input
          id="url"
          type="text"
          placeholder="example.com"
          className="neo-input flex-1 text-lg"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <button
          onClick={handleAnalyze}
          className="neo-button bg-[#FF5757] text-lg uppercase"
        >
          Analyze SEO
        </button>
      </div>

      {error && <p className="text-[#FF5757] font-bold">{error}</p>}
    </div>
  );
}
