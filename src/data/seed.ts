import type { Campaign, Merchant, Customer, TimeDim, StoreLocation, Impression, Click, Order, AdGroup, Creative, Experiment, ExperimentResult } from './schema';

const CATEGORIES = ['Pizza', 'Burgers', 'Mexican', 'Chinese', 'Thai', 'Japanese', 'Indian', 'Italian', 'Mediterranean', 'American', 'Korean', 'Vietnamese', 'Greek', 'French', 'Middle Eastern'];
const CITIES = ['San Francisco', 'Los Angeles', 'Seattle', 'Portland', 'Denver', 'Austin', 'Chicago', 'New York', 'Boston', 'Miami', 'Atlanta', 'Dallas', 'Phoenix', 'San Diego', 'Las Vegas'];
const STATES: Record<string, string> = {
  'San Francisco': 'CA', 'Los Angeles': 'CA', 'Seattle': 'WA', 'Portland': 'OR', 'Denver': 'CO',
  'Austin': 'TX', 'Chicago': 'IL', 'New York': 'NY', 'Boston': 'MA', 'Miami': 'FL',
  'Atlanta': 'GA', 'Dallas': 'TX', 'Phoenix': 'AZ', 'San Diego': 'CA', 'Las Vegas': 'NV'
};
const REGIONS: Record<string, 'WEST' | 'MIDWEST' | 'SOUTH' | 'NORTHEAST'> = {
  'San Francisco': 'WEST', 'Los Angeles': 'WEST', 'Seattle': 'WEST', 'Portland': 'WEST', 'Denver': 'WEST', 'San Diego': 'WEST', 'Las Vegas': 'WEST',
  'Chicago': 'MIDWEST', 'Dallas': 'MIDWEST', 'Phoenix': 'WEST',
  'Miami': 'SOUTH', 'Atlanta': 'SOUTH',
  'New York': 'NORTHEAST', 'Boston': 'NORTHEAST'
};
const KEYWORDS = ['pizza near me', 'best burgers', 'cheap delivery', 'fast food', 'healthy options', 'late night', 'breakfast', 'vegan', 'gluten free', 'family meals', 'quick lunch', 'date night', 'game day', 'weekend deals'];
const HEADLINES = [
  'Free Delivery on Your First Order', '50% Off Your First Week', 'Fresh Food Delivered Fast',
  'Order Now & Save 20%', 'Try Our New Menu Items', 'Exclusive Deals Inside',
  'Starting at $9.99', 'Best Rated Near You', 'Lightning Fast Delivery'
];

class SeededRandom {
  private seed: number;
  constructor(seed: number) {
    this.seed = seed;
  }
  next(): number {
    this.seed = (this.seed * 1103515245 + 12345) & 0x7fffffff;
    return this.seed / 0x7fffffff;
  }
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }
  nextFloat(min: number, max: number): number {
    return this.next() * (max - min) + min;
  }
  pick<T>(arr: T[]): T {
    return arr[this.nextInt(0, arr.length - 1)];
  }
  uuid(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = this.nextInt(0, 15);
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
  date(start: Date, days: number): string {
    const d = new Date(start);
    d.setDate(d.getDate() + this.nextInt(0, days));
    return d.toISOString().split('T')[0];
  }
}

const rng = new SeededRandom(42);

export function generateMerchants(count: number): Merchant[] {
  const merchants: Merchant[] = [];
  const usedNames = new Set<string>();
  
  for (let i = 0; i < count; i++) {
    let name: string;
    do {
      name = `${rng.pick(['Golden', 'Royal', 'Fresh', 'Tasty', 'Spicy', 'Urban', 'Classic', 'Modern', 'Authentic', 'Premium'])} ${rng.pick(['Bites', 'Eats', 'Grill', 'Kitchen', 'Cafe', 'Diner', 'Palace', 'Spot'])}`;
    } while (usedNames.has(name));
    usedNames.add(name);
    
    merchants.push({
      merchant_id: `MERCH_${String(i + 1).padStart(4, '0')}`,
      name,
      category: rng.pick(CATEGORIES),
      city: rng.pick(CITIES),
      state: STATES[rng.pick(CITIES)],
      tier: rng.pick(['BRONZE', 'BRONZE', 'SILVER', 'SILVER', 'GOLD', 'DIAMOND'] as const),
      avg_rating: rng.nextFloat(3.5, 4.9),
      is_premium: rng.next() > 0.7,
      created_date: rng.date(new Date('2022-01-01'), 1000)
    });
  }
  return merchants;
}

