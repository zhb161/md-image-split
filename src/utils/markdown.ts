import axios from 'axios';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

interface ProcessResult {
  mdContent: string;
  images: {
    originalUrl: string;
    localPath: string;
    blob: Blob;
  }[];
  errors: {
    url: string;
    message: string;
  }[];
}

export async function processMarkdown(content: string): Promise<ProcessResult> {
  const result: ProcessResult = {
    mdContent: content,
    images: [],
    errors: [],
  };

  // 匹配Markdown中的图片链接
  const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
  const matches = Array.from(content.matchAll(imageRegex));

  if (matches.length === 0) {
    return result;
  }

  // 并发下载图片
  const downloadPromises = matches.map(async (match) => {
    const [fullMatch, alt, url] = match;
    
    // 跳过base64图片
    if (url.startsWith('data:')) {
      return;
    }
    
    try {
      // 使用fetch API替代axios
      const response = await fetch(url, {
        // 尝试设置空referrer以绕过防盗链
        referrerPolicy: 'no-referrer',
        // 设置模式为cors
        mode: 'cors',
        // 增加重试机制
        cache: 'no-cache',
      });
      
      if (!response.ok) {
        throw new Error(`请求失败，状态码: ${response.status}`);
      }
      
      const blob = await response.blob();
      const extension = getFileExtension(url) || getMimeExtension(blob.type) || 'png';
      const fileName = generateFileName(url);
      const localPath = `images/${fileName}.${extension}`;

      result.images.push({
        originalUrl: url,
        localPath,
        blob,
      });

      // 更新Markdown内容中的图片链接
      result.mdContent = result.mdContent.replace(
        fullMatch,
        `![${alt}](${localPath})`
      );
    } catch (error) {
      // 尝试备用方法：创建<img>元素请求图片
      try {
        const blob = await fetchImageViaImgTag(url);
        const extension = getFileExtension(url) || getMimeExtension(blob.type) || 'png';
        const fileName = generateFileName(url);
        const localPath = `images/${fileName}.${extension}`;

        result.images.push({
          originalUrl: url,
          localPath,
          blob,
        });

        // 更新Markdown内容中的图片链接
        result.mdContent = result.mdContent.replace(
          fullMatch,
          `![${alt}](${localPath})`
        );
      } catch (err) {
        result.errors.push({
          url,
          message: error instanceof Error ? error.message : '下载失败',
        });
      }
    }
  });

  await Promise.all(downloadPromises);

  // 创建ZIP文件
  const zip = new JSZip();
  zip.file('content.md', result.mdContent);
  
  const imagesFolder = zip.folder('images');
  if (imagesFolder) {
    result.images.forEach((image) => {
      const filename = image.localPath.split('/')[1];
      imagesFolder.file(filename, image.blob);
    });
  }

  // 生成并下载ZIP文件
  const zipBlob = await zip.generateAsync({ type: 'blob' });
  saveAs(zipBlob, 'markdown-with-images.zip');

  return result;
}

// 使用img标签获取图片（绕过CORS限制）
function fetchImageViaImgTag(url: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous'; // 尝试请求CORS
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('无法创建Canvas上下文'));
        return;
      }
      
      ctx.drawImage(img, 0, 0);
      
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('无法从Canvas创建Blob'));
        }
      });
    };
    
    img.onerror = () => {
      reject(new Error('图片加载失败'));
    };
    
    img.src = url;
  });
}

function getFileExtension(url: string): string | null {
  // 忽略查询参数
  const urlWithoutQuery = url.split('?')[0];
  const match = urlWithoutQuery.match(/\.([^.]+)$/);
  return match ? match[1].toLowerCase() : null;
}

function getMimeExtension(mimeType: string): string | null {
  const mimeMap: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'image/svg+xml': 'svg',
    'image/bmp': 'bmp',
  };
  
  return mimeMap[mimeType] || null;
}

function generateFileName(url: string): string {
  try {
    // 从URL中提取文件名，如果没有则生成随机文件名
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    const originalName = pathParts[pathParts.length - 1];
    
    if (originalName && originalName !== '') {
      // 移除扩展名和查询参数
      return originalName.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9-_]/g, '');
    }
  } catch (e) {
    // URL解析错误，使用回退方案
  }
  
  // 生成随机文件名
  return `img-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
} 