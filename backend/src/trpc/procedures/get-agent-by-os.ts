import { RouteHandlerMethod } from "fastify/types/route";

export const getAgentByOSRoute: RouteHandlerMethod = async (request, reply) => {
  // TODO removed + revoked API key for security
  const Authorization = "Bearer github_pat_XXX";
  const urls = {
    latestRelease:
      "https://api.github.com/repos/Chnapy/homenet/releases/latest",
  };
  const assetName = "agent-" + (request.params as Record<string, string>).os;

  console.log("trpc: getAgentByOS", request.params, request.headers);

  try {
    const latestRelease = await fetch(urls.latestRelease, {
      headers: {
        Authorization,
      },
    }).then(
      (res) =>
        res.json() as Promise<{
          assets: {
            url: string;
            name: string;
            content_type: string;
          }[];
        }>
    );

    const asset = latestRelease.assets.find(
      (asset) => asset.name === assetName
    )!;

    reply
      .header("Content-Disposition", `attachment; filename="${asset.name}"`)
      .type("application/octet-stream");

    const assetResponse = await fetch(asset.url, {
      headers: {
        Authorization,
        Accept: "application/octet-stream",
      },
    });

    Object.entries(assetResponse.headers).forEach(([ key, value ]) => {
      reply.header(key, value);
    });

    return reply.send(assetResponse.body);
  } catch (err) {
    console.error("trpc: getAgentByOS error", err);
    request.log.error(err);
    reply.code(500).send();
  }
};
