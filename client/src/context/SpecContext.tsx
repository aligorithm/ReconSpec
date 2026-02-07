import {
  createContext,
  ReactNode,
  useContext,
  useReducer,
  useCallback,
  useEffect,
} from "react";
import type { ParsedSpec, EndpointDetail, SecurityAssessment } from "@reconspec/shared";
import { parseSpec, analyzeSpec as apiAnalyzeSpec, type APISummary } from "../services/api.js";

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
  // Analysis state
  isAnalyzing: boolean;
  analysisProgress: { completed: number; total: number; currentEndpoint: string } | null;
  apiSummary: APISummary | null;
  analysisTimestamp: string | null;
  analysisErrors: Array<{ endpointId: string; error: string }>;
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
  | { type: "COLLAPSE_ALL_ENDPOINTS" }
  // Analysis actions
  | { type: "ANALYSIS_STARTED" }
  | { type: "ANALYSIS_PROGRESS"; payload: { completed: number; total: number; currentEndpoint: string } }
  | { type: "ANALYSIS_ENDPOINT_COMPLETE"; payload: { endpointId: string; assessment: SecurityAssessment } }
  | { type: "ANALYSIS_SUMMARY_COMPLETE"; payload: APISummary }
  | { type: "ANALYSIS_COMPLETE"; payload: { timestamp: string; errors: Array<{ endpointId: string; error: string }> } }
  | { type: "ANALYSIS_ERROR"; payload: { endpointId: string; error: string } }
  | { type: "ANALYSIS_FAILED"; payload: string }
  | { type: "ANALYSIS_CLEARED" };

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
  isAnalyzing: false,
  analysisProgress: null,
  apiSummary: null,
  analysisTimestamp: null,
  analysisErrors: [],
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

    case "ANALYSIS_STARTED":
      return {
        ...state,
        isAnalyzing: true,
        analysisProgress: null,
        analysisErrors: [],
      };

    case "ANALYSIS_PROGRESS":
      return {
        ...state,
        analysisProgress: action.payload,
      };

    case "ANALYSIS_ENDPOINT_COMPLETE": {
      if (!state.parsedSpec) return state;

      // Update the endpoint's assessment in the tag groups
      const updatedTagGroups = state.parsedSpec.tagGroups.map((group) => ({
        ...group,
        endpoints: group.endpoints.map((ep) =>
          ep.id === action.payload.endpointId
            ? { ...ep, assessment: action.payload.assessment }
            : ep
        ),
      }));

      return {
        ...state,
        parsedSpec: {
          ...state.parsedSpec,
          tagGroups: updatedTagGroups,
        },
      };
    }

    case "ANALYSIS_SUMMARY_COMPLETE":
      return {
        ...state,
        apiSummary: action.payload,
      };

    case "ANALYSIS_COMPLETE":
      return {
        ...state,
        isAnalyzing: false,
        analysisProgress: null,
        analysisTimestamp: action.payload.timestamp,
        analysisErrors: action.payload.errors,
      };

    case "ANALYSIS_ERROR":
      return {
        ...state,
        analysisErrors: [...state.analysisErrors, action.payload],
      };

    case "ANALYSIS_FAILED":
      return {
        ...state,
        isAnalyzing: false,
        analysisProgress: null,
        error: action.payload,
      };

    case "ANALYSIS_CLEARED":
      return {
        ...state,
        isAnalyzing: false,
        analysisProgress: null,
        apiSummary: null,
        analysisTimestamp: null,
        analysisErrors: [],
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
  // Analysis methods
  analyzeSpec: () => Promise<void>;
  clearAnalysis: () => void;
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

  const analyzeSpec = useCallback(async () => {
    if (!state.parsedSpec) {
      dispatch({ type: "SPEC_ERROR", payload: "No spec loaded" });
      return;
    }

    dispatch({ type: "ANALYSIS_STARTED" });

    const errors: Array<{ endpointId: string; error: string }> = [];

    apiAnalyzeSpec(
      state.parsedSpec,
      // onProgress
      (event) => {
        if (event.type === "progress") {
          dispatch({ type: "ANALYSIS_PROGRESS", payload: event.data });
        } else if (event.type === "endpoint_complete") {
          // Update the endpoint with its assessment
          dispatch({
            type: "ANALYSIS_ENDPOINT_COMPLETE",
            payload: {
              endpointId: event.data.endpointId,
              assessment: event.data.assessment,
            },
          });
        } else if (event.type === "summary_complete") {
          dispatch({ type: "ANALYSIS_SUMMARY_COMPLETE", payload: event.data });
        } else if (event.type === "error" && event.data.endpointId) {
          // Individual endpoint error
          dispatch({
            type: "ANALYSIS_ERROR",
            payload: {
              endpointId: event.data.endpointId,
              error: event.data.error,
            },
          });
        }
      },
      // onComplete
      (result) => {
        dispatch({
          type: "ANALYSIS_COMPLETE",
          payload: {
            timestamp: new Date().toISOString(),
            errors,
          },
        });
      },
      // onError
      (error) => {
        dispatch({ type: "ANALYSIS_FAILED", payload: error });
      }
    );
  }, [state.parsedSpec]);

  const clearAnalysis = useCallback(() => {
    dispatch({ type: "ANALYSIS_CLEARED" });
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
    analyzeSpec,
    clearAnalysis,
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
