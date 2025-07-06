import { create } from 'zustand';
import { TenkoRecord, Vehicle } from '@/types/database';

interface TenkoState {
  // 今日の点呼記録
  todayRecords: TenkoRecord[];
  // 車両一覧
  vehicles: Vehicle[];
  // ローディング状態
  loading: boolean;
  error: string | null;

  // アクション
  setTodayRecords: (records: TenkoRecord[]) => void;
  setVehicles: (vehicles: Vehicle[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // ヘルパー関数
  getTodayRecord: (type: 'before' | 'after') => TenkoRecord | null;
  getDefaultVehicle: () => Vehicle | null;
  isCompleted: (type: 'before' | 'after') => boolean;
}

export const useTenkoStore = create<TenkoState>((set, get) => ({
  todayRecords: [],
  vehicles: [],
  loading: false,
  error: null,

  setTodayRecords: (records) => set({ todayRecords: records }),
  setVehicles: (vehicles) => set({ vehicles }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  getTodayRecord: (type) => {
    const { todayRecords } = get();
    return todayRecords.find(record => record.type === type) || null;
  },

  getDefaultVehicle: () => {
    const { vehicles } = get();
    return vehicles.find(vehicle => vehicle.is_default && vehicle.is_active) || null;
  },

  isCompleted: (type) => {
    const { todayRecords } = get();
    return todayRecords.some(record => record.type === type);
  },
}));