import { memo } from "react";
import type { EdgeProps } from "@xyflow/react";

// Los dos PersonNodes de una pareja ya están visualmente contenidos
// dentro del CoupleNode compound — el edge entre ellos es redundante
// y genera la línea diagonal que cruza el nodo. No renderizamos nada.
function CoupleEdge(_props: EdgeProps) {
  return null;
}

export default memo(CoupleEdge);