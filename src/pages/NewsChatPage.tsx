import React from 'react';
import { NewsHeader } from '../components/news/NewsHeader';
import { Button } from '../../components/ui/Button';
import { chatAboutNews } from '../lib/newsApi';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

export const NewsChatPage: React.FC = () => {
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [input, setInput] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const scrollRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (!scrollRef.current) {
      return;
    }
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isLoading]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) {
      return;
    }

    setInput('');
    setError(null);
    const userMessage: ChatMessage = {
      role: 'user',
      content: trimmed,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const data = await chatAboutNews(trimmed);
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: `${data.reply} ${data.follow_up}`,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to reach news chat.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown: React.KeyboardEventHandler<HTMLTextAreaElement> = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="px-6 pt-28 pb-12 sm:px-10 lg:px-16">
        <div className="mx-auto max-w-5xl space-y-6">
          <NewsHeader
            title="Ask about GymUnity News"
            subtitle="Chat with the pipeline stub to preview future news Q&A."
          />

          <div className="flex min-h-[520px] flex-col rounded-3xl border border-white/10 bg-white/5 backdrop-blur-md">
            <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-6 py-6">
              {messages.length === 0 && !isLoading && (
                <div className="rounded-2xl border border-white/10 bg-black/40 p-4 text-sm text-white/70">
                  Ask anything about training trends, nutrition, or recovery.
                </div>
              )}
              {messages.map((message, index) => (
                <div
                  key={`${message.createdAt}-${index}`}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                      message.role === 'user'
                        ? 'bg-mindrift-green text-gray-900'
                        : 'bg-black/60 text-white'
                    }`}
                  >
                    {message.content}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="rounded-2xl bg-black/60 px-4 py-3 text-sm text-white/60">
                    Thinking...
                  </div>
                </div>
              )}
            </div>

            {error && (
              <div className="mx-6 mb-4 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {error}
              </div>
            )}

            <div className="border-t border-white/10 px-6 py-5">
              <div className="flex items-end gap-3">
                <textarea
                  rows={2}
                  className="min-h-[48px] flex-1 resize-none rounded-2xl border border-white/10 bg-black/70 px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-mindrift-green/40"
                  placeholder="Ask about the latest fitness news..."
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={handleKeyDown}
                />
                <Button
                  className="h-12 px-6 text-sm !bg-mindrift-green !hover:bg-mindrift-greenHover"
                  onClick={handleSend}
                  disabled={isLoading || !input.trim()}
                >
                  Send
                </Button>
              </div>
              <div className="mt-2 text-xs text-white/50">
                Press Enter to send, Shift+Enter for a new line.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
