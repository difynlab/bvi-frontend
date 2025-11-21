// Complete extraction script for all member firms with full details
import fs from 'fs';

function extractCompleteFirms(html) {
  const firms = [];
  
  // Split HTML into member-item sections
  const memberItemPattern = /<div[^>]*class="[^"]*member-item[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>/gi;
  let match;
  
  while ((match = memberItemPattern.exec(html)) !== null) {
    const itemHtml = match[1];
    const firm = {
      name: null,
      specialization: null,
      description: null,
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
    };
    
    // Extract name
    const nameMatch = itemHtml.match(/<strong>([^<]+)<\/strong>/i);
    if (nameMatch) {
      firm.name = nameMatch[1].trim();
    }
    
    // Extract specialization (member-service)
    const specMatch = itemHtml.match(/<span class="member-service">([^<]+)<\/span>/i);
    if (specMatch) {
      firm.specialization = specMatch[1].trim();
    }
    
    // Extract description
    const descMatch = itemHtml.match(/<p>([\s\S]*?)<\/p>/i);
    if (descMatch && descMatch[1]) {
      firm.description = descMatch[1]
        .replace(/<[^>]+>/g, '')
        .trim();
      if (firm.description.length === 0) firm.description = null;
    }
    
    // Extract email
    const emailMatch = itemHtml.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/i);
    if (emailMatch) {
      firm.email = emailMatch[1].trim();
    }
    
    // Extract phone (look for phone patterns)
    const phonePatterns = [
      /\+?\s*1?\s*\(?\s*284\s*\)?\s*[\d\s-]+/gi,
      /\+?\s*1?\s*\(?\s*\d{3}\s*\)?\s*[\d\s-]+/gi,
      /tel[:\s]+([\d\s+()-]+)/gi,
      /phone[:\s]+([\d\s+()-]+)/gi
    ];
    
    for (const pattern of phonePatterns) {
      const phoneMatch = itemHtml.match(pattern);
      if (phoneMatch) {
        firm.phone = phoneMatch[0].replace(/tel[:\s]+|phone[:\s]+/gi, '').trim();
        break;
      }
    }
    
    // Extract website
    const websitePatterns = [
      /www\.([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi,
      /https?:\/\/([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi
    ];
    
    for (const pattern of websitePatterns) {
      const webMatch = itemHtml.match(pattern);
      if (webMatch) {
        firm.website = webMatch[0].trim();
        if (!firm.website.startsWith('http')) {
          firm.website = 'www.' + firm.website.replace(/^www\./, '');
        }
        break;
      }
    }
    
    // Extract address components
    // Look for P.O. Box
    const poBoxMatch = itemHtml.match(/P\.?O\.?\s*Box\s*(\d+)/i);
    if (poBoxMatch) {
      firm.address.poBox = `P.O. Box ${poBoxMatch[1]}`;
    }
    
    // Look for city (Road Town, Tortola is common)
    const cityMatch = itemHtml.match(/(Road\s+Town[^,<]*|Tortola[^,<]*)/i);
    if (cityMatch) {
      firm.address.city = cityMatch[1].trim();
    }
    
    // Look for postal code (VG1110 pattern)
    const postalMatch = itemHtml.match(/(VG\d{4})/i);
    if (postalMatch) {
      firm.address.postalCode = postalMatch[1].trim();
    }
    
    // Look for country
    if (itemHtml.match(/British\s+Virgin\s+Islands/i)) {
      firm.address.country = 'British Virgin Islands';
    }
    
    // Look for street address
    const streetPatterns = [
      /(\d+[a-z]?\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+(?:Street|St|Avenue|Ave|Road|Rd|Centre|Center|Building|Bldg))/i,
      /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+(?:Centre|Center|Building|Bldg|Tower|Plaza))/i
    ];
    
    for (const pattern of streetPatterns) {
      const streetMatch = itemHtml.match(pattern);
      if (streetMatch && !streetMatch[1].includes('P.O.')) {
        firm.address.street = streetMatch[1].trim();
        break;
      }
    }
    
    // Only add if we have at least a name
    if (firm.name) {
      firms.push(firm);
    }
  }
  
  // If we didn't get enough firms, try alternative pattern
  if (firms.length < 50) {
    // Alternative: look for member-info divs
    const memberInfoPattern = /<div class="member-info">([\s\S]*?)<\/div>/gi;
    const processedNames = new Set(firms.map(f => f.name?.toLowerCase()));
    
    while ((match = memberInfoPattern.exec(html)) !== null) {
      const infoHtml = match[1];
      const nameMatch = infoHtml.match(/<strong>([^<]+)<\/strong>/i);
      if (!nameMatch) continue;
      
      const name = nameMatch[1].trim();
      if (processedNames.has(name.toLowerCase())) continue;
      
      const firm = {
        name: name,
        specialization: null,
        description: null,
        address: { street: null, poBox: null, city: null, country: null, postalCode: null },
        phone: null,
        email: null,
        website: null
      };
      
      // Extract description
      const descMatch = infoHtml.match(/<p>([\s\S]*?)<\/p>/i);
      if (descMatch && descMatch[1]) {
        firm.description = descMatch[1].replace(/<[^>]+>/g, '').trim();
        if (firm.description.length === 0) firm.description = null;
      }
      
      firms.push(firm);
      processedNames.add(name.toLowerCase());
    }
  }
  
  return firms;
}

// Read HTML
const html = fs.readFileSync('raw-page.html', 'utf-8');
console.log(`Extracting firms from HTML (${html.length} chars)...\n`);

// Extract all firms
const firms = extractCompleteFirms(html);

console.log(`Total firms extracted: ${firms.length}\n`);

// Count firms with complete data
const withDescription = firms.filter(f => f.description).length;
const withContact = firms.filter(f => f.email || f.phone || f.website).length;
const withAddress = firms.filter(f => 
  f.address.city || f.address.poBox || f.address.street
).length;
const withSpecialization = firms.filter(f => f.specialization).length;

console.log('Statistics:');
console.log(`- With description: ${withDescription} (${Math.round(withDescription/firms.length*100)}%)`);
console.log(`- With contact info: ${withContact} (${Math.round(withContact/firms.length*100)}%)`);
console.log(`- With address: ${withAddress} (${Math.round(withAddress/firms.length*100)}%)`);
console.log(`- With specialization: ${withSpecialization} (${Math.round(withSpecialization/firms.length*100)}%)\n`);

// Show sample
console.log('Sample firms (first 5):');
firms.slice(0, 5).forEach((f, i) => {
  console.log(`\n${i + 1}. ${f.name}`);
  console.log(`   Specialization: ${f.specialization || 'null'}`);
  console.log(`   Description: ${f.description ? '✓' : '✗ null'}`);
  console.log(`   Email: ${f.email || 'null'}`);
  console.log(`   Phone: ${f.phone || 'null'}`);
  console.log(`   Website: ${f.website || 'null'}`);
});

// Save to JSON
fs.writeFileSync('member-firms-data.json', JSON.stringify(firms, null, 2));
console.log(`\n✅ Saved ${firms.length} firms to member-firms-data.json`);

