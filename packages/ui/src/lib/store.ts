import { create } from "zustand";
import { ApiGraph, GraphNode, GraphEdge } from "@api-graph/core";

interface GraphState {
  // Raw data
  graph: ApiGraph | null;
  loading: boolean;
  error: string | null;

  // UI state
  selectedNodeId: string | null;
  filterType: "all" | "route" | "class" | "method" | "function" | "middleware";
  searchQuery: string;

  // Actions
  setGraph: (graph: ApiGraph) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSelectedNodeId: (id: string | null) => void;
  setFilterType: (type: GraphState["filterType"]) => void;
  setSearchQuery: (query: string) => void;

  // Computed helpers
  getSelectedNode: () => GraphNode | null;
  getNodeById: (id: string) => GraphNode | null;
  getEdgesForNode: (id: string) => {
    incoming: GraphEdge[];
    outgoing: GraphEdge[];
  };
  getFilteredNodes: () => GraphNode[];
}

export const useGraphStore = create<GraphState>((set, get) => ({
  graph: null,
  loading: true,
  error: null,
  selectedNodeId: null,
  filterType: "all",
  searchQuery: "",

  setGraph: (graph) => set({ graph, loading: false, error: null }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error, loading: false }),
  setSelectedNodeId: (id) => set({ selectedNodeId: id }),
  setFilterType: (filterType) => set({ filterType }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),

  getSelectedNode: () => {
    const { graph, selectedNodeId } = get();
    if (!graph || !selectedNodeId) return null;
    return graph.nodes.find((n) => n.id === selectedNodeId) ?? null;
  },

  getNodeById: (id: string) => {
    const { graph } = get();
    if (!graph) return null;
    return graph.nodes.find((n) => n.id === id) ?? null;
  },

  getEdgesForNode: (id: string) => {
    const { graph } = get();
    if (!graph) return { incoming: [], outgoing: [] };
    return {
      incoming: graph.edges.filter((e) => e.target === id),
      outgoing: graph.edges.filter((e) => e.source === id),
    };
  },

  getFilteredNodes: () => {
    const { graph, filterType, searchQuery } = get();
    if (!graph) return [];

    let nodes = graph.nodes;

    if (filterType !== "all") {
      nodes = nodes.filter((n) => n.type === filterType);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      nodes = nodes.filter((n) => n.label.toLowerCase().includes(q));
    }

    return nodes;
  },
}));
