/**
 * Wompi checkout helpers — fully imperative, no pre-loading.
 * All steps (signature → script → widget) happen sequentially on user click.
 */

export const WOMPI_PUBLIC_KEY = 'pub_test_Xd3ANi4mJvi1nS6W1VO0SLulFQbMysX2';
export const WOMPI_SCRIPT_URL = 'https://checkout.wompi.co/widget.js';

/** Step 1 — Get integrity signature from secure backend */
export async function fetchWompiSignature(
  reference: string,
  amountInCents: number,
  currency: 'COP',
): Promise<string> {
  const res = await fetch('/api/wompi-signature', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reference, amountInCents, currency }),
  });

  if (!res.ok) {
    throw new Error('No se pudo generar la firma de integridad');
  }

  const { signature } = await res.json();

  if (!signature) {
    throw new Error('La firma de integridad no fue recibida del servidor');
  }

  return signature as string;
}

/** Step 2 — Inject Wompi script only if not already present */
export function loadWompiScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    // Already loaded — resolve immediately
    if (typeof (window as any).WidgetCheckout !== 'undefined') {
      resolve();
      return;
    }

    // Script tag already injected but not yet loaded — wait for it
    const existing = document.querySelector(`script[src="${WOMPI_SCRIPT_URL}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('Error cargando script de Wompi')));
      return;
    }

    // Inject fresh script tag
    const script = document.createElement('script');
    script.src = WOMPI_SCRIPT_URL;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Error cargando script de Wompi'));
    document.body.appendChild(script);
  });
}

export interface WompiCheckoutOptions {
  currency: 'COP';
  amountInCents: number;
  reference: string;
  redirectUrl?: string;
  onSuccess?: () => void;
  onDeclined?: () => void;
}

/**
 * Full sequential flow:
 * 1. Fetch signature
 * 2. Load script
 * 3. Open widget
 */
export async function openWompiCheckout(options: WompiCheckoutOptions): Promise<void> {
  // Step A — fetch signature first (no script loaded yet, no race condition)
  const signature = await fetchWompiSignature(
    options.reference,
    options.amountInCents,
    options.currency,
  );

  // Step B — inject / wait for script
  await loadWompiScript();

  // Step C — widget is now guaranteed to exist
  const WidgetCheckout = (window as any).WidgetCheckout;

  if (!WidgetCheckout) {
    throw new Error('Wompi WidgetCheckout no disponible después de cargar el script');
  }

  // Step D — initialise with hardcoded public key (no env variable)
  const checkout = new WidgetCheckout({
    currency: options.currency,
    amountInCents: options.amountInCents,
    reference: options.reference,
    publicKey: WOMPI_PUBLIC_KEY,
    redirectUrl: options.redirectUrl,
    signature: { integrity: signature },
  });

  // Step E — open and handle result
  checkout.open((result: { transaction: { status: string } }) => {
    const status = result?.transaction?.status;
    if (status === 'APPROVED') {
      options.onSuccess?.();
    } else if (status === 'DECLINED') {
      options.onDeclined?.();
    }
    // VOIDED / ERROR / PENDING → webhook handles the real activation
  });
}