export function generateCampaigns(merchants: Merchant[]): Campaign[] {
  const campaigns: Campaign[] = [];
  const campaignTypes: Array<'SPONSORED_PRODUCTS' | 'SPONSORED_BRANDS'> = ['SPONSORED_PRODUCTS', 'SPONSORED_BRANDS'];
  const targetingTypes: Array<'AUTOMATIC' | 'MANUAL' | 'KEYWORD' | 'BEHAVIORAL'> = ['AUTOMATIC', 'MANUAL', 'KEYWORD', 'BEHAVIORAL'];
  
  for (let i = 0; i < 25; i++) {
    const startDate = rng.date(new Date('2025-01-01'), 365);
    campaigns.push({
      campaign_id: `CAMP_${String(i + 1).padStart(4, '0')}`,
      name: `${rng.pick(['Summer', 'Winter', 'Spring', 'Fall', 'Holiday', 'Weekend', 'Flash', 'Premium', 'Local', 'National'])} ${rng.pick(['Promo', 'Sale', 'Deal', 'Blitz', 'Boost', 'Drive'])} ${rng.pick(['Q1', 'Q2', 'Q3', 'Q4', '2025', '2026'])}`,
      type: rng.pick(campaignTypes),
      status: rng.pick(['ACTIVE', 'ACTIVE', 'ACTIVE', 'ACTIVE', 'PAUSED', 'ENDED'] as const),
      budget_daily: rng.nextInt(50, 500),
      budget_lifetime: rng.nextInt(1000, 20000),
      start_date: startDate,
      end_date: rng.next() > 0.3 ? rng.date(new Date(startDate), 180) : '2026-12-31',
      targeting_type: rng.pick(targetingTypes),
      merchant_id: rng.pick(merchants).merchant_id
    });
  }
  return campaigns;
}

export function generateCustomers(count: number): Customer[] {
  const customers: Customer[] = [];
  const segments: Array<'NEW_USER' | 'LAPSED' | 'REGULAR' | 'VIP'> = ['NEW_USER', 'LAPSED', 'REGULAR', 'VIP'];
  const signupSources: Array<'ORGANIC' | 'PAID_ADS' | 'REFERRAL' | 'EMAIL'> = ['ORGANIC', 'PAID_ADS', 'REFERRAL', 'EMAIL'];
  
  for (let i = 0; i < count; i++) {
    const isNew = rng.next() < 0.3;
    const segment = isNew ? 'NEW_USER' : rng.pick(segments.filter(s => s !== 'NEW_USER'));
    const ltv = segment === 'VIP' ? rng.nextInt(500, 2000) :
                segment === 'REGULAR' ? rng.nextInt(100, 500) :
                segment === 'LAPSED' ? rng.nextInt(50, 200) : rng.nextInt(20, 100);
    
    customers.push({
      customer_id: `CUST_${String(i + 1).padStart(6, '0')}`,
      is_new: isNew,
      first_order_date: rng.date(new Date('2024-01-01'), 450),
      segment,
      lifetime_value: ltv,
      ltv_tier: ltv > 500 ? 'PREMIUM' : ltv > 200 ? 'HIGH' : ltv > 100 ? 'MEDIUM' : 'LOW',
      signup_source: rng.pick(signupSources)
    });
  }
  return customers;
}

