/**
 * Image Optimization Utilities
 * Provides WebP conversion, lazy loading, and responsive image support
 */

interface ImageOptimizationOptions {
  quality?: number;
  width?: number;
  height?: number;
  format?: 'webp' | 'jpeg' | 'png';
  lazy?: boolean;
  placeholder?: 'blur' | 'color' | 'none';
  cdnUrl?: string;
}

interface ResponsiveImage {
  src: string;
  srcSet: string;
  sizes: string;
  placeholder?: string;
}

class ImageOptimizationService {
  private cdnUrl: string = '';
  private supportedFormats: Set<string> = new Set();

  constructor() {
    this.detectSupportedFormats();
    this.loadCdnConfig();
  }

  private async detectSupportedFormats() {
    // Check WebP support
    const webpSupport = await this.checkWebPSupport();
    if (webpSupport) {
      this.supportedFormats.add('webp');
    }

    // AVIF support check (newer format)
    const avifSupport = await this.checkAVIFSupport();
    if (avifSupport) {
      this.supportedFormats.add('avif');
    }

    console.log('Supported image formats:', Array.from(this.supportedFormats));
  }

  private checkWebPSupport(): Promise<boolean> {
    return new Promise((resolve) => {
      const webP = new Image();
      webP.onload = webP.onerror = () => {
        resolve(webP.height === 1);
      };
      webP.src =
        'data:image/webp;base64,UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoBAAEAAwA0JaQAA3AA/vuUAAA=';
    });
  }

  private checkAVIFSupport(): Promise<boolean> {
    return new Promise((resolve) => {
      const avif = new Image();
      avif.onload = avif.onerror = () => {
        resolve(avif.height === 1);
      };
      avif.src =
        'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgANogQEAwgMg8f8D///8WfhwB8+ErK42A=';
    });
  }

  private loadCdnConfig() {
    // Load CDN URL from config
    const config = (window as any).__APP_CONFIG__ || {};
    this.cdnUrl = config.CDN_URL || process.env.REACT_APP_CDN_URL || '';
  }

  /**
   * Generate optimized image URL
   */
  optimizeUrl(url: string, options: ImageOptimizationOptions = {}): string {
    const {
      quality = 80,
      width,
      height,
      format = 'webp',
      cdnUrl = this.cdnUrl,
    } = options;

    // If no CDN configured, return original URL
    if (!cdnUrl) {
      return url;
    }

    // Build CDN parameters
    const params = new URLSearchParams();

    if (width) params.set('w', width.toString());
    if (height) params.set('h', height.toString());
    if (quality) params.set('q', quality.toString());
    if (format && this.supportedFormats.has(format)) {
      params.set('f', format);
    }

    // Construct CDN URL
    const encodedUrl = encodeURIComponent(url);
    return `${cdnUrl}/${encodedUrl}?${params.toString()}`;
  }

  /**
   * Generate responsive image srcSet
   */
  generateResponsiveSrcSet(
    url: string,
    options: ImageOptimizationOptions = {}
  ): ResponsiveImage {
    const widths = [320, 640, 768, 1024, 1366, 1920];
    const format = this.getBestFormat(options.format);

    const srcSet = widths
      .map((width) => {
        const optimizedUrl = this.optimizeUrl(url, {
          ...options,
          width,
          format,
        });
        return `${optimizedUrl} ${width}w`;
      })
      .join(', ');

    const sizes =
      '(max-width: 320px) 320px, (max-width: 640px) 640px, (max-width: 768px) 768px, (max-width: 1024px) 1024px, (max-width: 1366px) 1366px, 1920px';

    return {
      src: this.optimizeUrl(url, { ...options, width: 1024, format }),
      srcSet,
      sizes,
      placeholder: options.placeholder
        ? this.generatePlaceholder(url, options.placeholder)
        : undefined,
    };
  }

  /**
   * Generate placeholder image
   */
  private generatePlaceholder(url: string, type: 'blur' | 'color' | 'none'): string {
    if (type === 'none') return '';

    if (type === 'color') {
      // Return a solid color placeholder
      return 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"%3E%3Crect fill="%23f0f0f0" width="1" height="1"/%3E%3C/svg%3E';
    }

    if (type === 'blur') {
      // Return a tiny blurred version (would need to be generated server-side)
      return this.optimizeUrl(url, { width: 10, quality: 10 });
    }

    return '';
  }

  /**
   * Get best supported format
   */
  private getBestFormat(preferredFormat?: string): 'webp' | 'jpeg' | 'png' {
    if (preferredFormat && this.supportedFormats.has(preferredFormat)) {
      // Only return if it's one of the allowed formats
      if (preferredFormat === 'webp' || preferredFormat === 'jpeg' || preferredFormat === 'png') {
        return preferredFormat;
      }
    }

    // AVIF is not in the allowed format types, so we fall back to webp
    if (this.supportedFormats.has('webp')) return 'webp';
    return 'jpeg';
  }

  /**
   * Create lazy loading observer
   */
  createLazyLoadObserver(callback?: (entry: IntersectionObserverEntry) => void) {
    const options = {
      root: null,
      rootMargin: '50px',
      threshold: 0.01,
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;

          // Load the image
          if (img.dataset.src) {
            img.src = img.dataset.src;
          }

          if (img.dataset.srcset) {
            img.srcset = img.dataset.srcset;
          }

          // Remove lazy loading class
          img.classList.remove('lazy');
          img.classList.add('loaded');

          // Unobserve
          observer.unobserve(entry.target);

          // Call custom callback
          if (callback) {
            callback(entry);
          }
        }
      });
    }, options);

    return observer;
  }

  /**
   * Preload critical images
   */
  preloadImage(url: string, options: ImageOptimizationOptions = {}) {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = this.optimizeUrl(url, options);

    // Add responsive image support
    if (options.width) {
      const responsive = this.generateResponsiveSrcSet(url, options);
      link.setAttribute('imagesrcset', responsive.srcSet);
      link.setAttribute('imagesizes', responsive.sizes);
    }

    document.head.appendChild(link);
  }

  /**
   * Convert image to WebP on client side (for user uploads)
   */
  async convertToWebP(file: File, quality: number = 0.8): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        const img = new Image();

        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Failed to get canvas context'));
            return;
          }

          ctx.drawImage(img, 0, 0);

          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob);
              } else {
                reject(new Error('Failed to convert image'));
              }
            },
            'image/webp',
            quality
          );
        };

        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = e.target?.result as string;
      };

      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }

  /**
   * Get optimized image props for React components
   */
  getImageProps(url: string, options: ImageOptimizationOptions = {}) {
    const responsive = this.generateResponsiveSrcSet(url, options);

    return {
      src: responsive.src,
      srcSet: responsive.srcSet,
      sizes: responsive.sizes,
      loading: options.lazy ? ('lazy' as const) : ('eager' as const),
      decoding: 'async' as const,
      ...(responsive.placeholder && {
        style: {
          backgroundImage: `url(${responsive.placeholder})`,
          backgroundSize: 'cover',
        },
      }),
    };
  }
}

export const imageOptimization = new ImageOptimizationService();
export default imageOptimization;
