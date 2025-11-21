// Group firms by specialization
import fs from 'fs';

const firms = JSON.parse(fs.readFileSync('member-firms-data.json', 'utf-8'));

// Group firms by specialization
const bySpecialization = {};

firms.forEach(firm => {
  const spec = firm.specialization || 'Sin especialización';
  
  if (!bySpecialization[spec]) {
    bySpecialization[spec] = [];
  }
  
  bySpecialization[spec].push(firm.name);
});

// Sort specializations alphabetically
const sortedSpecs = Object.keys(bySpecialization).sort();

console.log('Firmas agrupadas por especialización:\n');
console.log('='.repeat(60));

sortedSpecs.forEach(spec => {
  const firmsList = bySpecialization[spec];
  console.log(`\n${spec} (${firmsList.length} firmas):`);
  firmsList.forEach((firmName, index) => {
    console.log(`  ${index + 1}. ${firmName}`);
  });
});

// Create markdown file
let markdown = '# Firmas por Especialización\n\n';
markdown += `Total de especializaciones: ${sortedSpecs.length}\n\n`;
markdown += '---\n\n';

sortedSpecs.forEach(spec => {
  const firmsList = bySpecialization[spec];
  markdown += `## ${spec} (${firmsList.length} firmas)\n\n`;
  firmsList.forEach((firmName, index) => {
    markdown += `${index + 1}. ${firmName}\n`;
  });
  markdown += '\n';
});

fs.writeFileSync('firms-by-specialization.md', markdown);

console.log('\n' + '='.repeat(60));
console.log(`\n✅ Total de especializaciones: ${sortedSpecs.length}`);
console.log(`✅ Archivo creado: firms-by-specialization.md`);

// Statistics
const totalFirms = firms.length;
const firmsWithSpec = firms.filter(f => f.specialization).length;
const firmsWithoutSpec = totalFirms - firmsWithSpec;

console.log(`\nEstadísticas:`);
console.log(`- Total de firmas: ${totalFirms}`);
console.log(`- Firmas con especialización: ${firmsWithSpec}`);
console.log(`- Firmas sin especialización: ${firmsWithoutSpec}`);