export function generateTimeDim(): TimeDim[] {
  const days: TimeDim[] = [];
  
  for (let d = 0; d < 365; d++) {
    const date = new Date('2025-01-01');
    date.setDate(date.getDate() + d);
    const dayOfWeek = date.getDay();
    const hour = 11 + Math.floor(rng.next() * 12);
    const daypart = hour < 10 ? 'BREAKFAST' :
                    hour < 14 ? 'LUNCH' :
                    hour < 17 ? 'AFTERNOON' :
                    hour < 21 ? 'DINNER' : 'LATE_NIGHT';
    
    days.push({
      date: date.toISOString().split('T')[0],
      day_of_week: ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'][dayOfWeek],
      hour,
      daypart,
      is_weekend: dayOfWeek === 0 || dayOfWeek === 6,
      month: date.getMonth() + 1,
      quarter: Math.ceil((date.getMonth() + 1) / 3),
      year: date.getFullYear()
    });
  }
  return days;
}

export function generateStoreLocations(merchants: Merchant[]): StoreLocation[] {
  const locations: StoreLocation[] = [];
  
  merchants.forEach(merchant => {
    const numLocations = rng.nextInt(1, 5);
    for (let i = 0; i < numLocations; i++) {
      const lat = 25 + rng.nextFloat(0, 20);
      const lng = -122 + rng.nextFloat(0, 50);
      locations.push({
        location_id: `LOC_${merchant.merchant_id.split('_')[1]}_${i + 1}`,
        merchant_id: merchant.merchant_id,
        city: merchant.city,
        state: merchant.state,
        region: REGIONS[merchant.city] || 'MIDWEST',
        is_test_market: rng.next() < 0.15,
        lat,
        lng
      });
    }
  });
  return locations;
}

export function generateAdGroups(campaigns: Campaign[]): AdGroup[] {
  const adGroups: AdGroup[] = [];
  
  campaigns.forEach(campaign => {
    const numAdGroups = rng.nextInt(2, 5);
    for (let i = 0; i < numAdGroups; i++) {
      adGroups.push({
        ad_group_id: `AG_${campaign.campaign_id.split('_')[1]}_${i + 1}`,
        campaign_id: campaign.campaign_id,
        name: `${campaign.name} - ${rng.pick(['Search', 'Browse', 'Retarget', 'Keywords'])}`,
        bid_type: rng.pick(['AUTOMATIC', 'MANUAL', 'AUTOMATED'] as const),
        bid_amount: rng.nextInt(50, 500),
        targeting_criteria: rng.pick(['Demographics', 'Behavior', 'Location', 'Interests']),
        status: campaign.status === 'ENDED' ? 'ENDED' : rng.pick(['ACTIVE', 'ACTIVE', 'PAUSED'] as const)
      });
    }
  });
  return adGroups;
}

export function generateCreatives(campaigns: Campaign[]): Creative[] {
  const creatives: Creative[] = [];
  
  campaigns.forEach(campaign => {
    const numCreatives = rng.nextInt(1, 3);
    for (let i = 0; i < numCreatives; i++) {
      creatives.push({
        creative_id: `CREA_${campaign.campaign_id.split('_')[1]}_${i + 1}`,
        campaign_id: campaign.campaign_id,
        name: `Creative ${i + 1} - ${campaign.name}`,
        type: rng.pick(['IMAGE', 'VIDEO', 'CAROUSEL'] as const),
        headline: rng.pick(HEADLINES),
        image_url: `https://picsum.photos/seed/${campaign.campaign_id}_${i}/400/300`,
        ctr_benchmark: rng.nextFloat(1.5, 4.5)
      });
    }
  });
  return creatives;
}

