export function rotateCanvas(source: HTMLCanvasElement, degrees: number): HTMLCanvasElement {
  if (degrees === 0) return source;
  const radians = (degrees * Math.PI) / 180;
  const swap = Math.abs(degrees) === 90;
  const output = document.createElement('canvas');
  output.width = swap ? source.height : source.width;
  output.height = swap ? source.width : source.height;
  const context = output.getContext('2d');
  if (!context) throw new Error('캔버스를 사용할 수 없습니다.');
  context.translate(output.width / 2, output.height / 2);
  context.rotate(radians);
  context.drawImage(source, -source.width / 2, -source.height / 2);
  return output;
}
