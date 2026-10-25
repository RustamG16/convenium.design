import {createStateWriter,migrateState} from './state.mjs';
import {listWorkspace} from './workspace.mjs';
import {dataFile} from './paths.mjs';

const writers=new Map();
export async function projectJourney(projectId) {
 if(!/^[a-z0-9-]+$/.test(projectId))throw new Error('Invalid project ID.');
 const project=(await listWorkspace()).projects.find(p=>p.id===projectId);
 if(!project)throw new Error('Project not found.');
 if(!writers.has(projectId))writers.set(projectId,createStateWriter({filePath:dataFile(`journey-${projectId}.jsonl`),initialState:migrateState({workspace:{projects:[project]}})}));
 return writers.get(projectId);
}
