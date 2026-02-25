import { FaAngleLeft, FaAngleRight } from "react-icons/fa6";
import { useState, useEffect } from "react";
import { slides } from "../../constants";

export default function HeroSlider() {
    const [currentSlide, setCurrentSlide] = useState(0);

    const nextSlide = () => {
        setCurrentSlide((prev) => (prev + 1) % slides.length);
    };

    const prevSlide = () => {
        setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
    };

    useEffect(() => {
        const timer = setInterval(nextSlide, 5000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="mt-10 relative w-full overflow-hidden rounded-[10px]">
            {/* Slider wrapper */}
            <div
                className="flex transition-transform duration-700 ease-in-out"
                style={{ transform: `translateX(-${currentSlide * 100}%)` }}
            >
                {slides.map((slide) => (
                    <div key={slide.id} className="min-w-full relative">
                        {/* Image */}
                        <img
                            src={slide.image}
                            alt={slide.title}
                            className="w-full h-100 object-cover"
                        />

                        {/* Overlay gradient */}
                        <div className="absolute inset-0 bg-linear-to-r from-black/60 to-transparent" />

                        {/* Text */}
                        <div className="absolute top-1/2 left-16 -translate-y-1/2 w-[35%] text-white z-10">
                            <h1 className="text-4xl font-bold">
                                {slide.title}
                            </h1>
                            <p className="mt-3 text-lg">{slide.subtitle}</p>
                            <button className="mt-6 bg-white text-orange-500 font-bold px-6 py-3 rounded-full">
                                {slide.buttonText}
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Prev Button */}
            <button
                onClick={prevSlide}
                className="absolute w-8.5 h-20.25 cursor-pointer flex items-center justify-center left-0 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 backdrop-blur-md p-3 z-20"
            >
                <FaAngleLeft className="text-white text-2xl" />
            </button>

            {/* Next Button */}
            <button
                onClick={nextSlide}
                className="absolute w-8.5 h-20.25 cursor-pointer flex items-center justify-center right-0 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 backdrop-blur-md p-3 z-20"
            >
                <FaAngleRight className="text-white text-2xl" />
            </button>

            {/* Dots */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                {slides.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => setCurrentSlide(index)}
                        className={`w-3 h-3 cursor-pointer rounded-full ${
                            currentSlide === index ? "bg-white" : "bg-white/40"
                        }`}
                    />
                ))}
            </div>
        </div>
    );
}
