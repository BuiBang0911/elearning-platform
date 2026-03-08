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

# =========================
# 2. EMBEDDING + VECTOR STORE
# =========================
# Dùng key đầu tiên cho Embedding (Embedding ít bị giới hạn rate limit hơn)
embeddings = GoogleGenerativeAIEmbeddings(
    model="models/gemini-embedding-001",
    google_api_key=API_KEYS[0],
)

vector_store = PGVector(
    embeddings=embeddings,
    collection_name="my_docs",
    connection=DATABASE_URL,
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
Bạn là trợ lý AI chuyên nghiệp của hệ thống E-learning EduMind.

Sử dụng các đoạn ngữ cảnh sau để trả lời câu hỏi. Mỗi đoạn ngữ cảnh đều bắt đầu bằng thẻ [NGUỒN: <tên_file>].

YÊU CẦU BẮT BUỘC CẦN TUÂN THỦ:
1. Bạn BẮT BUỘC PHẢI GHI RÕ NGUỒN TÀI LIỆU khi đưa ra thông tin. Ví dụ: "Theo tài liệu [Tên file.pdf]..." hoặc thêm (Nguồn: Tên file.pdf) ở cuối câu.
2. Nếu câu hỏi liên quan đến hình ảnh (thẻ [HÌNH ẢNH...]), hãy mô tả thật chi tiết dựa trên thông tin có sẵn.
3. Nếu không tìm thấy thông tin để trả lời, hãy trung thực từ chối, KHÔNG tự bịa ra thông tin.

<context>
{context}
</context>
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

# =========================
# 5. CHAT ENDPOINT
# =========================

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

        retrieved_docs = retriever.invoke(rewritten_question)
        
        if not isinstance(retrieved_docs, list):
            raise TypeError(f"Retriever returned {type(retrieved_docs)}, expected list[Document]")
        print("✅ Retrieved docs:", len(retrieved_docs))

        # =====================
        # STEP 3: BUILD CONTEXT & GẮN NGUỒN
        # =====================
        source_files = set() # Dùng set để lọc các tên file bị trùng

        for i, doc in enumerate(retrieved_docs):
            if hasattr(doc, "page_content"):
                # Lấy tên file từ metadata đã lưu lúc ingest
                filename = doc.metadata.get("filename", "Tài liệu không tên")
                source_files.add(filename)
                
                # BẮT BUỘC: Gắn thẻ nguồn lên đầu đoạn text để AI đọc và trích xuất
                doc.page_content = f"[NGUỒN: {filename}]\n{doc.page_content}"
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