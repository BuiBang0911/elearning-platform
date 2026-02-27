import React, { useEffect, useRef, useState } from 'react';
import {
  FiMenu, FiX, FiSend, FiPaperclip, FiMaximize2, FiMinimize2,
  FiTrash2
} from 'react-icons/fi';
import { FaBookOpen, FaMagic } from 'react-icons/fa';
import { HiSparkles } from 'react-icons/hi';
import type { ChatSessionResponse } from '../../interfaces/ChatSession';
import { createNewChat, DeleteChatSession, getAll } from '../../api/ChatSession.api';
import { getBySessionId, sendMessageToAskAi } from '../../api/ChatMessage.api';
import type { ChatMessageResponse } from '../../interfaces/ChatMessage';
import FormatMarkdown from '../FormatString/FormatMarkdown';

interface ChatbotProps {
  open: boolean;
  onClose: () => void;
}

const Chatbot = ({ open, onClose }: ChatbotProps) => {
  const ref = useRef<HTMLParagraphElement>(null);

  const [sidebarOpen, setSidebarOpen] = useState(false); // Mặc định đóng sidebar vì popup hẹp
  const [isExpanded, setIsExpanded] = useState(false); // State để phóng to popup nếu cần
  const [liChatSessions, setLiChatSessions] = useState<ChatSessionResponse[]>([]);
  const [liChatMessages, setLiChatMessages] = useState<ChatMessageResponse[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);

  const bottomRef = useRef<HTMLDivElement | null>(null);


  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await getAll();
        setLiChatSessions(res);
      } catch (err) {
        console.error("Failed to fetch chat sessions:", err);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [liChatMessages]);

  const OpenDetailChatSession = async (id: number) => {
    try {
      setSidebarOpen(false);
      const res = await getBySessionId(id);
      setCurrentSessionId(id);
      setLiChatMessages(res);

    } catch (err) {
      console.error("Failed to fetch chat messages:", err);
    }
  };

  const CreateNewChat = () => {
    setCurrentSessionId(null);
    setLiChatMessages([]);
    setSidebarOpen(false);
  }

  const handleSend = async () => {
    let sessionId = currentSessionId;
    const text = ref.current?.innerText.trim();

    if (!currentSessionId) {
      const session = await createNewChat()
      sessionId = session.id;
      setCurrentSessionId(session.id)
      setLiChatSessions(prev => [...prev, session])
    }

    if (!text) return;

    const tempAssistantId = Date.now();

    setLiChatMessages(prev => [
      ...prev,
      {
        id: tempAssistantId,
        role: "User",
        content: text,
        createdAt: new Date().toISOString()
      },
      {
        id: tempAssistantId + 1,
        role: "AiAssistant",
        content: "Đang suy nghĩ...",
        createdAt: new Date().toISOString()
      }
    ]);
    try {
      const res = await sendMessageToAskAi(sessionId!, text);
      setLiChatMessages(prev =>
        prev.map(msg =>
          msg.id === tempAssistantId + 1 ? res : msg
        )
      );
    } catch (err) {
      console.error(err);
    }
  };

  const onDeleteChatSession = async (id: number) => {
    try {
      await DeleteChatSession(id);
      setLiChatSessions(prev => prev.filter(session => session.id !== id));
      if (currentSessionId === id) {
        setCurrentSessionId(null);
        setLiChatMessages([]);
      }
    } catch (err) {
      console.error("Failed to delete chat session:", err);
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLParagraphElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault(); // ❗ chặn xuống dòng

      handleSend();
      // clear nội dung
      if (ref.current) {
        ref.current.innerText = "";
      }
    }
  };

  return (
    <div
      className={`
        fixed z-[9999] bg-white shadow-2xl border border-gray-200 rounded-2xl overflow-hidden flex flex-col font-sans
        transition-all duration-200 ease-out origin-bottom-right
        ${isExpanded
          ? 'bottom-6 right-32 w-[90vw] h-[90vh] md:w-[800px] md:h-[700px]'
          : 'bottom-6 right-32 w-[360px] h-[550px]'
        }
        ${open
          ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto visible'
          : 'opacity-0 scale-50 translate-y-12 pointer-events-none invisible'
        }
    `}
    >

      {/* ================= HEADER ================= */}
      <header className="h-14 bg-blue-600 flex items-center justify-between px-4 shrink-0 shadow-sm z-20">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-blue-100 hover:text-white hover:cursor-pointer transition-colors"
          >
            <FiMenu size={20} />
          </button>

          <div className="flex items-center gap-2 text-white">
            <FaBookOpen size={16} />
            <h1 className="font-bold text-sm">{
              currentSessionId ? liChatSessions.find(s => s.id === currentSessionId)?.title || "Cuộc trò chuyện"
                : "Trợ lý học tập"
              }</h1>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 text-blue-100 hover:text-white hover:bg-blue-500 rounded-lg transition-colors"
            title={isExpanded ? "Thu nhỏ" : "Mở rộng"}
          >
            {isExpanded ? <FiMinimize2 size={16} /> : <FiMaximize2 size={16} />}
          </button>

          <button
            onClick={onClose}
            className="p-1.5 text-blue-100 hover:text-white hover:bg-blue-500 rounded-lg transition-colors"
          >
            <FiX size={20} />
          </button>
        </div>
      </header>

      <div className="flex-1 flex relative overflow-hidden bg-white">
        <aside className={`
          absolute inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-100 shadow-xl transform transition-transform duration-300 ease-in-out flex flex-col
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <div className="p-3 border-b border-gray-100 flex justify-between items-center bg-gray-50">
            <span className="text-xs font-bold text-gray-500 uppercase">Lịch sử</span>
            <button onClick={() => setSidebarOpen(false)} className="text-gray-400 hover:text-gray-600"><FiX size={16} /></button>
          </div>

          {/* chat session list */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {liChatSessions.map((session) => (
              <div 
                key={session.id}
                className="group relative flex items-center w-full px-3 py-2 rounded-lg hover:bg-blue-50 transition-colors"
              >
                {/* Nút chính để mở chat */}
                <button
                  className="flex-1 text-left text-sm text-gray-700 group-hover:text-blue-600 truncate mr-6 cursor-pointer"
                  onClick={() => OpenDetailChatSession(session.id)}
                >
                  {session.title}
                </button>
                <button
                  onClick={() => onDeleteChatSession(session.id)}
                  className="absolute right-2 p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 hover:cursor-pointer transition-opacity"
                >
                  <FiTrash2 size={16} /> 
                </button>
              </div>
            ))}
          </div>

          <div className="p-3 border-t border-gray-100">
            <button className="w-full flex items-center justify-center gap-2 bg-blue-50 text-blue-600 py-2 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors" onClick={() => CreateNewChat()}>
              <HiSparkles size={16} /> Chat mới
            </button>
          </div>
        </aside>

        {/* Overlay mờ khi mở sidebar (để bấm ra ngoài là đóng sidebar) */}
        {sidebarOpen && (
          <div
            className="absolute inset-0 bg-black/10 z-20"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <div className="flex-1 flex flex-col h-full w-full">
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth bg-gray-50/50">
            <div className="flex gap-2">
              <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white shrink-0 mt-1">
                <FaMagic size={10} />
              </div>
              <div className="max-w-[85%] bg-white border border-gray-200 px-3 py-2.5 rounded-2xl rounded-tl-none shadow-sm text-sm text-gray-800">
                <p>Chào bạn! Mình là trợ lý học tập. Bạn cần giúp gì hôm nay?</p>
              </div>
            </div>
            {liChatMessages.map((message) => {
              if (message.role === "User") {
                return (
                  <div key={message.id} className="flex justify-end">
                    <div className="max-w-[85%] bg-blue-600 text-white px-3 py-2.5 rounded-2xl rounded-tr-none shadow-sm text-sm">
                      <p>{message.content}</p>
                    </div>
                  </div>
                )
              }
              else return (
                <div key={message.id} className="flex gap-2">
                  <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white shrink-0 mt-1">
                    <FaMagic size={10} />
                  </div>
                  <div className="max-w-[85%] bg-white border border-gray-200 px-3 py-2.5 rounded-2xl rounded-tl-none shadow-sm text-sm text-gray-800">
                    <div className="mb-2"><FormatMarkdown content={message.content} /></div>
                    {/* <div className="bg-gray-900 rounded-md p-2 overflow-x-auto">
											<code className="font-mono text-xs text-green-400">const store = createStore(reducer);</code>
										</div> */}
                  </div>
                </div>
              )
            })}
            <div ref={bottomRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 bg-white border-t border-gray-200">
            <div className="relative">
              <div className="w-full bg-gray-100 rounded-xl px-3 py-2 focus-within:ring-2 focus-within:ring-blue-200">
                <p
                  ref={ref}
                  contentEditable
                  onKeyDown={handleKeyDown}
                  onInput={(e) => {
                    const el = e.currentTarget;
                    if (el.innerText.trim() === "") {
                      el.innerHTML = "";
                    }
                  }}
                  className="editable-placeholder outline-none text-sm min-h-[24px] whitespace-pre-wrap break-words"
                  data-placeholder="Nhập câu hỏi..."
                  suppressContentEditableWarning
                />
              </div>
              <div className="absolute right-1 bottom-1 flex items-center">
                <button className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors" >
                  <FiPaperclip size={16} />
                </button>
                <button className="p-1.5 bg-blue-600 text-white rounded-lg ml-1 hover:bg-blue-700 transition-colors" onClick={() => handleSend()}>
                  <FiSend size={14} />
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Chatbot;