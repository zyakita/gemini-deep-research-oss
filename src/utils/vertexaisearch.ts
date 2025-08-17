export async function getFinalUrlFromVertexAIsearch(uri: string) {
  if (!uri) return null;

  if (!import.meta.env.VITE_VERTEXAISEARCH_RESOLVER) return null;

  const maxRetries = 3;
  let retryCount = 0;

  while (retryCount < maxRetries) {
    try {
      const response = await fetch(import.meta.env.VITE_VERTEXAISEARCH_RESOLVER, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ uri }),
      });

      // Check if we got a 504 status code (Gateway Timeout) - only retry for this
      if (response.status === 504) {
        retryCount++;
        if (retryCount < maxRetries) {
          console.warn(
            `Gateway timeout (504) for url: ${uri}. Retrying... (${retryCount}/${maxRetries})`
          );
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
          continue;
        } else {
          console.error(`Max retries reached for url: ${uri}. Gateway timeout persists.`);
          return null;
        }
      }

      // Check if response is ok for other status codes - don't retry, just fail
      if (!response.ok) {
        console.error(`HTTP ${response.status}: ${response.statusText} for url: ${uri}`);
        return null;
      }

      const { url } = await response.json();
      return url;
    } catch (error) {
      // For any other errors (network, parsing, etc.), don't retry - just fail
      console.error(`Error processing url: ${uri}`, error);
      return null;
    }
  }

  return null;
}

export function wakeUpResolver() {
  if (!import.meta.env.VITE_VERTEXAISEARCH_RESOLVER) return;

  // send GET to resolver asynchronously
  // without awaiting, and no need to handle the response
  fetch(import.meta.env.VITE_VERTEXAISEARCH_RESOLVER);
}
