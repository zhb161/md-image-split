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

  // Match image links in Markdown
  const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
  const matches = Array.from(content.matchAll(imageRegex));

  if (matches.length === 0) {
    return result;
  }

  // Concurrent image downloads
  const downloadPromises = matches.map(async (match) => {
    const [fullMatch, alt, url] = match;
    
    // Skip base64 images
    if (url.startsWith('data:')) {
      return;
    }
    
    try {
      // Use fetch API instead of axios
      const response = await fetch(url, {
        // Try to set no-referrer to bypass hotlink protection
        referrerPolicy: 'no-referrer',
        // Set mode to cors
        mode: 'cors',
        // Add retry mechanism
        cache: 'no-cache',
      });
      
      if (!response.ok) {
        throw new Error(`Request failed with status code: ${response.status}`);
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

      // Update image links in Markdown content
      result.mdContent = result.mdContent.replace(
        fullMatch,
        `![${alt}](${localPath})`
      );
    } catch (error) {
      // Try fallback method: create <img> element to request image
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

        // Update image links in Markdown content
        result.mdContent = result.mdContent.replace(
          fullMatch,
          `![${alt}](${localPath})`
        );
      } catch (err) {
        result.errors.push({
          url,
          message: error instanceof Error ? error.message : 'Download failed',
        });
      }
    }
  });

  await Promise.all(downloadPromises);

  // Create ZIP file
  const zip = new JSZip();
  zip.file('content.md', result.mdContent);
  
  const imagesFolder = zip.folder('images');
  if (imagesFolder) {
    result.images.forEach((image) => {
      const filename = image.localPath.split('/')[1];
      imagesFolder.file(filename, image.blob);
    });
  }

  // Generate and download ZIP file
  const zipBlob = await zip.generateAsync({ type: 'blob' });
  saveAs(zipBlob, 'markdown-with-images.zip');

  return result;
}

// Use img tag to get image (bypass CORS restrictions)
function fetchImageViaImgTag(url: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous'; // Try to request CORS
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to create Canvas context'));
        return;
      }
      
      ctx.drawImage(img, 0, 0);
      
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to create Blob from Canvas'));
        }
      });
    };
    
    img.onerror = () => {
      reject(new Error('Image loading failed'));
    };
    
    img.src = url;
  });
}

function getFileExtension(url: string): string | null {
  // Ignore query parameters
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
    // Extract filename from URL, generate random name if none exists
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    const originalName = pathParts[pathParts.length - 1];
    
    if (originalName && originalName !== '') {
      // Remove extension and query parameters
      return originalName.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9-_]/g, '');
    }
  } catch (e) {
    // URL parsing error, use fallback
  }
  
  // Generate random filename
  return `img-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
} 