/**
 * Helper to dynamically parse the kids pricing rate based on package name.
 * Supports single prices (e.g. "£15" or "20") as well as package-mapped prices
 * (e.g. "Bronze: £10, Silver: £12, Gold: £14, Platinum: £16, Diamond: £18").
 */
export function parseKidsPriceForPackage(priceStr?: string, packageName?: string): number {
  if (!priceStr || typeof priceStr !== 'string') return 15;
  const cleanStr = priceStr.trim();
  if (!cleanStr) return 15;

  if (packageName) {
    const pName = packageName.toLowerCase().trim();
    // Extract candidate keywords (e.g. "silver" from "Silver Package")
    const words = pName.replace(/package|menu/gi, '').trim().split(/\s+/).filter(Boolean);
    const candidateTerms = [pName, ...words].filter(t => t.length >= 3);

    for (const term of candidateTerms) {
      const regex = new RegExp(`(?:^|[,;/|\\s])(?:${term})\\s*[:=\\-]?\\s*£?\\s*(\\d+(?:\\.\\d+)?)`, 'i');
      const m = cleanStr.match(regex);
      if (m && m[1]) {
        const val = parseFloat(m[1]);
        if (!isNaN(val) && val > 0 && val <= 500) {
          return val;
        }
      }
    }
  }

  // Fallback: extract the first valid number from the string
  const allMatches = Array.from(cleanStr.matchAll(/£?\\s*(\\d+(?:\\.\\d+)?)/g));
  if (allMatches.length > 0) {
    const firstNum = parseFloat(allMatches[0][1]);
    if (!isNaN(firstNum) && firstNum > 0 && firstNum <= 500) {
      return firstNum;
    }
  }

  return 15;
}

/**
 * Given a list of kids pricing rows (from Firestore / Settings),
 * find the 3-10 / 4-10 yr row and parse the price for the specific package.
 */
export function getKidsPriceFromList(
  kidsPricingList?: { ageRange: string; price: string }[],
  packageName?: string,
  packageKidsPrice?: number
): number {
  if (typeof packageKidsPrice === 'number' && packageKidsPrice > 0) {
    return packageKidsPrice;
  }
  if (!kidsPricingList || kidsPricingList.length === 0) return 15;
  const match = kidsPricingList.find(k => {
    const lower = k.ageRange.toLowerCase();
    const isFree = lower.includes('free') || k.price.toLowerCase().includes('free') || lower.includes('under') || lower.includes('0-2') || lower.includes('0-4') || lower.includes('0 to 4');
    return !isFree && (lower.includes('3-10') || lower.includes('4-10') || lower.includes('kids') || lower.includes('child'));
  }) || kidsPricingList.find(k => {
    const lower = k.ageRange.toLowerCase();
    return !lower.includes('under') && !lower.includes('0-2') && !lower.includes('0-4') && !k.price.toLowerCase().includes('free');
  });

  if (match) {
    return parseKidsPriceForPackage(match.price, packageName);
  }
  return 15;
}
