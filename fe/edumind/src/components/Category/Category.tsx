import { categories } from "../../constants";

export default function Category() {
    return (
        <>
            <div className="mt-16">
                <div className="flex items-center gap-2">
                    {categories.map((item) => (
                        <div
                            key={item.id}
                            className="cursor-pointer px-4 py-2 border border-[#1B1B1B]/60 rounded-xl text-[14px] text-[#1B1B1B]/60 transition hover:text-orange-500 hover:border-orange-500"
                        >
                            {item.name}
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
}
