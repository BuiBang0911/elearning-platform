import { useState } from "react";
import Chatbot from "./Chatbot";

export default function AiAssistant() {
  const [open, setOpen] = useState(false);

  return (
		<div className="relative">
			<div className="fixed bottom-5 right-0 z-[10000] flex flex-col items-end">
				<button
					onClick={() => setOpen(!open)}
					className="p-0 focus:outline-none hover:cursor-pointer"
				>
					<img
						src="/assets/images/chat-bot-removebg-preview.png"
						alt="Chat Bot"
						className="w-[150px]"
					/>
				</button>
			</div>
			<div>
				<Chatbot open={open} onClose={() => setOpen(false)} />
			</div>
		</div>
    
  );
}