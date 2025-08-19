
import React, { useState, useCallback } from 'react';
import { FileUpload } from './components/FileUpload';
import { ConventionInput } from './components/ConventionInput';
import { ResultDisplay } from './components/ResultDisplay';
import { LoadingIndicator } from './components/LoadingIndicator';
import { generateContent } from './services/geminiService';
import type { GenerationResult } from './types';
import { LogoIcon } from './components/icons/LogoIcon';

const App: React.FC = () => {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [conventions, setConventions] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GenerationResult | null>(null);

  const handleGenerate = useCallback(async () => {
    if (uploadedFiles.length === 0 && !conventions.trim()) {
      setError('기준이 되는 문서나 개발 관례를 입력해주세요.');
      return;
    }
    setError(null);
    setIsLoading(true);
    setResult(null);

    const loadingSteps = [
      '문서 및 관례 분석 중...',
      '프레임워크 아키텍처 설계 중...',
      '핵심 코드 생성 중...',
      '개발 가이드라인 초안 작성 중...',
      '최종 결과 정리 중...'
    ];

    let step = 0;
    const interval = setInterval(() => {
      setLoadingMessage(loadingSteps[step % loadingSteps.length]);
      step++;
    }, 2500);

    try {
      const resultData = await generateContent(uploadedFiles, conventions);
      setResult(resultData);
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : '결과 생성 중 알 수 없는 오류가 발생했습니다.');
    } finally {
      clearInterval(interval);
      setIsLoading(false);
      setLoadingMessage('');
    }
  }, [uploadedFiles, conventions]);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-6xl mx-auto">
        <header className="flex items-center justify-center space-x-3 mb-6">
          <LogoIcon className="h-10 w-10 text-blue-600" />
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-800 tracking-tight">
            개발 표준 및 가이드 생성기
          </h1>
        </header>
        <p className="text-center text-slate-600 mb-8 max-w-3xl mx-auto">
          참조 문서(PDF, MD, PPT)와 개발 관례를 업로드하여 Spring Boot 프레임워크와 맞춤형 개발 가이드를 생성하세요. AI가 최적의 구조와 표준을 제안해드립니다.
        </p>

        {!result && !isLoading && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6 bg-white rounded-xl shadow-lg border border-slate-200">
            <FileUpload files={uploadedFiles} setFiles={setUploadedFiles} />
            <ConventionInput value={conventions} onChange={setConventions} />
            <div className="lg:col-span-2 mt-4">
              <button
                onClick={handleGenerate}
                disabled={isLoading}
                className="w-full bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 transition-all duration-300 transform hover:scale-105 disabled:bg-slate-400 disabled:cursor-not-allowed disabled:scale-100 flex items-center justify-center gap-2"
              >
                {isLoading ? '생성 중...' : '프레임워크 및 가이드 생성'}
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-6 p-4 bg-red-100 border border-red-300 text-red-800 rounded-lg text-center">
            <strong>오류:</strong> {error}
          </div>
        )}

        {isLoading && <LoadingIndicator message={loadingMessage} />}
        
        {result && (
          <>
            <ResultDisplay result={result} />
            <div className="text-center mt-8">
                <button
                    onClick={() => {
                        setResult(null);
                        setUploadedFiles([]);
                        setConventions('');
                        setError(null);
                    }}
                    className="bg-blue-600 text-white font-semibold py-3 px-8 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 transition-all duration-300"
                >
                    새로 생성하기
                </button>
            </div>
          </>
        )}
      </div>
       <footer className="w-full max-w-6xl mx-auto text-center text-slate-500 mt-12 py-4 border-t border-slate-200">
        <p>&copy; {new Date().getFullYear()} AI Framework Generator. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default App;
