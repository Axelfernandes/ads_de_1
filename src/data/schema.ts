export interface Campaign {
  campaign_id: string;
  name: string;
  type: 'SPONSORED_PRODUCTS' | 'SPONSORED_BRANDS';
  status: 'ACTIVE' | 'PAUSED' | 'ENDED';
  budget_daily: number;
  budget_lifetime: number;
  start_date: string;
  end_date: string;
  targeting_type: 'AUTOMATIC' | 'MANUAL' | 'KEYWORD' | 'BEHAVIORAL';
  merchant_id: string;
}

export interface Merchant {
  merchant_id: string;
  name: string;
  category: string;
  city: string;
  state: string;
  tier: 'BRONZE' | 'SILVER' | 'GOLD' | 'DIAMOND';
  avg_rating: number;
  is_premium: boolean;
  created_date: string;
}

export interface Customer {
  customer_id: string;
  is_new: boolean;
  first_order_date: string;
  segment: 'NEW_USER' | 'LAPSED' | 'REGULAR' | 'VIP';
  lifetime_value: number;
  ltv_tier: 'LOW' | 'MEDIUM' | 'HIGH' | 'PREMIUM';
  signup_source: 'ORGANIC' | 'PAID_ADS' | 'REFERRAL' | 'EMAIL';
}

export interface TimeDim {
  date: string;
  day_of_week: string;
  hour: number;
  daypart: 'BREAKFAST' | 'LUNCH' | 'AFTERNOON' | 'DINNER' | 'LATE_NIGHT';
  is_weekend: boolean;
  month: number;
  quarter: number;
  year: number;
}

export interface StoreLocation {
  location_id: string;
  merchant_id: string;
  city: string;
  state: string;
  region: 'WEST' | 'MIDWEST' | 'SOUTH' | 'NORTHEAST';
  is_test_market: boolean;
  lat: number;
  lng: number;
}

export interface Impression {
  imp_id: string;
  date: string;
  campaign_id: string;
  merchant_id: string;
  location_id: string;
  device: 'MOBILE' | 'DESKTOP' | 'TABLET';
  placement: 'SEARCH' | 'CATEGORIES' | 'COLLECTION' | 'DOUBLEDASH';
  audience_segment: 'NEW_USER' | 'LAPSED' | 'REGULAR' | 'VIP';
  creative_id: string;
  hour: number;
}

export interface Click {
  click_id: string;
  imp_id: string;
  date: string;
  campaign_id: string;
  device: 'MOBILE' | 'DESKTOP' | 'TABLET';
  placement: 'SEARCH' | 'CATEGORIES' | 'COLLECTION' | 'DOUBLEDASH';
  keyword: string;
  creative_id: string;
  hour: number;
}

export interface Order {
  order_id: string;
  date: string;
  customer_id: string;
  campaign_id: string;
  merchant_id: string;
  location_id: string;
  revenue: number;
  is_incremental: boolean;
  order_type: 'DELIVERY' | 'PICKUP' | 'DASHER';
  coupon_used: boolean;
  delivery_fee: number;
  hour: number;
  placement: 'SEARCH' | 'CATEGORIES' | 'COLLECTION' | 'DOUBLEDASH';
}

export interface AdGroup {
  ad_group_id: string;
  campaign_id: string;
  name: string;
  bid_type: 'AUTOMATIC' | 'MANUAL' | 'AUTOMATED';
  bid_amount: number;
  targeting_criteria: string;
  status: 'ACTIVE' | 'PAUSED' | 'ENDED';
}

export interface Creative {
  creative_id: string;
  campaign_id: string;
  name: string;
  type: 'IMAGE' | 'VIDEO' | 'CAROUSEL';
  headline: string;
  image_url: string;
  ctr_benchmark: number;
}

export interface Experiment {
  exp_id: string;
  name: string;
  type: 'CREATIVE' | 'BIDDING' | 'TARGETING' | 'GEO';
  start_date: string;
  end_date: string;
  control_group: string;
  treatment_group: string;
  metric_type: 'CVR' | 'ROAS' | 'CTR' | 'CPA';
  status: 'RUNNING' | 'COMPLETED' | 'PAUSED';
  p_value: number;
}

export interface ExperimentResult {
  result_id: string;
  exp_id: string;
  variant: 'CONTROL' | 'TREATMENT';
  sample_size: number;
  conversion_rate: number;
  revenue: number;
  orders: number;
  lift_pct: number;
}
