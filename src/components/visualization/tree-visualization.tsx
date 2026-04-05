"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import type { Prisma } from "@prisma/client";
import { cn } from "@/lib/utils";

type PersonType = Prisma.PersonGetPayload<Record<string, never>>;
type RelationshipType = Prisma.RelationshipGetPayload<Record<string, never>>;

interface TreeVisualizationProps {
  people: PersonType[];
  relationships: RelationshipType[];
  onPersonClick?: (person: PersonType) => void;
  selectedPersonId?: string | null;
}

const RELATIONSHIP_COLORS = {
  PARENT_CHILD: "#6366f1", // indigo
  PARTNER: "#f59e0b", // amber
  SIBLING: "#10b981", // emerald
};

const RELATIONSHIP_DASH = {
  PARENT_CHILD: "none",
  PARTNER: "none",
  SIBLING: "8,4",
};

const GENDER_COLORS = {
  MALE: "#dbeafe",
  FEMALE: "#fce7f3",
  NON_BINARY: "#f3e8ff",
  OTHER: "#d1fae5",
  UNKNOWN: "#f3f4f6",
};

const GENDER_BORDER = {
  MALE: "#3b82f6",
  FEMALE: "#ec4899",
  NON_BINARY: "#a855f7",
  OTHER: "#10b981",
  UNKNOWN: "#9ca3af",
};

const NODE_W = 160;
const NODE_H = 80;
const H_GAP = 60;
const V_GAP = 100;

function buildLayout(people: PersonType[], relationships: RelationshipType[]) {
  // Simple hierarchical layout: assign generation levels
  const genMap = new Map<string, number>();
  const childOf = new Map<string, string[]>(); // parentId -> childIds

  relationships.forEach((r) => {
    if (r.type === "PARENT_CHILD") {
      const children = childOf.get(r.subjectId) ?? [];
      children.push(r.objectId);
      childOf.set(r.subjectId, children);
    }
  });

  // BFS from roots (people without parents)
  const hasParent = new Set(
    relationships
      .filter((r) => r.type === "PARENT_CHILD")
      .map((r) => r.objectId)
  );

  const roots = people.filter((p) => !hasParent.has(p.id));
  const queue = roots.map((p) => ({ id: p.id, gen: 0 }));

  while (queue.length > 0) {
    const { id, gen } = queue.shift()!;
    if (!genMap.has(id)) {
      genMap.set(id, gen);
    }
    const children = childOf.get(id) ?? [];
    children.forEach((cid) => queue.push({ id: cid, gen: gen + 1 }));
  }

  // Ensure everyone has a generation
  people.forEach((p) => {
    if (!genMap.has(p.id)) genMap.set(p.id, 0);
  });

  // Group by generation
  const genGroups = new Map<number, string[]>();
  for (const [id, gen] of genMap.entries()) {
    const group = genGroups.get(gen) ?? [];
    group.push(id);
    genGroups.set(gen, group);
  }

  // Assign positions
  const positions = new Map<string, { x: number; y: number }>();
  const sortedGens = Array.from(genGroups.keys()).sort((a, b) => a - b);

  sortedGens.forEach((gen) => {
    const group = genGroups.get(gen)!;
    const totalW = group.length * NODE_W + (group.length - 1) * H_GAP;
    let startX = -totalW / 2;
    group.forEach((id) => {
      positions.set(id, { x: startX, y: gen * (NODE_H + V_GAP) });
      startX += NODE_W + H_GAP;
    });
  });

  return positions;
}

