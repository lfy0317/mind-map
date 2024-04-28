import { createRoot } from 'react-dom/client';
import reactDemo from './ReactDemo';

/**
 * 将demo渲染到root dom上
 */
createRoot(document.getElementById('root') as Element).render(reactDemo());
