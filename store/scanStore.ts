import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ScanResult, DetectedRisk } from '@/lib/types';

interface ScanStore {
  input: string;
  inputType: 'link' | 'text';
  setInput: (v: string) => void;
  setInputType: (t: 'link' | 'text') => void;

  isScanning: boolean;
  scanProgress: number;
  currentAnalysis: string;
  detectedRisks: DetectedRisk[];
  startScan: () => void;
  updateProgress: (p: number) => void;
  setCurrentAnalysis: (text: string) => void;
  addDetectedRisk: (risk: DetectedRisk) => void;
  resetScan: () => void;
  clearAll: () => void;

  result: ScanResult | null;
  setResult: (r: ScanResult) => void;

  history: ScanResult[];
  addToHistory: (r: ScanResult) => void;
}

export const useScanStore = create<ScanStore>()(
  persist(
    (set) => ({
      input: '',
      inputType: 'text',
      setInput: (v) => set({ input: v }),
      setInputType: (t) => set({ inputType: t }),

      isScanning: false,
      scanProgress: 0,
      currentAnalysis: '',
      detectedRisks: [],
      startScan: () =>
        set({
          isScanning: true,
          scanProgress: 0,
          currentAnalysis: '正在初始化扫描...',
          detectedRisks: [],
          result: null,
        }),
      updateProgress: (p) => set({ scanProgress: p }),
      setCurrentAnalysis: (text) => set({ currentAnalysis: text }),
      addDetectedRisk: (risk) =>
        set((state) => ({
          detectedRisks: [...state.detectedRisks, risk],
        })),
      resetScan: () =>
        set({
          isScanning: false,
          scanProgress: 0,
          currentAnalysis: '',
          detectedRisks: [],
        }),
      clearAll: () =>
        set({
          input: '',
          inputType: 'text',
          isScanning: false,
          scanProgress: 0,
          currentAnalysis: '',
          detectedRisks: [],
          result: null,
        }),

      result: null,
      setResult: (r) => set({ result: r }),

      history: [],
      addToHistory: (r) =>
        set((state) => ({
          history: [r, ...state.history],
        })),
    }),
    {
      name: 'scan-store',
    }
  )
);
