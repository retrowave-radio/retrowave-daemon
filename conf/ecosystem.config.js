var isDev = process.env.NODE_ENV === 'development';

module.exports = {
  apps: [{
    name: 'retrowave-fs',
    script: 'bin/app',
    exec_mode: 'fork',
    instances: 1,
    autorestart: false,
    watch: isDev && 'src/'
  }]
};
