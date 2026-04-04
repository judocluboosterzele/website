declare module "path" {
  export function dirname(path: string): string;
  export function normalize(path: string): string;
  export function join(...paths: string[]): string;
  export function resolve(...paths: string[]): string;

  export namespace posix {
    export function dirname(path: string): string;
    export function normalize(path: string): string;
    export function join(...paths: string[]): string;
    export function resolve(...paths: string[]): string;
  }
}
