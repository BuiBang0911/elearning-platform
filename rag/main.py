import os
import time
import itertools
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv

# --- LangChain ---
from langchain_google_genai import (
    ChatGoogleGenerativeAI,
    GoogleGenerativeAIEmbeddings,
)
from langchain_postgres import PGVector
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.messages import HumanMessage, AIMessage
from langchain_core.output_parsers import StrOutputParser
from langchain_classic.chains.combine_documents import create_stuff_documents_chain
from sqlalchemy import create_engine

# =========================
# 1. LOAD ENV & API KEYS
# =========================

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise ValueError("Thiếu DATABASE_URL")

api_keys_str = os.getenv("GOOGLE_API_KEYS", "")
API_KEYS = [k.strip() for k in api_keys_str.split(",") if k.strip()]

if not API_KEYS:
    single_key = os.getenv("GOOGLE_API_KEY")
    if single_key:
        API_KEYS = [single_key.strip()]
    else:
        raise ValueError("Thiếu cấu hình GOOGLE_API_KEYS trong file .env")

key_iterator = itertools.cycle(API_KEYS)

def get_next_key():
    return next(key_iterator)

app = FastAPI()
from ingest import ingest_file

class IngestRequest(BaseModel):
    file_path: str
    lesson_id: int = None

@app.post("/api/ingest")
async def ingest_endpoint(request: IngestRequest):
    try:
        # Kiểm tra file tồn tại
        if not os.path.exists(request.file_path):
            # Nếu không tìm thấy, thử tìm trong data folder
            alt_path = os.path.join("./data", os.path.basename(request.file_path))
            if os.path.exists(alt_path):
                request.file_path = alt_path
            else:
                raise HTTPException(status_code=404, detail=f"File not found: {request.file_path}")

        result = ingest_file(request.file_path, lesson_id=request.lesson_id)
        if result.get("status") == "error":
            raise HTTPException(status_code=400, detail=result.get("message"))
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# =========================
# 2. EMBEDDING + VECTOR STORE
# =========================
# Dùng key đầu tiên cho Embedding (Embedding ít bị giới hạn rate limit hơn)
embeddings = GoogleGenerativeAIEmbeddings(
    model="models/gemini-embedding-001",
    google_api_key=API_KEYS[0],
)

# Tạo SQLAlchemy engine với pool_pre_ping để tránh lỗi SSL connection closed unexpectedly
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=300
)

vector_store = PGVector(
    embeddings=embeddings,
    collection_name="my_docs",
    connection=engine,
    use_jsonb=True,
)

retriever = vector_store.as_retriever(search_kwargs={"k": 3})

# =========================
# 3. PROMPTS
# =========================

contextualize_q_system_prompt = """
Dựa trên lịch sử trò chuyện và câu hỏi mới nhất của người dùng,
hãy tạo một câu hỏi độc lập có thể hiểu được mà không cần xem lại lịch sử.
KHÔNG trả lời câu hỏi, chỉ viết lại nó nếu cần thiết.
"""

contextualize_q_prompt = ChatPromptTemplate.from_messages([
    ("system", contextualize_q_system_prompt),
    MessagesPlaceholder("chat_history"),
    ("human", "{input}"),
])

