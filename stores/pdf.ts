import { create } from "zustand";

type PdfState = {
  open: boolean;
  loading: boolean;
  url: string | null;
  fileName: string;
  openDialog: () => void;
  closeDialog: () => void;
  setLoading: (v: boolean) => void;
  setUrl: (u: string | null) => void;
  setFileName: (n: string) => void;
};

export const usePdfStore = create<PdfState>((set) => ({
  open: false,
  loading: false,
  url: null,
  fileName: "arquivo.pdf",
  openDialog: () => set({ open: true }),
  closeDialog: () => set({ open: false, url: null }),
  setLoading: (v) => set({ loading: v }),
  setUrl: (u) => set({ url: u }),
  setFileName: (n) => set({ fileName: n }),
}));

