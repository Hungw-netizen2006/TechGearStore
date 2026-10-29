import React from 'react';
import { ShieldCheck, Truck, RotateCcw, Headphones } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 mt-20">
      {/* Service Highlights */}
      <div className="border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
                <Truck className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-slate-100 font-semibold text-sm">Giao hàng hỏa tốc</h4>
                <p className="text-xs text-slate-400">Nhận hàng trong 2h nội thành</p>
              </div>
            </div>
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-slate-100 font-semibold text-sm">Chính hãng 100%</h4>
                <p className="text-xs text-slate-400">Bảo hành 24 tháng 1 đổi 1</p>
              </div>
            </div>
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0">
                <RotateCcw className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-slate-100 font-semibold text-sm">Đổi trả 15 ngày</h4>
                <p className="text-xs text-slate-400">Yên tâm trải nghiệm tech gear</p>
              </div>
            </div>
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center shrink-0">
                <Headphones className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-slate-100 font-semibold text-sm">Hỗ trợ 24/7</h4>
                <p className="text-xs text-slate-400">Tư vấn cấu hình chuyên sâu</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Info */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
          <p>© 2026 TechGear Store. Hệ sinh thái phụ kiện công nghệ gaming chuyên nghiệp.</p>
          <div className="flex items-center gap-6">
            <span className="text-slate-500">React + Vite + Tailwind CSS</span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-500">FastAPI + SQLite</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

