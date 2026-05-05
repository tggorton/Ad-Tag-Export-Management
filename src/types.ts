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
  /**
   * Optional advertiser scope. When set, the template only appears in the
   * Tag Template dropdown for users on a campaign tied to this advertiser.
   * Templates with no advertiserId are visible to everyone.
   */
  advertiserId?: string;
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

export interface ParamDef {
  id: string;
  label: string;
  output: string;
}

export interface ParamsCatalog {
  nexxen: ParamDef[];
  ttd: ParamDef[];
  creative: ParamDef[];
}

export type ParamFamilyKey = "nexxen" | "ttd" | "creative";

export interface AppState {
  role: Role;
  templates: Template[];
  distros: Distro[];
  nextDistributionId: number;
  paramsCatalog: ParamsCatalog;
}
