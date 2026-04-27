export type Role = "user" | "admin";

export type Region = "us-east-1" | "australia" | "europe";

export type TemplateFamily = "nexxen" | "ttd";

export interface CustomKeyValue {
  id: string;
  key: string;
  value: string;
}

export interface Template {
  id: string;
  name: string;
  family: TemplateFamily;
  region: Region;
  selectedParams: string[];
  selectedCreativeParams: string[];
  customKeyValues: CustomKeyValue[];
  isBuiltIn?: boolean;
}

export interface Distro {
  id: string;
  name: string;
  templateId: string;
  family: TemplateFamily;
  region: Region;
  selectedParams: string[];
  selectedCreativeParams: string[];
  customKeyValues: CustomKeyValue[];
  distributionId: number;
  lineItemId: number;
  createdAt: string;
}

export interface AppState {
  role: Role;
  templates: Template[];
  distros: Distro[];
  nextDistributionId: number;
}
