export type Profile = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  role: string | null;
  created_at: string;
};

export type Plan = {
  id: number;
  name: string;
  price: number;
  access_level: number;
  monthly_credits: number;
  description: string | null;
  features: string[] | null;
  is_featured: boolean | null;
  created_at: string;
};

export type Subscription = {
  id: string;
  user_id: string;
  plan_id: number;
  status: string;
  current_period_start: string;
  current_period_end: string;
  visits_used_this_cycle: number | null;
  created_at: string;
};

export type Partner = {
  id: string;
  name: string;
  description: string | null;
  address: string | null;
  category: string | null;
  min_plan_level: number | null;
  daily_capacity_limit: number | null;
  image_url: string | null;
  photos: string[] | null;
  is_active: boolean | null;
  admin_user_id: string | null;
  created_at: string;
  location: unknown | null;
};

export type Checkin = {
  id: string;
  user_id: string;
  partner_id: string;
  status: string;
  checkin_date: string;
  created_at: string;
};

export type NearbyPartner = Partner & {
  distance_km: number;
};
