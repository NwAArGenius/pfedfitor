import { create } from 'zustand';

interface Edit {
  id: string;
  page_number: number;
  edit_type: string;
  old_value?: string;
  new_value?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  font_size?: number;
  color?: string;
}

interface Document {
  id: string;
  filename: string;
  page_count: number;
  is_scanned: boolean;
  status: string;
}

interface DocumentState {
  currentDocument: Document | null;
  edits: Edit[];
  currentPage: number;
  setCurrentDocument: (doc: Document | null) => void;
  setEdits: (edits: Edit[]) => void;
  addEdit: (edit: Edit) => void;
  setCurrentPage: (page: number) => void;
}

export const useDocumentStore = create<DocumentState>((set) => ({
  currentDocument: null,
  edits: [],
  currentPage: 0,
  setCurrentDocument: (doc) => set({ currentDocument: doc }),
  setEdits: (edits) => set({ edits }),
  addEdit: (edit) => set((state) => ({ edits: [...state.edits, edit] })),
  setCurrentPage: (page) => set({ currentPage: page }),
}));
