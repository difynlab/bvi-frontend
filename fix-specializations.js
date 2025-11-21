// Fix specializations in JSON
import fs from 'fs';

const firms = JSON.parse(fs.readFileSync('member-firms-data.json', 'utf-8'));

let updatedCount = 0;

const updatedFirms = firms.map(firm => {
  let updated = false;
  
  // Fix: Unify "Compliance & Risk" to "Compliance and Risk"
  if (firm.specialization === 'Compliance & Risk') {
    firm.specialization = 'Compliance and Risk';
    updated = true;
  }
  
  // Fix: Correct "Yacht Managemntt" to "Yacht Management"
  if (firm.specialization === 'Yacht Managemntt') {
    firm.specialization = 'Yacht Management';
    updated = true;
  }
  
  // Fix: Assign "Others" to firms without specialization
  if (!firm.specialization || firm.specialization === '' || firm.specialization === null) {
    firm.specialization = 'Others';
    updated = true;
  }
  
  if (updated) {
    updatedCount++;
  }
  
  return firm;
});

// Save updated JSON
fs.writeFileSync('member-firms-data.json', JSON.stringify(updatedFirms, null, 2));

console.log(`✅ JSON actualizado`);
console.log(`Total de firmas: ${updatedFirms.length}`);
console.log(`Firmas actualizadas: ${updatedCount}`);

// Verify changes
const firmsWithoutSpec = updatedFirms.filter(f => !f.specialization || f.specialization === '' || f.specialization === null);
const complianceRisk = updatedFirms.filter(f => f.specialization === 'Compliance and Risk');
const yachtManagement = updatedFirms.filter(f => f.specialization === 'Yacht Management');
const others = updatedFirms.filter(f => f.specialization === 'Others');

console.log(`\nVerificación:`);
console.log(`- Firmas sin especialización: ${firmsWithoutSpec.length}`);
console.log(`- Compliance and Risk (unificado): ${complianceRisk.length} firmas`);
console.log(`- Yacht Management (corregido): ${yachtManagement.length} firmas`);
console.log(`- Others: ${others.length} firmas`);

if (firmsWithoutSpec.length > 0) {
  console.log(`\n⚠️  Firmas que aún no tienen especialización:`);
  firmsWithoutSpec.forEach(f => console.log(`  - ${f.name}`));
}


