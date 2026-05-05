import type { Distro, ParamsCatalog, Template } from "../types";

type Buildable = Pick<
  Distro | Template,
  "family" | "selectedParams" | "selectedCreativeParams" | "customKeyValues"
>;

export const buildTagString = (
  entity: Buildable,
  catalog: ParamsCatalog,
): string => {
  const parts: string[] = [];

  for (const def of catalog[entity.family]) {
    if (entity.selectedParams.includes(def.id)) {
      parts.push(def.output);
    }
  }

  for (const def of catalog.creative) {
    if (entity.selectedCreativeParams.includes(def.id)) {
      parts.push(def.output);
    }
  }

  for (const kv of entity.customKeyValues) {
    if (!kv.key.trim()) continue;
    parts.push(`&${encodeURIComponent(kv.key)}=${encodeURIComponent(kv.value)}`);
  }

  return parts.join("");
};

const RADIUS_BASE = "https://radius.video/v1/distributions";

export const buildDistroUrl = (
  distro: Distro,
  catalog: ParamsCatalog,
): string =>
  `${RADIUS_BASE}/${distro.distributionId}?line-item-id=${distro.lineItemId}${buildTagString(distro, catalog)}`;
