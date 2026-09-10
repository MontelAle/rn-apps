import { fireEvent, render, screen } from '@testing-library/react-native';

import App from '~/App';

const openServicesTab = async () => {
  await render(<App />);

  fireEvent.press(await screen.findByText('Services'));

  return screen.findByText('Book Places');
};

describe('Services flow: Services tab and the booking service', () => {
  it('pressing the Services tab shows the service cards', async () => {
    expect(await openServicesTab()).toBeOnTheScreen();

    // Mail and Persone are the two services marked as favourites, so they
    // render in the preferred grid above the rest.
    expect(screen.getByText('Mail')).toBeOnTheScreen();
    expect(screen.getByText('Persone')).toBeOnTheScreen();
  });

  it('pressing Book Places opens the booking options', async () => {
    await openServicesTab();

    fireEvent.press(screen.getByText('Book Places'));

    expect(await screen.findByText('Request room')).toBeOnTheScreen();
    expect(screen.getByText('Request events places')).toBeOnTheScreen();
  });
});
