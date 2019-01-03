import production from '../../conf/app/production.json';
import development from '../../conf/app/development.json';

const config = process.env.NODE_ENV === 'development' ?
  development :
  production;

export default config;
