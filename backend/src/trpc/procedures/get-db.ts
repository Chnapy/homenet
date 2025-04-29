import { openRootDB } from "../../db/db";
import { publicProcedure } from "../trpc";

export const getDB = publicProcedure.query(
  async (): Promise<
    {
      key: unknown;
      value: unknown;
      version?: number;
    }[]
  > => {
    if (process.env.NODE_ENV != "development") {
      throw new Error("Route allowed in development only");
    }

    const db = openRootDB();

    return db.getRange().asArray;
  }
);
