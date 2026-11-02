import dagre from "dagre";
import { Position, type Edge, type Node } from "reactflow";

const NODE_W = 200;
const NODE_H = 60;

export function layoutHierarchical(nodes: Node[], edges: Edge[]): Node[] {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: "LR", nodesep: 34, ranksep: 130, marginx: 24, marginy: 24 });

  nodes.forEach((n) => {
    const ports = Number((n.data as { ports?: number } | undefined)?.ports ?? 0);
    const rows = ports ? Math.ceil(Math.min(ports, 24) / 12) : 0;
    const w = n.type === "cliente" ? 160 : NODE_W;
    const h = n.type === "cliente" ? 40 : NODE_H + rows * 18 + (rows ? 14 : 0);
    g.setNode(n.id, { width: w, height: h });
  });
  edges.forEach((e) => g.setEdge(e.source, e.target));


  dagre.layout(g);

  return nodes.map((n) => {
    const p = g.node(n.id);
    return {
      ...n,
      position: { x: p.x - (p.width as number) / 2, y: p.y - (p.height as number) / 2 },
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
    };
  });
}
