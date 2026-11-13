import { serializeVCardFile, type VCardInput, vCardFileName } from '@/lib/vcf-ics';

function byId<T extends HTMLElement>(id: string): T | null {
  return document.getElementById(id) as T | null;
}

export function initVCardMaker(): void {
  const nameInput = byId<HTMLInputElement>('vc-name');
  const orgInput = byId<HTMLInputElement>('vc-org');
  const titleInput = byId<HTMLInputElement>('vc-title');
  const phoneInput = byId<HTMLInputElement>('vc-phone');
  const emailInput = byId<HTMLInputElement>('vc-email');
  const addressInput = byId<HTMLInputElement>('vc-address');
  const noteInput = byId<HTMLTextAreaElement>('vc-note');
  const addButton = byId<HTMLButtonElement>('vc-add');
  const resetButton = byId<HTMLButtonElement>('vc-reset');
  const download = byId<HTMLButtonElement>('vc-download');
  const list = byId<HTMLUListElement>('vc-list');
  const empty = byId<HTMLElement>('vc-empty');
  const count = byId<HTMLElement>('vc-count');
  const status = byId<HTMLElement>('vc-status');
  const error = byId<HTMLElement>('vc-error');

  if (
    !nameInput ||
    !orgInput ||
    !titleInput ||
    !phoneInput ||
    !emailInput ||
    !addressInput ||
    !noteInput ||
    !addButton ||
    !resetButton ||
    !download ||
    !list ||
    !empty ||
    !count ||
    !status ||
    !error
  ) {
    return;
  }

  const contacts: VCardInput[] = [];
  let downloadUrl: string | null = null;

  const showError = (message: string) => {
    error.hidden = message === '';
    error.textContent = message;
  };

  const setStatus = (message: string) => {
    status.textContent = message;
  };

  const readForm = (): VCardInput => ({
    name: nameInput.value.trim(),
    org: orgInput.value.trim(),
    title: titleInput.value.trim(),
    phone: phoneInput.value.trim(),
    email: emailInput.value.trim(),
    address: addressInput.value.trim(),
    note: noteInput.value.trim(),
  });

  const clearForm = () => {
    nameInput.value = '';
    orgInput.value = '';
    titleInput.value = '';
    phoneInput.value = '';
    emailInput.value = '';
    addressInput.value = '';
    noteInput.value = '';
    nameInput.focus();
  };

  const syncDownloadState = () => {
    download.disabled = contacts.length === 0 && !nameInput.value.trim();
  };

  const renderList = () => {
    list.replaceChildren();
    contacts.forEach((contact, index) => {
      const item = document.createElement('li');
      item.className = 'vc-item';

      const body = document.createElement('div');
      body.className = 'vc-item-body';
      const name = document.createElement('strong');
      name.textContent = contact.name || '이름 없음';
      const meta = document.createElement('span');
      meta.textContent = [contact.org, contact.phone, contact.email].filter(Boolean).join(' · ');
      body.append(name, meta);

      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'vc-remove';
      remove.textContent = '×';
      remove.setAttribute('aria-label', `${contact.name || '연락처'} 삭제`);
      remove.addEventListener('click', () => {
        contacts.splice(index, 1);
        renderList();
        setStatus('연락처를 목록에서 삭제했습니다.');
      });

      item.append(body, remove);
      list.append(item);
    });

    count.textContent = `${contacts.length}명`;
    empty.hidden = contacts.length > 0;
    syncDownloadState();
  };

  const addContact = () => {
    const contact = readForm();
    if (!contact.name) {
      showError('이름을 입력하세요.');
      nameInput.focus();
      return;
    }
    contacts.push(contact);
    clearForm();
    renderList();
    showError('');
    setStatus('목록에 추가했습니다. 다음 연락처를 입력하세요.');
  };

  const resetAll = () => {
    contacts.length = 0;
    clearForm();
    renderList();
    showError('');
    setStatus('');
  };

  const downloadFile = () => {
    const all = [...contacts];
    const draft = readForm();
    if (draft.name) all.push(draft);
    if (all.length === 0) {
      showError('내려받을 연락처를 하나 이상 입력하세요.');
      nameInput.focus();
      return;
    }

    try {
      const text = serializeVCardFile(all);
      if (downloadUrl) URL.revokeObjectURL(downloadUrl);
      const url = URL.createObjectURL(new Blob([text], { type: 'text/vcard;charset=utf-8' }));
      downloadUrl = url;
      const link = document.createElement('a');
      link.href = url;
      link.download = vCardFileName();
      link.click();
      window.setTimeout(() => {
        if (downloadUrl !== url) return;
        URL.revokeObjectURL(url);
        downloadUrl = null;
      }, 1000);
      showError('');
      setStatus(`${all.length}명의 연락처를 ${vCardFileName()} 파일로 저장했습니다.`);
    } catch (cause) {
      showError(cause instanceof Error ? cause.message : 'VCF 파일을 만들지 못했습니다.');
    }
  };

  addButton.addEventListener('click', addContact);
  resetButton.addEventListener('click', resetAll);
  nameInput.addEventListener('input', syncDownloadState);
  download.addEventListener('click', downloadFile);
  nameInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      addContact();
    }
  });

  window.addEventListener('pagehide', () => {
    if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    downloadUrl = null;
  });

  renderList();
}