export function generateExperiments(_merchants: Merchant[]): { experiments: Experiment[]; results: ExperimentResult[] } {
  const experiments: Experiment[] = [];
  const results: ExperimentResult[] = [];
  
  const experimentTypes: Array<'CREATIVE' | 'BIDDING' | 'TARGETING' | 'GEO'> = ['CREATIVE', 'BIDDING', 'TARGETING', 'GEO'];
  const metricTypes: Array<'CVR' | 'ROAS' | 'CTR' | 'CPA'> = ['CVR', 'ROAS', 'CTR', 'CPA'];
  const statuses: Array<'RUNNING' | 'COMPLETED' | 'PAUSED'> = ['RUNNING', 'COMPLETED', 'COMPLETED', 'COMPLETED', 'PAUSED'];
  
  for (let i = 0; i < 15; i++) {
    const startDate = rng.date(new Date('2025-06-01'), 200);
    const expId = `EXP_${String(i + 1).padStart(3, '0')}`;
    const isSignificant = rng.next() > 0.4;
    const pValue = isSignificant ? rng.nextFloat(0.001, 0.04) : rng.nextFloat(0.05, 0.3);
    
    experiments.push({
      exp_id: expId,
      name: `${rng.pick(['CTA', 'Banner', 'Bid', 'Target', 'Geo', 'Audience'])} ${rng.pick(['Test', 'Experiment', 'Trial'])} ${i + 1}`,
      type: rng.pick(experimentTypes),
      start_date: startDate,
      end_date: rng.date(new Date(startDate), 30),
      control_group: 'Control',
      treatment_group: 'Variant A',
      metric_type: rng.pick(metricTypes),
      status: rng.pick(statuses),
      p_value: parseFloat(pValue.toFixed(4))
    });
    
    const controlLift = rng.nextFloat(-5, 5);
    const treatmentLift = controlLift + rng.nextFloat(5, 25);
    
    results.push({
      result_id: `RES_${expId}_CONTROL`,
      exp_id: expId,
      variant: 'CONTROL',
      sample_size: rng.nextInt(1000, 10000),
      conversion_rate: rng.nextFloat(2.0, 5.0),
      revenue: rng.nextInt(5000, 50000),
      orders: rng.nextInt(100, 1000),
      lift_pct: 0
    });
    
    results.push({
      result_id: `RES_${expId}_TREATMENT`,
      exp_id: expId,
      variant: 'TREATMENT',
      sample_size: rng.nextInt(1000, 10000),
      conversion_rate: rng.nextFloat(2.5, 6.0),
      revenue: rng.nextInt(6000, 60000),
      orders: rng.nextInt(120, 1200),
      lift_pct: parseFloat(treatmentLift.toFixed(2))
    });
  }
  
  return { experiments, results };
}

export function generateImpressions(campaigns: Campaign[], merchants: Merchant[], locations: StoreLocation[], creatives: Creative[], count: number): Impression[] {
  const impressions: Impression[] = [];
  const placements: Array<'SEARCH' | 'CATEGORIES' | 'COLLECTION' | 'DOUBLEDASH'> = ['SEARCH', 'CATEGORIES', 'COLLECTION', 'DOUBLEDASH'];
  const devices: Array<'MOBILE' | 'DESKTOP' | 'TABLET'> = ['MOBILE', 'DESKTOP', 'TABLET'];
  const segments: Array<'NEW_USER' | 'LAPSED' | 'REGULAR' | 'VIP'> = ['NEW_USER', 'LAPSED', 'REGULAR', 'VIP'];
  const activeCampaigns = campaigns.filter(c => c.status === 'ACTIVE');
  
  for (let i = 0; i < count; i++) {
    const campaign = rng.pick(activeCampaigns);
    const merchant = merchants.find(m => m.merchant_id === campaign.merchant_id) || rng.pick(merchants);
    const campaignLocations = locations.filter(l => l.merchant_id === merchant.merchant_id);
    const location = campaignLocations.length > 0 ? rng.pick(campaignLocations) : rng.pick(locations);
    const creative = creatives.find(c => c.campaign_id === campaign.campaign_id) || rng.pick(creatives);
    
    const hour = rng.next() < 0.4 ? rng.nextInt(11, 14) : rng.nextInt(17, 21);
    
    impressions.push({
      imp_id: `IMP_${String(i + 1).padStart(8, '0')}`,
      date: rng.date(new Date('2025-08-01'), 200),
      campaign_id: campaign.campaign_id,
      merchant_id: merchant.merchant_id,
      location_id: location.location_id,
      device: rng.pick(devices),
      placement: rng.pick(placements),
      audience_segment: rng.pick(segments),
      creative_id: creative.creative_id,
      hour
    });
  }
  return impressions;
}

