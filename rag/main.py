import os
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
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
import google.api_core.exceptions
import requests
from langchain_core.embeddings import Embeddings

# =========================
# 1. LOAD ENV & API KEYS
# =========================

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise ValueError("Thiếu DATABASE_URL")

def load_keys(env_var_name):
    keys_str = os.getenv(env_var_name, "")
    keys = [k.strip() for k in keys_str.split(",") if k.strip()]
    if not keys:
        single_key = os.getenv("GOOGLE_API_KEY")
        if single_key:
            keys = [single_key.strip()]
    return keys

CHAT_KEYS = load_keys("GOOGLE_API_KEYS_CHAT")
if not CHAT_KEYS:
    # Fallback to old format
    CHAT_KEYS = load_keys("GOOGLE_API_KEYS")
    if not CHAT_KEYS:
        raise ValueError("Thiếu cấu hình GOOGLE_API_KEYS_CHAT trong file .env")

EMBEDDING_KEYS = load_keys("GOOGLE_API_KEYS_EMBEDDING")
if not EMBEDDING_KEYS:
    # Fallback to old format
    EMBEDDING_KEYS = load_keys("GOOGLE_API_KEYS")
    if not EMBEDDING_KEYS:
        raise ValueError("Thiếu cấu hình GOOGLE_API_KEYS_EMBEDDING trong file .env")

chat_key_iterator = itertools.cycle(CHAT_KEYS)
embedding_key_iterator = itertools.cycle(EMBEDDING_KEYS)

def get_next_chat_key():
    return next(chat_key_iterator)

def get_next_embedding_key():
    return next(embedding_key_iterator)

def retry_on_429():
    return retry(
        stop=stop_after_attempt(8),
        wait=wait_exponential(multiplier=2, min=10, max=100),
        retry=retry_if_exception_type((google.api_core.exceptions.ResourceExhausted, requests.exceptions.HTTPError)),
        before_sleep=lambda retry_state: print(f"⚠️ [CHAT RATE LIMIT] Chạm giới hạn API. Đang thử lại lần {retry_state.attempt_number}...")
    )

# --- 2. CLASS XOAY TUA KEY (Dùng chung logic với ingest.py) ---
from ingest import RotatedGoogleEmbeddings

app = FastAPI()

# Root endpoint for Azure Health Check
@app.get("/")
def root():
    return {"status": "ok", "message": "EduMind RAG Service is running"}

# Cấu hình CORS để Frontend (Web) có thể gọi được API
from fastapi.middleware.cors import CORSMiddleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Trong thực tế nên cấu hình danh sách domain cụ thể
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from ingest import ingest_file

class IngestRequest(BaseModel):
    file_path: str
    lesson_id: int = None

