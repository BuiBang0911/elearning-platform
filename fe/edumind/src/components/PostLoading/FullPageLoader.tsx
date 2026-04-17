import { useEffect } from 'react';

const FullPageLoader = ({ message = "Đang tải...", isFullPage = true }) => {
  useEffect(() => {
    if (isFullPage) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = 'auto';
      };
    }
  }, [isFullPage]);

  return (
    <div className={`${isFullPage ? "fixed z-[9999]" : "absolute z-50 rounded-2xl"} inset-0 flex flex-col items-center justify-center bg-white/70 backdrop-blur-sm`}>
      <div className="relative flex items-center justify-center">
        {/* Vòng quay chính */}
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600"></div>
        
        {/* Điểm nhấn ở giữa */}
        <div className="absolute h-1.5 w-1.5 rounded-full bg-blue-600/40 animate-ping"></div>
      </div>
      
      {/* Text */}
      <p className="mt-3 text-[10px] font-semibold text-slate-500 uppercase tracking-[0.2em] animate-pulse">
        {message}
      </p>
    </div>
  );
};

export default FullPageLoader;