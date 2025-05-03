import { open, RootDatabase } from "lmdb";

// myDB.put("greeting", { someText: "Hello, World!" });
// myDB.get("greeting").someText; // 'Hello, World!'
// // or
// myDB.transaction(() => {
//   myDB.put("greeting", { someText: "Hello, World!" });
//   myDB.get("greeting").someText; // 'Hello, World!'
// });

export const openRootDB = () =>
  open({
    path: `db/homenet.db`,
    compression: true,
  });

export const prepareDBToOpen =
  <V>(name: string) =>
  (rootDB: RootDatabase) =>
    rootDB.openDB<V, string>({ name });
