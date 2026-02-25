import React, { useState } from "react";

export default function Newsletter() {
    const [email, setEmail] = useState<string>("");

    const handleSubscribe = (e: React.FormEvent) => {
        e.preventDefault();
        alert(`Subscribed with email: ${email}`);
        setEmail("");
    };

    return (
        <>
            <div className="bg-[#2273D1] rounded-xl mt-20 py-20 px-15 flex gap-11 items-center">
                <div className="w-[55%]">
                    <h2 className="text-[32px] leading-[1.3] text-white font-semibold">
                        Join and get amazing discount
                    </h2>
                    <p className="mt-1 text-[20px] leading-9 text-white/60">
                        With our responsive themes and mobile and desktop apps
                    </p>
                </div>
                <div className="w-[calc(100% - 55% - 55px)]">
                    <form>
                        <div className="flex gap-4">
                            <input
                                type="email"
                                placeholder="Email Address"
                                className="px-4.5 py-2.5 w-100 rounded-[3px] bg-[#F9F9F9]/30 outline outline-[#F9F9F9]/30 border border-[#F9F9F9]/30 text-[#F9F9F9]/60"
                            />
                            <input
                                type="submit"
                                value="Subcribe"
                                onClick={handleSubscribe}
                                className="cursor-pointer px-4.5 py-2.5 rounded-[3px] bg-[#3DCBB1] text-white"
                            />
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
}
