// Final complete extraction script with proper contact info parsing
import fs from 'fs';

function extractFinalFirms(html) {
  const firms = [];
  
  // Split by member-grid sections (each contains one firm)
  const memberGridPattern = /<div class="member-grid[^"]*">([\s\S]*?)(?=<div class="member-grid|<div id="content-builder|$)/gi;
  let match;
  
  while ((match = memberGridPattern.exec(html)) !== null) {
    const gridHtml = match[1];
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
    
    // Extract name from member-item section
    const nameMatch = gridHtml.match(/<div class="member-info"><strong>([^<]+)<\/strong>/i);
    if (nameMatch) {
      firm.name = nameMatch[1].trim();
    }
    
    // Extract specialization
    const specMatch = gridHtml.match(/<span class="member-service">([^<]+)<\/span>/i);
    if (specMatch) {
      firm.specialization = specMatch[1].trim();
    }
    
    // Extract description (from member-info section)
    const memberInfoMatch = gridHtml.match(/<div class="member-info">([\s\S]*?)<\/div>/i);
    if (memberInfoMatch) {
      const infoHtml = memberInfoMatch[1];
      // Remove the strong tag (name) first
      const withoutName = infoHtml.replace(/<strong>[\s\S]*?<\/strong>/i, '').trim();
      if (withoutName.length > 0) {
        // Extract all paragraph content
        const descMatches = withoutName.match(/<p>([\s\S]*?)<\/p>/gi);
        if (descMatches) {
          firm.description = descMatches
            .map(m => m.replace(/<\/?p>/gi, '').replace(/<[^>]+>/g, ' ').trim())
            .filter(t => t.length > 0)
            .join(' ')
            .replace(/\s+/g, ' ')
            .trim();
          if (firm.description.length === 0) firm.description = null;
        } else {
          // If no <p> tags, try to get text content directly
          const textContent = withoutName.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
          if (textContent.length > 20) { // Only if substantial content
            firm.description = textContent;
          }
        }
      }
    }
    
    // Also check member-details section for description (expanded view)
    const detailsMatch = gridHtml.match(/<div class="member-details">([\s\S]*?)<\/div>\s*<\/div>/i);
    if (detailsMatch && !firm.description) {
      const detailsHtml = detailsMatch[1];
      const memberCopyMatch = detailsHtml.match(/<div class="member-copy">([\s\S]*?)<\/div>/i);
      if (memberCopyMatch) {
        const copyHtml = memberCopyMatch[1];
        const descMatches = copyHtml.match(/<p>([\s\S]*?)<\/p>/gi);
        if (descMatches) {
          firm.description = descMatches
            .map(m => m.replace(/<\/?p>/gi, '').replace(/<[^>]+>/g, ' ').trim())
            .filter(t => t.length > 0)
            .join(' ')
            .replace(/\s+/g, ' ')
            .trim();
          if (firm.description.length === 0) firm.description = null;
        }
      }
    }
    
    // Extract contact info from member-details section (reuse if already found)
    if (!detailsMatch) {
      detailsMatch = gridHtml.match(/<div class="member-details">([\s\S]*?)<\/div>\s*<\/div>/i);
    }
    if (detailsMatch) {
      const detailsHtml = detailsMatch[1];
      
      // Extract phone (from ctc with member-phone icon)
      const phoneMatch = detailsHtml.match(/<span class="ctc">[\s\S]*?<i class="member-phone"><\/i>\s*([^<]+)<\/span>/i);
      if (phoneMatch) {
        firm.phone = phoneMatch[1].trim();
      }
      
      // Extract email (from ctc with member-envelope icon)
      const emailMatch = detailsHtml.match(/<span class="ctc">[\s\S]*?<i class="member-envelope"><\/i>\s*([^<]+)<\/span>/i);
      if (emailMatch) {
        firm.email = emailMatch[1].trim();
      }
      
      // Extract website (from <a class="web">)
      const webMatch = detailsHtml.match(/<a[^>]*class="web"[^>]*>([^<]+)<\/a>/i);
      if (webMatch) {
        firm.website = webMatch[1].trim();
      }
      
      // Extract address from <div class="address">
      const addressMatch = detailsHtml.match(/<div class="address">([\s\S]*?)<\/div>/i);
      if (addressMatch) {
        const addressHtml = addressMatch[1];
        const addressText = addressHtml
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
        
        // Parse address components
        const lines = addressText.split(/\n|<br\s*\/?>/i).map(l => l.trim()).filter(l => l.length > 0);
        
        for (const line of lines) {
          // P.O. Box
          if (line.match(/P\.?O\.?\s*Box\s*\d+/i)) {
            firm.address.poBox = line;
          }
          // Postal code
          else if (line.match(/VG\d{4}/i)) {
            firm.address.postalCode = line.match(/VG\d{4}/i)[0];
          }
          // City
          else if (line.match(/Road\s+Town|Tortola/i)) {
            firm.address.city = line;
          }
          // Country
          else if (line.match(/British\s+Virgin\s+Islands/i)) {
            firm.address.country = 'British Virgin Islands';
          }
          // Street (if it contains common street indicators)
          else if (line.match(/\d+|Street|St|Avenue|Ave|Road|Rd|Centre|Center|Building|Bldg|Tower|Floor/i) && 
                   !line.match(/P\.?O\.?\s*Box/i)) {
            if (!firm.address.street) {
              firm.address.street = line;
            }
          }
        }
      }
    }
    
    // Only add if we have at least a name
    if (firm.name) {
      firms.push(firm);
    }
  }
  
  return firms;
}

