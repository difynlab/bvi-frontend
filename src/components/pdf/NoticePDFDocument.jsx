import React from 'react';
import { Document, Page, Text, View, Image, Link } from '@react-pdf/renderer';
import { convertHtmlToPDF, formatDate, styles } from '../../utils/htmlToPDFConverter.jsx';

const NoticePDFDocument = ({ notice }) => {
  // Validación más robusta
  if (!notice || typeof notice !== 'object') {
    return (
      <Document>
        <Page style={styles.page}>
          <Text>No notice data available</Text>
        </Page>
      </Document>
    );
  }

  // Función para obtener el nombre de la categoría
  const getCategoryName = (categoryId) => {
    if (!categoryId) return 'Not specified';
    
    // Mapeo de IDs a nombres (basado en los datos mock)
    const categoryMap = {
      'cat-1': 'Policy Circulars',
      'cat-2': 'Market Updates', 
      'cat-3': 'Member Bulletins'
    };
    
    return categoryMap[categoryId] || categoryId;
  };

  // Función para obtener la fecha correcta
  const getPublishedDate = (notice) => {
    return notice.publishDate || notice.createdAt || notice.createdAtISO || 'Date not available';
  };

  // Función para obtener un fileName seguro
  const getSafeFileName = (notice) => {
    const fileName = notice.fileName || notice.title || 'notice';
    // Remover caracteres problemáticos para nombres de archivo
    return String(fileName).replace(/[<>:"/\\|?*]/g, '_').substring(0, 50);
  };

  // Función para obtener una URL de imagen segura
  const getSafeImageSrc = (notice) => {
    const src = notice.imagePreviewUrl || notice.imageUrl || `/images/${notice.imageFileName}`;
    // Validar que sea una URL válida
    if (src && typeof src === 'string' && src.trim()) {
      return src;
    }
    return null;
  };

  return (
    <Document>
      <Page style={styles.page}>
        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.logo}>BVI Logo</Text>
        </View>

        {/* CONTENT */}
        <View style={styles.content}>
          {/* Title */}
          <Text style={styles.title}>{getSafeFileName(notice)}</Text>
          
          {/* Type */}
          <Text style={styles.type}>Type: {getCategoryName(notice.noticeType || notice.categoryId)}</Text>

          {/* Description - Converted HTML */}
          {convertHtmlToPDF(notice.editorHtml || notice.description)}

          {/* Image if exists */}
          {(notice.imageFileName || notice.imageUrl) && getSafeImageSrc(notice) && (
            <Image 
              style={styles.image}
              src={getSafeImageSrc(notice)}
              alt={notice.imageFileName || 'Notice image'}
            />
          )}

          {/* Link if exists */}
          {notice.linkUrl && (
            <View style={styles.linkSection}>
              <Text style={styles.linkText}>Related Link: {notice.linkUrl}</Text>
            </View>
          )}

          {/* Published Date */}
          <Text style={styles.publishedDate}>
            Published: {formatDate(getPublishedDate(notice))}
          </Text>
        </View>
      </Page>
    </Document>
  );
};

export default NoticePDFDocument;