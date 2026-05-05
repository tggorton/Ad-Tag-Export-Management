import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from "react";
import type {
  AppState,
  CustomKeyValue,
  Distro,
  ParamDef,
  ParamFamilyKey,
  ParamsCatalog,
  Role,
  Template,
} from "../types";
import { seedTemplates } from "./seedData";
import { SEED_PARAMS_CATALOG } from "../lib/paramCatalog";

const STORAGE_KEY = "radius.adtags.v1";

const initialState: AppState = {
  role: "user",
  templates: seedTemplates,
  distros: [],
  nextDistributionId: 12100,
  paramsCatalog: SEED_PARAMS_CATALOG,
};

type Action =
  | { type: "hydrate"; state: AppState }
  | { type: "setRole"; role: Role }
  | { type: "addDistro"; distro: Distro }
  | { type: "updateDistro"; distro: Distro }
  | { type: "removeDistro"; id: string }
  | { type: "addTemplate"; template: Template }
  | { type: "updateTemplate"; template: Template }
  | { type: "deleteTemplates"; ids: string[] }
  | { type: "addParam"; family: ParamFamilyKey; param: ParamDef }
  | { type: "updateParam"; family: ParamFamilyKey; param: ParamDef }
  | { type: "deleteParam"; family: ParamFamilyKey; paramId: string };

const reducer = (state: AppState, action: Action): AppState => {
  switch (action.type) {
    case "hydrate":
      return action.state;
    case "setRole":
      return { ...state, role: action.role };
    case "addDistro":
      return {
        ...state,
        distros: [...state.distros, action.distro],
        nextDistributionId: Math.max(
          state.nextDistributionId,
          action.distro.distributionId + 1,
        ),
      };
    case "updateDistro":
      return {
        ...state,
        distros: state.distros.map((d) =>
          d.id === action.distro.id ? action.distro : d,
        ),
      };
    case "removeDistro":
      return {
        ...state,
        distros: state.distros.filter((d) => d.id !== action.id),
      };
    case "addTemplate":
      return { ...state, templates: [...state.templates, action.template] };
    case "updateTemplate":
      return {
        ...state,
        templates: state.templates.map((t) =>
          t.id === action.template.id ? action.template : t,
        ),
      };
    case "deleteTemplates": {
      const idSet = new Set(action.ids);
      return {
        ...state,
        templates: state.templates.filter((t) => !idSet.has(t.id)),
      };
    }
    case "addParam":
      return {
        ...state,
        paramsCatalog: {
          ...state.paramsCatalog,
          [action.family]: [
            ...state.paramsCatalog[action.family],
            action.param,
          ],
        },
      };
    case "updateParam":
      return {
        ...state,
        paramsCatalog: {
          ...state.paramsCatalog,
          [action.family]: state.paramsCatalog[action.family].map((p) =>
            p.id === action.param.id ? action.param : p,
          ),
        },
      };
    case "deleteParam":
      return {
        ...state,
        paramsCatalog: {
          ...state.paramsCatalog,
          [action.family]: state.paramsCatalog[action.family].filter(
            (p) => p.id !== action.paramId,
          ),
        },
      };
    default:
      return state;
  }
};

interface AppContextValue {
  state: AppState;
  setRole: (role: Role) => void;
  addDistro: (distro: Distro) => void;
  updateDistro: (distro: Distro) => void;
  removeDistro: (id: string) => void;
  addTemplate: (template: Template) => void;
  updateTemplate: (template: Template) => void;
  deleteTemplates: (ids: string[]) => void;
  addParam: (family: ParamFamilyKey, param: ParamDef) => void;
  updateParam: (family: ParamFamilyKey, param: ParamDef) => void;
  deleteParam: (family: ParamFamilyKey, paramId: string) => void;
  nextDistributionId: () => number;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

/**
 * Migrate legacy entities that had `customMacros` (now consolidated into
 * `customKeyValues`). The macro `{ macro, token }` shape is mapped to
 * `{ key: macro, value: token }` and merged into `customKeyValues`.
 */
const migrateCustomFields = <T extends { customKeyValues: CustomKeyValue[] }>(
  entity: T,
): T => {
  const legacyMacros = (
    entity as unknown as {
      customMacros?: Array<{ id: string; macro: string; token: string }>;
    }
  ).customMacros;
  if (!legacyMacros || legacyMacros.length === 0) return entity;
  return {
    ...entity,
    customKeyValues: [
      ...entity.customKeyValues,
      ...legacyMacros.map((m) => ({ id: m.id, key: m.macro, value: m.token })),
    ],
  };
};

const ensureCatalog = (raw: ParamsCatalog | undefined): ParamsCatalog => {
  if (!raw || !raw.nexxen || !raw.ttd || !raw.creative) {
    return SEED_PARAMS_CATALOG;
  }
  return raw;
};

const loadFromStorage = (): AppState | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AppState;
    if (!parsed.templates || !parsed.distros) return null;
    // We intentionally do NOT re-merge missing built-in templates here so that
    // admin deletions persist across reloads. New users (no localStorage yet)
    // still get the full seed set via `initialState`.
    return {
      ...initialState,
      ...parsed,
      templates: parsed.templates.map(migrateCustomFields),
      distros: parsed.distros.map(migrateCustomFields),
      paramsCatalog: ensureCatalog(parsed.paramsCatalog),
    };
  } catch {
    return null;
  }
};

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(reducer, initialState, (init) => {
    const fromStorage = loadFromStorage();
    return fromStorage ?? init;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const value = useMemo<AppContextValue>(
    () => ({
      state,
      setRole: (role) => dispatch({ type: "setRole", role }),
      addDistro: (distro) => dispatch({ type: "addDistro", distro }),
      updateDistro: (distro) => dispatch({ type: "updateDistro", distro }),
      removeDistro: (id) => dispatch({ type: "removeDistro", id }),
      addTemplate: (template) => dispatch({ type: "addTemplate", template }),
      updateTemplate: (template) =>
        dispatch({ type: "updateTemplate", template }),
      deleteTemplates: (ids) => dispatch({ type: "deleteTemplates", ids }),
      addParam: (family, param) => dispatch({ type: "addParam", family, param }),
      updateParam: (family, param) =>
        dispatch({ type: "updateParam", family, param }),
      deleteParam: (family, paramId) =>
        dispatch({ type: "deleteParam", family, paramId }),
      nextDistributionId: () => state.nextDistributionId,
    }),
    [state],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = (): AppContextValue => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
};
