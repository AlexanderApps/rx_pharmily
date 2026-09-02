import { create } from "zustand";
import { supabase } from "@/lib/supabase";
import {
  UnitOfMeasurement,
  MedicationCategory,
  Region,
  Incoterm,
  Currency,
  JobCategory,
  RxRfqCategory,
} from "@/features/reference-data/types/reference-data.types";

function mapUnitRow(row: any): UnitOfMeasurement {
  return {
    id: row.id,
    name: row.name,
    abbreviation: row.abbreviation ?? undefined,
    createdAt: new Date(row.created_at),
  };
}

function mapCategoryRow(row: any): MedicationCategory {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? undefined,
    createdAt: new Date(row.created_at),
  };
}

function mapRegionRow(row: any): Region {
  return {
    id: row.id,
    name: row.name,
    createdAt: new Date(row.created_at),
  };
}

function mapIncotermRow(row: any): Incoterm {
  return {
    id: row.id,
    code: row.code,
    label: row.label,
    description: row.description ?? undefined,
    createdAt: new Date(row.created_at),
  };
}

function mapCurrencyRow(row: any): Currency {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    symbol: row.symbol ?? undefined,
    createdAt: new Date(row.created_at),
  };
}

function mapJobCategoryRow(row: any): JobCategory {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? undefined,
    createdAt: new Date(row.created_at),
  };
}

function mapRxRfqCategoryRow(row: any): RxRfqCategory {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? undefined,
    createdAt: new Date(row.created_at),
  };
}

type ReferenceDataStore = {
  units: UnitOfMeasurement[];
  categories: MedicationCategory[];
  regions: Region[];
  incoterms: Incoterm[];
  currencies: Currency[];
  jobCategories: JobCategory[];
  rxrfqCategories: RxRfqCategory[];
  isLoading: boolean;

  fetchAll: () => Promise<void>;

  addUnit: (name: string, abbreviation?: string) => Promise<boolean>;
  updateUnit: (id: string, name: string, abbreviation?: string) => Promise<boolean>;
  deleteUnit: (id: string) => Promise<boolean>;

  addCategory: (name: string, description?: string) => Promise<boolean>;
  updateCategory: (id: string, name: string, description?: string) => Promise<boolean>;
  deleteCategory: (id: string) => Promise<boolean>;

  addRegion: (name: string) => Promise<boolean>;
  updateRegion: (id: string, name: string) => Promise<boolean>;
  deleteRegion: (id: string) => Promise<boolean>;

  // code + label, matching the shape the app's own IncotermOption
  // (shared/types/shared.types.ts) already uses.
  addIncoterm: (code: string, label: string, description?: string) => Promise<boolean>;
  updateIncoterm: (id: string, code: string, label: string, description?: string) => Promise<boolean>;
  deleteIncoterm: (id: string) => Promise<boolean>;

  addCurrency: (code: string, name: string, symbol?: string) => Promise<boolean>;
  updateCurrency: (id: string, code: string, name: string, symbol?: string) => Promise<boolean>;
  deleteCurrency: (id: string) => Promise<boolean>;

  addJobCategory: (name: string, description?: string) => Promise<boolean>;
  updateJobCategory: (id: string, name: string, description?: string) => Promise<boolean>;
  deleteJobCategory: (id: string) => Promise<boolean>;

  addRxRfqCategory: (name: string, description?: string) => Promise<boolean>;
  updateRxRfqCategory: (id: string, name: string, description?: string) => Promise<boolean>;
  deleteRxRfqCategory: (id: string) => Promise<boolean>;
};

