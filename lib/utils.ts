
export const formatDate = (isoString?: string): string => {
  if (!isoString) return 'N/A';
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) { // Check if date is valid
        return 'Data inválida';
    }
    return date.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
  } catch (e) {
    console.error("Error formatting date:", e, "Input:", isoString);
    return 'Data inválida';
  }
};

export const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result.split(',')[1]); // Get Base64 part
      } else {
        reject(new Error("Failed to read blob as base64 string."));
      }
    };
    reader.onerror = (error) => {
        console.error("FileReader error:", error);
        reject(error);
    };
    reader.readAsDataURL(blob);
  });
};
