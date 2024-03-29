import axios from 'axios';
import magnet from 'magnet-uri';
import { getTorrent } from './repository.js';
import { getRandomUserAgent } from './requestHelper.js';
import { Type } from './types.js';

const TRACKERS_URL = 'https://raw.githubusercontent.com/ngosang/trackerslist/master/trackers_best.txt';
const DEFAULT_TRACKERS = [
  "udp://47.ip-51-68-199.eu:6969/announce",
  "udp://9.rarbg.me:2940",
  "udp://9.rarbg.to:2820",
  "udp://exodus.desync.com:6969/announce",
  "udp://explodie.org:6969/announce",
  "udp://ipv4.tracker.harry.lu:80/announce",
  "udp://open.stealth.si:80/announce",
  "udp://opentor.org:2710/announce",
  "udp://opentracker.i2p.rocks:6969/announce",
  "udp://retracker.lanta-net.ru:2710/announce",
  "udp://tracker.cyberia.is:6969/announce",
  "udp://tracker.dler.org:6969/announce",
  "udp://tracker.ds.is:6969/announce",
  "udp://tracker.internetwarriors.net:1337",
  "udp://tracker.openbittorrent.com:6969/announce",
  "udp://tracker.opentrackr.org:1337/announce",
  "udp://tracker.tiny-vps.com:6969/announce",
  "udp://tracker.torrent.eu.org:451/announce",
  "udp://valakas.rollo.dnsabr.com:2710/announce",
  "udp://www.torrent.eu.org:451/announce",
]
const ANIME_TRACKERS = [
  "http://nyaa.tracker.wf:7777/announce",
  "http://anidex.moe:6969/announce",
  "http://tracker.anirena.com:80/announce",
  "udp://tracker.uw0.xyz:6969/announce",
  "http://share.camoe.cn:8080/announce",
  "http://t.nyaatracker.com:80/announce",
];
const RUSSIAN_TRACKERS = [
  "udp://opentor.net:6969",
  "http://bt.t-ru.org/ann?magnet",
  "http://bt2.t-ru.org/ann?magnet",
  "http://bt3.t-ru.org/ann?magnet",
  "http://bt4.t-ru.org/ann?magnet",
];

let BEST_TRACKERS = [];
let ALL_ANIME_TRACKERS = [];
let ALL_RUSSIAN_TRACKERS = [];

export async function getMagnetLink(infoHash) {
  const torrent = await getTorrent(infoHash).catch(() => ({ infoHash }));
  const torrentTrackers = torrent?.trackers?.split(',') || [];
  const animeTrackers = torrent.type === Type.ANIME ? ALL_ANIME_TRACKERS : [];
  const trackers = unique([].concat(torrentTrackers).concat(animeTrackers));

  return magnet.encode({ infoHash: infoHash, name: torrent.title, announce: trackers });
}

export async function initBestTrackers() {
  BEST_TRACKERS = await getBestTrackers();
  ALL_ANIME_TRACKERS = unique(BEST_TRACKERS.concat(DEFAULT_TRACKERS).concat(ANIME_TRACKERS));
  ALL_RUSSIAN_TRACKERS = unique(BEST_TRACKERS.concat(DEFAULT_TRACKERS).concat(RUSSIAN_TRACKERS));
}

async function getBestTrackers(retry = 2) {
  const options = { timeout: 30000, headers: { 'User-Agent': getRandomUserAgent() } };
  return axios.get(TRACKERS_URL, options)
      .then(response => response?.data?.trim()?.split('\n\n') || [])
      .catch(error => {
        if (retry === 0) {
          console.log(`Failed retrieving best trackers: ${error.message}`);
          throw error;
        }
        return getBestTrackers(retry - 1);
      });
}

export function getSources(trackersInput, infoHash) {
  if (!trackersInput) {
    return null;
  }
  const trackers = Array.isArray(trackersInput) ? trackersInput : trackersInput.split(',');
  return trackers.map(tracker => `tracker:${tracker}`).concat(`dht:${infoHash}`);
}

function unique(array) {
  return Array.from(new Set(array));
}