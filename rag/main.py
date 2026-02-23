from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv
import os

from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
from langchain_postgres import PGVector
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_community.embeddings import HuggingFaceEmbeddings 

load_dotenv()
app = FastAPI()

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
DATABASE_URL = os.getenv("DATABASE_URL")

if not GOOGLE_API_KEY:
    raise ValueError("Chưa điền GOOGLE_API_KEY trong file .env")

embeddings = GoogleGenerativeAIEmbeddings(model="models/gemini-embedding-001")

vector_store = PGVector(
    embeddings=embeddings,
    collection_name="my_docs",
    connection=DATABASE_URL,
    use_jsonb=True,
)
retriever = vector_store.as_retriever(search_kwargs={"k": 3})

template = """Bạn là một trợ lý AI hữu ích cho ứng dụng EduMind. Hãy trả lời câu hỏi dựa trên ngữ cảnh sau đây:

<context>
{context}
</context>

Câu hỏi: {question}
Trả lời:"""
prompt = ChatPromptTemplate.from_template(template)

def format_docs(docs):
    return "\n\n".join(doc.page_content for doc in docs)

class QueryRequest(BaseModel):
    question: str

@app.post("/api/chat")
async def chat_endpoint(request: QueryRequest):
    try:
        llm = ChatGoogleGenerativeAI(
            model="models/gemini-2.5-flash", 
            temperature=0.3, 
            google_api_key=GOOGLE_API_KEY
        )

        docs = retriever.invoke(request.question)
        context_text = format_docs(docs)

        debug_prompt = template.format(context=context_text, question=request.question)

        print("-" * 20)
        print(debug_prompt)
        print("="*50 + "\n")

        chain = prompt | llm | StrOutputParser()
        
        answer_text = chain.invoke({
            "context": context_text,
            "question": request.question
        })
        
        sources = [doc.page_content[:100] + "..." for doc in docs]
        
        return {
            "answer": answer_text,
            "sources": sources
        }

    except Exception as e:
        print(f"❌ LỖI: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))