import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const testRouterConnection = createServerFn({ method: "POST" })
    .validator(
        z.object({
            host: z.string().min(1).max(253),
            user: z.string().min(1).max(128),
            password: z.string().max(256),
            port: z.number().int().min(1).max(65535).default(8728),
        }),
    )
    .handler(async ({ data }) => {
        const { RouterOSClient } = await import("routeros-client");
        const client = new RouterOSClient({
            host: data.host,
            user: data.user,
            password: data.password,
            port: data.port,
            timeout: 5000,
        });
        const startedAt = Date.now();

        try {
            const api = await client.connect();
            const identity = await api.menu("/system identity").getOnly();
            const resource = await api.menu("/system resource").getOnly();

            return {
                host: data.host,
                latency: `${Date.now() - startedAt}ms`,
                identity: String(identity?.name ?? "MikroTik"),
                version: resource?.version ? String(resource.version) : undefined,
            };
        } finally {
            await client.close();
        }
    });

export const createPppoeSecret = createServerFn({ method: "POST" })
    .validator(
        z.object({
            host: z.string().min(1).max(253),
            user: z.string().min(1).max(128),
            password: z.string().max(256),
            pppoeUser: z.string().min(1).max(128),
            pppoePassword: z.string().min(1).max(256),
            profile: z.string().max(128).default("default"),
        }),
    )
    .handler(async ({ data }) => {
        const { RouterOSClient } = await import("routeros-client");
        const client = new RouterOSClient({ host: data.host, user: data.user, password: data.password, port: 8728, timeout: 5000 });
        try {
            const api = await client.connect();
            await api.menu("/ppp secret").add({ name: data.pppoeUser, password: data.pppoePassword, service: "pppoe", profile: data.profile });
            return { success: true };
        } finally {
            await client.close();
        }
    });