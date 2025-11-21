// Extract specializations from HTML
import fs from 'fs';

const html = fs.readFileSync('raw-page.html', 'utf-8');

// Find the select options line
const optionMatch = html.match(/<option value="([^"]+)"\s*>([^<]+)<\/option>/g);

const specializations = [];

if (optionMatch) {
  optionMatch.forEach(option => {
    // Extract the text content (specialization name)
    const textMatch = option.match(/>([^<]+)</);
    if (textMatch && textMatch[1] !== 'Member by Specialisation') {
      // Extract value to get color code
      const valueMatch = option.match(/value="([^"]+)"/);
      const value = valueMatch ? valueMatch[1] : '';
      const [name, color] = value.split(':');
      
      specializations.push({
        name: textMatch[1].trim(),
        value: name || textMatch[1].trim(),
        color: color || null
      });
    }
  });
}

console.log('Total de especializaciones encontradas:', specializations.length);
console.log('\nLista de especializaciones:');
specializations.forEach((spec, i) => {
  console.log(`${i + 1}. ${spec.name}${spec.color ? ` (color: #${spec.color})` : ''}`);
});

// Save to JSON
fs.writeFileSync('specializations-list.json', JSON.stringify(specializations, null, 2));
console.log('\n✅ Lista guardada en specializations-list.json');


