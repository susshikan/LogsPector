import { Suspense } from "react";
import { SeoResults } from "@/components/seo-results";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

import { headers } from "next/headers";
import { checkSeoLimit } from "@/lib/seoRateLimit";

type Props = {
  searchParams: Promise<{ url?: string }>;
};

export default async function ResultsPage({ searchParams }: Props) {
  const params = await searchParams;
  const url = params.url || "";
  const h = headers();
  const ip =
    (await h).get("x-forwarded-for")?.split(",")[0] ||
    (await h).get("x-real-ip") ||
    "unknown";

  const rate = await checkSeoLimit(ip);

  if (!rate.allowed) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#FFDE59]">
        <div className="neo-card bg-white p-8 text-center">
          <p className="text-xl font-bold text-[#FF5757]">
            Daily limit reached (3 per day).
          </p>
          <p className="mt-4">Please try again tomorrow.</p>
          <Link href="/">
            <button className="neo-button mt-6">Go Back</button>
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-4 md:p-8 bg-[#FFDE59]">
      <div className="w-full max-w-5xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <Link href="/">
            <button className="neo-button bg-white text-black">
              <ArrowLeft className="h-6 w-6" />
            </button>
          </Link>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight uppercase">
            SEO Results
          </h1>
        </div>

        {url ? (
          <Suspense fallback={<LoadingResults />}>
            <SeoResults url={url} />
          </Suspense>
        ) : (
          <div className="neo-card bg-white text-center p-8 rotate-1">
            <p className="text-xl font-bold mb-4">
              No URL provided. Please go back and enter a URL to analyze.
            </p>
            <Link href="/">
              <button className="neo-button bg-[#FF5757]">Go Back</button>
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}

function LoadingResults() {
  return (
    <div className="neo-card bg-white text-center p-12 -rotate-1 space-y-6">
      <Loader2 className="h-16 w-16 animate-spin mx-auto text-[#FF5757]" />
      <p className="text-2xl font-bold">Analyzing website SEO...</p>
      <p className="text-lg font-medium max-w-md mx-auto">
        We're crawling the website, analyzing its content, and generating
        recommendations. This may take a moment.
      </p>
    </div>
  );
}
