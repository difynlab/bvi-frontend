import React from 'react';
import { StyleSheet, Text, View, Link } from '@react-pdf/renderer';

export const styles = StyleSheet.create({
  page: { padding: 30, backgroundColor: '#fff' },
  header: { marginBottom: 20, borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 10, textAlign: 'center' },
  logo: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  headerSubtitle: { fontSize: 12, color: '#666' },
  content: { marginTop: 20 },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 10, color: '#333' },
  type: { fontSize: 12, color: '#666', marginBottom: 5 },
  description: { fontSize: 12, color: '#333', marginBottom: 10 },
  image: { maxWidth: '100%', maxHeight: 300, objectFit: 'contain', marginBottom: 10 },
  linkSection: { marginTop: 10, marginBottom: 10 },
  linkText: { fontSize: 10, color: '#007bff', textDecoration: 'underline' },
  publishedDate: { fontSize: 10, color: '#999', marginTop: 20, textAlign: 'right' },

  // Estilos para elementos HTML convertidos
  h1: { fontSize: 20, fontWeight: 'bold', marginBottom: 15, marginTop: 10, color: '#333' },
  h2: { fontSize: 16, fontWeight: 'bold', marginBottom: 12, marginTop: 8, color: '#333' },
  paragraph: { fontSize: 12, lineHeight: 1.5, marginBottom: 10, marginTop: 5, color: '#333' },
  bold: { fontWeight: 'bold' },
  italic: { fontStyle: 'italic' },
  underline: { textDecoration: 'underline' },
  strike: { textDecoration: 'line-through' },
  link: { color: '#007bff', textDecoration: 'underline' },
  bulletList: { marginBottom: 5 },
  orderedList: { marginBottom: 5 },
  listItem: { fontSize: 12, marginBottom: 2 },
  center: { textAlign: 'center' },
  left: { textAlign: 'left' },
  right: { textAlign: 'right' },
});