export const useReferenceDataStore = create<ReferenceDataStore>((set, get) => ({
  units: [],
  categories: [],
  regions: [],
  incoterms: [],
  currencies: [],
  jobCategories: [],
  rxrfqCategories: [],
  isLoading: false,

  fetchAll: async () => {
    set({ isLoading: true });
    const [unitsRes, categoriesRes, regionsRes, incotermsRes, currenciesRes, jobCategoriesRes, rxrfqCategoriesRes] =
      await Promise.all([
        supabase.from("units_of_measurement").select("*").order("name"),
        supabase.from("medication_categories").select("*").order("name"),
        supabase.from("regions").select("*").order("name"),
        supabase.from("incoterms").select("*").order("code"),
        supabase.from("currencies").select("*").order("code"),
        supabase.from("job_categories").select("*").order("name"),
        supabase.from("rxrfq_categories").select("*").order("name"),
      ]);
    if (unitsRes.error) console.warn("[reference-data] fetch units failed:", unitsRes.error.message);
    if (categoriesRes.error) console.warn("[reference-data] fetch categories failed:", categoriesRes.error.message);
    if (regionsRes.error) console.warn("[reference-data] fetch regions failed:", regionsRes.error.message);
    if (incotermsRes.error) console.warn("[reference-data] fetch incoterms failed:", incotermsRes.error.message);
    if (currenciesRes.error) console.warn("[reference-data] fetch currencies failed:", currenciesRes.error.message);
    if (jobCategoriesRes.error) console.warn("[reference-data] fetch job categories failed:", jobCategoriesRes.error.message);
    if (rxrfqCategoriesRes.error)
      console.warn("[reference-data] fetch rxrfq categories failed:", rxrfqCategoriesRes.error.message);
    set({
      units: (unitsRes.data ?? []).map(mapUnitRow),
      categories: (categoriesRes.data ?? []).map(mapCategoryRow),
      regions: (regionsRes.data ?? []).map(mapRegionRow),
      incoterms: (incotermsRes.data ?? []).map(mapIncotermRow),
      currencies: (currenciesRes.data ?? []).map(mapCurrencyRow),
      jobCategories: (jobCategoriesRes.data ?? []).map(mapJobCategoryRow),
      rxrfqCategories: (rxrfqCategoriesRes.data ?? []).map(mapRxRfqCategoryRow),
      isLoading: false,
    });
  },

  addUnit: async (name, abbreviation) => {
    const { data: row, error } = await supabase
      .from("units_of_measurement")
      .insert({ name: name.trim(), abbreviation: abbreviation?.trim() || null })
      .select()
      .single();
    if (error || !row) {
      console.warn("[reference-data] addUnit failed:", error?.message);
      return false;
    }
    set((state) => ({ units: [...state.units, mapUnitRow(row)].sort((a, b) => a.name.localeCompare(b.name)) }));
    return true;
  },

  updateUnit: async (id, name, abbreviation) => {
    const { error } = await supabase
      .from("units_of_measurement")
      .update({ name: name.trim(), abbreviation: abbreviation?.trim() || null })
      .eq("id", id);
    if (error) {
      console.warn("[reference-data] updateUnit failed:", error.message);
      return false;
    }
    set((state) => ({
      units: state.units
        .map((u) => (u.id === id ? { ...u, name: name.trim(), abbreviation: abbreviation?.trim() || undefined } : u))
        .sort((a, b) => a.name.localeCompare(b.name)),
    }));
    return true;
  },

  deleteUnit: async (id) => {
    const { error } = await supabase.from("units_of_measurement").delete().eq("id", id);
    if (error) {
      console.warn("[reference-data] deleteUnit failed:", error.message);
      return false;
    }
    set((state) => ({ units: state.units.filter((u) => u.id !== id) }));
    return true;
  },

  addCategory: async (name, description) => {
    const { data: row, error } = await supabase
      .from("medication_categories")
      .insert({ name: name.trim(), description: description?.trim() || null })
      .select()
      .single();
    if (error || !row) {
      console.warn("[reference-data] addCategory failed:", error?.message);
      return false;
    }
    set((state) => ({
      categories: [...state.categories, mapCategoryRow(row)].sort((a, b) => a.name.localeCompare(b.name)),
    }));
    return true;
  },

  updateCategory: async (id, name, description) => {
    const { error } = await supabase
      .from("medication_categories")
      .update({ name: name.trim(), description: description?.trim() || null })
      .eq("id", id);
    if (error) {
      console.warn("[reference-data] updateCategory failed:", error.message);
      return false;
    }
    set((state) => ({
      categories: state.categories
        .map((c) => (c.id === id ? { ...c, name: name.trim(), description: description?.trim() || undefined } : c))
        .sort((a, b) => a.name.localeCompare(b.name)),
    }));
    return true;
  },

  deleteCategory: async (id) => {
    const { error } = await supabase.from("medication_categories").delete().eq("id", id);
    if (error) {
      console.warn("[reference-data] deleteCategory failed:", error.message);
      return false;
    }
    set((state) => ({ categories: state.categories.filter((c) => c.id !== id) }));
    return true;
  },

  addRegion: async (name) => {
    const { data: row, error } = await supabase
      .from("regions")
      .insert({ name: name.trim() })
      .select()
      .single();
    if (error || !row) {
      console.warn("[reference-data] addRegion failed:", error?.message);
      return false;
    }
    set((state) => ({ regions: [...state.regions, mapRegionRow(row)].sort((a, b) => a.name.localeCompare(b.name)) }));
    return true;
  },

  updateRegion: async (id, name) => {
    const { error } = await supabase.from("regions").update({ name: name.trim() }).eq("id", id);
    if (error) {
      console.warn("[reference-data] updateRegion failed:", error.message);
      return false;
    }
    set((state) => ({
      regions: state.regions
        .map((r) => (r.id === id ? { ...r, name: name.trim() } : r))
        .sort((a, b) => a.name.localeCompare(b.name)),
    }));
    return true;
  },

  deleteRegion: async (id) => {
    const { error } = await supabase.from("regions").delete().eq("id", id);
    if (error) {
      console.warn("[reference-data] deleteRegion failed:", error.message);
      return false;
    }
    set((state) => ({ regions: state.regions.filter((r) => r.id !== id) }));
    return true;
  },

  addIncoterm: async (code, label, description) => {
    const { data: row, error } = await supabase
      .from("incoterms")
      .insert({ code: code.trim().toUpperCase(), label: label.trim(), description: description?.trim() || null })
      .select()
      .single();
    if (error || !row) {
      console.warn("[reference-data] addIncoterm failed:", error?.message);
      return false;
    }
    set((state) => ({
      incoterms: [...state.incoterms, mapIncotermRow(row)].sort((a, b) => a.code.localeCompare(b.code)),
    }));
    return true;
  },

  updateIncoterm: async (id, code, label, description) => {
    const { error } = await supabase
      .from("incoterms")
      .update({ code: code.trim().toUpperCase(), label: label.trim(), description: description?.trim() || null })
      .eq("id", id);
    if (error) {
      console.warn("[reference-data] updateIncoterm failed:", error.message);
      return false;
    }
    set((state) => ({
      incoterms: state.incoterms
        .map((i) =>
          i.id === id
            ? { ...i, code: code.trim().toUpperCase(), label: label.trim(), description: description?.trim() || undefined }
            : i,
        )
        .sort((a, b) => a.code.localeCompare(b.code)),
    }));
    return true;
  },

  deleteIncoterm: async (id) => {
    const { error } = await supabase.from("incoterms").delete().eq("id", id);
    if (error) {
      console.warn("[reference-data] deleteIncoterm failed:", error.message);
      return false;
    }
    set((state) => ({ incoterms: state.incoterms.filter((i) => i.id !== id) }));
    return true;
  },

  addCurrency: async (code, name, symbol) => {
    const { data: row, error } = await supabase
      .from("currencies")
      .insert({ code: code.trim().toUpperCase(), name: name.trim(), symbol: symbol?.trim() || null })
      .select()
      .single();
    if (error || !row) {
      console.warn("[reference-data] addCurrency failed:", error?.message);
      return false;
    }
    set((state) => ({
      currencies: [...state.currencies, mapCurrencyRow(row)].sort((a, b) => a.code.localeCompare(b.code)),
    }));
    return true;
  },

  updateCurrency: async (id, code, name, symbol) => {
    const { error } = await supabase
      .from("currencies")
      .update({ code: code.trim().toUpperCase(), name: name.trim(), symbol: symbol?.trim() || null })
      .eq("id", id);
    if (error) {
      console.warn("[reference-data] updateCurrency failed:", error.message);
      return false;
    }
    set((state) => ({
      currencies: state.currencies
        .map((c) =>
          c.id === id
            ? { ...c, code: code.trim().toUpperCase(), name: name.trim(), symbol: symbol?.trim() || undefined }
            : c,
        )
        .sort((a, b) => a.code.localeCompare(b.code)),
    }));
    return true;
  },

  deleteCurrency: async (id) => {
    const { error } = await supabase.from("currencies").delete().eq("id", id);
    if (error) {
      console.warn("[reference-data] deleteCurrency failed:", error.message);
      return false;
    }
    set((state) => ({ currencies: state.currencies.filter((c) => c.id !== id) }));
    return true;
  },

  addJobCategory: async (name, description) => {
    const { data: row, error } = await supabase
      .from("job_categories")
      .insert({ name: name.trim(), description: description?.trim() || null })
      .select()
      .single();
    if (error || !row) {
      console.warn("[reference-data] addJobCategory failed:", error?.message);
      return false;
    }
    set((state) => ({
      jobCategories: [...state.jobCategories, mapJobCategoryRow(row)].sort((a, b) => a.name.localeCompare(b.name)),
    }));
    return true;
  },

  updateJobCategory: async (id, name, description) => {
    const { error } = await supabase
      .from("job_categories")
      .update({ name: name.trim(), description: description?.trim() || null })
      .eq("id", id);
    if (error) {
      console.warn("[reference-data] updateJobCategory failed:", error.message);
      return false;
    }
    set((state) => ({
      jobCategories: state.jobCategories
        .map((c) => (c.id === id ? { ...c, name: name.trim(), description: description?.trim() || undefined } : c))
        .sort((a, b) => a.name.localeCompare(b.name)),
    }));
    return true;
  },

  deleteJobCategory: async (id) => {
    const { error } = await supabase.from("job_categories").delete().eq("id", id);
    if (error) {
      console.warn("[reference-data] deleteJobCategory failed:", error.message);
      return false;
    }
    set((state) => ({ jobCategories: state.jobCategories.filter((c) => c.id !== id) }));
    return true;
  },

  addRxRfqCategory: async (name, description) => {
    const { data: row, error } = await supabase
      .from("rxrfq_categories")
      .insert({ name: name.trim(), description: description?.trim() || null })
      .select()
      .single();
    if (error || !row) {
      console.warn("[reference-data] addRxRfqCategory failed:", error?.message);
      return false;
    }
    set((state) => ({
      rxrfqCategories: [...state.rxrfqCategories, mapRxRfqCategoryRow(row)].sort((a, b) =>
        a.name.localeCompare(b.name),
      ),
    }));
    return true;
  },

  updateRxRfqCategory: async (id, name, description) => {
    const { error } = await supabase
      .from("rxrfq_categories")
      .update({ name: name.trim(), description: description?.trim() || null })
      .eq("id", id);
    if (error) {
      console.warn("[reference-data] updateRxRfqCategory failed:", error.message);
      return false;
    }
    set((state) => ({
      rxrfqCategories: state.rxrfqCategories
        .map((c) => (c.id === id ? { ...c, name: name.trim(), description: description?.trim() || undefined } : c))
        .sort((a, b) => a.name.localeCompare(b.name)),
    }));
    return true;
  },

  deleteRxRfqCategory: async (id) => {
    const { error } = await supabase.from("rxrfq_categories").delete().eq("id", id);
    if (error) {
      console.warn("[reference-data] deleteRxRfqCategory failed:", error.message);
      return false;
    }
    set((state) => ({ rxrfqCategories: state.rxrfqCategories.filter((c) => c.id !== id) }));
    return true;
  },
}));
