import React, { useState, useMemo, useEffect } from 'react';
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
                <div className="grid grid-cols-1 md:grid-cols-12 h-[60vh] max-h-[700px]">
                    <div className="md:col-span-4 lg:col-span-3 border-r border-slate-200 p-2 overflow-y-auto">
                        <div className="space-y-1">
                            {fileTree.map(node => (
                                <FileTreeItem key={node.path} node={node} selectedFile={selectedFile} onFileSelect={setSelectedFile} initiallyExpanded={true} />
                            ))}
                        </div>
                    </div>
                    <div className="md:col-span-8 lg:col-span-9 flex flex-col overflow-hidden bg-slate-50">
                        {currentFileContent ? (
                            <>
                                <div className="p-3 bg-slate-200 border-b border-slate-300 text-sm text-slate-700 font-mono flex-shrink-0">{selectedFile}</div>
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
