const env = process.env.NODE_ENV === 'development' ?
  'development' :
  'production';

const config = require(`../../conf/app/${env}.json`);

export default config;
