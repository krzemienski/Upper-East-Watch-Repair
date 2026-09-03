import { useEffect } from 'react';

interface PageMetaProps {
  title: string;
  description: string;
  canonical?: string;
  image?: string;
}

export function PageMeta({ title, description, canonical, image }: PageMetaProps) {
  useEffect(() => {
    const fullTitle = title.includes('Upper East')
      ? title
      : `${title} | Upper East Watch Repair`;
    document.title = fullTitle;

    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute('content', description);
    } else {
      const el = document.createElement('meta');
      el.name = 'description';
      el.content = description;
      document.head.appendChild(el);
    }

    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) {
      ogTitle.setAttribute('content', fullTitle);
    } else {
      const el = document.createElement('meta');
      el.setAttribute('property', 'og:title');
      el.content = fullTitle;
      document.head.appendChild(el);
    }

    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) {
      ogDesc.setAttribute('content', description);
    } else {
      const el = document.createElement('meta');
      el.setAttribute('property', 'og:description');
      el.content = description;
      document.head.appendChild(el);
    }

    if (canonical) {
      let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
      if (!link) {
        link = document.createElement('link');
        link.rel = 'canonical';
        document.head.appendChild(link);
      }
      link.href = canonical;

      let ogUrl = document.querySelector('meta[property="og:url"]') as HTMLMetaElement | null;
      if (!ogUrl) {
        ogUrl = document.createElement('meta');
        ogUrl.setAttribute('property', 'og:url');
        document.head.appendChild(ogUrl);
      }
      ogUrl.content = canonical;
    }

    const setNamedMeta = (name: string, content: string) => {
      let element = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
      if (!element) {
        element = document.createElement('meta');
        element.name = name;
        document.head.appendChild(element);
      }
      element.content = content;
    };

    setNamedMeta('twitter:card', image ? 'summary_large_image' : 'summary');
    setNamedMeta('twitter:title', fullTitle);
    setNamedMeta('twitter:description', description);

    if (image) {
      let ogImage = document.querySelector('meta[property="og:image"]') as HTMLMetaElement | null;
      if (!ogImage) {
        ogImage = document.createElement('meta');
        ogImage.setAttribute('property', 'og:image');
        document.head.appendChild(ogImage);
      }
      ogImage.content = image;
      setNamedMeta('twitter:image', image);
    }
  }, [title, description, canonical, image]);

  return null;
}
