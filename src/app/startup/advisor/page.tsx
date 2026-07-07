'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/context/AppContext';
import {
  Bot,
  User,
  Send,
  Loader2,
  Globe2,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Sparkles,
  HelpCircle
} from 'lucide-react';
import { toast } from 'sonner';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  // Extracted metrics returned from RAG response for rendering cards
  advisorData?: {
    country: string;
    availableDocs: string[];
    missingDocs: string[];
    estimatedScore: number;
    nextSteps: string[];
  };
}

const PRESET_QUERIES = [
  { label: 'Expand to Germany 🇩🇪', text: 'I want to expand my startup to Germany. What are the rules?' },
  { label: 'USA Compliance 🇺🇸', text: 'What is required for Delaware incorporation and US tax compliance?' },
  { label: 'Singapore ACRA 🇸🇬', text: 'How do I fulfill compliance requirements to expand to Singapore?' },
  { label: 'UAE Freezone 🇦🇪', text: 'What are the compliance rules for setting up in Dubai/UAE?' },
];

export default function StartupAdvisor() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `Hello! I am your **AI Compliance Advisor**. 

I can query our **Global Compliance Knowledge Base** and audit your current verified Compliance Passport against regulatory rules in key expansion countries: **India, USA, Germany, Singapore, and UAE**.

Ask me a question or click one of the suggestions below to analyze compliance gaps.`,
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto scroll chat
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    // Add user message
    const userMsg: Message = { role: 'user', content: textToSend };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: textToSend }),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Add assistant message
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: data.answer,
            advisorData: data.country
              ? {
                  country: data.country,
                  availableDocs: data.availableDocs,
                  missingDocs: data.missingDocs,
                  estimatedScore: data.estimatedScore,
                  nextSteps: data.nextSteps,
                }
              : undefined,
          },
        ]);
      } else {
        const err = await response.json();
        throw new Error(err.message || 'Advisor error');
      }
    } catch (error: any) {
      toast.error(error.message || 'Connection to Advisor failed');
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'I encountered an error trying to process your compliance audit request. Please verify the target country query and try again.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 flex flex-col h-[calc(100vh-100px)]">
      {/* Title */}
      <div className="space-y-1 shrink-0">
        <h1 className="text-3xl font-extrabold tracking-tight">AI Compliance Advisor</h1>
        <p className="text-xs text-muted-foreground font-medium">
          Retrieval Augmented Generation (RAG) agent assisting startups with cross-border compliance mapping
        </p>
      </div>

      {/* Suggestion Chips */}
      <div className="flex flex-wrap gap-2.5 shrink-0">
        {PRESET_QUERIES.map((q) => (
          <button
            key={q.label}
            onClick={() => handleSend(q.text)}
            disabled={loading}
            className="text-xs bg-card/40 hover:bg-neutral-800/40 light:hover:bg-neutral-200/50 border border-border/40 rounded-xl px-3 py-2 transition-all font-semibold text-foreground flex items-center space-x-1.5"
          >
            <HelpCircle className="h-3.5 w-3.5 text-primary" />
            <span>{q.label}</span>
          </button>
        ))}
      </div>

      {/* Chat Conversation Area */}
      <div className="flex-1 min-h-0 bg-card/20 border border-border/40 rounded-3xl p-4 md:p-6 flex flex-col justify-between">
        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto space-y-6 pr-2">
          {messages.map((m, idx) => {
            const isAI = m.role === 'assistant';
            return (
              <div key={idx} className="space-y-3">
                {/* Chat Bubble */}
                <div className={`flex items-start gap-3.5 ${isAI ? 'justify-start' : 'justify-end'}`}>
                  {isAI && (
                    <div className="h-8 w-8 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center text-primary shrink-0">
                      <Bot className="h-4.5 w-4.5" />
                    </div>
                  )}

                  <div className={`p-4 rounded-3xl max-w-xl text-xs leading-relaxed ${
                    isAI
                      ? 'bg-card/60 border border-border/40 text-foreground'
                      : 'bg-primary text-primary-foreground font-medium ml-12'
                  }`}>
                    {/* Simplified markdown parser for bold and lists */}
                    <div className="space-y-2 whitespace-pre-wrap">
                      {m.content.split('\n').map((para, pIdx) => {
                        let parsed = para;
                        
                        // Parse bold **text**
                        const boldRegex = /\*\*(.*?)\*\*/g;
                        const parts = [];
                        let lastIndex = 0;
                        let match;
                        
                        while ((match = boldRegex.exec(parsed)) !== null) {
                          if (match.index > lastIndex) {
                            parts.push(parsed.substring(lastIndex, match.index));
                          }
                          parts.push(<strong key={match.index} className="font-bold text-foreground dark:text-white">{match[1]}</strong>);
                          lastIndex = boldRegex.lastIndex;
                        }
                        if (lastIndex < parsed.length) {
                          parts.push(parsed.substring(lastIndex));
                        }

                        const contentElement = parts.length > 0 ? parts : parsed;

                        if (para.startsWith('###')) {
                          return <h4 key={pIdx} className="text-sm font-extrabold text-foreground mt-4 pb-1 border-b border-border/20">{para.replace('###', '')}</h4>;
                        }
                        if (para.startsWith('* **')) {
                          return <p key={pIdx} className="pl-4 list-item">{contentElement}</p>;
                        }
                        if (para.startsWith('* ')) {
                          return <p key={pIdx} className="pl-4 list-item">{contentElement}</p>;
                        }
                        if (/^\d+\./.test(para)) {
                          return <p key={pIdx} className="pl-4">{contentElement}</p>;
                        }
                        return <p key={pIdx}>{contentElement}</p>;
                      })}
                    </div>
                  </div>

                  {!isAI && (
                    <div className="h-8 w-8 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-300 shrink-0">
                      <User className="h-4.5 w-4.5" />
                    </div>
                  )}
                </div>

                {/* Structured RAG Match Cards */}
                {isAI && m.advisorData && (
                  <div className="pl-12 grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl animate-in fade-in zoom-in-95 duration-300">
                    {/* Score Card */}
                    <div className="bg-card/40 border border-border/40 rounded-3xl p-4 space-y-3.5">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] text-zinc-500 uppercase font-semibold">GCP Audit Rating</span>
                        <Globe2 className="h-4 w-4 text-indigo-400" />
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-3xl font-extrabold text-foreground">
                          {m.advisorData.estimatedScore}%
                        </div>
                        <div className="flex-1 bg-border/40 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-indigo-500 h-full rounded-full"
                            style={{ width: `${m.advisorData.estimatedScore}%` }}
                          />
                        </div>
                      </div>
                      <p className="text-[10px] text-muted-foreground leading-normal">
                        Your Compliance Passport is **{m.advisorData.estimatedScore}%** audit-ready for expansion to **{m.advisorData.country}**.
                      </p>
                    </div>

                    {/* Gaps Checklist */}
                    <div className="bg-card/40 border border-border/40 rounded-3xl p-4 space-y-3">
                      <span className="text-[10px] text-zinc-500 uppercase font-semibold">Document Gap Analysis</span>
                      <div className="space-y-1.5 text-[10px] leading-tight">
                        {m.advisorData.availableDocs.map((doc) => (
                          <div key={doc} className="flex items-center space-x-1.5 text-emerald-400 font-medium">
                            <CheckCircle className="h-3 w-3" />
                            <span>{doc} (Verified)</span>
                          </div>
                        ))}
                        {m.advisorData.missingDocs.map((doc) => (
                          <div key={doc} className="flex items-center space-x-1.5 text-amber-500 font-semibold">
                            <AlertTriangle className="h-3 w-3" />
                            <span>{doc} (Missing)</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {loading && (
            <div className="flex items-start gap-3.5">
              <div className="h-8 w-8 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center text-primary shrink-0">
                <Bot className="h-4.5 w-4.5" />
              </div>
              <div className="p-4 rounded-3xl bg-card/60 border border-border/40 text-xs flex items-center text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-2 text-primary" />
                Querying compliance knowledge base...
              </div>
            </div>
          )}
          <div ref={scrollRef} />
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend(input);
          }}
          className="mt-4 flex gap-2 border-t border-border/40 pt-4 shrink-0"
        >
          <input
            type="text"
            required
            disabled={loading}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a compliance query, e.g. 'What documents are required to expand to UAE?'"
            className="flex-1 text-xs rounded-xl border border-border bg-zinc-950/40 px-4 py-3 outline-none focus:border-primary text-foreground disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="inline-flex items-center justify-center bg-primary hover:bg-primary/95 text-primary-foreground rounded-xl w-11 h-11 shrink-0 transition-colors disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