export function generateClicks(impressions: Impression[], keywords: string[], count: number): Click[] {
  const clicks: Click[] = [];
  
  for (let i = 0; i < count; i++) {
    const imp = rng.pick(impressions);
    clicks.push({
      click_id: `CLK_${String(i + 1).padStart(7, '0')}`,
      imp_id: imp.imp_id,
      date: imp.date,
      campaign_id: imp.campaign_id,
      device: imp.device,
      placement: imp.placement,
      keyword: rng.pick(keywords),
      creative_id: imp.creative_id,
      hour: imp.hour
    });
  }
  return clicks;
}

export function generateOrders(customers: Customer[], campaigns: Campaign[], merchants: Merchant[], locations: StoreLocation[], _clicks: Click[], count: number): Order[] {
  const orders: Order[] = [];
  const orderTypes: Array<'DELIVERY' | 'PICKUP' | 'DASHER'> = ['DELIVERY', 'PICKUP', 'DASHER'];
  const placements: Array<'SEARCH' | 'CATEGORIES' | 'COLLECTION' | 'DOUBLEDASH'> = ['SEARCH', 'CATEGORIES', 'COLLECTION', 'DOUBLEDASH'];
  
  for (let i = 0; i < count; i++) {
    const customer = rng.pick(customers);
    const campaign = rng.pick(campaigns);
    const merchant = merchants.find(m => m.merchant_id === campaign.merchant_id) || rng.pick(merchants);
    const campaignLocations = locations.filter(l => l.merchant_id === merchant.merchant_id);
    const location = campaignLocations.length > 0 ? rng.pick(campaignLocations) : rng.pick(locations);
    
    const baseRevenue = rng.nextFloat(15, 80);
    const premiumMultiplier = merchant.is_premium ? 1.3 : 1;
    const revenue = parseFloat((baseRevenue * premiumMultiplier).toFixed(2));
    
    orders.push({
      order_id: `ORD_${String(i + 1).padStart(7, '0')}`,
      date: rng.date(new Date('2025-08-01'), 200),
      customer_id: customer.customer_id,
      campaign_id: campaign.campaign_id,
      merchant_id: merchant.merchant_id,
      location_id: location.location_id,
      revenue,
      is_incremental: rng.next() > 0.25,
      order_type: rng.pick(orderTypes),
      coupon_used: rng.next() < 0.35,
      delivery_fee: parseFloat((rng.nextFloat(2.99, 5.99)).toFixed(2)),
      hour: rng.nextInt(11, 22),
      placement: rng.pick(placements)
    });
  }
  return orders;
}

export function generateAllData() {
  const merchants = generateMerchants(50);
  const campaigns = generateCampaigns(merchants);
  const customers = generateCustomers(5000);
  const timeDim = generateTimeDim();
  const storeLocations = generateStoreLocations(merchants);
  const adGroups = generateAdGroups(campaigns);
  const creatives = generateCreatives(campaigns);
  const { experiments, results: experimentResults } = generateExperiments(merchants);
  const impressions = generateImpressions(campaigns, merchants, storeLocations, creatives, 100000);
  const clicks = generateClicks(impressions, KEYWORDS, 15000);
  const orders = generateOrders(customers, campaigns, merchants, storeLocations, clicks, 8000);
  
  return {
    merchants,
    campaigns,
    customers,
    time_dim: timeDim,
    store_locations: storeLocations,
    ad_groups: adGroups,
    creatives,
    impressions,
    clicks,
    orders,
    experiments,
    experiment_results: experimentResults
  };
}
