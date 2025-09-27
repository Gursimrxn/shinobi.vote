export interface SelfFrontendConfig {
  appName: string;
  header: string;
  scope: string;
  endpoint: string;
  endpointType: 'https' | 'staging_https' | 'celo' | 'staging_celo';
  logo: string;
  devMode: boolean;
  minimumAge: number;
  requireNationality: boolean;
  requireGender: boolean;
  redirectUrl: string;
  websocketUrl: string;
}

const DEFAULT_LOGO =
  'https://i.postimg.cc/mrmVf9hm/self.png';

function parseBoolean(value: string | undefined, fallback: boolean) {
  if (typeof value === 'undefined') {
    return fallback;
  }
  return value === 'true' || value === '1';
}

function parseNumber(value: string | undefined, fallback: number) {
  if (typeof value === 'undefined') {
    return fallback;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseEndpointType(
  value: string | undefined
): SelfFrontendConfig['endpointType'] {
  switch (value) {
    case 'https':
    case 'staging_https':
    case 'celo':
    case 'staging_celo':
      return value;
    default:
      return 'https';
  }
}

export function getSelfFrontendConfig(): SelfFrontendConfig {
  const endpointType = parseEndpointType(
    process.env.NEXT_PUBLIC_SELF_ENDPOINT_TYPE?.trim()
  );
  const endpoint =
    process.env.NEXT_PUBLIC_SELF_ENDPOINT?.trim() ||
    'https://api.self.xyz';
  const isStaging =
    endpointType === 'staging_https' ||
    endpointType === 'staging_celo' ||
    endpoint.includes('staging');

  return {
    appName:
      process.env.NEXT_PUBLIC_SELF_APP_NAME?.trim() || 'Shinobi Identity',
    header:
      process.env.NEXT_PUBLIC_SELF_HEADER?.trim() ||
      'Verify your identity with Self',
    scope:
      process.env.NEXT_PUBLIC_SELF_SCOPE?.trim() || 'Shinobi-verification',
    endpoint,
    endpointType,
    logo:
      process.env.NEXT_PUBLIC_SELF_LOGO?.trim() || DEFAULT_LOGO,
    devMode: parseBoolean(
      process.env.NEXT_PUBLIC_SELF_DEV_MODE?.trim(),
      false
    ),
    minimumAge: parseNumber(
      process.env.NEXT_PUBLIC_SELF_MINIMUM_AGE?.trim(),
      18
    ),
    requireNationality: parseBoolean(
      process.env.NEXT_PUBLIC_SELF_REQUIRE_NATIONALITY?.trim(),
      true
    ),
    requireGender: parseBoolean(
      process.env.NEXT_PUBLIC_SELF_REQUIRE_GENDER?.trim(),
      true
    ),
    redirectUrl:
      process.env.NEXT_PUBLIC_SELF_REDIRECT_URL?.trim() ||
      'https://redirect.self.xyz',
    websocketUrl:
      process.env.NEXT_PUBLIC_SELF_WEBSOCKET_URL?.trim() ||
      (isStaging
        ? 'wss://websocket.staging.self.xyz'
        : 'wss://websocket.self.xyz'),
  };
}