// Read HTML
const html = fs.readFileSync('raw-page.html', 'utf-8');
console.log(`Extracting firms from HTML (${html.length} chars)...\n`);

// Extract all firms
const firms = extractFinalFirms(html);

console.log(`Total firms extracted: ${firms.length}\n`);

// Statistics
const withDescription = firms.filter(f => f.description).length;
const withEmail = firms.filter(f => f.email).length;
const withPhone = firms.filter(f => f.phone).length;
const withWebsite = firms.filter(f => f.website).length;
const withAddress = firms.filter(f => 
  f.address.city || f.address.poBox || f.address.street
).length;
const withSpecialization = firms.filter(f => f.specialization).length;

console.log('Statistics:');
console.log(`- With description: ${withDescription} (${Math.round(withDescription/firms.length*100)}%)`);
console.log(`- With email: ${withEmail} (${Math.round(withEmail/firms.length*100)}%)`);
console.log(`- With phone: ${withPhone} (${Math.round(withPhone/firms.length*100)}%)`);
console.log(`- With website: ${withWebsite} (${Math.round(withWebsite/firms.length*100)}%)`);
console.log(`- With address: ${withAddress} (${Math.round(withAddress/firms.length*100)}%)`);
console.log(`- With specialization: ${withSpecialization} (${Math.round(withSpecialization/firms.length*100)}%)\n`);

// Show sample
console.log('Sample firms (first 3):');
firms.slice(0, 3).forEach((f, i) => {
  console.log(`\n${i + 1}. ${f.name}`);
  console.log(`   Specialization: ${f.specialization || 'null'}`);
  console.log(`   Description: ${f.description ? '✓' : '✗ null'}`);
  console.log(`   Email: ${f.email || 'null'}`);
  console.log(`   Phone: ${f.phone || 'null'}`);
  console.log(`   Website: ${f.website || 'null'}`);
  console.log(`   Address: ${f.address.city || f.address.poBox || 'null'}`);
});

// Save to JSON
fs.writeFileSync('member-firms-data.json', JSON.stringify(firms, null, 2));
console.log(`\n✅ Saved ${firms.length} firms to member-firms-data.json`);

// Create analysis
const complete = firms.filter(f => 
  f.description && f.email && f.phone && f.website
).length;

const partial = firms.filter(f => 
  f.description && (f.email || f.phone || f.website)
).length - complete;

const incomplete = firms.length - partial - complete;

console.log(`\nCompleteness Analysis:`);
console.log(`- Complete (desc + email + phone + website): ${complete}`);
console.log(`- Partial (desc + some contact): ${partial}`);
console.log(`- Incomplete: ${incomplete}`);

