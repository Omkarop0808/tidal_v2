import { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  Send, 
  X, 
  Bot, 
  User,
  Square,
  AlertTriangle
} from 'lucide-react';
import { useSim } from '../../store';

interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string;
}

const suggestedPrompts = [
  "BEACHING RISK AT VERSOVA?",
  "HUNGARIAN FLEET OPTIMIZER?",
  "EXPLAIN DRIFT MODEL.",
  "CHECK EPR CERTIFICATES"
];

export const OceanGPTWidget = () => {
  const activeMission = useSim(state => state.activeMission);
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', sender: 'bot', text: "WELCOME TO TIDAL TACTICAL COMMAND. I AM OCEAN-GPT, YOUR MARITIME INTELLIGENCE COPILOT. AWAITING QUERY." }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const sendMessage = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    const newUserMsg: Message = { id: Date.now().toString(), sender: 'user', text: textToSend };
    setMessages(prev => [...prev, newUserMsg]);
    setInputValue('');
    setIsLoading(true);

    try {
      const { api } = await import('../../lib/api');
      const res = await api.chat(textToSend);
      const newBotMsg: Message = { id: (Date.now() + 1).toString(), sender: 'bot', text: res.response.toUpperCase() };
      setMessages(prev => [...prev, newBotMsg]);
    } catch (error) {
      console.error('Error sending message to Ocean-GPT:', error);
      const errorMsg: Message = { 
        id: (Date.now() + 1).toString(), 
        sender: 'bot', 
        text: "DIRECT LINK OFFLINE. FALLBACK RESPONSE: ACTIVE HOTSPOT IS VERSOVA (ZONE A) WITH 420KG PREDICTED. 3 SKIMMERS ON STANDBY." 
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputValue);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {isOpen && (
        <div className="mb-4 w-[360px] sm:w-[420px] h-[540px] max-h-[82vh] flex flex-col bg-black border-2 border-white shadow-2xl overflow-hidden transition-none origin-bottom-right">
          
          {/* Dialog Header */}
          <div className="flex items-center justify-between p-4 px-5 border-b-2 border-white bg-[#111111]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white flex items-center justify-center text-black">
                <Sparkles className="w-6 h-6" />
              </div>
              <div className="flex flex-col">
                <h3 className="text-white font-headline font-black text-sm uppercase tracking-tighter flex items-center gap-2">
                  OCEAN-GPT
                  <span className="text-[9px] font-mono px-2 py-0.5 bg-white text-black font-bold tracking-widest border-2 border-white">AGENT</span>
                </h3>
                <p className="text-[#a3a3a3] text-[9px] font-mono uppercase font-bold tracking-widest">TACTICAL COPILOT // ONLINE</p>
              </div>
            </div>

            <button 
              onClick={() => setIsOpen(false)}
              className="w-10 h-10 bg-black hover:bg-white text-white hover:text-black flex items-center justify-center transition-none border-2 border-[#333333] hover:border-white"
              aria-label="Close Ocean-GPT"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 bg-black">
            {activeMission && (
              <div className="p-3 bg-[#111111] border-2 border-[#ff4d00] flex flex-col gap-2 shrink-0">
                <div className="flex items-center justify-between text-[9px] font-mono font-bold uppercase tracking-widest text-[#ff4d00]">
                  <span className="flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    TACTICAL ADVISORY // {activeMission.zoneName.split(' ')[0].toUpperCase()}
                  </span>
                  <span className="bg-[#ff4d00] text-black px-1.5 py-0.5">{activeMission.riskScore}% RISK</span>
                </div>
                <p className="text-[9px] font-mono text-[#a3a3a3] uppercase leading-relaxed font-bold">
                  PREDICTED INFLOW: <strong className="text-white">{activeMission.debrisKg} KG</strong>. SQUAD COUNTERMEASURES ENGAGED.
                </p>
                <button
                  onClick={() => sendMessage(`WHAT IS THE OPTIMAL INTERCEPTION STRATEGY FOR ${activeMission.zoneName.split(' ')[0].toUpperCase()}?`)}
                  className="self-start text-[8px] font-mono text-black bg-white hover:bg-[#ff4d00] px-2 py-1 font-bold uppercase tracking-wider flex items-center gap-1 transition-none"
                >
                  <span>QUERY MITIGATION →</span>
                </button>
              </div>
            )}

            {messages.map((msg) => {
              const isUser = msg.sender === 'user';
              return (
                <div 
                  key={msg.id} 
                  className={`flex gap-3 max-w-[90%] ${isUser ? 'self-end flex-row-reverse' : 'self-start'}`}
                >
                  <div className={`w-8 h-8 flex items-center justify-center shrink-0 border-2 ${
                    isUser 
                      ? 'bg-white text-black border-white' 
                      : 'bg-[#111111] text-white border-[#333333]'
                  }`}>
                    {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>

                  <div 
                    className={`p-4 text-[10px] font-mono font-bold tracking-widest leading-relaxed uppercase border-2 ${
                      isUser 
                        ? 'bg-white text-black border-white' 
                        : 'bg-[#111111] text-white border-[#333333]'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                  </div>
                </div>
              );
            })}

            {isLoading && (
              <div className="flex items-center gap-3 self-start max-w-[85%]">
                <div className="w-8 h-8 bg-[#111111] text-white border-2 border-[#333333] flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="p-4 bg-[#111111] border-2 border-[#333333] flex items-center gap-2">
                  <span className="w-2 h-2 bg-white animate-pulse"></span>
                  <span className="w-2 h-2 bg-white animate-pulse" style={{ animationDelay: '0.2s' }}></span>
                  <span className="w-2 h-2 bg-white animate-pulse" style={{ animationDelay: '0.4s' }}></span>
                  <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-[#a3a3a3] ml-2">PROCESSING...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Prompts */}
          {messages.length <= 2 && (
            <div className="px-4 pb-4 flex flex-col gap-2 bg-black border-t-2 border-[#333333] pt-4">
              <span className="text-[10px] font-mono uppercase font-bold text-[#a3a3a3] tracking-widest flex items-center gap-2">
                <Square className="w-2 h-2 fill-current" /> SUGGESTED QUERIES
              </span>
              <div className="flex flex-wrap gap-2">
                {suggestedPrompts.map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(prompt)}
                    className="px-3 py-2 bg-[#111111] hover:bg-white text-[#a3a3a3] hover:text-black text-[9px] font-mono font-bold tracking-widest uppercase border-2 border-[#333333] hover:border-white text-left transition-none"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Form */}
          <div className="p-4 border-t-2 border-white bg-[#111111]">
            <form onSubmit={handleSendMessage} className="flex items-center gap-3">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="ENTER TACTICAL QUERY..."
                className="flex-1 bg-black border-2 border-[#333333] px-4 py-3 text-white placeholder:text-[#525252] focus:outline-none focus:border-white transition-none text-[10px] font-mono font-bold tracking-widest uppercase"
                disabled={isLoading}
              />
              <button 
                type="submit"
                disabled={!inputValue.trim() || isLoading}
                className="w-12 h-12 bg-white hover:bg-[#ff4d00] text-black border-2 border-white hover:border-[#ff4d00] flex items-center justify-center transition-none disabled:opacity-40 disabled:bg-[#333333] disabled:text-[#525252] flex-shrink-0"
                aria-label="Send message"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-16 h-16 flex items-center justify-center transition-none border-2 shadow-2xl ${
          isOpen 
            ? 'bg-[#111111] text-white border-white' 
            : 'bg-white text-black border-black hover:bg-[#ff4d00] hover:border-[#ff4d00]'
        }`}
        aria-label="Open Ocean-GPT Assistant"
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <Bot className="w-8 h-8" />
        )}
      </button>
    </div>
  );
};

export default OceanGPTWidget;
