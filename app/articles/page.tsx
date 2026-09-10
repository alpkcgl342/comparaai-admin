"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  getArticles,
  deleteArticle,
  updateArticle,
} from "@/lib/api";

type ArticleStatus = "draft" | "pending" | "published";

type Article = {
  id: string;
  title: string;
  slug: string;
  summary: string;
  content: string;
  author: string;
  status: ArticleStatus;
  isPublished: boolean;
  publishedAt?: string | null;
  createdAt: string;
};

export default function ArticlesPage() {
  const router = useRouter();

  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);

  async function loadArticles() {
    try {
      const data = await getArticles();
      setArticles(data);
    } catch (error) {
      console.error(error);
      alert("Haberler alınamadı.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      router.push("/login");
      return;
    }

    loadArticles();
  }, [router]);

  async function handlePublish(article: Article) {
    if (
      !confirm(
        `"${article.title}" haberini yayınlamak istediğinize emin misiniz?`
      )
    ) {
      return;
    }

    try {
      setActionId(article.id);

      await updateArticle(article.id, {
        status: "published",
      });

      await loadArticles();

      alert("Haber başarıyla yayınlandı.");
    } catch (error) {
      console.error(error);
      alert("Haber yayınlanamadı.");
    } finally {
      setActionId(null);
    }
  }

  async function handleMoveToDraft(article: Article) {
    if (
      !confirm(
        `"${article.title}" haberini taslağa almak istediğinize emin misiniz?`
      )
    ) {
      return;
    }

    try {
      setActionId(article.id);

      await updateArticle(article.id, {
        status: "draft",
      });

      await loadArticles();

      alert("Haber taslağa alındı.");
    } catch (error) {
      console.error(error);
      alert("Haber taslağa alınamadı.");
    } finally {
      setActionId(null);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Bu haberi silmek istediğinize emin misiniz?")) {
      return;
    }

    try {
      setActionId(id);

      await deleteArticle(id);
      await loadArticles();
    } catch (error) {
      console.error(error);
      alert("Haber silinemedi.");
    } finally {
      setActionId(null);
    }
  }

  function getStatusLabel(status: ArticleStatus) {
    switch (status) {
      case "published":
        return (
          <span className="text-green-400 font-medium">
            ● Yayında
          </span>
        );

      case "pending":
        return (
          <span className="text-yellow-400 font-medium">
            ● Onay Bekliyor
          </span>
        );

      case "draft":
      default:
        return (
          <span className="text-slate-400 font-medium">
            ● Taslak
          </span>
        );
    }
  }

  return (
    <main className="min-h-screen bg-[#050810] text-white p-8">
      <div className="max-w-7xl mx-auto">

        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">
              Haberler
            </h1>

            <p className="text-slate-400 mt-2">
              ComparaAI haberlerini yönetin.
            </p>
          </div>

          <div className="flex gap-2">
            <Link
              href="/"
              className="border border-slate-600 px-4 py-2 rounded-lg hover:bg-slate-800"
            >
              ← Dashboard
            </Link>

            <Link
              href="/articles/new"
              className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg"
            >
              + Yeni Haber
            </Link>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-700 rounded-xl overflow-hidden">
          {loading ? (
            <div className="p-8 text-slate-400">
              Haberler yükleniyor...
            </div>
          ) : articles.length === 0 ? (
            <div className="p-8 text-slate-400">
              Henüz haber bulunmuyor.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-slate-700 text-left">
                    <th className="p-4">Başlık</th>
                    <th className="p-4">Yazar</th>
                    <th className="p-4">Durum</th>
                    <th className="p-4">Tarih</th>
                    <th className="p-4">İşlemler</th>
                  </tr>
                </thead>

                <tbody>
                  {articles.map((article) => (
                    <tr
                      key={article.id}
                      className="border-b border-slate-800"
                    >
                      <td className="p-4">
                        <div className="font-medium">
                          {article.title}
                        </div>

                        <div className="text-xs text-slate-500 mt-1">
                          /{article.slug}
                        </div>
                      </td>

                      <td className="p-4">
                        {article.author}
                      </td>

                      <td className="p-4">
                        {getStatusLabel(article.status)}
                      </td>

                      <td className="p-4 text-slate-400">
                        {new Date(
                          article.createdAt
                        ).toLocaleDateString("tr-TR")}
                      </td>

                      <td className="p-4">
                        <div className="flex flex-wrap gap-3 items-center">

                          <Link
                            href={`/articles/${article.id}/edit`}
                            className="text-blue-400 underline"
                          >
                            Düzenle
                          </Link>

                          {article.status === "pending" && (
                            <button
                              onClick={() =>
                                handlePublish(article)
                              }
                              disabled={actionId === article.id}
                              className="text-green-400 underline disabled:opacity-50"
                            >
                              {actionId === article.id
                                ? "İşleniyor..."
                                : "Onayla ve Yayınla"}
                            </button>
                          )}

                          {article.status === "published" && (
                            <button
                              onClick={() =>
                                handleMoveToDraft(article)
                              }
                              disabled={actionId === article.id}
                              className="text-yellow-400 underline disabled:opacity-50"
                            >
                              {actionId === article.id
                                ? "İşleniyor..."
                                : "Taslağa Al"}
                            </button>
                          )}

                          <button
                            onClick={() =>
                              handleDelete(article.id)
                            }
                            disabled={actionId === article.id}
                            className="text-red-400 underline disabled:opacity-50"
                          >
                            Sil
                          </button>

                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}