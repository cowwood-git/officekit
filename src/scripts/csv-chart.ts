import {
  buildChartData,
  type ChartPalette,
  type ChartPoint,
  type ChartType,
  chartFileName,
  columnProfiles,
  formatAxisNumber,
  formatChartNumber,
  formatPercent,
  limitChartPoints,
  niceScale,
  PALETTES,
  piePoints,
  suggestChartColumns,
} from '@/lib/csv-chart';
import { trimEmptyEdges } from '@/lib/csv-xlsx';
import { formatBytes, MAX_TOTAL_BYTES } from '@/lib/files';
import { readTableFile } from '@/lib/table-file';

interface State {
  file: File;
  rows: string[][];
  downloadUrl?: string;
}

const MAX_ROWS = 10_000;
const MAX_RENDER_POINTS = 60;
const PIE_SLICES = 8;

let state: State | null = null;
let renderToken = 0;

function byId<T extends HTMLElement>(id: string): T | null {
  return document.getElementById(id) as T | null;
}

function css(name: string, fallback: string): string {
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
}

function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

function canvasFont(size: number, weight = 400): string {
  return `${weight} ${size}px system-ui, -apple-system, "Apple SD Gothic Neo", "Malgun Gothic", sans-serif`;
}

export function initCsvChart(): void {
  const input = byId<HTMLInputElement>('cc-input');
  const drop = byId<HTMLElement>('cc-drop');
  const panel = byId<HTMLElement>('cc-panel');
  const info = byId<HTMLElement>('cc-file-info');
  const typeSelect = byId<HTMLSelectElement>('cc-type');
  const categorySelect = byId<HTMLSelectElement>('cc-category');
  const valueSelect = byId<HTMLSelectElement>('cc-value');
  const titleInput = byId<HTMLInputElement>('cc-title');
  const legendInput = byId<HTMLInputElement>('cc-legend');
  const aggregateInput = byId<HTMLInputElement>('cc-aggregate');
  const paletteSelect = byId<HTMLSelectElement>('cc-palette');
  const canvas = byId<HTMLCanvasElement>('cc-canvas');
  const empty = byId<HTMLElement>('cc-empty');
  const status = byId<HTMLElement>('cc-status');
  const error = byId<HTMLElement>('cc-error');
  const note = byId<HTMLElement>('cc-note');
  const download = byId<HTMLAnchorElement>('cc-download');
  const clearButton = byId<HTMLButtonElement>('cc-clear');
  const stats = {
    rows: byId<HTMLElement>('cc-stat-rows'),
    categories: byId<HTMLElement>('cc-stat-categories'),
    total: byId<HTMLElement>('cc-stat-total'),
    max: byId<HTMLElement>('cc-stat-max'),
  };

  if (
    !input ||
    !drop ||
    !panel ||
    !typeSelect ||
    !categorySelect ||
    !valueSelect ||
    !canvas ||
    !status ||
    !error
  ) {
    return;
  }

  const showError = (message: string) => {
    error.hidden = message === '';
    error.textContent = message;
  };

  const revoke = () => {
    if (state?.downloadUrl) URL.revokeObjectURL(state.downloadUrl);
    if (state) state.downloadUrl = undefined;
    if (download) {
      download.removeAttribute('href');
      download.hidden = true;
    }
  };

  const fillSelect = (select: HTMLSelectElement, labels: string[], selected: number) => {
    select.replaceChildren();
    labels.forEach((label, index) => {
      const option = document.createElement('option');
      option.value = String(index);
      option.textContent = label;
      option.selected = index === selected;
      select.append(option);
    });
  };

  const updateStats = (points: ChartPoint[], dataRows: number) => {
    const total = points.reduce((sum, point) => sum + point.value, 0);
    const max = points.reduce(
      (value, point) => Math.max(value, point.value),
      Number.NEGATIVE_INFINITY,
    );
    if (stats.rows) stats.rows.textContent = dataRows.toLocaleString('ko-KR');
    if (stats.categories) stats.categories.textContent = points.length.toLocaleString('ko-KR');
    if (stats.total) stats.total.textContent = formatChartNumber(total);
    if (stats.max) stats.max.textContent = formatChartNumber(max);
  };

  const drawAxis = (
    context: CanvasRenderingContext2D,
    scale: ReturnType<typeof niceScale>,
    plot: { left: number; top: number; right: number; bottom: number },
    ink: string,
    muted: string,
    line: string,
    horizontal = false,
  ) => {
    context.save();
    context.font = canvasFont(10);
    context.fillStyle = muted;
    context.strokeStyle = line;
    context.lineWidth = 1;

    for (const tick of scale.ticks) {
      if (horizontal) {
        const x =
          plot.left + ((tick - scale.min) / (scale.max - scale.min)) * (plot.right - plot.left);
        context.beginPath();
        context.moveTo(x, plot.top);
        context.lineTo(x, plot.bottom);
        context.stroke();
        context.textAlign = 'center';
        context.textBaseline = 'top';
        context.fillText(formatAxisNumber(tick), x, plot.bottom + 8);
      } else {
        const y =
          plot.bottom - ((tick - scale.min) / (scale.max - scale.min)) * (plot.bottom - plot.top);
        context.beginPath();
        context.moveTo(plot.left, y);
        context.lineTo(plot.right, y);
        context.stroke();
        context.textAlign = 'right';
        context.textBaseline = 'middle';
        context.fillText(formatAxisNumber(tick), plot.left - 8, y);
      }
    }

    context.strokeStyle = ink;
    context.lineWidth = 1.5;
    if (horizontal) {
      const zero =
        plot.left + ((0 - scale.min) / (scale.max - scale.min)) * (plot.right - plot.left);
      context.beginPath();
      context.moveTo(zero, plot.top);
      context.lineTo(zero, plot.bottom);
      context.stroke();
    } else {
      const zero =
        plot.bottom - ((0 - scale.min) / (scale.max - scale.min)) * (plot.bottom - plot.top);
      context.beginPath();
      context.moveTo(plot.left, zero);
      context.lineTo(plot.right, zero);
      context.stroke();
    }
    context.restore();
  };

  const drawBars = (
    context: CanvasRenderingContext2D,
    points: ChartPoint[],
    scale: ReturnType<typeof niceScale>,
    plot: { left: number; top: number; right: number; bottom: number },
    color: string,
    ink: string,
    muted: string,
  ) => {
    const plotWidth = plot.right - plot.left;
    const plotHeight = plot.bottom - plot.top;
    const band = plotWidth / Math.max(1, points.length);
    const barWidth = Math.min(52, Math.max(4, band * 0.62));
    const zero = plot.bottom - ((0 - scale.min) / (scale.max - scale.min)) * plotHeight;
    const rotate = points.length > 8 || Math.max(...points.map((point) => point.label.length)) > 6;

    context.save();
    context.font = canvasFont(10);
    context.textAlign = 'center';
    context.textBaseline = 'top';

    points.forEach((point, index) => {
      const center = plot.left + band * index + band / 2;
      const valueY =
        plot.bottom - ((point.value - scale.min) / (scale.max - scale.min)) * plotHeight;
      const top = Math.min(zero, valueY);
      const height = Math.max(0, Math.abs(zero - valueY));

      context.fillStyle = color;
      context.beginPath();
      context.roundRect(center - barWidth / 2, top, barWidth, height, 3);
      context.fill();

      context.fillStyle = muted;
      if (rotate) {
        context.save();
        context.translate(center, plot.bottom + 8);
        context.rotate(-Math.PI / 4);
        context.textAlign = 'right';
        context.textBaseline = 'middle';
        context.fillText(truncate(point.label, 10), 0, 0);
        context.restore();
      } else {
        context.fillText(truncate(point.label, 12), center, plot.bottom + 8);
      }

      if (points.length <= 12) {
        context.fillStyle = ink;
        context.textAlign = 'center';
        context.textBaseline = 'bottom';
        context.fillText(formatAxisNumber(point.value), center, top - 4);
      }
    });

    context.restore();
  };

  const drawHorizontalBars = (
    context: CanvasRenderingContext2D,
    points: ChartPoint[],
    scale: ReturnType<typeof niceScale>,
    plot: { left: number; top: number; right: number; bottom: number },
    color: string,
    ink: string,
    muted: string,
  ) => {
    const plotWidth = plot.right - plot.left;
    const plotHeight = plot.bottom - plot.top;
    const band = plotHeight / Math.max(1, points.length);
    const barHeight = Math.min(36, Math.max(4, band * 0.68));
    const zero = plot.left + ((0 - scale.min) / (scale.max - scale.min)) * plotWidth;

    context.save();
    context.font = canvasFont(10);
    context.textBaseline = 'middle';

    points.forEach((point, index) => {
      const center = plot.top + band * index + band / 2;
      const valueX = plot.left + ((point.value - scale.min) / (scale.max - scale.min)) * plotWidth;
      const left = Math.min(zero, valueX);
      const width = Math.max(0, Math.abs(zero - valueX));

      context.fillStyle = color;
      context.beginPath();
      context.roundRect(left, center - barHeight / 2, width, barHeight, 3);
      context.fill();

      context.fillStyle = muted;
      context.textAlign = 'right';
      context.fillText(truncate(point.label, 12), plot.left - 8, center);

      context.fillStyle = ink;
      context.textAlign = 'left';
      context.fillText(formatAxisNumber(point.value), Math.max(left, valueX) + 6, center);
    });

    context.restore();
  };

  const drawLine = (
    context: CanvasRenderingContext2D,
    points: ChartPoint[],
    scale: ReturnType<typeof niceScale>,
    plot: { left: number; top: number; right: number; bottom: number },
    color: string,
    ink: string,
    muted: string,
  ) => {
    const plotWidth = plot.right - plot.left;
    const plotHeight = plot.bottom - plot.top;
    const step = plotWidth / Math.max(1, points.length - 1);
    const coordinates = points.map((point, index) => ({
      x: plot.left + step * index,
      y: plot.bottom - ((point.value - scale.min) / (scale.max - scale.min)) * plotHeight,
    }));

    context.save();
    context.strokeStyle = color;
    context.lineWidth = 2.5;
    context.lineJoin = 'round';
    context.lineCap = 'round';
    context.beginPath();
    coordinates.forEach((coordinate, index) => {
      if (index === 0) context.moveTo(coordinate.x, coordinate.y);
      else context.lineTo(coordinate.x, coordinate.y);
    });
    context.stroke();

    const stepFill = step;
    if (coordinates.length > 1) {
      const first = coordinates[0];
      const last = coordinates[coordinates.length - 1];
      if (first && last) {
        context.fillStyle = color;
        context.globalAlpha = 0.08;
        context.beginPath();
        context.moveTo(first.x, plot.bottom);
        for (const coordinate of coordinates) {
          context.lineTo(coordinate.x, coordinate.y);
        }
        context.lineTo(last.x, plot.bottom);
        context.closePath();
        context.fill();
        context.globalAlpha = 1;
      }
    }

    if (points.length <= 40) {
      coordinates.forEach((coordinate) => {
        context.fillStyle = color;
        context.beginPath();
        context.arc(coordinate.x, coordinate.y, 3.5, 0, Math.PI * 2);
        context.fill();
      });
    }

    context.font = canvasFont(10);
    context.fillStyle = muted;
    context.textAlign = 'center';
    context.textBaseline = 'top';
    const labelStep = Math.max(1, Math.ceil(points.length / 10));
    points.forEach((point, index) => {
      if (index % labelStep !== 0 && index !== points.length - 1) return;
      context.fillText(truncate(point.label, 10), plot.left + stepFill * index, plot.bottom + 8);
    });

    const lastPoint = points[points.length - 1];
    if (lastPoint && points.length <= 12) {
      context.fillStyle = ink;
      context.textBaseline = 'bottom';
      coordinates.forEach((coordinate, index) => {
        const point = points[index];
        if (point) context.fillText(formatAxisNumber(point.value), coordinate.x, coordinate.y - 8);
      });
    }
    context.restore();
  };

  const drawPie = (
    context: CanvasRenderingContext2D,
    points: ChartPoint[],
    colors: string[],
    ink: string,
    muted: string,
    surface: string,
    legend: boolean,
    width: number,
    height: number,
  ) => {
    const total = points.reduce((sum, point) => sum + point.value, 0);
    if (total <= 0) return;

    const legendWidth = legend ? Math.min(210, width * 0.38) : 0;
    const centerX = (width - legendWidth) / 2;
    const centerY = height / 2 + 12;
    const radius = Math.max(50, Math.min((width - legendWidth) / 2 - 36, height / 2 - 44));
    let angle = -Math.PI / 2;

    context.save();
    points.forEach((point, index) => {
      const slice = (point.value / total) * Math.PI * 2;
      context.fillStyle = colors[index % colors.length] ?? colors[0] ?? '#2563eb';
      context.beginPath();
      context.moveTo(centerX, centerY);
      context.arc(centerX, centerY, radius, angle, angle + slice);
      context.closePath();
      context.fill();
      context.strokeStyle = surface;
      context.lineWidth = 2;
      context.stroke();

      if (slice > Math.PI * 0.08) {
        const labelAngle = angle + slice / 2;
        const labelRadius = radius * 0.64;
        context.fillStyle = '#ffffff';
        context.font = canvasFont(10, 700);
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(
          formatPercent(point.value, total),
          centerX + Math.cos(labelAngle) * labelRadius,
          centerY + Math.sin(labelAngle) * labelRadius,
        );
      }
      angle += slice;
    });

    if (legend) {
      const legendX = width - legendWidth + 8;
      const startY = Math.max(42, centerY - (points.length * 22) / 2);
      context.font = canvasFont(10);
      context.textAlign = 'left';
      context.textBaseline = 'middle';
      points.forEach((point, index) => {
        const y = startY + index * 22;
        context.fillStyle = colors[index % colors.length] ?? colors[0] ?? '#2563eb';
        context.beginPath();
        context.roundRect(legendX, y - 5, 10, 10, 2);
        context.fill();
        context.fillStyle = ink;
        context.fillText(truncate(point.label, 16), legendX + 16, y);
        context.fillStyle = muted;
        context.textAlign = 'right';
        context.fillText(formatPercent(point.value, total), width - 14, y);
        context.textAlign = 'left';
      });
    }
    context.restore();
  };

  const draw = () => {
    if (!state) return;
    const token = ++renderToken;
    showError('');

    const profiles = columnProfiles(state.rows);
    const categoryColumn = Number(categorySelect.value);
    const valueColumn = Number(valueSelect.value);
    if (!Number.isInteger(categoryColumn) || !Number.isInteger(valueColumn) || valueColumn < 0) {
      showError('차트에 쓸 범주 열과 값 열을 선택하세요.');
      return;
    }

    const type = typeSelect.value as ChartType;
    const data = buildChartData(state.rows, {
      categoryColumn,
      valueColumn,
      aggregate: aggregateInput?.checked ?? false,
    });
    const limited = limitChartPoints(
      data.points,
      type,
      type === 'pie' ? PIE_SLICES : type === 'line' ? 500 : MAX_RENDER_POINTS,
    );
    const points = type === 'pie' ? piePoints(data.points, PIE_SLICES) : limited.points;
    const hiddenForPie = data.points.filter((point) => point.value <= 0).length;
    const truncated =
      type === 'pie'
        ? data.points.filter((point) => point.value > 0).length > points.length
        : limited.truncated;

    updateStats(points, Math.max(0, state.rows.length - 1));

    const notes: string[] = [];
    if (data.skipped > 0) notes.push(`숫자가 아닌 ${data.skipped}행은 제외했습니다.`);
    if (data.merged > 0) notes.push(`같은 이름 ${data.merged}행을 합쳤습니다.`);
    if (hiddenForPie > 0) notes.push(`0 이하 값 ${hiddenForPie}개는 파이에서 뺐습니다.`);
    if (truncated) {
      notes.push(
        type === 'pie'
          ? `상위 ${PIE_SLICES - 1}개와 기타로 묶었습니다.`
          : `점이 많아 ${points.length}개만 표시합니다.`,
      );
    }
    if (note) {
      note.hidden = notes.length === 0;
      note.textContent = notes.join(' ');
    }

    if (points.length === 0) {
      canvas.hidden = true;
      if (empty) empty.hidden = false;
      status.textContent = '';
      revoke();
      return;
    }

    canvas.hidden = false;
    if (empty) empty.hidden = true;

    const containerWidth = canvas.parentElement?.clientWidth ?? 720;
    const width = Math.max(320, Math.min(960, containerWidth));
    const height = 420;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = '100%';
    canvas.style.height = 'auto';

    const context = canvas.getContext('2d');
    if (!context) return;
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    context.clearRect(0, 0, width, height);

    const surface = css('--surface', '#ffffff');
    const ink = css('--ink', '#14181f');
    const muted = css('--muted', '#5b6472');
    const line = css('--line', '#e4e0d6');
    const palette =
      PALETTES[(paletteSelect?.value ?? 'default') as ChartPalette] ?? PALETTES.default;
    const color = palette[0] ?? '#2563eb';

    context.fillStyle = surface;
    context.fillRect(0, 0, width, height);

    const title = (titleInput?.value ?? '').trim() || state.file.name.replace(/\.[^.]+$/, '');
    context.fillStyle = ink;
    context.font = canvasFont(15, 700);
    context.textAlign = 'left';
    context.textBaseline = 'top';
    context.fillText(truncate(title, 44), 20, 18);

    const legend = legendInput?.checked ?? true;
    if (legend && type !== 'pie') {
      const label = profiles[valueColumn]?.label ?? '값';
      context.font = canvasFont(10);
      context.fillStyle = color;
      context.beginPath();
      context.roundRect(width - 20 - 10 - context.measureText(label).width - 16, 21, 10, 10, 2);
      context.fill();
      context.fillStyle = muted;
      context.textAlign = 'left';
      context.textBaseline = 'middle';
      context.fillText(label, width - 20 - context.measureText(label).width, 26);
    }

    const values = points.map((point) => point.value);
    const scale = niceScale(values, 5);

    if (type === 'pie') {
      drawPie(context, points, palette, ink, muted, surface, legend, width, height);
    } else if (type === 'bar-horizontal') {
      const plot = { left: 128, top: 52, right: width - 42, bottom: height - 54 };
      drawAxis(context, scale, plot, ink, muted, line, true);
      drawHorizontalBars(context, points, scale, plot, color, ink, muted);
    } else {
      const plot = { left: 64, top: 52, right: width - 24, bottom: height - 78 };
      drawAxis(context, scale, plot, ink, muted, line, false);
      if (type === 'line') {
        drawLine(context, points, scale, plot, color, ink, muted);
      } else {
        drawBars(context, points, scale, plot, color, ink, muted);
      }
    }

    const summary = `${title} — ${points.length}개 항목, 합계 ${formatChartNumber(
      points.reduce((sum, point) => sum + point.value, 0),
    )}`;
    canvas.setAttribute('role', 'img');
    canvas.setAttribute('aria-label', summary);
    status.textContent = `${points.length.toLocaleString('ko-KR')}개 항목으로 차트를 그렸습니다.`;

    canvas.toBlob((blob) => {
      if (token !== renderToken || !blob || !state) return;
      revoke();
      const url = URL.createObjectURL(blob);
      state.downloadUrl = url;
      if (download) {
        download.href = url;
        download.download = chartFileName(state.file.name);
        download.textContent = `PNG 내려받기 (${formatBytes(blob.size)})`;
        download.hidden = false;
      }
    }, 'image/png');
  };

  const load = async (file: File) => {
    showError('');
    revoke();
    if (!/\.(csv|tsv|xlsx|xls|ods)$/i.test(file.name)) {
      showError('CSV·TSV·XLSX·XLS·ODS 파일만 차트로 만들 수 있습니다.');
      return;
    }
    if (file.size > MAX_TOTAL_BYTES) {
      showError(`파일이 너무 큽니다. ${formatBytes(MAX_TOTAL_BYTES)} 이하 파일을 사용하세요.`);
      return;
    }

    status.textContent = '표를 읽는 중…';
    try {
      const table = await readTableFile(file);
      const rows = trimEmptyEdges(table.rows);
      if (rows.length < 2) {
        throw new Error('머리글과 데이터가 있는 표가 필요합니다.');
      }
      if (rows.length - 1 > MAX_ROWS) {
        throw new Error(
          `한 번에 ${MAX_ROWS.toLocaleString('ko-KR')}행까지 차트로 만들 수 있습니다.`,
        );
      }

      state = { file, rows };
      const profiles = columnProfiles(rows);
      const suggested = suggestChartColumns(rows);
      if (suggested.value < 0) {
        throw new Error('숫자 열을 찾지 못했습니다. 값이 숫자인 열이 있는지 확인하세요.');
      }

      fillSelect(
        categorySelect,
        profiles.map((profile) => profile.label),
        suggested.category,
      );
      fillSelect(
        valueSelect,
        profiles.map((profile) => profile.label),
        suggested.value,
      );
      if (titleInput && titleInput.value.trim() === '') {
        titleInput.value = file.name.replace(/\.[^.]+$/, '');
      }

      if (info)
        info.textContent = `${file.name} · ${formatBytes(file.size)} · ${rows.length - 1}행`;
      panel.hidden = false;
      draw();
    } catch (cause) {
      console.error(cause);
      state = null;
      panel.hidden = true;
      status.textContent = '';
      showError(cause instanceof Error ? cause.message : '표를 읽지 못했습니다.');
    }
  };

  for (const control of [
    typeSelect,
    categorySelect,
    valueSelect,
    titleInput,
    legendInput,
    aggregateInput,
    paletteSelect,
  ]) {
    control?.addEventListener('input', draw);
    control?.addEventListener('change', draw);
  }

  drop.addEventListener('dragover', (event) => {
    event.preventDefault();
    drop.dataset.drag = 'true';
  });
  drop.addEventListener('dragleave', () => {
    drop.dataset.drag = 'false';
  });
  drop.addEventListener('drop', (event) => {
    event.preventDefault();
    drop.dataset.drag = 'false';
    const file = event.dataTransfer?.files?.[0];
    if (file) void load(file);
  });
  input.addEventListener('change', () => {
    const file = input.files?.[0];
    if (file) void load(file);
    input.value = '';
  });

  clearButton?.addEventListener('click', () => {
    revoke();
    state = null;
    panel.hidden = true;
    status.textContent = '';
    showError('');
    if (note) note.hidden = true;
    if (titleInput) titleInput.value = '';
    input.value = '';
    input.focus();
  });

  let resizeTimer = 0;
  const redraw = () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      if (state) draw();
    }, 150);
  };
  window.addEventListener('resize', redraw);
  if (typeof MutationObserver !== 'undefined') {
    new MutationObserver(redraw).observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });
  }
  window.addEventListener('pagehide', revoke);
}
