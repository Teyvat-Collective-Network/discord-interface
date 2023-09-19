export default async function (route: string, body?: any, options?: RequestInit) {
    let request = route.startsWith("!");
    if (request) route = route.slice(1);

    const [method, real] = route.split(/\s+/);

    options ??= {};
    options.method = method;

    if (body) options.body = JSON.stringify(body);

    let req: Response;

    try {
        req = await fetch(`${Bun.env.API}${real}`, options);
    } catch {
        throw "The API is offline.";
    }

    if (request) return req;

    if (!req.ok) throw req.status;

    const text = await req.text();

    try {
        return JSON.parse(text);
    } catch {
        return text;
    }
}
