// GSAP with the plugins the interface uses, registered once. Import `gsap`, `Flip` and `useGSAP` from here.
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { Flip } from 'gsap/Flip';

gsap.registerPlugin(Flip, useGSAP);

export { Flip, gsap, useGSAP };
