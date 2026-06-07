import React, { useRef, useEffect } from 'react';
import { Send, User, Bot, MessageSquare } from 'lucide-react';
import { useAppState } from '../AppStateContext';
import API_BASE from '../apiBase';

export const ChatPage = () => {
  const { chatState: s, setChatState: set } = useAppState();
  const [input, setInput] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [s.messages, loading]);

  const handleSend = async (overrideInput?: string, overrideContext?: string) => {
    const finalInput = overrideInput || input;
    if (!finalInput.trim()) return;

    if (overrideContext) {
      set({ characterContext: overrideContext });
    }

    const userMessage = finalInput;
    set({ messages: [...s.messages, { role: 'user', text: userMessage }] });
    if (!overrideInput) setInput('');
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...s.messages, { role: 'user', text: userMessage }], characterContext: overrideContext || s.characterContext }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      set({ messages: [...s.messages, { role: 'user', text: userMessage }, { role: 'bot', text: data.result }] });
    } catch (error: any) {
      set({ messages: [...s.messages, { role: 'user', text: userMessage }, { role: 'bot', text: error.message || 'Sorry, my connection was interrupted.' }] });
    }
    setLoading(false);
  };

  const suggestedChats = [
    { name: "Gojo Satoru", context: "Gojo Satoru from Jujutsu Kaisen", prompt: "Explain the limitless cursed technique to me." },
    { name: "Naruto Uzumaki", context: "Naruto Uzumaki from Naruto", prompt: "What does it take to become Hokage?" },
    { name: "L", context: "L from Death Note", prompt: "How would you catch Kira today?" },
    { name: "Eren Yeager", context: "Eren Yeager from Attack on Titan", prompt: "Why do you keep moving forward?" }
  ];

  return (
    <div className="p-8 h-full flex flex-col">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h2 className="text-4xl font-bold text-gradient mb-2 flex items-center gap-3">
            <MessageSquare className="text-anime-primary" size={36} />
            AI Character Chat
          </h2>
          <p className="text-slate-300 mb-2">Chat with AniSensei or your favorite character.</p>
          <button
            onClick={() => set({ messages: [{ role: 'bot', text: 'Hello! I am AniSensei. I can roleplay as any character, or just chat about anime with you. Who would you like me to be?' }] })}
            className="text-xs px-3 py-1.5 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors font-medium"
          >
            Clear Chat
          </button>
        </div>
        <div className="w-64">
          <label className="block text-sm text-slate-400 mb-1 font-medium">Roleplay Character (Optional)</label>
          <input
            type="text"
            value={s.characterContext}
            onChange={(e) => set({ characterContext: e.target.value })}
            placeholder="e.g. Levi from Attack on Titan"
            className="glass-input text-sm py-2"
          />
        </div>
      </div>

      <div className="glass-panel flex-1 mb-6 p-6 overflow-y-auto flex flex-col gap-4">
        {s.messages.map((msg, i) => (
          <div key={i} className={`flex gap-4 max-w-[80%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}>
            <div className={`w-10 h-10 rounded-full shrink-0 flex items-center justify-center ${msg.role === 'user' ? 'bg-slate-700' : 'bg-gradient-to-br from-anime-primary to-anime-secondary'}`}>
              {msg.role === 'user' ? <User size={20} className="text-slate-300" /> : <Bot size={20} className="text-white" />}
            </div>
            <div className={`p-4 rounded-2xl ${msg.role === 'user' ? 'bg-slate-700/50 text-slate-200 rounded-tr-sm' : 'bg-anime-primary/20 text-slate-200 border border-anime-primary/30 rounded-tl-sm'}`}>
              <div className="whitespace-pre-wrap">{msg.text}</div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-4 max-w-[80%]">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-anime-primary to-anime-secondary flex items-center justify-center shrink-0">
              <Bot size={20} className="text-white" />
            </div>
            <div className="p-4 rounded-2xl bg-anime-primary/20 border border-anime-primary/30 rounded-tl-sm flex items-center gap-2">
              <div className="w-2 h-2 bg-anime-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 bg-anime-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 bg-anime-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
        {s.messages.length === 1 && !loading && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto w-full">
            <div className="col-span-full text-center mb-2">
              <h3 className="text-lg font-bold text-slate-200">Suggested Conversations</h3>
              <p className="text-sm text-slate-400">Click a character to start chatting!</p>
            </div>
            {suggestedChats.map(chat => (
              <button
                key={chat.name}
                onClick={() => handleSend(chat.prompt, chat.context)}
                className="text-left p-4 rounded-xl border border-slate-700/50 bg-slate-800/30 hover:bg-anime-primary/20 hover:border-anime-primary/40 transition-colors group"
              >
                <div className="font-bold text-slate-200 group-hover:text-anime-primary transition-colors">{chat.name}</div>
                <div className="text-sm text-slate-400 italic">"{chat.prompt}"</div>
              </button>
            ))}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="glass-panel p-2 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          className="flex-1 bg-transparent border-none text-slate-200 px-4 py-2 focus:outline-none placeholder-slate-500"
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
        />
        <button
          onClick={() => handleSend()}
          disabled={loading || !input.trim()}
          className="bg-anime-primary hover:bg-anime-secondary transition-colors text-white p-3 rounded-lg disabled:opacity-50"
        >
          <Send size={20} />
        </button>
      </div>
    </div>
  );
};
