import type { LockerItem } from './types';

// Append new items to the end of this list. Each needs a unique id, title, oneLiner, and shotCaption.
export const lockerRoom: LockerItem[] = [
  {
    id: 'basketball',
    title: 'Varsity basketball',
    oneLiner: '112 career points in 26 games, with a 12-point high against Warren Tech.',
    detail: 'Varsity at Morris Tech from November 2023 to February 2025. 2023–24: 28 points in 6 games; 2024–25: 84 points in 20 games.',
    shotCaption: 'Twelve on Warren Tech. Still counting it.',
  },
  {
    id: 'golf',
    title: 'Varsity golf',
    oneLiner: 'Best nine-hole round: a 40, which is +5.',
    detail: 'Varsity golf from March 2023 to June 2025.',
    shotCaption: 'Forty for nine. Fore!',
  },
  {
    id: 'chess',
    title: 'Chess',
    oneLiner: 'Peaked around 1400 on an old account. Now playing as brantis89.',
    link: { label: 'chess.com/member/brantis89', url: 'https://www.chess.com/member/brantis89' },
    shotCaption: 'Check, mate. And-one.',
  },
  {
    id: 'rocket-league',
    title: 'Rocket League',
    oneLiner: 'Reached Champion rank.',
    shotCaption: 'Whoa, what a save!',
  },
  {
    id: 'fifa-23',
    title: 'FIFA 23',
    oneLiner: 'My favorite FIFA in the series.',
    shotCaption: 'Soccer, but you can pause it.',
  },
  {
    id: 'roundnet',
    title: 'Roundnet club',
    oneLiner: 'I play Roundnet (Spikeball) with the Rutgers club.',
    shotCaption: 'Four-way pickup, no hoop required.',
  },
  {
    id: 'teams',
    title: 'Teams I root for',
    oneLiner: 'Giants, Knicks, Yankees, and Rangers.',
    detail: 'Soccer: Manchester City, Barcelona, Bayern Munich, Juventus, NY Red Bulls, and NYCFC.',
    shotCaption: 'Season ticket holder in spirit.',
  },
  {
    id: 'movies',
    title: 'Movies',
    oneLiner: 'Star Wars IV through VI and Cars are my favorites. 210 titles logged on IMDb.',
    link: {
      label: 'IMDb watch history',
      url: 'https://www.imdb.com/user/p.ddbbrfsuwduvzxesc3fzlp7gii/watchhistory/',
    },
    shotCaption: 'Roll the film.',
  },
  {
    id: 'books',
    title: 'Books',
    oneLiner: "Favorites: The Invisible Life of Addie LaRue, Feed, 1984, and Pride and Prejudice.",
    detail: 'About 150 books read so far. Five-star reads this year include Hamlet, Slaughterhouse-Five, and Things Fall Apart.',
    link: {
      label: 'Goodreads',
      url: 'https://www.goodreads.com/user/show/102251874-brayden-uglione',
    },
    shotCaption: 'Reading list is deeper than the bench.',
  },
  {
    id: 'music',
    title: 'Music',
    oneLiner: 'Top five: Drake, Don Toliver, Kendrick Lamar, J. Cole, Kanye West.',
    detail: 'Rounding out my top 12: Travis Scott, Future, Playboi Carti, Tyler the Creator, J Balvin, Lil Uzi Vert, Tame Impala.',
    shotCaption: 'Pregame playlist, on shuffle.',
  },
  {
    id: 'stranger-things',
    title: 'Stranger Things on Broadway',
    oneLiner: 'Saw it through Theater Appreciation, my favorite course at Rutgers.',
    shotCaption: 'Front row to the Upside Down.',
  },
  {
    id: 'karaoke',
    title: 'Karaoke Club',
    oneLiner: 'Member of the karaoke club at County College of Morris.',
    shotCaption: 'Mic check. One, two.',
  },
];
