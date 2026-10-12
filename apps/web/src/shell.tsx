/** Server build entry of the loading screen, prerendered into `index.html`. */
import { renderToStaticMarkup } from 'react-dom/server';
import { LoadingScreen } from './layout/LoadingScreen';

export const renderShell = (): string => renderToStaticMarkup(<LoadingScreen />);
