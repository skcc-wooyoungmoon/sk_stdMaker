
import { GoogleGenAI, Type } from "@google/genai";
import type { GenerationResult, FileWithPath } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const readFileAsText = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsText(file);
  });
};

export const generateContent = async (files: File[], conventions: string): Promise<GenerationResult> => {
  const fileSummaries = await Promise.all(
    files.map(async (file) => {
      let contentPreview = `File Name: ${file.name}, File Type: ${file.type}`;
      if (file.type === 'text/markdown' || file.name.endsWith('.md')) {
        try {
          const content = await readFileAsText(file);
          contentPreview += `\nContent Preview:\n---\n${content.substring(0, 500)}...\n---`;
        } catch (e) {
          console.error(`Could not read file ${file.name}`, e);
        }
      }
      return contentPreview;
    })
  );

  const prompt = `
    당신은 세계 최고의 Spring Boot 아키텍트이자 기술 문서 작성가입니다.
    
    주어진 참조 문서와 개발 관례를 기반으로, 다음 두 가지 결과물을 생성해주세요.
    1. 견고하고 확장 가능한 Spring Boot 프레임워크의 전체 소스 코드 구조. 각 파일의 전체 경로와 내용을 포함해야 합니다.
    2. 생성된 프레임워크를 사용하기 위한 상세한 개발 표준 및 가이드. 이 가이드는 마크다운 형식이어야 합니다.

    모든 결과물은 한국어로 작성되어야 합니다. (소스코드 주석 포함)

    ## 입력 정보:

    ### 1. 참조 문서 요약
    ${fileSummaries.length > 0 ? fileSummaries.join('\n\n') : '없음'}

    ### 2. 핵심 개발 관례 및 요구사항
    ${conventions || '지정된 관례 없음. 일반적인 모범 사례를 따를 것.'}

    ## 출력 형식:
    반드시 아래에 정의된 JSON 스키마를 준수하여 응답해야 합니다.
    - fileSystem: 파일 경로('path')와 파일 내용('content')을 포함하는 객체들의 배열.
    - guideMd: 개발 가이드 전체 내용이 담긴 마크다운 형식의 문자열.
    
    예시 main 클래스:
    \`\`\`java
    package com.example.project;

    import org.springframework.boot.SpringApplication;
    import org.springframework.boot.autoconfigure.SpringBootApplication;

    /**
     * 어플리케이션 메인 클래스
     */
    @SpringBootApplication
    public class ProjectApplication {

        public static void main(String[] args) {
            SpringApplication.run(ProjectApplication.class, args);
        }

    }
    \`\`\`
    
    build.gradle.kts 예시:
    \`\`\`kotlin
    plugins {
        java
        id("org.springframework.boot") version "3.2.5"
        id("io.spring.dependency-management") version "1.1.4"
    }

    group = "com.example"
    version = "0.0.1-SNAPSHOT"

    java {
        sourceCompatibility = JavaVersion.VERSION_17
    }

    repositories {
        mavenCentral()
    }

    dependencies {
        implementation("org.springframework.boot:spring-boot-starter-web")
        implementation("org.springframework.boot:spring-boot-starter-data-jpa")
        runtimeOnly("com.h2database:h2")
        testImplementation("org.springframework.boot:spring-boot-starter-test")
    }

    tasks.withType<Test> {
        useJUnitPlatform()
    }
    \`\`\`
    `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            fileSystem: {
              type: Type.ARRAY,
              description: "An array of files with their full path and content.",
              items: {
                type: Type.OBJECT,
                properties: {
                  path: { type: Type.STRING, description: "e.g., src/main/java/com/example/demo/DemoApplication.java" },
                  content: { type: Type.STRING, description: "The source code or content of the file." }
                }
              }
            },
            guideMd: {
              type: Type.STRING,
              description: "The full development guide in Markdown format."
            }
          }
        },
        temperature: 0.5,
      },
    });

    const jsonText = response.text.trim();
    const parsedResult = JSON.parse(jsonText);
    
    if (!parsedResult.fileSystem || !parsedResult.guideMd) {
        throw new Error("AI 응답이 예상된 형식이 아닙니다.");
    }

    return parsedResult as GenerationResult;

  } catch (error) {
    console.error("Error generating content from Gemini API:", error);
    if (error instanceof Error) {
        if (error.message.includes('API key not valid')) {
            throw new Error('설정된 API 키가 유효하지 않습니다. 환경 변수를 확인해주세요.');
        }
         if (error.message.includes('Quota exceeded')) {
            throw new Error('API 사용 할당량을 초과했습니다. 잠시 후 다시 시도해주세요.');
        }
    }
    throw new Error("AI 모델과 통신하는 중 오류가 발생했습니다.");
  }
};
