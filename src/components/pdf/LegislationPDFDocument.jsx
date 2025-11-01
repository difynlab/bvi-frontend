import React from 'react';
import { Document, Page, Text, View, Image, Link } from '@react-pdf/renderer';
import { convertHtmlToPDF, formatDate, styles } from '../../utils/htmlToPDFConverter.jsx';

// Logo path - debe ser ruta absoluta desde public
const BVI_LOGO_PATH = '/images/bvi-logo-downloads.png';

const LegislationPDFDocument = ({ description, link }) => {
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
          <Text style={styles.title}>Legislation Document</Text>

          {/* Description - Converted HTML */}
          {description && convertHtmlToPDF(description)}

          {/* Link if exists */}
          {link && (
            <View style={styles.linkSection}>
              <Text style={styles.linkText}>Related Link: {link}</Text>
            </View>
          )}

          {/* Generated Date */}
          <Text style={styles.publishedDate}>
            Generated: {formatDate(new Date().toISOString())}
          </Text>
        </View>
      </Page>
    </Document>
  );
};

export default LegislationPDFDocument;


