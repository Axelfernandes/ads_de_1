import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

/*
  FoodDash Ad Analytics Data Schema (Amplify Gen 2)
  Replacing in-memory AlaSQL with AppSync + DynamoDB.
*/

const schema = a.schema({
  Merchant: a
    .model({
      merchant_id: a.id().required(),
      name: a.string().required(),
      category: a.string(),
      city: a.string(),
      state: a.string(),
      tier: a.enum(['BRONZE', 'SILVER', 'GOLD', 'DIAMOND']),
      avg_rating: a.float(),
      is_premium: a.boolean(),
      created_date: a.date(),
      campaigns: a.hasMany('Campaign', 'merchant_id'),
      orders: a.hasMany('Order', 'merchant_id'),
      impressions: a.hasMany('Impression', 'merchant_id'),
    })
    .authorization((allow: any) => [allow.guest()]), // Public dashboard for now

  Campaign: a
    .model({
      campaign_id: a.id().required(),
      name: a.string().required(),
      type: a.enum(['SPONSORED_PRODUCTS', 'SPONSORED_BRANDS']),
      status: a.enum(['ACTIVE', 'PAUSED', 'ENDED']),
      budget_daily: a.float(),
      budget_lifetime: a.float(),
      start_date: a.date(),
      end_date: a.date(),
      targeting_type: a.enum(['AUTOMATIC', 'MANUAL', 'KEYWORD', 'BEHAVIORAL']),
      merchant_id: a.id().required(),
      merchant: a.belongsTo('Merchant', 'merchant_id'),
      orders: a.hasMany('Order', 'campaign_id'),
    })
    .authorization((allow: any) => [allow.guest()]),

  Order: a
    .model({
      order_id: a.id().required(),
      date: a.date().required(),
      revenue: a.float().required(),
      is_incremental: a.boolean(),
      order_type: a.enum(['DELIVERY', 'PICKUP', 'DASHER']),
      coupon_used: a.boolean(),
      delivery_fee: a.float(),
      hour: a.integer(),
      placement: a.enum(['SEARCH', 'CATEGORIES', 'COLLECTION', 'DOUBLEDASH']),
      merchant_id: a.id().required(),
      merchant: a.belongsTo('Merchant', 'merchant_id'),
      campaign_id: a.id().required(),
      campaign: a.belongsTo('Campaign', 'campaign_id'),
    })
    .authorization((allow: any) => [allow.guest()]),

  Impression: a
    .model({
      imp_id: a.id().required(),
      date: a.date().required(),
      device: a.enum(['MOBILE', 'DESKTOP', 'TABLET']),
      placement: a.enum(['SEARCH', 'CATEGORIES', 'COLLECTION', 'DOUBLEDASH']),
      audience_segment: a.enum(['NEW_USER', 'LAPSED', 'REGULAR', 'VIP']),
      hour: a.integer(),
      merchant_id: a.id().required(),
      merchant: a.belongsTo('Merchant', 'merchant_id'),
      campaign_id: a.id().required(),
    })
    .authorization((allow: any) => [allow.guest()]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'iam',
  },
});
