import { useEffect } from 'react';

const FullPageLoader = ({ message = "Đang tải..." }) => {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white/70 backdrop-blur-md">
      <div className="relative flex items-center justify-center">
        {/* Vòng quay chính: Nhỏ hơn (h-12), mỏng hơn (border-2) */}
        <div className="h-12 w-12 animate-spin rounded-full border-2 border-gray-200 border-t-blue-600"></div>
        
        {/* Điểm nhấn ở giữa: Cực nhỏ và mờ nhẹ */}
        <div className="absolute h-2 w-2 rounded-full bg-blue-600/40 animate-ping"></div>
      </div>
      
      {/* Text: Nhỏ gọn, chữ in hoa nhẹ, tracking rộng cho sang */}
      <p className="mt-4 text-xs font-medium text-gray-500 uppercase tracking-[0.2em] animate-pulse">
        {message}
      </p>
    </div>
  );
};

export default FullPageLoader;