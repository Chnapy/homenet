const ifNotPlaceholder = <V extends string | undefined>(value: V) => value?.startsWith('PLACEHOLDER_') ? undefined : value;

export const env = {
    VITE_BACKEND_API: import.meta.env.VITE_BACKEND_API,
    VITE_STATIC_DEVICES_PATH: ifNotPlaceholder(import.meta.env.VITE_STATIC_DEVICES_PATH),
    VITE_STATIC_METADATA_PATH: ifNotPlaceholder(import.meta.env.VITE_STATIC_METADATA_PATH),
};
