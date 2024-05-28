declare type Recordable<T = any> = Record<string, T>;

interface ImportMetaEnv {
  VITE_BASE_API: string;
  VITE_DEV_PROXY?: string;
  VITE_DEV_PROXY_NAME?: string;
  VITE_DEV_PROXY_API?: string;
  VITE_CACHE_STORE_ID?: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare const L: any;

declare const proj4: any;
