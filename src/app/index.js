import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import Redis from 'ioredis';
import mm from 'musicmetadata';
import logger from './logger';
import config from './config';
import { promisifyCb, promisifyStream } from './util';

  const uploadDir = config.app.uploadDir,
        downloadDir = config.app.downloadDir;

  const air = new Redis(config.air.redis);

  refreshAir().then(() => watchUploadDir());

/**
 * Refreshes radio air.
 *
 * – Adds new tracks
 * - Deletes tracks no longer exists in fs
 *
 * @returns {Promise}
 */
  function refreshAir() {
    logger.log('Refreshing air');

    let airIds = null,
        fsIds = [];

    return Promise.all([
      getTrackIds(),
      readUploadDir()
    ])
      .then(([ids, files]) => {
        airIds = ids;

        return files.reduce((promise, file) => (promise
          .then(() => makeTrack(file))
          .then(track => {
            fsIds.push(track.data.id);

            if (airIds.indexOf(track.data.id) < 0) {
              return addTrack(track);
            }
          })
        ), Promise.resolve());
      })
      .then(() => Promise.all(airIds.filter(id => fsIds.indexOf(id) < 0)
        .map(deleteTrack)))
      .then(() => logger.log('Air successfully refreshed'))
      .catch(err => logger.error(err));
  }

/**
 * Gets files list from upload dir.
 *
 * @returns {Promise}
 * @resolves {String[]} files
 */
  function readUploadDir() {
    logger.debug('Reading upload dir');

    return new Promise((resolve, reject) => {
      promisifyCb(fs.readdir)(uploadDir, 'utf8')
        .then(files => {
          files = files.filter(filename => /\.mp3$/.test(filename));
          resolve(files);
        })
        .catch(reject);
    });
  }

/**
 * Makes a track from the audio file.
 *
 * @param {String} filename
 * @returns {Promise}
 * @resolves {Track} track
 */
  function makeTrack(filename) {
    logger.debug(`Making track from file ${filename}`);

    return new Promise((resolve, reject) => {
      let filePath = path.resolve(uploadDir, filename),
          readStream = fs.createReadStream(filePath);

      promisifyCb(mm)(readStream, { duration: true })
        .then(metadata => {
          let id = crypto.createHash('sha1')
            .update(filename)
            .digest('hex');

          let audioPath = path.resolve(downloadDir, 'audio', `${id}.mp3`);

          let artwork = metadata.picture[0],
              artworkPath = '',
              artworkBuf = null;

          if (artwork) {
            artworkPath = path.resolve(downloadDir, 'artwork', `${id}.${artwork.format}`);
            artworkBuf = artwork.data;
          }

          return {
            audioFilePath: filePath,
            artworkBuf: artworkBuf,
            data: {
              id: id,
              artist: metadata.artist.join(', '),
              title: metadata.title,
              duration: metadata.duration,
              audioFilename: `${id}.mp3`,
              artworkFilename: artwork ? `${id}.${artwork.format}` : '',
              audioPath: audioPath,
              artworkPath: artworkPath
            }
          };
        })
        .then(resolve)
        .catch(reject);
    });
  }

/**
 * Gets air tracks ids.
 *
 * @returns {Promise}
 * @resolves {String[]} ids
 */
  function getTrackIds() {
    logger.debug('Getting tracks ids from storage');

    return new Promise((resolve, reject) => {
      air.keys('track:*')
        .then(keys => {
          let ids = keys.map(key => key.replace(/track:/, ''));
          resolve(ids);
        })
        .catch(reject);
    });
  }

/**
 * Adds track to air.
 *
 * - Copies audo file and artwork file to public dir
 * - Adds entry to storage
 *
 * @param {Track} track
 * @param {stream.Readable} audioReadStream
 * @param {Buffer} artworkBuf
 * @returns {Promise}
 * @resolves {Promise[]}
 */
  function addTrack(track) {
    let data = track.data;

    logger.debug(`Adding track "${data.artist} - ${data.title}" (${data.id})`);

    let audioReadStream = fs.createReadStream(track.audioFilePath),
        audioWriteStream = fs.createWriteStream(data.audioPath),
        artworkWriteStream = null;

    audioReadStream.pipe(audioWriteStream);

    if (track.artworkBuf) {
      artworkWriteStream = fs.createWriteStream(data.artworkPath)
        .end(track.artworkBuf);
    }

    return Promise.all([
      promisifyStream(audioWriteStream),
      new Promise((resolve, reject) => {
        if (artworkWriteStream) {
          promisifyStream(artworkWriteStream)
            .then(resolve, reject);
        }
        else {
          resolve();
        }
      }),
      air.setnx(`track:${data.id}`, JSON.stringify(data)),
      air.hset('weights', data.id, 1)
    ])
      .then(() => {
        logger.log(`Added track "${data.artist} - ${data.title}" (${data.id})`);
      });
  }

/**
 * Deletes track from air.
 *
 * - Deletes audo file and artwork file from public dir
 * - Deletes entry from storage
 *
 * @param {String} id
 * @returns {Promise}
 * @resolves {Promise[]}
 */
  function deleteTrack(id) {
    logger.debug(`Deleting track (${id})`);

    return new Promise((resolve, reject) => {
      air.get(`track:${id}`)
        .then(result => {
          let data = JSON.parse(result);

          return Promise.all([
            promisifyCb(fs.unlink)(data.audioPath),
            promisifyCb(fs.unlink)(data.artworkPath),
            air.del(`track:${id}`),
            air.hdel('weights', id)
          ]);
        })
        .then(() => {
          logger.log(`Deleted track (${id})`);
        })
        .then(resolve, reject);
    });
  }

/**
 * Watches upload dir for changes and updates air.
 */
  function watchUploadDir() {
    logger.log('Watching upload dir for changes');

    let timeout;

    fs.watch(uploadDir, (eventType, filename) => {
      if (eventType !== 'rename' || path.extname(filename) !== '.mp3') return;

      clearTimeout(timeout);
      timeout = setTimeout(() => refreshAir(), 10000);
    });
  }
