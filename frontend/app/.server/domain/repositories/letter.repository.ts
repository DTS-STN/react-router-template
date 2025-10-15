import type { LetterEntity, PdfEntity } from '~/.server/domain/entities/letter.entity';
import type { ServerEnvironment } from '~/.server/environment';
import { serverEnvironment } from '~/.server/environment';
import type { HttpClient } from '~/.server/http/http-client';
import { getHttpClient } from '~/.server/http/http-client';
import { LogFactory } from '~/.server/logging';
// TODO: Update this file?
import getPdfByLetterIdJson from '~/.server/resources/cct/get-pdf-by-letter-id.json';
import { HttpStatusCodes } from '~/utils/http-status-codes';

/**
 * A repository that provides access to letters.
 */
export interface LetterRepository {
  /**
   * Find all letter entities for a given sin.
   *
   * @param sin The sin to find all letter entities for.
   * @param userId The user that made the request, only used for auditing
   * @returns A Promise that resolves to all letter entities found for a sin.
   */
  findLettersBySin(sin: string, userId: string): Promise<readonly LetterEntity[]>;

  /**
   * Retrieve the PDF entity associated with a specific letter id.
   *
   * @param letterId The letter id of the PDF entity.
   * @param userId The user that made the request, only used for auditing
   * @returns A Promise that resolves to the PDF entity for a letter id.
   */
  getPdfByLetterId(letterId: string, userId: string): Promise<PdfEntity>;

  /**
   * Retrieves metadata associated with the letter repository.
   *
   * @returns A record where the keys and values are strings representing metadata information.
   */
  getMetadata(): Record<string, string>;

  /**
   * Performs a health check to ensure that the letter repository is operational.
   *
   * @throws An error if the health check fails or the repository is unavailable.
   * @returns A promise that resolves when the health check completes successfully.
   */
  checkHealth(): Promise<void>;
}

export function getLetterRepository(): LetterRepository {
  return serverEnvironment.ENABLE_MOCK_LETTER_SERVICE
    ? new MockLetterRepository()
    : new DefaultLetterRepository(serverEnvironment, getHttpClient());
}
export class DefaultLetterRepository implements LetterRepository {
  private readonly log;
  private readonly serverConfig: Pick<
    ServerEnvironment,
    | 'HEALTH_PLACEHOLDER_REQUEST_VALUE'
    | 'HTTP_PROXY_URL'
    | 'CCT_API_BASE_URI'
    | 'CCT_API_KEY'
    | 'CCT_API_COMMUNITY'
    | 'CCT_API_MAX_RETRIES'
    | 'CCT_API_BACKOFF_MS'
    | 'INTEROP_API_SUBSCRIPTION_KEY'
  >;
  private readonly httpClient: HttpClient;
  private readonly baseUrl: string;

  constructor(
    serverConfig: Pick<
      ServerEnvironment,
      | 'HEALTH_PLACEHOLDER_REQUEST_VALUE'
      | 'HTTP_PROXY_URL'
      | 'CCT_API_BASE_URI'
      | 'CCT_API_KEY'
      | 'CCT_API_COMMUNITY'
      | 'CCT_API_MAX_RETRIES'
      | 'CCT_API_BACKOFF_MS'
      | 'INTEROP_API_SUBSCRIPTION_KEY'
    >,
    httpClient: HttpClient,
  ) {
    this.log = LogFactory.getLogger(import.meta.url);
    this.serverConfig = serverConfig;
    this.httpClient = httpClient;
    this.baseUrl = `${this.serverConfig.CCT_API_BASE_URI}/client-correspondence/letter-retrieval/cct/v1`;
  }

  async findLettersBySin(sin: string, userId: string): Promise<readonly LetterEntity[]> {
    this.log.trace('Fetching letters for sin [%s]', sin);

    const url = new URL(`${this.baseUrl}/GetDocInfoByClientId`);
    url.searchParams.set('clientId', sin);
    url.searchParams.set('userId', userId);
    url.searchParams.set('community', `${this.serverConfig.CCT_API_COMMUNITY}`);
    url.searchParams.set('Exact', 'true');

    const response = await this.httpClient.instrumentedFetch('http.client.interop-api.get-doc-info-by-client-id.gets', url, {
      proxyUrl: this.serverConfig.HTTP_PROXY_URL,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': `${this.serverConfig.CCT_API_KEY}`,
        'Ocp-Apim-Subscription-Key': `${this.serverConfig.INTEROP_API_SUBSCRIPTION_KEY}`,
      },
      retryOptions: {
        retries: this.serverConfig.CCT_API_MAX_RETRIES,
        backoffMs: this.serverConfig.CCT_API_BACKOFF_MS,
        retryConditions: {
          [HttpStatusCodes.BAD_GATEWAY]: [],
        },
      },
    });

