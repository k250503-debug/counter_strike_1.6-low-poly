let cachedSoftwareGl: boolean | null = null;

/**
 * Detects software WebGL renderers (SwiftShader, llvmpipe, softpipe, WARP)
 * from the WebGL2 unmasked renderer string, freeing the probe context cleanly.
 */
export function detectSoftwareWebGL(): boolean {
  if (cachedSoftwareGl !== null) return cachedSoftwareGl;
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2');
    if (!gl) {
      cachedSoftwareGl = true;
      return true;
    }
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param) || '');
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    cachedSoftwareGl = /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    cachedSoftwareGl = true;
  }
  return cachedSoftwareGl;
}

export function getEffectiveDpr(resolutionScale: number, adaptiveMultiplier = 1): number {
  if (detectSoftwareWebGL()) return 1;
  const base = Math.min(window.devicePixelRatio || 1, 2);
  return Math.max(0.5, Math.min(2, base * resolutionScale * adaptiveMultiplier));
}
