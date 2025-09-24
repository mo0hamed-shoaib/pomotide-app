"use client";

import { useDataMigration } from "@/lib/hooks/use-data-migration";

export function DataMigrationProvider({ children }: { children: React.ReactNode }) {
  // This component automatically handles data migration when a user signs in
  useDataMigration();
  
  return <>{children}</>;
}
