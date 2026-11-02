declare module "routeros-client" {
    export class RouterOSClient {
        constructor(options: {
            host: string;
            user: string;
            password: string;
            port?: number;
            timeout?: number;
        });
        connect(): Promise<{
            menu(path: string): {
                getOnly(): Promise<Record<string, unknown>>;
                add(data: Record<string, string>): Promise<unknown>;
            };
        }>;
        close(): Promise<void>;
    }
}