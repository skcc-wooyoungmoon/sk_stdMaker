
import React from 'react';

interface ConventionInputProps {
  value: string;
  onChange: (value: string) => void;
}

export const ConventionInput: React.FC<ConventionInputProps> = ({ value, onChange }) => {
  return (
    <div className="flex flex-col h-full bg-slate-50 p-6 rounded-lg border-2 border-dashed border-slate-300">
      <label htmlFor="conventions" className="font-semibold text-slate-700 mb-2">
        개발 관례 및 주요 요구사항
      </label>
      <p className="text-sm text-slate-500 mb-3">
        프로젝트에 적용할 기술 스택, 아키텍처 패턴, 코딩 스타일 등을 자유롭게 기술해주세요.
      </p>
      <textarea
        id="conventions"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="예시)
- Java 17, Spring Boot 3.x 기반
- DDD (Domain-Driven Design) 아키텍처 적용
- Controller, Service, Repository 레이어 분리
- 인증/인가는 JWT 사용
- 테스트 코드는 JUnit5, Mockito 사용..."
        className="w-full flex-grow p-3 text-sm bg-white rounded-md border border-slate-300 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition resize-none"
        rows={10}
      />
    </div>
  );
};
