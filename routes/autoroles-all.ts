import { syncAllAutoroles } from "../lib/autoroles.ts";
import { RouteMap } from "../lib/types.ts";

export default {
    async "PUT /autoroles"() {
        await syncAllAutoroles();
    },
} as RouteMap;
