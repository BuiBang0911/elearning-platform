import React, { useState } from 'react';
import { 
  FiMenu, FiX, FiSend, FiPaperclip, FiMaximize2, FiMinimize2 
} from 'react-icons/fi';
import { FaBookOpen, FaMagic } from 'react-icons/fa';
import { HiSparkles } from 'react-icons/hi';

interface ChatbotProps {
  open: boolean;
  onClose: () => void;
}   

const Chatbot = ({ open, onClose }: ChatbotProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false); // Mặc định đóng sidebar vì popup hẹp
  const [isExpanded, setIsExpanded] = useState(false); // State để phóng to popup nếu cần


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
            className="text-blue-100 hover:text-white transition-colors"
          >
            <FiMenu size={20} />
          </button>
          
          <div className="flex items-center gap-2 text-white">
            <FaBookOpen size={16} />
            <h1 className="font-bold text-sm">StudyMate AI</h1>
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          {/* Nút Phóng to / Thu nhỏ */}
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 text-blue-100 hover:text-white hover:bg-blue-500 rounded-lg transition-colors"
            title={isExpanded ? "Thu nhỏ" : "Mở rộng"}
          >
            {isExpanded ? <FiMinimize2 size={16} /> : <FiMaximize2 size={16} />}
          </button>

          {/* Nút Đóng */}
          <button 
            onClick={onClose}
            className="p-1.5 text-blue-100 hover:text-white hover:bg-blue-500 rounded-lg transition-colors"
          >
            <FiX size={20} />
          </button>
        </div>
      </header>

      {/* ================= BODY CONTAINER ================= */}
      <div className="flex-1 flex relative overflow-hidden bg-white">
        
        {/* --- SIDEBAR (Dạng trượt - Absolute) --- */}
        <aside className={`
          absolute inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-100 shadow-xl transform transition-transform duration-300 ease-in-out flex flex-col
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <div className="p-3 border-b border-gray-100 flex justify-between items-center bg-gray-50">
            <span className="text-xs font-bold text-gray-500 uppercase">Lịch sử</span>
            <button onClick={() => setSidebarOpen(false)} className="text-gray-400 hover:text-gray-600"><FiX size={16}/></button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors truncate">
              Giải tích 12 - Tích phân
            </button>
            <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors truncate">
              Lập trình React cơ bản
            </button>
          </div>

          <div className="p-3 border-t border-gray-100">
             <button className="w-full flex items-center justify-center gap-2 bg-blue-50 text-blue-600 py-2 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors">
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


        {/* --- CHAT CONTENT --- */}
        <div className="flex-1 flex flex-col h-full w-full">
          
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth bg-gray-50/50">
            
            {/* Tin nhắn Bot */}
            <div className="flex gap-2">
              <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white shrink-0 mt-1">
                <FaMagic size={10} />
              </div>
              <div className="max-w-[85%] bg-white border border-gray-200 px-3 py-2.5 rounded-2xl rounded-tl-none shadow-sm text-sm text-gray-800">
                <p>Chào bạn! Mình là trợ lý học tập. Bạn cần giúp gì hôm nay?</p>
              </div>
            </div>

            {/* Tin nhắn User */}
            <div className="flex justify-end">
               <div className="max-w-[85%] bg-blue-600 text-white px-3 py-2.5 rounded-2xl rounded-tr-none shadow-sm text-sm">
                <p>Giải thích giúp mình khái niệm Redux với.</p>
              </div>
            </div>

             {/* Tin nhắn Bot (Code) */}
             <div className="flex gap-2">
              <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white shrink-0 mt-1">
                <FaMagic size={10} />
              </div>
              <div className="max-w-[85%] bg-white border border-gray-200 px-3 py-2.5 rounded-2xl rounded-tl-none shadow-sm text-sm text-gray-800">
                <p className="mb-2">Redux là một thư viện quản lý state.</p>
                <div className="bg-gray-900 rounded-md p-2 overflow-x-auto">
                  <code className="font-mono text-xs text-green-400">const store = createStore(reducer);</code>
                </div>
              </div>
            </div>

          </div>

          {/* Input Area */}
          <div className="p-3 bg-white border-t border-gray-200">
            <div className="relative">
              <textarea 
                className="w-full bg-gray-100 border-none rounded-xl px-3 py-2 pr-10 text-sm focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all resize-none max-h-24 min-h-[44px] focus:outline-none"
                placeholder="Nhập câu hỏi..."
                rows={1}
              />
              <div className="absolute right-1 bottom-3 flex items-center">
                 <button className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors">
                  <FiPaperclip size={16} />
                 </button>
                 <button className="p-1.5 bg-blue-600 text-white rounded-lg ml-1 hover:bg-blue-700 transition-colors">
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