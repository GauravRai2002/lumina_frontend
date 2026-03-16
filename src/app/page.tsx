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
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-black" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
        <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-zinc-500 opacity-20 blur-[100px]" />

        <div className="relative max-w-7xl mx-auto px-6 pt-24 pb-20">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-zinc-300 text-xs font-medium mb-8 backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-zinc-400" />
              AI-Powered Study Companion
            </div>
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight tracking-tighter">
              Learn smarter with{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-zinc-500">
                Lumina
              </span>
            </h1>
            <p className="text-lg text-zinc-400 mb-10 leading-relaxed max-w-2xl mx-auto">
              Upload PDFs, YouTube videos, or any learning material — instantly
              get AI-generated notes, quizzes, flashcards, podcasts, and a
              personal AI tutor.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Link
                href="/upload"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-md bg-white text-black hover:bg-zinc-200 font-medium transition-colors"
              >
                Start Learning
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-40 rounded-xl bg-zinc-900/50 border border-zinc-800 animate-pulse"
              />
            ))}
          </div>
        ) : materials.length === 0 ? (
          <div className="text-center py-24 border border-zinc-900 border-dashed rounded-2xl bg-zinc-950">
            <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-5 h-5 text-zinc-400" />
            </div>
            <h3 className="text-lg font-medium text-zinc-200 mb-2">
              No materials yet
            </h3>
            <p className="text-zinc-500 mb-6 text-sm">
              Upload your first PDF, video, or notes to get started.
            </p>
            <Link
              href="/upload"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-300 hover:bg-zinc-800 transition-colors text-sm font-medium"
            >
              <Upload className="w-4 h-4" />
              Upload Material
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {materials.map((mat) => (
              <div
                key={mat.id}
                className="group relative rounded-xl bg-black border border-zinc-800 hover:border-zinc-700 transition-colors duration-200"
              >
                <Link
                  href={`/study/${mat.id}`}
                  className="block p-5 h-full"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div
                      className={`p-2 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-400`}
                    >
                      {sourceIcons[mat.source_type] || (
                        <FileText className="w-4 h-4" />
                      )}
                    </div>
                    <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold bg-zinc-900 px-2 py-1 rounded">
                      {mat.source_type}
                    </span>
                  </div>
                  <h3 className="text-zinc-200 font-medium mb-2 line-clamp-2 group-hover:text-white transition-colors">
                    {mat.title}
                  </h3>
                  <p className="text-xs text-zinc-500">
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
                  className="absolute top-5 right-5 p-1.5 rounded-md text-zinc-500 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all"
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
