import { createHashRouter, useParams } from 'react-router';
import { App } from './App';
import { StubPage } from './components/StubPage';
import { HangarPage } from './features/hangar/HangarPage';

/** Hash history, so a static host (or a file next to the repo) serves every route (06 section 4). */
function ShipStub({ screen, task, note }: { screen: string; task: string; note: string }) {
  const { id = '' } = useParams();
  return <StubPage title={`${screen}: ${id}`} route={`#/ship/${id}/${screen.toLowerCase()}`} task={task} note={note} />;
}

export const routes = [
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <HangarPage /> },
      { path: 'ship/:id/board', element: <ShipStub screen="Board" task="T4" note="The boarding walk, ported from the ArkhEthos intro tour." /> },
      { path: 'ship/:id/bridge', element: <ShipStub screen="Bridge" task="T6" note="Crew profile, loadout rack and ecosystem map." /> },
      { path: 'ship/:id/voyage', element: <ShipStub screen="Voyage" task="T8" note="The stage track with gate buoys." /> },
      { path: 'ship/:id/preflight', element: <ShipStub screen="Preflight" task="T9" note="Hull diagram, checks and export." /> },
      { path: 'armory', element: <StubPage title="Armory" route="#/armory" task="T7" note="The knowledge base: every skill as an artifact you can equip." /> },
      { path: 'logbook', element: <StubPage title="Logbook" route="#/logbook" task="T9" note="Exports, imported verify results and commissions." /> },
      { path: '*', element: <StubPage title="Not found" route="#/" task="n/a" note="No such screen." /> },
    ],
  },
];

export const router = (): ReturnType<typeof createHashRouter> => createHashRouter(routes);
