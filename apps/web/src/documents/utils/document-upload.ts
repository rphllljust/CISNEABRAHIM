import { getApiBaseUrl } from '../../auth/api/auth-api';
import { tokenStore } from '../../auth/storage/token-store';

export function uploadMultipart<T>(
  path: string,
  formData: FormData,
  onProgress: (progress: number) => void,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const accessToken = tokenStore.getAccessToken();
    if (!accessToken) {
      reject(new Error('Sessão expirada.'));
      return;
    }

    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${getApiBaseUrl()}${path}`);
    xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`);
    xhr.setRequestHeader('Accept', 'application/json');

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };

    xhr.onerror = () => {
      reject(new Error('Falha de rede durante o envio.'));
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText) as T);
        } catch {
          reject(new Error('Resposta inválida do servidor.'));
        }
        return;
      }

      try {
        const body = JSON.parse(xhr.responseText) as { error?: { code?: string; message?: string } };
        reject(new Error(body.error?.message ?? 'Falha no envio do arquivo.'));
      } catch {
        reject(new Error('Falha no envio do arquivo.'));
      }
    };

    xhr.send(formData);
  });
}
