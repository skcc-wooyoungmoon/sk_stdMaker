
export interface FileWithPath {
  path: string;
  content: string;
}

export interface GenerationResult {
  fileSystem: FileWithPath[];
  guideMd: string;
}

export interface FileNode {
  name: string;
  type: 'file' | 'folder';
  path: string;
  content?: string;
  children?: FileNode[];
}
