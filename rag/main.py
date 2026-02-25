import os
import time
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
# 1. LOAD ENV
# =========================

load_dotenv()

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
DATABASE_URL = os.getenv("DATABASE_URL")

if not GOOGLE_API_KEY:
    raise ValueError("Thiếu GOOGLE_API_KEY")

if not DATABASE_URL:
    raise ValueError("Thiếu DATABASE_URL")

app = FastAPI()

# =========================
# 2. EMBEDDING + VECTOR STORE
# =========================

embeddings = GoogleGenerativeAIEmbeddings(
    model="models/gemini-embedding-001",
    google_api_key=GOOGLE_API_KEY,
)

vector_store = PGVector(
    embeddings=embeddings,
    collection_name="my_docs",
    connection=DATABASE_URL,
    use_jsonb=True,
)

retriever = vector_store.as_retriever(search_kwargs={"k": 3})

# =========================
# 3. LLM MODELS
# =========================

# Model nhanh để rewrite
llm_fast = ChatGoogleGenerativeAI(
    model="models/gemini-2.5-flash",
    temperature=0.3,
    google_api_key=GOOGLE_API_KEY,
)

# Model trả lời chính
llm_smart = ChatGoogleGenerativeAI(
    model="models/gemini-2.5-flash",
    temperature=0.3,
    google_api_key=GOOGLE_API_KEY,
)

# =========================
# 4. REWRITE CHAIN
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

contextualize_chain = (
    contextualize_q_prompt
    | llm_fast
    | StrOutputParser()   # QUAN TRỌNG: đảm bảo luôn là string
)

# =========================
# 5. QA CHAIN
# =========================

qa_system_prompt = """
Bạn là trợ lý AI chuyên nghiệp của hệ thống E-learning EduMind.

Sử dụng các đoạn ngữ cảnh sau để trả lời câu hỏi.

Nếu câu hỏi liên quan đến hình ảnh (thẻ [HÌNH ẢNH...]),
hãy mô tả thật chi tiết dựa trên thông tin có sẵn.

<context>
{context}
</context>
"""

qa_prompt = ChatPromptTemplate.from_messages([
    ("system", qa_system_prompt),
    MessagesPlaceholder("chat_history"),
    ("human", "{input}"),
])

question_answer_chain = create_stuff_documents_chain(
    llm_smart,
    qa_prompt
)

# =========================
# 6. REQUEST MODELS
# =========================

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    question: str
    chat_history: list[ChatMessage] = []

# =========================
# 7. CHAT ENDPOINT
# =========================

@app.post("/api/chat")
async def chat_endpoint(request: ChatRequest):
    try:
        # Convert history sang LangChain format
        langchain_history = []

        for msg in request.chat_history:
            if msg.role == "User":
                langchain_history.append(
                    HumanMessage(content=msg.content)
                )
            elif msg.role == "AiAssistant":
                langchain_history.append(
                    AIMessage(content=msg.content)
                )

        print("👉 --- CHAT REQUEST ---")
        print("👉 History length:", len(langchain_history))

        # =====================
        # STEP 1: REWRITE
        # =====================
        rewritten_question = contextualize_chain.invoke({
            "input": request.question,
            "chat_history": langchain_history
        })

        if not rewritten_question or not rewritten_question.strip():
            rewritten_question = request.question

        print("✅ Rewritten:", rewritten_question)

        # =====================
        # STEP 2: RETRIEVE (with retry)
        # =====================

        print("🚀 Sending to retriever. Type:", type(rewritten_question))

        rewritten_question = str(rewritten_question)

        if not rewritten_question.strip():
            rewritten_question = request.question

        print("✅ Final type:", type(rewritten_question))
        print("✅ Final value:", rewritten_question)

        retrieved_docs = retriever.invoke(rewritten_question)

        if not isinstance(retrieved_docs, list):
            raise TypeError(f"Retriever returned {type(retrieved_docs)}, expected list[Document]")

        print("✅ Retrieved docs:", len(retrieved_docs))

        if retrieved_docs:
            print("FIRST ELEMENT TYPE:", type(retrieved_docs[0]))


        # =====================
        # STEP 3: BUILD CONTEXT
        # =====================

        context_parts = []

        for i, doc in enumerate(retrieved_docs):
            if hasattr(doc, "page_content"):
                context_parts.append(doc.page_content)
            else:
                print(f"⚠️ Doc {i} is not Document. Type:", type(doc))
                context_parts.append(str(doc))

        context = "\n\n".join(context_parts)

        print("✅ Context built. Length:", len(context))


        # =====================
        # STEP 4: ANSWER
        # =====================

        raw_answer = question_answer_chain.invoke({
            "input": request.question,
            "chat_history": langchain_history,
            "context": retrieved_docs,
        })

        # 🔥 Normalize answer (LangChain đôi khi trả AIMessage)
        if hasattr(raw_answer, "content"):
            answer = raw_answer.content
        else:
            answer = str(raw_answer)

        print("✅ Answer generated")

        return {
            "answer": answer,
            "sources": [
                doc.page_content[:200] + "..."
                for doc in retrieved_docs
            ]
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