export type ToolCategory = 'Image' | 'PDF' | 'Text' | 'Developer' | 'Utilities';

export interface Tool {
  id: string;
  name: string;
  description: string;
  category: ToolCategory;
  icon: string; // Key maps to Lucide icons
  isCore: boolean; // True for the 5 implemented tools
  keywords: string[];
}

export interface AdOption {
  slot: string;
  format: string;
  label: string;
}
