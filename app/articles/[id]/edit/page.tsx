"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  AI_SERVICE_URL,
  getArticle,
  getDuplicateCandidates,
  getProducts,
  saveArticleDuplicates,
  saveArticleEntities,
  updateArticle,
  uploadArticleImage,
} from "@/lib/api";

type ArticleEntity = {
  entityType: string;
  entityName: string;
  productId?: string | null;
  confidence?: number | null;
  product?: { id: string; name: string; brand: string } | null;
};

const ENTITY_TYPE_LABELS: Record<string, string> = {
  company: "Şirket",
  product: "Ürün",
  technology: "Teknoloji",
};

const VERIFY_ISSUE_LABELS: Record<string, string> = {
  celiski: "⚠️ Çelişki",
  abartili_iddia: "🔺 Abartılı İddia",
  kaynak_belirsiz: "❓ Kaynak Belirsiz",
};

type ArticleDuplicate = {
  similarityScore: number;
  duplicateOfArticle?: { id: string; title: string } | null;
};

type ArticleStatus = "draft" | "pending" | "published";

export default function EditArticlePage() {
  const params = useParams();
  const router = useRouter();

  const id = params.id as string;

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [author, setAuthor] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [aiImportance, setAiImportance] = useState("");
  const [aiWhyItMatters, setAiWhyItMatters] = useState("");
  const [aiWhoItAffects, setAiWhoItAffects] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [entities, setEntities] = useState<ArticleEntity[]>([]);
  const [extracting, setExtracting] = useState(false);
  const [duplicates, setDuplicates] = useState<ArticleDuplicate[]>([]);
  const [checkingDuplicates, setCheckingDuplicates] = useState(false);
  const [seoMetaDescription, setSeoMetaDescription] = useState("");
  const [tagsText, setTagsText] = useState("");
  const [titleSuggestions, setTitleSuggestions] = useState<string[]>([]);
  const [suggestingMeta, setSuggestingMeta] = useState(false);

  type VerifyIssue = {
    issue_type: string;
    excerpt: string;
    explanation: string;
    suggestion: string;
  };
  const [verifyIssues, setVerifyIssues] = useState<VerifyIssue[] | null>(null);
  const [verifying, setVerifying] = useState(false);

  type SourceComparison = {
    consensus: string[];
    differences: string[];
    emphasis_notes: string[];
  };
  const [sourceComparison, setSourceComparison] =
    useState<SourceComparison | null>(null);
  const [comparingSources, setComparingSources] = useState(false);
  const [status, setStatus] =
    useState<ArticleStatus>("draft");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadArticle() {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          router.push("/login");
          return;
        }

        const article = await getArticle(id);

        setTitle(article.title ?? "");
        setSlug(article.slug ?? "");
        setSummary(article.summary ?? "");
        setContent(article.content ?? "");
        setAuthor(article.author ?? "ComparaAI");
        setImageUrl(article.imageUrl ?? "");
        setEntities(article.entities ?? []);
        setDuplicates(article.duplicatesOf ?? []);
        setSeoMetaDescription(article.seoMetaDescription ?? "");
        setTagsText((article.tags ?? []).join(", "));
        setAiImportance(article.aiImportance ?? "");
        setAiWhyItMatters(article.aiWhyItMatters ?? "");
        setAiWhoItAffects(article.aiWhoItAffects ?? "");

        if (
          article.status === "draft" ||
          article.status === "pending" ||
          article.status === "published"
        ) {
          setStatus(article.status);
        } else {
          setStatus(
            article.isPublished
              ? "published"
              : "draft"
          );
        }
      } catch (error) {
        console.error(error);
        alert("Haber alınamadı.");
        router.push("/articles");
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      loadArticle();
    }
  }, [id, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (
      !title.trim() ||
      !slug.trim() ||
      !summary.trim() ||
      !content.trim()
    ) {
      alert(
        "Başlık, slug, özet ve içerik alanları zorunludur."
      );
      return;
    }

    try {
      setSaving(true);

      await updateArticle(id, {
        title: title.trim(),
        slug: slug.trim(),
        summary: summary.trim(),
        content: content.trim(),
        author: author.trim() || "ComparaAI",
        imageUrl: imageUrl || undefined,
        status,
        aiImportance: aiImportance || undefined,
        aiWhyItMatters: aiWhyItMatters || undefined,
        aiWhoItAffects: aiWhoItAffects || undefined,
        seoMetaDescription: seoMetaDescription || undefined,
        tags: tagsText
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      });

      alert("Haber başarıyla güncellendi.");

      router.push("/articles");
    } catch (error) {
      console.error(error);
      alert("Haber güncellenemedi.");
    } finally {
      setSaving(false);
    }
  }

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const result = await uploadArticleImage(file);
      setImageUrl(result.url);
    } catch (error) {
      console.error(error);
      alert("Görsel yüklenemedi.");
    } finally {
      setUploading(false);
    }
  }

  async function handleAnalyze() {
    if (!title.trim() || !content.trim()) {
      alert("Analiz için başlık ve haber içeriği dolu olmalı.");
      return;
    }

    try {
    setAnalyzing(true);

    const res = await fetch(`${AI_SERVICE_URL}/analyze-article`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title.trim(),
        content: content.trim(),
      }),
    });
    if (!res.ok) {
      throw new Error("Analiz başarısız oldu.");
    }

    const result = await res.json();

    setSummary(result.summary);
    setAiImportance(result.importance);
    setAiWhyItMatters(result.why_it_matters);
    setAiWhoItAffects(result.who_it_affects);

  } catch (error) {
    console.error(error);
    alert("AI analizi yapılamadı. FastAPI servisinin (localhost:8000) çalıştığından emin olun.");

  } finally {
    setAnalyzing(false);
  }

}

  async function handleExtractEntities() {
    if (!title.trim() || !content.trim()) {
      alert("Varlık çıkarımı için başlık ve haber içeriği dolu olmalı.");
      return;
    }

    try {
      setExtracting(true);

      const products = await getProducts();
      const knownProducts = (products as { id: string; name: string; brand: string }[]).map(
        (p) => ({ id: p.id, name: p.name, brand: p.brand }),
      );

      const res = await fetch(`${AI_SERVICE_URL}/extract-entities`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          known_products: knownProducts,
        }),
      });

      if (!res.ok) {
        throw new Error("Varlık çıkarımı başarısız oldu.");
      }

      const result = await res.json();
      const saved = await saveArticleEntities(id, result.entities ?? []);

      setEntities(saved as ArticleEntity[]);
    } catch (error) {
      console.error(error);
      alert(
        "Varlıklar çıkarılamadı. AI servisinin (comparaai-ai) çalıştığından emin olun.",
      );
    } finally {
      setExtracting(false);
    }
  }

  async function handleCheckDuplicates() {
    if (!title.trim() || !summary.trim()) {
      alert("Benzerlik kontrolü için başlık ve özet dolu olmalı.");
      return;
    }

    try {
      setCheckingDuplicates(true);

      const candidates = await getDuplicateCandidates(id, 7);

      const res = await fetch(`${AI_SERVICE_URL}/detect-duplicates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          summary: summary.trim(),
          candidates,
        }),
      });

      if (!res.ok) {
        throw new Error("Benzerlik kontrolü başarısız oldu.");
      }

      const result = await res.json();
      const saved = await saveArticleDuplicates(id, result.duplicates ?? []);

      setDuplicates(saved as ArticleDuplicate[]);
    } catch (error) {
      console.error(error);
      alert(
        "Benzerlik kontrolü yapılamadı. AI servisinin (comparaai-ai) çalıştığından emin olun.",
      );
    } finally {
      setCheckingDuplicates(false);
    }
  }

  async function handleSuggestMeta() {
    if (!content.trim()) {
      alert("AI Editör önerisi için haber içeriği dolu olmalı.");
      return;
    }

    try {
      setSuggestingMeta(true);

      const res = await fetch(`${AI_SERVICE_URL}/suggest-article-meta`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
        }),
      });

      if (!res.ok) {
        throw new Error("Öneri alınamadı.");
      }

      const result = await res.json();

      setTitleSuggestions(result.title_suggestions ?? []);
      setSeoMetaDescription(result.seo_meta_description ?? "");
      setTagsText((result.tags ?? []).join(", "));
    } catch (error) {
      console.error(error);
      alert(
        "AI Editör önerisi alınamadı. AI servisinin (comparaai-ai) çalıştığından emin olun.",
      );
    } finally {
      setSuggestingMeta(false);
    }
  }

  async function handleVerify() {
    if (!title.trim() || !content.trim()) {
      alert("Doğrulama kontrolü için başlık ve içerik dolu olmalı.");
      return;
    }

    try {
      setVerifying(true);

      const res = await fetch(`${AI_SERVICE_URL}/verify-article`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), content: content.trim() }),
      });

      if (!res.ok) {
        throw new Error("Doğrulama kontrolü başarısız oldu.");
      }

      const result = await res.json();
      setVerifyIssues(result.issues ?? []);
    } catch (error) {
      console.error(error);
      alert(
        "Doğrulama kontrolü yapılamadı. AI servisinin (comparaai-ai) çalıştığından emin olun.",
      );
    } finally {
      setVerifying(false);
    }
  }

  async function handleCompareSources() {
    if (duplicates.length === 0) {
      return;
    }

    try {
      setComparingSources(true);

      const otherArticles = await Promise.all(
        duplicates
          .filter((d) => d.duplicateOfArticle?.id)
          .map((d) => getArticle(d.duplicateOfArticle!.id)),
      );

      const articlesPayload = [
        { author: author || null, title: title.trim(), content: content.trim() },
        ...otherArticles.map((a) => ({
          author: a.author || null,
          title: a.title,
          content: a.content,
        })),
      ];

      const res = await fetch(`${AI_SERVICE_URL}/compare-sources`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ articles: articlesPayload }),
      });

      if (!res.ok) {
        throw new Error("Kaynak karşılaştırması başarısız oldu.");
      }

      const result = await res.json();
      setSourceComparison(result as SourceComparison);
    } catch (error) {
      console.error(error);
      alert(
        "Kaynaklar karşılaştırılamadı. AI servisinin (comparaai-ai) çalıştığından emin olun.",
      );
    } finally {
      setComparingSources(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#050810] text-white p-8">
        <div className="max-w-4xl mx-auto">
          <p className="text-slate-400">
            Haber yükleniyor...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#050810] text-white p-8">
      <div className="max-w-4xl mx-auto">

        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">
              Haberi Düzenle
            </h1>

            <p className="text-slate-400 mt-2">
              Haber bilgilerini ve yayın durumunu güncelleyin.
            </p>
          </div>

          <button
            type="button"
            onClick={() => router.push("/articles")}
            className="border border-slate-600 px-4 py-2 rounded-lg hover:bg-slate-800"
          >
            ← Haberlere Dön
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-slate-900 border border-slate-700 rounded-xl p-6 space-y-5"
        >
          <div>
            <label className="block text-sm text-slate-300 mb-2">
              Başlık *
            </label>

            <input
              type="text"
              value={title}
              onChange={(e) =>
                setTitle(e.target.value)
              }
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white outline-none focus:border-blue-400"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-2">
              Slug *
            </label>

            <input
              type="text"
              value={slug}
              onChange={(e) =>
                setSlug(e.target.value)
              }
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white outline-none focus:border-blue-400"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-2">
              Özet *
            </label>

            <textarea
              value={summary}
              onChange={(e) =>
                setSummary(e.target.value)
              }
              rows={4}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white outline-none focus:border-blue-400"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-2">
              Haber İçeriği *
            </label>

            <textarea
              value={content}
              onChange={(e) =>
                setContent(e.target.value)
              }
              rows={14}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white outline-none focus:border-blue-400"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-2">
              Yazar
            </label>

            <input
              type="text"
              value={author}
              onChange={(e) =>
                setAuthor(e.target.value)
              }
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white outline-none focus:border-blue-400"
            />
          </div>
          
          <div className="border border-slate-700 rounded-lg p-4 bg-slate-950/50">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm text-slate-300">
                AI Haber Analizi
              </label>

              <button
                type="button"
                onClick={handleAnalyze}
                disabled={analyzing}
                className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 px-4 py-2 rounded-lg text-sm font-semibold"
              >
                {analyzing ? "Analiz ediliyor..." : "AI ile Analiz Et"}
              </button>
            </div>

            {aiImportance && (
              <div className="text-sm text-slate-300 space-y-2">
                <p>
                  <span className="text-slate-500">Önem derecesi:</span>{" "}
                  <span className="font-semibold">{aiImportance}</span>
                </p>
                <p>
                  <span className="text-slate-500">Neden önemli:</span>{" "}
                  {aiWhyItMatters}
                </p>
                <p>
                  <span className="text-slate-500">Kimi etkiler:</span>{" "}
                  {aiWhoItAffects}
                </p>
              </div>
            )}

            {!aiImportance && (
              <p className="text-xs text-slate-500">
                Henüz analiz yapılmadı. Başlık ve içerik doldurulduktan sonra butona basın.
              </p>
            )}
          </div>

          <div className="border border-slate-700 rounded-lg p-4 bg-slate-950/50">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm text-slate-300">
                AI Doğrulama Yardımcısı
              </label>

              <button
                type="button"
                onClick={handleVerify}
                disabled={verifying}
                className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 px-4 py-2 rounded-lg text-sm font-semibold"
              >
                {verifying ? "Kontrol ediliyor..." : "Doğrulama Kontrolü Yap"}
              </button>
            </div>

            {verifyIssues === null && (
              <p className="text-xs text-slate-500">
                Çelişkili ifade, abartılı iddia veya kaynağı belirsiz istatistik
                var mı diye kontrol eder. Otomatik reddetmez, sadece uyarır.
              </p>
            )}

            {verifyIssues !== null && verifyIssues.length === 0 && (
              <p className="text-xs text-emerald-400">
                ✓ Belirgin bir sorun tespit edilmedi.
              </p>
            )}

            {verifyIssues !== null && verifyIssues.length > 0 && (
              <div className="space-y-2">
                {verifyIssues.map((issue, i) => (
                  <div
                    key={i}
                    className="rounded-lg border border-amber-700/50 bg-amber-950/30 px-3 py-2 text-sm space-y-1"
                  >
                    <p className="font-medium text-amber-400">
                      {VERIFY_ISSUE_LABELS[issue.issue_type] ?? issue.issue_type}
                    </p>
                    <p className="text-slate-300 italic">"{issue.excerpt}"</p>
                    <p className="text-slate-400 text-xs">{issue.explanation}</p>
                    <p className="text-slate-500 text-xs">
                      Öneri: {issue.suggestion}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border border-slate-700 rounded-lg p-4 bg-slate-950/50">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm text-slate-300">
                Varlıklar (Şirket / Ürün / Teknoloji)
              </label>

              <button
                type="button"
                onClick={handleExtractEntities}
                disabled={extracting}
                className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 px-4 py-2 rounded-lg text-sm font-semibold"
              >
                {extracting ? "Çıkarılıyor..." : "Varlıkları Çıkar"}
              </button>
            </div>

            {entities.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {entities.map((e, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs"
                  >
                    <span className="text-slate-500">
                      {ENTITY_TYPE_LABELS[e.entityType] ?? e.entityType}:
                    </span>
                    <span className="font-medium">{e.entityName}</span>
                    {e.product && (
                      <span className="text-emerald-400">
                        → {e.product.brand} {e.product.name}
                      </span>
                    )}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500">
                Henüz varlık çıkarılmadı. Bu haberde geçen şirket/ürün/teknoloji
                isimlerini bulup ürün veritabanınızla eşleştirir.
              </p>
            )}
          </div>

          <div className="border border-slate-700 rounded-lg p-4 bg-slate-950/50">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm text-slate-300">
                Benzer Haber Kontrolü
              </label>

              <button
                type="button"
                onClick={handleCheckDuplicates}
                disabled={checkingDuplicates}
                className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 px-4 py-2 rounded-lg text-sm font-semibold"
              >
                {checkingDuplicates ? "Kontrol ediliyor..." : "Benzerlik Kontrolü Yap"}
              </button>
            </div>

            {duplicates.length > 0 ? (
              <div className="space-y-2">
                {duplicates.map((d, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-lg border border-amber-700/50 bg-amber-950/30 px-3 py-2 text-sm"
                  >
                    <span>
                      ⚠️ <span className="font-medium">{d.duplicateOfArticle?.title}</span>{" "}
                      ile benzer olabilir
                    </span>
                    <span className="text-amber-400 text-xs shrink-0 ml-3">
                      %{Math.round(d.similarityScore * 100)} benzer
                    </span>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={handleCompareSources}
                  disabled={comparingSources}
                  className="mt-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 px-4 py-2 rounded-lg text-sm font-semibold"
                >
                  {comparingSources
                    ? "Karşılaştırılıyor..."
                    : "Kaynakları Karşılaştır"}
                </button>

                {sourceComparison && (
                  <div className="mt-3 space-y-3 text-sm">
                    {sourceComparison.consensus.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-slate-400 mb-1">
                          Ortak noktalar
                        </p>
                        <ul className="list-disc pl-5 space-y-0.5 text-slate-300">
                          {sourceComparison.consensus.map((c, i) => (
                            <li key={i}>{c}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {sourceComparison.differences.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-slate-400 mb-1">
                          Farklılıklar
                        </p>
                        <ul className="list-disc pl-5 space-y-0.5 text-slate-300">
                          {sourceComparison.differences.map((d, i) => (
                            <li key={i}>{d}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {sourceComparison.emphasis_notes.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-slate-400 mb-1">
                          Vurgu farkları
                        </p>
                        <ul className="list-disc pl-5 space-y-0.5 text-slate-300">
                          {sourceComparison.emphasis_notes.map((e, i) => (
                            <li key={i}>{e}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-500">
                Son 7 gündeki haberlerle henüz karşılaştırılmadı.
              </p>
            )}
          </div>

          <div className="border border-slate-700 rounded-lg p-4 bg-slate-950/50 space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm text-slate-300">
                AI Editör (başlık / SEO / etiket önerisi)
              </label>

              <button
                type="button"
                onClick={handleSuggestMeta}
                disabled={suggestingMeta}
                className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 px-4 py-2 rounded-lg text-sm font-semibold"
              >
                {suggestingMeta ? "Öneriliyor..." : "AI ile Öner"}
              </button>
            </div>

            {titleSuggestions.length > 0 && (
              <div>
                <p className="text-xs text-slate-500 mb-2">
                  Başlık önerileri (tıklayınca yukarıdaki başlığa uygulanır):
                </p>
                <div className="flex flex-col gap-2">
                  {titleSuggestions.map((s, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setTitle(s)}
                      className="text-left text-sm rounded-lg border border-slate-700 px-3 py-2 hover:border-blue-500 hover:bg-slate-900"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs text-slate-500 mb-1">
                SEO Meta Açıklaması
              </label>
              <textarea
                value={seoMetaDescription}
                onChange={(e) => setSeoMetaDescription(e.target.value)}
                rows={2}
                maxLength={160}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-blue-400"
                placeholder="Arama motoru sonuçlarında görünecek kısa açıklama (120-160 karakter)"
              />
              <p className="text-xs text-slate-600 mt-1">
                {seoMetaDescription.length}/160 karakter
              </p>
            </div>

            <div>
              <label className="block text-xs text-slate-500 mb-1">
                Etiketler (virgülle ayırın)
              </label>
              <input
                type="text"
                value={tagsText}
                onChange={(e) => setTagsText(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-blue-400"
                placeholder="Samsung, Galaxy A55, 5G"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-2">
              Kapak Görseli
            </label>

            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleImageChange}
              className="w-full text-sm text-slate-300 file:mr-4 file:rounded-lg file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:text-white hover:file:bg-blue-500"
            />

            {uploading && (
              <p className="text-xs text-slate-400 mt-2">Yükleniyor...</p>
            )}

            {imageUrl && (
              <img
                src={`http://localhost:3001${imageUrl}`}
                alt="Önizleme"
                className="mt-3 h-32 rounded-lg object-cover"
              />
            )}
          </div>
          
          <div>
            <label className="block text-sm text-slate-300 mb-2">
              Haber Durumu
            </label>

            <select
              value={status}
              onChange={(e) =>
                setStatus(
                  e.target.value as ArticleStatus
                )
              }
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white outline-none focus:border-blue-400"
            >
              <option value="draft">
                Taslak
              </option>

              <option value="pending">
                Onay Bekliyor
              </option>

              <option value="published">
                Yayında
              </option>
            </select>

            <p className="text-xs text-slate-500 mt-2">
              Yayındaki haber website'de görünür.
              Taslak ve onay bekleyen haberler website'de görünmez.
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => router.push("/articles")}
              className="border border-slate-600 px-5 py-3 rounded-lg hover:bg-slate-800"
            >
              İptal
            </button>

            <button
              type="submit"
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 px-6 py-3 rounded-lg font-semibold"
            >
              {saving
                ? "Kaydediliyor..."
                : "Değişiklikleri Kaydet"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}