export function TreeVisualization({
  people,
  relationships,
  onPersonClick,
  selectedPersonId,
}: TreeVisualizationProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, tx: 0, ty: 0 });

  const positions = buildLayout(people, relationships);

  // Center the view
  useEffect(() => {
    if (containerRef.current && people.length > 0) {
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      setTranslate({ x: w / 2, y: h / 4 });
    }
  }, [people.length]);

  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setScale((s) => Math.min(Math.max(s * delta, 0.2), 3));
  }, []);

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if ((e.target as HTMLElement).closest("[data-node]")) return;
      setIsDragging(true);
      dragStart.current = {
        x: e.clientX,
        y: e.clientY,
        tx: translate.x,
        ty: translate.y,
      };
    },
    [translate]
  );

  const onMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - dragStart.current.x;
      const dy = e.clientY - dragStart.current.y;
      setTranslate({
        x: dragStart.current.tx + dx,
        y: dragStart.current.ty + dy,
      });
    },
    [isDragging]
  );

  const onMouseUp = useCallback(() => setIsDragging(false), []);

  if (people.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        <p>No people added yet. Add people to see the visualization.</p>
      </div>
    );
  }

  // SVG size based on positions
  const allPos = Array.from(positions.values());
  const minX = Math.min(...allPos.map((p) => p.x)) - NODE_W / 2 - 20;
  const maxX = Math.max(...allPos.map((p) => p.x)) + NODE_W / 2 + 20;
  const minY = Math.min(...allPos.map((p) => p.y)) - NODE_H / 2 - 20;
  const maxY = Math.max(...allPos.map((p) => p.y)) + NODE_H / 2 + 20;
  const svgW = maxX - minX + NODE_W;
  const svgH = maxY - minY + NODE_H;

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative h-full w-full overflow-hidden rounded-lg border bg-muted/20",
        isDragging ? "cursor-grabbing" : "cursor-grab"
      )}
      onWheel={onWheel}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      role="application"
      aria-label="Family tree visualization"
    >
      <div
        style={{
          transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
          transformOrigin: "0 0",
          position: "absolute",
        }}
      >
        <svg
          width={svgW}
          height={svgH}
          viewBox={`${minX} ${minY} ${svgW} ${svgH}`}
          style={{ overflow: "visible" }}
          aria-hidden="true"
        >
          {/* Edges */}
          {relationships.map((rel) => {
            const sPos = positions.get(rel.subjectId);
            const oPos = positions.get(rel.objectId);
            if (!sPos || !oPos) return null;

            const x1 = sPos.x + NODE_W / 2;
            const y1 = sPos.y + NODE_H / 2;
            const x2 = oPos.x + NODE_W / 2;
            const y2 = oPos.y + NODE_H / 2;

            const color =
              RELATIONSHIP_COLORS[rel.type as keyof typeof RELATIONSHIP_COLORS] ??
              "#9ca3af";
            const dash =
              RELATIONSHIP_DASH[rel.type as keyof typeof RELATIONSHIP_DASH] ?? "none";

            return (
              <g key={rel.id}>
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={color}
                  strokeWidth={rel.isUncertain ? 1.5 : 2.5}
                  strokeDasharray={rel.isUncertain ? "4,4" : dash}
                  opacity={0.8}
                />
                {/* Relationship label */}
                {rel.subtype && (
                  <text
                    x={(x1 + x2) / 2}
                    y={(y1 + y2) / 2 - 6}
                    textAnchor="middle"
                    fontSize={10}
                    fill={color}
                    className="select-none"
                  >
                    {rel.subtype}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* Person nodes */}
        {people.map((person) => {
          const pos = positions.get(person.id);
          if (!pos) return null;

          const bg =
            GENDER_COLORS[person.gender as keyof typeof GENDER_COLORS] ??
            "#f3f4f6";
          const border =
            GENDER_BORDER[person.gender as keyof typeof GENDER_BORDER] ??
            "#9ca3af";
          const isSelected = selectedPersonId === person.id;

          return (
            <button
              key={person.id}
              data-node="true"
              className={cn(
                "absolute flex flex-col items-center justify-center rounded-lg border-2 p-2 text-center transition-all hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                isSelected ? "ring-2 ring-primary ring-offset-2 shadow-lg" : ""
              )}
              style={{
                left: pos.x,
                top: pos.y,
                width: NODE_W,
                height: NODE_H,
                backgroundColor: bg,
                borderColor: isSelected ? "#6366f1" : border,
              }}
              onClick={() => onPersonClick?.(person)}
              aria-pressed={isSelected}
              aria-label={`${person.firstName} ${person.lastName ?? ""}`}
            >
              {person.profileImageUrl && !person.hideDetails ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={person.profileImageUrl}
                  alt=""
                  className="mb-1 h-8 w-8 rounded-full object-cover"
                />
              ) : (
                <div
                  className="mb-1 flex h-8 w-8 items-center justify-center rounded-full text-white text-sm font-bold"
                  style={{ backgroundColor: border }}
                  aria-hidden="true"
                >
                  {person.firstName[0]?.toUpperCase()}
                </div>
              )}
              <span className="text-xs font-semibold leading-tight truncate w-full px-1">
                {person.hideDetails && person.isLiving
                  ? "Living Person"
                  : `${person.firstName}${person.lastName ? ` ${person.lastName}` : ""}`}
              </span>
              {!person.hideDetails && person.birthDate && (
                <span className="text-[10px] text-gray-500">
                  b. {person.birthDate}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 right-4 rounded-lg border bg-card p-3 shadow-sm text-xs">
        <p className="mb-2 font-semibold">Relationships</p>
        {Object.entries(RELATIONSHIP_COLORS).map(([type, color]) => (
          <div key={type} className="flex items-center gap-2 mb-1">
            <svg width="24" height="8" aria-hidden="true">
              <line
                x1="0"
                y1="4"
                x2="24"
                y2="4"
                stroke={color}
                strokeWidth="2.5"
                strokeDasharray={
                  RELATIONSHIP_DASH[type as keyof typeof RELATIONSHIP_DASH]
                }
              />
            </svg>
            <span className="text-muted-foreground">
              {type.replace("_", " ").toLowerCase()}
            </span>
          </div>
        ))}
        <div className="mt-2 pt-2 border-t flex items-center gap-2">
          <svg width="24" height="8" aria-hidden="true">
            <line
              x1="0"
              y1="4"
              x2="24"
              y2="4"
              stroke="#9ca3af"
              strokeWidth="1.5"
              strokeDasharray="4,4"
            />
          </svg>
          <span className="text-muted-foreground">uncertain</span>
        </div>
      </div>

      {/* Zoom controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-1">
        <button
          className="flex h-8 w-8 items-center justify-center rounded-md border bg-card shadow-sm hover:bg-accent text-lg font-bold"
          onClick={() => setScale((s) => Math.min(s * 1.2, 3))}
          aria-label="Zoom in"
        >
          +
        </button>
        <button
          className="flex h-8 w-8 items-center justify-center rounded-md border bg-card shadow-sm hover:bg-accent text-lg font-bold"
          onClick={() => setScale((s) => Math.max(s * 0.8, 0.2))}
          aria-label="Zoom out"
        >
          −
        </button>
        <button
          className="flex h-8 w-8 items-center justify-center rounded-md border bg-card shadow-sm hover:bg-accent text-xs"
          onClick={() => {
            setScale(1);
            if (containerRef.current) {
              setTranslate({
                x: containerRef.current.clientWidth / 2,
                y: containerRef.current.clientHeight / 4,
              });
            }
          }}
          aria-label="Reset view"
        >
          ⌂
        </button>
      </div>
    </div>
  );
}
