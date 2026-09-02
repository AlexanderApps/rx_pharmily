export interface UnitOfMeasurement {
  id: string;
  name: string;
  abbreviation?: string;
  createdAt: Date;
}

export interface MedicationCategory {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
}

export interface Region {
  id: string;
  name: string;
  createdAt: Date;
}

export interface Incoterm {
  id: string;
  code: string;
  label: string;
  description?: string;
  createdAt: Date;
}

export interface Currency {
  id: string;
  code: string;
  name: string;
  symbol?: string;
  createdAt: Date;
}

export interface JobCategory {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
}

export interface RxRfqCategory {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
}
