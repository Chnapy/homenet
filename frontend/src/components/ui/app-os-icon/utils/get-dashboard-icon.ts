import type Tree from './tree';

// type Tree = typeof tree;

type GetDashboardIconParams<E extends keyof Tree, F extends Tree[ E ][ number ]> = [
    E,
    F extends `${infer V}.${string}` ? V : never,
];

export const getDashboardIcon = <E extends keyof Tree, F extends Tree[ E ][ number ]>(
    ...[ ext, value ]: GetDashboardIconParams<E, F>
) => `https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/${ext}/${value}.${ext}`;
