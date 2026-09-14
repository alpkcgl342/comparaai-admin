"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  AI_SERVICE_URL,
  getArticle,
  updateArticle,
  uploadArticleImage,
} from "@/lib/api";

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