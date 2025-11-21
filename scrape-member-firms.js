// Script to scrape all member firms from bvifinance.vg/Find-An-Expert
// This script will attempt to extract all 92 firms

import https from 'https';
import fs from 'fs';

async function fetchPage(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve(data);
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

function extractFirms(html) {
  const firms = [];
  
  // Try to find all firm cards/entries
  // Pattern: Look for firm names, descriptions, and contact info
  
  // Extract firm names (look for strong tags or specific class patterns)
  const namePattern = /<strong[^>]*>([^<]+)<\/strong>/gi;
  const specializationPattern = /(Accountancy|Arbitration|Audit|Banking|Brokers|Business|Captive Insurance|Compliance|Corporate|Director|Family Office|Financial Planning|FinTech|Forensic|Fund|Hedge Fund|ICT|Independent Financial|Industry Body|Insolvency|Insurance|Investment|Law|Marine|Private Client|Professional|Real Estate|Recovery|Taxation|Trust|Vessel)/gi;
  
  // Split HTML into sections that might contain firm data
  const sections = html.split(/Reveal\s*more/i);
  
  console.log(`Found ${sections.length} potential sections`);
  
  // Try a different approach - look for structured data
  // The page might have JSON-LD or structured data
  const jsonLdPattern = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = jsonLdPattern.exec(html)) !== null) {
    try {
      const jsonData = JSON.parse(match[1]);
      console.log('Found JSON-LD data:', Object.keys(jsonData));
    } catch (e) {
      // Not valid JSON
    }
  }
  
  // Look for firm entries in the HTML structure
  // Pattern might be: card, member-firm, or similar class names
  const cardPattern = /<div[^>]*class=["'][^"']*(?:card|member|firm)[^"']*["'][^>]*>([\s\S]*?)<\/div>/gi;
  
  let cardMatch;
  let cardCount = 0;
  while ((cardMatch = cardPattern.exec(html)) !== null && cardCount < 100) {
    cardCount++;
    const cardHtml = cardMatch[1];
    
    // Extract name
    const nameMatch = cardHtml.match(/<strong[^>]*>([^<]+)<\/strong>/i) || 
                     cardHtml.match(/<h[1-6][^>]*>([^<]+)<\/h[1-6]>/i);
    
    if (nameMatch) {
      const name = nameMatch[1].trim();
      
      // Skip if it's not a firm name (might be navigation, etc.)
      if (name.length > 2 && name.length < 100) {
        firms.push({
          name: name,
          rawHtml: cardHtml.substring(0, 500) // Store first 500 chars for analysis
        });
      }
    }
  }
  
  console.log(`Extracted ${firms.length} potential firms from cards`);
  
  // Also try to extract from the visible text content
  // Remove script and style tags
  const cleanHtml = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
                        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
  
  // Look for patterns like "**Firm Name**" or similar
  const boldPattern = /\*\*([^*]+)\*\*/g;
  let boldMatch;
  while ((boldMatch = boldPattern.exec(cleanHtml)) !== null) {
    const potentialName = boldMatch[1].trim();
    if (potentialName.length > 3 && potentialName.length < 80) {
      // Check if we already have this firm
      if (!firms.find(f => f.name === potentialName)) {
        firms.push({
          name: potentialName,
          source: 'bold_text'
        });
      }
    }
  }
  
  return firms;
}

async function main() {
  try {
    console.log('Fetching page...');
    const html = await fetchPage('https://bvifinance.vg/Find-An-Expert');
    
    console.log(`Page fetched, length: ${html.length} characters`);
    
    // Save raw HTML for analysis
    fs.writeFileSync('raw-page.html', html);
    console.log('Raw HTML saved to raw-page.html');
    
    const firms = extractFirms(html);
    
    console.log(`\nExtracted ${firms.length} firms:`);
    firms.slice(0, 20).forEach((firm, i) => {
      console.log(`${i + 1}. ${firm.name}`);
    });
    
    if (firms.length < 92) {
      console.log(`\n⚠️  Warning: Only found ${firms.length} firms, expected 92`);
      console.log('The page might use JavaScript to load content dynamically.');
      console.log('You may need to use a headless browser like Puppeteer or Playwright.');
    }
    
    // Save extracted firms
    fs.writeFileSync('extracted-firms-preview.json', JSON.stringify(firms, null, 2));
    console.log('\nExtracted firms saved to extracted-firms-preview.json');
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

main();

