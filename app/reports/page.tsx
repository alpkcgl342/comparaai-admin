"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AI_SERVICE_URL,
  getEntityContext,
  getRecentArticlesForReport,
  getReports,
  getTrending,
  saveReport,
} from "@/lib/api";

type TrendingEntity = {
  entityName: string;
  entityType: string;
  mentionCount: number;
  weightedScore: number;
};

type SavedReport = {
  id: string;
  type: string;
  title?: string | null;
  content: any;
  createdAt: string;
};

const ENTITY_TYPE_LABELS: Record<string, string> = {
  company: "Şirket",
  product: "Ürün",
  technology: "Teknoloji",
};

const REPORT_TYPE_LABELS: Record<string, string> = {
  company_analysis: "Şirket Analizi",
  daily_best: "Günlük Rapor",
  weekly: "Haftalık Rapor",
  trend: "Teknoloji Etki Analizi",
};

export default function ReportsPage() {
  const router = useRouter();

  const [trending, setTrending] = useState<TrendingEntity[]>([]);
  const [reports, setReports] = useState<SavedReport[]>([]);
  const [loadingTrending, setLoadingTrending] = useState(true);

  const [companyName, setCompanyName] = useState("");
  const [analyzingCompany, setAnalyzingCompany] = useState(false);

  const [techName, setTechName] = useState("");
  const [analyzingTech, setAnalyzingTech] = useState(false);

  const [generatingDaily, setGeneratingDaily] = useState(false);
  const [generatingWeekly, setGeneratingWeekly] = useState(false);

  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    loadTrending();
    loadReports();
  }, []);

  function loadTrending() {
    setLoadingTrending(true);
    getTrending(30, 15)
      .then(setTrending)
      .catch((err) => console.error("Trendler alınamadı:", err))
      .finally(() => setLoadingTrending(false));
  }

  function loadReports() {
    getReports()
      .then(setReports)
      .catch((err) => console.error("Raporlar alınamadı:", err));
  }

  async function handleAnalyzeCompany(name: string) {
    if (!name.trim()) return;

    try {
      setError("");
      setAnalyzingCompany(true);

      const { articles, products } = await getEntityContext(name.trim());

      const res = await fetch(`${AI_SERVICE_URL}/analyze-company`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company_name: name.trim(),
          articles: articles.map((a: any) => ({
            title: a.title,
            summary: a.summary,
            aiImportance: a.aiImportance,
          })),
          products: products.map((p: any) => ({ name: p.name, specs: p.specs })),
        }),
      });

      if (!res.ok) throw new Error("Analiz başarısız.");
      const data = await res.json();

      await saveReport({
        type: "company_analysis",
        title: name.trim(),
        content: { analysis: data.analysis },
      });

      loadReports();
    } catch (err) {
      console.error(err);
      setError(
        "Şirket analizi yapılamadı. AI servisinin çalıştığından emin olun.",
      );
    } finally {
      setAnalyzingCompany(false);
    }
  }

  async function handleTechImpact(name: string) {
    if (!name.trim()) return;

    try {
      setError("");
      setAnalyzingTech(true);

      const { articles } = await getEntityContext(name.trim());

      const res = await fetch(`${AI_SERVICE_URL}/technology-impact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          technology_name: name.trim(),
          articles: articles.map((a: any) => ({
            title: a.title,
            summary: a.summary,
            aiImportance: a.aiImportance,
          })),
        }),
      });

      if (!res.ok) throw new Error("Analiz başarısız.");
      const data = await res.json();

      await saveReport({
        type: "trend",
        title: name.trim(),
        content: { analysis: data.analysis },
      });

      loadReports();
    } catch (err) {
      console.error(err);
      setError(
        "Etki analizi yapılamadı. AI servisinin çalıştığından emin olun.",
      );
    } finally {
      setAnalyzingTech(false);
    }
  }

  async function handleGenerateReport(reportType: "daily" | "weekly") {
    const setLoading = reportType === "daily" ? setGeneratingDaily : setGeneratingWeekly;
    const days = reportType === "daily" ? 1 : 7;

    try {
      setError("");
      setLoading(true);

      const [articles, trendingForPeriod] = await Promise.all([
        getRecentArticlesForReport(days),
        getTrending(days, 10),
      ]);

      const res = await fetch(`${AI_SERVICE_URL}/generate-report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          report_type: reportType,
          articles: articles.map((a: any) => ({
            title: a.title,
            summary: a.summary,
            aiImportance: a.aiImportance,
          })),
          trending_entities: trendingForPeriod.map((t: TrendingEntity) => ({
            entity_name: t.entityName,
            entity_type: t.entityType,
            mention_count: t.mentionCount,
          })),
        }),
      });

      if (!res.ok) throw new Error("Rapor oluşturulamadı.");
      const data = await res.json();

      const periodEnd = new Date();
      const periodStart = new Date();
      periodStart.setDate(periodStart.getDate() - days);

      await saveReport({
        type: reportType === "daily" ? "daily_best" : "weekly",
        title: data.title,
        content: {
          highlights: data.highlights,
          trend_commentary: data.trend_commentary,
          social_summary: data.social_summary,
        },
        periodStart: periodStart.toISOString(),
        periodEnd: periodEnd.toISOString(),
      });

      loadReports();
    } catch (err) {
      console.error(err);
      setError(
        "Rapor oluşturulamadı. AI servisinin çalıştığından emin olun.",
      );
    } finally {
      setLoading(false);
    }
  }

  function copySocialSummary(text: string) {
    navigator.clipboard
      .writeText(text)
      .then(() => alert("Kopyalandı!"))
      .catch(() => alert("Kopyalanamadı."));
  }

  return (
    <main className="min-h-screen bg-[#050810] text-white p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Raporlar</h1>
            <p className="text-slate-400 mt-2">
              Trend tespiti, şirket/teknoloji analizi ve günlük/haftalık raporlar.
            </p>
          </div>
          <button
            type="button"
            onClick={() => router.push("/")}
            className="border border-slate-600 px-4 py-2 rounded-lg hover:bg-slate-800"
          >
            ← Dashboard
          </button>
        </div>

        {error && (
          <div className="bg-red-950/50 border border-red-800 text-red-300 rounded-lg px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {/* Trend Teknoloji Tespiti — saf SQL, AI çağrısı yok */}
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Trend Konular (son 30 gün)</h2>
            <button
              type="button"
              onClick={loadTrending}
              className="text-xs text-slate-400 hover:text-white"
            >
              Yenile
            </button>
          </div>

          {loadingTrending ? (
            <p className="text-sm text-slate-500">Yükleniyor...</p>
          ) : trending.length === 0 ? (
            <p className="text-sm text-slate-500">
              Henüz yeterli haber/varlık verisi yok.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {trending.map((t, i) => (
                <div
                  key={i}
                  className="inline-flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs"
                >
                  <span className="text-slate-500">
                    {ENTITY_TYPE_LABELS[t.entityType] ?? t.entityType}:
                  </span>
                  <span className="font-medium">{t.entityName}</span>
                  <span className="text-slate-600">
                    ({t.mentionCount} haber)
                  </span>
                  {t.entityType === "technology" && (
                    <button
                      type="button"
                      onClick={() => {
                        setTechName(t.entityName);
                        handleTechImpact(t.entityName);
                      }}
                      className="ml-1 text-blue-400 hover:text-blue-300"
                      title="Etki analizi yap"
                    >
                      →
                    </button>
                  )}
                  {t.entityType === "company" && (
                    <button
                      type="button"
                      onClick={() => {
                        setCompanyName(t.entityName);
                        handleAnalyzeCompany(t.entityName);
                      }}
                      className="ml-1 text-blue-400 hover:text-blue-300"
                      title="Şirket analizi yap"
                    >
                      →
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Günlük/Haftalık Rapor */}
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-6">
          <h2 className="font-semibold mb-3">Günlük / Haftalık Rapor</h2>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => handleGenerateReport("daily")}
              disabled={generatingDaily}
              className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 px-4 py-2 rounded-lg text-sm font-semibold"
            >
              {generatingDaily ? "Oluşturuluyor..." : "Günlük Rapor Oluştur"}
            </button>
            <button
              type="button"
              onClick={() => handleGenerateReport("weekly")}
              disabled={generatingWeekly}
              className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 px-4 py-2 rounded-lg text-sm font-semibold"
            >
              {generatingWeekly ? "Oluşturuluyor..." : "Haftalık Rapor Oluştur"}
            </button>
          </div>
          <p className="text-xs text-slate-500 mt-3">
            Not: Bu butonlar manuel tetikleme — otomatik (cron) rapor üretimi
            henüz kurulmadı (Gemini kotasını kontrolsüz tüketmemek için
            kasıtlı olarak eklenmedi).
          </p>
        </div>

        {/* Şirket Analizi */}
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-6">
          <h2 className="font-semibold mb-3">Şirket Analizi</h2>
          <div className="flex gap-2">
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Örn. Samsung"
              className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-sm outline-none focus:border-blue-400"
            />
            <button
              type="button"
              onClick={() => handleAnalyzeCompany(companyName)}
              disabled={analyzingCompany || !companyName.trim()}
              className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 px-4 py-2 rounded-lg text-sm font-semibold"
            >
              {analyzingCompany ? "Analiz ediliyor..." : "Analiz Et"}
            </button>
          </div>
        </div>

        {/* Teknoloji Etki Analizi */}
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-6">
          <h2 className="font-semibold mb-3">
            "Bu teknoloji neyi değiştirecek?"
          </h2>
          <div className="flex gap-2">
            <input
              type="text"
              value={techName}
              onChange={(e) => setTechName(e.target.value)}
              placeholder="Örn. 5G, katlanabilir ekran, USB-C..."
              className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-sm outline-none focus:border-blue-400"
            />
            <button
              type="button"
              onClick={() => handleTechImpact(techName)}
              disabled={analyzingTech || !techName.trim()}
              className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 px-4 py-2 rounded-lg text-sm font-semibold"
            >
              {analyzingTech ? "Analiz ediliyor..." : "Analiz Et"}
            </button>
          </div>
        </div>

        {/* Kayıtlı raporlar */}
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-6">
          <h2 className="font-semibold mb-3">Kayıtlı Raporlar</h2>

          {reports.length === 0 ? (
            <p className="text-sm text-slate-500">Henüz rapor yok.</p>
          ) : (
            <div className="space-y-3">
              {reports.map((r) => (
                <details
                  key={r.id}
                  className="rounded-lg border border-slate-700 bg-slate-950/50 p-3"
                >
                  <summary className="cursor-pointer text-sm font-medium">
                    <span className="text-slate-500 mr-2">
                      [{REPORT_TYPE_LABELS[r.type] ?? r.type}]
                    </span>
                    {r.title ?? "(başlıksız)"}
                    <span className="text-slate-600 text-xs ml-2">
                      {new Date(r.createdAt).toLocaleString("tr-TR")}
                    </span>
                  </summary>

                  <div className="mt-3 text-sm text-slate-300 space-y-2">
                    {r.content?.analysis && <p>{r.content.analysis}</p>}

                    {r.content?.highlights?.length > 0 && (
                      <ul className="list-disc pl-5">
                        {r.content.highlights.map((h: string, i: number) => (
                          <li key={i}>{h}</li>
                        ))}
                      </ul>
                    )}

                    {r.content?.trend_commentary && (
                      <p className="text-slate-400">
                        {r.content.trend_commentary}
                      </p>
                    )}

                    {r.content?.social_summary && (
                      <div className="mt-2 rounded-lg border border-slate-700 p-3">
                        <p className="text-xs text-slate-500 mb-1">
                          Sosyal medya özeti
                        </p>
                        <p>{r.content.social_summary}</p>
                        <button
                          type="button"
                          onClick={() =>
                            copySocialSummary(r.content.social_summary)
                          }
                          className="mt-2 text-xs text-blue-400 hover:text-blue-300"
                        >
                          Kopyala
                        </button>
                      </div>
                    )}
                  </div>
                </details>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