    if (!response.ok) {
      this.log.error('%j', {
        message: 'Failed to find letters',
        status: response.status,
        statusText: response.statusText,
        url: url,
        responseBody: await response.text(),
      });

      throw new Error(`Failed to find letters. Status: ${response.status}, Status Text: ${response.statusText}`);
    }

    const letterEntities: readonly LetterEntity[] = await response.json();
    this.log.trace('Returning letters [%j]', letterEntities);
    return letterEntities;
  }

  async getPdfByLetterId(letterId: string, userId: string): Promise<PdfEntity> {
    this.log.trace('Fetching PDF for letterId [%s]', letterId);

    const url = new URL(`${this.baseUrl}/GetPdfByLetterId`);
    url.searchParams.set('id', letterId);
    url.searchParams.set('userId', userId);
    url.searchParams.set('community', `${this.serverConfig.CCT_API_COMMUNITY}`);

    const response = await this.httpClient.instrumentedFetch('http.client.interop-api.get-pdf-by-client-id.gets', url, {
      proxyUrl: this.serverConfig.HTTP_PROXY_URL,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': `${this.serverConfig.CCT_API_KEY}`,
        'Ocp-Apim-Subscription-Key': `${this.serverConfig.INTEROP_API_SUBSCRIPTION_KEY}`,
      },
      retryOptions: {
        retries: this.serverConfig.CCT_API_MAX_RETRIES,
        backoffMs: this.serverConfig.CCT_API_BACKOFF_MS,
        retryConditions: {
          [HttpStatusCodes.BAD_GATEWAY]: [],
        },
      },
    });

    if (!response.ok) {
      this.log.error('%j', {
        message: 'Failed to get PDF',
        status: response.status,
        statusText: response.statusText,
        url: url,
        responseBody: await response.text(),
      });

      throw new Error(`Failed to get PDF. Status: ${response.status}, Status Text: ${response.statusText}`);
    }

    const pdfEntity: PdfEntity = await response.json();
    this.log.trace('Returning PDF [%j]', pdfEntity);
    return pdfEntity;
  }

  getMetadata(): Record<string, string> {
    return {
      baseUrl: this.baseUrl,
    };
  }

  async checkHealth(): Promise<void> {
    await this.findLettersBySin(this.serverConfig.HEALTH_PLACEHOLDER_REQUEST_VALUE, 'MSCA-CDB');
  }
}

export class MockLetterRepository implements LetterRepository {
  private readonly log;

  constructor() {
    this.log = LogFactory.getLogger('MockLetterRepository');
  }

  async findLettersBySin(sin: string): Promise<readonly LetterEntity[]> {
    this.log.debug('Fetching letters for sin [%s]', sin);

    const letterEntities: readonly LetterEntity[] = [
      {
        LetterName: 'Détermination positive - Positive determination',
        LetterId: '123456-b3bc-4332-8b69-172197842b88',
        LetterDate: '2025/06/13',
      },
      {
        LetterName: 'Invitation à presenter une demande - Invitation to apply',
        LetterId: '123456-2122-4d95-b63c-353b0cc04070',
        LetterDate: '2025/06/13',
      },
    ];

    this.log.debug('Returning letters [%j]', letterEntities);
    return await Promise.resolve(letterEntities);
  }

  async getPdfByLetterId(letterId: string): Promise<PdfEntity> {
    this.log.debug('Fetching PDF for letterId [%s]', letterId);

    const pdfEntity: PdfEntity = getPdfByLetterIdJson;

    this.log.debug('Returning PDF [%j]', pdfEntity);
    return await Promise.resolve(pdfEntity);
  }

  getMetadata(): Record<string, string> {
    return {
      mockEnabled: 'true',
    };
  }

  async checkHealth(): Promise<void> {
    return await Promise.resolve();
  }
}
