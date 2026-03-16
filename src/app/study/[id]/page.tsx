"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import ReactMarkdown from "react-markdown";
import {
  FileText,
  HelpCircle,
  Layers,
  Headphones,
  MessageSquare,
  Loader2,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Send,
  Volume2,
  Pause,
  Play,
  Check,
  X,
} from "lucide-react";

type Tab = "notes" | "quiz" | "flashcards" | "podcast" | "chat";

interface QuizQuestion {
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}

interface Flashcard {
  front: string;
  back: string;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

import { fetchApi } from "@/lib/api";

export default function StudyPage() {
  const params = useParams();
  const materialId = params.id as string;

  const [activeTab, setActiveTab] = useState<Tab>("notes");
  const [material, setMaterial] = useState<{
    title: string;
    source_type: string;
  } | null>(null);

  // Notes state
  const [notes, setNotes] = useState("");
  const [notesLoading, setNotesLoading] = useState(false);

  // Quiz state
  const [quiz, setQuiz] = useState<QuizQuestion[]>([]);
  const [quizLoading, setQuizLoading] = useState(false);
  const [currentQ, setCurrentQ] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState(0);
  const [quizComplete, setQuizComplete] = useState(false);

  // Flashcard state
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [flashcardsLoading, setFlashcardsLoading] = useState(false);
  const [currentCard, setCurrentCard] = useState(0);
  const [flipped, setFlipped] = useState(false);

  // Podcast state
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechRate, setSpeechRate] = useState(1);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMaterial();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [materialId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  async function fetchMaterial() {
    try {
      const res = await fetchApi("/materials");
      const data = await res.json();
      const mat = data.materials?.find(
        (m: { id: string }) => m.id === materialId
      );
      if (mat) setMaterial(mat);
    } catch {
      console.error("Failed to fetch material");
    }
  }

  async function generateContent(type: "notes" | "quiz" | "flashcards") {
    const setLoading =
      type === "notes"
        ? setNotesLoading
        : type === "quiz"
          ? setQuizLoading
          : setFlashcardsLoading;

    setLoading(true);
    try {
      const res = await fetchApi("/generate", {
        method: "POST",
        body: JSON.stringify({ materialId, type }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      if (type === "notes") {
        setNotes(data.content);
      } else if (type === "quiz") {
        try {
          // Parse quiz JSON, handling potential markdown fences
          let jsonStr = data.content;
          const fenceMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
          if (fenceMatch) jsonStr = fenceMatch[1];
          const parsed = JSON.parse(jsonStr.trim());
          setQuiz(parsed);
          setCurrentQ(0);
          setSelectedAnswer(null);
          setShowExplanation(false);
          setScore(0);
          setQuizComplete(false);
        } catch {
          console.error("Failed to parse quiz JSON");
        }
      } else if (type === "flashcards") {
        try {
          let jsonStr = data.content;
          const fenceMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
          if (fenceMatch) jsonStr = fenceMatch[1];
          const parsed = JSON.parse(jsonStr.trim());
          setFlashcards(parsed);
          setCurrentCard(0);
          setFlipped(false);
        } catch {
          console.error("Failed to parse flashcards JSON");
        }
      }
    } catch (err) {
      console.error(`Failed to generate ${type}:`, err);
    } finally {
      setLoading(false);
    }
  }

  function handleQuizAnswer(idx: number) {
    if (selectedAnswer !== null) return; // Already answered
    setSelectedAnswer(idx);
    setShowExplanation(true);
    if (idx === quiz[currentQ].correct) {
      setScore((s) => s + 1);
    }
  }

  function nextQuestion() {
    if (currentQ < quiz.length - 1) {
      setCurrentQ((q) => q + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    } else {
      setQuizComplete(true);
    }
  }

  async function handleFlashcardRating(rating: "again" | "hard" | "good" | "easy") {
    try {
      await fetchApi("/flashcard-review", {
        method: "POST",
        body: JSON.stringify({ materialId, cardIndex: currentCard, rating }),
      });
    } catch {
      // Silent fail for now
    }

    // Move to next card
    if (currentCard < flashcards.length - 1) {
      setCurrentCard((c) => c + 1);
      setFlipped(false);
    } else {
      setCurrentCard(0);
      setFlipped(false);
    }
  }

  function handleSpeak() {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const textToSpeak = notes || "No notes generated yet.";
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.rate = speechRate;
    utterance.onend = () => setIsSpeaking(false);
    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  }

  async function handleChatSend() {
    if (!chatInput.trim() || chatLoading) return;
    const message = chatInput.trim();
    setChatInput("");
    setChatMessages((prev) => [
      ...prev,
      { id: Date.now().toString(), role: "user", content: message },
    ]);
    setChatLoading(true);

    try {
      const res = await fetchApi("/chat", {
        method: "POST",
        body: JSON.stringify({ materialId, message }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setChatMessages((prev) => [
        ...prev,
        { id: data.id, role: "assistant", content: data.response },
      ]);
    } catch {
      setChatMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again.",
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  }

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "notes", label: "Notes", icon: <FileText className="w-4 h-4" /> },
    { id: "quiz", label: "Quiz", icon: <HelpCircle className="w-4 h-4" /> },
    { id: "flashcards", label: "Cards", icon: <Layers className="w-4 h-4" /> },
    {
      id: "podcast",
      label: "Podcast",
      icon: <Headphones className="w-4 h-4" />,
    },
    {
      id: "chat",
      label: "Tutor",
      icon: <MessageSquare className="w-4 h-4" />,
    },
  ];

  return (
    <div className="min-h-screen max-w-5xl mx-auto px-6 py-8">
      {/* Material header */}
      <div className="mb-6">
        <p className="text-xs text-gray-600 uppercase tracking-wider mb-1">
          {material?.source_type || "Material"}
        </p>
        <h1 className="text-2xl font-bold text-white">
          {material?.title || "Loading..."}
        </h1>
      </div>

      {/* Tab navigation */}
      <div className="flex gap-1 p-1 rounded-xl bg-gray-900/80 border border-gray-800/50 mb-8 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? "bg-violet-600 text-white shadow-lg shadow-violet-600/25"
                : "text-gray-400 hover:text-white hover:bg-gray-800/50"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="min-h-[500px]">
        {/* ============ NOTES TAB ============ */}
        {activeTab === "notes" && (
          <div>
            {!notes && !notesLoading && (
              <EmptyState
                title="Generate Study Notes"
                description="AI will analyze your material and create structured, comprehensive notes."
                buttonLabel="Generate Notes"
                onAction={() => generateContent("notes")}
                icon={<FileText className="w-8 h-8 text-violet-400" />}
              />
            )}
            {notesLoading && <LoadingState label="Generating notes..." />}
            {notes && (
              <div className="rounded-2xl bg-gray-900/50 border border-gray-800/50 p-8">
                <div className="prose-notes">
                  <ReactMarkdown>{notes}</ReactMarkdown>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============ QUIZ TAB ============ */}
        {activeTab === "quiz" && (
          <div>
            {quiz.length === 0 && !quizLoading && (
              <EmptyState
                title="Generate Practice Quiz"
                description="AI will create multiple-choice questions to test your understanding."
                buttonLabel="Generate Quiz"
                onAction={() => generateContent("quiz")}
                icon={<HelpCircle className="w-8 h-8 text-violet-400" />}
              />
            )}
            {quizLoading && <LoadingState label="Creating quiz questions..." />}
            {quiz.length > 0 && !quizComplete && (
              <div className="max-w-2xl mx-auto">
                {/* Progress */}
                <div className="flex items-center justify-between mb-6">
                  <span className="text-sm text-gray-400">
                    Question {currentQ + 1} of {quiz.length}
                  </span>
                  <span className="text-sm text-violet-400">
                    Score: {score}/{currentQ + (selectedAnswer !== null ? 1 : 0)}
                  </span>
                </div>
                <div className="h-1 rounded-full bg-gray-800 mb-8">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 transition-all duration-500"
                    style={{
                      width: `${((currentQ + 1) / quiz.length) * 100}%`,
                    }}
                  />
                </div>

                {/* Question */}
                <div className="rounded-2xl bg-gray-900/50 border border-gray-800/50 p-6 mb-6">
                  <h3 className="text-lg text-white font-medium mb-6">
                    {quiz[currentQ].question}
                  </h3>

                  <div className="space-y-3">
                    {quiz[currentQ].options.map((option, idx) => {
                      let style =
                        "border-gray-700/50 bg-gray-800/30 hover:border-gray-600/50 text-gray-300";
                      if (selectedAnswer !== null) {
                        if (idx === quiz[currentQ].correct) {
                          style =
                            "border-emerald-500/50 bg-emerald-500/10 text-emerald-400";
                        } else if (
                          idx === selectedAnswer &&
                          idx !== quiz[currentQ].correct
                        ) {
                          style =
                            "border-red-500/50 bg-red-500/10 text-red-400";
                        } else {
                          style =
                            "border-gray-800/50 bg-gray-800/20 text-gray-600";
                        }
                      }

                      return (
                        <button
                          key={idx}
                          onClick={() => handleQuizAnswer(idx)}
                          disabled={selectedAnswer !== null}
                          className={`w-full text-left px-4 py-3 rounded-xl border transition-all flex items-center gap-3 ${style}`}
                        >
                          <span className="w-7 h-7 rounded-lg bg-gray-700/50 flex items-center justify-center text-xs font-medium flex-shrink-0">
                            {selectedAnswer !== null ? (
                              idx === quiz[currentQ].correct ? (
                                <Check className="w-4 h-4 text-emerald-400" />
                              ) : idx === selectedAnswer ? (
                                <X className="w-4 h-4 text-red-400" />
                              ) : (
                                String.fromCharCode(65 + idx)
                              )
                            ) : (
                              String.fromCharCode(65 + idx)
                            )}
                          </span>
                          {option}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Explanation */}
                {showExplanation && (
                  <div className="rounded-xl bg-indigo-500/10 border border-indigo-500/20 p-4 mb-6">
                    <p className="text-sm text-indigo-300">
                      <strong>Explanation:</strong>{" "}
                      {quiz[currentQ].explanation}
                    </p>
                  </div>
                )}

                {selectedAnswer !== null && (
                  <button
                    onClick={nextQuestion}
                    className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-medium transition-colors"
                  >
                    {currentQ < quiz.length - 1 ? "Next Question" : "See Results"}
                  </button>
                )}
              </div>
            )}
            {quizComplete && (
              <div className="max-w-md mx-auto text-center py-12">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-500/20 to-indigo-600/20 border border-violet-500/20 flex items-center justify-center mx-auto mb-6">
                  <span className="text-2xl font-bold text-violet-400">
                    {Math.round((score / quiz.length) * 100)}%
                  </span>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">
                  Quiz Complete!
                </h3>
                <p className="text-gray-400 mb-6">
                  You scored {score} out of {quiz.length} questions correctly.
                </p>
                <button
                  onClick={() => {
                    setCurrentQ(0);
                    setSelectedAnswer(null);
                    setShowExplanation(false);
                    setScore(0);
                    setQuizComplete(false);
                  }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-medium transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  Retry Quiz
                </button>
              </div>
            )}
          </div>
        )}

        {/* ============ FLASHCARDS TAB ============ */}
        {activeTab === "flashcards" && (
          <div>
            {flashcards.length === 0 && !flashcardsLoading && (
              <EmptyState
                title="Generate Flashcards"
                description="AI creates Q&A flashcards with spaced repetition for optimal retention."
                buttonLabel="Generate Flashcards"
                onAction={() => generateContent("flashcards")}
                icon={<Layers className="w-8 h-8 text-violet-400" />}
              />
            )}
            {flashcardsLoading && (
              <LoadingState label="Creating flashcards..." />
            )}
            {flashcards.length > 0 && (
              <div className="max-w-lg mx-auto">
                {/* Card counter */}
                <div className="flex items-center justify-between mb-6">
                  <button
                    onClick={() => {
                      setCurrentCard((c) =>
                        c > 0 ? c - 1 : flashcards.length - 1
                      );
                      setFlipped(false);
                    }}
                    className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800/50 transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <span className="text-sm text-gray-400">
                    {currentCard + 1} / {flashcards.length}
                  </span>
                  <button
                    onClick={() => {
                      setCurrentCard((c) =>
                        c < flashcards.length - 1 ? c + 1 : 0
                      );
                      setFlipped(false);
                    }}
                    className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800/50 transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>

                {/* Flashcard */}
                <div className="flashcard-container mb-6">
                  <div
                    onClick={() => setFlipped(!flipped)}
                    className={`flashcard-inner cursor-pointer relative h-64 ${flipped ? "flipped" : ""}`}
                  >
                    {/* Front */}
                    <div className="flashcard-front absolute inset-0 rounded-2xl bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700/50 p-8 flex flex-col items-center justify-center text-center shadow-xl">
                      <p className="text-xs text-violet-400 uppercase tracking-wider mb-4">
                        Question
                      </p>
                      <p className="text-lg text-white font-medium leading-relaxed">
                        {flashcards[currentCard].front}
                      </p>
                      <p className="text-xs text-gray-600 mt-6">
                        Tap to flip
                      </p>
                    </div>
                    {/* Back */}
                    <div className="flashcard-back absolute inset-0 rounded-2xl bg-gradient-to-br from-violet-950/50 to-indigo-950/50 border border-violet-500/20 p-8 flex flex-col items-center justify-center text-center shadow-xl">
                      <p className="text-xs text-indigo-400 uppercase tracking-wider mb-4">
                        Answer
                      </p>
                      <p className="text-lg text-white font-medium leading-relaxed">
                        {flashcards[currentCard].back}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Rating buttons */}
                {flipped && (
                  <div className="grid grid-cols-4 gap-2">
                    {(
                      [
                        ["again", "Again", "text-red-400 border-red-500/20 hover:bg-red-500/10"],
                        ["hard", "Hard", "text-orange-400 border-orange-500/20 hover:bg-orange-500/10"],
                        ["good", "Good", "text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/10"],
                        ["easy", "Easy", "text-blue-400 border-blue-500/20 hover:bg-blue-500/10"],
                      ] as const
                    ).map(([rating, label, style]) => (
                      <button
                        key={rating}
                        onClick={() =>
                          handleFlashcardRating(rating)
                        }
                        className={`py-2.5 rounded-xl border text-sm font-medium transition-colors ${style}`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ============ PODCAST TAB ============ */}
        {activeTab === "podcast" && (
          <div className="max-w-lg mx-auto text-center py-12">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-violet-600/20 to-indigo-600/20 border border-violet-500/20 flex items-center justify-center mx-auto mb-6">
              <Headphones className="w-10 h-10 text-violet-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">
              Audio Summary
            </h3>
            <p className="text-gray-400 mb-8">
              {notes
                ? "Listen to your study notes read aloud. Perfect for review on the go."
                : "Generate notes first, then listen to them as an audio summary."}
            </p>

            {notes ? (
              <div className="space-y-6">
                {/* Play button */}
                <button
                  onClick={handleSpeak}
                  className={`inline-flex items-center gap-3 px-8 py-4 rounded-2xl font-medium transition-all text-lg ${
                    isSpeaking
                      ? "bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30"
                      : "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-xl shadow-violet-600/25 hover:shadow-violet-500/40"
                  }`}
                >
                  {isSpeaking ? (
                    <>
                      <Pause className="w-6 h-6" />
                      Stop Playing
                    </>
                  ) : (
                    <>
                      <Play className="w-6 h-6" />
                      Play Notes
                    </>
                  )}
                </button>

                {/* Speed control */}
                <div className="flex items-center justify-center gap-3">
                  <Volume2 className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-500">Speed:</span>
                  {[0.75, 1, 1.25, 1.5, 2].map((rate) => (
                    <button
                      key={rate}
                      onClick={() => setSpeechRate(rate)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                        speechRate === rate
                          ? "bg-violet-600 text-white"
                          : "text-gray-500 hover:text-white hover:bg-gray-800/50"
                      }`}
                    >
                      {rate}x
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <button
                onClick={() => {
                  setActiveTab("notes");
                  generateContent("notes");
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-medium transition-colors"
              >
                <Sparkles className="w-4 h-4" />
                Generate Notes First
              </button>
            )}
          </div>
        )}

        {/* ============ CHAT TAB ============ */}
        {activeTab === "chat" && (
          <div className="flex flex-col h-[600px]">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto rounded-t-2xl bg-gray-900/50 border border-gray-800/50 border-b-0 p-6 space-y-4">
              {chatMessages.length === 0 && (
                <div className="text-center py-16">
                  <MessageSquare className="w-10 h-10 text-gray-700 mx-auto mb-3" />
                  <h3 className="text-gray-400 font-medium mb-1">
                    AI Study Tutor
                  </h3>
                  <p className="text-sm text-gray-600">
                    Ask any question about your study material and get instant,
                    contextual answers.
                  </p>
                </div>
              )}
              {chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      msg.role === "user"
                        ? "bg-violet-600 text-white rounded-br-md"
                        : "bg-gray-800/80 text-gray-200 rounded-bl-md border border-gray-700/50"
                    }`}
                  >
                    {msg.role === "assistant" ? (
                      <div className="prose-notes text-sm">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <p className="text-sm">{msg.content}</p>
                    )}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-800/80 border border-gray-700/50 rounded-2xl rounded-bl-md px-4 py-3">
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Thinking...
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <div className="rounded-b-2xl bg-gray-900/80 border border-gray-800/50 border-t-gray-700/30 p-4">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleChatSend();
                    }
                  }}
                  placeholder="Ask a question about your material..."
                  className="flex-1 px-4 py-2.5 rounded-xl bg-gray-800/50 border border-gray-700/50 text-white placeholder:text-gray-600 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/25 transition-all text-sm"
                />
                <button
                  onClick={handleChatSend}
                  disabled={!chatInput.trim() || chatLoading}
                  className="px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:bg-gray-700 disabled:text-gray-500 text-white transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Reusable components

function EmptyState({
  title,
  description,
  buttonLabel,
  onAction,
  icon,
}: {
  title: string;
  description: string;
  buttonLabel: string;
  onAction: () => void;
  icon: React.ReactNode;
}) {
  return (
    <div className="text-center py-16">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500/20 to-indigo-600/20 border border-violet-500/20 flex items-center justify-center mx-auto mb-5">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-gray-400 mb-6 max-w-md mx-auto">{description}</p>
      <button
        onClick={onAction}
        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-medium transition-all shadow-lg shadow-violet-600/25"
      >
        <Sparkles className="w-4 h-4" />
        {buttonLabel}
      </button>
    </div>
  );
}

function LoadingState({ label }: { label: string }) {
  return (
    <div className="text-center py-20">
      <Loader2 className="w-10 h-10 text-violet-400 animate-spin mx-auto mb-4" />
      <p className="text-gray-400 animate-pulse-glow">{label}</p>
      <p className="text-xs text-gray-600 mt-2">
        This may take a few seconds...
      </p>
    </div>
  );
}