@app.post("/api/ingest")
async def ingest_endpoint(request: IngestRequest):
    print(f"📥 [INGEST] Bắt đầu ingest request: {request.file_path} (Lesson ID: {request.lesson_id})")
    try:
        # Kiểm tra file tồn tại
        if not os.path.exists(request.file_path):
            print(f"⚠️ [INGEST] File không tồn tại tại đường dẫn: {request.file_path}. Đang thử tìm trong data folder...")
            # Nếu không tìm thấy, thử tìm trong data folder
            alt_path = os.path.join("./data", os.path.basename(request.file_path))
            if os.path.exists(alt_path):
                print(f"✅ [INGEST] Đã tìm thấy ở alt_path: {alt_path}")
                request.file_path = alt_path
            else:
                print(f"❌ [INGEST] Hoàn toàn không tìm thấy file!")
                raise HTTPException(status_code=404, detail=f"File not found: {request.file_path}")

        result = ingest_file(request.file_path, lesson_id=request.lesson_id)
        if result.get("status") == "error":
            print(f"❌ [INGEST] Lỗi từ hàm ingest_file: {result.get('message')}")
            raise HTTPException(status_code=400, detail=result.get("message"))
        print(f"✅ [INGEST] Hoàn tất ingest thành công!")
        return result
    except Exception as e:
        print(f"❌ [INGEST] Exception xảy ra: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# =========================
# 2. EMBEDDING + VECTOR STORE
# =========================
# Sử dụng Rotated Embeddings cho global (để khởi tạo retriever ban đầu)
embeddings = RotatedGoogleEmbeddings(
    model="models/gemini-embedding-001",
    api_keys=EMBEDDING_KEYS,
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
            print(f"🌊 [STREAM] Bắt đầu chat stream. Câu hỏi: '{request.question}'")
            current_api_key = get_next_chat_key()
            print(f"🔑 [STREAM] Đang dùng API Key: {current_api_key[:10]}...")
            
            # Sử dụng Rotated Embeddings cho từng request stream
            local_embeddings = RotatedGoogleEmbeddings(
                model="models/gemini-embedding-001", 
                api_keys=CHAT_KEYS # Dùng chung toàn bộ key khả dụng cho request này
            )
            local_vector_store = PGVector(
                embeddings=local_embeddings,
                collection_name="my_docs",
                connection=engine,
                use_jsonb=True,
            )

            llm_fast = ChatGoogleGenerativeAI(model="models/gemini-2.5-flash", temperature=0.3, google_api_key=current_api_key)
            llm_smart = ChatGoogleGenerativeAI(model="models/gemini-2.5-flash", temperature=0.3, google_api_key=current_api_key)

            contextualize_chain = contextualize_q_prompt | llm_fast | StrOutputParser()
            question_answer_chain = create_stuff_documents_chain(llm_smart, qa_prompt)

            langchain_history = []
            for msg in request.chat_history:
                if msg.role == "User": langchain_history.append(HumanMessage(content=msg.content))
                elif msg.role == "AiAssistant": langchain_history.append(AIMessage(content=msg.content))
            print(f"👉 [STREAM] Lịch sử trò chuyện: {len(langchain_history)} tin nhắn")

            # 1. Rewrite câu hỏi
            @retry_on_429()
            async def _rewrite():
                return await contextualize_chain.ainvoke({
                    "input": request.question,
                    "chat_history": langchain_history
                })
            
            rewritten_question = await _rewrite()
            
            if not rewritten_question or not str(rewritten_question).strip():
                rewritten_question = request.question
            print(f"✅ [STREAM] Câu hỏi sau rewrite: '{rewritten_question}'")

            # 2. Retrieve tài liệu
            search_kwargs = {"k": 3}
            if request.lesson_id:
                search_kwargs["filter"] = {"lesson_id": request.lesson_id}
                print(f"🔍 [STREAM] Lọc theo Lesson ID: {request.lesson_id}")

            @retry_on_429()
            def _search():
                return local_vector_store.similarity_search_with_score(
                    query=str(rewritten_question),
                    k=search_kwargs.get("k", 3),
                    filter=search_kwargs.get("filter")
                )
            
            docs_with_scores = _search()
            print(f"✅ [STREAM] Đã tìm thấy {len(docs_with_scores)} tài liệu (chunks) phù hợp")
            
            retrieved_docs = []
            source_files = set()
            for doc, score in docs_with_scores:
                filename = doc.metadata.get("filename", "Tài liệu không tên")
                source_files.add(filename)
                doc.page_content = f"[NGUỒN: {filename}] [SCORE: {score:.4f}]\n{doc.page_content}"
                retrieved_docs.append(doc)
            print(f"✅ [STREAM] Nguồn được trích xuất: {list(source_files)}")
            print(f"🚀 [STREAM] Bắt đầu trả luồng dữ liệu (Streaming)...")

            # 3. Stream câu trả lời
            async for chunk in question_answer_chain.astream({
                "input": request.question,
                "chat_history": langchain_history,
                "context": retrieved_docs,
            }):
                if chunk:
                    yield chunk

            # Gửi thông tin nguồn tài liệu ở cuối (định dạng đặc biệt)
            yield f"\n\nSOURCES_METADATA:{json.dumps(list(source_files))}"
            print(f"✅ [STREAM] Luồng dữ liệu đã hoàn tất.")

        except Exception as e:
            print("❌ [STREAM] --- LỖI TRONG QUÁ TRÌNH STREAM ---")
            print("Type:", type(e).__name__)
            print("Message:", str(e))
            yield f"ERROR: {str(e)}"

    return StreamingResponse(generate_chat_stream(), media_type="text/plain")

@app.post("/api/chat")
async def chat_endpoint(request: ChatRequest):
    try:
        # Lấy key tiếp theo cho request này để tránh Rate Limit
        current_api_key = get_next_chat_key()
        print(f"🔑 Đang dùng API Key: {current_api_key[:10]}...")

        # Tạo bộ xoay tua embeddings cho request chat này
        local_embeddings = RotatedGoogleEmbeddings(
            model="models/gemini-embedding-001",
            api_keys=CHAT_KEYS,
        )
        local_vector_store = PGVector(
            embeddings=local_embeddings,
            collection_name="my_docs",
            connection=engine,
            use_jsonb=True,
        )

        # Khởi tạo model AI Generative
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
        @retry_on_429()
        def _rewrite_sync():
            return contextualize_chain.invoke({
                "input": request.question,
                "chat_history": langchain_history
            })

        rewritten_question = _rewrite_sync()

        if not rewritten_question or not rewritten_question.strip():
            rewritten_question = request.question

        print("✅ Rewritten:", rewritten_question)

        # =====================
        # STEP 2: RETRIEVE TÀI LIỆU
        # =====================
        rewritten_question = str(rewritten_question)
        if not rewritten_question.strip():
            rewritten_question = request.question

        @retry_on_429()
        def _search_sync():
            return local_vector_store.similarity_search_with_score(query=rewritten_question, k=3)

        docs_with_scores = _search_sync()
        
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
        @retry_on_429()
        def _answer_sync():
            return question_answer_chain.invoke({
                "input": request.question,
                "chat_history": langchain_history,
                "context": retrieved_docs,
            })

        raw_answer = _answer_sync()

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