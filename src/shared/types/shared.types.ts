export type IncotermOption = {
  code: string;
  label?: string;
  description: string;
  category: "Any Mode" | "Sea/Waterway Only" | "None";
};
