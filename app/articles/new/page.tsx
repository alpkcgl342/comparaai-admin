"use client";

import { createArticle, uploadArticleImage } from "@/lib/api";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewArticlePage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [author, setAuthor] = useState("ComparaAI");
  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState("draft");
  const [saving, setSaving] = useState(false);


  function generateSlug(value: string) {
    return value
      .toLowerCase()
      .trim()
      .replace(/ğ/g, "g")
      .replace(/ü/g, "u")
      .replace(/ş/g, "s")
      .replace(/ı/g, "i")
      .replace(/ö/g, "o")
      .replace(/ç/g, "c")
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  }

  function handleTitleChange(value: string) {
    setTitle(value);

    if (!slug) {
      setSlug(generateSlug(value));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!title.trim() || !slug.trim() || !summary.trim() || !content.trim()) {
      alert("Başlık, slug, özet ve içerik alanları zorunludur.");
      return;
    }

    try {
      setSaving(true);

      await createArticle({
        title: title.trim(),
        slug: slug.trim(),
        summary: summary.trim(),
        content: content.trim(),
        author: author.trim() || "ComparaAI",
        imageUrl: imageUrl || undefined,
        status: isPublished ? "published" : "draft",
      });

      if (status === "pending") {
        alert("Haber oluşturuldu ve onay bekleyenlere gönderildi.");
      } else {
        alert("Haber taslak olarak kaydedildi.");
      }

      router.push("/articles");
    } catch (error) {
      console.error(error);
      
      const message = 
        error instanceof Error
          ? error.message
          : "Bilinmeyen bir hata oluştu.";

      alert(`Haber oluşturulamadı:\n${message}`);
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

  return (
    <main className="min-h-screen bg-[#050810] text-white p-8">
      <div className="max-w-4xl mx-auto">

        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">
              Yeni Haber
            </h1>

            <p className="text-slate-400 mt-2">
              ComparaAI için yeni bir haber oluşturun.
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
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Örn: Apple yeni iPhone modelini tanıttı"
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
              onChange={(e) => setSlug(generateSlug(e.target.value))}
              placeholder="apple-yeni-iphone-modelini-tanitti"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white outline-none focus:border-blue-400"
              required
            />

            <p className="text-xs text-slate-500 mt-1">
              Haber URL'sinde kullanılacak.
            </p>
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-2">
              Özet *
            </label>

            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={4}
              placeholder="Haberin kısa özeti"
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
              onChange={(e) => setContent(e.target.value)}
              rows={14}
              placeholder="Haberin tam içeriğini buraya yazın..."
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white outline-none focus:border-blue-400"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-2">
              Yazar
            </label>

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
                src={imageUrl}
                alt="Kapak Görseli"
                className="mt-2 max-w-full h-auto border border-slate-700 rounded-lg"
              />
            )}
          </div>

            <input
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white outline-none focus:border-blue-400"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-2">
              Haber Durumu
            </label>

            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white outline-none focus:border-blue-400"
            >
              <option value="draft">
                Taslak
              </option>

              <option value="pending">
                Onay Bekliyor
              </option>
            </select>

            <p className="text-xs text-slate-500 mt-2">
              Taslak haberler ve onay bekleyen haberler website'de görünmez.
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
                : status === "pending"
                ? "Onaya Gönder"
                : "Taslak Olarak Kaydet"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}