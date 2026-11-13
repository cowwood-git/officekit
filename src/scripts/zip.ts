import type JSZip from 'jszip';
import { formatBytes } from '@/lib/files';
import {
  imageMimeFor,
  MAX_CREATE_BYTES,
  MAX_CREATE_FILES,
  MAX_PREVIEW_TEXT_BYTES,
  MAX_ZIP_BYTES,
  MAX_ZIP_ENTRIES,
  MAX_ZIP_UNCOMPRESSED,
  sanitizeZipPath,
  uniqueZipPath,
  zipArchiveFileName,
  zipEntryKind,
  zipExtractFileName,
} from '@/lib/zip';
import { bindDrop, byId } from './kit';

interface ZipEntry {
  name: string;
  date: Date | null;
  size: number;
  compressed: number;
}

interface RawZipObject {
  _data?: {
    uncompressedSize?: number;
    compressedSize?: number;
  };
}

interface CreateFile {
  file: File;
  path: string;
}

const MAX_PREVIEW_IMAGE_BYTES = 20 * 1024 * 1024;

export function initZipTool(): void {
  const modeOpen = byId<HTMLInputElement>('zip-mode-open');
  const modeCreate = byId<HTMLInputElement>('zip-mode-create');
  const openPanel = byId<HTMLElement>('zip-open-panel');
  const createPanel = byId<HTMLElement>('zip-create-panel');
  const openInput = byId<HTMLInputElement>('zip-open-input');
  const openDrop = byId<HTMLElement>('zip-open-drop');
  const openInfo = byId<HTMLElement>('zip-open-info');
  const statFiles = byId<HTMLElement>('zip-stat-files');
  const statSize = byId<HTMLElement>('zip-stat-size');
  const statCompressed = byId<HTMLElement>('zip-stat-compressed');
  const entriesList = byId<HTMLUListElement>('zip-entries');
  const selectAll = byId<HTMLButtonElement>('zip-select-all');
  const selectNone = byId<HTMLButtonElement>('zip-select-none');
  const extract = byId<HTMLButtonElement>('zip-extract');
  const openReset = byId<HTMLButtonElement>('zip-open-reset');
  const previewHead = byId<HTMLElement>('zip-preview-head');
  const previewBody = byId<HTMLElement>('zip-preview-body');
  const createInput = byId<HTMLInputElement>('zip-create-input');
  const createDrop = byId<HTMLElement>('zip-create-drop');
  const folderInput = byId<HTMLInputElement>('zip-folder-input');
  const folderButton = byId<HTMLButtonElement>('zip-folder-button');
  const createList = byId<HTMLUListElement>('zip-create-list');
  const createNote = byId<HTMLElement>('zip-create-note');
  const createReset = byId<HTMLButtonElement>('zip-create-reset');
  const nameInput = byId<HTMLInputElement>('zip-name');
  const compression = byId<HTMLSelectElement>('zip-compression');
  const createButton = byId<HTMLButtonElement>('zip-create');
  const status = byId<HTMLElement>('zip-status');
  const error = byId<HTMLElement>('zip-error');

  if (
    !modeOpen ||
    !modeCreate ||
    !openPanel ||
    !createPanel ||
    !openInput ||
    !openDrop ||
    !openInfo ||
    !statFiles ||
    !statSize ||
    !statCompressed ||
    !entriesList ||
    !selectAll ||
    !selectNone ||
    !extract ||
    !openReset ||
    !previewHead ||
    !previewBody ||
    !createInput ||
    !createDrop ||
    !folderInput ||
    !folderButton ||
    !createList ||
    !createNote ||
    !createReset ||
    !nameInput ||
    !compression ||
    !createButton ||
    !status ||
    !error
  ) {
    return;
  }

  let zip: JSZip | null = null;
  let entries: ZipEntry[] = [];
  let originalZipName = 'archive.zip';
  let previewUrl: string | null = null;
  let resultUrl: string | null = null;
  let createFiles: CreateFile[] = [];
  let running = false;
  let nameTouched = false;

  const showError = (message: string) => {
    error.hidden = message === '';
    error.textContent = message;
  };

  const setStatus = (message: string) => {
    status.textContent = message;
  };

  const clearPreview = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    previewUrl = null;
    previewHead.textContent = '미리보기';
    previewBody.replaceChildren();
    const hint = document.createElement('p');
    hint.className = 'hint';
    hint.textContent = '파일 목록에서 미리보기를 누르면 내용이 표시됩니다.';
    previewBody.append(hint);
  };

  const clearResult = () => {
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    resultUrl = null;
  };

  const saveBlob = (blob: Blob, name: string) => {
    clearResult();
    resultUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = resultUrl;
    link.download = name;
    link.click();
    window.setTimeout(() => {
      if (!resultUrl) return;
      URL.revokeObjectURL(resultUrl);
      resultUrl = null;
    }, 1000);
  };

  const selectedNames = () =>
    Array.from(entriesList.querySelectorAll<HTMLInputElement>('input[data-entry]:checked')).map(
      (input) => input.dataset.entry ?? '',
    );

  const updateExtractState = () => {
    extract.disabled = running || selectedNames().length === 0;
  };

  const renderEntries = () => {
    entriesList.replaceChildren();
    for (const entry of entries) {
      const item = document.createElement('li');
      item.className = 'zip-entry';

      const check = document.createElement('input');
      check.type = 'checkbox';
      check.checked = true;
      check.dataset.entry = entry.name;
      check.setAttribute('aria-label', `${entry.name} 선택`);
      check.addEventListener('change', updateExtractState);

      const name = document.createElement('span');
      name.className = 'zip-entry-name';
      name.textContent = entry.name;
      name.title = entry.name;

      const size = document.createElement('span');
      size.className = 'zip-entry-size';
      size.textContent = entry.size > 0 ? formatBytes(entry.size) : '—';

      const preview = document.createElement('button');
      preview.type = 'button';
      preview.className = 'zip-entry-preview';
      preview.textContent = '미리보기';
      preview.addEventListener('click', () => void previewEntry(entry));

      item.append(check, name, size, preview);
      entriesList.append(item);
    }
    updateExtractState();
  };

  const loadZip = async (file: File | undefined) => {
    if (!file || running) return;
    if (file.size > MAX_ZIP_BYTES) {
      showError(`ZIP 파일은 ${formatBytes(MAX_ZIP_BYTES)} 이하만 열 수 있습니다.`);
      return;
    }

    running = true;
    showError('');
    setStatus('ZIP을 읽는 중…');
    try {
      const JSZip = (await import('jszip')).default;
      const loaded = await JSZip.loadAsync(await file.arrayBuffer());
      const all = Object.values(loaded.files).filter((entry) => !entry.dir);
      if (all.length === 0) throw new Error('ZIP 안에 파일이 없습니다.');
      if (all.length > MAX_ZIP_ENTRIES) {
        throw new Error(`한 번에 ${MAX_ZIP_ENTRIES}개까지 열 수 있습니다.`);
      }

      const list = all.map((entry) => {
        const raw = (entry as unknown as RawZipObject)._data;
        return {
          name: entry.name,
          date: entry.date instanceof Date ? entry.date : null,
          size: raw?.uncompressedSize ?? 0,
          compressed: raw?.compressedSize ?? 0,
        };
      });
      const total = list.reduce((sum, entry) => sum + entry.size, 0);
      if (total > MAX_ZIP_UNCOMPRESSED) {
        throw new Error(`압축을 풀면 ${formatBytes(MAX_ZIP_UNCOMPRESSED)}를 넘습니다.`);
      }

      zip = loaded;
      entries = list.sort((a, b) => a.name.localeCompare(b.name, 'ko', { numeric: true }));
      originalZipName = file.name;
      statFiles.textContent = `${entries.length}개`;
      statSize.textContent = formatBytes(total);
      statCompressed.textContent = formatBytes(file.size);
      openDrop.hidden = true;
      openInfo.hidden = false;
      clearPreview();
      renderEntries();
      setStatus(`${entries.length}개 파일을 읽었습니다.`);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : '';
      showError(
        /encrypt/i.test(message)
          ? '암호가 걸린 ZIP은 열 수 없습니다. 암호를 푼 뒤 사용하세요.'
          : message || 'ZIP을 읽지 못했습니다. 파일이 손상되지 않았는지 확인하세요.',
      );
      setStatus('');
      zip = null;
    } finally {
      running = false;
      updateExtractState();
    }
  };

  const previewEntry = async (entry: ZipEntry) => {
    if (!zip) return;
    clearPreview();
    previewHead.textContent = entry.name;
    const kind = zipEntryKind(entry.name);
    const object = zip.file(entry.name);
    if (!object) return;

    try {
      if (kind === 'text') {
        if (entry.size > MAX_PREVIEW_TEXT_BYTES) {
          previewBody.textContent = `${formatBytes(MAX_PREVIEW_TEXT_BYTES)}보다 큰 텍스트 파일은 미리보기를 지원하지 않습니다.`;
          return;
        }
        const bytes = await object.async('uint8array');
        const pre = document.createElement('pre');
        pre.textContent = new TextDecoder('utf-8', { fatal: false }).decode(bytes);
        previewBody.append(pre);
        return;
      }

      if (kind === 'image') {
        if (entry.size > MAX_PREVIEW_IMAGE_BYTES) {
          previewBody.textContent = `${formatBytes(MAX_PREVIEW_IMAGE_BYTES)}보다 큰 이미지는 미리보기를 지원하지 않습니다.`;
          return;
        }
        const blob = await object.async('blob');
        const mime = imageMimeFor(entry.name) ?? 'application/octet-stream';
        previewUrl = URL.createObjectURL(new Blob([blob], { type: mime }));
        const image = document.createElement('img');
        image.src = previewUrl;
        image.alt = entry.name;
        previewBody.append(image);
        return;
      }

      previewBody.textContent =
        '이 형식은 미리보기를 지원하지 않습니다. 파일을 내려받아 확인하세요.';
    } catch {
      previewBody.textContent = '미리보기를 불러오지 못했습니다.';
    }
  };

  const extractSelected = async () => {
    if (!zip || running) return;
    const names = selectedNames();
    if (names.length === 0) {
      showError('내려받을 파일을 하나 이상 선택하세요.');
      return;
    }

    running = true;
    extract.disabled = true;
    showError('');
    setStatus('선택한 파일을 ZIP으로 만드는 중…');
    try {
      const JSZip = (await import('jszip')).default;
      const out = new JSZip();
      const used = new Set<string>();
      let processed = 0;
      for (const name of names) {
        const object = zip.file(name);
        if (!object) continue;
        const bytes = await object.async('uint8array');
        const safe = uniqueZipPath(sanitizeZipPath(name), used);
        out.file(safe, bytes);
        processed += 1;
        setStatus(`${processed} / ${names.length}개 파일을 담는 중…`);
      }
      const blob = await out.generateAsync({ type: 'blob', compression: 'STORE' });
      saveBlob(blob, zipExtractFileName(originalZipName));
      setStatus(`${processed}개 파일을 ZIP으로 내려받았습니다.`);
    } catch (cause) {
      showError(cause instanceof Error ? cause.message : 'ZIP을 만들지 못했습니다.');
      setStatus('');
    } finally {
      running = false;
      updateExtractState();
    }
  };

  const resetOpen = () => {
    zip = null;
    entries = [];
    entriesList.replaceChildren();
    openInfo.hidden = true;
    openDrop.hidden = false;
    openInput.value = '';
    clearPreview();
    clearResult();
    showError('');
    setStatus('');
    updateExtractState();
  };

  const addCreateFiles = (files: File[]) => {
    if (files.length === 0) return;
    const next = [
      ...createFiles,
      ...files.map((file) => ({
        file,
        path: file.webkitRelativePath || file.name,
      })),
    ];
    if (next.length > MAX_CREATE_FILES) {
      showError(`한 번에 최대 ${MAX_CREATE_FILES}개 파일까지 담을 수 있습니다.`);
      return;
    }
    const total = next.reduce((sum, item) => sum + item.file.size, 0);
    if (total > MAX_CREATE_BYTES) {
      showError(`전체 용량이 ${formatBytes(MAX_CREATE_BYTES)}를 넘습니다.`);
      return;
    }
    createFiles = next;
    showError('');
    if (!nameTouched) {
      nameInput.value = zipArchiveFileName();
    }
    renderCreateList();
  };

  const renderCreateList = () => {
    createList.replaceChildren();
    createFiles.forEach((item, index) => {
      const row = document.createElement('li');
      row.className = 'zip-create-item';

      const name = document.createElement('span');
      name.className = 'zip-create-item-name';
      name.textContent = item.path;
      name.title = item.path;

      const size = document.createElement('span');
      size.className = 'zip-create-item-size';
      size.textContent = formatBytes(item.file.size);

      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'zip-create-remove';
      remove.textContent = '×';
      remove.setAttribute('aria-label', `${item.path} 삭제`);
      remove.addEventListener('click', () => {
        createFiles.splice(index, 1);
        renderCreateList();
      });

      row.append(name, size, remove);
      createList.append(row);
    });

    const total = createFiles.reduce((sum, item) => sum + item.file.size, 0);
    createNote.textContent =
      createFiles.length > 0
        ? `${createFiles.length}개 · ${formatBytes(total)}`
        : '파일이나 폴더를 추가하세요.';
    createButton.disabled = createFiles.length === 0 || running;
  };

  const createZip = async () => {
    if (running) return;
    if (createFiles.length === 0) {
      showError('ZIP에 담을 파일을 추가하세요.');
      return;
    }

    const selected = compression.value;
    const options =
      selected === 'store'
        ? { compression: 'STORE' as const }
        : {
            compression: 'DEFLATE' as const,
            compressionOptions: { level: selected === 'best' ? 9 : 6 },
          };

    running = true;
    createButton.disabled = true;
    showError('');
    setStatus('ZIP을 만드는 중…');
    try {
      const JSZip = (await import('jszip')).default;
      const out = new JSZip();
      const used = new Set<string>();
      for (const item of createFiles) {
        const safe = uniqueZipPath(sanitizeZipPath(item.path), used);
        out.file(safe, item.file);
      }
      const blob = await out.generateAsync(
        {
          type: 'blob',
          ...options,
        },
        (metadata) => {
          setStatus(`ZIP을 만드는 중… ${Math.round(metadata.percent)}%`);
        },
      );
      const rawName = nameInput.value.trim() || zipArchiveFileName();
      const zipName = `${rawName.replace(/[\\/:*?"<>|]/g, '_').replace(/\.zip$/i, '')}.zip`;
      saveBlob(blob, zipName);
      setStatus(`${createFiles.length}개 파일을 ${zipName}으로 만들었습니다.`);
    } catch (cause) {
      showError(cause instanceof Error ? cause.message : 'ZIP을 만들지 못했습니다.');
      setStatus('');
    } finally {
      running = false;
      createButton.disabled = createFiles.length === 0;
    }
  };

  const resetCreate = () => {
    createFiles = [];
    nameTouched = false;
    nameInput.value = zipArchiveFileName();
    renderCreateList();
    clearResult();
    showError('');
    setStatus('');
  };

  const setMode = (mode: 'open' | 'create') => {
    modeOpen.checked = mode === 'open';
    modeCreate.checked = mode === 'create';
    openPanel.hidden = mode !== 'open';
    createPanel.hidden = mode !== 'create';
    showError('');
    setStatus('');
    clearPreview();
    if (mode === 'create') renderCreateList();
    updateExtractState();
  };

  folderInput.webkitdirectory = true;

  bindDrop(openInput, openDrop, (files) => void loadZip(files[0]));
  bindDrop(createInput, createDrop, addCreateFiles);
  folderInput.addEventListener('change', () => {
    addCreateFiles(Array.from(folderInput.files ?? []));
    folderInput.value = '';
  });
  folderButton.addEventListener('click', () => folderInput.click());
  selectAll.addEventListener('click', () => {
    for (const input of entriesList.querySelectorAll<HTMLInputElement>('input[data-entry]')) {
      input.checked = true;
    }
    updateExtractState();
  });
  selectNone.addEventListener('click', () => {
    for (const input of entriesList.querySelectorAll<HTMLInputElement>('input[data-entry]')) {
      input.checked = false;
    }
    updateExtractState();
  });
  extract.addEventListener('click', () => void extractSelected());
  openReset.addEventListener('click', resetOpen);
  createReset.addEventListener('click', resetCreate);
  createButton.addEventListener('click', () => void createZip());
  nameInput.addEventListener('input', () => {
    nameTouched = nameInput.value.trim() !== '';
  });
  modeOpen.addEventListener('change', () => setMode('open'));
  modeCreate.addEventListener('change', () => setMode('create'));

  window.addEventListener('pagehide', () => {
    clearPreview();
    clearResult();
    zip = null;
    createFiles = [];
  });

  nameInput.value = zipArchiveFileName();
  renderCreateList();
  clearPreview();
  updateExtractState();
}
