export async function getFinalUrlFromVertexAIsearch(uri: string) {
  if (!uri) return null;

  if (!import.meta.env.VITE_VERTEXAISEARCH_RESOLVER) return null;

  try {
    const { url } = await fetch(import.meta.env.VITE_VERTEXAISEARCH_RESOLVER, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ uri }),
    }).then(res => res.json());

    return url;
  } catch (error) {
    console.error(`Error processing url: ${uri}`, error);
    return null;
  }
}

export function wakeUpResolver() {
  if (!import.meta.env.VITE_VERTEXAISEARCH_RESOLVER) return;

  // send GET to resolver asynchronously
  // without awaiting, and no need to handle the response
  fetch(import.meta.env.VITE_VERTEXAISEARCH_RESOLVER);
}
