import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import type { GenerationResult, FileWithPath, FileNode } from '../types';
import { FileIcon } from './icons/FileIcon';
import { FolderIcon } from './icons/FolderIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import { ChevronRightIcon } from './icons/ChevronRightIcon';

interface ResultDisplayProps {
  result: GenerationResult;
}

// Helper function to build the file tree
const buildFileTree = (files: FileWithPath[]): FileNode[] => {
  const fileTreeRoot: FileNode = { name: 'root', type: 'folder', path: '', children: [] };
  
  files.forEach(file => {
    let currentNode = fileTreeRoot;
    const parts = file.path.split('/');
    
    parts.forEach((part, index) => {
      const isFile = index === parts.length - 1;
      const currentPath = parts.slice(0, index + 1).join('/');
      let childNode = currentNode.children?.find(child => child.path === currentPath);

      if (!childNode) {
        childNode = {
          name: part,
          type: isFile ? 'file' : 'folder',
          path: currentPath,
          ...(isFile && { content: file.content }),
          ...(!isFile && { children: [] }),
        };
        currentNode.children?.push(childNode);
        currentNode.children?.sort((a, b) => {
            if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
            return a.name.localeCompare(b.name);
        });
      }
      currentNode = childNode;
    });
  });

  return fileTreeRoot.children || [];
};

// Recursive component to render the file tree
const FileTreeItem: React.FC<{
    node: FileNode;
    selectedFile: string | null;
    onFileSelect: (path: string) => void;
    initiallyExpanded: boolean;
}> = ({ node, selectedFile, onFileSelect, initiallyExpanded }) => {
    const [isExpanded, setIsExpanded] = useState(initiallyExpanded);

    if (node.type === 'folder') {
        return (
            <div className="my-1">
                <button onClick={() => setIsExpanded(!isExpanded)} className="flex items-center gap-2 w-full text-left p-1 rounded hover:bg-slate-200 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-300">
                    <ChevronRightIcon className={`h-4 w-4 text-slate-500 transform transition-transform flex-shrink-0 ${isExpanded ? 'rotate-90' : ''}`} />
                    <FolderIcon className="h-5 w-5 text-sky-600 flex-shrink-0" />
                    <span className="font-medium text-slate-700 truncate">{node.name}</span>
                </button>
                {isExpanded && node.children && (
                    <div className="pl-4 border-l-2 border-slate-200 ml-2">
                        {node.children.map(child => (
                            <FileTreeItem key={child.path} node={child} selectedFile={selectedFile} onFileSelect={onFileSelect} initiallyExpanded={false} />
                        ))}
                    </div>
                )}
            </div>
        );
    }
    
    return (
        <button onClick={() => onFileSelect(node.path)} className={`flex items-center gap-2 w-full text-left p-1 rounded transition-colors my-0.5 ${selectedFile === node.path ? 'bg-blue-100 text-blue-800 font-semibold' : 'hover:bg-slate-200'}`}>
            <span className="w-4 flex-shrink-0"></span> {/* Spacer for alignment */}
            <FileIcon className="h-5 w-5 text-slate-500 flex-shrink-0" />
            <span className="text-slate-700 truncate">{node.name}</span>
        </button>
    );
};

