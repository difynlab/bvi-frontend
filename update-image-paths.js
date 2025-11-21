// Script to update image paths to include expert-images/ folder
import fs from 'fs';

const firms = JSON.parse(fs.readFileSync('member-firms-data.json', 'utf-8'));

// Update image paths
const updatedFirms = firms.map(firm => {
  if (firm.image) {
    return {
      ...firm,
      image: `expert-images/${firm.image}`
    };
  }
  return firm;
});

// Save updated JSON
fs.writeFileSync('member-firms-data.json', JSON.stringify(updatedFirms, null, 2));

console.log(`✅ Rutas de imágenes actualizadas`);
console.log(`Total de firmas: ${updatedFirms.length}`);
console.log(`Firmas con imagen: ${updatedFirms.filter(f => f.image).length}`);
console.log(`Firmas sin imagen: ${updatedFirms.filter(f => !f.image).length}`);

// Show sample
console.log('\nMuestra de rutas actualizadas:');
updatedFirms.slice(0, 5).forEach(f => {
  console.log(`- ${f.name}: ${f.image || 'Sin imagen'}`);
});

