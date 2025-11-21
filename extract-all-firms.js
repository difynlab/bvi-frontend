// Script to extract ALL member firms from the HTML
import fs from 'fs';

function extractAllFirms(html) {
  const firms = [];
  
  // Pattern 1: Look for member-info divs with strong tags
  const memberInfoPattern = /<div class="member-info">[\s\S]*?<\/div>/gi;
  let match;
  
  while ((match = memberInfoPattern.exec(html)) !== null) {
    const memberHtml = match[0];
    
    // Extract name from <strong> tag
    const nameMatch = memberHtml.match(/<strong>([^<]+)<\/strong>/i);
    if (!nameMatch) continue;
    
    const name = nameMatch[1].trim();
    
    // Extract description (text after strong tag, before closing div)
    let description = null;
    const descMatch = memberHtml.match(/<\/strong>[\s\S]*?<p>([\s\S]*?)<\/p>/i) || 
                     memberHtml.match(/<\/strong>([\s\S]*?)(?:<\/div>|$)/i);
    if (descMatch && descMatch[1]) {
      description = descMatch[1]
        .replace(/<[^>]+>/g, '') // Remove HTML tags
        .trim();
      if (description.length === 0) description = null;
    }
    
    firms.push({ name, description: description || null });
  }
  
  // Pattern 2: Also look for member-item divs that might contain more info
  const memberItemPattern = /<div[^>]*class="[^"]*member-item[^"]*"[^>]*>([\s\S]*?)<\/div>/gi;
  const processedNames = new Set(firms.map(f => f.name.toLowerCase()));
  
  while ((match = memberItemPattern.exec(html)) !== null) {
    const itemHtml = match[1];
    
    // Extract name
    const nameMatch = itemHtml.match(/<strong>([^<]+)<\/strong>/i);
    if (!nameMatch) continue;
    
    const name = nameMatch[1].trim();
    const nameLower = name.toLowerCase();
    
    // Skip if we already have this firm
    if (processedNames.has(nameLower)) continue;
    
    // Extract description
    let description = null;
    const descMatch = itemHtml.match(/<p>([\s\S]*?)<\/p>/i);
    if (descMatch && descMatch[1]) {
      description = descMatch[1]
        .replace(/<[^>]+>/g, '')
        .trim();
      if (description.length === 0) description = null;
    }
    
    firms.push({ name, description: description || null });
    processedNames.add(nameLower);
  }
  
  // Pattern 3: Look for any strong tags that might be firm names
  // (as a fallback for firms not caught by above patterns)
  const strongPattern = /<strong>([^<]{3,80})<\/strong>/gi;
  const allNames = new Set(firms.map(f => f.name.toLowerCase()));
  
  while ((match = strongPattern.exec(html)) !== null) {
    const potentialName = match[1].trim();
    const nameLower = potentialName.toLowerCase();
    
    // Skip if already processed or if it's clearly not a firm name
    if (allNames.has(nameLower)) continue;
    if (potentialName.includes('Member') || potentialName.includes('Firm')) continue;
    if (potentialName.length < 3 || potentialName.length > 80) continue;
    
    // Check if it's in a member-related context
    const contextStart = Math.max(0, match.index - 200);
    const contextEnd = Math.min(html.length, match.index + 500);
    const context = html.substring(contextStart, contextEnd);
    
    if (context.includes('member') || context.includes('firm') || 
        context.includes('specialization') || context.includes('expert')) {
      firms.push({ name: potentialName, description: null });
      allNames.add(nameLower);
    }
  }
  
  return firms;
}

// Read the HTML file
const html = fs.readFileSync('raw-page.html', 'utf-8');
console.log(`HTML file read, length: ${html.length} characters\n`);

// Extract all firms
const firms = extractAllFirms(html);

console.log(`Total firms extracted: ${firms.length}\n`);

// Display first 30 firms
console.log('First 30 firms:');
firms.slice(0, 30).forEach((firm, i) => {
  const desc = firm.description ? `✓ (${firm.description.substring(0, 50)}...)` : '✗ null';
  console.log(`${i + 1}. ${firm.name} - ${desc}`);
});

if (firms.length < 92) {
  console.log(`\n⚠️  Warning: Only found ${firms.length} firms, expected 92`);
  console.log('The page might require JavaScript execution to load all content.');
} else if (firms.length > 92) {
  console.log(`\n⚠️  Note: Found ${firms.length} firms (more than expected 92)`);
} else {
  console.log(`\n✅ Successfully extracted all ${firms.length} firms!`);
}

// Save to JSON
const output = firms.map(f => ({
  name: f.name,
  specialization: null, // Will need to extract this separately
  description: f.description,
  address: {
    street: null,
    poBox: null,
    city: null,
    country: null,
    postalCode: null
  },
  phone: null,
  email: null,
  website: null
}));

fs.writeFileSync('all-firms-extracted.json', JSON.stringify(output, null, 2));
console.log('\n✅ Saved to all-firms-extracted.json');

