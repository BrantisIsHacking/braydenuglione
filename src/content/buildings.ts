import type { Building } from './types';

export const buildings: Building[] = [
  { id: 'scouting-office', name: 'Scouting Office', sign: 'SCOUTING OFFICE', district: 'square', kind: 'overlay', stage: 1, bespoke: false, accent: 'scarlet', blurb: 'I keep my intro, my targets, and the quickest way to browse everything here.' },
  { id: 'hall-of-fame', name: 'Hall of Fame', sign: 'HALL OF FAME', district: 'square', kind: 'interior', stage: 2, bespoke: true, accent: 'scarlet', blurb: "I hang my awards here, from NASA Space Apps to the Critic's Choice Prize." },
  { id: 'mailbox', name: 'Press Desk', sign: 'PRESS DESK', district: 'square', kind: 'spot', stage: 1, bespoke: false, accent: 'scarlet', blurb: 'I answer email here, so this is the way to reach me.' },
  { id: 'workshop', name: 'The Workshop', sign: 'WORKSHOP', district: 'career', kind: 'interior', stage: 2, bespoke: true, accent: 'ink', blurb: 'I build my projects here, from Tranquility Base to DebateMate.' },
  { id: 'hq-tower', name: 'HQ Tower', sign: 'HQ TOWER', district: 'career', kind: 'interior', stage: 2, bespoke: true, accent: 'ink', blurb: 'I give each of my jobs and internships its own floor here.' },
  { id: 'civic-center', name: 'Civic Center', sign: 'CIVIC CENTER', district: 'career', kind: 'interior', stage: 2, bespoke: true, accent: 'scarlet', blurb: 'I keep my leadership and community roles here, from USACS to HackRU.' },
  { id: 'campus-quad', name: 'Campus Quad', sign: 'CAMPUS QUAD', district: 'career', kind: 'interior', stage: 2, bespoke: true, accent: 'scarlet', blurb: 'I cover my college years and my high school throwbacks out here.' },
  { id: 'library', name: 'Library', sign: 'LIBRARY', district: 'culture', kind: 'interior', stage: 3, bespoke: true, accent: 'mustard', blurb: 'I have read about 150 books; my shelf is here.' },
  { id: 'playhouse', name: 'Playhouse', sign: 'PLAYHOUSE', district: 'culture', kind: 'interior', stage: 3, bespoke: true, accent: 'cinemaRed', blurb: 'I saw Stranger Things on Broadway through Theater Appreciation, my favorite course at Rutgers.' },
  { id: 'cinema', name: 'Cinema', sign: 'CINEMA', district: 'culture', kind: 'interior', stage: 3, bespoke: true, accent: 'cinemaRed', blurb: 'I log the films I watch, with 210 titles on IMDb.' },
  { id: 'record-store', name: 'Record Store', sign: 'RECORDS', district: 'culture', kind: 'interior', stage: 3, bespoke: true, accent: 'warmGlow', blurb: 'I keep my top artists here, plus the karaoke club.' },
  { id: 'arcade', name: 'Arcade', sign: 'ARCADE', district: 'culture', kind: 'interior', stage: 3, bespoke: true, accent: 'teal', blurb: 'I play Rocket League, FIFA, and plenty of other games with friends.' },
  { id: 'gym', name: 'Gym', sign: 'GYM', district: 'sports', kind: 'interior', stage: 1, bespoke: true, accent: 'gymRed', blurb: 'I played varsity basketball at Morris Tech, and this is my court.' },
  { id: 'fan-shop', name: 'Fan Shop', sign: 'FAN SHOP', district: 'sports', kind: 'interior', stage: 3, bespoke: true, accent: 'rack', blurb: 'I root for the Giants, Knicks, Yankees, and Rangers, plus a handful of soccer clubs.' },
  { id: 'chess-park', name: 'Chess Park', sign: 'CHESS PARK', district: 'sports', kind: 'spot', stage: 3, bespoke: false, accent: 'ink', blurb: 'I play chess online and peaked around 1400.' },
  { id: 'park', name: 'Park', sign: 'PARK', district: 'sports', kind: 'spot', stage: 3, bespoke: false, accent: 'fairway', blurb: 'I play Roundnet (Spikeball) with the Rutgers club.' },
  { id: 'golf-clubhouse', name: 'Golf Clubhouse', sign: 'CLUBHOUSE', district: 'sports', kind: 'interior', stage: 3, bespoke: true, accent: 'fairway', blurb: 'I played varsity golf, and my best nine-hole round is a 40.' },
  { id: 'running-loop', name: '5K Loop', sign: '5K loop', district: 'sports', kind: 'spot', stage: 3, bespoke: false, accent: 'scarlet', blurb: 'A 5K loop circles the whole town.' },
];

export const SIGN_ALLOW_LIST: readonly string[] = [
  'SCOUTING OFFICE', 'HALL OF FAME', 'PRESS DESK', 'WORKSHOP', 'HQ TOWER', 'CIVIC CENTER', 'CAMPUS QUAD',
  'LIBRARY', 'PLAYHOUSE', 'CINEMA', 'RECORDS', 'ARCADE', 'GYM', 'FAN SHOP', 'CHESS PARK', 'PARK', 'CLUBHOUSE', '5K loop',
  'ELEVATOR', 'FLOOR 1: IT ROOM', 'FLOOR 2: CODING DOJO', 'FLOOR 3: MED-ML LAB', 'FLOOR 4: AI LAB',
  'LECTURE HALL', 'JUDGING HALL', 'CLASSROOM', 'TOUR DESK', 'MENTORSHIP BOARD', 'HONORS HALL', 'SCREENING ROOM', 'HIGH SCHOOL WING', 'ROBOTICS LAB',
  'NOW SHOWING', 'TICKETS', 'CONCESSIONS', 'THEATER 1',
  'FAVORITES', 'STAGE', 'TOP 12', 'BOX OFFICE', 'JERSEYS', 'SCARVES', 'PRO SHOP', 'TO THE COURSE', '9 HOLES',
];
