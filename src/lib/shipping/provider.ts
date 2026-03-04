import type { ShippingProvider } from './types';

class ShippingProviderRegistry {
  private providers = new Map<string, ShippingProvider>();

  register(provider: ShippingProvider): void {
    this.providers.set(provider.name, provider);
  }

  get(name: string): ShippingProvider {
    const provider = this.providers.get(name);
    if (!provider) throw new Error(`Shipping provider "${name}" not registered`);
    return provider;
  }

  getForCountry(country: string): ShippingProvider[] {
    return Array.from(this.providers.values()).filter((p) =>
      p.supportedCountries.includes(country)
    );
  }

  getLockerProviders(country: string): ShippingProvider[] {
    return this.getForCountry(country).filter((p) => p.supportsLockers);
  }

  listAll(): ShippingProvider[] {
    return Array.from(this.providers.values());
  }
}

export const shippingRegistry = new ShippingProviderRegistry();
