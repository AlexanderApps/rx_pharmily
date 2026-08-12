// NOT USED — kept only as a reference/seed source. The live store
// (features/catalog/hooks/use-catalog-data.ts) now fetches from Supabase.
// This is the original mock data from before the Supabase migration.

import { FormularyRequest, Product } from "@/features/catalog/types/catalog.types";

function hoursAgo(hours: number) {
  return new Date(Date.now() - hours * 60 * 60 * 1000);
}

const PRODUCTS: Product[] = [
  { id: "p1", name: "Albendazole 400mg", category: "Medication", defaultUnit: "tablet" },
  { id: "p2", name: "Amlodipine 5mg", category: "Medication", defaultUnit: "tablet" },
  { id: "p3", name: "Amoxicillin 250mg/5ml Suspension", category: "Medication", defaultUnit: "bottle" },
  { id: "p4", name: "Amoxicillin 500mg", category: "Medication", defaultUnit: "capsule" },
  { id: "p5", name: "Artemether/Lumefantrine 20/120mg", category: "Medication", defaultUnit: "pack" },
  { id: "p6", name: "Artesunate Injection 60mg", category: "Medication", defaultUnit: "vial" },
  { id: "p7", name: "Betadine Solution 500ml", category: "Medical Supply", defaultUnit: "bottle" },
  { id: "p8", name: "Blood Pressure Monitor (Auto)", category: "Equipment", defaultUnit: "unit" },
  { id: "p9", name: "Ciprofloxacin 500mg", category: "Medication", defaultUnit: "tablet" },
  { id: "p10", name: "Cotton Wool 500g", category: "Medical Supply", defaultUnit: "roll" },
  { id: "p11", name: "Creatinine Reagent Kit (100 tests)", category: "Lab Supply", defaultUnit: "kit" },
  { id: "p12", name: "Crepe Bandage 10cm", category: "Medical Supply", defaultUnit: "roll" },
  { id: "p13", name: "Digital Pulse Oximeter", category: "Equipment", defaultUnit: "unit" },
  { id: "p14", name: "Disposable Syringes 5ml with Needle", category: "Medical Supply", defaultUnit: "piece" },
  { id: "p15", name: "Ferrous Sulphate 200mg", category: "Medication", defaultUnit: "tablet" },
  { id: "p16", name: "Folic Acid 5mg", category: "Medication", defaultUnit: "tablet" },
  { id: "p17", name: "Gauze Swabs 10x10cm (Sterile)", category: "Medical Supply", defaultUnit: "pack" },
  { id: "p18", name: "Glucose Reagent Kit (100 tests)", category: "Lab Supply", defaultUnit: "kit" },
  { id: "p19", name: "IV Cannula 18G", category: "Medical Supply", defaultUnit: "piece" },
  { id: "p20", name: "Lidocaine HCl 2% Injection 50ml", category: "Medication", defaultUnit: "vial" },
  { id: "p21", name: "Losartan 50mg", category: "Medication", defaultUnit: "tablet" },
  { id: "p22", name: "Medical Examination Gloves (Latex)", category: "Medical Supply", defaultUnit: "box" },
  { id: "p23", name: "Metformin 500mg", category: "Medication", defaultUnit: "tablet" },
  { id: "p24", name: "Metronidazole 400mg", category: "Medication", defaultUnit: "tablet" },
  { id: "p25", name: "Micropore Tape 2.5cm", category: "Medical Supply", defaultUnit: "roll" },
  { id: "p26", name: "Mixtard 30 Insulin Penfill", category: "Medication", defaultUnit: "penfill" },
  { id: "p27", name: "Multivitamin Syrup 100ml", category: "Medication", defaultUnit: "bottle" },
  { id: "p28", name: "Non-Contact Thermometer", category: "Equipment", defaultUnit: "unit" },
  { id: "p29", name: "Normal Saline 500ml", category: "Medication", defaultUnit: "bag" },
  { id: "p30", name: "Paracetamol 500mg", category: "Medication", defaultUnit: "tablet" },
  { id: "p31", name: "Plumpy Nut (RUTF)", category: "Nutrition", defaultUnit: "sachet" },
  { id: "p32", name: "Propofol 10mg/ml Injection 20ml", category: "Medication", defaultUnit: "ampoule" },
  { id: "p33", name: "Strepsil Lozenges", category: "Medication", defaultUnit: "pack" },
  { id: "p34", name: "Surgical Face Masks 3-Ply", category: "Medical Supply", defaultUnit: "box" },
  { id: "p35", name: "Surgical Gloves (M)", category: "Medical Supply", defaultUnit: "box" },
  { id: "p36", name: "Syr Menthodex 100ml", category: "Medication", defaultUnit: "bottle" },
  { id: "p37", name: "Vitamin B Complex", category: "Medication", defaultUnit: "tablet" },
  { id: "p38", name: "Vitamin C 100mg Chewable Tablets", category: "Medication", defaultUnit: "tablet" },
  { id: "p39", name: "Zinc Sulphate 20mg Syrup", category: "Medication", defaultUnit: "bottle" },
  { id: "p40", name: "Insulin Glargine 100IU/ml", category: "Medication", defaultUnit: "vial" },
  { id: "p41", name: "Rapid Malaria Test Kit", category: "Lab Supply", defaultUnit: "kit" },
];

const MOCK_FORMULARY_REQUESTS: FormularyRequest[] = [
  {
    id: "fr1",
    productName: "Azithromycin 250mg",
    category: "Medication",
    defaultUnit: "tablet",
    notes: "Frequently prescribed for respiratory infections — not currently in the catalog.",
    status: "pending",
    createdAt: hoursAgo(5),
    createdBy: CURRENT_USER,
  },
  {
    id: "fr2",
    productName: "Rapid Malaria Test Kit",
    category: "Lab Supply",
    defaultUnit: "kit",
    status: "accepted",
    reviewComment: "Added — good addition for facilities without lab access.",
    reviewedBy: "System Admin",
    reviewedAt: hoursAgo(60),
    createdAt: hoursAgo(72),
    createdBy: CURRENT_USER,
    resultingProductId: "p41",
  },
  {
    id: "fr3",
    productName: "Generic Herbal Supplement X",
    category: "Other",
    status: "rejected",
    reviewComment: "Not a regulated pharmaceutical product — outside catalog scope.",
    reviewedBy: "System Admin",
    reviewedAt: hoursAgo(20),
    createdAt: hoursAgo(30),
    createdBy: CURRENT_USER,
  },
];

