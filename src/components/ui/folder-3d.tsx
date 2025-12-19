"use client";

import { CheckCircle, XCircle } from "lucide-react";

interface Folder3DProps {
  label: string;
  exists: boolean;
  description?: string;
  size?: "sm" | "md" | "lg";
}

export function Folder3D({ label, exists, description, size = "md" }: Folder3DProps) {
  const sizeClasses = {
    sm: "w-24 h-20",
    md: "w-32 h-26",
    lg: "w-40 h-32",
  };

  const textSizes = {
    sm: "text-[8px]",
    md: "text-[10px]",
    lg: "text-xs",
  };

  return (
    <div className="group relative">
      {/* 3D Folder Container */}
      <div
        className={`${sizeClasses[size]} relative cursor-pointer transition-transform duration-300 hover:scale-105`}
        style={{ perspective: "500px" }}
      >
        {/* Back panel (tab) */}
        <div
          className={`absolute top-0 left-2 w-[40%] h-3 rounded-t-md ${
            exists
              ? "bg-gradient-to-b from-slate-300 to-slate-400"
              : "bg-gradient-to-b from-slate-200 to-slate-300 opacity-50"
          }`}
          style={{
            transform: "translateZ(-2px)",
          }}
        />

        {/* Back folder face */}
        <div
          className={`absolute top-2 left-0 right-0 bottom-0 rounded-lg ${
            exists
              ? "bg-gradient-to-br from-slate-400 via-slate-350 to-slate-500"
              : "bg-gradient-to-br from-slate-300 via-slate-250 to-slate-400 opacity-50"
          }`}
          style={{
            transform: "translateZ(-4px) rotateX(2deg)",
            boxShadow: "inset 0 2px 4px rgba(255,255,255,0.3), inset 0 -2px 4px rgba(0,0,0,0.1)",
          }}
        />

        {/* Front folder face */}
        <div
          className={`absolute top-4 left-0 right-0 bottom-0 rounded-lg flex items-center justify-center p-2 ${
            exists
              ? "bg-gradient-to-br from-slate-300 via-slate-350 to-slate-400"
              : "bg-gradient-to-br from-slate-200 via-slate-250 to-slate-300 opacity-50"
          }`}
          style={{
            transform: "rotateX(-5deg)",
            boxShadow: exists
              ? "0 8px 16px rgba(0,0,0,0.15), inset 0 2px 4px rgba(255,255,255,0.4), inset 0 -2px 4px rgba(0,0,0,0.05)"
              : "0 4px 8px rgba(0,0,0,0.1), inset 0 2px 4px rgba(255,255,255,0.3)",
          }}
        >
          {/* Label text */}
          <span
            className={`${textSizes[size]} font-bold uppercase tracking-wide text-center leading-tight ${
              exists ? "text-slate-600" : "text-slate-400"
            }`}
            style={{
              textShadow: exists ? "0 1px 0 rgba(255,255,255,0.5)" : "none",
            }}
          >
            {label}
          </span>
        </div>

        {/* Status indicator */}
        <div className={`absolute -top-1 -right-1 z-10 ${exists ? "text-green-500" : "text-slate-300"}`}>
          {exists ? (
            <CheckCircle className="w-4 h-4 fill-white" />
          ) : (
            <XCircle className="w-4 h-4 fill-white" />
          )}
        </div>

        {/* Reflection/shine effect */}
        <div
          className="absolute top-4 left-0 right-0 h-1/3 rounded-t-lg pointer-events-none opacity-30"
          style={{
            background: "linear-gradient(to bottom, rgba(255,255,255,0.5), transparent)",
          }}
        />
      </div>

      {/* Tooltip on hover */}
      {description && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-slate-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20 pointer-events-none">
          {description}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-900" />
        </div>
      )}
    </div>
  );
}

interface FolderGridProps {
  sections: {
    name: string;
    path: string;
    exists: boolean;
    description: string;
  }[];
}

export function FolderGrid({ sections }: FolderGridProps) {
  // Sort: existing sections first, then alphabetically
  const sortedSections = [...sections].sort((a, b) => {
    if (a.exists !== b.exists) return b.exists ? 1 : -1;
    return a.name.localeCompare(b.name);
  });

  const existingCount = sections.filter(s => s.exists).length;
  const missingCount = sections.filter(s => !s.exists).length;

  return (
    <div className="bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Site Architecture</h3>
          <p className="text-sm text-slate-500">How your website information is organized</p>
        </div>
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span className="text-slate-600">{existingCount} found</span>
          </div>
          <div className="flex items-center gap-1.5">
            <XCircle className="w-4 h-4 text-slate-300" />
            <span className="text-slate-400">{missingCount} missing</span>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 justify-center">
        {sortedSections.map((section) => (
          <Folder3D
            key={section.name}
            label={section.name}
            exists={section.exists}
            description={section.exists ? section.description : `No ${section.name} section detected`}
            size="md"
          />
        ))}
      </div>
    </div>
  );
}
