"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      router.push("/login");
    }
  }, [router]);

  function logout() {
    localStorage.removeItem("token");
    router.push("/login");
  }

  return (
    <main className="min-h-screen bg-[#050810] text-white p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-3xl font-bold">
              Compara<span className="text-blue-400">AI</span> Admin
            </h1>

            <p className="text-slate-400 mt-2">
              Yönetim paneline hoş geldiniz.
            </p>
          </div>

          <button
            onClick={logout}
            className="border border-red-500/40 text-red-400 px-4 py-2 rounded-lg hover:bg-red-500/10"
          >
            Çıkış Yap
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Link
            href="/products"
            className="bg-slate-900 border border-blue-500/20 rounded-xl p-6 hover:border-blue-400 transition"
          >
            <div className="text-3xl mb-4">📦</div>

            <h2 className="text-xl font-semibold">
              Ürünler
            </h2>

            <p className="text-slate-400 text-sm mt-2">
              Ürünleri görüntüle, ekle, düzenle ve sil.
            </p>
          </Link>

          <Link
            href="/categories/new"
            className="bg-slate-900 border border-blue-500/20 rounded-xl p-6 hover:border-blue-400 transition"
          >
            <div className="text-3xl mb-4">📁</div>

            <h2 className="text-xl font-semibold">
              Kategoriler
            </h2>

            <p className="text-slate-400 text-sm mt-2">
              Yeni kategori oluştur.
            </p>
          </Link>

          <Link
            href="/articles"
            className="bg-slate-900 border border-blue-500/20 rounded-xl p-6 hover:border-blue-400 transition"
          >
            <div className="text-3xl mb-4">📰</div>

            <h2 className="text-xl font-semibold">
              Haberler
            </h2>

            <p className="text-slate-400 text-sm mt-2">
              Haber oluştur, düzenle ve yayınla.
            </p>
          </Link>

          <Link
            href="/reports"
            className="bg-slate-900 border border-blue-500/20 rounded-xl p-6 hover:border-blue-400 transition"
          >
            <div className="text-3xl mb-4">📊</div>

            <h2 className="text-xl font-semibold">
              Raporlar
            </h2>

            <p className="text-slate-400 text-sm mt-2">
              Trend tespiti, şirket/teknoloji analizi, günlük/haftalık rapor.
            </p>
          </Link>
        </div>
      </div>
    </main>
  );
}