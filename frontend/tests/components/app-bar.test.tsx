import { createRoutesStub } from 'react-router';

import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { mock } from 'vitest-mock-extended';

import { AppBar } from '~/components/app-bar';

describe('AppBar', () => {
  it('should correctly render an AppBar with a MenuItem when the file property is provided', () => {
    globalThis.__appEnvironment = mock({
      MSCA_BASE_URL: 'https://msca.example.com/',
    });

    const RoutesStub = createRoutesStub([
      {
        path: '/fr/',
        Component: () => <AppBar />,
      },
    ]);

    const { container } = render(<RoutesStub initialEntries={['/fr/']} />);

    expect(container).toMatchSnapshot('expected html');
  });

  it('should correctly render an AppBar with a MenuItem when the to property is provided', () => {
    globalThis.__appEnvironment = mock({
      MSCA_BASE_URL: 'https://msca.example.com/',
    });

    const RoutesStub = createRoutesStub([
      {
        path: '/fr/',
        Component: () => <AppBar />,
      },
    ]);

    const { container } = render(<RoutesStub initialEntries={['/fr/']}></RoutesStub>);

    expect(container).toMatchSnapshot('expected html');
  });

  it('should render render an AppBar with a name provided', () => {
    globalThis.__appEnvironment = mock({
      MSCA_BASE_URL: 'https://msca.example.com/',
    });

    const RoutesStub = createRoutesStub([
      {
        path: '/fr/',
        Component: () => <AppBar />,
      },
    ]);

    const { container } = render(<RoutesStub initialEntries={['/fr/']}></RoutesStub>);

    expect(container).toMatchSnapshot('expected html');
  });

  it('should render render an AppBar with a profile item provided', () => {
    globalThis.__appEnvironment = mock({
      MSCA_BASE_URL: 'https://msca.example.com/',
    });

    const RoutesStub = createRoutesStub([
      {
        path: '/fr/',
        Component: () => <AppBar name="Test User" />,
      },
    ]);
    const { container } = render(<RoutesStub initialEntries={['/fr/']}></RoutesStub>);
    expect(container).toMatchSnapshot('expected html');
  });
});
