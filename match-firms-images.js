// Script to match firm names with image files
import fs from 'fs';

const firms = JSON.parse(fs.readFileSync('member-firms-data.json', 'utf-8'));
const imageFiles = [
  'ABM.png', 'AEGIS.png', 'AFRA New.png', 'Alcogal updated.png', 'Appleby.jpg',
  'Arias Fabrega.jpg', 'ATU.png', 'AWIA Logo new.jpg', 'baker & partners.png',
  'BDO.jpg', 'BEDELL CRISTIN.jpg', 'BOLDER.jpg', 'Campbells.jpg', 'Carey Olsen.png',
  'Castlegate Investment Services.png', 'CIL logo.png', 'ClermontLogo_OnWhite_Pantone_V2-01.png',
  'Collas Crill.png', 'Conyers.png', 'Coverdale.jpg', 'CT logo.png', 'Deloitte dark logo.jpg',
  'Dentons.png', 'DLT Solutions Ltd logo.jpg', 'DR Logo.png', 'Ernst & Young.png',
  'Exness Logo Horizontal.png', 'FOLIO.jpg', 'FTI Logo.jpg', 'Gold Leaf.jpg',
  'HARNEYS FIDUCIARY.png', 'Harneys updated.png', 'HLB Trinity (BVI) Ltd logo.png',
  'Hudsun updated.png', 'Hyperion.jpg', 'Icaza BVI LOGO JPG..jpg', 'ICS logo.png',
  'ILS World2.png', 'INTERNATIONAL ARBITRATION CENTRE.png', 'Interpath logo.jpg',
  'Intertrust.jpg', 'JTC .jpg', 'Kobre & Kim.jpg', 'KPMG.png', 'Kroll Advisory.jpg',
  'lbc.jpg', 'LGS.png', 'Logo jpeg.jpg', 'LOGO LOEB SMITH blue.png', 'Maples_Group_Logo.jpg',
  'Martin Kenney.jpg', 'MMG.png', 'Mourant.jpg', 'National Bank logo.png', 'Ocorion.png',
  'Ogier .jpg', 'OMC Group.png', 'ONeal Webster logo.png', 'PFD.png', 'PMA Lawyers.png',
  'PMI.jpg', 'Portcullis.png', 'PRAXIS LOGO_WITHOUT STRAPLINE_RGB.jpg', 'PROVEN.png',
  'PWC updated.png', 'Quantuma_logo-RGB.png', 'Quijano.jpg', 'RandH Restructuring.png',
  'Rawlinson and Hunter.png', 'SAMUEL RICHARDSON.png', 'SHRM logo.jpg',
  'Sinclairs_BVI_final - 12 Sept 2018.jpg', 'SOMASI logo.jpg', 'Spencer West logo.png',
  'SR CORPORATE SERVICES LIMITED.png', 'Sterling BVI.png', 'Sucre.png',
  'Teneo_TAGLINE_Logo_Full_Color Digital2022.png', 'The Corpag Group.png', 'TMF logo.png',
  'totalserve-logo.jpg', 'Tovel updated.png', 'Tricor.jpg', 'Trident .jpg', 'Untitled SLC.png',
  'Vistra New logo.jpg', 'VP Bank.png', 'WALKERS.jpg', 'WITHERS.jpg'
];

// Helper function to normalize names for matching
function normalizeName(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .replace(/limited/g, '')
    .replace(/ltd/g, '')
    .replace(/bvi/g, '')
    .replace(/inc/g, '')
    .replace(/corp/g, '')
    .replace(/lp/g, '')
    .trim();
}

// Helper function to normalize image filename
function normalizeImageName(filename) {
  return filename
    .toLowerCase()
    .replace(/\.[^.]+$/, '') // Remove extension
    .replace(/[^a-z0-9]/g, '')
    .replace(/logo/g, '')
    .replace(/new/g, '')
    .replace(/updated/g, '')
    .replace(/dark/g, '')
    .replace(/horizontal/g, '')
    .replace(/tagline/g, '')
    .replace(/fullcolor/g, '')
    .replace(/digital/g, '')
    .replace(/2022/g, '')
    .replace(/final/g, '')
    .replace(/12/g, '')
    .replace(/sept/g, '')
    .replace(/2018/g, '')
    .replace(/without/g, '')
    .replace(/strapline/g, '')
    .replace(/rgb/g, '')
    .replace(/jpg/g, '')
    .replace(/png/g, '')
    .replace(/jpeg/g, '')
    .trim();
}

