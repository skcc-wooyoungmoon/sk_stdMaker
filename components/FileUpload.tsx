
import React, { useCallback, useState } from 'react';
import { UploadCloudIcon } from './icons/UploadCloudIcon';
import { FileIcon } from './icons/FileIcon';
import { XIcon } from './icons/XIcon';

interface FileUploadProps {
  files: File[];
  setFiles: React.Dispatch<React.SetStateAction<File[]>>;
}

export const FileUpload: React.FC<FileUploadProps> = ({ files, setFiles }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const newFiles = Array.from(e.dataTransfer.files);
      setFiles(prevFiles => [...prevFiles, ...newFiles]);
    }
  }, [setFiles]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setFiles(prevFiles => [...prevFiles, ...newFiles]);
    }
  };

  const removeFile = (fileName: string) => {
    setFiles(files.filter(file => file.name !== fileName));
  };
  
  const acceptedFileTypes = ".pdf, .md, .ppt, .pptx";

  return (
    <div className="flex flex-col h-full bg-slate-50 p-6 rounded-lg border-2 border-dashed border-slate-300">
      <div
        className={`flex-grow flex flex-col justify-center items-center text-center p-4 rounded-md transition-colors duration-300 ${isDragging ? 'bg-blue-100 border-blue-400' : 'bg-slate-100'}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <UploadCloudIcon className="h-12 w-12 text-slate-400 mb-3" />
        <p className="font-semibold text-slate-700">참조 문서 업로드</p>
        <p className="text-sm text-slate-500">파일을 드래그하거나 클릭하여 선택하세요</p>
        <p className="text-xs text-slate-400 mt-1">(PDF, MD, PPT)</p>
        <input
          type="file"
          id="file-upload"
          multiple
          accept={acceptedFileTypes}
          onChange={handleFileChange}
          className="hidden"
        />
        <label htmlFor="file-upload" className="mt-4 cursor-pointer bg-white text-blue-600 font-semibold py-2 px-4 border border-blue-300 rounded-lg hover:bg-blue-50 transition-all text-sm">
          파일 선택
        </label>
      </div>
      {files.length > 0 && (
        <div className="mt-4">
          <h4 className="font-semibold text-slate-700 mb-2">업로드된 파일:</h4>
          <ul className="space-y-2 max-h-40 overflow-y-auto pr-2">
            {files.map(file => (
              <li key={file.name} className="flex items-center justify-between bg-white p-2 rounded-md border border-slate-200">
                <div className="flex items-center gap-2 overflow-hidden">
                  <FileIcon className="h-5 w-5 text-slate-500 flex-shrink-0" />
                  <span className="text-sm text-slate-700 truncate" title={file.name}>{file.name}</span>
                </div>
                <button onClick={() => removeFile(file.name)} className="p-1 rounded-full hover:bg-red-100 text-slate-500 hover:text-red-600 transition-colors">
                  <XIcon className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
