import { create } from 'zustand';
import { BrandGuidelineRecord } from '@/lib/brandGuidelines';

export interface AuditStoreState {
  isCloudMode: boolean; // Defaults to Cloud (Gemini)
  toggleCloudMode: () => void;
  setCloudMode: (mode: boolean) => void;
  activeBrandId: string | null;
  setActiveBrandId: (id: string | null) => void;
  activeBrandName: string;
  setActiveBrandName: (name: string) => void;
  brandGuidelines: BrandGuidelineRecord[];
  setBrandGuidelines: (guidelines: BrandGuidelineRecord[]) => void;
}

export const useAuditStore = create<AuditStoreState>((set) => ({
  isCloudMode: true, // Defaults to Cloud (Gemini)
  toggleCloudMode: () => set((state) => ({ isCloudMode: !state.isCloudMode })),
  setCloudMode: (mode: boolean) => set({ isCloudMode: mode }),
  activeBrandId: null,
  setActiveBrandId: (id: string | null) => set({ activeBrandId: id }),
  activeBrandName: 'Global Brand Guidelines',
  setActiveBrandName: (name: string) => set({ activeBrandName: name }),
  brandGuidelines: [],
  setBrandGuidelines: (guidelines: BrandGuidelineRecord[]) => set({ brandGuidelines: guidelines }),
}));