export const ResultDisplay: React.FC<ResultDisplayProps> = ({ result }) => {
    const [activeTab, setActiveTab] = useState<'source' | 'guide'>('source');
    const [selectedFile, setSelectedFile] = useState<string | null>(null);
    const [sidebarWidth, setSidebarWidth] = useState(288); // Initial width for the file tree panel

    const sidebarRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const fileTree = useMemo(() => buildFileTree(result.fileSystem), [result.fileSystem]);
    
    const currentFileContent = useMemo(() => {
        if (!selectedFile) return null;
        const findFile = (files: FileWithPath[], path: string) => files.find(f => f.path === path);
        return findFile(result.fileSystem, selectedFile)?.content || '파일을 불러올 수 없습니다.';
    }, [selectedFile, result.fileSystem]);
    
    useEffect(() => {
        if (fileTree.length > 0 && !selectedFile) {
            const findFirstFile = (nodes: FileNode[]): string | null => {
                for(const node of nodes) {
                    if (node.type === 'file') return node.path;
                    if (node.type === 'folder' && node.children) {
                        const found = findFirstFile(node.children);
                        if (found) return found;
                    }
                }
                return null;
            }
            setSelectedFile(findFirstFile(fileTree));
        }
    }, [fileTree, selectedFile]);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault();

        if (!sidebarRef.current || !containerRef.current) return;

        const startWidth = sidebarRef.current.getBoundingClientRect().width;
        const startPosition = e.clientX;

        const handleMouseMove = (moveEvent: MouseEvent) => {
            const newWidth = startWidth + moveEvent.clientX - startPosition;
            const containerWidth = containerRef.current?.clientWidth ?? window.innerWidth;
            
            const minWidth = 200;
            const maxWidth = containerWidth - 300; // Keep at least 300px for the code view

            if (newWidth >= minWidth && newWidth <= maxWidth) {
                setSidebarWidth(newWidth);
            }
        };

        const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
    }, []);

    const handleDownloadGuide = () => {
        const blob = new Blob([result.guideMd], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'development_guide.md');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleDownloadZip = () => {
       alert('ZIP 다운로드 기능은 현재 구현되지 않았습니다. 향후 지원될 예정입니다.');
    }
    
    return (
        <div className="mt-6 bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
            <div className="flex flex-wrap justify-between items-center border-b border-slate-200 p-3 bg-slate-50 gap-4">
                 <div className="flex">
                    <button onClick={() => setActiveTab('source')} className={`px-4 py-2 font-semibold transition-colors rounded-md ${activeTab === 'source' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-blue-600'}`}>
                        프레임워크 소스
                    </button>
                    <button onClick={() => setActiveTab('guide')} className={`px-4 py-2 font-semibold transition-colors rounded-md ml-2 ${activeTab === 'guide' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-blue-600'}`}>
                        개발 가이드
                    </button>
                </div>
                 <div className="flex items-center gap-3">
                    <button onClick={handleDownloadGuide} className="flex items-center gap-2 text-sm bg-white text-slate-700 font-semibold py-2 px-4 border border-slate-300 rounded-lg hover:bg-slate-100 transition-all">
                        <DownloadIcon className="h-4 w-4" /> 가이드 (.md)
                    </button>
                    <button onClick={handleDownloadZip} className="flex items-center gap-2 text-sm bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 transition-all">
                        <DownloadIcon className="h-4 w-4" /> 프로젝트 (.zip)
                    </button>
                </div>
            </div>

            {activeTab === 'source' ? (
                <div ref={containerRef} className="flex h-[60vh] max-h-[700px]">
                    <div
                        ref={sidebarRef}
                        style={{ width: `${sidebarWidth}px` }}
                        className="flex-shrink-0 border-r border-slate-200 overflow-y-auto"
                    >
                        <div className="p-2 space-y-1">
                            {fileTree.map(node => (
                                <FileTreeItem key={node.path} node={node} selectedFile={selectedFile} onFileSelect={setSelectedFile} initiallyExpanded={true} />
                            ))}
                        </div>
                    </div>
                    <div
                        onMouseDown={handleMouseDown}
                        className="w-1.5 flex-shrink-0 bg-slate-200 hover:bg-blue-500 active:bg-blue-600 transition-colors duration-200 cursor-col-resize"
                        aria-label="Resize panel"
                        role="separator"
                        aria-orientation="vertical"
                    />
                    <div className="flex-grow flex flex-col overflow-hidden bg-slate-50 min-w-0">
                        {currentFileContent ? (
                            <>
                                <div className="p-3 bg-slate-200 border-b border-slate-300 text-sm text-slate-700 font-mono flex-shrink-0 truncate" title={selectedFile ?? ''}>{selectedFile}</div>
                                <div className="flex-grow overflow-auto">
                                    <pre className="p-4 text-sm h-full w-full text-slate-800"><code>{currentFileContent}</code></pre>
                                </div>
                            </>
                        ) : (
                            <div className="flex items-center justify-center h-full text-slate-500">
                                파일을 선택하여 내용을 확인하세요.
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="p-4 sm:p-6 overflow-y-auto h-[60vh] max-h-[700px] bg-slate-50">
                     <div className="prose max-w-none p-4 bg-white rounded-md border border-slate-200">
                        <pre className="whitespace-pre-wrap break-words font-sans text-base text-slate-800">{result.guideMd}</pre>
                     </div>
                </div>
            )}
        </div>
    );
};
