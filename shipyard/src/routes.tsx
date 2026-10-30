import { createHashRouter, Navigate, useParams } from 'react-router';
import { App } from './App';
import { StubPage } from './components/StubPage';
import { HangarPage } from './features/hangar/HangarPage';
import { force2d, hasWebGL } from './lib/preferences';
import { shouldSkipBoarding } from './scene/tourModel';
import { useStoreState } from './store/context';

/** Hash history, so a static host (or a file next to the repo) serves every route (06 section 4). */
function ShipStub({ screen, task, note }: { screen: string; task: string; note: string }) {
  const { id = '' } = useParams();
  return <StubPage title={`${screen}: ${id}`} route={`#/ship/${id}/${screen.toLowerCase()}`} task={task} note={note} />;
}

/** Opening a ship: the boarding walk the first time (with WebGL), the bridge otherwise and afterwards. */
function ShipEntry() {
  const { id = '' } = useParams();
  const { ui } = useStoreState();
  const skip = shouldSkipBoarding({ twoD: force2d() || !hasWebGL(), seen: Boolean(ui.introSeen[id]), replay: false });
  return <Navigate to={`/ship/${id}/${skip ? 'bridge' : 'board'}`} replace />;
}

/** The scene and its page code load on demand: three, R3F and the GLBs stay out of the initial shell. */
const board = async () => ({ Component: (await import('./features/board/BoardPage')).default });
const lab = async () => ({ Component: (await import('./features/lab/LabPage')).default });
const bridge = async () => ({ Component: (await import('./features/bridge/BridgePage')).default });

export const routes = [
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <HangarPage /> },
      { path: 'ship/:id', element: <ShipEntry /> },
      { path: 'ship/:id/board', lazy: board },
      { path: 'ship/:id/bridge', lazy: bridge },
      { path: 'ship/:id/voyage', element: <ShipStub screen="Voyage" task="T8" note="The stage track with gate buoys." /> },
      { path: 'ship/:id/preflight', element: <ShipStub screen="Preflight" task="T9" note="Hull diagram, checks and export." /> },
      { path: 'armory', element: <StubPage title="Armory" route="#/armory" task="T7" note="The knowledge base: every skill as an artifact you can equip." /> },
      { path: 'lab', lazy: lab },
      { path: 'logbook', element: <StubPage title="Logbook" route="#/logbook" task="T9" note="Exports, imported verify results and commissions." /> },
      { path: '*', element: <StubPage title="Not found" route="#/" task="n/a" note="No such screen." /> },
    ],
  },
];

export const router = (): ReturnType<typeof createHashRouter> => createHashRouter(routes);
