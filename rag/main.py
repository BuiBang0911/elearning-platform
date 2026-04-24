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

# --- Combined Preprocess Prompt ---
combined_preprocess_system_prompt = """
Bạn là Giảng viên Điều phối AI của hệ thống E-learning EduMind. 
Nhiệm vụ của bạn là phân tích câu hỏi của học viên và lịch sử trò chuyện để thực hiện 2 việc cùng lúc:

1. PHÂN LOẠI Ý ĐỊNH (Intent):
   - GREETING: Chào hỏi, cảm ơn hoặc các câu xã giao lịch sự.
   - COURSE_QUERY: Câu hỏi trực tiếp về kiến thức bài học, tài liệu, bài tập hoặc yêu cầu giải thích chuyên môn.
   - OFFENSIVE: Nội dung thô tục, xúc phạm hoặc không phù hợp với môi trường giáo dục.
   - OOD (Out Of Domain): Câu hỏi ngoài lề không liên quan đến việc học (thời tiết, giải trí, linh tinh).

2. VIẾT LẠI CÂU HỎI (Rewriting):
   - CHỈ thực hiện nếu intent là COURSE_QUERY.
   - Hãy tạo một câu hỏi độc lập, rõ ràng, đầy đủ thuật ngữ chuyên môn dựa trên lịch sử để hệ thống có thể truy xuất tài liệu chính xác nhất.

BẮT BUỘC TRẢ VỀ ĐỊNH DẠNG JSON:
{{
  "intent": "GREETING" | "COURSE_QUERY" | "OFFENSIVE" | "OOD",
  "rewritten_query": "Câu hỏi sau khi viết lại (chỉ có nếu là COURSE_QUERY)",
  "direct_response": "Lời phản hồi từ vị thế một Giảng viên AI. Nếu là OOD, hãy trả lời ngắn gọn và khéo léo nhắc nhở học viên tập trung vào bài học."
}}
"""

combined_preprocess_prompt = ChatPromptTemplate.from_messages([
    ("system", combined_preprocess_system_prompt),
    MessagesPlaceholder("chat_history"),
    ("human", "{input}"),
])

