import React, { useEffect, useRef, useState } from 'react';
import type { ChatSessionResponse } from '../../interfaces/ChatSession';
import type { ChatMessageResponse } from '../../interfaces/ChatMessage';
import FormatMarkdown from '../FormatString/FormatMarkdown';
import FullPageLoader from '../PostLoading/FullPageLoader';
import ChatSessionApi from '../../api/ChatSession.api';
import chatMessageApi from '../../api/ChatMessage.api';
import { BookOpen, ChevronDown, Maximize2, Menu, Minimize2, Pencil, Send, Sparkles, Trash2, Wand2, X } from 'lucide-react';
import enrrollementApi from '../../api/Enrollment';
import lessonApi from '../../api/Lesson.api';
import type { CourseResponse } from '../../interfaces/Course';
import type { LessonResponse } from '../../interfaces/Lesson';
import { useAuth } from '../../context/AuthContext';

import { toast } from 'sonner';

interface ChatbotProps {
  open: boolean;
  onClose: () => void;
}

const Chatbot = ({ open, onClose }: ChatbotProps) => {
  const ref = useRef<HTMLParagraphElement>(null);

  const [sidebarOpen, setSidebarOpen] = useState(false); // Mặc định đóng sidebar vì popup hẹp
  const [isExpanded, setIsExpanded] = useState(false); // State để phóng to popup nếu cần
  const [editingSessionId, setEditingSessionId] = useState<number | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const [liChatSessions, setLiChatSessions] = useState<ChatSessionResponse[]>([]);
  const [liChatMessages, setLiChatMessages] = useState<ChatMessageResponse[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false); // Trạng thái đang sinh câu trả lời

  const { user } = useAuth();
  const [enrolledCourses, setEnrolledCourses] = useState<CourseResponse[]>([]);
  const [lessons, setLessons] = useState<LessonResponse[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<number | "all">("all");
  const [selectedLessonId, setSelectedLessonId] = useState<number | "all">("all");

  const currentSession = liChatSessions.find(s => s.id === currentSessionId);
  const isLessonFixed = !!(currentSessionId && currentSession?.lessonId);


  const bottomRef = useRef<HTMLDivElement | null>(null);


  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await enrrollementApi.getMyCourses();
        setEnrolledCourses(res);
      } catch (err) {
        console.error("Failed to fetch enrolled courses:", err);
      }
    };
    if (open) fetchCourses();
  }, [open]);

  const loadLessonsForCourse = async (courseId: number | "all", targetLessonId: number | "all" = "all") => {
    if (typeof courseId === 'number') {
      try {
        const res = await lessonApi.getByCourseId(courseId);
        setLessons(res);
        setSelectedLessonId(targetLessonId);
      } catch (err) {
        console.error("Failed to fetch lessons:", err);
        setLessons([]);
        setSelectedLessonId("all");
      }
    } else {
      setLessons([]);
      setSelectedLessonId("all");
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const res = await ChatSessionApi.getAll();
        setLiChatSessions(res);
        setIsLoading(false);
      } catch (err) {
        console.error("Failed to fetch chat sessions:", err);
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [liChatMessages]);

  const OpenDetailChatSession = async (id: number) => {
    try {
      setIsLoading(true);
      setSidebarOpen(false);
      const res = await chatMessageApi.getBySessionId(id);
      setCurrentSessionId(id);
      setLiChatMessages(res);

      // Auto-select course and lesson based on session context
      const session = liChatSessions.find(s => s.id === id);
      if (session) {
        if (session.courseId) {
          setSelectedCourseId(session.courseId);
          await loadLessonsForCourse(session.courseId, session.lessonId || "all");
        } else {
          setSelectedCourseId("all");
          setSelectedLessonId("all");
          setLessons([]);
        }
      } else {
        setSelectedCourseId("all");
        setSelectedLessonId("all");
        setLessons([]);
      }

      setIsLoading(false);

    } catch (err) {
      console.error("Failed to fetch chat messages:", err);
      setIsLoading(false);
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

    if (selectedLessonId === "all") {
      toast.error("Vui lòng chọn một bài học cụ thể để đặt câu hỏi!");
      return;
    }

    if (!text) return;

    // Nếu là chat mới, tạo session và set ngữ cảnh lessonId
    if (!currentSessionId) {
      const session = await ChatSessionApi.createNewChat();
      sessionId = session.id;
      setCurrentSessionId(session.id);

      // Gán lessonId cho session mới
      if (typeof selectedLessonId === 'number') {
        await ChatSessionApi.update(sessionId!, {
          userId: user?.id || 0,
          title: "New Chat",
          lessonId: selectedLessonId
        });
      }

      setLiChatSessions(prev => [...prev, { ...session, lessonId: typeof selectedLessonId === 'number' ? selectedLessonId : undefined }]);
    }

    const userMsgId = Date.now();
    const aiMsgId = userMsgId + 1;

    // 1. Thêm tin nhắn tạm thời vào UI ngay lập tức
    const userMsg: ChatMessageResponse = {
      id: userMsgId,
      role: "User",
      content: text,
      createdAt: new Date().toISOString()
    };
    const aiMsg: ChatMessageResponse = {
      id: aiMsgId,
      role: "AiAssistant",
      content: "", // Trả về rỗng để hiện hiệu ứng "..."
      createdAt: new Date().toISOString()
    };

    setLiChatMessages(prev => [...prev, userMsg, aiMsg]);
    setIsGenerating(true);

    // Cập nhật title cục bộ và server cho session mới nếu đây là câu hỏi đầu tiên
    const currentSession = liChatSessions.find(s => s.id === sessionId);
    if (currentSession && (!currentSession.title || currentSession.title === "New Chat")) {
      const newTitle = text.length > 40 ? text.substring(0, 37) + "..." : text;
      setLiChatSessions(prev => prev.map(s =>
        s.id === sessionId ? { ...s, title: newTitle } : s
      ));

      // Lưu tiêu đề lên Server
      await ChatSessionApi.update(sessionId!, {
        userId: user?.id || 0,
        title: newTitle,
        lessonId: typeof selectedLessonId === 'number' ? selectedLessonId : undefined
      });
    }

    try {
      let accumulatedAnswer = "";
      const lessonIdToPass = typeof selectedLessonId === 'number' ? selectedLessonId : undefined;

      await chatMessageApi.sendMessageToAskAiStream(sessionId!, text, (chunk) => {
        // Lọc bỏ metadata
        if (chunk.includes("SOURCES_METADATA:")) return;

        accumulatedAnswer += chunk;

        // Cập nhật tin nhắn AI trong state
        setLiChatMessages(prev =>
          prev.map(msg =>
            msg.id === aiMsgId ? { ...msg, content: accumulatedAnswer } : msg
          )
        );
      }, lessonIdToPass);

    } catch (err) {
      console.error(err);
      setLiChatMessages(prev =>
        prev.map(msg =>
          msg.id === aiMsgId ? { ...msg, content: "Xin lỗi, đã có lỗi xảy ra khi kết nối tới AI." } : msg
        )
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const onDeleteChatSession = async (id: number) => {
    try {
      await ChatSessionApi.DeleteChatSession(id);
      setLiChatSessions(prev => prev.filter(session => session.id !== id));
      if (currentSessionId === id) {
        setCurrentSessionId(null);
        setLiChatMessages([]);
      }
    } catch (err) {
      console.error("Failed to delete chat session:", err);
    }
  }

  const handleStartRename = (e: React.MouseEvent, session: ChatSessionResponse) => {
    e.stopPropagation();
    setEditingSessionId(session.id);
    setEditingTitle(session.title);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleSaveRename = async () => {
    if (editingSessionId && editingTitle.trim()) {
      try {
        await ChatSessionApi.update(editingSessionId, {
          userId: user?.id || 0,
          title: editingTitle.trim()
        });
        setLiChatSessions(prev => prev.map(s => s.id === editingSessionId ? { ...s, title: editingTitle.trim() } : s));
      } catch (err) {
        console.error("Failed to rename session", err);
      }
    }
    setEditingSessionId(null);
  };

  const handleKeyDownRename = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSaveRename();
    if (e.key === 'Escape') setEditingSessionId(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLParagraphElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault(); // ❗ chặn xuống dòng

      if (isGenerating) return; // Không cho gửi khi đang gen
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
      {isLoading && <FullPageLoader message='' />}
      {/* ================= HEADER ================= */}
      <header className="h-14 bg-blue-600 flex items-center justify-between px-4 shrink-0 shadow-sm z-20">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-blue-100 hover:text-white hover:cursor-pointer transition-colors"
          >
            <Menu size={20} />
          </button>

          <div className="flex items-center gap-2 text-white">
            <BookOpen size={16} />
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
            {isExpanded ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
          </button>

          <button
            onClick={onClose}
            className="p-1.5 text-blue-100 hover:text-white hover:bg-blue-500 rounded-lg transition-colors"
          >
            <X size={20} />
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
            <button onClick={() => setSidebarOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
          </div>

          {/* chat session list */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {liChatSessions.map((session) => (
              <div
                key={session.id}
                className={`group relative flex items-center w-full px-3 py-2 rounded-lg transition-colors ${currentSessionId === session.id ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
              >
                <div className="flex-1 min-w-0 mr-2">
                  {editingSessionId === session.id ? (
                    <input
                      ref={inputRef}
                      className="w-full text-sm bg-white border border-blue-400 rounded px-1 outline-none"
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      onBlur={handleSaveRename}
                      onKeyDown={handleKeyDownRename}
                    />
                  ) : (
                    <button
                      className={`w-full text-left text-sm truncate cursor-pointer ${currentSessionId === session.id ? 'text-blue-700 font-medium' : 'text-gray-700 group-hover:text-blue-600'}`}
                      onClick={() => OpenDetailChatSession(session.id)}
                    >
                      {session.title}
                    </button>
                  )}
                </div>

                <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                  {editingSessionId !== session.id && (
                    <button
                      onClick={(e) => handleStartRename(e, session)}
                      className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                    >
                      <Pencil size={14} />
                    </button>
                  )}
                  <button
                    onClick={() => onDeleteChatSession(session.id)}
                    className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 border-t border-gray-100">
            <button className="w-full flex items-center justify-center gap-2 bg-blue-50 text-blue-600 py-2 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors" onClick={() => CreateNewChat()}>
              <Sparkles size={16} /> Chat mới
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
          {/* Filter Selection Area */}
          <div className="bg-white border-b border-gray-100 p-2 flex gap-2 overflow-x-auto">
            <div className="relative shrink-0 min-w-[140px]">
              <select
                className="w-full h-8 pl-8 pr-6 text-xs bg-gray-50 border border-gray-200 rounded-lg appearance-none outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                value={selectedCourseId}
                disabled={isLessonFixed}
                onChange={(e) => {
                  const val = e.target.value === "all" ? "all" : Number(e.target.value);
                  setSelectedCourseId(val);
                  loadLessonsForCourse(val, "all");
                }}
              >
                <option value="all">Tất cả khóa học</option>
                {enrolledCourses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
              <BookOpen size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>

            <div className="relative shrink-0 min-w-[140px]">
              <select
                className="w-full h-8 pl-8 pr-6 text-xs bg-gray-50 border border-gray-200 rounded-lg appearance-none outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                value={selectedLessonId}
                disabled={selectedCourseId === "all" || isLessonFixed}
                onChange={(e) => {
                  const lessonId = e.target.value === "all" ? "all" : Number(e.target.value);
                  setSelectedLessonId(lessonId);

                  // Tự động lưu bài học vào session hiện tại
                  if (currentSessionId && typeof lessonId === 'number') {
                    ChatSessionApi.update(currentSessionId, {
                      userId: user?.id || 0,
                      title: liChatSessions.find(s => s.id === currentSessionId)?.title || "New Chat",
                      lessonId: lessonId
                    });

                    // Cập nhật local list để đồng bộ
                    setLiChatSessions(prev => prev.map(s =>
                      s.id === currentSessionId ? { ...s, lessonId } : s
                    ));
                  }
                }}
              >
                <option value="all">Tất cả bài học</option>
                {lessons.map(l => <option key={l.id} value={l.id}>{l.title}</option>)}
              </select>
              <Sparkles size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth bg-gray-50/50">
            <div className="flex gap-2">
              <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white shrink-0 mt-1">
                <Wand2 size={10} />
              </div>
              <div className="max-w-[85%] bg-white border border-gray-200 px-3 py-2.5 rounded-2xl rounded-tl-none shadow-sm text-sm text-gray-800">
                <p>Chào bạn! Mình là trợ lý học tập. Bạn cần giúp gì hôm nay?</p>
              </div>
            </div>
            {liChatMessages.map((message) => {
              if (message.role === "User") {
                return (
                  <div key={message.id} className="flex justify-end animate-fadeIn">
                    <div className="max-w-[85%] bg-blue-600 text-white px-4 py-2.5 rounded-2xl rounded-tr-none shadow-md text-sm leading-relaxed">
                      <p>{message.content}</p>
                    </div>
                  </div>
                )
              }
              else return (
                <div key={message.id} className="flex gap-3 animate-fadeIn">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shrink-0 mt-1 shadow-sm border border-white">
                    <Wand2 size={14} />
                  </div>
                  <div className="max-w-[85%] bg-white border border-gray-100 px-4 py-3 rounded-2xl rounded-tl-none shadow-sm text-sm text-gray-800">
                    <div className="">
                      {message.content === "" ? (
                        <div className="flex gap-1.5 items-center h-6">
                          <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"></span>
                          <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                          <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                        </div>
                      ) : (
                        <FormatMarkdown content={message.content} />
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
            <div ref={bottomRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 bg-white border-t border-gray-200">
            {selectedLessonId === "all" && (
              <div className="text-[10px] text-red-500 mb-1.5 px-1 animate-pulse flex items-center gap-1">
                <Sparkles size={10} />
                Bạn cần chọn bài học trước khi đặt câu hỏi
              </div>
            )}
            <div className="relative">
              <div className={`w-full bg-gray-100 rounded-xl px-3 py-2 focus-within:ring-2 focus-within:ring-blue-200 ${(isGenerating || selectedLessonId === "all") ? 'opacity-50 pointer-events-none' : ''}`}>
                <p
                  ref={ref}
                  contentEditable={!isGenerating && selectedLessonId !== "all"}
                  onKeyDown={handleKeyDown}
                  onInput={(e) => {
                    const el = e.currentTarget;
                    if (el.innerText.trim() === "") {
                      el.innerHTML = "";
                    }
                  }}
                  className="editable-placeholder outline-none text-sm min-h-[24px] whitespace-pre-wrap break-words"
                  data-placeholder={selectedLessonId === "all" ? "Hãy chọn bài học phía trên..." : "Nhập câu hỏi về bài học này..."}
                  suppressContentEditableWarning
                />
              </div>
              <div className="absolute right-1 bottom-1 flex items-center">
                <button
                  className="p-1.5 bg-blue-600 text-white rounded-lg ml-1 hover:bg-blue-700 transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                  onClick={() => handleSend()}
                  disabled={isGenerating || selectedLessonId === "all"}
                >
                  <Send size={14} />
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