// Función simplificada para convertir HTML a componentes React PDF
export const convertHtmlToPDF = (htmlContent) => {
  if (!htmlContent) {
    return <Text style={styles.description}>No description available</Text>;
  }

  // Función para extraer estilos inline
  const getInlineStyles = (element) => {
    const styles = {};
    
    // Manejar color
    if (element.style?.color) {
      styles.color = element.style.color;
    }
    
    // Manejar text-align
    if (element.style?.textAlign) {
      switch (element.style.textAlign) {
        case 'center':
          styles.textAlign = 'center';
          break;
        case 'right':
          styles.textAlign = 'right';
          break;
        default:
          styles.textAlign = 'left';
      }
    }

    // Manejar font-weight
    if (element.style?.fontWeight) {
      if (element.style.fontWeight === 'bold' || parseInt(element.style.fontWeight) >= 700) {
        styles.fontWeight = 'bold';
      }
    }

    // Manejar font-style
    if (element.style?.fontStyle === 'italic') {
      styles.fontStyle = 'italic';
    }

    // Manejar font-family (tipografías)
    if (element.style?.fontFamily) {
      const fontFamily = element.style.fontFamily.toLowerCase();
      if (fontFamily.includes('times')) {
        styles.fontFamily = 'Times-Roman';
      } else if (fontFamily.includes('arial')) {
        styles.fontFamily = 'Helvetica';
      } else if (fontFamily.includes('public sans')) {
        styles.fontFamily = 'Helvetica';
      }
    }

    // Manejar text-decoration
    if (element.style?.textDecoration) {
      if (element.style.textDecoration.includes('underline')) {
        styles.textDecoration = 'underline';
      }
      if (element.style.textDecoration.includes('line-through')) {
        styles.textDecoration = 'line-through';
      }
    }
    
    return styles;
  };

  // Función para validar URL
  const isValidUrl = (url) => {
    if (!url || typeof url !== 'string') return false;
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  // Función recursiva para convertir elementos
  const convertElement = (element, index = 0) => {
    if (typeof element === 'string') {
      return element;
    }

    if (!element) return null;

    const tagName = element.tagName?.toLowerCase();
    const children = Array.from(element.children || []);
    const textContent = element.textContent || '';
    const inlineStyles = getInlineStyles(element);

    // Si no hay children pero hay textContent, crear un Text con el estilo apropiado
    if (!children.length && textContent) {
      // Caso especial para links
      if (tagName === 'a') {
        const href = element.href;
        if (isValidUrl(href)) {
          return (
            <Link key={index} src={href} style={[styles.link, inlineStyles]}>
              {textContent}
            </Link>
          );
        } else {
          // Si el href no es válido, mostrar como texto normal
          return (
            <Text key={index} style={[styles.link, inlineStyles]}>
              {textContent}
            </Text>
          );
        }
      }
      
      let baseStyle = styles.paragraph; // Default
      
      // Aplicar el estilo correcto según el tagName
      switch (tagName) {
        case 'h1':
          baseStyle = styles.h1;
          break;
        case 'h2':
          baseStyle = styles.h2;
          break;
        case 'p':
          baseStyle = styles.paragraph;
          break;
        case 'strong':
        case 'b':
          baseStyle = styles.bold;
          break;
        case 'em':
        case 'i':
          baseStyle = styles.italic;
          break;
        case 'u':
          baseStyle = styles.underline;
          break;
        case 's':
        case 'strike':
          baseStyle = styles.strike;
          break;
      }
      
      return (
        <Text key={index} style={[baseStyle, inlineStyles]}>
          {textContent}
        </Text>
      );
    }

    switch (tagName) {
      case 'h1':
        return (
          <Text key={index} style={[styles.h1, inlineStyles]}>
            {children.length ? children.map((child, i) => convertElement(child, i)) : textContent}
          </Text>
        );

      case 'h2':
        return (
          <Text key={index} style={[styles.h2, inlineStyles]}>
            {children.length ? children.map((child, i) => convertElement(child, i)) : textContent}
          </Text>
        );

      case 'p':
        return (
          <Text key={index} style={[styles.paragraph, inlineStyles]}>
            {children.length ? children.map((child, i) => convertElement(child, i)) : textContent}
          </Text>
        );

      case 'strong':
      case 'b':
        return (
          <Text key={index} style={[styles.bold, inlineStyles]}>
            {children.length ? children.map((child, i) => convertElement(child, i)) : textContent}
          </Text>
        );

      case 'em':
      case 'i':
        return (
          <Text key={index} style={[styles.italic, inlineStyles]}>
            {children.length ? children.map((child, i) => convertElement(child, i)) : textContent}
          </Text>
        );

      case 'u':
        return (
          <Text key={index} style={[styles.underline, inlineStyles]}>
            {children.length ? children.map((child, i) => convertElement(child, i)) : textContent}
          </Text>
        );

      case 's':
      case 'strike':
        return (
          <Text key={index} style={[styles.strike, inlineStyles]}>
            {children.length ? children.map((child, i) => convertElement(child, i)) : textContent}
          </Text>
        );

      case 'a':
        const href = element.href;
        if (isValidUrl(href)) {
          return (
            <Link key={index} src={href} style={[styles.link, inlineStyles]}>
              {children.length ? children.map((child, i) => convertElement(child, i)) : textContent}
            </Link>
          );
        } else {
          // Si el href no es válido, mostrar como texto normal
          return (
            <Text key={index} style={[styles.link, inlineStyles]}>
              {children.length ? children.map((child, i) => convertElement(child, i)) : textContent}
            </Text>
          );
        }

      case 'ul':
        return (
          <View key={index} style={styles.bulletList}>
            {children.map((child, i) => convertElement(child, i))}
          </View>
        );

      case 'ol':
        return (
          <View key={index} style={styles.orderedList}>
            {children.map((child, i) => convertElement(child, i))}
          </View>
        );

      case 'li':
        return (
          <Text key={index} style={styles.listItem}>
            • {children.length ? children.map((child, i) => convertElement(child, i)) : textContent}
          </Text>
        );

      case 'br':
        return '\n';

      case 'div':
        return (
          <View key={index}>
            {children.map((child, i) => convertElement(child, i))}
          </View>
        );

      case 'span':
        return (
          <Text key={index} style={inlineStyles}>
            {children.length ? children.map((child, i) => convertElement(child, i)) : textContent}
          </Text>
        );

      default:
        // Para elementos no reconocidos, mostrar solo el texto
        return textContent;
    }
  };

  try {
    // Crear un parser simple para HTML
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');
    const body = doc.body;

    if (!body || !body.children.length) {
      // Si no hay elementos hijos, intentar obtener el texto completo
      const textContent = body.textContent || htmlContent.replace(/<[^>]*>/g, '');
      return <Text style={styles.description}>{textContent}</Text>;
    }

    const convertedElements = Array.from(body.children).map((child, index) => convertElement(child, index));

    return (
      <View style={styles.description}>
        {convertedElements}
      </View>
    );
  } catch (error) {
    console.error('Error converting HTML to PDF:', error);
    // Fallback: mostrar texto plano
    return <Text style={styles.description}>{htmlContent.replace(/<[^>]*>/g, '')}</Text>;
  }
};

// Función para formatear fecha con validación
export const formatDate = (dateString) => {
  if (!dateString) return 'Date not available';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Date not available';
  }
};