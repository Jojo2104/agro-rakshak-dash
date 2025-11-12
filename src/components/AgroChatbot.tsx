import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Leaf, Send, Loader2 } from "lucide-react";

const AgroChatbot = () => {
  const [messages, setMessages] = useState([
    { sender: 'bot', text: "Hi there! I'm Agro, your plant care assistant. Ask me anything about farming or gardening! 🌱" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [error, setError] = useState('');
  const chatWindowRef = useRef(null);

  // TODO: SECURITY WARNING - Move this to environment variables or backend proxy
const API_KEY = "AIzaSyCMI-y1rVSBw9nSjvr_BA5k_U2JP27n3RU";
  const systemPrompt = `You are 'AgroRakshak,' a friendly and knowledgeable AI assistant for small-scale and backyard farmers. Your name is Agro.

**Your Mission:** Provide practical, easy-to-understand advice on plant care, pest control, sustainable farming, and gardening tips.

**Your Tone:** Encouraging, patient, and clear.

**Rules:**
1. Always stay on the topic of farming and gardening.
2. If a user asks about something unrelated (like movies or politics), politely steer them back by saying, 'I'm an expert in plants! How can I help with your garden today?'
3. Keep answers concise and use bullet points when helpful.
4. If you don't know an answer, say 'I'm not sure about that, but I can help with other farming questions.'`;

  const scrollToBottom = () => {
    setTimeout(() => {
      if (chatWindowRef.current) {
        chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
      }
    }, 100);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, suggestions, isLoadingSuggestions]);

  const getSuggestedQuestions = async (lastBotResponse) => {
    if (isLoadingSuggestions) return;
    setIsLoadingSuggestions(true);
    setSuggestions([]);

    const suggestionsPrompt = `Based on this answer: "${lastBotResponse}", suggest exactly 3 short, relevant follow-up questions a small-scale farmer might ask. Output only the questions, each on a new line, starting with '*'`;

const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;
    const payload = {
      contents: [{ parts: [{ text: suggestionsPrompt }] }],
      safetySettings: [
        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
      ],
      generationConfig: {
        temperature: 0.5,
        maxOutputTokens: 100,
      }
    };

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error(`HTTP error ${response.status}`);

      const result = await response.json();

      if (result.candidates && result.candidates[0]?.content?.parts?.[0]?.text) {
        const suggestionsText = result.candidates[0].content.parts[0].text;
        const questions = suggestionsText
          .split('\n')
          .map(line => line.trim().replace(/^[\*-]\s*/, ''))
          .filter(q => q.length > 0 && q.length < 100);

        setSuggestions(questions.slice(0, 3));
      }
    } catch (error) {
      console.error('Suggestions API call failed:', error);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  const sendMessage = async (messageText) => {
  if (!messageText.trim() || isLoading) return;

  const userMessage = messageText.trim();
  setMessages(prev => [...prev, { sender: 'user', text: userMessage }]);
  setInput('');
  setIsLoading(true);
  setError('');
  setSuggestions([]);

  const newHistory = [...chatHistory, { role: "user", parts: [{ text: userMessage }] }];
  setChatHistory(newHistory);

  // USE THE EXACT SAME MODEL AS YOUR HTML FILE
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;

  const payload = {
    contents: newHistory,
    systemInstruction: {
      parts: [{ text: systemPrompt }]
    },
    safetySettings: [
      { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
      { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
      { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
      { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
    ],
    generationConfig: {
      temperature: 0.7,
      topP: 0.95,
      maxOutputTokens: 2048,
    }
  };

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    
    console.log('API Response:', result); // DEBUG LOG

    if (!response.ok) {
      console.error('API Error:', result); // DEBUG LOG
      throw new Error(result?.error?.message || `HTTP error ${response.status}`);
    }

    if (result.candidates && result.candidates[0]?.content?.parts?.[0]?.text) {
      const botResponse = result.candidates[0].content.parts[0].text;
      setMessages(prev => [...prev, { sender: 'bot', text: botResponse }]);
      setChatHistory([...newHistory, { role: "model", parts: [{ text: botResponse }] }]);
      getSuggestedQuestions(botResponse);
    } else if (result.promptFeedback?.blockReason) {
      setError(`Request blocked: ${result.promptFeedback.blockReason}`);
      setChatHistory(chatHistory);
    } else {
      setError("Unexpected response from API");
      setChatHistory(chatHistory);
    }
  } catch (error) {
    console.error('Full API call error:', error);
    setError(error.message || "Failed to get response");
    setChatHistory(chatHistory);
  } finally {
    setIsLoading(false);
  }
};

  const handleSend = () => {
    sendMessage(input);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearChat = () => {
    setMessages([
      { sender: 'bot', text: "Hi there! I'm Agro, your plant care assistant. Ask me anything about farming or gardening! 🌱" }
    ]);
    setChatHistory([]);
    setSuggestions([]);
    setError('');
  };

  const formatMessage = (text) => {
    let formatted = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    formatted = formatted.replace(/^([*-] )(.*$)/gm, '<li>$2</li>');
    formatted = formatted.replace(/(<li>.*<\/li>\n?)+/g, '<ul class="list-disc list-inside ml-4 my-2">$&</ul>');
    return formatted;
  };

  return (
    <Card className="flex flex-col h-[calc(90vh-200px)] border-border/50">
      {/* Chat Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white p-4 flex items-center justify-between rounded-t-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <Leaf className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">AgroRakshak AI Assistant</h3>
            <p className="text-xs text-emerald-100">Powered by Gemini AI</p>
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={clearChat}
          className="text-white hover:bg-white/20"
        >
          Clear Chat
        </Button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-3 mx-4 mt-4 rounded">
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Chat Window */}
      <div 
        ref={chatWindowRef}
        className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50"
      >
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] px-4 py-2 rounded-2xl shadow-sm ${
                msg.sender === 'user'
                  ? 'bg-emerald-500 text-white rounded-br-sm'
                  : 'bg-white border border-gray-200 text-gray-800 rounded-bl-sm'
              }`}
            >
              <div 
                className="text-sm leading-relaxed"
                dangerouslySetInnerHTML={{ __html: formatMessage(msg.text) }}
              />
            </div>
          </div>
        ))}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 px-4 py-3 rounded-2xl rounded-bl-sm shadow-sm">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Suggested Questions */}
      {(suggestions.length > 0 || isLoadingSuggestions) && (
        <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
          {isLoadingSuggestions ? (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Suggesting questions...</span>
            </div>
          ) : (
            <>
              <p className="text-xs font-medium text-gray-600 mb-2">Ask Agro next:</p>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => sendMessage(q)}
                    className="px-3 py-1.5 text-xs bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-full border border-emerald-300 transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Input Area */}
      <div className="p-4 border-t border-gray-200 bg-white rounded-b-lg">
        <div className="flex items-center gap-2">
          <Input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            disabled={isLoading}
            className="flex-1 border-gray-300 focus:ring-emerald-500 focus:border-emerald-500"
          />
          <Button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="bg-emerald-600 hover:bg-emerald-700"
            size="icon"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default AgroChatbot;