// Manual mappings for special cases
const manualMappings = {
  'Conyers Dill & Pearman': 'Conyers.png',
  'Conyers Trust Company (BVI) Limited': 'Conyers.png',
  'Asia Leading Corporate Services Limited': null, // No image
  'CCS Trustees Limited': null, // No image
  'Crossroads Capital Trustee Limited': null, // No image
  'Carre Trust (BVI) Limited': 'CT logo.png',
  'Mourant': 'Mourant.jpg',
  'NorthLark PTE LTD': null, // Generic logo, need to verify
  'O\'Neal Webster': 'ONeal Webster logo.png',
  'Ogier': 'Ogier .jpg',
  'Untitled SLC': 'Untitled SLC.png',
  'Walkers': 'WALKERS.jpg',
  'Aegis International Group Limited': 'AEGIS.png',
  'Alfaro, Ferrer & Ramirez (BVI) Limited': 'AFRA New.png',
  'Aleman, Cordero, Galindo & Lee Trust': 'Alcogal updated.png',
  'Alphonso Warner Insurance Agency': 'AWIA Logo new.jpg',
  'Baker & Partners  (BVI) Limited': 'baker & partners.png',
  'Bedell Cristin': 'BEDELL CRISTIN.jpg',
  'Bolder Corporate Services (BVI) Limited': 'BOLDER.jpg',
  'BVI International Arbitration Centre': 'INTERNATIONAL ARBITRATION CENTRE.png',
  'Campbells Legal  BVI': 'Campbells.jpg',
  'Caribbean Insurers Limited': 'CIL logo.png',
  'Clermont': 'ClermontLogo_OnWhite_Pantone_V2-01.png',
  'Castlegate Investment Services Limited': 'Castlegate Investment Services.png',
  'Crossroads Capital Trustee Limited': null, // No image - CT logo might be for something else
  'Deloitte Ltd': 'Deloitte dark logo.jpg',
  'DR Asset Planning (BVI) Ltd': 'DR Logo.png',
  'Ernst & Young Ltd': 'Ernst & Young.png',
  'Exness (VG) Ltd': 'Exness Logo Horizontal.png',
  'Folio Group Ltd': 'FOLIO.jpg',
  'FTI Consulting (BVI) Limited': 'FTI Logo.jpg',
  'Gold Leaf Consulting Limited': 'Gold Leaf.jpg',
  'Harneys': 'Harneys updated.png',
  'Harneys Fiduciary': 'HARNEYS FIDUCIARY.png',
  'HLB Trinity Financial Services Ltd': 'HLB Trinity (BVI) Ltd logo.png',
  'Hudsun Trust Company Limited': 'Hudsun updated.png',
  'Hyperion Insurance Management (BVI) Ltd': 'Hyperion.jpg',
  'Icaza, Gonzalez-Ruiz & Aleman (BVI) Trust Limited': 'Icaza BVI LOGO JPG..jpg',
  'ICS Corporate Services (BVI) Limited': 'ICS logo.png',
  'ILS Fiduciary (BVI) Limited': 'ILS World2.png',
  'Interpath': 'Interpath logo.jpg',
  'Intertrust Corporate Services (BVI) Limited': 'Intertrust.jpg',
  'JTC (BVI) Limited': 'JTC .jpg',
  'Kobre & Kim (BVI) LP': 'Kobre & Kim.jpg',
  'Kroll Advisory': 'Kroll Advisory.jpg',
  'Little Bay Consulting  Limited': 'lbc.jpg',
  'Loeb Smith': 'LOGO LOEB SMITH blue.png',
  'Maples and Calder': 'Maples_Group_Logo.jpg',
  'Martin Kenney & Co., Solicitors': 'Martin Kenney.jpg',
  'MMG Trust (BVI) Corp.': 'MMG.png',
  'National Bank of the Virgin Islands': 'National Bank logo.png',
  'Ocorian Corporate Services (BVI) Limited': 'Ocorion.png',
  'O\'Neal Webster': 'ONeal Webster logo.png',
  'Overseas Management Company Limited': 'OMC Group.png',
  'Patton, Moreno & Asvat (BVI) Ltd': 'PMA Lawyers.png',
  'PFD Corporate Services (BVI) Limited': 'PFD.png',
  'PMI Group Inc': 'PMI.jpg',
  'Portcullis (BVI) Ltd': 'Portcullis.png',
  'Praxis Trust (BVI) Limited': 'PRAXIS LOGO_WITHOUT STRAPLINE_RGB.jpg',
  'PROVEN BANK': 'PROVEN.png',
  'PricewaterhouseCoopers (BVI) Limited': 'PWC updated.png',
  'Quantuma (BVI) Ltd': 'Quantuma_logo-RGB.png',
  'Quijano & Associates (BVI) Limited': 'Quijano.jpg',
  'R&H Restructuring': 'RandH Restructuring.png',
  'Rawlinson & Hunter Limited': 'Rawlinson and Hunter.png',
  'Samuels Richardson & Co': 'SAMUEL RICHARDSON.png',
  'SHRM Trustees (BVI) Limited': 'SHRM logo.jpg',
  'SINCLAIRS  (BVI)': 'Sinclairs_BVI_final - 12 Sept 2018.jpg',
  'SOMASI Corporate Services Ltd': 'SOMASI logo.jpg',
  'Spencer West': 'Spencer West logo.png',
  'Sr Corporate Services Limited': 'SR CORPORATE SERVICES LIMITED.png',
  'Sterling Group': 'Sterling BVI.png',
  'Sucre & Sucre Trust Limited': 'Sucre.png',
  'Teneo': 'Teneo_TAGLINE_Logo_Full_Color Digital2022.png',
  'Corpag Group': 'The Corpag Group.png',
  'TMF Group': 'TMF logo.png',
  'Totalserve Trust Company Limited': 'totalserve-logo.jpg',
  'Tovel Investments Ltd': 'Tovel updated.png',
  'Tricor Services (BVI) Limited': 'Tricor.jpg',
  'Trident Trust Company (BVI) Limited': 'Trident .jpg',
  'Vistra (BVI) Limited': 'Vistra New logo.jpg',
  'VP Bank (BVI) LTD': 'VP Bank.png',
  'Withers BVI': 'WITHERS.jpg'
};

