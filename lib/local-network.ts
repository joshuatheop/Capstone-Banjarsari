export const allowedHosts = (configured = '') => new Set(['localhost', '127.0.0.1', ...configured.split(',').map((host) => host.trim().toLowerCase()).filter(Boolean)]);

export const allowedHostRequest = (request: Request, configured = '') => {
  try {
    const host = new URL(`http://${request.headers.get('host') ?? ''}`).hostname.toLowerCase();
    return allowedHosts(configured).has(host);
  } catch { return false; }
};

export const sameOriginRequest = (request: Request) => {
  try {
    const origin = new URL(request.headers.get('origin') ?? '');
    return ['http:', 'https:'].includes(origin.protocol) && origin.host === request.headers.get('host');
  } catch { return false; }
};
