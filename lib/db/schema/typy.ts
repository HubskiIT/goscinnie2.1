import { customType, timestamp } from "drizzle-orm/pg-core";

/**
 * PostGIS `geography(Point,4326)`. Drizzle nie ma tego typu wbudowanego.
 * Trzymamy geography, nie geometry, żeby odległości wychodziły w metrach
 * bez ręcznego przeliczania układów współrzędnych.
 */
export const geographyPoint = customType<{
  data: { lon: number; lat: number };
  driverData: string;
}>({
  dataType() {
    return "geography(Point,4326)";
  },
  toDriver(value) {
    return `SRID=4326;POINT(${value.lon} ${value.lat})`;
  },
});

/** Wszystkie znaczniki czasu są `timestamptz`. Patrz docs/schemat.md. */
export const znacznikiCzasu = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
};
