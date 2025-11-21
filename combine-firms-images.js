// Script to combine firm images with JSON data
import fs from 'fs';

// Read the mapping file to extract firm-image relationships
const mappingContent = fs.readFileSync('firms-images-mapping.md', 'utf-8');
const firms = JSON.parse(fs.readFileSync('member-firms-data.json', 'utf-8'));

// Parse the mapping from markdown
const imageMap = {};
const lines = mappingContent.split('\n');

let currentFirm = null;
lines.forEach(line => {
  // Match firm name: "**Firm Name**"
  const firmMatch = line.match(/\*\*([^*]+)\*\*/);
  if (firmMatch) {
    currentFirm = firmMatch[1].trim();
  }
  
  // Match image: "- Imagen: filename.png" or "- Imagen: *Sin imagen*"
  if (currentFirm && line.includes('- Imagen:')) {
    const imageMatch = line.match(/- Imagen:\s*(.+)/);
    if (imageMatch) {
      const imageValue = imageMatch[1].trim();
      if (imageValue === '*Sin imagen*') {
        imageMap[currentFirm] = null;
      } else {
        imageMap[currentFirm] = imageValue;
      }
      currentFirm = null; // Reset after finding image
    }
  }
});

// Add image field to each firm
const updatedFirms = firms.map(firm => {
  const imageFile = imageMap[firm.name] || null;
  return {
    ...firm,
    image: imageFile
  };
});

// Save updated JSON
fs.writeFileSync('member-firms-data.json', JSON.stringify(updatedFirms, null, 2));

console.log(`✅ JSON actualizado con imágenes`);
console.log(`Total de firmas: ${updatedFirms.length}`);
console.log(`Firmas con imagen: ${updatedFirms.filter(f => f.image).length}`);
console.log(`Firmas sin imagen: ${updatedFirms.filter(f => !f.image).length}`);

// Show sample
console.log('\nMuestra de firmas actualizadas:');
updatedFirms.slice(0, 5).forEach(f => {
  console.log(`- ${f.name}: ${f.image || 'Sin imagen'}`);
});

