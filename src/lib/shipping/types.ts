export interface ShippingLabel {
  labelUrl: string;
  trackingNumber: string;
  trackingUrl: string;
  provider: string;
}

export interface LockerPoint {
  id: string;
  name: string;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  provider: string;
}

export interface TrackingStatus {
  status: 'pending' | 'picked_up' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'returned' | 'exception';
  description: string;
  timestamp: string;
  location?: string;
}

export interface ShippingAddress {
  name: string;
  line1: string;
  line2?: string;
  city: string;
  postalCode: string;
  country: string;
}

export interface ShippingProvider {
  readonly name: string;
  readonly supportedCountries: string[];
  readonly supportsLockers: boolean;

  generateLabel(params: {
    from: ShippingAddress;
    to: ShippingAddress | { lockerId: string };
    weightGrams: number;
    orderId: string;
  }): Promise<ShippingLabel>;

  getTracking(trackingNumber: string): Promise<TrackingStatus[]>;

  getNearbyLockers?(latitude: number, longitude: number, radiusKm?: number): Promise<LockerPoint[]>;

  calculateRate?(fromCountry: string, toCountry: string, weightGrams: number): Promise<{ amount: number; currency: string }>;
}
