import { memo } from "react";
import { type EdgeProps, getStraightPath } from "@xyflow/react";
import type { CoupleEdgeData } from "@/types/graph";

function CoupleEdge({
  sourceX,
  sourceY,
  targetX,
  targetY,
  data,
}: EdgeProps) {
  // Casteamos data manualmente ya que EdgeProps usa Record<string, unknown>
  const edgeData = data as CoupleEdgeData | undefined;
  const active = edgeData?.active ?? true;

  const [edgePath] = getStraightPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
  });

  return (
    <g>
      <path
        d={edgePath}
        fill="none"
        stroke={active ? "#c9a84c66" : "#333"}
        strokeWidth={1.5}
        strokeDasharray={active ? "none" : "4 3"}
      />
    </g>
  );
}

export default memo(CoupleEdge);