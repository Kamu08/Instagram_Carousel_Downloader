export async function rotateImage(dataUrl: string, degrees: number = 90): Promise<{
  dataUrl: string;
  width: number;
  height: number;
  sizeBytes: number;
}> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas 2D context not supported.'));
        return;
      }

      const rad = (degrees * Math.PI) / 180;
      const is90or270 = Math.abs(degrees % 180) === 90;

      const newWidth = is90or270 ? img.height : img.width;
      const newHeight = is90or270 ? img.width : img.height;

      canvas.width = newWidth;
      canvas.height = newHeight;

      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(rad);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);

      const resultDataUrl = canvas.toDataURL('image/png');
      const byteString = atob(resultDataUrl.split(',')[1]);

      resolve({
        dataUrl: resultDataUrl,
        width: newWidth,
        height: newHeight,
        sizeBytes: byteString.length,
      });
    };
    img.onerror = () => reject(new Error('Failed to load image for rotation.'));
    img.src = dataUrl;
  });
}

export async function flipImageHorizontal(dataUrl: string): Promise<{
  dataUrl: string;
  width: number;
  height: number;
  sizeBytes: number;
}> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas 2D context not supported.'));
        return;
      }

      canvas.width = img.width;
      canvas.height = img.height;

      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(img, 0, 0);

      const resultDataUrl = canvas.toDataURL('image/png');
      const byteString = atob(resultDataUrl.split(',')[1]);

      resolve({
        dataUrl: resultDataUrl,
        width: img.width,
        height: img.height,
        sizeBytes: byteString.length,
      });
    };
    img.onerror = () => reject(new Error('Failed to load image for flip.'));
    img.src = dataUrl;
  });
}
