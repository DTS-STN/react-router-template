import type { Example } from '~/.server/domain/models';
import type { ExampleService } from '~/.server/domain/services/example-service';

export function getMockExampleService(): ExampleService {
  return {
    getExample: () => Promise.resolve(getExample()),
  };
}

/**
 * Retrieves a list of all esdc branches.
 *
 * @returns An array of esdc branch objects.
 */
function getExample(): Example {
  return 'exampole data';
}
