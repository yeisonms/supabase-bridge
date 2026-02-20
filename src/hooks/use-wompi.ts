/**
 * Hook to dynamically load the Wompi Widget script and open the checkout modal.
 */

const WOMPI_SCRIPT_URL = 'https://checkout.wompi.co/widget.js';

export interface WompiCheckoutOptions {
  currency: 'COP';
  amountInCents: number;
  reference: string;
  publicKey: string;
  redirectUrl?: string;
  onSuccess?: () => void;
  onDeclined?: () => void;
}

function loadWompiScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    // If already loaded, resolve immediately
    if (document.querySelector(`script[src="${WOMPI_SCRIPT_URL}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = WOMPI_SCRIPT_URL;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Wompi script'));
    document.body.appendChild(script);
  });
}

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export { generateUUID };

export async function openWompiCheckout(options: WompiCheckoutOptions): Promise<void> {
  // 1. Fetch integrity signature from secure backend endpoint
  const sigResponse = await fetch('/api/wompi-signature', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      reference: options.reference,
      amountInCents: options.amountInCents,
      currency: options.currency,
    }),
  });

  if (!sigResponse.ok) {
    throw new Error('No se pudo generar la firma de integridad');
  }

  const { signature } = await sigResponse.json();

  if (!signature) {
    throw new Error('La firma de integridad no fue recibida del servidor');
  }

  // 2. Load Wompi script after obtaining signature
  await loadWompiScript();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const WidgetCheckout = (window as any).WidgetCheckout;

  if (!WidgetCheckout) {
    throw new Error('Wompi WidgetCheckout not available after script load');
  }

  const checkout = new WidgetCheckout({
    currency: options.currency,
    amountInCents: options.amountInCents,
    reference: options.reference,
    publicKey: options.publicKey,
    redirectUrl: options.redirectUrl,
    signature: { integrity: signature },
  });

  checkout.open((result: { transaction: { status: string } }) => {
    const status = result?.transaction?.status;
    if (status === 'APPROVED') {
      options.onSuccess?.();
    } else if (status === 'DECLINED') {
      options.onDeclined?.();
    }
    // VOIDED / ERROR / PENDING handled silently; webhook does the real work
  });
}
