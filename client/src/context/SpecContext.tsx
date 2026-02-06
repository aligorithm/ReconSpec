import {
  createContext,
  ReactNode,
  useContext,
  useReducer,
  useCallback,
  useEffect,
} from "react";
import type { ParsedSpec, EndpointDetail } from "@reconspec/shared";
import { parseSpec } from "../services/api.js";

/**
 * State shape for the spec context
 */
interface SpecState {
  parsedSpec: ParsedSpec | null;
  isLoading: boolean;
  error: string | null;
  expandedGroups: Set<string>;
  expandedEndpoints: Set<string>;
  selectedEndpoint: string | null;
}

/**
 * Action types for the spec reducer
 */
type SpecAction =
  | { type: "SPEC_LOADING" }
  | { type: "SPEC_LOADED"; payload: ParsedSpec }
  | { type: "SPEC_ERROR"; payload: string }
  | { type: "SPEC_CLEARED" }
  | { type: "TOGGLE_GROUP"; payload: string }
  | { type: "TOGGLE_ENDPOINT"; payload: string }
  | { type: "SELECT_ENDPOINT"; payload: string | null }
  | { type: "EXPAND_ALL_GROUPS" }
  | { type: "COLLAPSE_ALL_GROUPS" }
  | { type: "EXPAND_ALL_ENDPOINTS" }
  | { type: "COLLAPSE_ALL_ENDPOINTS" };

/**
 * Initial state
 */
const initialState: SpecState = {
  parsedSpec: null,
  isLoading: false,
  error: null,
  expandedGroups: new Set(),
  expandedEndpoints: new Set(),
  selectedEndpoint: null,
};

/**
 * Reducer for spec state management
 */
function specReducer(state: SpecState, action: SpecAction): SpecState {
  switch (action.type) {
    case "SPEC_LOADING":
      return {
        ...state,
        isLoading: true,
        error: null,
      };

    case "SPEC_LOADED":
      return {
        ...state,
        parsedSpec: action.payload,
        isLoading: false,
        error: null,
        // Expand all groups by default
        expandedGroups: new Set(action.payload.tagGroups.map((g) => g.name)),
        expandedEndpoints: new Set(),
        selectedEndpoint: null,
      };

    case "SPEC_ERROR":
      return {
        ...state,
        isLoading: false,
        error: action.payload,
      };

    case "SPEC_CLEARED":
      return {
        ...initialState,
      };

    case "TOGGLE_GROUP": {
      const newGroups = new Set(state.expandedGroups);
      if (newGroups.has(action.payload)) {
        newGroups.delete(action.payload);
      } else {
        newGroups.add(action.payload);
      }
      return {
        ...state,
        expandedGroups: newGroups,
      };
    }

    case "TOGGLE_ENDPOINT": {
      const newEndpoints = new Set(state.expandedEndpoints);
      if (newEndpoints.has(action.payload)) {
        newEndpoints.delete(action.payload);
      } else {
        newEndpoints.add(action.payload);
      }
      return {
        ...state,
        expandedEndpoints: newEndpoints,
      };
    }

    case "SELECT_ENDPOINT":
      return {
        ...state,
        selectedEndpoint: action.payload,
      };

    case "EXPAND_ALL_GROUPS":
      return {
        ...state,
        expandedGroups: new Set(state.parsedSpec?.tagGroups.map((g) => g.name) ?? []),
      };

    case "COLLAPSE_ALL_GROUPS":
      return {
        ...state,
        expandedGroups: new Set(),
      };

    case "EXPAND_ALL_ENDPOINTS": {
      const allIds = state.parsedSpec?.tagGroups.flatMap((g) =>
        g.endpoints.map((e) => e.id)
      ) ?? [];
      return {
        ...state,
        expandedEndpoints: new Set(allIds),
      };
    }

    case "COLLAPSE_ALL_ENDPOINTS":
      return {
        ...state,
        expandedEndpoints: new Set(),
      };

    default:
      return state;
  }
}

/**
 * Context interface
 */
interface SpecContextValue extends SpecState {
  loadSpec: (specContent: string) => Promise<void>;
  clearSpec: () => void;
  toggleGroup: (groupName: string) => void;
  toggleEndpoint: (endpointId: string) => void;
  selectEndpoint: (endpointId: string | null) => void;
  expandAllGroups: () => void;
  collapseAllGroups: () => void;
  expandAllEndpoints: () => void;
  collapseAllEndpoints: () => void;
}

/**
 * Create the context
 */
const SpecContext = createContext<SpecContextValue | undefined>(undefined);

/**
 * Provider props
 */
interface SpecProviderProps {
  children: ReactNode;
}

/**
 * SpecProvider component
 */
export function SpecProvider({ children }: SpecProviderProps): JSX.Element {
  const [state, dispatch] = useReducer(specReducer, initialState);

  const loadSpec = useCallback(async (specContent: string) => {
    dispatch({ type: "SPEC_LOADING" });
    try {
      const spec = await parseSpec(specContent);
      dispatch({ type: "SPEC_LOADED", payload: spec });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to parse spec";
      dispatch({ type: "SPEC_ERROR", payload: message });
    }
  }, []);

  const clearSpec = useCallback(() => {
    dispatch({ type: "SPEC_CLEARED" });
  }, []);

  const toggleGroup = useCallback((groupName: string) => {
    dispatch({ type: "TOGGLE_GROUP", payload: groupName });
  }, []);

  const toggleEndpoint = useCallback((endpointId: string) => {
    dispatch({ type: "TOGGLE_ENDPOINT", payload: endpointId });
  }, []);

  const selectEndpoint = useCallback((endpointId: string | null) => {
    dispatch({ type: "SELECT_ENDPOINT", payload: endpointId });
  }, []);

  const expandAllGroups = useCallback(() => {
    dispatch({ type: "EXPAND_ALL_GROUPS" });
  }, []);

  const collapseAllGroups = useCallback(() => {
    dispatch({ type: "COLLAPSE_ALL_GROUPS" });
  }, []);

  const expandAllEndpoints = useCallback(() => {
    dispatch({ type: "EXPAND_ALL_ENDPOINTS" });
  }, []);

  const collapseAllEndpoints = useCallback(() => {
    dispatch({ type: "COLLAPSE_ALL_ENDPOINTS" });
  }, []);

  const value: SpecContextValue = {
    ...state,
    loadSpec,
    clearSpec,
    toggleGroup,
    toggleEndpoint,
    selectEndpoint,
    expandAllGroups,
    collapseAllGroups,
    expandAllEndpoints,
    collapseAllEndpoints,
  };

  return <SpecContext.Provider value={value}>{children}</SpecContext.Provider>;
}

/**
 * Hook to use the spec context
 */
export function useSpec(): SpecContextValue {
  const context = useContext(SpecContext);
  if (!context) {
    throw new Error("useSpec must be used within a SpecProvider");
  }
  return context;
}