qa_system_prompt = """
Bạn là Giảng viên AI chuyên nghiệp và tận tâm của EduMind. 
Phong cách của bạn: Sư phạm, sâu sắc, luôn dùng ngôn từ khích lệ học viên và giải thích vấn đề một cách logic.

Dưới đây là các tài liệu bài học (Context) được cung cấp để bạn trả lời:
<context>
{context}
</context>

HƯỚNG DẪN GIẢNG DẠY (BẮT BUỘC TUÂN THỦ):
1. CĂN CỨ VÀO TÀI LIỆU: Chỉ trả lời dựa trên thông tin trong <context>. Tuyệt đối không tự bịa ra kiến thức ngoài bài học. Nếu thông tin không có trong tài liệu, hãy trả lời: "Tôi hiện chưa tìm thấy thông tin cụ thể về nội dung này trong tài liệu bài học, bạn có muốn trao đổi thêm về các chủ đề khác trong khóa học không?".
2. CẤU TRÚC BÀI GIẢNG: Hãy trình bày rõ ràng bằng cách dùng gạch đầu dòng, tô đậm thuật ngữ quan trọng. Nếu là thuật toán, hãy giải thích từng bước (step-by-step).
3. TRÍCH DẪN NGUỒN: Cuối câu trả lời, hãy luôn chỉ rõ nguồn từ file nào để học viên dễ dàng tra cứu (Ví dụ: "Nguồn: [Tên_file.pdf]").
4. TƯƠNG TÁC TÍCH CỰC: Hãy bắt đầu hoặc kết thúc bằng một câu khích lệ tinh thần học tập của học viên nếu thấy phù hợp.
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
            print(f"🌊 [STREAM] Bắt đầu xử lý. Câu hỏi: '{request.question}'")
            current_api_key = get_next_chat_key()
            
            # 1. TIỀN XỬ LÝ (Intent + Rewrite) - CHỈ 1 REQUEST LLM
            llm_fast = ChatGoogleGenerativeAI(model="models/gemini-2.5-flash", temperature=0.1, google_api_key=current_api_key)
            from langchain_core.output_parsers import JsonOutputParser
            
            preprocess_chain = combined_preprocess_prompt | llm_fast | JsonOutputParser()
            
            langchain_history = []
            for msg in request.chat_history:
                if msg.role == "User": langchain_history.append(HumanMessage(content=msg.content))
                elif msg.role == "AiAssistant": langchain_history.append(AIMessage(content=msg.content))

            @retry_on_429()
            async def _preprocess():
                return await preprocess_chain.ainvoke({
                    "input": request.question,
                    "chat_history": langchain_history
                })
            
            preprocess_res = await _preprocess()
            intent = preprocess_res.get("intent", "COURSE_QUERY")
            print(f"🎯 [STREAM] Intent xác định: {intent}")

            # 2. XỬ LÝ THEO INTENT
            if intent != "COURSE_QUERY":
                # Trả về kết quả trực tiếp, không qua RAG
                direct_response = preprocess_res.get("direct_response", "Tôi có thể giúp bạn gì về bài học này không?")
                yield direct_response
                return

            rewritten_question = preprocess_res.get("rewritten_query", request.question)
            print(f"✅ [STREAM] Câu hỏi sau rewrite: '{rewritten_question}'")

            # 3. RETRIEVAL (Nếu là COURSE_QUERY)
            local_embeddings = RotatedGoogleEmbeddings(model="models/gemini-embedding-001", api_keys=CHAT_KEYS)
            local_vector_store = PGVector(
                embeddings=local_embeddings,
                collection_name="my_docs",
                connection=engine,
                use_jsonb=True,
            )

            search_kwargs = {"k": 3}
            if request.lesson_id:
                search_kwargs["filter"] = {"lesson_id": request.lesson_id}
            
            @retry_on_429()
            def _search():
                return local_vector_store.similarity_search_with_score(
                    query=str(rewritten_question),
                    k=search_kwargs.get("k", 3),
                    filter=search_kwargs.get("filter")
                )
            
            docs_with_scores = _search()
            print(f"✅ [STREAM] Tìm thấy {len(docs_with_scores)} tài liệu phù hợp.")
            
            retrieved_docs = []
            source_files = set()
            for doc, score in docs_with_scores:
                filename = doc.metadata.get("filename", "Tài liệu không tên")
                source_files.add(filename)
                
                # Fix lỗi "unsupported format string passed to NoneType.__format__" nếu score là None
                score_val = score if score is not None else 0.0
                doc.page_content = f"[NGUỒN: {filename}] [SCORE: {score_val:.4f}]\n{doc.page_content}"
                retrieved_docs.append(doc)

            # 4. STREAM CÂU TRẢ LỜI RAG (Dùng model mạnh hơn: PRO)
            llm_smart = ChatGoogleGenerativeAI(model="models/gemini-2.5-flash", temperature=0.3, google_api_key=current_api_key)
            question_answer_chain = create_stuff_documents_chain(llm_smart, qa_prompt)

            async for chunk in question_answer_chain.astream({
                "input": request.question,
                "chat_history": langchain_history,
                "context": retrieved_docs,
            }):
                if chunk: yield chunk

            yield f"\n\nSOURCES_METADATA:{json.dumps(list(source_files))}"
            print(f"✅ [STREAM] Luồng dữ liệu hoàn tất.")

        except Exception as e:
            print(f"❌ [STREAM] LỖI: {str(e)}")
            yield f"ERROR: Có lỗi xảy ra trong quá trình xử lý câu hỏi của bạn."

    return StreamingResponse(generate_chat_stream(), media_type="text/plain")

    return StreamingResponse(generate_chat_stream(), media_type="text/plain")

@app.post("/api/chat")
async def chat_endpoint(request: ChatRequest):
    try:
        current_api_key = get_next_chat_key()
        from langchain_core.output_parsers import JsonOutputParser
        
        # 1. TIỀN XỬ LÝ ĐỒNG BỘ
        llm_fast = ChatGoogleGenerativeAI(model="models/gemini-2.5-flash", temperature=0.1, google_api_key=current_api_key)
        preprocess_chain = combined_preprocess_prompt | llm_fast | JsonOutputParser()

        langchain_history = []
        for msg in request.chat_history:
            if msg.role == "User": langchain_history.append(HumanMessage(content=msg.content))
            elif msg.role == "AiAssistant": langchain_history.append(AIMessage(content=msg.content))

        @retry_on_429()
        def _preprocess_sync():
            return preprocess_chain.invoke({
                "input": request.question,
                "chat_history": langchain_history
            })

        preprocess_res = _preprocess_sync()
        intent = preprocess_res.get("intent", "COURSE_QUERY")
        print(f"🎯 [CHAT] Intent: {intent}")

        if intent != "COURSE_QUERY":
            return {
                "answer": preprocess_res.get("direct_response", "Chào bạn, tôi có thể giúp gì cho bài học này?"),
                "sources": []
            }

        rewritten_question = preprocess_res.get("rewritten_query", request.question)

        # 2. RETRIEVAL
        local_embeddings = RotatedGoogleEmbeddings(model="models/gemini-embedding-001", api_keys=CHAT_KEYS)
        local_vector_store = PGVector(
            embeddings=local_embeddings,
            collection_name="my_docs",
            connection=engine,
            use_jsonb=True,
        )

        @retry_on_429()
        def _search_sync():
            search_kwargs = {"k": 3}
            if request.lesson_id:
                search_kwargs["filter"] = {"lesson_id": request.lesson_id}
            return local_vector_store.similarity_search_with_score(
                query=str(rewritten_question),
                k=search_kwargs.get("k", 3),
                filter=search_kwargs.get("filter")
            )

        docs_with_scores = _search_sync()
        
        source_files = set()
        retrieved_docs = []
        for doc, score in docs_with_scores:
            filename = doc.metadata.get("filename", "Tài liệu không tên")
            source_files.add(filename)
            
            # Fix lỗi "unsupported format string passed to NoneType.__format__" nếu score là None
            score_val = score if score is not None else 0.0
            doc.page_content = f"[NGUỒN: {filename}] [SCORE: {score_val:.4f}]\n{doc.page_content}"
            retrieved_docs.append(doc)

        # 3. GENERATE ANSWER (Dùng model mạnh hơn: PRO)
        llm_smart = ChatGoogleGenerativeAI(model="models/gemini-2.5-flash", temperature=0.3, google_api_key=current_api_key)
        question_answer_chain = create_stuff_documents_chain(llm_smart, qa_prompt)

        @retry_on_429()
        def _answer_sync():
            return question_answer_chain.invoke({
                "input": request.question,
                "chat_history": langchain_history,
                "context": retrieved_docs,
            })

        raw_answer = _answer_sync()
        answer = raw_answer.content if hasattr(raw_answer, "content") else str(raw_answer)

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