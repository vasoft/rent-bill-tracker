declare module 'dexie/dist/dexie.mjs' {
  export type Table<T = any, TKey = any, TInsertType = T> = {
    count: () => Promise<number>;
    bulkAdd: (items: TInsertType[]) => Promise<any>;
    toArray: () => Promise<T[]>;
    where: (index: string) => any;
    update: (key: TKey, changes: Partial<T>) => Promise<number>;
  } & any;

  export default class Dexie {
    static minKey: any;
    static maxKey: any;
    constructor(name?: string);
    version(versionNumber: number): {
      stores(schema: Record<string, string>): Dexie;
    };
  }
}