qa_system_prompt = """
Bạn là giảng viên AI tận tâm và chuyên nghiệp của hệ thống E-learning EduMind.
Nhiệm vụ của bạn là giải đáp thắc mắc của học viên một cách chính xác, sư phạm và dễ hiểu nhất dựa trên tài liệu bài học (Context).

Dưới đây là các đoạn văn bản trích xuất từ tài liệu, mỗi đoạn có kèm theo Nguồn [NGUỒN: ...] và Điểm khoảng cách/Tương đồng [SCORE: ...].

<context>
{context}
</context>

HƯỚNG DẪN TRẢ LỜI CỦA BẠN (BẮT BUỘC TUÂN THỦ):
1. TRUNG THỰC TUYỆT ĐỐI: Chỉ trả lời dựa trên thông tin có trong <context>. Tuyệt đối KHÔNG suy diễn hoặc tự bịa ra thông tin ngoài ngữ cảnh. Nếu thông tin không đủ, hãy trả lời: "Tôi chưa tìm thấy thông tin này trong tài liệu bài học hiện tại."
2. BẮT BUỘC TRÍCH DẪN NGUỒN: Mọi câu trả lời cung cấp đều phải nêu rõ lấy từ file nào. Ví dụ: "Theo tài liệu [Tên_file.pdf]..." hoặc thêm "(Nguồn: Tên_file.pdf)" ở cuối câu/đoạn.
3. ĐÁNH GIÁ ĐỘ TƯƠNG ĐỒNG: Các đoạn có [SCORE] là khoảng cách (distance). Điểm SCORE càng THẤP nghĩa là càng khớp với câu hỏi. Hãy ưu tiên phân tích thông tin từ các đoạn có điểm SCORE thấp hơn nếu có sự mâu thuẫn.
4. MÔ TẢ HÌNH ẢNH & BẢNG BIỂU: Nếu đoạn ngữ cảnh có thẻ chỉ định hình ảnh (VD: [HÌNH ẢNH...]) hoặc bảng biểu (VD: [BẢNG BIỂU...]), hãy mường tượng và giải thích chi tiết ý nghĩa của nó bằng lời văn cho học viên hiểu.
5. CẤU TRÚC RÕ RÀNG: Dùng gạch đầu dòng, tô đậm từ khóa và cách dòng hợp lý để phần giải thích được trực quan, dễ đọc nhất.
"""


qa_prompt = ChatPromptTemplate.from_messages([
    ("system", qa_system_prompt),
    MessagesPlaceholder("chat_history"),
    ("human", "{input}"),
])

# =========================
# 4. REQUEST MODELS
# =========================

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    question: str
    chat_history: list[ChatMessage] = []
    lesson_id: int = None

# =========================
# 5. CHAT ENDPOINT
# =========================

from fastapi.responses import StreamingResponse
import json

@app.post("/api/chat/stream")
async def chat_stream_endpoint(request: ChatRequest):
    async def generate_chat_stream():
        try:
            current_api_key = get_next_key()
            llm_fast = ChatGoogleGenerativeAI(model="models/gemini-2.5-flash", temperature=0.3, google_api_key=current_api_key)
            llm_smart = ChatGoogleGenerativeAI(model="models/gemini-2.5-flash", temperature=0.3, google_api_key=current_api_key)

            contextualize_chain = contextualize_q_prompt | llm_fast | StrOutputParser()
            question_answer_chain = create_stuff_documents_chain(llm_smart, qa_prompt)

            langchain_history = []
            for msg in request.chat_history:
                if msg.role == "User": langchain_history.append(HumanMessage(content=msg.content))
                elif msg.role == "AiAssistant": langchain_history.append(AIMessage(content=msg.content))

            # 1. Rewrite câu hỏi
            rewritten_question = await contextualize_chain.ainvoke({
                "input": request.question,
                "chat_history": langchain_history
            })
            if not rewritten_question or not str(rewritten_question).strip():
                rewritten_question = request.question

            # 2. Retrieve tài liệu
            search_kwargs = {"k": 3}
            if request.lesson_id:
                search_kwargs["filter"] = {"lesson_id": request.lesson_id}

            docs_with_scores = vector_store.similarity_search_with_score(
                query=str(rewritten_question),
                k=search_kwargs.get("k", 3),
                filter=search_kwargs.get("filter")
            )
            
            retrieved_docs = []
            source_files = set()
            for doc, score in docs_with_scores:
                filename = doc.metadata.get("filename", "Tài liệu không tên")
                source_files.add(filename)
                doc.page_content = f"[NGUỒN: {filename}] [SCORE: {score:.4f}]\n{doc.page_content}"
                retrieved_docs.append(doc)

            # 3. Stream câu trả lời
            # Note: create_stuff_documents_chain returns the final answer when called with astream
            # but we can use LLM directly for better control if needed.
            # Here we follow the existing chain logic.
            async for chunk in question_answer_chain.astream({
                "input": request.question,
                "chat_history": langchain_history,
                "context": retrieved_docs,
            }):
                # LangChain's stuff_documents_chain yields strings in astream
                if chunk:
                    yield chunk

            # Gửi thông tin nguồn tài liệu ở cuối (định dạng đặc biệt)
            yield f"\n\nSOURCES_METADATA:{json.dumps(list(source_files))}"

        except Exception as e:
            yield f"ERROR: {str(e)}"

    return StreamingResponse(generate_chat_stream(), media_type="text/plain")

