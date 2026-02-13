export type OptionDefinition = {
  value: string;
  labelKey: string;
};

export const CATEGORY_OPTIONS: OptionDefinition[] = [
  { value: "General", labelKey: "pages.parts.inventory.categories.general" },
  { value: "Heating", labelKey: "pages.parts.inventory.categories.heating" },
  { value: "Cooling", labelKey: "pages.parts.inventory.categories.cooling" },
  { value: "Compressors", labelKey: "pages.parts.inventory.categories.compressors" },
  { value: "Sensors", labelKey: "pages.parts.inventory.categories.sensors" },
  { value: "Coils", labelKey: "pages.parts.inventory.categories.coils" },
  { value: "Motors", labelKey: "pages.parts.inventory.categories.motors" },
  { value: "Refrigerants", labelKey: "pages.parts.inventory.categories.refrigerants" },
  { value: "Electronics", labelKey: "pages.parts.inventory.categories.electronics" },
  { value: "Accessories", labelKey: "pages.parts.inventory.categories.accessories" },
  { value: "Filtration", labelKey: "pages.parts.inventory.categories.filtration" },
  { value: "Hardware", labelKey: "pages.parts.inventory.categories.hardware" },
  { value: "Shelving", labelKey: "pages.parts.inventory.categories.shelving" },
  { value: "Packaging", labelKey: "pages.parts.inventory.categories.packaging" },
  { value: "Fluid Control", labelKey: "pages.parts.inventory.categories.fluidControl" },
  { value: "Doors & Seals", labelKey: "pages.parts.inventory.categories.doorsSeals" },
  { value: "Electrical", labelKey: "pages.parts.inventory.categories.electrical" },
  { value: "Fasteners", labelKey: "pages.parts.inventory.categories.fasteners" },
];

export const STATUS_OPTIONS: OptionDefinition[] = [
  { value: "In Stock", labelKey: "pages.parts.inventory.status.inStock" },
  { value: "Low Stock", labelKey: "pages.parts.inventory.status.lowStock" },
  { value: "Out of Stock", labelKey: "pages.parts.inventory.status.outOfStock" },
];

const CATEGORY_ALIASES: Record<string, string> = {
  "general": "General",
  "g\u00e9n\u00e9ral": "General",
  "heating": "Heating",
  "chauffage": "Heating",
  "cooling": "Cooling",
  "refroidissement": "Cooling",
  "compressors": "Compressors",
  "compresseurs": "Compressors",
  "sensors": "Sensors",
  "capteurs": "Sensors",
  "coils": "Coils",
  "bobines": "Coils",
  "motors": "Motors",
  "moteurs": "Motors",
  "refrigerants": "Refrigerants",
  "r\u00e9frig\u00e9rants": "Refrigerants",
  "electronics": "Electronics",
  "\u00e9lectronique": "Electronics",
  "electronique": "Electronics",
  "accessories": "Accessories",
  "accessoires": "Accessories",
  "filtration": "Filtration",
  "hardware": "Hardware",
  "quincaillerie": "Hardware",
  "shelving": "Shelving",
  "\u00e9tag\u00e8res": "Shelving",
  "etag\u00e8res": "Shelving",
  "packaging": "Packaging",
  "emballage": "Packaging",
  "fluid control": "Fluid Control",
  "contr\u00f4le des fluides": "Fluid Control",
  "controle des fluides": "Fluid Control",
  "doors & seals": "Doors & Seals",
  "portes et joints": "Doors & Seals",
  "electrical": "Electrical",
  "\u00e9lectrique": "Electrical",
  "electrique": "Electrical",
  "fasteners": "Fasteners",
  "fixations": "Fasteners",
};

const STATUS_ALIASES: Record<string, string> = {
  "in stock": "In Stock",
  "en stock": "In Stock",
  "low stock": "Low Stock",
  "stock faible": "Low Stock",
  "out of stock": "Out of Stock",
  "rupture de stock": "Out of Stock",
  "in_stock": "In Stock",
  "low_stock": "Low Stock",
  "out_of_stock": "Out of Stock",
};

function normalizeValue(value?: string): string {
  if (!value) {
    return "";
  }
  return value.trim().toLowerCase().replace(/_/g, " ").replace(/\s+/g, " ");
}

export function normalizeCategory(value?: string): string {
  const normalized = normalizeValue(value);
  return CATEGORY_ALIASES[normalized] || value || "";
}

export function normalizeStatus(value?: string): string {
  const normalized = normalizeValue(value);
  return STATUS_ALIASES[normalized] || value || "";
}

export function getCategoryLabel(
  translate: (key: string) => string,
  value?: string,
): string {
  if (!value) {
    return "";
  }
  const canonical = normalizeCategory(value);
  const match = CATEGORY_OPTIONS.find((option) => option.value === canonical);
  return match ? translate(match.labelKey) : value;
}

export function getStatusLabel(
  translate: (key: string) => string,
  value?: string,
): string {
  if (!value) {
    return "";
  }
  const canonical = normalizeStatus(value);
  const match = STATUS_OPTIONS.find((option) => option.value === canonical);
  return match ? translate(match.labelKey) : value;
}
