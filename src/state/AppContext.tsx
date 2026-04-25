import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from "react";
import type { AppState, Distro, Role, Template } from "../types";
import { seedTemplates } from "./seedData";

const STORAGE_KEY = "radius.adtags.v1";

const initialState: AppState = {
  role: "user",
  templates: seedTemplates,
  distros: [],
  nextDistributionId: 12100,
};

type Action =
  | { type: "hydrate"; state: AppState }
  | { type: "setRole"; role: Role }
  | { type: "addDistro"; distro: Distro }
  | { type: "updateDistro"; distro: Distro }
  | { type: "removeDistro"; id: string }
  | { type: "addTemplate"; template: Template };

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
  nextDistributionId: () => number;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

const loadFromStorage = (): AppState | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AppState;
    if (!parsed.templates || !parsed.distros) return null;
    return {
      ...initialState,
      ...parsed,
      templates: mergeBuiltInTemplates(parsed.templates),
    };
  } catch {
    return null;
  }
};

const mergeBuiltInTemplates = (stored: Template[]): Template[] => {
  const storedIds = new Set(stored.map((t) => t.id));
  const missingBuiltIns = seedTemplates.filter((t) => !storedIds.has(t.id));
  return [...missingBuiltIns, ...stored];
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
