"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  FileText,
  Youtube,
  Image,
  Trash2,
  Sparkles,
  ArrowRight,
  Upload,
} from "lucide-react";

interface Material {
  id: string;
  title: string;
  source_type: string;
  created_at: string;
}

import { fetchApi } from "@/lib/api";

const sourceIcons: Record<string, React.ReactNode> = {
  pdf: <FileText className="w-5 h-5" />,
  youtube: <Youtube className="w-5 h-5" />,
  image: <Image className="w-5 h-5" />,
  text: <BookOpen className="w-5 h-5" />,
};

const sourceColors: Record<string, string> = {
  pdf: "from-red-500/20 to-red-600/10 text-red-400 border-red-500/20",
  youtube: "from-rose-500/20 to-pink-600/10 text-rose-400 border-rose-500/20",
  image: "from-emerald-500/20 to-green-600/10 text-emerald-400 border-emerald-500/20",
  text: "from-blue-500/20 to-cyan-600/10 text-blue-400 border-blue-500/20",
};

export default function Dashboard() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMaterials();
  }, []);

  async function fetchMaterials() {
    try {
      const res = await fetchApi("/materials");
      const data = await res.json();
      setMaterials(data.materials || []);
    } catch {
      console.error("Failed to fetch materials");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this material and all generated content?")) return;
    await fetchApi("/materials", {
      method: "DELETE",
      body: JSON.stringify({ id }),
    });
    setMaterials((m) => m.filter((mat) => mat.id !== id));
  }

  return (
    <div className="min-h-screen">
      {/* Hero section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-gray-950 via-gray-950 to-gray-950" />
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-fuchsia-600/20 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute top-40 right-1/4 w-[500px] h-[500px] bg-cyan-600/20 rounded-full blur-[120px] animate-pulse delay-1000" />

        <div className="relative max-w-7xl mx-auto px-6 pt-20 pb-16">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-gray-300 text-sm mb-6 backdrop-blur-md shadow-lg">
              <Sparkles className="w-4 h-4 text-fuchsia-400" />
              AI-Powered Study Companion
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-white mb-6 leading-tight tracking-tight">
              Learn smarter with{" "}
              <span className="bg-gradient-to-r from-fuchsia-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                Lumina
              </span>
            </h1>
            <p className="text-lg text-gray-400 mb-8 leading-relaxed">
              Upload PDFs, YouTube videos, or any learning material — instantly
              get AI-generated notes, quizzes, flashcards, podcasts, and a
              personal AI tutor.
            </p>
            <Link
              href="/upload"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-white text-black hover:bg-gray-100 font-bold transition-all shadow-xl shadow-white/10 hover:shadow-white/20 hover:-translate-y-1"
            >
              <Upload className="w-5 h-5" />
              Upload Material
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Materials grid */}
      <section className="max-w-7xl mx-auto px-6 pb-20">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-semibold text-white">
            Your Study Materials
          </h2>
          <span className="text-sm text-gray-500">
            {materials.length} {materials.length === 1 ? "item" : "items"}
          </span>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-40 rounded-xl bg-gray-900/50 border border-gray-800/50 animate-pulse"
              />
            ))}
          </div>
        ) : materials.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-gray-800/50 border border-gray-700/50 flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-7 h-7 text-gray-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-400 mb-2">
              No materials yet
            </h3>
            <p className="text-gray-600 mb-6">
              Upload your first PDF, video, or notes to get started.
            </p>
            <Link
              href="/upload"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-violet-600/20 border border-violet-500/30 text-violet-400 hover:bg-violet-600/30 transition-colors text-sm"
            >
              <Upload className="w-4 h-4" />
              Upload Material
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {materials.map((mat) => (
              <div
                key={mat.id}
                className="group relative rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/10 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-cyan-500/10"
              >
                <Link
                  href={`/study/${mat.id}`}
                  className="block p-5"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div
                      className={`p-2 rounded-lg bg-gradient-to-br border ${sourceColors[mat.source_type] || "from-gray-500/20 to-gray-600/10 text-gray-400 border-gray-500/20"}`}
                    >
                      {sourceIcons[mat.source_type] || (
                        <FileText className="w-5 h-5" />
                      )}
                    </div>
                    <span className="text-xs text-gray-600 uppercase tracking-wider font-medium">
                      {mat.source_type}
                    </span>
                  </div>
                  <h3 className="text-white font-medium mb-2 line-clamp-2 group-hover:text-violet-300 transition-colors">
                    {mat.title}
                  </h3>
                  <p className="text-xs text-gray-600">
                    {new Date(mat.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </Link>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    handleDelete(mat.id);
                  }}
                  className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-700 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