@app.post("/api/chat")
async def chat_endpoint(request: ChatRequest):
    try:
        # Lấy key tiếp theo cho request này để tránh Rate Limit
        current_api_key = get_next_key()
        print(f"🔑 Đang dùng API Key: {current_api_key[:10]}...")

        # Khởi tạo model bên trong endpoint để dùng key mới
        llm_fast = ChatGoogleGenerativeAI(
            model="models/gemini-2.5-flash",
            temperature=0.3,
            google_api_key=current_api_key,
        )
        
        llm_smart = ChatGoogleGenerativeAI(
            model="models/gemini-2.5-flash",
            temperature=0.3,
            google_api_key=current_api_key,
        )

        # Khởi tạo lại các chain với LLM mới
        contextualize_chain = (
            contextualize_q_prompt
            | llm_fast
            | StrOutputParser()
        )

        question_answer_chain = create_stuff_documents_chain(
            llm_smart,
            qa_prompt
        )

        # Convert history sang định dạng của LangChain
        langchain_history = []
        for msg in request.chat_history:
            if msg.role == "User":
                langchain_history.append(HumanMessage(content=msg.content))
            elif msg.role == "AiAssistant":
                langchain_history.append(AIMessage(content=msg.content))

        print("👉 --- CHAT REQUEST ---")
        print("👉 History length:", len(langchain_history))

        # =====================
        # STEP 1: REWRITE CÂU HỎI
        # =====================
        rewritten_question = contextualize_chain.invoke({
            "input": request.question,
            "chat_history": langchain_history
        })

        if not rewritten_question or not rewritten_question.strip():
            rewritten_question = request.question

        print("✅ Rewritten:", rewritten_question)

        # =====================
        # STEP 2: RETRIEVE TÀI LIỆU
        # =====================
        rewritten_question = str(rewritten_question)
        if not rewritten_question.strip():
            rewritten_question = request.question

        docs_with_scores = vector_store.similarity_search_with_score(query=rewritten_question, k=3)
        
        print("✅ Retrieved docs with scores:", len(docs_with_scores))

        # =====================
        # STEP 3: BUILD CONTEXT & GẮN NGUỒN VÀ SCORE
        # =====================
        source_files = set() # Dùng set để lọc các tên file bị trùng
        retrieved_docs = []

        for i, (doc, score) in enumerate(docs_with_scores):
            if hasattr(doc, "page_content"):
                # Lấy tên file từ metadata đã lưu lúc ingest
                filename = doc.metadata.get("filename", "Tài liệu không tên")
                source_files.add(filename)
                
                # BẮT BUỘC: Gắn thẻ nguồn và score lên đầu đoạn text để AI đọc và trích xuất
                doc.page_content = f"[NGUỒN: {filename}] [SCORE: {score:.4f}]\n{doc.page_content}"
                retrieved_docs.append(doc)
            else:
                print(f"⚠️ Doc {i} is not Document. Type:", type(doc))

        print(f"✅ Context formatted with sources: {list(source_files)}")

        # =====================
        # STEP 4: GỌI AI TRẢ LỜI
        # =====================
        raw_answer = question_answer_chain.invoke({
            "input": request.question,
            "chat_history": langchain_history,
            "context": retrieved_docs,
        })

        # Chuẩn hóa kết quả trả về
        if hasattr(raw_answer, "content"):
            answer = raw_answer.content
        else:
            answer = str(raw_answer)

        print("✅ Answer generated")

        # Trả về câu trả lời và mảng chứa tên file
        return {
            "answer": answer,
            "sources": list(source_files)
        }

    except Exception as e:
        print("❌ --- ERROR ---")
        print("Type:", type(e).__name__)
        print("Message:", str(e))

        raise HTTPException(
            status_code=500,
            detail={
                "error_type": type(e).__name__,
                "message": str(e)
            }
        )