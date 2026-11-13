import {
  emailPayload,
  phonePayload,
  type QrPreset,
  smsPayload,
  urlPayload,
  vcardPayload,
  wifiPayload,
} from '@/lib/qr-payload';

type ErrorCorrection = 'L' | 'M' | 'Q' | 'H';

function byId<T extends HTMLElement>(id: string): T | null {
  return document.getElementById(id) as T | null;
}

function value(id: string): string {
  const element = document.getElementById(id) as HTMLInputElement | HTMLTextAreaElement | null;
  return element?.value.trim() ?? '';
}

export function initQrGenerator(): void {
  const preset = byId<HTMLSelectElement>('qr-preset');
  const input = byId<HTMLTextAreaElement>('qr-text');
  const canvas = byId<HTMLCanvasElement>('qr-canvas');
  const size = byId<HTMLSelectElement>('qr-size');
  const ecc = byId<HTMLSelectElement>('qr-ecc');
  const empty = byId<HTMLElement>('qr-empty');
  const payload = byId<HTMLElement>('qr-payload');
  const pngButton = byId<HTMLButtonElement>('qr-download-png');
  const svgButton = byId<HTMLButtonElement>('qr-download-svg');
  const error = byId<HTMLElement>('qr-error');
  const groups: Record<string, HTMLElement | null> = {
    text: byId('qr-group-text'),
    wifi: byId('qr-group-wifi'),
    vcard: byId('qr-group-vcard'),
    email: byId('qr-group-email'),
    phone: byId('qr-group-phone'),
    sms: byId('qr-group-sms'),
  };

  if (!(input instanceof HTMLTextAreaElement) || !(canvas instanceof HTMLCanvasElement)) return;

  let timer: number | undefined;
  let latestSvg = '';
  let latestPayload = '';

  const setEnabled = (enabled: boolean) => {
    if (pngButton) pngButton.disabled = !enabled;
    if (svgButton) svgButton.disabled = !enabled;
    if (empty) empty.hidden = enabled;
  };

  const showError = (message: string) => {
    if (!error) return;
    error.hidden = message === '';
    error.textContent = message;
  };

  const currentPayload = (): string => {
    const selected = (preset?.value ?? 'text') as QrPreset;
    switch (selected) {
      case 'url':
        return urlPayload(input.value);
      case 'wifi': {
        const ssid = value('qr-wifi-ssid');
        if (!ssid) return '';
        return wifiPayload({
          ssid,
          password: value('qr-wifi-password'),
          encryption: (value('qr-wifi-encryption') || 'WPA') as 'WPA' | 'WEP' | 'nopass',
          hidden:
            (document.getElementById('qr-wifi-hidden') as HTMLInputElement | null)?.checked ??
            false,
        });
      }
      case 'vcard': {
        const card = {
          name: value('qr-vcard-name'),
          organization: value('qr-vcard-org'),
          title: value('qr-vcard-title'),
          phone: value('qr-vcard-phone'),
          email: value('qr-vcard-email'),
          url: value('qr-vcard-url'),
        };
        if (!card.name && !card.phone && !card.email) return '';
        return vcardPayload(card);
      }
      case 'email': {
        const to = value('qr-email-to');
        if (!to) return '';
        return emailPayload(to, value('qr-email-subject'), value('qr-email-body'));
      }
      case 'phone':
        return phonePayload(value('qr-phone-number'));
      case 'sms': {
        const number = value('qr-sms-number');
        if (!number) return '';
        return smsPayload(number, value('qr-sms-message'));
      }
      default:
        return input.value.trim();
    }
  };

  const render = async () => {
    latestPayload = currentPayload();
    if (payload) {
      payload.hidden = latestPayload === '';
      payload.textContent = latestPayload;
    }
    if (latestPayload === '') {
      const context = canvas.getContext('2d');
      context?.clearRect(0, 0, canvas.width, canvas.height);
      latestSvg = '';
      setEnabled(false);
      showError('');
      return;
    }

    const qrSize = Number(size?.value ?? 512);
    const level = (ecc?.value ?? 'M') as ErrorCorrection;

    try {
      const QRCode = (await import('qrcode')).default;
      await QRCode.toCanvas(canvas, latestPayload, {
        width: qrSize,
        margin: 2,
        errorCorrectionLevel: level,
        color: { dark: '#111111', light: '#ffffff' },
      });
      latestSvg = await QRCode.toString(latestPayload, {
        type: 'svg',
        margin: 2,
        width: qrSize,
        errorCorrectionLevel: level,
        color: { dark: '#111111', light: '#ffffff' },
      });
      setEnabled(true);
      showError('');
    } catch (cause) {
      console.error(cause);
      setEnabled(false);
      showError('QR 코드를 만들지 못했습니다. 입력 내용을 줄여 다시 시도해 주세요.');
    }
  };

  const schedule = () => {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => void render(), 180);
  };

  const syncGroups = () => {
    const selected = preset?.value ?? 'text';
    const group = selected === 'url' ? 'text' : selected;
    for (const [key, element] of Object.entries(groups)) {
      if (element) element.hidden = key !== group;
    }
  };

  preset?.addEventListener('change', () => {
    syncGroups();
    schedule();
  });

  const controls = document.querySelectorAll<HTMLElement>(
    '#qr-group-text input, #qr-group-text textarea, #qr-group-wifi input, #qr-group-wifi select, #qr-group-vcard input, #qr-group-email input, #qr-group-email textarea, #qr-group-phone input, #qr-group-sms input, #qr-group-sms textarea',
  );
  for (const control of controls) {
    control.addEventListener('input', schedule);
    control.addEventListener('change', schedule);
  }
  size?.addEventListener('change', schedule);
  ecc?.addEventListener('change', schedule);

  pngButton?.addEventListener('click', () => {
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'qrcode.png';
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    }, 'image/png');
  });

  svgButton?.addEventListener('click', () => {
    if (!latestSvg) return;
    const blob = new Blob([latestSvg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'qrcode.svg';
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  });

  syncGroups();
  setEnabled(false);
}
