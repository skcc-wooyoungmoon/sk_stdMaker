import React from 'react';

interface LoadingIndicatorProps {
  message: string;
}

export const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({ message }) => {
  return (
    <div className="text-center my-10 p-8 bg-white rounded-xl shadow-lg border border-slate-200 flex flex-col items-center justify-center">
      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600 mb-6"></div>
      <p className="text-xl font-semibold text-slate-800 mb-2">AI가 프레임워크를 생성하고 있습니다...</p>
      <p className="text-slate-600 transition-opacity duration-500">{message || '잠시만 기다려주세요.'}</p>
    </div>
  );
};
