import type { Distro, Template } from "../types";
import {
  CREATIVE_PARAMS,
  familyParams,
  findCreativeParam,
  findParam,
} from "./paramCatalog";

type Buildable = Pick<
  Distro | Template,
  "family" | "selectedParams" | "selectedCreativeParams" | "customKeyValues"
>;

export const buildTagString = (entity: Buildable): string => {
  const parts: string[] = [];

  for (const def of familyParams(entity.family)) {
    if (entity.selectedParams.includes(def.id)) {
      const found = findParam(entity.family, def.id);
      if (found) parts.push(found.output);
    }
  }

  for (const def of CREATIVE_PARAMS) {
    if (entity.selectedCreativeParams.includes(def.id)) {
      const found = findCreativeParam(def.id);
      if (found) parts.push(found.output);
    }
  }

  for (const kv of entity.customKeyValues) {
    if (!kv.key.trim()) continue;
    parts.push(`&${encodeURIComponent(kv.key)}=${encodeURIComponent(kv.value)}`);
  }

  return parts.join("");
};

const RADIUS_BASE = "https://radius.video/v1/distributions";

export const buildDistroUrl = (distro: Distro): string =>
  `${RADIUS_BASE}/${distro.distributionId}?line-item-id=${distro.lineItemId}${buildTagString(distro)}`;
