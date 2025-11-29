"use client";

import { useEffect, useState } from "react";

export function SeoUsage() {
  const [data, setData] = useState<null | {
    used: number;
    limit: number;
    remaining: number;
  }>(null);

  useEffect(() => {
    fetch("/api/seo-usage")
      .then(res => res.json())
      .then(setData)
      .catch(() => {});
  }, []);

  if (!data) return null;

  return (
    <div className="mt-6 bg-white neo-card text-center">
      <p className="font-bold text-gray-700">
        Usage today: {data.used} / {data.limit}
      </p>
      <p className="text-sm">
        Remaining today: <b>{data.remaining}</b>
      </p>
    </div>
  );
}
