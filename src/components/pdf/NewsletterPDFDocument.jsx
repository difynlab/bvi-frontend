import React from 'react';
import { Document, Page, Text, View, Image, Link } from '@react-pdf/renderer';
import { convertHtmlToPDF, formatDate, styles } from '../../utils/htmlToPDFConverter.jsx';

// Logo path - debe ser ruta absoluta desde public
const BVI_LOGO_PATH = '/images/bvi-logo-downloads.png';

const NewsletterPDFDocument = ({ newsletter }) => {
  // Validación más robusta
  if (!newsletter || typeof newsletter !== 'object') {
    return (
      <Document>
        <Page style={styles.page}>
          <Text>No newsletter data available</Text>
        </Page>
      </Document>
    );
  }

  // Función para obtener la fecha correcta
  const getPublishedDate = (newsletter) => {
    return newsletter.createdAt || newsletter.publishDate || 'Date not available';
  };

  // Función para obtener un fileName seguro
  const getSafeFileName = (newsletter) => {
    const fileName = newsletter.name || newsletter.fileName || 'newsletter';
    // Remover caracteres problemáticos para nombres de archivo
    return String(fileName).replace(/[<>:"/\\|?*]/g, '_').substring(0, 50);
  };

  // Función para obtener una URL de imagen segura
  const getSafeImageSrc = (newsletter) => {
    try {
      // PRIORITY 1: Try to get image from localStorage first (DEVELOPMENT)
      // Check both newsletter.id and tempId for new newsletters
      const localStorageImage = getNewsletterImageFromLocalStorage(newsletter.id, 'original') || 
                               getNewsletterImageFromLocalStorage(newsletter.tempId, 'original');
      
      if (localStorageImage) {
        return localStorageImage;
      }
      
      // PRIORITY 2: Fallback to server URLs (PRODUCTION)
      const serverImage = newsletter.thumbnail || newsletter.imagePreviewUrl;
      if (serverImage && typeof serverImage === 'string' && serverImage.startsWith('http')) {
        return serverImage;
      }
      
      // PRIORITY 3: Fallback to other image sources
      const src = newsletter.imagePreviewUrl || newsletter.imageUrl || `/images/${newsletter.imageFileName}`;
      // Validar que sea una URL válida
      if (src && typeof src === 'string' && src.trim()) {
        return src;
      }
      return null;
    } catch (error) {
      console.error('Error getting safe image src:', error);
      return null;
    }
  };

  // Función para obtener imagen del localStorage
  const getNewsletterImageFromLocalStorage = (newsletterId, imageType = 'original') => {
    if (!newsletterId) return null;
    
    try {
      const newslettersImages = JSON.parse(localStorage.getItem('bvi.newsletters.images') || '{}');
      const newsletterImages = newslettersImages[newsletterId];
      
      if (!newsletterImages) return null;
      
      return newsletterImages[imageType] || null;
    } catch (error) {
      console.error(`❌ Error getting ${imageType} image from localStorage:`, error);
      return null;
    }
  };

  return (
    <Document>
      <Page style={styles.page}>
        {/* HEADER */}
        <View style={styles.header}>
          <Image 
            src={BVI_LOGO_PATH} 
            style={styles.logoImage}
          />
        </View>

        {/* CONTENT */}
        <View style={styles.content}>
          {/* Title */}
          <Text style={styles.title}>{getSafeFileName(newsletter)}</Text>
          
          {/* Description - Converted HTML */}
          {convertHtmlToPDF(newsletter.descriptionHtml || newsletter.description)}

          {/* Image if exists */}
          {(() => {
            try {
              const imageSrc = getSafeImageSrc(newsletter);
              if (imageSrc && (newsletter.imageFileName || newsletter.imageUrl || newsletter.thumbnail)) {
                return (
                  <Image 
                    style={styles.image}
                    src={imageSrc}
                    alt={newsletter.imageFileName || 'Newsletter image'}
                  />
                );
              }
              return null;
            } catch (error) {
              console.warn('⚠️ Could not render image in PDF:', error);
              return null;
            }
          })()}

          {/* Link if exists */}
          {newsletter.link && (
            <View style={styles.linkSection}>
              <Text style={styles.linkText}>Related Link: {newsletter.link}</Text>
            </View>
          )}

          {/* Published Date */}
          <Text style={styles.publishedDate}>
            Published: {formatDate(getPublishedDate(newsletter))}
          </Text>
        </View>
      </Page>
    </Document>
  );
};

export default NewsletterPDFDocument;
