import type { ShippingProvider, ShippingLabel, TrackingStatus, LockerPoint, ShippingAddress } from './types';

export class MockShippingProvider implements ShippingProvider {
  readonly name = 'mock';
  readonly supportedCountries = ['RO', 'DE', 'FR', 'PL', 'IT', 'ES'];
  readonly supportsLockers = true;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async generateLabel(_params: {
    from: ShippingAddress;
    to: ShippingAddress | { lockerId: string };
    weightGrams: number;
    orderId: string;
  }): Promise<ShippingLabel> {
    const trackingNumber = `MOCK-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    return {
      labelUrl: `https://example.com/labels/${trackingNumber}.pdf`,
      trackingNumber,
      trackingUrl: `https://example.com/track/${trackingNumber}`,
      provider: this.name,
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getTracking(_trackingNumber: string): Promise<TrackingStatus[]> {
    return [
      {
        status: 'pending',
        description: 'Label created, awaiting pickup',
        timestamp: new Date().toISOString(),
      },
    ];
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getNearbyLockers(latitude: number, longitude: number, _radiusKm: number = 5): Promise<LockerPoint[]> {
    return [
      {
        id: 'locker-001',
        name: 'EasyBox Mall',
        address: 'Str. Exemplu 1',
        city: 'București',
        latitude: latitude + 0.01,
        longitude: longitude + 0.01,
        provider: this.name,
      },
      {
        id: 'locker-002',
        name: 'EasyBox Metro',
        address: 'Str. Exemplu 2',
        city: 'București',
        latitude: latitude - 0.01,
        longitude: longitude - 0.01,
        provider: this.name,
      },
    ];
  }

  async calculateRate(fromCountry: string, toCountry: string, weightGrams: number): Promise<{ amount: number; currency: string }> {
    const baseRate = fromCountry === toCountry ? 1500 : 3000; // 15 or 30 RON
    const weightSurcharge = Math.max(0, weightGrams - 1000) * 1; // 0.01 RON per gram over 1kg
    return { amount: baseRate + weightSurcharge, currency: 'RON' };
  }
}
