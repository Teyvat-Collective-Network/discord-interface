import { Octokit } from "octokit";

const octokit = new Octokit({ auth: Bun.env.GIST_TOKEN });

export async function createGist(filename: string, description: string, content: string) {
    const req = await octokit.request("POST /gists", { description, files: { [filename]: { content } } });
    if (req.status !== 201) throw new Error("An error occurred creating the gist.");
    return req.data.html_url!;
}
