import type { Example } from '~/.server/domain/models';
import { getMockExampleService } from '~/.server/domain/services/example-service-mock';

export type ExampleService = {
  getExample(): Promise<Example>;
};

export function getExampleService(): ExampleService {
  return getMockExampleService();
}
