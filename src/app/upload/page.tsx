"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useDropzone } from "react-dropzone";
import {
  Upload,
  FileText,
  Youtube,
  Loader2,
  CheckCircle2,
  AlertCircle,
  FileImage,
  Type,
} from "lucide-react";

import { fetchApi } from "@/lib/api";

type UploadMode = "file" | "youtube" | "text";

export default function UploadPage() {
  const router = useRouter();
  const [mode, setMode] = useState<UploadMode>("file");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [pastedText, setPastedText] = useState("");
  const [textTitle, setTextTitle] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;
      const file = acceptedFiles[0];
      await uploadFile(file);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "text/plain": [".txt"],
      "text/markdown": [".md"],
      "image/png": [".png"],
      "image/jpeg": [".jpg", ".jpeg"],
      "image/webp": [".webp"],
    },
    multiple: false,
    maxSize: 50 * 1024 * 1024, // 50MB
  });

  async function uploadFile(file: File) {
    setUploading(true);
    setError("");
    setSuccess("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetchApi("/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Upload failed");
        return;
      }

      setSuccess(`"${data.title}" uploaded successfully!`);
      setTimeout(() => router.push(`/study/${data.id}`), 1000);
    } catch {
      setError("Failed to upload file. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  async function handleYouTube() {
    if (!youtubeUrl.trim()) return;
    setUploading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetchApi("/upload", {
        method: "POST",
        body: JSON.stringify({ youtubeUrl }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to fetch transcript");
        return;
      }

      setSuccess(`"${data.title}" imported successfully!`);
      setTimeout(() => router.push(`/study/${data.id}`), 1000);
    } catch {
      setError("Failed to import YouTube video.");
    } finally {
      setUploading(false);
    }
  }

  async function handlePasteText() {
    if (!pastedText.trim()) return;
    setUploading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetchApi("/upload", {
        method: "POST",
        body: JSON.stringify({
          text: pastedText,
          title: textTitle || "Pasted Notes",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to save text");
        return;
      }

      setSuccess(`"${data.title}" saved successfully!`);
      setTimeout(() => router.push(`/study/${data.id}`), 1000);
    } catch {
      setError("Failed to save text.");
    } finally {
      setUploading(false);
    }
  }

  const modes: { id: UploadMode; label: string; icon: React.ReactNode }[] = [
    { id: "file", label: "File Upload", icon: <FileText className="w-4 h-4" /> },
    { id: "youtube", label: "YouTube", icon: <Youtube className="w-4 h-4" /> },
    { id: "text", label: "Paste Text", icon: <Type className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen">
      <div className="max-w-2xl mx-auto px-6 py-16">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-white mb-3 tracking-tight">
            Upload Study Material
          </h1>
          <p className="text-zinc-400">
            Upload a PDF, image, YouTube video, or paste text — Lumina will
            transform it into interactive study tools.
          </p>
        </div>

        {/* Mode switcher */}
        <div className="flex gap-1 p-1 rounded-md bg-zinc-900/50 border border-zinc-800 mb-8">
          {modes.map((m) => (
            <button
              key={m.id}
              onClick={() => {
                setMode(m.id);
                setError("");
                setSuccess("");
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all ${
                mode === m.id
                  ? "bg-zinc-800 text-white shadow-sm"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
              }`}
            >
              {m.icon}
              {m.label}
            </button>
          ))}
        </div>

        {/* File upload */}
        {mode === "file" && (
          <div
            {...getRootProps()}
            className={`relative rounded-xl border border-dashed p-12 text-center cursor-pointer transition-colors duration-200 ${
              isDragActive
                ? "border-zinc-500 bg-zinc-900"
                : "border-zinc-800 bg-black hover:border-zinc-700 hover:bg-zinc-900/50"
            }`}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center gap-4">
              {uploading ? (
                <Loader2 className="w-10 h-10 text-zinc-400 animate-spin" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                  <Upload className="w-6 h-6 text-zinc-300" />
                </div>
              )}
              <div>
                <p className="text-white font-medium mb-1">
                  {isDragActive
                    ? "Drop your file here..."
                    : "Drag & drop a file here"}
                </p>
                <p className="text-sm text-zinc-500">
                  or click to browse • PDF, TXT, PNG, JPG (max 50MB)
                </p>
              </div>
              <div className="flex items-center gap-3 mt-2">
                <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                  <FileText className="w-3.5 h-3.5" /> PDF
                </div>
                <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                  <FileImage className="w-3.5 h-3.5" /> Images
                </div>
                <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                  <Type className="w-3.5 h-3.5" /> TXT/MD
                </div>
              </div>
            </div>
          </div>
        )}

        {/* YouTube URL */}
        {mode === "youtube" && (
          <div className="space-y-4">
            <div className="rounded-xl bg-black border border-zinc-800 p-6">
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                YouTube Video URL
              </label>
              <input
                type="url"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                className="w-full px-4 py-2.5 rounded-md bg-zinc-900 border border-zinc-800 text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 transition-all text-sm"
              />
              <p className="text-xs text-zinc-500 mt-2">
                The video must have captions/subtitles enabled.
              </p>
            </div>
            <button
              onClick={handleYouTube}
              disabled={uploading || !youtubeUrl.trim()}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-md bg-white hover:bg-zinc-200 disabled:bg-zinc-800 disabled:text-zinc-500 text-black font-medium transition-colors text-sm"
            >
              {uploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Youtube className="w-4 h-4" />
              )}
              {uploading ? "Fetching transcript..." : "Import Video"}
            </button>
          </div>
        )}

        {/* Paste text */}
        {mode === "text" && (
          <div className="space-y-4">
            <div className="rounded-xl bg-black border border-zinc-800 p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Title (optional)
                </label>
                <input
                  type="text"
                  value={textTitle}
                  onChange={(e) => setTextTitle(e.target.value)}
                  placeholder="e.g. Organic Chemistry Ch. 5"
                  className="w-full px-4 py-2.5 rounded-md bg-zinc-900 border border-zinc-800 text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 transition-all text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Study Material
                </label>
                <textarea
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  placeholder="Paste your lecture notes, textbook content, or any study material here..."
                  rows={10}
                  className="w-full px-4 py-2.5 rounded-md bg-zinc-900 border border-zinc-800 text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 transition-all resize-none text-sm"
                />
              </div>
            </div>
            <button
              onClick={handlePasteText}
              disabled={uploading || !pastedText.trim()}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-md bg-white hover:bg-zinc-200 disabled:bg-zinc-800 disabled:text-zinc-500 text-black font-medium transition-colors text-sm"
            >
              {uploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Type className="w-4 h-4" />
              )}
              {uploading ? "Processing..." : "Save & Generate"}
            </button>
          </div>
        )}

        {/* Status messages */}
        {error && (
          <div className="mt-6 flex items-center gap-2 px-4 py-3 rounded-md bg-red-950/50 border border-red-900/50 text-red-500 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}
        {success && (
          <div className="mt-6 flex items-center gap-2 px-4 py-3 rounded-md bg-emerald-950/50 border border-emerald-900/50 text-emerald-500 text-sm">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            {success}
          </div>
        )}
      </div>
    </div>
  );
}