// Create mapping
const mappings = [];

firms.forEach(firm => {
  let imageFile = null;
  
  // Check manual mappings first (including null values)
  if (firm.name in manualMappings) {
    imageFile = manualMappings[firm.name]; // This can be null
  } else {
    // Try automatic matching
    const normalizedFirmName = normalizeName(firm.name);
    
    for (const imgFile of imageFiles) {
      const normalizedImgName = normalizeImageName(imgFile);
      
      // Check if firm name contains image name or vice versa
      if (normalizedFirmName.includes(normalizedImgName) || 
          normalizedImgName.includes(normalizedFirmName) ||
          normalizedFirmName === normalizedImgName) {
        imageFile = imgFile;
        break;
      }
    }
  }
  
  mappings.push({
    firmName: firm.name,
    imageFile: imageFile
  });
});

// Generate markdown
let markdown = '# Relación de Firmas e Imágenes\n\n';
markdown += 'Este documento relaciona cada firma con su archivo de imagen correspondiente.\n\n';
markdown += '**Notas:**\n';
markdown += '- La imagen `Conyers.png` se usa para ambas firmas: "Conyers Dill & Pearman" y "Conyers Trust Company (BVI) Limited"\n';
markdown += '- Las siguientes firmas NO tienen imagen: Asia Leading Corporate Services Limited, CCS Trustees Limited, Crossroads Capital Trustee Limited\n\n';
markdown += '---\n\n';

mappings.forEach((mapping, index) => {
  markdown += `${index + 1}. **${mapping.firmName}**\n`;
  if (mapping.imageFile) {
    markdown += `   - Imagen: ${mapping.imageFile}\n\n`;
  } else {
    markdown += `   - Imagen: *Sin imagen*\n\n`;
  }
});

fs.writeFileSync('firms-images-mapping.md', markdown);
console.log(`✅ Archivo creado: firms-images-mapping.md`);
console.log(`Total de firmas: ${mappings.length}`);
console.log(`Firmas con imagen: ${mappings.filter(m => m.imageFile).length}`);
console.log(`Firmas sin imagen: ${mappings.filter(m => !m.imageFile).length}`);

